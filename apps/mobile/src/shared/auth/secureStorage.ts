import * as SecureStore from 'expo-secure-store';

const KEY_PREFIX = 'teamzones';

const sanitizeKey = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, '.');

const buildKey = (key: string) => `${KEY_PREFIX}.${sanitizeKey(key)}`;

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(buildKey(key));
    } catch (error) {
      console.warn('Secure storage read failed', error);
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(buildKey(key), value);
    } catch (error) {
      console.warn('Secure storage write failed', error);
    }
  },
  async deleteItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(buildKey(key));
    } catch (error) {
      console.warn('Secure storage delete failed', error);
    }
  },
};
