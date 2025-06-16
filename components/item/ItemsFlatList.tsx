import React, { memo, useCallback, useState, useMemo } from "react";
import { FlatList, StyleSheet, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import NoUIFound from "@/components/shared/emptyState/NoUIFound";
import Item from "@/database/models/ItemModel";
import { ItemFilter } from "@/types/item";
import { syncEngine } from "@/database/sync/SyncEngine";
import ItemCard, { ITEM_CARD_HEIGHT } from "@/components/item/ItemCard";

interface ItemsFlatListProps {
  items: Item[];
  filter: ItemFilter;
  archivedCount?: number;
}

const ItemsFlatList = memo(({ items, filter, archivedCount }: ItemsFlatListProps) => {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleRefresh = useCallback(async () => {
    try {
      setIsSyncing(true);
      await syncEngine.sync();
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const navigateToArticle = useCallback(
    (item: Item) => {
      router.push({
        pathname: "/reader/[id]",
        params: { id: item.id },
      });
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: Item }) => <ItemCard item={item} onPress={() => navigateToArticle(item)} />,
    [navigateToArticle],
  );

  const getItemLayout = useCallback(
    (_data: ArrayLike<Item> | null | undefined, index: number) => ({
      length: ITEM_CARD_HEIGHT + 0.5, // Include border height
      offset: (ITEM_CARD_HEIGHT + 0.5) * index,
      index,
    }),
    [],
  );

  // Show "allClear" message for users who have archived items but current list is empty
  const emptyStateFilter = useMemo(() => {
    if (filter === "all" && archivedCount && archivedCount > 0) {
      return "allClear";
    }
    return filter;
  }, [filter, archivedCount]);

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      refreshControl={<RefreshControl refreshing={isSyncing} onRefresh={handleRefresh} />}
      ListEmptyComponent={
        // Show empty state immediately for non-"all" filters, or for "all" filter once archivedCount is loaded
        filter !== "all" || archivedCount !== undefined ? (
          <NoUIFound filter={emptyStateFilter} />
        ) : null
      }
      windowSize={10}
      maxToRenderPerBatch={5}
      initialNumToRender={15}
      removeClippedSubviews={false}
      getItemLayout={getItemLayout}
    />
  );
});

ItemsFlatList.displayName = "ItemsFlatList";

const styles = StyleSheet.create({
  listContainer: {
    flexGrow: 1,
  },
});

export default ItemsFlatList;
