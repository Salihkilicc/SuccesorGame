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

export const zustandStorage = {
    getItem: async (name: string): Promise<string | null> => {
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
        await AsyncStorage.setItem(name, value);
    },

    removeItem: async (name: string): Promise<void> => {
        // A deliberate delete - starting a new game - is not a race. Let it
        // through, and treat the key as settled so later writes are not held.
        hydrated.add(name);
        await AsyncStorage.removeItem(name);
    },
};
