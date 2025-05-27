// database/hooks/withAnnotations.ts
import { Q } from "@nozbe/watermelondb";
import { withObservables } from "@nozbe/watermelondb/react";
import { Observable } from "rxjs";
import Annotation from "../models/AnnotationModel";
import Item from "../models/ItemModel";
import database from "@/database";

/**
 * Access to the annotations collection
 */
const annotationsCollection = database.collections.get<Annotation>("annotations");

/**
 * Creates an annotation for an item
 */
export const createAnnotation = async (
  itemId: string,
  text: string,
  prefix: string,
  suffix: string,
  note?: string
): Promise<Annotation> => {
  return database.write(async () => {
    const item = await database.get<Item>("items").find(itemId);
    
    const newAnnotation = await annotationsCollection.create((annotation) => {
      if (annotation.item) {
        annotation.item.set(item);
      }
      annotation.text = text;
      annotation.prefix = prefix;
      annotation.suffix = suffix;
      annotation.note = note || null;
    });
    
    return newAnnotation;
  });
};

/**
 * Deletes an annotation
 */
export const deleteAnnotation = async (annotation: Annotation) => {
  return database.write(async () => {
    await annotation.markAsDeleted();
  });
};

/**
 * Updates an annotation's note
 */
export const updateAnnotationNote = async (annotation: Annotation, note: string) => {
  return database.write(async () => {
    await annotation.update((a) => {
      a.note = note;
    });
  });
};

interface WithItemAnnotationsProps {
  item: Item;
}

/**
 * HOC that provides a reactive list of annotations for a specific item
 */
export const withItemAnnotations = () => {
  return withObservables<
    WithItemAnnotationsProps,
    { annotations: Observable<Annotation[]> }
  >(["item"], ({ item }: WithItemAnnotationsProps) => {
    if (!item) {
      return { annotations: new Observable(subscriber => subscriber.next([])) };
    }

    const annotations = annotationsCollection
      .query(Q.where("item_id", item.id), Q.sortBy("created_at", Q.asc))
      .observe();

    return {
      annotations,
    };
  });
};