import { Model, Query } from '@nozbe/watermelondb';
import { field, date, readonly, text, children, writer } from '@nozbe/watermelondb/decorators';
import ItemTag from './ItemTagModel';

export default class Item extends Model {
  static table = 'items';

  static associations = {
    item_tags: { type: 'has_many' as const, foreignKey: 'item_id' },
  };

  // Fields
  @text('url') url!: string;
  @text('canonical_url') canonicalUrl?: string | null;
  @text('domain') domain?: string | null;
  @text('title') title?: string | null;
  @text('description') description?: string | null;
  @text('site_name') siteName?: string | null;
  @text('image_url') imageUrl?: string | null;
  @date('published_at') publishedAt?: Date | null;
  @field('word_count') wordCount?: number | null;
  @field('archived') archived!: boolean;
  @field('favorite') favorite!: boolean;
  @field('progress') progress!: number;
  @text('notes') notes?: string | null;

  // Timestamps
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Relationships
  @children('item_tags') itemTags!: Query<ItemTag>;

  // Computed properties
  get readTime(): number {
    if (!this.wordCount) return 0;
    return Math.ceil(this.wordCount / 200); // Assuming 200 words per minute
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
}
