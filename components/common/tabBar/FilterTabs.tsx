import React from 'react';
import { Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/theme';
import { ItemFilter } from '@/types/item';
import { scaler } from '@/utils';

interface FilterTabsProps {
  currentFilter: ItemFilter;
  onFilterChange: (filter: ItemFilter) => void;
  isDarkMode: boolean;
}

interface FilterOption {
  id: ItemFilter;
  label: string;
  icon: string;
}

const filterOptions: FilterOption[] = [
  { id: 'all', label: 'All', icon: 'list-outline' },
  { id: 'favorites', label: 'Favorites', icon: 'star-outline' },
  { id: 'tagged', label: 'Tagged', icon: 'pricetag-outline' },
  { id: 'short', label: 'Short Reads', icon: 'time-outline' },
  { id: 'long', label: 'Long Reads', icon: 'book-outline' },
  { id: 'archived', label: 'Archived', icon: 'archive-outline' },
];

const FilterTabs: React.FC<FilterTabsProps> = ({ currentFilter, onFilterChange, isDarkMode }) => {
  const getTabColor = (option: FilterOption) => {
    if (currentFilter === option.id) {
      return option.id === 'all' ? COLORS.white : isDarkMode ? COLORS.white : COLORS.text;
    }
    return isDarkMode ? COLORS.lightGray : COLORS.darkGray;
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
      style={[
        styles.container,
        { borderBottomColor: isDarkMode ? COLORS.darkBorder : COLORS.tasksConBorder },
      ]}
    >
      {filterOptions.map((option) => (
        <TouchableOpacity
          key={option.id}
          style={[
            styles.tab,
            currentFilter === option.id &&
              (option.id === 'all' ? styles.activeTab : styles.inactiveTab),
            isDarkMode && styles.darkTab,
          ]}
          onPress={() => onFilterChange(option.id)}
          activeOpacity={0.7}
        >
          {option.id !== 'all' && (
            <Ionicons
              name={option.icon as any}
              size={16}
              color={getTabColor(option)}
              style={styles.icon}
            />
          )}
          <Text
            style={[
              styles.tabText,
              currentFilter === option.id && option.id === 'all' && styles.activeTabText,
              isDarkMode && {
                color: currentFilter === option.id ? COLORS.white : COLORS.lightGray,
              },
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
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
    fontSize: scaler(14),
    fontWeight: '500',
    color: COLORS.text,
  },
  activeTabText: {
    color: COLORS.white,
  },
});

export default FilterTabs;
