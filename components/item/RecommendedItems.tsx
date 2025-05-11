import React, { memo, useCallback } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/theme/hooks";
import ItemCard from "@/components/item/ItemCard";
import Item from "@/database/models/ItemModel";

interface RecommendedItemsProps {
  items: Item[];
}

function RecommendedItemsBase({ items }: RecommendedItemsProps) {
  const router = useRouter();
  const theme = useTheme();

  const handlePress = useCallback(
    (item: Item) => {
      router.push({ pathname: "/reader/[id]", params: { id: item.id } });
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: Item }) => (
      <ItemCard
        item={item}
        onPress={() => handlePress(item)}
        style={{ paddingHorizontal: -16 }}
        itemTags={[]}
      />
    ),
    [handlePress],
  );

  const keyExtractor = useCallback((item: Item) => item.id, []);

  const ItemSeparator = useCallback(
    () => <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />,
    [theme.colors.border],
  );

  if (items.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={ItemSeparator}
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={3}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
});

export default memo(RecommendedItemsBase);
