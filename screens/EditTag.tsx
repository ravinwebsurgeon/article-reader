import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useTheme, useColors, useTypography } from "@/theme/hooks";
import { scaler } from "@/utils";
import { ThemeText, ThemeView } from "@/components/core";
import Tag from "@/database/models/TagModel";
import Item from "@/database/models/ItemModel";
import { SvgIcon } from "@/components/SvgIcon";
import { useTagManagement } from "@/utils/hooks";
import { TagBadge, TagList } from "@/components/common/tag";
import database from "@/database/database";

/**
 * TagEditor component allows users to manage tags for an article
 * Features:
 * - Search existing tags
 * - Add new tags
 * - Select/deselect tags for the current article
 * - View tags in categorized sections (Recent, Other)
 */

// Define component props
export interface TagEditorProps {
  visible: boolean;
  onClose: () => void;
  item: Item;
}

const TagEditor: React.FC<TagEditorProps> = ({ visible, onClose, item }) => {
  const theme = useTheme();
  const colors = useColors();
  const typography = useTypography();

  // Input state
  const [tagText, setTagText] = useState("");
  const [searchResults, setSearchResults] = useState<Tag[]>([]);

  // State for all tags and selected tags
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [recentTags, setRecentTags] = useState<Tag[]>([]);
  const [otherTags, setOtherTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // const {
  //   allTags,
  //   recentTags,
  //   otherTags,
  //   selectedTagIds,
  //   isLoading,
  //   loadData,
  //   toggleTag,
  //   createTag,
  //   searchTags
  // } = useTagManagement(item);

  console.log(
    "allTags Tags: in edit tags",
    allTags,
    recentTags,
    otherTags,
    selectedTagIds,
    isLoading,
  );

  // Reference to the tags collection
  const tagsCollection = database.collections.get<Tag>("tags");

  // Load all tags and the item's current tags
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Load all tags
      const tags = await tagsCollection.query().fetch();
      setAllTags(tags);

      // Get all ItemTag relationships to determine tag usage
      const itemTagsCollection = database.collections.get("item_tags");
      const allItemTags = await itemTagsCollection.query().fetch();

      // Create a map of tag ID to its most recent usage timestamp
      const tagLastUsedMap = new Map();

      // Process all ItemTag relationships to find the most recent usage for each tag
      allItemTags.forEach((itemTag) => {
        const tagId = itemTag.tag.id;
        const usageTime = itemTag.createdAt.getTime();

        if (!tagLastUsedMap.has(tagId) || usageTime > tagLastUsedMap.get(tagId)) {
          tagLastUsedMap.set(tagId, usageTime);
        }
      });

      // Sort tags by last usage time (most recent first)
      const sortedTags = [...tags].sort((a, b) => {
        const aLastUsed = tagLastUsedMap.get(a.id) || a.createdAt.getTime();
        const bLastUsed = tagLastUsedMap.get(b.id) || b.createdAt.getTime();
        return bLastUsed - aLastUsed; // Descending order (newest first)
      });

      // Get the 5 most recently used tags
      const recent = sortedTags.slice(0, Math.min(5, sortedTags.length));
      // All other tags
      const others = sortedTags.slice(Math.min(5, sortedTags.length));

      // const recent = tags.slice(0, Math.min(5, tags.length));
      // const others = tags.slice(Math.min(5, tags.length));
      setRecentTags(recent);
      setOtherTags(others);

      // Load item's current tags
      const itemTags = await item.itemTags.fetch();
      const tagIds = new Set(
        itemTags.map(async (itemTag) => {
          const tag = await itemTag.tag.fetch();
          return tag.id;
        }),
      );

      // Wait for all promises to resolve
      const resolvedTagIds = await Promise.all(Array.from(tagIds));
      setSelectedTagIds(new Set(resolvedTagIds));
    } catch (error) {
      console.error("Error loading tags:", error);
    } finally {
      setIsLoading(false);
    }
  }, [item, tagsCollection]);
  // Load data when component mounts and is visible
  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible, loadData]);

  // Filter tags based on search input
  useEffect(() => {
    if (tagText.trim()) {
      const filtered = allTags.filter((tag) =>
        tag.name.toLowerCase().includes(tagText.toLowerCase()),
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [tagText, allTags]);

  const toggleTag = useCallback(
    async (tag: Tag) => {
      try {
        // Update local UI state immediately for responsiveness
        const newSelectedTagIds = new Set(selectedTagIds);

        if (newSelectedTagIds.has(tag.id)) {
          newSelectedTagIds.delete(tag.id);
          await database.write(async () => {
            const itemTagsRelation = await item.itemTags.fetch();
            const itemTagToDelete = itemTagsRelation.find(async (it) => {
              const tagObj = await it.tag.fetch();
              return tagObj.id === tag.id;
            });

            if (itemTagToDelete) {
              await itemTagToDelete.destroyPermanently();
            }
          });
        } else {
          newSelectedTagIds.add(tag.id);
          await database.write(async () => {
            const itemTagsCollection = database.collections.get("item_tags");
            await itemTagsCollection.create((itemTag) => {
              itemTag.item.set(item);
              itemTag.tag.set(tag);
            });
          });
        }

        setSelectedTagIds(newSelectedTagIds);
      } catch (error) {
        console.error("Error toggling tag:", error);
        // Reload data in case of error to ensure UI reflects actual database state
        loadData();
      }
    },
    [selectedTagIds, item, loadData, database],
  );

  // Create a new tag
  const createTag = useCallback(
    async (name: string) => {
      if (!name.trim()) return null;

      try {
        // Check if tag already exists (case insensitive)
        const existingTag = allTags.find(
          (tag) => tag.name.toLowerCase() === name.trim().toLowerCase(),
        );

        if (existingTag) {
          // If tag exists, select it and clear input
          if (!selectedTagIds.has(existingTag.id)) {
            await toggleTag(existingTag);
          }
          return existingTag;
        } else {
          // Create new tag
          let newTag: Tag | null = null;

          await database.write(async () => {
            // Create the tag
            newTag = await tagsCollection.create((tag) => {
              tag.name = name.trim();
            });

            // Create the relationship
            const itemTagsCollection = database.collections.get("item_tags");
            await itemTagsCollection.create((itemTag) => {
              itemTag.item.set(item);
              itemTag.tag.set(newTag!);
            });
          });

          // Update UI state
          if (newTag) {
            setAllTags((prev) => [...prev, newTag!]);
            setRecentTags((prev) => [newTag!, ...prev].slice(0, 5));
            setSelectedTagIds((prev) => new Set([...prev, newTag!.id]));
          }

          return newTag;
        }
      } catch (error) {
        console.error("Error creating tag:", error);
        return null;
      }
    },
    [allTags, toggleTag, selectedTagIds, tagsCollection, item, database],
  );

  // Handle text input changes
  const handleTextChange = useCallback(
    (text: string) => {
      // Check if the text includes a comma
      if (text.includes(",")) {
        // Split by comma and process each part
        const parts = text.split(",");

        // Process all parts except the last one (which might be incomplete)
        const tagsToCreate = parts
          .slice(0, -1)
          .map((part) => part.trim())
          .filter(Boolean);

        // Create each tag
        tagsToCreate.forEach((tagName) => {
          createTag(tagName);
        });

        // Keep only the last part in the input
        setTagText(parts[parts.length - 1].trim());
      } else {
        setTagText(text);
      }
    },
    [createTag],
  );

  // Handle keyboard submit
  const handleSubmit = useCallback(() => {
    if (tagText.trim()) {
      createTag(tagText.trim());
      setTagText("");
    }
  }, [tagText, createTag]);

  // Get selected tags
  const selectedTags = useMemo(
    () => allTags.filter((tag) => selectedTagIds.has(tag.id)),
    [allTags, selectedTagIds],
  );

  // Filter displayed tags based on search state
  const displayedRecentTags = useMemo(
    () => (tagText.trim() ? [] : recentTags),
    [tagText, recentTags],
  );

  const displayedOtherTags = useMemo(() => (tagText.trim() ? [] : otherTags), [tagText, otherTags]);
  // </new>
  //old

  // Update search results when input changes
  // useEffect(() => {
  //   if (tagText.trim()) {
  //     setSearchResults(searchTags(tagText));
  //   } else {
  //     setSearchResults([]);
  //   }
  // }, [tagText, searchTags]);

  // // Handle tag creation
  // const handleCreateTag = useCallback(async () => {
  //   if (!tagText.trim()) return;

  //   await createTag(tagText, true);
  //   setTagText(''); // Clear input field
  // }, [tagText, createTag]);

  // // Simple handlers
  // const handleTextChange = useCallback((text: string) => {
  //   setTagText(text);/////
  // }, []);

  // const handleSubmit = useCallback(() => {
  //   handleCreateTag();
  // }, [handleCreateTag]);

  // // Filter displayed tags based on search state
  // const displayedRecentTags = useMemo(() =>
  //   tagText.trim() ? [] : recentTags,
  // [tagText, recentTags]);

  // const displayedOtherTags = useMemo(() =>
  //   tagText.trim() ? [] : otherTags,
  // [tagText, otherTags]);

  // // Button state for add button
  // const isAddButtonEnabled = useMemo(() =>
  //   tagText.trim().length > 0,
  // [tagText]);

  // // Get selected tags
  // const selectedTags = useMemo(() =>
  //   allTags.filter(tag => selectedTagIds.has(tag.id)),
  // [allTags, selectedTagIds]);

  // console.log('Selected Tags: in edit tags', selectedTags);
  // console.log('display other tags: in edit tags', displayedOtherTags);

  return (
    <Modal transparent={true} visible={visible} animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalContainer}
        >
          <View style={[styles.container, { backgroundColor: colors.background.paper }]}>
            {/* Header */}
            <View style={styles.topBar}>
              <View style={styles.topBarIndicator} />
            </View>
            <View style={styles.header}>
              <ThemeText style={[styles.title, typography.h6]}>Edit Tags</ThemeText>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <ThemeText style={[styles.closeText, { color: colors.primary.main }]}>
                  Done
                </ThemeText>
              </TouchableOpacity>
            </View>

            {/* Search/Input Area */}
            <View style={[styles.searchContainer, { borderColor: colors.primary.light }]}>
              <SvgIcon name="tag" size={24} color={colors.gray[500]} style={styles.searchIcon} />
              <TextInput
                style={[styles.input, typography.body2, { color: colors.text.primary }]}
                placeholder="Enter a Tag Name"
                placeholderTextColor={colors.gray[400]}
                value={tagText}
                onChangeText={handleTextChange}
                onSubmitEditing={handleSubmit}
                returnKeyType="done"
                autoCorrect={false}
              />
            </View>

            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <View style={styles.selectedTagsContainer}>
                <FlatList
                  data={selectedTags}
                  renderItem={({ item }) => (
                    <TagBadge
                      key={item.id}
                      color={theme.colors.white}
                      label={item.name}
                      onRemove={() => toggleTag(item)}
                    />
                  )}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.selectedTagsList}
                />
              </View>
            )}

            {/* Content */}
            <View style={styles.content}>
              {/* Show loading indicator when loading */}
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ThemeText>Loading tags...</ThemeText>
                </View>
              ) : (
                <>
                  {/* Search Results */}
                  {searchResults.length > 0 ? (
                    <TagList
                      tags={searchResults}
                      selectedTagIds={selectedTagIds}
                      onTagPress={toggleTag}
                      title="Search Results"
                      emptyMessage="No matching tags found"
                    />
                  ) : (
                    <>
                      {/* Recent Tags */}
                      {displayedRecentTags.length > 0 && (
                        <TagList
                          tags={displayedRecentTags}
                          selectedTagIds={selectedTagIds}
                          onTagPress={toggleTag}
                          title="Recent Tags"
                          emptyMessage="No recent tags found"
                        />
                      )}

                      {/* Other Tags */}
                      {displayedOtherTags.length > 0 && (
                        <TagList
                          tags={displayedOtherTags}
                          selectedTagIds={selectedTagIds}
                          onTagPress={toggleTag}
                          title="Other Tags"
                          emptyMessage="No other tags found"
                          maxHeight={scaler(300)}
                        />
                      )}
                    </>
                  )}
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    // backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
    // marginTop: scaler(50),
    borderTopLeftRadius: scaler(20),
    borderTopRightRadius: scaler(20),
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scaler(16),
    paddingTop: scaler(4),
    // borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontWeight: "600",
    fontSize: scaler(15),
    lineHeight: scaler(20),
    textAlign: "center",
    flex: 1,
    marginRight: scaler(-40),
  },
  closeButton: {
    padding: scaler(4),
  },
  closeText: {
    fontWeight: "600",
    fontSize: scaler(15),
    lineHeight: scaler(20),
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: scaler(16),
    paddingHorizontal: scaler(12),
    paddingVertical: scaler(8),
    borderWidth: scaler(2),
    borderRadius: scaler(16),
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  topBarIndicator: {
    width: scaler(40),
    height: scaler(4),
    borderRadius: scaler(2),
    backgroundColor: "#E0E0E0",
    marginVertical: scaler(8),
  },
  searchIcon: {
    marginRight: scaler(8),
  },
  input: {
    flex: 1,
    padding: 0,
    height: scaler(30),
  },
  selectedTagsContainer: {
    paddingHorizontal: scaler(16),
    // flexWrap: 'wrap',
    paddingBottom: scaler(8),
  },
  selectedTagsList: {
    paddingVertical: scaler(4),
  },
  content: {
    flex: 1,
    paddingHorizontal: scaler(16),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardAccessory: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E0E0E0",
    paddingBottom: Platform.OS === "ios" ? scaler(24) : scaler(8),
  },
  keyboardAccessoryContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scaler(8),
    paddingHorizontal: scaler(16),
  },
  addButton: {
    paddingHorizontal: scaler(32),
    paddingVertical: scaler(10),
    borderRadius: scaler(8),
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    fontWeight: "600",
  },
});

export default TagEditor;
