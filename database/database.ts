import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";
import migrations from "./migration/index";
import schema from './schemas/schema';
import Item from './models/ItemModel';
import Tag from './models/TagModel';
import ItemTag from './models/ItemTagModel';


// Initialize the database
const adapter = new SQLiteAdapter({
  schema,
  migrations,
  jsi: true, // Enable JSI for better performance (optional)
  onSetUpError: error => {
    console.error('Database setup error:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [Item, Tag, ItemTag],
});

export default database;
