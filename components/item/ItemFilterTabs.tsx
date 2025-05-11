import React, { memo } from "react";
import FilterTabs from "@/components/shared/tabBar/FilterTabs";
import { ItemFilter } from "@/types/item";
import { SortOption } from "@/components/shared/menu/SortMenu";

interface ItemFilterTabsProps {
  currentFilter: ItemFilter;
  currentSort: SortOption;
  onFilterChange: (filter: ItemFilter) => void;
  onSortChange: (sort: SortOption) => void;
}

const ItemFilterTabs = memo(
  ({ currentFilter, currentSort, onFilterChange, onSortChange }: ItemFilterTabsProps) => {
    return (
      <FilterTabs
        currentFilter={currentFilter}
        currentSort={currentSort}
        onFilterChange={onFilterChange}
        onSortChange={onSortChange}
      />
    );
  },
);

ItemFilterTabs.displayName = "ItemFilterTabs";

export default ItemFilterTabs;
