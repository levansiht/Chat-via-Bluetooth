import {Model} from '@nozbe/watermelondb';
import {
  field,
  date,
  readonly,
  text,
  children,
} from '@nozbe/watermelondb/decorators';
import {Associations} from '@nozbe/watermelondb/Model';

export default class Device extends Model {
  static table = 'devices';
  static associations: Associations = {
    messages: {type: 'has_many', foreignKey: 'device_id'},
  };

  @text('device_id') deviceId!: string;
  @text('name') name!: string;
  @date('last_connected_at') lastConnectedAt!: Date;
  @field('rssi') rssi?: number;
  @field('is_favorite') isFavorite?: boolean;
  @text('notes') notes?: string;
  @readonly @date('created_at') createdAt!: Date;

  get formattedLastConnected(): string {
    if (!this.lastConnectedAt) {
      return 'Never';
    }

    return this.lastConnectedAt.toLocaleString();
  }
}
