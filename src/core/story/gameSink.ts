// src/core/story/gameSink.ts
//
// ============================================================================
//  THE ONLY PLACE THE STORY TOUCHES THE GAME
// ============================================================================
//
//  effects.ts describes what a choice may do. This performs it. They are
//  separate files because the description is read by scenes, tests and the
//  audit, while this one needs four stores and AsyncStorage - and dragging
//  that chain into everything that merely wants the TYPES makes the
//  vocabulary untestable outside a device.
// ============================================================================

import { useStatsStore } from '../store/useStatsStore';
import { useStoryStore } from '../store/useStoryStore';
import { useMessageStore } from '../store/useMessageStore';
import { useMailStore } from '../store/useMailStore';
import { useGameStore } from '../store/useGameStore';
import type { EffectSink } from './effects';

/**
 * The real sink, wired to the game's stores.
 *
 * Built as a function rather than a constant because the stores must be read
 * at CALL time - capturing `getState()` once would hand every later effect a
 * stale snapshot of the money it is trying to change.
 */
export const gameSink = (): EffectSink => ({
    capital: (amount) => {
        const s = useStatsStore.getState();
        s.update({ companyCapital: (s.companyCapital || 0) + amount });
    },
    cash: (amount) => {
        const s = useStatsStore.getState();
        s.update({ money: (s.money || 0) + amount });
    },
    brand: (amount) => {
        const s = useStatsStore.getState();
        s.update({ brandValue: Math.max(0, (s.brandValue || 0) + amount) });
    },
    dial: (dial, delta) => useStoryStore.getState().nudge(dial, delta),
    flag: (flag) => useStoryStore.getState().raise(flag),
    message: (who, text) =>
        useMessageStore.getState().sendFromCharacter(who, text, useGameStore.getState().currentMonth),
    mail: (m) =>
        useMailStore.getState().receiveMail({
            ...m,
            atMonth: useGameStore.getState().currentMonth,
            category: 'Primary',
        }),
    news: (headline) => {
        // The news system has no writer yet - applyCorporateShock exists and
        // is called from nowhere. Rather than invent half of it here, this
        // records the intent and prompt 10 gives it a home. Silently dropping
        // it would be the worse failure: a scene would look wired and not be.
        // eslint-disable-next-line no-console
        console.log('[story] news pending a home:', headline);
    },
});
