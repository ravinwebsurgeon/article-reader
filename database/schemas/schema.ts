import { appSchema, tableSchema } from "@nozbe/watermelondb";

/**
 * Database schema definition
 */
export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: "items",
      columns: [
        { name: "url", type: "string" },
        { name: "canonical_url", type: "string", isOptional: true },
        { name: "domain", type: "string", isOptional: true },
        { name: "title", type: "string", isOptional: true },
        { name: "site_name", type: "string", isOptional: true },
        { name: "image_url", type: "string", isOptional: true },
        { name: "published_at", type: "number", isOptional: true },
        { name: "word_count", type: "number", isOptional: true, isIndexed: true },
        { name: "content_hash", type: "string", isOptional: true },
        { name: "kind", type: "string", isOptional: true },
        { name: "custom_title", type: "string", isOptional: true },
        { name: "category", type: "string", isOptional: true },
        { name: "clickbait", type: "boolean", isOptional: true },
        { name: "archived", type: "boolean", isIndexed: true },
        { name: "favorite", type: "boolean", isIndexed: true },
        { name: "progress", type: "number" },
        { name: "notes", type: "string", isOptional: true },
        { name: "viewed", type: "boolean" },
        { name: "saved_at", type: "number" },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "item_contents",
      columns: [
        { name: "item_id", type: "string", isIndexed: true },
        { name: "content", type: "string", isOptional: true },
        { name: "content_hash", type: "string", isOptional: true, isIndexed: true },
        { name: "takeaways", type: "string", isOptional: true },
        { name: "description", type: "string", isOptional: true },
        { name: "dek", type: "string", isOptional: true },
        { name: "author", type: "string", isOptional: true },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "tags",
      columns: [
        { name: "name", type: "string", isIndexed: true },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "item_tags",
      columns: [
        { name: "item_id", type: "string", isIndexed: true },
        { name: "tag_id", type: "string", isIndexed: true },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "annotations",
      columns: [
        { name: "item_id", type: "string", isIndexed: true },
        { name: "text", type: "string" },
        { name: "prefix", type: "string" },
        { name: "suffix", type: "string" },
        { name: "note", type: "string", isOptional: true },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
  ],
});
