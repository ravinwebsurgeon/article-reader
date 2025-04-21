// src/database/migrations/index.ts
import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

// Define your migrations
export default schemaMigrations({
  migrations: [
    // First migration - initial schema
    // {
    //   toVersion: 2,
    //   steps: [
    //     // No steps needed for initial schema
    //   ],
    // },
    // Future migrations go here (when needed)
    // {
    //   toVersion: 2,
    //   steps: [
    //     // For example, adding a new column to an existing table
    //     {
    //       type: 'addColumns',
    //       table: 'items',
    //       columns: [
    //         { name: 'new_field', type: 'string', isOptional: true }
    //       ]
    //     }
    //   ]
    // },
  ],
});