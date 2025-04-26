import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, lightColors } from '@/theme';
import { useAppSelector } from '@/redux/hook';
import { selectActiveTheme } from '@/redux/utils';
import ArticleCard from '@/components/common/card/ArticleCard';
import ActionMenu from '@/components/common/menu/ActionMenu';
import ItemModel from '@/database/models/ItemModel';
import { withSearch } from '@/database/hooks/useItems';

// Base component without database connection
const SearchScreenComponent = ({
  items = [],
  searchQuery,
  onSearchQueryChange,
}: {
  items?: ItemModel[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}) => {
  const router = useRouter();
  const activeTheme = useAppSelector(selectActiveTheme);
  const isDarkMode = activeTheme === 'dark';

  // State
  const [selectedItem, setSelectedItem] = useState<ItemModel | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);

  // Determine if we should show results or empty/no-results state
  const shouldShowResults = searchQuery.trim().length > 0;

  // Clear input and dismiss keyboard
  const handleClearSearch = () => {
    onSearchQueryChange('');
    Keyboard.dismiss();
  };

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // Navigate to article detail
  const navigateToArticle = (item: ItemModel) => {
    router.push({
      pathname: '/reader/[id]' as const,
      params: { id: item.id },
    });
  };

  // Open action menu for an item
  const openActionMenu = (item: ItemModel) => {
    setSelectedItem(item);
    setShowActionMenu(true);
  };

  // Close action menu
  const closeActionMenu = () => {
    setShowActionMenu(false);
    setSelectedItem(null);
  };

  // Render article item
  const renderItem = ({ item }: { item: ItemModel }) => (
    <ArticleCard
      item={item}
      onPress={() => navigateToArticle(item)}
      onMenuPress={() => openActionMenu(item)}
    />
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? COLORS.darkBackground : lightColors.background.default },
      ]}
    >
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.darkGray} style={styles.searchIcon} />

          <TextInput
            style={[styles.searchInput, { color: isDarkMode ? COLORS.white : COLORS.text }]}
            placeholder="Search your Saves"
            placeholderTextColor={lightColors.text.disabled}
            value={searchQuery}
            onChangeText={onSearchQueryChange}
            autoFocus
            returnKeyType="search"
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={COLORS.darkGray} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.cancelButton} onPress={handleBack}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {!shouldShowResults ? (
        // Initial Empty search state
        <View style={styles.emptyStateContainer}>
          <Text
            style={[
              styles.emptyStateText,
              { color: isDarkMode ? COLORS.lightGray : COLORS.darkGray },
            ]}
          >
            "Let's find that thing you saved"
          </Text>

          <View style={styles.logoContainer}>
            <View style={[styles.logoIcon, { backgroundColor: COLORS.primary.main }]}>
              <View style={styles.logoHeart} />
            </View>
            <Text style={[styles.logoText, { color: isDarkMode ? COLORS.white : COLORS.text }]}>
              pocket
            </Text>
          </View>
        </View>
      ) : items && items.length === 0 ? (
        // No results state (only shown if shouldShowResults is true)
        <View style={styles.noResultsContainer}>
          <Text style={[styles.noResultsText, { color: isDarkMode ? COLORS.white : COLORS.text }]}>
            No results found for "{searchQuery}"
          </Text>
          <Text
            style={[
              styles.noResultsSubtext,
              { color: isDarkMode ? COLORS.lightGray : COLORS.darkGray },
            ]}
          >
            Try a different search term or check your spelling
          </Text>
        </View>
      ) : (
        // Results list (only shown if shouldShowResults is true and items exist)
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Action Menu Modal */}
      {showActionMenu && selectedItem && (
        <ActionMenu item={selectedItem} onClose={closeActionMenu} />
      )}
    </View>
  );
};

// Define props for SearchScreenComponent to use with rest spread
interface SearchScreenComponentProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

// Create the enhanced component ONCE outside the main component
// It receives the raw `items` observable based on the `query` prop
const EnhancedSearchScreen = withSearch()(
  ({ items, ...props }: { items: ItemModel[] } & SearchScreenComponentProps) => (
    <SearchScreenComponent items={items} {...props} />
  )
);

// Wrapper component that provides the search query state
export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    // Pass the changing searchQuery as a prop to the stable EnhancedSearchScreen
    <EnhancedSearchScreen
      query={searchQuery}
      searchQuery={searchQuery} // Pass to SearchScreenComponent for display/input
      onSearchQueryChange={setSearchQuery}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightBorder,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
    color: COLORS.primary.main,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoHeart: {
    width: 14,
    height: 14,
    backgroundColor: 'white',
    borderRadius: 7,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
});
