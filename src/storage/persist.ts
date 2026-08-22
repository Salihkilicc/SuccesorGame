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

// ============================================================================
//  AND WHO IS STILL WAITING
// ============================================================================
//
//  Dropping the write is the right answer and it is not the whole answer. The
//  drop protects what is on DISK; it does nothing for what the game just
//  computed, which is thrown away twice over - the write is dropped, and then
//  hydration lands and overwrites the memory that held it.
//
//  Measured on a device: launch the app and press Next Quarter within about a
//  second, and that quarter's changes to territory, sponsorship, the casino
//  risk record, the achievements and the subsidiaries are all silently lost.
//  Thirty dropped writes in one tick, in the log, at quarter 193.
//
//  The reason the window is that wide is that App.tsx gated on TWO stores,
//  `useStatsStore` and `useGameStore`, with a comment saying the rest come out
//  at the same time. They do not. A store begins reading when it is CREATED,
//  and half of these are created by a lazy `require` inside the quarter tick
//  itself - so their first read starts in the same pass as their first write.
//
//  So the storage layer keeps a second set: every key anybody has ASKED for.
//  `whenSettled` is then answerable - everything asked for has been read - and
//  the app can wait for it rather than guessing which two stores stand for all
//  of them. See storage/warmUp.ts, which is what does the asking.
// ============================================================================

/** Keys some store has begun reading, whether or not it has landed. */
const asked = new Set<string>();

/** Resolved the moment `asked` and `hydrated` agree. */
let waiters: (() => void)[] = [];

const settleIfDone = (): void => {
    if (waiters.length === 0) return;
    for (const key of asked) if (!hydrated.has(key)) return;
    const done = waiters;
    waiters = [];
    for (const w of done) w();
};

/**
 * Every read that has been started has landed.
 *
 * Resolves immediately when nothing is outstanding, which is the ordinary
 * case: after launch this costs one microtask. It deliberately does NOT wait
 * for keys nobody has asked for - a store that is never created has no state
 * to lose, and PERSIST_KEYS carries legacy keys no live store reads.
 */
export const whenSettled = (): Promise<void> =>
    new Promise<void>(resolve => {
        waiters.push(resolve);
        settleIfDone();
    });

/** What is still outstanding, for the log and for the test. */
export const outstandingReads = (): string[] =>
    Array.from(asked).filter(k => !hydrated.has(k));

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
        // Recorded BEFORE the await, so `whenSettled` can see the read is
        // outstanding rather than resolving in the gap before it lands.
        asked.add(name);

        // If there is a pending write in memory, return it directly
        if (pendingWrites.has(name)) {
            hydrated.add(name);
            settleIfDone();
            return pendingWrites.get(name)!;
        }
        try {
            return await AsyncStorage.getItem(name);
        } finally {
            // In a `finally`, because a read that FAILED is still a read that
            // is no longer outstanding. Leaving it in `asked` alone would hang
            // every later `whenSettled` for the rest of the session.
            hydrated.add(name);
            settleIfDone();
        }
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
