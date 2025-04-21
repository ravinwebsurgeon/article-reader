import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { Platform } from 'react-native';


import migrations from './migration/index';
import { ItemModel } from './models/ItemModel';
import {  UserModel } from './models/UserModel';
import { schemas } from './schemas';
import { TagModel } from './models';

const adapter = new SQLiteAdapter({
  schema: schemas,
  migrations,
//   jsi: Platform.OS === 'ios', // Enable JSI on iOS for better performance
  jsi: false,
  onSetUpError: error => {
    console.error('Database setup error:', error);
  }
});

export const database = new Database({
  adapter,
  modelClasses: [
    ItemModel,
    // UserModel,
    // TagModel
  ],
});

export default database;