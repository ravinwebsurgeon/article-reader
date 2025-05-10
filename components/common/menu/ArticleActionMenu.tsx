import React, { useCallback, useState } from "react";
import Item from "@/database/models/ItemModel";
import ReusableActionMenu, { ActionMenuItem, ActionMenuPosition } from "./ReusableActionMenu";
import { useTheme } from "@/theme";
import { Alert, Share } from "react-native";
import TagEditor from "@/screens/EditTag";

interface ArticleActionMenuProps {
  item: Item;
  position?: ActionMenuPosition;
  visible?: boolean;
  animationDuration?: number;
  onClose: () => void;
}

/**
 * Article-specific implementation of the ActionMenu
 * This component uses the ReusableActionMenu with pre-configured options for article actions
 */
const ArticleActionMenu: React.FC<ArticleActionMenuProps> = ({
  item,
  position = {},
  visible = false,
  animationDuration,
  onClose,
}) => {
  const theme = useTheme();

  // State for tag editor
  const [tagEditorVisible, setTagEditorVisible] = useState(false);

  // Open tag editor
  const openTagEditor = useCallback(() => {
    // Close action menu first
    onClose();
    // Then open tag editor
    setTimeout(() => {
      setTagEditorVisible(true);
    }, 300); // Small delay for better UX
  }, [onClose]);

  // Close tag editor
  const closeTagEditor = useCallback(() => {
    setTagEditorVisible(false);
  }, []);

  // Share article
  const shareArticle = useCallback(async () => {
    try {
      // Close action menu first
      onClose();

      // Prepare share content
      const title = item.title || "Article";
      const url = item.url;

      await Share.share({
        message: url,
        title: title,
        url: url,
      });
    } catch (error) {
      console.error("Error sharing article:", error);
    }
  }, [item, onClose]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async () => {
    try {
      await item.toggleFavorite();
      onClose();
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  }, [item, onClose]);

  // Toggle archived status
  const toggleArchived = useCallback(async () => {
    try {
      await item.toggleArchived();
      onClose();
    } catch (error) {
      console.error("Error toggling archive:", error);
    }
  }, [item, onClose]);

  // Delete article with confirmation
  const confirmDelete = useCallback(() => {
    // Close action menu first
    onClose();

    // Show confirmation alert
    Alert.alert(
      "Delete Article",
      "Are you sure you want to delete this article? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await item.markAsDeleted();
            } catch (error) {
              console.error("Error deleting item:", error);
            }
          },
        },
      ],
      { cancelable: true },
    );
  }, [item, onClose]);

  // Generate menu items based on the item state
  const getMenuItems = useCallback((): ActionMenuItem[] => {
    return [
      {
        id: "share",
        label: "Share",
        icon: "share",
        onPress: shareArticle,
        dividerAfter: true,
      },
      {
        id: "favorite",
        label: item.favorite ? "Unfavorite" : "Favorite",
        icon: item.favorite ? "favorite" : "favorite",
        iconColor: item.favorite ? theme.colors.favorite : undefined,
        onPress: toggleFavorite,
        dividerAfter: true,
      },
      {
        id: "tag",
        label: "Tag",
        icon: "tag",
        onPress: openTagEditor,
        dividerAfter: true,
      },
      {
        id: "archive",
        label: item.archived ? "Unarchive" : "Archive",
        icon: "archive",
        onPress: toggleArchived,
        dividerAfter: true,
      },
      {
        id: "delete",
        label: "Delete",
        icon: "trash",
        destructive: true,
        onPress: confirmDelete,
      },
    ];
  }, [
    item,
    theme.colors.favorite,
    shareArticle,
    toggleFavorite,
    openTagEditor,
    toggleArchived,
    confirmDelete,
  ]);

  return (
    <>
      <ReusableActionMenu
        visible={visible}
        items={getMenuItems()}
        onClose={onClose}
        position={position}
        width={240}
        animationPreset="bouncy"
      />
      {tagEditorVisible && (
        <TagEditor visible={tagEditorVisible} onClose={closeTagEditor} item={item} />
      )}
      {/* <EditTagsModal visible={tagEditorVisible} onClose={closeTagEditor} item={item} /> */}
    </>
  );
};

export default ArticleActionMenu;
