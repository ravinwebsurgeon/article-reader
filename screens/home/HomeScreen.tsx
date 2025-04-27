import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ItemFilter } from '@/types/item';
import { Images } from '@/assets';
import { useAppSelector } from '@/redux/hook';
import { selectActiveTheme } from '@/redux/utils';
import { Ionicons } from '@expo/vector-icons';
import ArticleCard, { ARTICLE_CARD_HEIGHT } from '@/components/common/card/ArticleCard';
import FilterTabs from '@/components/common/tabBar/FilterTabs';
import ActionMenu from '@/components/common/menu/ActionMenu';
import NoItemsFound from '@/components/common/emptyState/NoUIFound';
import { scaler } from '@/utils';
import { COLORS, lightColors } from '@/theme';
import { syncEngine } from '@/database/sync/SyncEngine';
import { withItems } from '@/database/hooks/withItems';
import Item from '@/database/models/ItemModel';

// Use the exported fixed height from ArticleCard component
const ITEM_HEIGHT = ARTICLE_CARD_HEIGHT;

interface ActionMenuProps {
  item: Item;
  onClose: () => void;
}

// The base HomeScreen component without database connection
// This is the "dumb" presentational component that just renders UI based on props
const HomeScreenComponent = ({
  items,
  filter,
  onFilterChange,
}: {
  items: Item[];
  filter: ItemFilter;
  onFilterChange: (filter: ItemFilter) => void;
}) => {
  const router = useRouter();
  const activeTheme = useAppSelector(selectActiveTheme);
  const isDarkMode = activeTheme === 'dark';

  // State for action menu
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Handle pull-to-refresh - sync with server
  const handleRefresh = useCallback(async () => {
    try {
      setIsSyncing(true);
      console.log('Performing refresh sync');
      await syncEngine.sync();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
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

  // Render the article item - wrapped in useCallback to prevent recreating on each render
  const renderItem = useCallback(
    ({ item }: { item: Item }) => (
      <ArticleCard
        item={item}
        onPress={() => navigateToArticle(item)}
        onMenuPress={() => openActionMenu(item.id)}
      />
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
      <FilterTabs currentFilter={filter} onFilterChange={onFilterChange} isDarkMode={isDarkMode} />

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
          item={items.find((item) => item.id === selectedItemId)!}
          onClose={closeActionMenu}
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

// Create a wrapper component that combines the filter state with the database items
const HomeScreenWithFilter = () => {
  const [filter, setFilter] = useState<ItemFilter>('all');

  // This component will receive the items from withItems
  const EnhancedComponent = withItems({ filter })(({ items }) => (
    <HomeScreenComponent items={items} filter={filter} onFilterChange={setFilter} />
  ));

  return <EnhancedComponent />;
};

// Export the wrapper component
export default HomeScreenWithFilter;
