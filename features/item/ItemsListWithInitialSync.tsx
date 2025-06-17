import React, { useState, useMemo, memo, useEffect } from "react";
import NoUIFound from "@/components/shared/emptyState/NoUIFound";
import { useSync } from "@/database/provider/SyncProvider";
import { withItems } from "@/database/hooks/withItems";
import Item from "@/database/models/ItemModel";
import { ItemFilter } from "@/database/hooks/withItems";
import { SortOption } from "@/components/shared/menu/SortMenu";
import ItemsFlatList from "@/components/item/ItemsFlatList";
import { router } from "expo-router";
import { useFirstRunStore } from "@/stores/firstRunStore";

const ItemsListWithInitialSync = ({
  filter,
  sorted,
}: {
  filter: ItemFilter;
  sorted: SortOption;
}) => {
  const [shouldFetchItems, setShouldFetchItems] = useState(false);
  const [isCheckingSync, setIsCheckingSync] = useState(true);
  const [isPerformingInitialSync, setIsPerformingInitialSync] = useState(false);
  const { syncEngine } = useSync();

  const {
    completedFirstSync,
    showPocketImport,
    isLoaded,
    setCompletedFirstSync,
    clearShowPocketImport,
  } = useFirstRunStore();

  const ObservableItemsPresenter = memo(
    ({
      items,
      archivedCount,
      originalFilter,
    }: {
      items: Item[];
      archivedCount?: number;
      originalFilter: ItemFilter;
    }) => {
      return <ItemsFlatList items={items} filter={originalFilter} archivedCount={archivedCount} />;
    },
  );
  ObservableItemsPresenter.displayName = "ObservableItemsPresenter";

  useEffect(() => {
    let isMounted = true;

    const performInitialSync = async () => {
      // Wait for store to be loaded from storage
      if (!isLoaded) {
        return;
      }

      try {
        const isFirstSync = !completedFirstSync;

        if (isFirstSync) {
          // For first sync: show UI, await sync, then show items
          if (isMounted) {
            setIsPerformingInitialSync(true);
            setIsCheckingSync(false);
          }

          await syncEngine.sync(true);
          setCompletedFirstSync(true);

          if (isMounted) {
            setShouldFetchItems(true);
          }

          // Check if we should show Pocket import prompt for new users
          if (showPocketImport) {
            // Remove the flag immediately to prevent showing again
            clearShowPocketImport();
            // Wait for main screen to load, then show import modal
            setTimeout(() => {
              router.push("/import-pocket");
            }, 500);
          }
        } else {
          // For subsequent syncs: start background sync, show items immediately
          syncEngine.sync(false).catch((error) => {
            console.error("Background sync failed:", error);
          });

          if (isMounted) {
            setShouldFetchItems(true);
          }
        }
      } catch (error) {
        console.error("Sync failed:", error);
        // Show items anyway to prevent blocking the app
        if (isMounted) {
          setShouldFetchItems(true);
        }
      } finally {
        if (isMounted) {
          setIsCheckingSync(false);
          setIsPerformingInitialSync(false);
        }
      }
    };

    performInitialSync();

    return () => {
      isMounted = false;
    };
  }, [
    isLoaded,
    completedFirstSync,
    showPocketImport,
    setCompletedFirstSync,
    clearShowPocketImport,
  ]);

  const DataConnectedPresenter = useMemo(() => {
    return withItems({ filter, sorted })(ObservableItemsPresenter);
  }, [filter, sorted]);

  if (isCheckingSync) {
    return null;
  }

  if (isPerformingInitialSync) {
    return <NoUIFound filter="initialSync" />;
  }

  if (!shouldFetchItems) {
    return null;
  }

  return <DataConnectedPresenter originalFilter={filter} />;
};

export default ItemsListWithInitialSync;
