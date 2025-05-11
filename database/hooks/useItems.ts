import { useState, useEffect } from "react";
import { Q } from "@nozbe/watermelondb";
import { Subscription } from "rxjs";
import Item from "../models/ItemModel";
import database from "../database";
import { ItemFilter } from "@/types/item";
import { SortOption } from "@/components/shared/menu/SortMenu";

const itemsCollection = database.collections.get<Item>("items");

export const useItems = (filter: ItemFilter = "all", sorted: SortOption = "newest"): Item[] => {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const sortDirection = sorted === "newest" ? Q.desc : Q.asc;
    let query;

    // Logic from withItems HOC to build the query
    if (filter === "favorites") {
      query = itemsCollection.query(
        Q.where("favorite", true),
        Q.where("archived", false),
        Q.sortBy("created_at", sortDirection),
      );
    } else if (filter === "archived") {
      query = itemsCollection.query(
        Q.where("archived", true),
        Q.sortBy("created_at", sortDirection),
      );
    } else if (filter === "tagged") {
      query = itemsCollection.query(
        Q.where("archived", false),
        Q.experimentalJoinTables(["item_tags"]),
        Q.on("item_tags", Q.where("tag_id", Q.notEq(null))),
        Q.sortBy("created_at", sortDirection),
      );
    } else if (filter === "short") {
      query = itemsCollection.query(
        Q.where("word_count", Q.lte(1040)), // 260wpm * 4min = 1040 words
        Q.where("archived", false),
        Q.sortBy("created_at", sortDirection),
      );
    } else if (filter === "long") {
      query = itemsCollection.query(
        Q.where("word_count", Q.gte(2600)), // 260wpm * 10min = 2600 words
        Q.where("archived", false),
        Q.sortBy("created_at", sortDirection),
      );
    } else {
      // Default to unarchived items ('all')
      query = itemsCollection.query(
        Q.where("archived", false),
        Q.sortBy("created_at", sortDirection),
      );
    }

    const subscription: Subscription = query.observe().subscribe(setItems);

    return () => {
      subscription.unsubscribe();
    };
  }, [filter, sorted]);

  return items;
};
