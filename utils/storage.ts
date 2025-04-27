import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Wrapper for AsyncStorage with type safety and error handling
 */
export const storage = {
  /**
   * Stores a value in AsyncStorage
   * @param key Storage key
   * @param value Value to store
   */
  async set<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('AsyncStorage set error:', error);
      throw error;
    }
  },

  /**
   * Retrieves a value from AsyncStorage
   * @param key Storage key
   * @param defaultValue Default value if not found
   */
  async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      if (jsonValue === null) return defaultValue;
      return JSON.parse(jsonValue) as T;
    } catch (error) {
      console.error('AsyncStorage get error:', error);
      return defaultValue;
    }
  },

  /**
   * Removes a value from AsyncStorage
   * @param key Storage key
   */
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('AsyncStorage remove error:', error);
      throw error;
    }
  },

  /**
   * Clears all values from AsyncStorage
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('AsyncStorage clear error:', error);
      throw error;
    }
  },

  /**
   * Gets all keys from AsyncStorage
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return [...keys]; // Convert readonly array to mutable array
    } catch (error) {
      console.error('AsyncStorage getAllKeys error:', error);
      return [];
    }
  },

  /**
   * Gets multiple values from AsyncStorage
   * @param keys Storage keys
   */
  async multiGet<T>(keys: string[]): Promise<Record<string, T>> {
    try {
      const result = await AsyncStorage.multiGet(keys);
      return result.reduce(
        (acc, [key, value]) => {
          if (value) {
            acc[key] = JSON.parse(value);
          }
          return acc;
        },
        {} as Record<string, T>,
      );
    } catch (error) {
      console.error('AsyncStorage multiGet error:', error);
      return {};
    }
  },
};
