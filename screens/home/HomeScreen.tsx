import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Item, ItemFilter } from '@/types/item';
import { COLORS } from '@/assets';
import { useAppSelector } from '@/redux/hook';
import { selectActiveTheme } from '@/redux/utils';
import { Ionicons } from '@expo/vector-icons';
import { useGetItemsQuery } from '@/redux/services/itemsApi';
import ArticleCard from '@/components/common/card/ArticalCard';
import FilterTabs from '@/components/common/tabBar/FilterTabs';
import ActionMenu from '@/components/common/menu/ActionMenu';
import NoItemsFound from '@/components/common/emptyState/NoUIFound';

export default function ListScreen() {
  const router = useRouter();
  const activeTheme = useAppSelector(selectActiveTheme);
  const isDarkMode = activeTheme === 'dark';
  
  // State for filter and action menu
  const [filter, setFilter] = useState<ItemFilter>('all');
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  
  // Get items from API with the current filter
  const { 
    data, 
    isLoading, 
    isFetching, 
    refetch, 
    error 
  } = useGetItemsQuery({ 
    filter: filter !== 'all' ? filter : undefined,
    limit: 20
  });

  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Handle filter change
  const handleFilterChange = (newFilter: ItemFilter) => {
    setFilter(newFilter);
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

  // Navigate to search screen
  const navigateToSearch = () => {
    router.push('/search');
  };

  // Navigate to add article screen
  const navigateToAddArticle = () => {
    router.push('/add-article');
  };

  // Render the article item
  const renderItem = ({ item }: { item: Item }) => (
    <ArticleCard
      item={item}
      onPress={() => navigateToArticle(item)}
      onMenuPress={() => openActionMenu(item.id)}
    />
  );

  // Render loading footer for pagination
  const renderFooter = () => {
    if (!isFetching) return null;
    
    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  return (
    <View style={[
      styles.container, 
      { backgroundColor: isDarkMode ? COLORS.darkBackground : COLORS.background }
    ]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={[styles.logoIcon, { backgroundColor: COLORS.primary }]}>
            <View style={styles.logoHeart} />
          </View>
          <Text style={[
            styles.logoText, 
            { color: isDarkMode ? COLORS.white : COLORS.black }
          ]}>pocket</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={navigateToSearch}
          >
            <Ionicons name="search" size={24} color={isDarkMode ? COLORS.white : COLORS.black} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={navigateToAddArticle}
          >
            <Ionicons name="add" size={24} color={isDarkMode ? COLORS.white : COLORS.black} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Filter Tabs */}
      <FilterTabs
        currentFilter={filter}
        onFilterChange={handleFilterChange}
        isDarkMode={isDarkMode}
      />
      
      {/* Article List */}
      {isLoading && !data ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={data?.items || []}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.listContent,
            !data?.items.length && styles.emptyList
          ]}
          ListEmptyComponent={<NoItemsFound filter={filter} />}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
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
    // flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 20,
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerContainer: {
    padding: 16,
    alignItems: 'center',
  },
});