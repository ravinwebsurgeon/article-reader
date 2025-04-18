import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/assets';
import { ItemFilter } from '@/types/item';

interface FilterTabsProps {
  currentFilter: ItemFilter;
  onFilterChange: (filter: ItemFilter) => void;
  isDarkMode: boolean;
}

const filterOptions: { id: ItemFilter; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: 'list-outline' },
  { id: 'favorites', label: 'Favorites', icon: 'star-outline' },
  { id: 'tagged', label: 'Tagged', icon: 'pricetag-outline' },
  { id: 'short', label: 'Short Reads', icon: 'time-outline' },
  { id: 'long', label: 'Long Reads', icon: 'book-outline' },
  { id: 'archived', label: 'Archived', icon: 'archive-outline' },
];

const FilterTabs: React.FC<FilterTabsProps> = ({ 
  currentFilter, 
  onFilterChange,
  isDarkMode
}) => {
  return (
    <ScrollView 
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
      style={[
        styles.container,
        { borderBottomColor: isDarkMode ? COLORS.darkBorder : COLORS.lightBorder }
      ]}
    >
      {filterOptions.map((option) => (
        <TouchableOpacity
          key={option.id}
          style={[
            styles.tab,
            currentFilter === option.id && (
              option.id === 'all' 
                ? styles.activeTab 
                : styles.inactiveTab
            ),
            isDarkMode && styles.darkTab
          ]}
          onPress={() => onFilterChange(option.id)}
          activeOpacity={0.7}
        >
          {option.id === 'all' ? null : (
            <Ionicons 
              name={option.icon as any}
              size={16} 
              color={
                currentFilter === option.id
                  ? option.id === 'all'
                    ? COLORS.white
                    : isDarkMode
                      ? COLORS.white
                      : COLORS.text
                  : isDarkMode
                    ? COLORS.lightGray
                    : COLORS.darkGray
              } 
              style={styles.icon}
            />
          )}
          <Text
            style={[
              styles.tabText,
              currentFilter === option.id && option.id === 'all' && styles.activeTabText,
              isDarkMode && {
                color: currentFilter === option.id
                  ? COLORS.white
                  : COLORS.lightGray
              }
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightBorder,
  },
  scrollContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    alignSelf: 'center',
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  inactiveTab: {
    backgroundColor: COLORS.lightGray,
  },
  darkTab: {
    backgroundColor: COLORS.darkGray,
  },
  icon: {
    marginRight: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  activeTabText: {
    color: COLORS.white,
  },
});

export default FilterTabs;