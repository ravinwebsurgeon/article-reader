// src/database/models/ItemModel.ts
import { Model, Query, Relation } from "@nozbe/watermelondb";
import {
  field,
  date,
  relation,
  children,
  text,
} from "@nozbe/watermelondb/decorators";
import { associations } from "@nozbe/watermelondb/Model";
import { UserModel } from "./UserModel";
import { ItemTagModel } from "./ItemTagModel";

export class ItemModel extends Model {
  static table = "items";

  static associations = associations([
    "item_tags",
    { type: "belongs_to", key: "user_id", foreignKey: "id" },
  ]);

  @text("title") title!: string;
  @text("content") content?: string;
  @text("url") url?: string;
  @field("favorite") favorite!: boolean;
  @field("archived") archived!: boolean;
  @date("created_at") createdAt!: Date;
  @date("updated_at") updatedAt!: Date;
  @field("synced") synced!: boolean;
  @text("remote_id") remoteId?: string;
  @text("user_id") userId!: string;

  @relation("users", "user_id") user!: Relation<UserModel>;
  @children("item_tags") itemTags!: Query<ItemTagModel>;

  // Helper getter to fetch all related tags
  async tags() {
    const itemTags = await this.itemTags.fetch();
    return Promise.all(
      itemTags.map(async (itemTag) => {
        return await itemTag.tag.fetch();
      })
    );
  }

  // Prepare for synchronization with the API
  prepareForSync() {
    return {
      id: this.remoteId,
      title: this.title,
      content: this.content,
      url: this.url,
      favorite: this.favorite,
      archived: this.archived,
      created_at: this.createdAt.toISOString(),
      updated_at: this.updatedAt.toISOString(),
    };
  }
}




