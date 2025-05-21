import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";

export function getAdapter(schema, migrations) {
  return new SQLiteAdapter({
    schema,
    migrations,
    jsi: true, 
    onSetUpError: (error) => {
      console.error("Database setup error:", error);
    },
  });
}
