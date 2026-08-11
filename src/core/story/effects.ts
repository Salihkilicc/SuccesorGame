// src/core/story/effects.ts
//
// ============================================================================
//  WHAT A CHOICE IS ALLOWED TO DO
// ============================================================================
//
//  A closed list. Not a callback, not a function a scene can supply - a
//  finite set of named things, described as data.
//
//  WHY THIS IS THE WHOLE POINT. If a choice could carry a function, then the
//  first scene that needs something unusual writes it inline, and the second
//  one copies it, and within a month the story is a hundred small programs
//  scattered through a data file. Everything that was true of this codebase's
//  colours before the theme - three golds, four reds, all doing the same job -
//  would be true of story logic, except worse, because logic has no
//  contrast ratio to measure it against.
//
//  A closed vocabulary means: you can read every effect in the game by
//  reading this one file, an effect can be logged, replayed and tested, and
//  adding a new KIND of effect is a deliberate act rather than a side effect
//  of writing a scene.
//
//  If a scene needs something not on this list, the answer is to add it here
//  with a name - never to smuggle it in as a function.
//
//  ---------------------------------------------------------------------------
//  THIS FILE IMPORTS NOTHING FROM THE APP, AND THAT IS LOAD-BEARING
//  ---------------------------------------------------------------------------
//  The store-backed sink lives in gameSink.ts instead. It was in here at
//  first, and the moment a test imported the effect TYPES it pulled in four
//  zustand stores, AsyncStorage and the i18n loader - a chain that cannot run
//  outside a device.
//
//  The rule that falls out: the vocabulary is a description, not a doer. A
//  scene, a test and the audit all read this file; only one small file
//  actually touches the game.
// ============================================================================

import type { Dial, StoryFlag } from './state';

export type Effect =
    /** Company capital in or out. Negative takes. */
    | { kind: 'capital'; amount: number }
    /** The player's personal cash. Separate pool, separate effect. */
    | { kind: 'cash'; amount: number }
    /** Brand value, in points. */
    | { kind: 'brand'; amount: number }
    /** Move a relationship. Deltas compound; see useStoryStore.nudge. */
    | { kind: 'dial'; dial: Dial; delta: number }
    /** Record something that cannot unhappen. */
    | { kind: 'flag'; flag: StoryFlag }
    /**
     * A character writes to the player's phone.
     *
     * `who` is a CAST ID. The name and role are looked up when it is
     * delivered, so a scene cannot invent a person, misspell an existing one,
     * or put a mail-only character on the phone - the audit checks this id
     * against the cast and its channel.
     */
    | { kind: 'message'; who: string; text: string }
    /** A character writes to the player's inbox. Same rule for `from`. */
    | { kind: 'mail'; from: string; subject: string; body: string }
    /** A line in the news. */
    | { kind: 'news'; headline: string };

/**
 * Everything an effect needed but could not know for itself.
 *
 * Passed in rather than read inside, so `apply` can be tested without a
 * running game - the tests supply a fake sink and read what came out.
 */
export type EffectSink = {
    capital: (amount: number) => void;
    cash: (amount: number) => void;
    brand: (amount: number) => void;
    dial: (dial: Dial, delta: number) => void;
    flag: (flag: StoryFlag) => void;
    message: (who: string, text: string) => void;
    mail: (m: { from: string; subject: string; body: string }) => void;
    news: (headline: string) => void;
};

/**
 * Apply one effect through a sink.
 *
 * The switch is exhaustive and TypeScript enforces it: adding a variant to
 * `Effect` without handling it here fails the build. That is the guard rail -
 * a new effect kind cannot be half-added.
 */
export const applyEffect = (effect: Effect, sink: EffectSink): void => {
    switch (effect.kind) {
        case 'capital': sink.capital(effect.amount); return;
        case 'cash': sink.cash(effect.amount); return;
        case 'brand': sink.brand(effect.amount); return;
        case 'dial': sink.dial(effect.dial, effect.delta); return;
        case 'flag': sink.flag(effect.flag); return;
        case 'message': sink.message(effect.who, effect.text); return;
        case 'mail': sink.mail(effect); return;
        case 'news': sink.news(effect.headline); return;
    }
    // Unreachable while the switch is exhaustive. If a new variant is added
    // without a case, TypeScript fails here rather than at runtime.
    const never: never = effect;
    throw new Error(`Unhandled effect: ${JSON.stringify(never)}`);
};

export const applyEffects = (effects: Effect[] | undefined, sink: EffectSink): void => {
    (effects ?? []).forEach(e => applyEffect(e, sink));
};
