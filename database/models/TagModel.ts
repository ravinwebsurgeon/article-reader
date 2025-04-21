// src/database/models/TagModel.ts
import { Model, Query } from "@nozbe/watermelondb";
import {
  field,
  date,
  children,
  text,
} from "@nozbe/watermelondb/decorators";
import { associations } from "@nozbe/watermelondb/Model";
import { ItemTagModel } from "./ItemTagModel";

export class TagModel extends Model {
  static table = "tags";

  static associations = associations(["item_tags"]);

  @text("name") name!: string;
  @text("remote_id") remoteId?: string;
  @date("created_at") createdAt!: Date;
  @date("updated_at") updatedAt!: Date;
  @field("synced") synced!: boolean;

  @children("item_tags") itemTags!: Query<ItemTagModel>;

  // Helper getter to fetch all related items
  async items() {
    const itemTags = await this.itemTags.fetch();
    return Promise.all(
      itemTags.map(async (itemTag) => {
        return await itemTag.item.fetch();
      })
    );
  }
}