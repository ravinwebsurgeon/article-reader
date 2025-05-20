import { Model, Query, Relation } from "@nozbe/watermelondb";
import {
  field,
  date,
  readonly,
  text,
  children,
  writer,
  lazy,
} from "@nozbe/watermelondb/decorators";
import ItemTag from "./ItemTagModel";
import Tag from "./TagModel";
import ItemContent from "./ItemContentModel";
import { Q } from "@nozbe/watermelondb";

export default class Item extends Model {
  static table = "items";

  static associations = {
    item_tags: { type: "has_many" as const, foreignKey: "item_id" },
    item_contents: { type: "has_many" as const, foreignKey: "item_id" },
  };

  // Fields
  @text("url") url!: string;
  @readonly @text("canonical_url") canonicalUrl?: string | null;
  @readonly @text("domain") domain?: string | null;
  @readonly @text("title") title?: string | null;
  @readonly @text("site_name") siteName?: string | null;
  @readonly @text("image_url") imageUrl?: string | null;
  @readonly @text("image_thumb_hash") imageThumbHash?: string | null;
  @readonly @date("published_at") publishedAt?: Date | null;
  @readonly @field("word_count") wordCount?: number | null;
  @readonly @text("content_hash") contentHash?: string | null;
  @readonly @text("kind") kind?: string | null;
  @readonly @text("custom_title") customTitle?: string | null;
  @readonly @text("category") category?: string | null;
  @readonly @field("clickbait") clickbait?: boolean | null;
  @field("archived") archived!: boolean;
  @field("favorite") favorite!: boolean;
  @field("progress") progress!: number;
  @field("viewed") viewed!: boolean;
  @text("notes") notes?: string | null;

  // Timestamps
  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
  @date("saved_at") savedAt!: Date;

  // Relationships
  @children("item_tags") itemTags!: Query<ItemTag>;
  @children("item_contents") itemContentQuery!: Query<ItemContent>;

  // Lazy loaded tags
  @lazy
  tags = this.collections.get<Tag>("item_tags").query();

  // Computed properties
  get readTime(): number {
    if (!this.wordCount) return 0;
    return Math.ceil(this.wordCount / 260); // Assuming 200 words per minute
  }

  get source(): string | null {
    return this.siteName || this.domain || null;
  }

  // Writer methods
  @writer async toggleArchived() {
    await this.update((item) => {
      item.archived = !item.archived;
    });
  }

  @writer async toggleFavorite() {
    await this.update((item) => {
      item.favorite = !item.favorite;
    });
  }

  @writer async setProgress(value: number) {
    await this.update((item) => {
      item.progress = value;
    });
  }

  @writer async setNotes(value: string) {
    await this.update((item) => {
      item.notes = value;
    });
  }

  // Tag methods
  @writer async addTag(tag: Tag) {
    const itemTagsCollection = this.collections.get<ItemTag>("item_tags");
    await itemTagsCollection.create((itemTag) => {
      itemTag.item.set(this);
      itemTag.tag.set(tag);
    });
  }

  @writer async removeTag(tag: Tag) {
    const itemTag = await this.collections
      .get<ItemTag>("item_tags")
      .query(Q.and(Q.where("item_id", this.id), Q.where("tag_id", tag.id)))
      .fetch();

    if (itemTag.length > 0) {
      await itemTag[0].markAsDeleted();
    }
  }

  @writer async removeAllTags() {
    const itemTags = await this.itemTags.fetch();
    await Promise.all(itemTags.map((tag) => tag.markAsDeleted()));
  }
}
