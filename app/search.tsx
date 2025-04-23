// src/app/search.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useDebounce } from '@/utils/hooks';
import { COLORS, lightColors } from '@/theme';
import { useAppSelector } from '@/redux/hook';
import { selectActiveTheme } from '@/redux/utils';
import { Item } from '@/types/item';
import { useSearchItemsQuery } from '@/redux/services/itemsApi';
import ArticleCard from '@/components/common/card/ArticalCard';

export default function SearchScreen() {
  const router = useRouter();
  const activeTheme = useAppSelector(selectActiveTheme);
  const isDarkMode = activeTheme === 'dark';
  
  // State
  const [searchText, setSearchText] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  
  // Debounce search query to avoid too many API calls
  const debouncedSearchQuery = useDebounce(searchText, 500);
  
  // Only search if there's a query
  const shouldSearch = debouncedSearchQuery.trim().length > 0;
  
  // Query hook with conditional fetching
  const { 
    data,
    isLoading,
    isFetching,
  } = useSearchItemsQuery(
    { query: debouncedSearchQuery },
    { skip: !shouldSearch }
  );
  
  // Clear input and dismiss keyboard
  const handleClearSearch = () => {
    setSearchText('');
    Keyboard.dismiss();
  };
  
  // Handle back navigation
  const handleBack = () => {
    router.back();
  };
  
  // Navigate to article detail
  const navigateToArticle = (item: Item) => {
    router.push({
      pathname: `/blog/${item.id}`,
      params: { id: item.id.toString() }
    });
  };
  
  // Open action menu for an item
  const openActionMenu = (id: number) => {
    setSelectedItemId(id);
    setShowActionMenu(true);
  };
  
  // Close action menu
  const closeActionMenu = () => {
    setShowActionMenu(false);
    setSelectedItemId(null);
  };
  
  // Render article item
  const renderItem = ({ item }: { item: Item }) => (
    <ArticleCard
      item={item}
      onPress={() => navigateToArticle(item)}
      onMenuPress={() => openActionMenu(item.id)}
    />
  );
  
  return (
    <View style={[
      styles.container,
      { backgroundColor: isDarkMode ? COLORS.darkBackground : lightColors.background.default }
    ]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchInputContainer}>
          <Ionicons 
            name="search" 
            size={20} 
            color={COLORS.darkGray} 
            style={styles.searchIcon}
          />
          
          <TextInput
            style={[
              styles.searchInput,
              { color: isDarkMode ? COLORS.white : COLORS.text }
            ]}
            placeholder="Search your Saves"
            placeholderTextColor={lightColors.text.disabled}
            value={searchText}
            onChangeText={setSearchText}
            autoFocus
            returnKeyType="search"
          />
          
          {searchText.length > 0 && (
            <TouchableOpacity 
              onPress={handleClearSearch}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color={COLORS.darkGray} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={handleBack}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
      
      {/* Content */}
      {!shouldSearch ? (
        // Empty search state
        <View style={styles.emptyStateContainer}>
          <Text style={[
            styles.emptyStateText,
            { color: isDarkMode ? COLORS.lightGray : COLORS.darkGray }
          ]}>
            "Let's find that thing you saved"
          </Text>
          
          <View style={styles.logoContainer}>
            <View style={[styles.logoIcon, { backgroundColor: COLORS.primary.main }]}>
              <View style={styles.logoHeart} />
            </View>
            <Text style={[
              styles.logoText, 
              { color: isDarkMode ? COLORS.white : COLORS.text }
            ]}>pocket</Text>
          </View>
        </View>
      ) : isLoading || isFetching ? (
        // Loading state
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary.main} />
        </View>
      ) : data?.items.length === 0 ? (
        // No results state
        <View style={styles.noResultsContainer}>
          <Text style={[
            styles.noResultsText,
            { color: isDarkMode ? COLORS.white : COLORS.text }
          ]}>
            No results found for "{debouncedSearchQuery}"
          </Text>
          <Text style={[
            styles.noResultsSubtext,
            { color: isDarkMode ? COLORS.lightGray : COLORS.darkGray }
          ]}>
            Try a different search term or check your spelling
          </Text>
        </View>
      ) : (
        // Results list
        <FlatList
          data={data?.items || []}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}
      
      {/* Action Menu Modal */}
      {showActionMenu && selectedItemId && (
        <ActionMenu
          itemId={selectedItemId}
          onClose={closeActionMenu}
          items={data?.items}
        />
      )}
    </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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