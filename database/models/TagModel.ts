import { Model, Query } from '@nozbe/watermelondb';
import { date, readonly, text, children } from '@nozbe/watermelondb/decorators';
import ItemTag from './ItemTagModel';

export default class Tag extends Model {
  static table = 'tags';

  static associations = {
    item_tags: { type: 'has_many' as const, foreignKey: 'tag_id' },
  };

  @text('name') name!: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @children('item_tags') itemTags!: Query<ItemTag>;
}
