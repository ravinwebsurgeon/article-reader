import { Model } from '@nozbe/watermelondb';
import { date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Item from './ItemModel';
import Tag from './TagModel';

export default class ItemTag extends Model {
  static table = 'item_tags';

  static associations = {
    items: { type: 'belongs_to' as const, key: 'item_id' },
    tags: { type: 'belongs_to' as const, key: 'tag_id' },
  };

  @relation('items', 'item_id') item!: Item;
  @relation('tags', 'tag_id') tag!: Tag;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
