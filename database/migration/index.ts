// src/database/migrations/index.ts
import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

// Define your database migrations here
export default schemaMigrations({
  migrations: [
    // Example migration for future reference
    /*
    {
      toVersion: 2,
      steps: [
        // Add new columns
        createTable({
          name: 'new_table',
          columns: [
            { name: 'id', type: 'string', isIndexed: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
        // Add new columns to existing tables
        addColumns({
          table: 'items',
          columns: [
            { name: 'new_field', type: 'string', isOptional: true },
          ],
        }),
      ],
    },
    */
  ],
});