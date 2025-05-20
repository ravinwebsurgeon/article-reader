import "react-native-get-random-values";
import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";
import migrations from "./migration/index";
import schema from "./schemas/schema";
import Item from "./models/ItemModel";
import Tag from "./models/TagModel";
import ItemTag from "./models/ItemTagModel";
import ItemContent from "./models/ItemContentModel";
import { setGenerator } from "@nozbe/watermelondb/utils/common/randomId";
import { ulid } from "ulid";

// Use ULID for database IDs
setGenerator(() => ulid());

// Initialize the database
const adapter = new SQLiteAdapter({
  schema,
  migrations,
  jsi: true, // Enable JSI for better performance (optional)
  onSetUpError: (error) => {
    console.error("Database setup error:", error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [Item, Tag, ItemTag, ItemContent],
});

export default database;
