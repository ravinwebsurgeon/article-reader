// src/database/models/ItemTagModel.ts
import { Model, Relation } from "@nozbe/watermelondb";
import { field, date, relation, text } from "@nozbe/watermelondb/decorators";
import { associations } from "@nozbe/watermelondb/Model";
import { ItemModel } from "./ItemModel";
import { TagModel } from "./TagModel";

export class ItemTagModel extends Model {
  static table = "item_tags";

  static associations = associations([
    { type: "belongs_to", key: "item_id", foreignKey: "id" },
    { type: "belongs_to", key: "tag_id", foreignKey: "id" },
  ]);

  @text("item_id") itemId!: string;
  @text("tag_id") tagId!: string;
  @date("created_at") createdAt!: Date;

  @relation("items", "item_id") item!: Relation<ItemModel>;
  @relation("tags", "tag_id") tag!: Relation<TagModel>;
}

