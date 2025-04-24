// src/database/models/Item.ts
import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, text, relation, children } from '@nozbe/watermelondb/decorators';

export default class Item extends Model {
  static table = 'items';
  
  // Fields
  @text('url') url;
  @text('canonical_url') canonicalUrl;
  @text('domain') domain;
  @text('title') title;
  @text('description') description;
  @text('site_name') siteName;
  @text('image_url') imageUrl;
  @date('published_at') publishedAt;
  @field('word_count') wordCount;
  @field('archived') archived;
  @field('favorite') favorite;
  @field('progress') progress;
  @text('notes') notes;
  
  // Timestamps
  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;
  
  // Relationships
  @children('item_tags') itemTags;
  
  // Computed properties
  get readTime() {
    if (!this.wordCount) return 0;
    return Math.ceil(this.wordCount / 200); // Assuming 200 words per minute
  }
  
  // Helper methods to sync with Item type expected by components
  toJSON() {
    return {
      id: this.id,
      url: this.url,
      title: this.title || '',
      description: this.description || '',
      site_name: this.siteName || '',
      source: this.siteName || this.domain || '',
      image_url: this.imageUrl,
      readTime: this.readTime,
      favorite: this.favorite,
      archived: this.archived,
      progress: this.progress || 0,
      // Convert relationships as needed
      tags: [], // This would need to be populated from itemTags
    };
  }
}