// src/database/schemas/index.ts
import { appSchema, tableSchema } from "@nozbe/watermelondb";

const tableSchemas = [
  tableSchema({
    name: "items",
    columns: [
      { name: "title", type: "string" },
      { name: "content", type: "string", isOptional: true },
      { name: "url", type: "string", isOptional: true },
      { name: "favorite", type: "boolean" },
      { name: "archived", type: "boolean" },
      { name: "created_at", type: "number" },
      { name: "updated_at", type: "number" },
      { name: "synced", type: "boolean" }, // Track sync status
      { name: "remote_id", type: "string", isOptional: true }, // ID from the API
      { name: "user_id", type: "string" }, // Foreign key to user
    ],
  }),

  // Users table schema
  tableSchema({
    name: "users",
    columns: [
      { name: "name", type: "string" },
      { name: "email", type: "string" },
      { name: "avatar", type: "string", isOptional: true },
      { name: "remote_id", type: "string" }, // ID from the API
      { name: "created_at", type: "number" },
      { name: "updated_at", type: "number" },
    ],
  }),

  // Tags table schema
  tableSchema({
    name: "tags",
    columns: [
      { name: "name", type: "string" },
      { name: "remote_id", type: "string", isOptional: true }, // ID from the API
      { name: "created_at", type: "number" },
      { name: "updated_at", type: "number" },
      { name: "synced", type: "boolean" }, // Track sync status
    ],
  }),

  // ItemTags relation table schema
  tableSchema({
    name: "item_tags",
    columns: [
      { name: "item_id", type: "string", isIndexed: true },
      { name: "tag_id", type: "string", isIndexed: true },
      { name: "created_at", type: "number" },
    ],
  }),
];

// Define the database schema
export const schemas = appSchema({
  version: 1,
  tables: tableSchemas,
});

// Export individual table schemas for more targeted imports
export const itemsSchema = tableSchemas.find((table) => table.name === "items");
export const usersSchema = tableSchemas.find((table) => table.name === "users");
export const tagsSchema = tableSchemas.find((table) => table.name === "tags");
export const itemTagsSchema = tableSchemas.find(
  (table) => table.name === "item_tags"
);
