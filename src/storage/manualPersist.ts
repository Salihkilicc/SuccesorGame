/**
 * manualPersist.ts
 *
 * Zustand persist middleware'inden bağımsız, direkt MMKV persistence.
 * Bu yaklaşım:
 * 1. App başlarken MMKV'den state'i okur (bootstrapFromMMKV)
 * 2. Store değiştiğinde MMKV'ye yazar (subscribe + debounce)
 */

import { MMKV } from 'react-native-mmkv';

const STORAGE_KEY = 'game_manual_persist_v1';

// Standalone MMKV instance - persist.ts'den bağımsız
let _mmkv: MMKV | null = null;
const getMMKV = (): MMKV => {
    if (!_mmkv) {
        _mmkv = new MMKV({ id: 'manual-persist' });
    }
    return _mmkv;
};

export interface PersistedState {
    money: number;
    netWorth: number;
    companyCapital: number;
    companyValue: number;
    companyOwnership: number;
    companyDebtTotal: number;
    factoryCount: number;
    employeeCount: number;
    currentMonth: number;
    age: number;
}

// MMKV'den state'i oku
export const readFromMMKV = (): PersistedState | null => {
    try {
        const raw = getMMKV().getString(STORAGE_KEY);
        if (!raw) {
            console.log('[ManualPersist] No saved state found.');
            return null;
        }
        const parsed = JSON.parse(raw) as PersistedState;
        console.log('[ManualPersist] Loaded state. Money:', parsed.money);
        return parsed;
    } catch (e) {
        console.error('[ManualPersist] Read error:', e);
        return null;
    }
};

// MMKV'ye state yaz
export const writeToMMKV = (state: PersistedState): void => {
    try {
        const json = JSON.stringify(state);
        getMMKV().set(STORAGE_KEY, json);
        console.log('[ManualPersist] Saved. Money:', state.money);
    } catch (e) {
        console.error('[ManualPersist] Write error:', e);
    }
};

// Debounce timer ref
let _debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Debounced save - çok sık yazımı önler
export const debouncedWriteToMMKV = (state: PersistedState, delayMs = 500): void => {
    if (_debounceTimer) clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => writeToMMKV(state), delayMs);
};
