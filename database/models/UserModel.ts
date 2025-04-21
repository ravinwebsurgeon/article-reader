// src/database/models/UserModel.ts
import { Model, Query } from "@nozbe/watermelondb";
import { field, date, children, text } from "@nozbe/watermelondb/decorators";
import { associations } from "@nozbe/watermelondb/Model";
import { ItemModel } from "./ItemModel";

export class UserModel extends Model {
  static table = "users";

  static associations = associations([
    { type: "has_many", foreignKey: "user_id" },
  ]);

  @text("name") name!: string;
  @text("email") email!: string;
  @text("avatar") avatar?: string;
  @text("remote_id") remoteId!: string;
  @date("created_at") createdAt!: Date;
  @date("updated_at") updatedAt!: Date;

  @children("items") items!: Query<ItemModel>;
}

