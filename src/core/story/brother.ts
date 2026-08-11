// src/core/story/brother.ts
//
// ============================================================================
//  ONE BROTHER, ONE NUMBER
// ============================================================================
//
//  He exists in two systems. The cap table has him as a director with 15% and
//  a `trust` field; the story has a `brotherTrust` dial that scenes read and
//  move. Left alone those are two numbers for one relationship, and for a
//  Snake they run in OPPOSITE DIRECTIONS - a scene that warms him up raises
//  the dial while the board reads rising trust as a rising threat.
//
//  That is not a bug you find. It is a bug you ship, because both halves look
//  right on their own.
//
//  ---------------------------------------------------------------------------
//  HOW IT IS RESOLVED: THE BOARD STORES, THE STORY VIEWS
//  ---------------------------------------------------------------------------
//  The cap table keeps `trust`, because eight places in the shareholder store
//  already write it - gifts, lobbying, quarter events - and routing all of
//  them through the story would be a large change to working code.
//
//  The dial becomes a VIEW of it, converted through the trait:
//
//      brotherTrust  ==  loyaltyOf(member)     "is he behind me"
//      member.trust  ==  trustForLoyalty(...)  "is he pleased"
//
//  Reads go through the board every time, so a condition can never test a
//  stale copy. Writes convert and land on the board. The stored dial is kept
//  in step as a mirror so anything rendering it shows the same number, and
//  the sync is idempotent - it sets the dial FROM the board, so running it
//  twice changes nothing and there is no loop.
//
//  Net effect for a writer: `brotherTrust` means what it says. Nudging it up
//  makes him warmer, in both systems, permanently.
// ============================================================================

import { loyaltyOf, trustForLoyalty } from '../market/loyalty';
import { INITIAL_DIALS } from './state';

/** His cast id, his thread id and his board id are all this. One person. */
export const BROTHER_ID = 'brother';

type Member = { id: string; trait: string; trust: number };

/**
 * Lazy, because the shareholder store imports core and a static import here
 * would close the circle. The codebase already does this in the quarter tick
 * for the same reason.
 */
const board = () => {
    try {
        return require('../../features/shareholders/stores/useShareholderStore').useShareholderStore;
    } catch {
        return null;
    }
};

const findBrother = (): Member | undefined =>
    board()?.getState().members?.find((m: Member) => m.id === BROTHER_ID);

/**
 * How far he is behind you, 0-100.
 *
 * Falls back to the story's opening value when the cap table has not been
 * built yet - during onboarding, or in a test that never called
 * initializeGame. Returning 0 there would read as "he already hates you".
 */
export const brotherLoyalty = (): number => {
    const m = findBrother();
    return m ? loyaltyOf(m as any) : INITIAL_DIALS.brotherTrust;
};

/** Move the relationship. The board is what actually changes. */
export const nudgeBrotherLoyalty = (delta: number): void => {
    const store = board();
    const m = findBrother();
    if (!store || !m) return;
    const next = trustForLoyalty(m.trait as any, loyaltyOf(m as any) + delta);
    store.setState((s: any) => ({
        members: s.members.map((x: Member) =>
            x.id === BROTHER_ID ? { ...x, trust: next } : x),
    }));
};

/**
 * Copy the board's answer into the stored dial.
 *
 * Idempotent by construction: it reads the board and writes the dial, never
 * the reverse. Called after a nudge and once a quarter, so changes that
 * happen on the BOARD side - a gift, a lobbying result, a bad quarter - show
 * up in the story's number too.
 */
export const syncBrotherDial = (): void => {
    try {
        const { useStoryStore } = require('../store/useStoryStore');
        const loyalty = brotherLoyalty();
        const story = useStoryStore.getState();
        if (story.dials.brotherTrust !== loyalty) {
            useStoryStore.setState((s: any) => ({
                dials: { ...s.dials, brotherTrust: loyalty },
            }));
        }
    } catch { /* store not ready - the next quarter will catch it */ }
};
