import React, { useState, useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ItemFilter } from '@/types/item';
import { Images } from '@/assets';
import { useAppSelector } from '@/redux/hook';
import { selectActiveTheme } from '@/redux/utils';
import { Ionicons } from '@expo/vector-icons';
import ArticleCard from '@/components/common/card/ArticalCard';
import FilterTabs from '@/components/common/tabBar/FilterTabs';
import ActionMenu from '@/components/common/menu/ActionMenu';
import NoItemsFound from '@/components/common/emptyState/NoUIFound';
import { scaler } from '@/utils';
import { COLORS, lightColors } from '@/theme';
import { syncEngine } from '@/database/sync/SyncEngine';
import { withObservables } from '@nozbe/watermelondb/react';
import { database } from '@/database/database';
import { Q } from '@nozbe/watermelondb';
import Item from '@/database/models/ItemModel';

// Fixed height for each item - calculated based on ArticleCard design
// This includes the content height plus padding and borders
const ITEM_HEIGHT = scaler(140);

// The base HomeScreen component without database connection
// This is the "dumb" presentational component that just renders UI based on props
const HomeScreenComponent = ({ items }: { items: Item[] }) => {
  const router = useRouter();
  const activeTheme = useAppSelector(selectActiveTheme);
  const isDarkMode = activeTheme === 'dark';

  // State for filter and action menu
  const [filter, setFilter] = useState<ItemFilter>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Handle pull-to-refresh - sync with server
  const handleRefresh = useCallback(() => {
    try {
      setIsSyncing(true);
      syncEngine.sync();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((newFilter: ItemFilter) => {
    setFilter(newFilter);
  }, []);

  // Navigate to article detail
  const navigateToArticle = useCallback(
    (item: Item) => {
      router.push({
        pathname: '/reader/[id]',
        params: { id: item.id },
      });
    },
    [router]
  );

  // Open action menu for an item
  const openActionMenu = useCallback((id: string) => {
    setSelectedItemId(id);
    setShowActionMenu(true);
  }, []);

  // Close action menu
  const closeActionMenu = useCallback(() => {
    setShowActionMenu(false);
    setSelectedItemId(null);
  }, []);

  // Navigate to search screen
  const navigateToSearch = useCallback(() => {
    router.push('/search');
  }, [router]);

  // Navigate to add article screen
  const navigateToAddArticle = useCallback(() => {
    router.push('/add-article');
  }, [router]);

  // Action handlers
  const handleFavoriteToggle = useCallback(async (id: string, value: boolean) => {
    try {
      const item = await database.get('items').find(id);
      await database.write(async () => {
        await item.update((record: any) => {
          record.favorite = value;
        });
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, []);

  const handleArchiveToggle = useCallback(async (id: string, value: boolean) => {
    try {
      const item = await database.get('items').find(id);
      await database.write(async () => {
        await item.update((record: any) => {
          record.archived = value;
        });
      });
    } catch (error) {
      console.error('Error toggling archive:', error);
    }
  }, []);

  const handleDeleteItem = useCallback(async (id: string) => {
    try {
      const item = await database.get('items').find(id);
      await database.write(async () => {
        await item.markAsDeleted();
      });
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  }, []);

  // Render the article item - wrapped in useCallback to prevent recreating on each render
  const renderItem = useCallback(
    ({ item }: { item: Item }) => (
      <ArticleCard item={item} onPress={() => navigateToArticle(item)} onMenuPress={() => openActionMenu(item.id)} />
    ),
    [navigateToArticle, openActionMenu]
  );

  // Memoize keyExtractor to prevent recreation on each render
  const keyExtractor = useCallback((item: Item) => item.id, []);

  // Implement getItemLayout for fixed height items
  // This allows FlatList to know item dimensions without measuring them
  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  const isLoading = false; // We never show loading state - WatermelonDB handles this

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? COLORS.darkBackground : lightColors.background.default },
      ]}
    >
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image style={styles.logoIcon} source={Images.pa_logo} />
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={navigateToSearch}>
            <Ionicons name="search" size={24} color={isDarkMode ? COLORS.white : COLORS.black} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={navigateToAddArticle}>
            <Ionicons name="add" size={24} color={isDarkMode ? COLORS.white : COLORS.black} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <FilterTabs currentFilter={filter} onFilterChange={handleFilterChange} isDarkMode={isDarkMode} />

      {/* Article List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary.main} />
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[styles.listContent, items?.length === 0 && styles.emptyList]}
          ListEmptyComponent={<NoItemsFound filter={filter} />}
          refreshControl={
            <RefreshControl
              refreshing={isSyncing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary.main]}
              tintColor={COLORS.primary.main}
            />
          }
          // Performance optimizations for FlatList
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
          updateCellsBatchingPeriod={50}
          getItemLayout={getItemLayout}
        />
      )}

      {/* Action Menu Modal */}
      {showActionMenu && selectedItemId && (
        <ActionMenu
          itemId={selectedItemId}
          onClose={closeActionMenu}
          items={items}
          onFavoriteToggle={handleFavoriteToggle}
          onArchiveToggle={handleArchiveToggle}
          onDeleteItem={handleDeleteItem}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: scaler(16),
    paddingTop: scaler(48),
    paddingBottom: scaler(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: scaler(50),
    height: scaler(30),
  },
  logoIcon: {
    width: scaler(120),
    height: scaler(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: scaler(20),
    padding: scaler(4),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: scaler(20),
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// This is the key optimization with withObservables
// Create an enhanced component that observes filter changes and fetches appropriate items
const enhanceWithItems = withObservables(['filter'], ({ filter = 'all' }: { filter?: ItemFilter }) => {
  let query;
  const itemsCollection = database.get('items');

  if (filter === 'favorites') {
    query = itemsCollection.query(Q.where('favorite', true), Q.where('archived', false));
  } else if (filter === 'archived') {
    query = itemsCollection.query(Q.where('archived', true));
  } else if (filter === 'tagged') {
    query = itemsCollection.query(
      Q.unsafeSqlQuery('SELECT items.* FROM items JOIN item_tags ON items.id = item_tags.item_id')
    );
  } else if (filter === 'short') {
    query = itemsCollection.query(Q.where('word_count', Q.lte(800)), Q.where('archived', false));
  } else if (filter === 'long') {
    query = itemsCollection.query(Q.where('word_count', Q.gt(800)), Q.where('archived', false));
  } else {
    // Default to unarchived items
    query = itemsCollection.query(Q.where('archived', false));
  }

  return {
    items: query,
  };
});

// Export the enhanced component
export default enhanceWithItems(HomeScreenComponent);
