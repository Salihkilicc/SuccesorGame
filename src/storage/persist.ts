import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
//  HYDRATION-SAFE STORAGE
// ============================================================================
//
//  The bug this exists to prevent: acquired companies disappearing between
//  sessions. It was not a save bug - the save worked. The sequence was:
//
//    1. app starts, the store holds its initial value:  subsidiaries: []
//    2. persist begins reading the disk (asynchronous)
//    3. a screen mounts and writes to the store before that read finishes -
//       CorporateFinanceHubModal calls refreshCreditScore() in an effect
//    4. persist dutifully saves the CURRENT state, which is still the empty
//       initial one, ON TOP of the six companies on disk
//    5. the disk read finally lands and restores all six to memory
//
//  So the session you did the damage in looks completely fine - the companies
//  are all there. The loss only shows on the NEXT launch, which is why it read
//  as "sometimes they just vanish" and survived a previous round of fixes.
//
//  The rule that closes it: a key may not be WRITTEN until it has been READ.
//  persist always reads before it writes, so this costs nothing in the normal
//  path and simply drops the writes that would otherwise clobber unread data.
// ============================================================================

/** Keys whose disk copy has been read at least once this session. */
const hydrated = new Set<string>();

/** Pending writes queued for debounce to avoid freezing the JS thread with dozens of JSON serializations per quarter tick. */
const pendingWrites = new Map<string, string>();
const writeTimers = new Map<string, ReturnType<typeof setTimeout>>();

/** Flush a single key immediately to AsyncStorage */
const flushKey = async (name: string): Promise<void> => {
    const timer = writeTimers.get(name);
    if (timer) {
        clearTimeout(timer);
        writeTimers.delete(name);
    }
    const value = pendingWrites.get(name);
    if (value !== undefined) {
        pendingWrites.delete(name);
        try {
            await AsyncStorage.setItem(name, value);
        } catch (e) {
            console.error(`[persist] Error writing ${name} to AsyncStorage`, e);
        }
    }
};

/** Flush all pending writes immediately (e.g. before app sleep or reset) */
export const flushPendingStorageWrites = async (): Promise<void> => {
    const keys = Array.from(pendingWrites.keys());
    await Promise.all(keys.map(flushKey));
};

export const zustandStorage = {
    getItem: async (name: string): Promise<string | null> => {
        // If there is a pending write in memory, return it directly
        if (pendingWrites.has(name)) {
            hydrated.add(name);
            return pendingWrites.get(name)!;
        }
        const value = await AsyncStorage.getItem(name);
        hydrated.add(name);
        return value;
    },

    setItem: async (name: string, value: string): Promise<void> => {
        if (!hydrated.has(name)) {
            // DROPPED, not queued.
            //
            // Replaying it was my first attempt and it kept the bug alive: a
            // write made before hydration is derived from the EMPTY initial
            // state, so replaying it after the read still lands empty data on
            // top of the real save. It is stale by definition, never newer.
            //
            // Nothing is lost by dropping it. Hydration is about to overwrite
            // that state anyway, and the next genuine change writes again.
            if (__DEV__) {
                console.warn(
                    `[persist] dropped a write to "${name}" that arrived before its disk copy was read`,
                );
            }
            return;
        }

        // Cache the latest value immediately in memory
        pendingWrites.set(name, value);

        // Clear existing timer for this key if rapid updates are happening
        const existingTimer = writeTimers.get(name);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        // Debounce actual disk I/O by 50ms so rapid updates during a quarter tick coalesce into 1 write
        const timer = setTimeout(() => {
            flushKey(name);
        }, 50);
        if (timer && typeof (timer as any).unref === 'function') {
            (timer as any).unref();
        }
        writeTimers.set(name, timer);
    },

    removeItem: async (name: string): Promise<void> => {
        const timer = writeTimers.get(name);
        if (timer) {
            clearTimeout(timer);
            writeTimers.delete(name);
        }
        pendingWrites.delete(name);
        // A deliberate delete - starting a new game - is not a race. Let it
        // through, and treat the key as settled so later writes are not held.
        hydrated.add(name);
        await AsyncStorage.removeItem(name);
    },
};
