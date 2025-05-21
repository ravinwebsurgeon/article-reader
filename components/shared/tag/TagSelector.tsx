import React, { useCallback, useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { ThemeText } from "@/components/primitives";
import { SvgIcon } from "@/components/SvgIcon";
import { useTheme, type Theme } from "@/theme";
import TagBadge from "./TagBadge";
import Item from "@/database/models/ItemModel";
import Tag from "@/database/models/TagModel";
import { withItemTags, removeTagFromItem } from "@/database/hooks/withTags";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";

export interface TagSelectorProps {
  item: Item;
  containerStyle?: ViewStyle;
  title?: string;
  maxTags?: number;
  showAddButton?: boolean;
  itemTags: Tag[];
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
const TagSelectorInner: React.FC<TagSelectorProps> = ({
  item,
  containerStyle,
  title = "Tags",
  maxTags,
  showAddButton = true,
  itemTags,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();

  // Open tag editor
  const openTagEditor = useCallback(() => {
    router.push({
      pathname: "/edit-tags",
      params: { itemId: item.id },
    });
  }, [router, item]);

  // Remove a tag from the item
  const handleRemoveTag = useCallback(
    async (tagToRemove: Tag) => {
      try {
        await removeTagFromItem(item, tagToRemove);
      } catch (error) {
        console.error("Error removing tag:", error);
      }
    },
    [item],
  );

  // Render tags or loading state
  const renderContent = () => {
    if (!itemTags || itemTags.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <ThemeText style={styles.emptyText}>{t("tags.noTagsYet")}</ThemeText>
        </View>
      );
    }

    // Limit tags if maxTags is specified
    const displayTags =
      maxTags && itemTags.length > maxTags ? itemTags.slice(0, maxTags) : itemTags;

    return (
      <View style={styles.tagsContainer}>
        {displayTags.map((tag) => (
          <TagBadge
            key={tag.id}
            label={tag.name as string}
            onRemove={() => handleRemoveTag(tag)}
            size="medium"
          />
        ))}

        {/* Show count of hidden tags if maxTags is specified */}
        {maxTags && itemTags.length > maxTags && (
          <TouchableOpacity style={styles.moreTagsButton} onPress={openTagEditor}>
            <ThemeText style={styles.moreTagsText}>
              {t("tags.moreTags", { count: itemTags.length - maxTags })}
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

      {/* Tag Editor Modal - No longer rendered here */}
      {/* <TagEditor visible={tagEditorVisible} onClose={closeTagEditor} item={item} /> */}
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

// Enhance TagSelectorInner with withItemTags HOC
const TagSelector = withItemTags()(TagSelectorInner);

export default TagSelector;
