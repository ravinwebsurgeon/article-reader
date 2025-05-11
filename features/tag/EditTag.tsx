import React, { useState, useCallback, useEffect } from "react";
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
import { ThemeText } from "@/components/primitives";
import Tag from "@/database/models/TagModel";
import Item from "@/database/models/ItemModel";
import ItemTag from "@/database/models/ItemTagModel";
import { SvgIcon } from "@/components/SvgIcon";
import { TagBadge, TagList } from "@/components/shared/tag";
import database from "@/database/database";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
      const itemTagsCollection = database.collections.get<ItemTag>("item_tags");
      const allItemTags = await itemTagsCollection.query().fetch();

      // Create a map of tag ID to its most recent usage timestamp
      const tagLastUsedMap = new Map<string, number>();

      // Process all ItemTag relationships to find the most recent usage for each tag
      for (const itemTag of allItemTags) {
        const tagId = itemTag.tag.id;
        const usageTime = itemTag.createdAt.getTime();

        if (!tagLastUsedMap.has(tagId) || usageTime > (tagLastUsedMap.get(tagId) ?? 0)) {
          tagLastUsedMap.set(tagId, usageTime);
        }
      }

      // Sort tags by last usage time (most recent first)
      const sortedTags = [...tags].sort((a, b) => {
        const aLastUsed = tagLastUsedMap.get(a.id) ?? a.createdAt.getTime();
        const bLastUsed = tagLastUsedMap.get(b.id) ?? b.createdAt.getTime();
        return bLastUsed - aLastUsed; // Descending order (newest first)
      });

      // Get the 5 most recently used tags
      const recent = sortedTags.slice(0, Math.min(5, sortedTags.length));
      // All other tags
      const others = sortedTags.slice(Math.min(5, sortedTags.length));

      setRecentTags(recent);
      setOtherTags(others);

      // Load item's current tags
      const itemTags = await item.itemTags.fetch();
      const tagIds = await Promise.all(
        itemTags.map(async (itemTag) => {
          // Use the proper relation method to get the tag
          const tag = itemTag.tag;
          return tag.id;
        }),
      );

      setSelectedTagIds(new Set(tagIds));
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
            const itemTagToDelete = (
              await Promise.all(
                itemTagsRelation.map(async (it) => {
                  const tagObj = it.tag;
                  return tagObj.id === tag.id ? it : null;
                }),
              )
            ).find((result) => result !== null);

            if (itemTagToDelete) {
              await itemTagToDelete.destroyPermanently();
            }
          });
        } else {
          newSelectedTagIds.add(tag.id);
          await database.write(async () => {
            const itemTagsCollection = database.collections.get<ItemTag>("item_tags");
            await itemTagsCollection.create((itemTag) => {
              itemTag.item = item;
              itemTag.tag = tag;
            });
          });
        }

        setSelectedTagIds(newSelectedTagIds);
      } catch (error) {
        console.error("Error toggling tag:", error);
        loadData();
      }
    },
    [selectedTagIds, item, loadData],
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
            const itemTagsCollection = database.collections.get<ItemTag>("item_tags");
            await itemTagsCollection.create((itemTag) => {
              itemTag.item = item;
              itemTag.tag = newTag!;
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
    [allTags, toggleTag, selectedTagIds, tagsCollection, item],
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
  const selectedTags = useCallback(
    () => allTags.filter((tag) => selectedTagIds.has(tag.id)),
    [allTags, selectedTagIds],
  );

  // Filter displayed tags based on search state
  const displayedRecentTags = useCallback(
    () => (tagText.trim() ? [] : recentTags),
    [tagText, recentTags],
  );

  const displayedOtherTags = useCallback(
    () => (tagText.trim() ? [] : otherTags),
    [tagText, otherTags],
  );

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
              <ThemeText style={[styles.title, typography.h6]}>{t("tags.editTags")}</ThemeText>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <ThemeText style={[styles.closeText, { color: colors.primary.main }]}>
                  {t("tags.done")}
                </ThemeText>
              </TouchableOpacity>
            </View>

            {/* Search/Input Area */}
            <View style={[styles.searchContainer, { borderColor: colors.primary.light }]}>
              <SvgIcon name="tag" size={24} color={colors.gray[500]} style={styles.searchIcon} />
              <TextInput
                style={[styles.input, typography.body2, { color: colors.text.primary }]}
                placeholder={t("tags.enterTagName")}
                placeholderTextColor={colors.gray[400]}
                value={tagText}
                onChangeText={handleTextChange}
                onSubmitEditing={handleSubmit}
                returnKeyType="done"
                autoCorrect={false}
              />
            </View>

            {/* Selected Tags */}
            {selectedTags().length > 0 && (
              <View style={styles.selectedTagsContainer}>
                <FlatList
                  data={selectedTags()}
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
                  <ThemeText>{t("tags.loadingTags")}</ThemeText>
                </View>
              ) : (
                <>
                  {/* Search Results */}
                  {searchResults.length > 0 ? (
                    <TagList
                      tags={searchResults}
                      selectedTagIds={selectedTagIds}
                      onTagPress={toggleTag}
                      title={t("tags.searchResults")}
                      emptyMessage={t("tags.noMatchingTags")}
                    />
                  ) : (
                    <>
                      {/* Recent Tags */}
                      {displayedRecentTags().length > 0 && (
                        <TagList
                          tags={displayedRecentTags()}
                          selectedTagIds={selectedTagIds}
                          onTagPress={toggleTag}
                          title={t("tags.recentTags")}
                          emptyMessage={t("tags.noRecentTags")}
                        />
                      )}

                      {/* Other Tags */}
                      {displayedOtherTags().length > 0 && (
                        <TagList
                          tags={displayedOtherTags()}
                          selectedTagIds={selectedTagIds}
                          onTagPress={toggleTag}
                          title={t("tags.otherTags")}
                          emptyMessage={t("tags.noOtherTags")}
                          maxHeight={300}
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
    // marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 4,
    // borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontWeight: "600",
    fontSize: 15,
    lineHeight: 20,
    textAlign: "center",
    flex: 1,
    marginRight: -40,
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontWeight: "600",
    fontSize: 15,
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderRadius: 16,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  topBarIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
    marginVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    padding: 0,
    height: 30,
  },
  selectedTagsContainer: {
    paddingHorizontal: 16,
    // flexWrap: 'wrap',
    paddingBottom: 8,
  },
  selectedTagsList: {
    paddingVertical: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardAccessory: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E0E0E0",
    paddingBottom: Platform.OS === "ios" ? 24 : 8,
  },
  keyboardAccessoryContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  addButton: {
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    fontWeight: "600",
  },
});

export default TagEditor;
