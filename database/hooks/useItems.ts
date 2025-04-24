// src/database/hooks/useItems.ts
import { useDatabase } from "../provider/DatabaseProvider";
import { Q } from "@nozbe/watermelondb";
import { withObservables } from "@nozbe/watermelondb/react";
import { useEffect, useState } from "react";
import Item from "../models/ItemModel";
import database from "../database";

const itemsCollection = database.collections.get("items");
// Hook to get filtered items
export const useItems = async (filter?: string) => {
  const database = useDatabase();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    let query;
    if (filter === "favorites") {
      query = itemsCollection.query(
        Q.where("favorite", true),
        Q.where("archived", false)
      );
    } else if (filter === "archived") {
      query = itemsCollection.query(Q.where("archived", true));
    } else if (filter === "tagged") {
      // This would need to be implemented with a join
      query = itemsCollection.query(
        Q.unsafeSqlQuery(
          "SELECT items.* FROM items JOIN item_tags ON items.id = item_tags.item_id"
        )
      );
    } else if (filter === "short") {
      query = itemsCollection.query(
        Q.where("word_count", Q.lessThanOrEqual(800)),
        Q.where("archived", false)
      );
    } else if (filter === "long") {
      query = itemsCollection.query(
        Q.where("word_count", Q.greaterThan(800)),
        Q.where("archived", false)
      );
    } else {
      // Default to unarchived items
      query = itemsCollection.query(Q.where("archived", false));
    }

    const subscription = query.observe().subscribe(
      (newItems) => {
        setItems(newItems);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error observing items:", error);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [filter, database]);

  return { items, isLoading };
};

// Create a new item
export const createItem = async (url: string) => {
  return database.write(async () => {
    const newItem = await itemsCollection.create((item) => {
      item.url = url;
      item.archived = false;
      item.favorite = false;
      item.progress = 0;
    });

    return newItem;
  });
};

// Update item properties
export const updateItem = async (
  id: string,
  data: Partial<{
    favorite: boolean;
    archived: boolean;
    progress: number;
    notes: string;
  }>
) => {
  return database.write(async () => {
    const item = await itemsCollection.find(id);
    return item.update((record) => {
      if (data.favorite !== undefined) record.favorite = data.favorite;
      if (data.archived !== undefined) record.archived = data.archived;
      if (data.progress !== undefined) record.progress = data.progress;
      if (data.notes !== undefined) record.notes = data.notes;
    });
  });
};

// Delete an item
export const deleteItem = async (id: string) => {
  return database.write(async () => {
    const item = await itemsCollection.find(id);
    await item.markAsDeleted();
  });
};

// Search items
export const searchItems = (query: string) => {
  const searchTerm = query.toLowerCase();

  return itemsCollection
    .query(
      Q.or(
        Q.where("title", Q.like(`%${searchTerm}%`)),
        Q.where("description", Q.like(`%${searchTerm}%`)),
        Q.where("url", Q.like(`%${searchTerm}%`)),
        Q.where("site_name", Q.like(`%${searchTerm}%`))
      )
    )
    .fetch();
};

// HOC to observe a single item
export const withItem = (id: string) => {
  return withObservables(["id"], () => ({
    item: itemsCollection.findAndObserve(id),
  }));
};
