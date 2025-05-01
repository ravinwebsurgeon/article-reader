import React, { useEffect, useRef, useState } from 'react';
import {
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View,
  ColorValue,
  TouchableOpacityProps,
} from 'react-native';
import { COLORS } from '@/theme';
import { ItemFilter } from '@/types/item';
import { scaler } from '@/utils';
import Svg, { Path } from 'react-native-svg';
import { Platform } from 'react-native';
import SortMenu, { SortOption } from '../menu/SortMenu';
import { ActionMenuPosition } from '../menu/ReusableActionMenu';
import { SvgIcon } from '@/components/SvgIcon';

interface FilterTabsProps {
  currentFilter: ItemFilter;
  onFilterChange: (filter: ItemFilter) => void;
  isDarkMode: boolean;
  currentSort?: SortOption;
  onSortChange?: (sort: SortOption) => void;
}

interface FilterOption {
  id: ItemFilter;
  icon: string;
}

const filterOptions = [
  {
    id: 'sorting',
    label: '',
    icon: (color: ColorValue | undefined) => (
      <SvgIcon name='sort-descending' size={24} color={color} />
    ),
  },
  {
    id: 'all',
    label: 'All',
  },
  {
    id: 'favorites',
    label: 'Favorites',
    icon: (color: ColorValue | undefined) => (
      <SvgIcon name='favorite' size={24} color={color} />
    ),
  },
  {
    id: 'tagged',
    label: 'Tagged',
    icon: (color: ColorValue | undefined) => (
      <SvgIcon name='tag' size={24} color={color} />
    ),
  },
  {
    id: 'short',
    label: 'Short Reads',
    icon: (color: ColorValue | undefined) => (
      <SvgIcon name='time-short' size={24} color={color} />
    ),
  },
  {
    id: 'long',
    label: 'Long Reads',
    icon: (color: ColorValue | undefined) => (
      <SvgIcon name='time-long' size={24} color={color} />
    ),
  },
  {
    id: 'archived',
    label: 'Archived',
    icon: (color: ColorValue | undefined) => (
      <SvgIcon name='archive' size={24} color={color} />
    ),
  },
];


const FilterTabs: React.FC<FilterTabsProps> = ({
  currentFilter,
  onFilterChange,
  isDarkMode,
  currentSort = 'newest',
  onSortChange = () => {},
}) => {
  // Ref to track tab measurements
  const tabRefs = useRef<{ [key: string]: View | null }>({});

  // Ref for the sort button
  const sortButtonRef = useRef<TouchableOpacityProps | null>(null);

  // Sort menu state
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [sortMenuPosition, setSortMenuPosition] = useState<ActionMenuPosition>({});

  const handleTabPress = (filterId: string | ItemFilter) => {
    // Special case for the sorting button
    if (filterId === 'sorting') {
      handleSortButtonPress();
      return;
    }

    // Otherwise change the filter
    onFilterChange(filterId);
  };

  // Handle sort button press
  const handleSortButtonPress = () => {
    if (sortButtonRef.current) {
      sortButtonRef.current.measure((x, y, width, height, pageX, pageY) => {
        setSortMenuPosition({
          x: pageX,
          y: pageY,
          width,
          height,
          position: 'bottom',
          align: 'start',
        });
        setSortMenuVisible(true);
      });
    }
  };

  // Handle sort selection
  const handleSortChange = (sort: SortOption) => {
    onSortChange(sort);
    setSortMenuVisible(false);
  };

  const getIconColor = (filterId: string) => {
    return currentFilter === filterId ? COLORS.white : isDarkMode ? COLORS.white : COLORS.black;
  };

  const getTextColor = (filterId: string) => {
    return currentFilter === filterId
      ? COLORS.white
      : isDarkMode
        ? COLORS.lightGray
        : COLORS.darkGray;
  };

  const getTabBackgroundColor = (filterId: string) => {
    if (currentFilter === filterId) {
      return filterId === 'all'
        ? COLORS.primary.main
        : isDarkMode
          ? COLORS.darkGray
          : COLORS.lightGray;
    }
    return isDarkMode ? COLORS.darkGray : COLORS.lightGray;
  };

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        style={[
          styles.container,
          { borderBottomColor: isDarkMode ? COLORS.darkBorder : COLORS.tasksConBorder },
        ]}
        // Use this to prevent gesture handling issues
        keyboardShouldPersistTaps="handled"
        // Disable scroll indicator
        scrollIndicatorInsets={{ right: 1 }}
        // Maintain smooth scroll animation
        scrollEventThrottle={16}
        // Improve performance by disabling dynamic content height changes
        removeClippedSubviews={true}
      >
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            // ref={(ref) => (tabRefs.current[option.id] = ref)}
            ref={
              option.id === 'sorting' ? sortButtonRef : (ref) => (tabRefs.current[option.id] = ref)
            }
            style={[
              styles.tab,
              !option.label && styles.iconOnlyTab,
              { backgroundColor: getTabBackgroundColor(option.id) },
              currentFilter === option.id && styles.activeTab,
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
                  { color: getTextColor(option.id) },
                  { marginLeft: option.icon ? 4 : 0 },
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

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: scaler(1),
    borderBottomColor: COLORS.lightBorder,
  },
  scrollContainer: {
    paddingHorizontal: scaler(12),
    paddingVertical: scaler(12),
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaler(16),
    paddingVertical: scaler(10),
    marginHorizontal: scaler(4),
    borderRadius: scaler(20),
    backgroundColor: COLORS.lightGray,
    alignSelf: 'center',
    height: scaler(40),
  },
  activeTab: {
    backgroundColor: COLORS.primary.main,
  },
  inactiveTab: {
    backgroundColor: COLORS.lightGray,
  },
  darkTab: {
    backgroundColor: COLORS.darkGray,
  },
  icon: {
    marginRight: scaler(4),
  },
  tabText: {
    fontSize: scaler(13),
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: scaler(19),
  },
  activeTabText: {
    color: COLORS.white,
  },
  iconContainer: {
    marginRight: scaler(0),
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: scaler(24),
    height: scaler(24),
  },
  iconOnlyTab: {
    paddingHorizontal: scaler(16),
    minWidth: scaler(40),
    paddingVertical: scaler(8),
    alignSelf: 'center',
    justifyContent: 'center',
  },
});

export default React.memo(FilterTabs);
