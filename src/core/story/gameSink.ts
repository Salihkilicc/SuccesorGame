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
import { useNewsStore } from '../store/useNewsStore';
import type { EffectSink } from './effects';
import { CAST } from '../../data/story/cast';
import { currentQuarter } from './world';
import { BROTHER_ID, nudgeBrotherLoyalty, syncBrotherDial } from './brother';
import { emailOf } from './cast';

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
    dial: (dial, delta) => {
        // The brother lives on the cap table. Writing the story's copy would
        // leave the board holding the old number - and for a Snake, holding
        // it in the opposite direction.
        if (dial === 'brotherTrust') {
            nudgeBrotherLoyalty(delta);
            syncBrotherDial();
            return;
        }
        useStoryStore.getState().nudge(dial, delta);
    },
    flag: (flag) => useStoryStore.getState().raise(flag),
    // Cast ids are resolved here, at the last possible moment, so a scene
    // never carries a copy of anybody's name. An id with no cast entry throws
    // rather than delivering a message from "undefined" - the audit should
    // have caught it, and if it did not, the loud failure is the next best
    // thing to a silent one.
    message: (who, text) => {
        const m = CAST[who];
        if (!m) throw new Error(`story: no cast member "${who}"`);
        useMessageStore.getState().sendFromCharacter(
            { id: m.id, name: m.name, role: m.role },
            text,
            useGameStore.getState().currentMonth,
        );
    },
    mail: (m) => {
        const from = CAST[m.from];
        if (!from) throw new Error(`story: no cast member "${m.from}"`);
        useMailStore.getState().receiveMail({
            fromName: from.name,
            fromEmail: emailOf(from) ?? '',
            subject: m.subject,
            body: m.body,
            atMonth: useGameStore.getState().currentMonth,
            category: 'Primary',
        });
    },
    // Scheduling writes to the queue; nothing is delivered here. A scene
    // asks for a reply "next quarter" and the tick decides when that
    // actually lands, which is the only place the per-quarter allowance can
    // be honoured.
    schedule: ({ conversation, afterQuarters, urgent, expiresAfter }) => {
        const now = currentQuarter();
        useStoryStore.getState().schedule({
            conversationId: conversation,
            dueQuarter: now + Math.max(0, Math.floor(afterQuarters)),
            urgent,
            expiresAfter,
            queuedAtQuarter: now,
        });
    },
    // It has a home now - see core/store/useNewsStore.ts. This used to
    // console.log with a note saying so, which meant a scene could use the
    // effect, look wired, and reach nobody.
    news: (headline) => {
        useNewsStore.getState().publish(
            headline, 'story', useGameStore.getState().currentMonth,
        );
    },
});
