import { Model, Relation } from "@nozbe/watermelondb";
import { date, readonly, text, immutableRelation } from "@nozbe/watermelondb/decorators";
import Item from "./ItemModel";

export default class Annotation extends Model {
  static table = "annotations";

  static associations = {
    items: { type: "belongs_to" as const, key: "item_id" },
  };

  // Fields
  @text("text") text?: string;
  @text("prefix") prefix?: string;
  @text("suffix") suffix?: string;
  @text("note") note?: string | null;

  // Timestamps
  @readonly @date("created_at") createdAt?: Date;
  @readonly @date("updated_at") updatedAt?: Date;

  // Relationships
  @immutableRelation("items", "item_id") item?: Relation<Item>;
}
