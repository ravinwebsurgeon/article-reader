import React, { memo, useCallback, useState } from "react";
import { FlatList, StyleSheet, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import ArticleCard from "@/components/shared/card/ArticleCard";
import NoUIFound from "@/components/shared/emptyState/NoUIFound";
import Item from "@/database/models/ItemModel";
import { ItemFilter } from "@/types/item";
import { syncEngine } from "@/database/sync/SyncEngine";

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
    ({ item }: { item: Item }) => (
      <ArticleCard item={item} onPress={() => navigateToArticle(item)} />
    ),
    [navigateToArticle],
  );

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      refreshControl={<RefreshControl refreshing={isSyncing} onRefresh={handleRefresh} />}
      ListEmptyComponent={<NoUIFound filter={filter} />}
    />
  );
});

ItemsFlatList.displayName = "ItemsFlatList";

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 20,
  },
  // Note: Other styles like emptyList, title, subtitle, description, footer
  // were in the original file but not directly used by ItemsList.
  // They might be related to NoUIFound or were for other parts.
  // For now, only listContainer is included as it was directly used.
});

export default ItemsFlatList;
