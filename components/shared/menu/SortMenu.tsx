import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useTheme, Theme } from "@/theme";
import { ThemeText } from "@/components/primitives";
import { useTranslation } from "react-i18next";
import ReusableActionMenu, { ActionMenuItem, ActionMenuPosition } from "./ReusableActionMenu";

export type SortOption = "newest" | "oldest" | "shortest" | "longest" | "alphabetical";

interface SortMenuProps {
  visible: boolean;
  position: ActionMenuPosition;
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  onClose: () => void;
}

/**
 * Sort menu for the HomeScreen filter tabs
 * Uses the ReusableActionMenu with sort-specific options
 */
const SortMenu: React.FC<SortMenuProps> = ({
  visible,
  position,
  currentSort,
  onSortChange,
  onClose,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  // Generate menu items based on current sort
  const getSortItems = (): ActionMenuItem[] => {
    return [
      {
        id: "newest",
        label: t("sort.newest"),
        icon: "sort-ascending",
        selected: currentSort === "newest",
        onPress: () => onSortChange("newest"),
        dividerAfter: true,
      },
      {
        id: "oldest",
        label: t("sort.oldest"),
        icon: "sort-descending",
        selected: currentSort === "oldest",
        onPress: () => onSortChange("oldest"),
      },
    ];
  };

  return (
    <ReusableActionMenu
      visible={visible}
      items={getSortItems()}
      onClose={onClose}
      position={position}
      title="Sort By"
      width={240}
    />
  );
};

export default SortMenu;
