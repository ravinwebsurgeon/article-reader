import { Database } from "@nozbe/watermelondb";
import "react-native-get-random-values";
import { setGenerator } from "@nozbe/watermelondb/utils/common/randomId";
import { ulid } from "ulid";
import schema from "./schemas/schema";
import migrations from "./migration";
import Item from "./models/ItemModel";
import Tag from "./models/TagModel";
import ItemTag from "./models/ItemTagModel";
import ItemContent from "./models/ItemContentModel";
import { getAdapter } from "./adapter";

setGenerator(() => ulid());

let adapter = getAdapter(schema, migrations);

const database = new Database({
  adapter,
  modelClasses: [Item, Tag, ItemTag, ItemContent],
});

export default database;
