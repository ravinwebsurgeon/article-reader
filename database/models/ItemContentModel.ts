import { Model, Relation } from "@nozbe/watermelondb";
import { date, readonly, text, immutableRelation } from "@nozbe/watermelondb/decorators";
import Item from "./ItemModel";

export default class ItemContent extends Model {
  static table = "item_contents";

  static associations = {
    items: { type: "belongs_to" as const, key: "item_id" },
  };

  // Fields
  @text("content") content?: string | null;
  @text("content_hash") contentHash?: string | null;
  @text("takeaways") takeaways?: string | null;
  @text("description") description?: string | null;
  @text("author") author?: string | null;

  // Timestamps
  @readonly @date("created_at") createdAt?: Date;
  @readonly @date("updated_at") updatedAt?: Date;

  // Relationships
  @immutableRelation("items", "item_id") item?: Relation<Item>;

  // Virtual/computed fields
  get dek(): string | null {
    if (!this.description) return null;

    // Only return descriptions that end with a single period
    if (this.description.endsWith(".") && !this.description.endsWith("..")) {
      return this.description;
    }

    return null;
  }
}
