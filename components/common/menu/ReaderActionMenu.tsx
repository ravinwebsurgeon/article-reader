import React, { useCallback, useState } from "react";
import Item from "@/database/models/ItemModel";
import ReusableActionMenu, { ActionMenuItem, ActionMenuPosition } from "./ReusableActionMenu";
import { Linking } from "react-native";
import TagEditor from "@/screens/EditTag";
import { useTheme } from "@/theme";
import { useTranslation } from "react-i18next";

interface ReaderActionMenuProps {
  item: Item;
  position?: ActionMenuPosition;
  visible?: boolean;
  onClose: () => void;
}

/**
 * Reader-specific implementation of the ActionMenu
 * This component uses the ReusableActionMenu with pre-configured options for reader actions
 */
const ReaderActionMenu: React.FC<ReaderActionMenuProps> = ({
  item,
  position = {},
  visible = false,
  onClose,
}) => {
  const theme = useTheme();
  const [tagEditorVisible, setTagEditorVisible] = useState(false);
  const { t } = useTranslation();

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

  // Handle open in browser
  const handleOpenInBrowser = useCallback(async () => {
    if (item.url) {
      try {
        const canOpen = await Linking.canOpenURL(item.url);
        if (canOpen) {
          await Linking.openURL(item.url);
        } else {
          console.error("Cannot open URL:", item.url);
        }
      } catch (error) {
        console.error("Error opening URL:", error);
      }
    }
    onClose();
  }, [item.url, onClose]);

  // Generate menu items based on the item state
  const getMenuItems = useCallback((): ActionMenuItem[] => {
    return [
      {
        id: "share",
        label: t("menu.share"),
        icon: "share",
        onPress: () => {
          // Implement share functionality
          console.log("Share item:", item.id);
        },
        dividerAfter: true,
      },
      {
        id: "favorite",
        label: item.favorite ? t("menu.unfavorite") : t("menu.favorite"),
        icon: item.favorite ? "favorite" : "favorite",
        iconColor: item.favorite ? theme.colors.favorite : undefined,
        onPress: async () => {
          try {
            await item.toggleFavorite();
          } catch (error) {
            console.error("Error toggling favorite:", error);
          }
        },
        dividerAfter: true,
      },
      {
        id: "edit-tags",
        label: t("menu.editTags"),
        icon: "tag",
        onPress: openTagEditor,
        dividerAfter: true,
      },
      {
        id: "open-browser",
        label: t("menu.openInBrowser"),
        icon: "compass",
        onPress: handleOpenInBrowser,
        dividerAfter: true,
      },
      {
        id: "archive",
        label: item.archived ? t("menu.unarchive") : t("menu.archive"),
        icon: "archive",
        onPress: async () => {
          try {
            await item.toggleArchived();
          } catch (error) {
            console.error("Error toggling archive:", error);
          }
        },
        dividerAfter: true,
      },
      {
        id: "delete",
        label: t("menu.delete"),
        icon: "trash",
        destructive: true,
        onPress: async () => {
          try {
            await item.markAsDeleted();
          } catch (error) {
            console.error("Error deleting item:", error);
          }
        },
      },
    ];
  }, [item, openTagEditor, handleOpenInBrowser, theme.colors.favorite, t]);

  return (
    <>
      <ReusableActionMenu
        visible={visible}
        items={getMenuItems()}
        onClose={onClose}
        position={position}
        width={240}
      />
      {tagEditorVisible && (
        <TagEditor visible={tagEditorVisible} onClose={closeTagEditor} item={item} />
      )}
    </>
  );
};

export default ReaderActionMenu;
