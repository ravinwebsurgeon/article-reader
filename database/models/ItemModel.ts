import { Model, Query, Q } from "@nozbe/watermelondb";
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
import Annotation from "./AnnotationModel";

export type DisplayMode = "reader" | "webview" | "error";

export enum ExtractStatus {
  PENDING = 0,
  EXTRACTING = 1,
  RETRYING = 2,
  COMPLETED = 3,
  FAILED = 4,
  UNAVAILABLE = 5,
  UNSUPPORTED = 6,
}

export enum ItemKind {
  WEBPAGE = 0,
  ARTICLE = 1,
  VIDEO = 2,
  PRODUCT = 3,
  HOMEPAGE = 4,
  RECIPE = 5,
}

export enum ItemCategory {
  UNKNOWN = -1,
  BUSINESS = 0,
  CAREER = 1,
  CULTURE = 2,
  DESIGN = 3,
  EDUCATION = 4,
  ENTERTAINMENT = 5,
  FOOD = 6,
  GAMING = 7,
  HEALTH_FITNESS = 8,
  PARENTING = 9,
  PERSONAL_FINANCE = 10,
  POLITICS = 11,
  PRODUCTIVITY = 12,
  PSYCHOLOGY = 13,
  RELATIONSHIPS = 14,
  SCIENCE = 15,
  SELF_IMPROVEMENT = 16,
  SPORTS = 17,
  STYLE = 18,
  TECHNOLOGY = 19,
  TRAVEL = 20,
}

export default class Item extends Model {
  static table = "items";

  static associations = {
    item_tags: { type: "has_many" as const, foreignKey: "item_id" },
    item_contents: { type: "has_many" as const, foreignKey: "item_id" },
    annotations: { type: "has_many" as const, foreignKey: "item_id" },
  };

  // Fields
  @text("url") url?: string;
  @readonly @text("canonical_url") canonicalUrl?: string | null;
  @readonly @text("domain") domain?: string | null;
  @readonly @text("title") title?: string | null;
  @readonly @text("site_name") siteName?: string | null;
  @readonly @text("image_url") imageUrl?: string | null;
  @readonly @date("published_at") publishedAt?: Date | null;
  @readonly @field("word_count") wordCount?: number | null;
  @readonly @text("content_hash") contentHash?: string | null;
  @readonly @field("kind") kind?: number | null;
  @readonly @text("custom_title") customTitle?: string | null;
  @readonly @field("category") category?: number | null;
  @readonly @field("clickbait") clickbait?: boolean | null;
  @readonly @field("paywalled") paywalled?: boolean | null;
  @readonly @text("language") language?: string | null;
  @readonly @field("extract_status") extractStatus?: number | null;
  @field("archived") archived?: boolean;
  @field("favorite") favorite?: boolean;
  @field("progress") progress?: number;
  @field("max_progress") maxProgress?: number | null;
  @field("viewed") viewed?: boolean;
  @text("notes") notes?: string | null;

  // Timestamps
  @readonly @date("created_at") createdAt?: Date;
  @readonly @date("updated_at") updatedAt?: Date;
  @date("saved_at") savedAt?: Date;

  // Relationships
  @children("item_tags") itemTags?: Query<ItemTag>;
  @children("item_contents") itemContentQuery?: Query<ItemContent>;
  @children("annotations") annotations?: Query<Annotation>;

  // Lazy loaded tags
  @lazy
  tags = this.collections.get<Tag>("tags").query(Q.on("item_tags", "item_id", this.id));

  // Computed properties
  get readTime(): number {
    if (!this.wordCount) return 0;
    return Math.ceil(this.wordCount / 260); // Assuming 260 words per minute
  }

  get source(): string | null {
    return this.siteName || this.domain || null;
  }

  // Content display logic helpers
  get hasSubstantialContent(): boolean {
    return (this.wordCount || 0) >= 150;
  }

  get isReadable(): boolean {
    if (!this.kind) return false; // Default to not readable if kind is null (probably WEBPAGE)

    // Videos should always use webview regardless of content
    if (this.kind === ItemKind.VIDEO) return false;

    // Traditional readable types are always readable
    if ([ItemKind.ARTICLE, ItemKind.RECIPE].includes(this.kind)) return true;

    // For other types, check if we have substantial content
    return this.hasSubstantialContent;
  }

  get isWebOnly(): boolean {
    const kind = this.kind || ItemKind.WEBPAGE;
    return [ItemKind.WEBPAGE, ItemKind.VIDEO, ItemKind.PRODUCT, ItemKind.HOMEPAGE].includes(kind);
  }

  get isPending(): boolean {
    return (
      this.extractStatus === ExtractStatus.PENDING ||
      this.extractStatus === ExtractStatus.EXTRACTING ||
      this.extractStatus === ExtractStatus.RETRYING
    );
  }

  getDisplayMode(content: ItemContent | null): DisplayMode {
    // Error cases first
    if (this.extractStatus === ExtractStatus.UNAVAILABLE) {
      return "error";
    }

    // FAILED extraction should show reader with error message first
    if (this.extractStatus === ExtractStatus.FAILED) {
      return "reader"; // Show reader view with error message and web view button
    }

    // WebView cases
    if (this.isPending) {
      return this.url ? "webview" : "error";
    }

    if (this.extractStatus === ExtractStatus.UNSUPPORTED) {
      return this.url ? "webview" : "error";
    }

    if (this.isWebOnly) {
      return this.url ? "webview" : "error";
    }

    // Reader cases
    if (this.extractStatus === ExtractStatus.COMPLETED && content?.content && this.isReadable) {
      return "reader";
    }

    // Fallback to webview if we have URL, otherwise error
    return this.url ? "webview" : "error";
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
    const clampedValue = Number(Math.min(1.0, Math.max(0.0, value)).toFixed(3));
    await this.update((item) => {
      item.progress = clampedValue;
      // Update maxProgress if this is the furthest we've scrolled
      if (
        item.maxProgress === null ||
        item.maxProgress === undefined ||
        clampedValue > item.maxProgress
      ) {
        item.maxProgress = clampedValue;
      }
    });
  }

  @writer async setViewed(value: boolean = true) {
    await this.update((item) => {
      item.viewed = value;
    });
  }

  @writer async setMaxProgress(value: number) {
    const clampedValue = Number(Math.min(1.0, Math.max(0.0, value)).toFixed(3));
    await this.update((item) => {
      item.maxProgress = clampedValue;
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
      if (itemTag.item) {
        itemTag.item.set(this);
      }
      if (itemTag.tag) {
        itemTag.tag.set(tag);
      }
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
    if (!this.itemTags) return;
    const itemTags = await this.itemTags.fetch();
    await Promise.all(itemTags.map((tag) => tag.markAsDeleted()));
  }
}
