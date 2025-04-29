import React, { useState, useCallback, useMemo, memo } from 'react';
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
import Svg, { Path } from 'react-native-svg';

// Use the exported fixed height from ArticleCard component
const ITEM_HEIGHT = ARTICLE_CARD_HEIGHT;

const Header = memo(() => {
  const router = useRouter();
  const activeTheme = useAppSelector(selectActiveTheme);
  const isDarkMode = activeTheme === 'dark';

  const navigateToSearch = useCallback(() => {
    router.push('/search');
  }, [router]);

  const navigateToAddArticle = useCallback(() => {
    router.push('/add-article');
  }, [router]);

  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        {isDarkMode ? (
          <Image style={styles.logoIcon} source={Images.pa_dark_logo} />
        ) : (
          <Image style={styles.logoIcon} source={Images.pa_logo} />
        )}
      </View>

      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.iconButton} onPress={navigateToSearch}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path
              d="M10.5 1.99994C5.80558 1.99994 2 5.80552 2 10.4999C2 15.1944 5.80558 18.9999 10.5 18.9999C12.5772 18.9999 14.4803 18.2549 15.9568 17.0174L20.7203 21.7809C21.0132 22.0738 21.488 22.0738 21.7809 21.7809C22.0738 21.488 22.0738 21.0131 21.7809 20.7202L17.0174 15.9567C18.2549 14.4803 19 12.5771 19 10.4999C19 5.80552 15.1944 1.99994 10.5 1.99994ZM3.5 10.4999C3.5 6.63395 6.63401 3.49994 10.5 3.49994C14.366 3.49994 17.5 6.63395 17.5 10.4999C17.5 14.3659 14.366 17.4999 10.5 17.4999C6.63401 17.4999 3.5 14.3659 3.5 10.4999Z"
              fill={isDarkMode ? COLORS.white : '#1C1F21'}
              fillOpacity="0.84"
            />
          </Svg>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={navigateToAddArticle}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path
              d="M12.25 2.99995C12.6642 2.99995 13 3.33574 13 3.74995V11H20.5C20.9142 11 21.25 11.3358 21.25 11.75C21.25 12.1642 20.9142 12.5 20.5 12.5H13V19.75C13 20.1642 12.6642 20.5 12.25 20.5C11.8358 20.5 11.5 20.1642 11.5 19.75V12.5H4C3.58579 12.5 3.25 12.1642 3.25 11.75C3.25 11.3358 3.58579 11 4 11H11.5V3.74995C11.5 3.33574 11.8358 2.99995 12.25 2.99995Z"
              fill={isDarkMode ? COLORS.white : '#1C1F21'}
              fillOpacity="0.84"
            />
          </Svg>
        </TouchableOpacity>
      </View>
    </View>
  );
});

Header.displayName = 'Header';

// Memoized FilterTabs component
const MemoizedFilterTabs = memo(
  ({
    currentFilter,
    onFilterChange,
  }: {
    currentFilter: ItemFilter;
    onFilterChange: (filter: ItemFilter) => void;
  }) => {
    const activeTheme = useAppSelector(selectActiveTheme);
    const isDarkMode = activeTheme === 'dark';

    return (
      <FilterTabs
        currentFilter={currentFilter}
        onFilterChange={onFilterChange}
        isDarkMode={isDarkMode}
      />
    );
  },
);

MemoizedFilterTabs.displayName = 'MemoizedFilterTabs';
// The base ItemsList component that only re-renders when items change
const ItemsList = memo(({ items, filter }: { items: Item[]; filter: ItemFilter }) => {
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
    [router],
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

  // Render the article item - wrapped in useCallback to prevent recreating on each render
  const renderItem = useCallback(
    ({ item }: { item: Item }) => (
      <ArticleCard
        item={item}
        onPress={() => navigateToArticle(item)}
        onMenuPress={() => openActionMenu(item.id)}
      />
    ),
    [navigateToArticle, openActionMenu],
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
    [],
  );

  const isLoading = false; // We never show loading state - WatermelonDB handles this

  return (
    <>
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
    </>
  );
});

ItemsList.displayName = 'ItemsList';
// Create the enhanced ItemsList with data from withItems HOC
const EnhancedItemsList = ({ filter }: { filter: ItemFilter }) => {
  // Use the HOC to get items based on the filter
  const WithItemsComponent = useMemo(() => {
    return withItems({ filter })(({ items }) => <ItemsList items={items} filter={filter} />);
  }, [filter]);

  return <WithItemsComponent />;
};

// Main HomeScreen component that manages filter state
const HomeScreenWithFilter = () => {
  const [filter, setFilter] = useState<ItemFilter>('all');
  const activeTheme = useAppSelector(selectActiveTheme);
  const isDarkMode = activeTheme === 'dark';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? COLORS.darkBackground : lightColors.background.default },
      ]}
    >
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* These components will not re-render when the filter changes */}
      <Header />

      {/* This component will re-render when filter changes */}
      <View>
        <MemoizedFilterTabs currentFilter={filter} onFilterChange={setFilter} />
      </View>

      {/* This component will only re-render when necessary */}
      <View style={{ paddingHorizontal: scaler(8) }}>
        <EnhancedItemsList filter={filter} />
      </View>
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

// Export the wrapper component
export default HomeScreenWithFilter;
