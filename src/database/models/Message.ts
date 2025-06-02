import {Model} from '@nozbe/watermelondb';
import {
  field,
  date,
  readonly,
  text,
  relation,
} from '@nozbe/watermelondb/decorators';
import {Associations} from '@nozbe/watermelondb/Model';

export default class Message extends Model {
  static table = 'messages';
  static associations: Associations = {
    devices: {type: 'belongs_to', key: 'device_id'},
  };

  @text('device_id') deviceId!: string;
  @text('content') content!: string;
  @field('is_sent_by_me') isSentByMe!: boolean;
  @date('sent_at') sentAt!: Date;
  @text('status') status?: string;

  get formattedTime(): string {
    return this.sentAt.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  get formattedDate(): string {
    const today = new Date();
    const messageDate = this.sentAt;

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    }

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return messageDate.toLocaleDateString();
  }
}
