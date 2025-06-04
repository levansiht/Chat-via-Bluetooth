import {Database} from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import {schema} from './schema';
import {Device, Message} from './models';
import {Platform} from 'react-native';

// Create the adapter
const adapter = new SQLiteAdapter({
  schema,
  // Use the same database file for development
  dbName: 'bleChatApp',
  // Optional: migrations
  // migrations: [],
  // Optional: synchronous mode only works on Android
  jsi: Platform.OS === 'android',
  onSetUpError: error => {
    console.error('Database setup error:', error);
  },
});

// Create the database
export const database = new Database({
  adapter,
  modelClasses: [Device, Message],
});

// Collections for ease of use
export const deviceCollection = database.get<Device>('devices');
export const messageCollection = database.get<Message>('messages');
