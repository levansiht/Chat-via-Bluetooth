import {appSchema, tableSchema} from '@nozbe/watermelondb';

export const DeviceSchema = tableSchema({
  name: 'devices',
  columns: [
    {name: 'device_id', type: 'string', isIndexed: true},
    {name: 'name', type: 'string'},
    {name: 'last_connected_at', type: 'number'},
    {name: 'rssi', type: 'number', isOptional: true},
    {name: 'is_favorite', type: 'boolean', isOptional: true},
    {name: 'notes', type: 'string', isOptional: true},
    {name: 'created_at', type: 'number'},
  ],
});

export const MessageSchema = tableSchema({
  name: 'messages',
  columns: [
    {name: 'device_id', type: 'string', isIndexed: true},
    {name: 'content', type: 'string'},
    {name: 'is_sent_by_me', type: 'boolean'},
    {name: 'sent_at', type: 'number'},
    {name: 'status', type: 'string', isOptional: true},
  ],
});

export const schema = appSchema({
  version: 1,
  tables: [DeviceSchema, MessageSchema],
});
