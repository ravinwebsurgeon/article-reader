// src/database/models/ItemTag.ts
import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';

export default class ItemTag extends Model {
  static table = 'item_tags';
  
  @relation('items', 'item_id') item;
  @relation('tags', 'tag_id') tag;
  
  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;
}