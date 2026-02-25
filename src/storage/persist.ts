import { StateStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

// Lazy init: storage ilk kullanılınca oluşturulur, modül yüklenirken değil.
// Bu, createJSONStorage(() => zustandStorage) çağrısında MMKV'nin hazır olmasını garanti eder.
let _storage: MMKV | null = null;

const getStorage = (): MMKV => {
  if (!_storage) {
    _storage = new MMKV();
  }
  return _storage;
};

export const zustandStorage: StateStorage = {
  setItem: (name, value) => {
    try {
      console.log(`[MMKV] setItem: "${name}" len=${value?.length}`);
      getStorage().set(name, value);
    } catch (e) {
      console.error('[MMKV] setItem error:', e);
    }
    return Promise.resolve();
  },
  getItem: (name) => {
    try {
      const value = getStorage().getString(name);
      console.log(`[MMKV] getItem: "${name}" found=${value != null} len=${value?.length ?? 0}`);
      return Promise.resolve(value ?? null);
    } catch (e) {
      console.error('[MMKV] getItem error:', e);
      return Promise.resolve(null);
    }
  },
  removeItem: (name) => {
    try {
      console.log(`[MMKV] removeItem: "${name}"`);
      getStorage().delete(name);
    } catch (e) {
      console.error('[MMKV] removeItem error:', e);
    }
    return Promise.resolve();
  },
};