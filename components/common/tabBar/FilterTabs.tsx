import React, { useRef, useState, useMemo, useCallback } from "react";
import { Text, StyleSheet, ScrollView, TouchableOpacity, View } from "react-native";
import { useTheme, useDarkMode, type Theme } from "@/theme";
import { ItemFilter } from "@/types/item";
import SortMenu, { SortOption } from "../menu/SortMenu";
import { ActionMenuPosition } from "../menu/ReusableActionMenu";
import { SvgIcon } from "@/components/SvgIcon";
import { useTranslation } from "react-i18next";

interface FilterTabsProps {
  currentFilter: ItemFilter;
  onFilterChange: (filter: ItemFilter) => void;
  currentSort?: SortOption;
  onSortChange?: (sort: SortOption) => void;
}

interface FilterOptionType {
  id: ItemFilter | "sorting";
  label?: string;
  icon?: (color: string) => React.ReactNode;
}

const FilterTabs: React.FC<FilterTabsProps> = ({
  currentFilter,
  onFilterChange,
  currentSort = "newest",
  onSortChange = () => {},
}) => {
  const theme = useTheme();
  const isDarkMode = useDarkMode();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(theme, isDarkMode), [theme, isDarkMode]);

  const tabRefs = useRef<{ [key: string]: View | null }>({});
  const sortButtonRef = useRef<View>(null);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [sortMenuPosition, setSortMenuPosition] = useState<ActionMenuPosition>({});

  const filterOptions: FilterOptionType[] = [
    {
      id: "sorting",
      icon: (color: string) => <SvgIcon name="sort-descending" size={24} color={color} />,
    },
    { id: "all", label: t("filters.all") },
    {
      id: "favorites",
      label: t("filters.favorites"),
      icon: (color: string) => <SvgIcon name="favorite" size={24} color={color} />,
    },
    {
      id: "tagged",
      label: t("filters.tagged"),
      icon: (color: string) => <SvgIcon name="tag" size={24} color={color} />,
    },
    {
      id: "short",
      label: t("filters.shortReads"),
      icon: (color: string) => <SvgIcon name="time-short" size={24} color={color} />,
    },
    {
      id: "long",
      label: t("filters.longReads"),
      icon: (color: string) => <SvgIcon name="time-long" size={24} color={color} />,
    },
    {
      id: "archived",
      label: t("filters.archived"),
      icon: (color: string) => <SvgIcon name="archive" size={24} color={color} />,
    },
  ];

  const handleTabPress = (filterId: ItemFilter | "sorting") => {
    if (filterId === "sorting") {
      handleSortButtonPress();
      return;
    }
    onFilterChange(filterId as ItemFilter);
  };

  const handleSortButtonPress = () => {
    if (sortButtonRef.current) {
      sortButtonRef.current.measure(
        (_x: number, _y: number, width: number, height: number, pageX: number, pageY: number) => {
          setSortMenuPosition({
            x: pageX,
            y: pageY,
            width,
            height,
            position: "bottom",
            align: "start",
          });
          setSortMenuVisible(true);
        },
      );
    }
  };

  const handleSortChange = (sort: SortOption) => {
    onSortChange(sort);
    setSortMenuVisible(false);
  };

  const getIconColor = useCallback(
    (filterId: ItemFilter | "sorting"): string => {
      return currentFilter === filterId ? theme.colors.primary.contrast : theme.colors.icon;
    },
    [currentFilter, theme.colors],
  );

  const getTextColor = useCallback(
    (filterId: ItemFilter | "sorting"): string => {
      return currentFilter === filterId ? theme.colors.primary.contrast : theme.colors.text.primary;
    },
    [currentFilter, theme.colors],
  );

  const getTabBackgroundColor = useCallback(
    (filterId: ItemFilter | "sorting"): string => {
      if (currentFilter === filterId) {
        return theme.colors.primary.main;
      }
      return theme.colors.inputBackground;
    },
    [currentFilter, theme.colors],
  );

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        scrollIndicatorInsets={{ right: 1 }}
        scrollEventThrottle={16}
        removeClippedSubviews={true}
      >
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            ref={
              option.id === "sorting"
                ? sortButtonRef
                : (ref: View | null) => {
                    tabRefs.current[option.id as string] = ref;
                  }
            }
            style={[
              styles.tab,
              !option.label && styles.iconOnlyTab,
              { backgroundColor: getTabBackgroundColor(option.id) },
            ]}
            onPress={() => handleTabPress(option.id)}
            activeOpacity={0.7}
          >
            {option.icon && (
              <View style={styles.iconContainer}>{option.icon(getIconColor(option.id))}</View>
            )}
            {option.label && (
              <Text
                style={[
                  styles.tabText,
                  { color: getTextColor(option.id), marginLeft: option.icon ? 4 : 0 },
                ]}
              >
                {option.label}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      <SortMenu
        visible={sortMenuVisible}
        position={sortMenuPosition}
        currentSort={currentSort}
        onSortChange={handleSortChange}
        onClose={() => setSortMenuVisible(false)}
      />
    </>
  );
};

const makeStyles = (theme: Theme, isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    scrollContainer: {
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    tab: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginHorizontal: 4,
      borderRadius: 20,
      alignSelf: "center",
      height: 40,
    },
    iconContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      width: 24,
      height: 24,
    },
    tabText: {
      fontSize: 13,
      fontWeight: "600",
      lineHeight: 19,
    },
    iconOnlyTab: {
      paddingHorizontal: 16,
      minWidth: 40,
      paddingVertical: 8,
      alignSelf: "center",
      justifyContent: "center",
    },
  });

export default React.memo(FilterTabs);
