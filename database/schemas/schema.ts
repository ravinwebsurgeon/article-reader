import { appSchema, tableSchema } from '@nozbe/watermelondb';

/**
 * Database schema definition
 */
export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'items',
      columns: [
        { name: 'url', type: 'string' },
        { name: 'canonical_url', type: 'string', isOptional: true },
        { name: 'domain', type: 'string', isOptional: true },
        { name: 'title', type: 'string', isOptional: true },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'site_name', type: 'string', isOptional: true },
        { name: 'image_url', type: 'string', isOptional: true },
        { name: 'published_at', type: 'number', isOptional: true },
        { name: 'word_count', type: 'number', isOptional: true },
        { name: 'archived', type: 'boolean' },
        { name: 'favorite', type: 'boolean' },
        { name: 'progress', type: 'number', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'tags',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'item_tags',
      columns: [
        { name: 'item_id', type: 'string', isIndexed: true },
        { name: 'tag_id', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
