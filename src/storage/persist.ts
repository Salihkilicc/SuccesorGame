import { StateStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

// MMKV veritabanını oluşturuyoruz
const storage = new MMKV();

// Zustand'ın anlayacağı dile çeviriyoruz (Adapter)
export const zustandStorage: StateStorage = {
  setItem: (name, value) => {
    return storage.set(name, value);
  },
  getItem: (name) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name) => {
    return storage.delete(name);
  },
};