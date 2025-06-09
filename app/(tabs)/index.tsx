import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme";
import { ItemFilter } from "@/types/item";
import { SortOption } from "@/components/shared/menu/SortMenu";
import ItemListHeader from "@/components/item/ItemListHeader";
import ItemFilterTabs from "@/components/item/ItemFilterTabs";
import ItemsListWithInitialSync from "@/features/item/ItemsListWithInitialSync";

export default function SavesScreen() {
  const [filter, setFilter] = useState<ItemFilter>("all");
  const [sorted, setSorted] = useState<SortOption>("newest");
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background.default }]}
      edges={["top"]}
    >
      <ItemListHeader />

      <View>
        <ItemFilterTabs
          currentFilter={filter}
          onFilterChange={setFilter}
          onSortChange={setSorted}
          currentSort={sorted}
        />
      </View>

      <View style={{ flex: 1 }}>
        <ItemsListWithInitialSync filter={filter} sorted={sorted} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
