import {database, deviceCollection, messageCollection} from './index';
import Device from './models/Device';
import Message from './models/Message';
import {Q} from '@nozbe/watermelondb';

class DatabaseService {
  // Device operations
  async saveDevice(
    deviceId: string,
    name: string | null,
    rssi: number | null,
  ): Promise<Device> {
    const existingDevices = await deviceCollection
      .query(Q.where('device_id', deviceId))
      .fetch();

    if (existingDevices.length > 0) {
      const device = existingDevices[0];
      return await database.write(async () => {
        return await device.update(record => {
          record.lastConnectedAt = new Date();
          if (name) {
            record.name = name;
          }
          if (rssi !== null) {
            record.rssi = rssi;
          }
        });
      });
    } else {
      return await database.write(async () => {
        return await deviceCollection.create(record => {
          record.deviceId = deviceId;
          record.name = name || 'Unknown Device';
          record.lastConnectedAt = new Date();
          record.createdAt = new Date();
          if (rssi !== null) {
            record.rssi = rssi;
          }
        });
      });
    }
  }

  async getDevices(): Promise<Device[]> {
    return await deviceCollection
      .query(Q.sortBy('last_connected_at', 'desc'))
      .fetch();
  }

  async getDeviceById(deviceId: string): Promise<Device | null> {
    const devices = await deviceCollection
      .query(Q.where('device_id', deviceId))
      .fetch();

    return devices.length > 0 ? devices[0] : null;
  }

  async setDeviceFavorite(
    deviceId: string,
    isFavorite: boolean,
  ): Promise<void> {
    const device = await this.getDeviceById(deviceId);
    if (device) {
      await database.write(async () => {
        await device.update(record => {
          record.isFavorite = isFavorite;
        });
      });
    }
  }

  async updateDeviceNotes(deviceId: string, notes: string): Promise<void> {
    const device = await this.getDeviceById(deviceId);
    if (device) {
      await database.write(async () => {
        await device.update(record => {
          record.notes = notes;
        });
      });
    }
  }

  async saveMessage(
    deviceId: string,
    content: string,
    isSentByMe: boolean,
    status: string = 'sent',
  ): Promise<Message> {
    return await database.write(async () => {
      return await messageCollection.create(record => {
        record.deviceId = deviceId;
        record.content = content;
        record.isSentByMe = isSentByMe;
        record.sentAt = new Date();
        record.status = status;
      });
    });
  }

  async getMessages(deviceId: string): Promise<Message[]> {
    return await messageCollection
      .query(Q.where('device_id', deviceId), Q.sortBy('sent_at', 'asc'))
      .fetch();
  }

  async updateMessageStatus(messageId: string, status: string): Promise<void> {
    const message = await messageCollection.find(messageId);
    await database.write(async () => {
      await message.update(record => {
        record.status = status;
      });
    });
  }

  async deleteAllMessages(deviceId: string): Promise<void> {
    const messages = await messageCollection
      .query(Q.where('device_id', deviceId))
      .fetch();

    await database.write(async () => {
      await Promise.all(messages.map(message => message.destroyPermanently()));
    });
  }
}

export default new DatabaseService();
