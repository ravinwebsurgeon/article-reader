import React, { useCallback } from "react";
import Item from "@/database/models/ItemModel";
import ReusableActionMenu, { ActionMenuItem, ActionMenuPosition } from "./ReusableActionMenu";
import { Linking, Share } from "react-native";
import { useTheme } from "@/theme";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";

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
  const { t } = useTranslation();
  const router = useRouter();

  // Open tag editor
  const handleEditTags = useCallback(() => {
    onClose();
    router.push({
      pathname: "/edit-tags",
      params: { itemId: item.id },
    });
  }, [onClose, router, item]);

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
        onPress: async () => {
          // Implement share functionality
          try {
            // Close action menu first
            onClose();

            // Prepare share content
            const title = item.title ?? "Article";
            const url = item.url;

            await Share.share({
              message: url as string,
              title: title,
              url: url,
            });
          } catch (error) {
            console.error("Error sharing article:", error);
          }
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
        icon: "tag-outline",
        onPress: handleEditTags,
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
  }, [item, handleEditTags, handleOpenInBrowser, theme.colors.favorite, t]);

  return (
    <ReusableActionMenu
      visible={visible}
      items={getMenuItems()}
      onClose={onClose}
      position={position}
      width={240}
    />
  );
};

export default ReaderActionMenu;
