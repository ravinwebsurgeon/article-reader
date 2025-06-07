import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";
import { SchemaMigrations } from "@nozbe/watermelondb/Schema/migrations";
import { AppSchema } from "@nozbe/watermelondb";

export function getAdapter(schema: AppSchema, migrations: SchemaMigrations) {
  return new SQLiteAdapter({
    schema,
    migrations,
    jsi: true,
    onSetUpError: (error) => {
      console.error("Database setup error:", error);
    },
  });
}
