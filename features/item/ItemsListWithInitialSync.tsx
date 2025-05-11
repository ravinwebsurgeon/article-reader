import React, { useState, useMemo, memo, useEffect } from "react";
import NoUIFound from "@/components/shared/emptyState/NoUIFound";
import { syncEngine } from "@/database/sync/SyncEngine";
import { withItems } from "@/database/hooks/withItems";
import Item from "@/database/models/ItemModel";
import { ItemFilter } from "@/types/item";
import { SortOption } from "@/components/shared/menu/SortMenu";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ItemsFlatList from "@/components/item/ItemsFlatList";

const ItemsListWithInitialSync = ({
  filter,
  sorted,
}: {
  filter: ItemFilter;
  sorted: SortOption;
}) => {
  const [isInitialSync, setIsInitialSync] = useState(false);
  const [shouldFetchItems, setShouldFetchItems] = useState(false);
  const [isCheckingSync, setIsCheckingSync] = useState(true);

  const ObservableItemsPresenter = memo(
    ({ items, originalFilter }: { items: Item[]; originalFilter: ItemFilter }) => {
      return <ItemsFlatList items={items} filter={originalFilter} />;
    },
  );
  ObservableItemsPresenter.displayName = "ObservableItemsPresenter";

  useEffect(() => {
    let isMounted = true;
    const checkFirstSync = async () => {
      try {
        const isFirstSync = await AsyncStorage.getItem("already_synced");
        if (isMounted) {
          setIsInitialSync(!isFirstSync);
          if (!isFirstSync) {
            await syncEngine.sync(true);
            await AsyncStorage.setItem("already_synced", "true");
            if (isMounted) {
              setShouldFetchItems(true);
            }
          } else {
            setTimeout(() => {
              if (isMounted) {
                setShouldFetchItems(true);
              }
            }, 0);
            syncEngine.sync(false).catch((error) => {
              console.error("Background sync failed:", error);
            });
          }
        }
      } catch (error) {
        console.error("Sync failed:", error);
        if (isMounted) {
          setTimeout(() => {
            if (isMounted) {
              setShouldFetchItems(true);
            }
          }, 0);
        }
      } finally {
        if (isMounted) {
          setIsInitialSync(false);
          setIsCheckingSync(false);
        }
      }
    };
    checkFirstSync();
    return () => {
      isMounted = false;
    };
  }, []);

  const DataConnectedPresenter = useMemo(() => {
    return withItems({ filter, sorted })(ObservableItemsPresenter);
  }, [filter, sorted]);

  if (isCheckingSync || isInitialSync) {
    return <NoUIFound filter="initialSync" />;
  }

  if (!shouldFetchItems) {
    return null;
  }

  return <DataConnectedPresenter originalFilter={filter} />;
};

export default ItemsListWithInitialSync;
