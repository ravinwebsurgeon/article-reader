import React, { memo, useCallback, useState } from "react";
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
}

const ItemsFlatList = memo(({ items, filter }: ItemsFlatListProps) => {
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
  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      refreshControl={<RefreshControl refreshing={isSyncing} onRefresh={handleRefresh} />}
      ListEmptyComponent={<NoUIFound filter={filter} />}
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
