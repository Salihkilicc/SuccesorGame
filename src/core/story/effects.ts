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
    | { kind: 'news'; headline: string }
    /**
     * A conversation that arrives LATER.
     *
     * This is how a scene promises a reply. You write to Pear and the answer
     * comes next quarter; the waiting is the characterisation, and it is a
     * one-line effect rather than a mechanism each scene reinvents.
     *
     * `afterQuarters: 0` means "as soon as the next tick allows", which still
     * goes through the queue and its allowance.
     */
    /**
     * The game stops here.
     *
     * `ending` is an id from data/story/endings.ts, not the text - so the
     * audit can check the id exists, the same way it checks a scheduled
     * conversation does. A scene offering an ending that is not there would
     * take the player's decision and then do nothing with it, which is the
     * worst available failure at the exact moment it matters most.
     *
     * Deliberately terminal and deliberately rare. Anything reversible is a
     * flag, not an ending.
     */
    | { kind: 'ending'; ending: string }
    /**
     * Move what a company is fundamentally worth.
     *
     * `multiplier` against its listed value: 0.45 means somebody is willing to
     * let it go at under half. This writes the ANCHOR rather than the price
     * (see useMarketStore.valueAnchors) because a price alone decays back
     * within a few quarters - the whole reason divestitures needed anchors.
     *
     * It exists so a story reward can be a real one. "He will sell you his
     * company cheap" is worth nothing if the acquisition screen has never
     * heard of it.
     */
    | { kind: 'reprice'; company: string; multiplier: number }
    /**
     * A standing cut of one category's revenue, forever.
     *
     * The price of not fighting an incumbent - see core/market/territory.ts.
     * A NEW KIND rather than a `capital` effect with a number in it, because
     * the whole character of this cost is that it is not a payment: it is a
     * percentage that costs nothing on the day it is signed and grows with
     * every quarter the player succeeds. Expressing it as capital would mean
     * the scene inventing a figure it cannot know.
     */
    | { kind: 'royalty'; category: string; rate: number }
    /**
     * An incumbent spends against you in one category for a while.
     *
     * Multiplies the competitor pool in `computeShares`, which is what an
     * incumbent actually does to an entrant - it does not remove your product,
     * it makes everything else look better than it did. Ends on a timer.
     */
    | { kind: 'siege'; category: string; quarters: number; pressure: number }
    /**
     * Somebody hires the company you just bought out from under you.
     *
     * Writes the deal's `synergyRealization` - the fraction of the synergy it
     * will ever deliver - and it is PERMANENT, unlike a siege. A besieger stops
     * paying and goes away; a team that has resigned does not reassemble.
     *
     * It lands on exactly the thing that was bought. A share penalty would
     * punish the whole company for one deal; this leaves you owning the
     * business, still earning, with the reason you paid a premium for it gone.
     */
    /**
     * NO NUMBER ON IT, and that is the second draft.
     *
     * The first version carried `realization`, so the scene stated how much
     * damage it did - and the audit reported two dead helpers in ripple.ts,
     * which was the correct diagnosis of a real fault: the scenes were also
     * carrying hardcoded retention costs they had no way of computing. A scene
     * knows WHO is angry. It cannot know what the target earns.
     *
     * So both of these name a company and nothing else, and the engine looks
     * up what that means. See core/market/ripple.ts.
     */
    | { kind: 'raid'; company: string }
    /**
     * Pay to keep the team, priced off the target's own annual earnings.
     *
     * A flat sum in the scene would be unaffordable early and free late, so
     * the choice would only be a choice in a narrow band of the campaign.
     */
    | { kind: 'retention'; company: string }
    /**
     * Somebody takes a subsidiary off your hands at a stated price.
     *
     * `priceMultiple` is against the deal's CURRENT FAIR VALUE, not against
     * what you paid - which is the figure `quoteDivestiture` already computes
     * from the target's own earnings. So 0.85 is the ordinary market exit, and
     * the whole point of the three scenes that use this is that none of them
     * is 0.85: an incumbent buying you out of his category pays over the odds,
     * and a fund that knows you are short of cash does not.
     *
     * The multiple is on the EFFECT rather than in the engine because it is
     * the term of a specific offer from a specific person. There is no general
     * rule to keep it consistent with.
     */
    | { kind: 'divest'; company: string; priceMultiple: number }
    /**
     * Something happened to the people who work here.
     *
     * FOR EVENTS IN THE WORLD, NEVER FOR A CHARACTER'S OPINION OF YOU. The COO
     * has no dial precisely because morale is the engine's number and cannot
     * be repaired by picking the warm answer (see core/story/state.ts), and
     * this effect must not become a way around that. A fire on the line moves
     * it. A well-chosen sentence does not.
     *
     * Applied as a one-off adjustment, so the wage model pulls it back towards
     * its own target over the following quarters - the shock is real and it
     * does not become the new normal unless the player lets it.
     */
    | { kind: 'morale'; amount: number }
    /**
     * THE ONE PLACE A DIE IS ALLOWED INSIDE A CHOICE.
     *
     * Everything else in this vocabulary is deterministic, on purpose: the
     * shelved NegotiationModal decided with `Math.random()` behind a spinner
     * and offered a button that re-rolled it, and the whole story system was
     * built against that. A percentage attached to an answer is normally a
     * slot machine with prose on it.
     *
     * Paying criminals is the exception, and it is the exception because the
     * uncertainty IS the content. You are not buying an outcome, you are
     * buying a promise from somebody whose business model is promises.
     *
     * TWO THINGS KEEP IT HONEST. The roll happens ONCE, at the moment the
     * player decides, and it cannot be re-pulled - unlike an event chance,
     * which rolls every quarter and therefore converges on certainty. And the
     * failure is a SCENE rather than a number, so the player finds out what
     * happened from a person rather than from a balance sheet.
     */
    /**
     * Somebody takes a seat at your table.
     *
     * Named rather than generated, and it issues new shares exactly the way an
     * acquisition seat does - see `directorFromAcquisition`. The stake is on
     * the effect because it is a term of a specific offer: a seat handed to
     * somebody as a gesture is not the same size as one that came attached to
     * a company.
     */
    | { kind: 'boardSeat'; person: string; stake: number }
    | {
        kind: 'risk';
        /** Probability the promise is kept, 0-1. */
        chance: number;
        /** The conversation that arrives if it is not. */
        onBetrayal: string;
        afterQuarters: number;
    }
    | {
        kind: 'schedule';
        conversation: string;
        afterQuarters: number;
        /** Ignore the per-quarter allowance. See inbox.ts - meant to be rare. */
        urgent?: boolean;
        /** Give up if still undeliverable this many quarters later. */
        expiresAfter?: number;
    };

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
    ending: (id: string) => void;
    reprice: (company: string, multiplier: number) => void;
    royalty: (category: string, rate: number) => void;
    siege: (category: string, quarters: number, pressure: number) => void;
    raid: (company: string) => void;
    retention: (company: string) => void;
    divest: (company: string, priceMultiple: number) => void;
    morale: (amount: number) => void;
    boardSeat: (person: string, stake: number) => void;
    risk: (chance: number, onBetrayal: string, afterQuarters: number) => void;
    schedule: (item: {
        conversation: string;
        afterQuarters: number;
        urgent?: boolean;
        expiresAfter?: number;
    }) => void;
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
        case 'ending': sink.ending(effect.ending); return;
        case 'reprice': sink.reprice(effect.company, effect.multiplier); return;
        case 'royalty': sink.royalty(effect.category, effect.rate); return;
        case 'siege': sink.siege(effect.category, effect.quarters, effect.pressure); return;
        case 'raid': sink.raid(effect.company); return;
        case 'retention': sink.retention(effect.company); return;
        case 'divest': sink.divest(effect.company, effect.priceMultiple); return;
        case 'morale': sink.morale(effect.amount); return;
        case 'boardSeat': sink.boardSeat(effect.person, effect.stake); return;
        case 'risk': sink.risk(effect.chance, effect.onBetrayal, effect.afterQuarters); return;
        case 'schedule': sink.schedule(effect); return;
    }
    // Unreachable while the switch is exhaustive. If a new variant is added
    // without a case, TypeScript fails here rather than at runtime.
    const never: never = effect;
    throw new Error(`Unhandled effect: ${JSON.stringify(never)}`);
};

export const applyEffects = (effects: Effect[] | undefined, sink: EffectSink): void => {
    (effects ?? []).forEach(e => applyEffect(e, sink));
};
