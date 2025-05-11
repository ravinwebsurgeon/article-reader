import { Model, Relation } from "@nozbe/watermelondb";
import { date, readonly, immutableRelation } from "@nozbe/watermelondb/decorators";
import Item from "./ItemModel";
import Tag from "./TagModel";

export default class ItemTag extends Model {
  static table = "item_tags";

  static associations = {
    items: { type: "belongs_to" as const, key: "item_id" },
    tags: { type: "belongs_to" as const, key: "tag_id" },
  };

  @immutableRelation("items", "item_id") item!: Relation<Item>;
  @immutableRelation("tags", "tag_id") tag!: Relation<Tag>;

  @readonly @date("created_at") createdAt!: Date;
  @readonly @date("updated_at") updatedAt!: Date;
}
