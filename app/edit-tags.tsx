import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, useColors, useTypography } from "@/theme/hooks";
import { ThemeText } from "@/components/primitives";
import Tag from "@/database/models/TagModel";
import Item from "@/database/models/ItemModel";
import ItemTag from "@/database/models/ItemTagModel";
import { SvgIcon } from "@/components/SvgIcon";
import { TagBadge, TagList } from "@/components/shared/tag";

import { useTranslation } from "react-i18next";
import { withObservables } from "@nozbe/watermelondb/react";
import { Q } from "@nozbe/watermelondb";
import { switchMap } from "rxjs/operators";
import { combineLatest, of as of$, Observable } from "rxjs";
import {
  createTag as createTagInDB,
  addTagToItem,
  removeTagFromItem,
} from "@/database/hooks/withTags";
import {
  useLocalSearchParams,
  useRouter, // For route params and navigation
} from "expo-router";
import { useDatabase } from "@/database/provider/DatabaseProvider"; // To get database instance
import database from "@/database";

// Props for the core editing component (previously EditTagInner)
interface EditTagsViewProps {
  item: Item;
  allTagsFromDB: Tag[];
  selectedTagsFromDB: Tag[];
  onCloseScreen: () => void; // Renamed from onClose for clarity
}

const EditTagsView: React.FC<EditTagsViewProps> = ({
  item,
  allTagsFromDB,
  selectedTagsFromDB,
  onCloseScreen,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = useColors();
  const typography = useTypography();

  const [tagText, setTagText] = useState("");
  const [searchResults, setSearchResults] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [recentTags, setRecentTags] = useState<Tag[]>([]);
  const [otherTags, setOtherTags] = useState<Tag[]>([]);

  useEffect(() => {
    setAllTags(allTagsFromDB);
    const sortedByUpdate = [...allTagsFromDB].sort(
      (a, b) => (b.updatedAt?.getTime?.() ?? 0) - (a.updatedAt?.getTime?.() ?? 0),
    );
    const recent = sortedByUpdate.slice(0, Math.min(5, sortedByUpdate.length));
    const others = sortedByUpdate.slice(Math.min(5, sortedByUpdate.length));
    setRecentTags(recent);
    setOtherTags(others);
  }, [allTagsFromDB]);

  useEffect(() => {
    setSelectedTagIds(new Set(selectedTagsFromDB.map((tag) => tag.id)));
  }, [selectedTagsFromDB]);

  useEffect(() => {
    if (tagText.trim()) {
      const filtered = allTags.filter(
        (tag) =>
          typeof tag.name === "string" && tag.name.toLowerCase().includes(tagText.toLowerCase()),
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [tagText, allTags]);

  const toggleTag = useCallback(
    async (tag: Tag) => {
      try {
        if (selectedTagIds.has(tag.id)) {
          await removeTagFromItem(item, tag);
        } else {
          await addTagToItem(item, tag);
        }
      } catch (error) {
        console.error("Error toggling tag:", error);
      }
    },
    [selectedTagIds, item],
  );

  const handleCreateTag = useCallback(
    // Renamed from createTag to avoid confusion
    async (name: string) => {
      if (!name.trim()) return null;
      try {
        const existingTag = allTags.find(
          (tag) =>
            typeof tag.name === "string" && tag.name.toLowerCase() === name.trim().toLowerCase(),
        );
        if (existingTag) {
          if (!selectedTagIds.has(existingTag.id)) {
            await addTagToItem(item, existingTag);
          }
          return existingTag;
        } else {
          const newTag = await createTagInDB(name.trim());
          if (newTag) {
            await addTagToItem(item, newTag);
          }
          return newTag;
        }
      } catch (error) {
        console.error("Error creating tag:", error);
        return null;
      }
    },
    [allTags, selectedTagIds, item],
  );

  const handleTextChange = useCallback(
    async (text: string) => {
      if (text.includes(",")) {
        const parts = text.split(",");
        const tagsToCreate = parts
          .slice(0, -1)
          .map((part) => part.trim())
          .filter(Boolean);
        // Process tags sequentially to avoid race conditions
        for (const tagName of tagsToCreate) {
          await handleCreateTag(tagName);
        }
        setTagText(parts[parts.length - 1].trim());
      } else {
        setTagText(text);
      }
    },
    [handleCreateTag],
  );

  const handleSubmit = useCallback(() => {
    if (tagText.trim()) {
      handleCreateTag(tagText.trim());
      setTagText("");
    }
  }, [tagText, handleCreateTag]);

  const getSelectedTags = useCallback(
    () => allTags.filter((tag) => selectedTagIds.has(tag.id)),
    [allTags, selectedTagIds],
  );

  const displayedRecentTags = useCallback(
    () => (tagText.trim() ? [] : recentTags),
    [tagText, recentTags],
  );

  const displayedOtherTags = useCallback(
    () => (tagText.trim() ? [] : otherTags),
    [tagText, otherTags],
  );

  // Note: The Modal wrapper is removed. Expo Router handles screen presentation.
  // The screen should be styled to look like a modal if desired (e.g. stackPresentation: 'modal' in layout)
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalContainer} // This will be the screen's root container
      >
        <View style={[styles.container, { backgroundColor: colors.background.paper }]}>
          <View style={styles.topBar}>
            <View style={styles.topBarIndicator} />
          </View>
          <View style={styles.header}>
            <ThemeText style={[styles.title, typography.h6]}>{t("tags.editTags")}</ThemeText>
            <TouchableOpacity onPress={onCloseScreen} style={styles.closeButton}>
              <ThemeText style={[styles.closeText, { color: colors.primary.main }]}>
                {t("tags.done")}
              </ThemeText>
            </TouchableOpacity>
          </View>

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

          {getSelectedTags().length > 0 && (
            <View style={styles.selectedTagsContainer}>
              <FlatList
                data={getSelectedTags()}
                renderItem={({ item: tagItem }) => (
                  <TagBadge
                    key={tagItem.id}
                    color={theme.colors.white}
                    label={tagItem?.name as string}
                    onRemove={() => toggleTag(tagItem)}
                  />
                )}
                keyExtractor={(tagItem) => tagItem.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.selectedTagsList}
              />
            </View>
          )}

          <View style={styles.content}>
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
                {displayedRecentTags().length > 0 && (
                  <TagList
                    tags={displayedRecentTags()}
                    selectedTagIds={selectedTagIds}
                    onTagPress={toggleTag}
                    title={t("tags.recentTags")}
                    emptyMessage={t("tags.noRecentTags")}
                  />
                )}
                {displayedOtherTags().length > 0 && (
                  <TagList
                    tags={displayedOtherTags()}
                    selectedTagIds={selectedTagIds}
                    onTagPress={toggleTag}
                    title={t("tags.otherTags")}
                    emptyMessage={t("tags.noOtherTags")}
                    maxHeight={300} // Consider adjusting maxHeight based on screen context
                  />
                )}
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

// HOC to provide item, allTagsFromDB, and selectedTagsFromDB to EditTagsView
const enhanceEditTagsView = withObservables<
  { item: Item }, // Props that this HOC will be called with (e.g., from ItemDataLoader)
  {
    // Shape of the object returned by the callback, with Observables
    item: Item; // item is passed through directly from input props
    allTagsFromDB: Observable<Tag[]>;
    selectedTagsFromDB: Observable<Tag[]>;
  }
>(["item"], ({ item }) => {
  // item here is Item, from the HOC's input props
  const allTagsObservable = database.collections
    .get<Tag>("tags")
    .query(Q.sortBy("updated_at", Q.desc)) // Using 'updated_at' as a proxy for recency
    .observe();

  const selectedTagsObservable =
    item?.itemTags?.observe()?.pipe(
      switchMap((itemTags: ItemTag[] = []) => {
        if (!itemTags || itemTags.length === 0) {
          return of$([] as Tag[]);
        }
        const tagObservables = itemTags
          .map((itemTag) => itemTag.tag)
          .filter((tag): tag is NonNullable<typeof tag> => !!tag)
          .map((tag) => tag!.observe());
        return tagObservables.length > 0 ? combineLatest(tagObservables) : of$([] as Tag[]);
      }),
    ) ?? of$([] as Tag[]);

  return {
    item: item, // Pass item through
    allTagsFromDB: allTagsObservable,
    selectedTagsFromDB: selectedTagsObservable,
  };
});

// Default export: The screen component
export default function EditTagsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ itemId?: string }>();
  const { database: dbInstance } = useDatabase(); // Renamed to avoid conflict with 'database' import

  const itemId = params.itemId;

  if (!itemId) {
    // Optionally, render a loading state or an error message
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ThemeText>Loading item data...</ThemeText>
        </View>
      </SafeAreaView>
    );
  }

  // Component that will receive the actual item model from the HOC
  const ItemDataLoader: React.FC<{ itemId: string; onCloseScreen: () => void }> = ({
    itemId: currentItemId,
    onCloseScreen,
  }) => {
    const EnhancedView = React.useMemo(
      () =>
        withObservables<
          { itemId: string }, // Outer/Input props for this HOC
          { item: Observable<Item> } // Shape of object returned by callback, with Observable(s)
        >(["itemId"], (props: { itemId: string }) => ({
          item: dbInstance.collections.get<Item>("items").findAndObserve(props.itemId), // This is Observable<Item>
        }))(({ item }: { item: Item /* This is the resolved Item model */ }) => {
          const FinalEnhancedView = enhanceEditTagsView(EditTagsView);
          return <FinalEnhancedView item={item} onCloseScreen={onCloseScreen} />;
        }),
      [onCloseScreen],
    ); // Re-memoize if onCloseScreen changes, though it shouldn't often

    return <EnhancedView itemId={currentItemId} />;
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ItemDataLoader itemId={itemId} onCloseScreen={() => router.back()} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 4,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontWeight: "600",
    fontSize: 15,
    lineHeight: 20,
    textAlign: "center",
    flex: 1,
    marginRight: -40, // To truly center title when "Done" is present
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
    // Can be used if itemId is not available initially
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
