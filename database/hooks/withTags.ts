import { Q } from "@nozbe/watermelondb";
import { withObservables } from "@nozbe/watermelondb/react";
import { switchMap, map } from "rxjs/operators";
import { combineLatest, of as of$, Observable } from "rxjs";
import Tag from "../models/TagModel";
import Item from "../models/ItemModel";
import ItemTag from "../models/ItemTagModel";
import database from "@/database";

/**
 * Access to the tags collection in the WatermelonDB database
 */
export const tagsCollection = database.collections.get<Tag>("tags");

/**
 * Access to the item_tags collection (join table)
 */
export const itemTagsCollection = database.collections.get<ItemTag>("item_tags");

/**
 * Creates a new tag in the database.
 * @param name - The name of the tag to create.
 * @returns The newly created Tag instance.
 */
export const createTag = async (name: string): Promise<Tag> => {
  if (!name.trim()) {
    throw new Error("Tag name cannot be empty.");
  }
  // Consider checking for existing tag by name to prevent duplicates,
  // or let the UI/calling code handle this.
  return database.write(async () => {
    const newTag = await tagsCollection.create((tag) => {
      tag.name = name.trim();
    });
    return newTag;
  });
};

/**
 * Associates a tag with an item.
 * Creates an entry in the item_tags join table.
 * @param item - The Item instance.
 * @param tag - The Tag instance.
 */
export const addTagToItem = async (item: Item, tag: Tag): Promise<void> => {
  // Check if association already exists to prevent duplicates
  const existingAssociation = await itemTagsCollection
    .query(Q.where("item_id", item.id), Q.where("tag_id", tag.id))
    .fetch();

  if (existingAssociation.length > 0) {
    // Association already exists, do nothing or throw error
    console.log(`Tag '${tag.name}' is already associated with item '${item.id}'.`);
    return;
  }

  await item.addTag(tag);
};

/**
 * Disassociates a tag from an item.
 * Deletes the corresponding entry from the item_tags join table.
 * @param item - The Item instance.
 * @param tag - The Tag instance.
 */
export const removeTagFromItem = async (item: Item, tag: Tag): Promise<void> => {
  await database.write(async () => {
    const associations = await itemTagsCollection
      .query(Q.where("item_id", item.id), Q.where("tag_id", tag.id))
      .fetch();

    if (associations.length > 0) {
      // Typically, there should be only one such association
      for (const association of associations) {
        await association.destroyPermanently();
      }
    } else {
      console.warn(`No association found for item '${item.id}' and tag '${tag.name}'.`);
    }
  });
};

interface WithAllTagsOptions {
  sortBy?: keyof Tag | string; // Allow string for flexibility, though keyof Tag is safer
  sortDirection?: "asc" | "desc";
}

// interface WithAllTagsProps {
//   allTags: Tag[];
// }

/**
 * HOC that provides a reactive list of all tags.
 * @param options - Optional sorting parameters.
 * @returns A function that provides 'allTags' as a prop to components.
 */
export const withAllTags = ({
  sortBy = "name",
  sortDirection = "asc",
}: WithAllTagsOptions = {}) => {
  return withObservables<
    Record<string, unknown>, // Outer props, can be minimal if not used by getObservables directly
    { allTags: Observable<Tag[]> } // Shape of the object returned by getObservables callback
  >([], () => {
    const sortOrder = sortDirection === "asc" ? Q.asc : Q.desc;
    // Ensure sortBy is a valid column name for Tag model if using Q.sortBy
    // For simplicity, this example assumes 'name', 'createdAt', 'updatedAt' are valid.
    // A more robust solution might validate sortBy against Tag.columnNames
    let query = tagsCollection.query();
    if (sortBy === "name" || sortBy === "createdAt" || sortBy === "updatedAt") {
      query = tagsCollection.query(Q.sortBy(sortBy as keyof Tag, sortOrder));
    } else {
      // If sortBy is not a direct column, don't apply Q.sortBy to avoid errors.
      // Post-fetch sorting might be needed for complex cases or default to a known column.
      console.warn(
        `withAllTags: sortBy column '${sortBy}' is not directly supported for Q.sortBy. Defaulting to no specific sort or consider client-side sort.`,
      );
    }

    return {
      allTags: query.observe(),
    };
  });
};

interface WithItemTagsOuterProps {
  item: Item;
}

// interface WithItemTagsInnerProps {
//   itemTags: Tag[];
// }

/**
 * HOC that provides a reactive list of tags associated with a specific item.
 * @param options - Must contain the 'item' to observe tags for.
 * @returns A function that provides 'itemTags' (an array of Tag models) as a prop.
 */
export const withItemTags = () => {
  return withObservables<
    WithItemTagsOuterProps, // Outer props expected by this HOC (contains 'item')
    { itemTags: Observable<Tag[]> } // Shape of the object returned by getObservables callback
  >(["item"], (props: WithItemTagsOuterProps) => {
    const { item } = props;

    if (!item) {
      // If item is null or undefined, return an observable of an empty array
      return { itemTags: of$([] as Tag[]) };
    }

    const selectedTagsObservable = item.itemTags
      ? item.itemTags.observe().pipe(
          switchMap((itemTagModels: ItemTag[]) => {
            if (!itemTagModels || itemTagModels.length === 0) {
              return of$([] as Tag[]); // Emit empty array of Tags
            }
            // Create an array of observables, one for each tag
            const tagObservables = itemTagModels
              .map((itemTag) => (itemTag.tag ? itemTag.tag.observe() : undefined))
              .filter((obs): obs is Observable<Tag> => obs !== undefined);
            // Combine them: emits an array of Tags when all tagObservables have emitted
            return tagObservables.length > 0 ? combineLatest(tagObservables) : of$([] as Tag[]);
          }),
          map((tags) => tags.filter((tag) => !!tag) as Tag[]), // Ensure tags are truthy, changed from tag !== null
        )
      : of$([] as Tag[]);

    return {
      itemTags: selectedTagsObservable,
    };
  });
};
