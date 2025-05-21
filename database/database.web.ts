import "react-native-get-random-values";
import { Database } from "@nozbe/watermelondb";
import migrations from "./migration/index";
import schema from "./schemas/schema";
import Item from "./models/ItemModel";
import Tag from "./models/TagModel";
import ItemTag from "./models/ItemTagModel";
import ItemContent from "./models/ItemContentModel";
import { setGenerator } from "@nozbe/watermelondb/utils/common/randomId";
import { ulid } from "ulid";

import LokiJSAdapter from "@nozbe/watermelondb/adapters/lokijs";

setGenerator(() => ulid());

const adapter = new LokiJSAdapter({
  schema,
  migrations,
  useWebWorker: false,
  useIncrementalIndexedDB: true,
  onQuotaExceededError: (error) => {
    console.error("Quota exceeded:", error);
  },
  onSetUpError: (error) => {
    console.error("Database setup error:", error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [Item, Tag, ItemTag, ItemContent],
});

export default database;
