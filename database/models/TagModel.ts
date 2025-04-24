// src/database/models/Tag.ts
import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, text, children } from '@nozbe/watermelondb/decorators';

export default class Tag extends Model {
  static table = 'tags';
  
  @text('name') name;
  
  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;
  
  @children('item_tags') itemTags;
}