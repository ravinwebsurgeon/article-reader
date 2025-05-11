import React, { useState, useCallback, useEffect, useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, ViewStyle } from "react-native";
import { ThemeText } from "@/components/primitives";
import { SvgIcon } from "@/components/SvgIcon";
import { useTheme, type Theme } from "@/theme";
import TagBadge from "./TagBadge";
import Item from "@/database/models/ItemModel";
import Tag from "@/database/models/TagModel";
import { useTagManagement } from "@/utils/hooks";
import TagEditor from "@/features/tag/EditTag";
import { useTranslation } from "react-i18next";

export interface TagSelectorProps {
  item: Item;
  onTagsChanged?: () => void;
  containerStyle?: ViewStyle;
  title?: string;
  maxTags?: number;
  showAddButton?: boolean;
}

/**
 * TagSelector is a component for displaying and managing tags associated with an item
 *
 * Features:
 * - Shows current tags as badges
 * - Ability to remove tags
 * - Opens TagEditor for adding/managing tags
 * - Optional limit on number of tags displayed
 */
const TagSelector: React.FC<TagSelectorProps> = ({
  item,
  onTagsChanged,
  containerStyle,
  title = "Tags",
  maxTags,
  showAddButton = true,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // Tag state
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagEditorVisible, setTagEditorVisible] = useState(false);

  // Use tag management hook
  const { getItemTags } = useTagManagement(item);

  // Load tags for the item
  const loadTags = useCallback(async () => {
    try {
      setLoading(true);
      const itemTags = await getItemTags(item);
      setTags(itemTags as Tag[]);
    } catch (error) {
      console.error("Error loading tags:", error);
    } finally {
      setLoading(false);
    }
  }, [item, getItemTags]);

  // Load tags when component mounts or item changes
  useEffect(() => {
    loadTags();
  }, [loadTags, item.id]);

  // Open tag editor
  const openTagEditor = useCallback(() => {
    setTagEditorVisible(true);
  }, []);

  // Close tag editor and refresh tags
  const closeTagEditor = useCallback(() => {
    setTagEditorVisible(false);
    loadTags();
    onTagsChanged?.();
  }, [loadTags, onTagsChanged]);

  // Remove a tag from the item
  const removeTag = useCallback(
    async (tag: Tag) => {
      try {
        await item.removeTag(tag);
        // Update local state for immediate UI feedback
        setTags((prev) => prev.filter((t) => t.id !== tag.id));
        onTagsChanged?.();
      } catch (error) {
        console.error("Error removing tag:", error);
      }
    },
    [item, onTagsChanged],
  );

  // Render tags or loading state
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.activityIndicator} />
        </View>
      );
    }

    if (tags.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <ThemeText style={styles.emptyText}>{t("tags.noTagsYet")}</ThemeText>
        </View>
      );
    }

    // Limit tags if maxTags is specified
    const displayTags = maxTags && tags.length > maxTags ? tags.slice(0, maxTags) : tags;

    return (
      <View style={styles.tagsContainer}>
        {displayTags.map((tag) => (
          <TagBadge key={tag.id} label={tag.name} onRemove={() => removeTag(tag)} size="medium" />
        ))}

        {/* Show count of hidden tags if maxTags is specified */}
        {maxTags && tags.length > maxTags && (
          <TouchableOpacity style={styles.moreTagsButton} onPress={openTagEditor}>
            <ThemeText style={styles.moreTagsText}>
              {t("tags.moreTags", { count: tags.length - maxTags })}
            </ThemeText>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <>
      <View style={[styles.container, containerStyle]}>
        <View style={styles.headerContainer}>
          <ThemeText style={styles.title}>{title}</ThemeText>

          {showAddButton && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={openTagEditor}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <SvgIcon name="circle-plus" size={24} color={theme.colors.primary.main} />
            </TouchableOpacity>
          )}
        </View>

        {renderContent()}
      </View>

      {/* Tag Editor Modal */}
      <TagEditor visible={tagEditorVisible} onClose={closeTagEditor} item={item} />
    </>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      marginVertical: 8,
    },
    headerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    title: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.text.primary,
    },
    addButton: {
      padding: 4,
    },
    loadingContainer: {
      height: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    tagsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    emptyContainer: {
      height: 40,
      justifyContent: "center",
    },
    emptyText: {
      fontSize: 14,
      fontStyle: "italic",
    },
    moreTagsButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 8,
      marginBottom: 8,
    },
    moreTagsText: {
      fontSize: 14,
      fontWeight: "500",
    },
  });

export default TagSelector;
