import { Model, Query } from '@nozbe/watermelondb';
import {
  field,
  date,
  readonly,
  text,
  children,
  writer,
  lazy,
} from '@nozbe/watermelondb/decorators';
import ItemTag from './ItemTagModel';
import Tag from './TagModel';
import { Q } from '@nozbe/watermelondb';

export default class Item extends Model {
  static table = 'items';

  static associations = {
    item_tags: { type: 'has_many' as const, foreignKey: 'item_id' },
  };

  // Fields
  @text('url') url!: string;
  @readonly @text('canonical_url') canonicalUrl?: string | null;
  @readonly @text('domain') domain?: string | null;
  @readonly @text('title') title?: string | null;
  @readonly @text('description') description?: string | null;
  @readonly @text('site_name') siteName?: string | null;
  @readonly @text('image_url') imageUrl?: string | null;
  @readonly @text('image_thumb_hash') imageThumbHash?: string | null;
  @readonly @date('published_at') publishedAt?: Date | null;
  @readonly @field('word_count') wordCount?: number | null;
  @readonly @text('content') content?: string | null;
  @field('archived') archived!: boolean;
  @field('favorite') favorite!: boolean;
  @field('progress') progress!: number;
  @field('viewed') viewed!: boolean;
  @text('notes') notes?: string | null;

  // Timestamps
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  @date('saved_at') savedAt!: Date;

  // Relationships
  @children('item_tags') itemTags!: Query<ItemTag>;

  // Lazy loaded tags
  @lazy
  tags = this.collections.get<Tag>('item_tags').query();

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
    await this.collections.get<ItemTag>('item_tags').create((itemTag) => {
      itemTag.item = this;
      itemTag.tag = tag;
    });
  }

  @writer async removeTag(tag: Tag) {
    const itemTag = await this.collections
      .get<ItemTag>('item_tags')
      .query(Q.and(Q.where('item_id', this.id), Q.where('tag_id', tag.id)))
      .fetch();

    if (itemTag.length > 0) {
      await itemTag[0].destroyPermanently();
    }
  }

  @writer async removeAllTags() {
    const itemTags = await this.itemTags.fetch();
    await Promise.all(itemTags.map((tag) => tag.destroyPermanently()));
  }
}
