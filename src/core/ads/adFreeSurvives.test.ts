// src/core/ads/adFreeSurvives.test.ts
//
// ============================================================================
//  MONEY CHANGED HANDS, AND A NEW GAME IS NOT ALLOWED TO TAKE IT BACK
// ============================================================================
//
//  "ÖNEMLI KURAL: Oyuncu yeni bir oyuna basladiginda stat'lar sifirlansa bile
//   adFree bayragi KESINLIKLE SILINMEYECEKTIR."
//
//  The claim is not "adFree is in the right store". The claim is that there
//  exists NO path by which starting a new game clears it, and a test that only
//  looked at the field would pass while a wipe took it away. So this checks
//  the three mechanisms that could each remove it independently:
//
//    1. the on-disk key, which newGame deletes from AsyncStorage BY NAME
//    2. the in-memory reset, which newGame does store by store
//    3. partialize, which decides what is written back to disk at all
//
//  Any one of them failing loses the purchase, and each fails differently.
// ============================================================================

import fs from 'fs';
import path from 'path';

import { PERSIST_KEYS } from '../newGame';
import { initialIdentityState, useIdentityStore } from '../store/useIdentityStore';

const ROOT = path.join(__dirname, '..', '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/** The key this store persists under. Read from the source, not retyped. */
const IDENTITY_KEY = (() => {
    const m = read('src/core/store/useIdentityStore.ts').match(/name:\s*'([^']+)'/);
    expect(m).not.toBeNull();
    return m![1];
})();

describe('the purchase outlives a new game', () => {
    it('the store it lives in is not on the list a new game deletes', () => {
        // ------------------------------------------------------------------
        //  MECHANISM 1: THE NAMED WIPE
        // ------------------------------------------------------------------
        //  newGame removes every key in PERSIST_KEYS from AsyncStorage. It
        //  cannot half-delete a key, which is the whole reason the identity
        //  lives in its own store rather than as three more fields on
        //  useUserStore - see that file's header. `adFree` inherits that.
        // ------------------------------------------------------------------
        expect(PERSIST_KEYS).not.toContain(IDENTITY_KEY);
    });

    it('and newGame never resets this store in memory either', () => {
        // ------------------------------------------------------------------
        //  MECHANISM 2: THE IN-MEMORY RESET
        // ------------------------------------------------------------------
        //  Deleting the disk key is only half of what newGame does; it also
        //  puts live stores back to their initial state. A `setState(initial)`
        //  on the identity store would clear the purchase for the rest of the
        //  session, and it would come BACK on the next launch when the
        //  untouched disk copy rehydrated. A bug that heals itself overnight
        //  is close to unreportable.
        //
        //  Read as text because the alternative is running the whole new game
        //  routine, and what is being claimed here is about the source.
        // ------------------------------------------------------------------
        const src = read('src/core/newGame.ts');
        const resets = src
            .split('\n')
            .filter(line => /useIdentityStore\.setState\(/.test(line))
            .filter(line => /initialIdentityState|adFree/.test(line));
        expect(resets).toEqual([]);
    });

    it('and the flag is actually written to disk, or it dies at the next launch', () => {
        // ------------------------------------------------------------------
        //  MECHANISM 3: PARTIALIZE
        // ------------------------------------------------------------------
        //  zustand's persist only writes what partialize returns. A field left
        //  out of it works perfectly all session and is gone when the app is
        //  next opened - which reads to the player as the purchase expiring
        //  overnight, and is the single most likely way to earn a refund.
        // ------------------------------------------------------------------
        const src = read('src/core/store/useIdentityStore.ts');
        const start = src.indexOf('partialize:');
        expect(start).toBeGreaterThan(-1);
        const block = src.slice(start, src.indexOf('onRehydrateStorage', start));
        expect(block).toContain('adFree: state.adFree');
    });

    it('and nobody starts out having paid', () => {
        expect(initialIdentityState.adFree).toBe(false);
    });
});

describe('the store is the authority and the app follows it', () => {
    beforeEach(() => useIdentityStore.setState({ adFree: false }));

    it('a purchase turns it on', () => {
        useIdentityStore.getState().applyEntitlement(true);
        expect(useIdentityStore.getState().adFree).toBe(true);
    });

    it('and a refund turns it off again', () => {
        // Not a `grantAdFree()` with no way back. RevenueCat is the authority
        // and the authority can say no: refunds, chargebacks, family sharing
        // being revoked. An app that cannot follow its authority downwards is
        // giving away a product it is no longer being paid for.
        useIdentityStore.getState().applyEntitlement(true);
        useIdentityStore.getState().applyEntitlement(false);
        expect(useIdentityStore.getState().adFree).toBe(false);
    });

    it('and a save written before any of this existed reads as not paid', () => {
        // Every existing player rehydrates without the field. Undefined is
        // falsy and would work by accident; the rehydrate hook makes it a
        // real boolean, because `decide()` is typed for one.
        const src = read('src/core/store/useIdentityStore.ts');
        expect(src).toContain("typeof state.adFree !== 'boolean'");
    });
});
