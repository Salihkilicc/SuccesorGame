// src/data/i18n/storyKeys.ts
//
// ============================================================================
//  EVERY LINE OF DIALOGUE IN THE GAME, AS A LIST OF KEYS
// ============================================================================
//
//  Derived from CONVERSATIONS rather than written down, for the same reason
//  the market's giants are derived from PRODUCT_MARKETS: a hand-written list
//  is a list that disagrees with the data the first time somebody adds a
//  scene, and the disagreement is silent.
//
//  Used by the export tool, by the coverage test, and by nothing at runtime.
// ============================================================================

import { CONVERSATIONS } from '../story';
import { TUTORIAL_SEQUENCE } from '../tutorial/sequence';
import { nodeKey, choiceKey, subjectKey, lockKey } from './storyText';

export interface StoryLine {
    key: string;
    english: string;
    /** Which conversation it belongs to, for grouping in the export. */
    conversation: string;
    /** Who is speaking, so a translator can hear the voice. */
    speaker: string;
    kind: 'body' | 'choice' | 'subject' | 'lock';
}

export const allStoryLines = (): StoryLine[] => {
    const out: StoryLine[] = [];
    for (const c of CONVERSATIONS) {
        if (c.subject) {
            out.push({
                key: subjectKey(c.id), english: c.subject,
                conversation: c.id, speaker: c.from, kind: 'subject',
            });
        }
        for (const n of c.nodes) {
            out.push({
                key: nodeKey(c.id, n.id), english: n.text,
                conversation: c.id, speaker: n.speaker, kind: 'body',
            });
            (n.choices ?? []).forEach((ch, i) => {
                out.push({
                    key: choiceKey(c.id, n.id, i), english: ch.text,
                    // A choice is the PLAYER speaking, which matters to
                    // whoever translates it: the buttons are things this
                    // person would say out loud, not narration.
                    conversation: c.id, speaker: 'player', kind: 'choice',
                });
            });
        }
    }

    // ------------------------------------------------------------------
    //  THE TUTORIAL LINES ARE DIALOGUE TOO
    // ------------------------------------------------------------------
    //  The father says these over a dimmed screen. They were the last of
    //  his words sitting outside the dictionary, which would have shipped
    //  a Turkish game whose first hour is in English.
    //
    //  `conversation` points at the scene the lock carries, so a translator
    //  reading the export sees the lock line next to the conversation it
    //  arrives with and can match the register.
    // ------------------------------------------------------------------
    for (const lock of TUTORIAL_SEQUENCE) {
        out.push({
            key: lockKey(lock.id), english: lock.instruction,
            conversation: lock.conversation ?? `@lock/${lock.id}`,
            speaker: lock.speaker ?? 'father', kind: 'lock',
        });
    }

    return out;
};

export const allStoryKeys = (): string[] => allStoryLines().map(l => l.key);
