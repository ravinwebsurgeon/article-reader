import React, { memo } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { withRecommendedItems } from "@/database/hooks/withRecommendedItems";
import Item from "@/database/models/ItemModel";
import { useTheme } from "@/theme/hooks";
import ArticleCard from "@/components/shared/card/ArticleCard";

// Base component for the Recommended Articles section
const RecommendedArticlesBase = ({
  currentItem,
  recommendedItems = [],
}: {
  currentItem: Item;
  recommendedItems: Item[];
}) => {
  const router = useRouter();
  const theme = useTheme();

  // Navigate to the selected article
  const navigateToArticle = (item: Item) => {
    router.push({
      pathname: "/reader/[id]",
      params: { id: item.id },
    });
  };

  // Render a single recommended article
  const renderItem = ({ item }: { item: Item }) => (
    <ArticleCard
      item={item}
      onPress={() => navigateToArticle(item)}
      style={{ paddingHorizontal: -16 }}
      //   onMenuPress={() => openActionMenu(item.id)}
    />
  );

  // Key extractor for FlatList
  const keyExtractor = (item: Item) => item.id;

  if (recommendedItems.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={recommendedItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
        )}
      />
    </View>
  );
};

// Enhanced component with data from withRecommendedItems HOC
const RecommendedArticles = ({ currentItem }: { currentItem: Item }) => {
  // Use the HOC to get recommended items
  const EnhancedComponent = withRecommendedItems(currentItem)(({ recommendedItems = [] }) => (
    <RecommendedArticlesBase currentItem={currentItem} recommendedItems={recommendedItems} />
  ));

  return <EnhancedComponent currentItem={currentItem} />;
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  recommendedItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  recommendedContent: {
    flex: 1,
  },
  recommendedTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  recommendedMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recommendedSource: {
    flex: 1,
    marginRight: 8,
  },
  recommendedArrow: {
    marginLeft: 12,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
});

export default memo(RecommendedArticles);
