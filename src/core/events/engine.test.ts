// src/core/events/engine.test.ts
//
// A random event system is the easiest kind of code to be wrong about,
// because wrong looks exactly like unlucky. These hand it fixed dice.

import { isReady, rollQuarter, validateEvents, MAX_EVENTS_PER_QUARTER } from './engine';
import { emptyHistory, type GameEvent } from './types';
import { EVENTS } from '../../data/events';
import { CONVERSATIONS } from '../../data/story';
import { INITIAL_DIALS } from '../story/state';
import type { World } from '../story/conditions';

const world = (over: Partial<World> = {}): World => ({
    dials: { ...INITIAL_DIALS },
    flags: {},
    quarter: 20,
    capital: 100_000_000,
    cash: 5_000_000,
    morale: 75,
    ...over,
});

const scene = (id: string) => ({
    id, channel: 'message' as const, from: 'cfo', start: 'a',
    nodes: [{ id: 'a', speaker: 'cfo', text: 'x' }],
});

const event = (over: Partial<GameEvent> = {}): GameEvent => ({
    id: 'e1',
    when: [],
    chance: 0.5,
    conversation: scene('c1'),
    headline: 'Something happened.',
    ...over,
});

/** Dice that come out in the order given, then always 1 (always lose). */
const dice = (...values: number[]) => {
    let i = 0;
    return () => (i < values.length ? values[i++] : 1);
};

describe('the roll', () => {
    it('fires when the die is under the chance', () => {
        const r = rollQuarter([event({ chance: 0.3 })], world(), emptyHistory(), 1, dice(0.29));
        expect(r.fired.map(e => e.id)).toEqual(['e1']);
    });

    it('does not fire when it is over', () => {
        const r = rollQuarter([event({ chance: 0.3 })], world(), emptyHistory(), 1, dice(0.31));
        expect(r.fired).toEqual([]);
    });

    it('a chance of 1 is a certainty and a chance of 0 never happens', () => {
        // `random()` returns [0, 1). Using `<=` would make chance 0 fire on a
        // roll of exactly 0, which is rare enough to never be found by hand.
        expect(rollQuarter([event({ chance: 1 })], world(), emptyHistory(), 1, dice(0.999)).fired)
            .toHaveLength(1);
        expect(rollQuarter([event({ chance: 0 })], world(), emptyHistory(), 1, dice(0)).fired)
            .toHaveLength(0);
    });

    it('does not roll an event whose trigger is false', () => {
        const gated = event({ when: [{ kind: 'flag', flag: 'fatherDead' }] });
        const r = rollQuarter([gated], world(), emptyHistory(), 1, dice(0));
        expect(r.eligible).toEqual([]);
        expect(r.fired).toEqual([]);
    });

    it('holds the one-a-quarter limit even when everything wins', () => {
        const pool = [event({ id: 'a', chance: 1 }), event({ id: 'b', chance: 1 })];
        const r = rollQuarter(pool, world(), emptyHistory(), 1, dice(0, 0));
        expect(r.fired).toHaveLength(MAX_EVENTS_PER_QUARTER);
    });

    it('gives the die to the higher priority first', () => {
        // Not cosmetic. Rolling in file order and sorting the winners
        // afterwards would let a new low-priority event change which dice the
        // important ones get.
        const pool = [
            event({ id: 'low', chance: 1, priority: 0 }),
            event({ id: 'high', chance: 1, priority: 5 }),
        ];
        expect(rollQuarter(pool, world(), emptyHistory(), 1, dice(0, 0)).fired[0].id).toBe('high');
    });

    it('the losers are not queued - they roll again next quarter', () => {
        // Deferring losers would turn a 10% event into a certainty with a
        // delay, which is a different mechanic wearing the same number.
        const pool = [event({ id: 'a', chance: 0.1 }), event({ id: 'b', chance: 0.1 })];
        const r = rollQuarter(pool, world(), emptyHistory(), 1, dice(0.5, 0.5));
        expect(r.fired).toEqual([]);
        expect(r.eligible).toHaveLength(2);
    });
});

describe('cooldown', () => {
    it('no cooldown means once per game', () => {
        const e = event();
        const history = { lastFired: { e1: 3 } };
        expect(isReady(e, history, 4)).toBe(false);
        expect(isReady(e, history, 400)).toBe(false);
    });

    it('and that is different from a cooldown of zero', () => {
        // `cooldown ?? 0` is the obvious shorthand and it silently makes every
        // once-per-game event repeatable every quarter.
        expect(isReady(event({ cooldown: 0 }), { lastFired: { e1: 3 } }, 3)).toBe(true);
    });

    it('a cooldown lets it back after the wait', () => {
        const e = event({ cooldown: 8 });
        expect(isReady(e, { lastFired: { e1: 10 } }, 17)).toBe(false);
        expect(isReady(e, { lastFired: { e1: 10 } }, 18)).toBe(true);
    });

    it('one that has never fired is always ready', () => {
        expect(isReady(event(), emptyHistory(), 1)).toBe(true);
    });
});

describe('validateEvents finds what data can reveal', () => {
    it('catches a chance outside the unit interval', () => {
        expect(validateEvents([event({ chance: 0 })]).map(p => p.kind)).toEqual(['impossible-chance']);
        expect(validateEvents([event({ chance: 1.5 })]).map(p => p.kind)).toEqual(['impossible-chance']);
        // 15% is not 15.
        expect(validateEvents([event({ chance: 15 })]).map(p => p.kind)).toEqual(['impossible-chance']);
    });

    it('catches an event with no headline', () => {
        expect(validateEvents([event({ headline: '   ' })]).map(p => p.kind)).toContain('silent');
    });

    it('catches a trigger that contradicts itself', () => {
        const impossible = event({
            when: [
                { kind: 'flag', flag: 'fatherDead' },
                { kind: 'not', of: { kind: 'flag', flag: 'fatherDead' } },
            ],
        });
        expect(validateEvents([impossible]).map(p => p.kind)).toContain('never-fires');
    });

    it('catches a scene the inbox could never find', () => {
        const orphan = event({ conversation: scene('nowhere') });
        expect(validateEvents([orphan], new Set(['c1'])).map(p => p.kind))
            .toContain('unregistered-conversation');
    });

    it('catches two events sharing an id, which would collide in the history', () => {
        expect(validateEvents([event(), event()]).map(p => p.kind)).toContain('duplicate');
    });
});

describe('the events that actually ship', () => {
    const known = new Set(CONVERSATIONS.map(c => c.id));

    it('have nothing wrong with them', () => {
        expect(validateEvents(EVENTS, known)).toEqual([]);
    });

    it('every scene is registered, so a headline is never followed by silence', () => {
        for (const e of EVENTS) expect(known.has(e.conversation.id)).toBe(true);
    });

    it('none of them can reach a brand new company', () => {
        // The characteristic bug: the supplier crisis before you have a
        // supplier. Nothing should be able to fire in a player's first year.
        const newborn = world({ quarter: 1, capital: 250_000, cash: 50_000 });
        expect(rollQuarter(EVENTS, newborn, emptyHistory(), 1, () => 0).fired).toEqual([]);
    });

    it('and every event is reachable by SOME company', () => {
        // ------------------------------------------------------------------
        //  WRITTEN AS PEOPLE, NOT AS A NESTED LOOP
        // ------------------------------------------------------------------
        //  This test has been wrong three times, always the same way: it
        //  assumed one company could see everything, and each new arc added a
        //  dimension the loop did not have. First an event whose trigger is
        //  being POOR, then three on exclusive bands of one dial, then a whole
        //  arc gated on flags.
        //
        //  A loop over every dial and flag is 2^n and grows with the story.
        //  These are five ways of playing instead - and the reason that is
        //  better than more nesting is that it fails LEGIBLY: an unreachable
        //  event now means "nobody who plays like this would ever see it",
        //  which is the actual question.
        // ------------------------------------------------------------------
        const archetypes: Array<[string, Partial<World>]> = [
            ['broke and alone', {
                capital: 1_000_000,
                flags: { fatherDead: true, cfoResigned: true },
                dials: { ...INITIAL_DIALS, brotherTrust: 15, pearHostility: 60 },
            }],
            ['broke, but the CFO is still here', {
                // Added because the first pass had no archetype that was both
                // short of money and still had a finance director - which is
                // the single most ordinary bad quarter in the game, and the
                // only state the cash warning can fire in.
                capital: 1_000_000,
                flags: { fatherDead: true },
                dials: { ...INITIAL_DIALS, cfoTrust: 70, pearHostility: 60 },
            }],
            ['rich and hated', {
                capital: 500_000_000,
                flags: { fatherDead: true },
                dials: { ...INITIAL_DIALS, brotherTrust: 15, cfoTrust: 70, pearHostility: 60 },
            }],
            ['rich and reconciled', {
                capital: 500_000_000,
                flags: { fatherDead: true },
                dials: { ...INITIAL_DIALS, brotherTrust: 90, cfoTrust: 70, pearHostility: 60 },
            }],
            ['keeping everyone at arm\'s length', {
                capital: 60_000_000,
                flags: { fatherDead: true },
                dials: { ...INITIAL_DIALS, brotherTrust: 60, cfoTrust: 40, pearHostility: 60 },
            }],
            ['the one who helped his friend', {
                capital: 60_000_000,
                flags: {
                    fatherDead: true, friendHelped: true, friendGrewUp: true,
                },
                dials: {
                    ...INITIAL_DIALS, friendLoyalty: 90, pearHostility: 60,
                    brotherTrust: 60, cfoTrust: 70,
                },
            }],
            ['...who is only ordinarily fond of him', {
                capital: 60_000_000,
                flags: { fatherDead: true, friendHelped: true },
                dials: { ...INITIAL_DIALS, friendLoyalty: 60, pearHostility: 60 },
            }],
            ['at war with Pear, and took the number', {
                capital: 80_000_000,
                flags: { fatherDead: true, friendHelped: true, moleUnlocked: true },
                dials: { ...INITIAL_DIALS, friendLoyalty: 90, pearHostility: 80 },
            }],
            ['...and used it once', {
                capital: 80_000_000,
                flags: {
                    fatherDead: true, friendHelped: true,
                    moleUnlocked: true, moleEngaged: true,
                },
                dials: { ...INITIAL_DIALS, friendLoyalty: 90, pearHostility: 80 },
            }],
            ['...and kept using it', {
                capital: 80_000_000,
                flags: {
                    fatherDead: true, friendHelped: true,
                    moleUnlocked: true, moleEngaged: true, moleRepeated: true,
                },
                dials: { ...INITIAL_DIALS, friendLoyalty: 90, pearHostility: 80 },
            }],
        ];

        const seen = new Set<string>();
        for (const [, over] of archetypes) {
            const w = world({ quarter: 40, ...over });
            rollQuarter(EVENTS, w, emptyHistory(), 40, () => 1)
                .eligible.forEach(e => seen.add(e.id));
        }

        const unreachable = EVENTS.filter(e => !seen.has(e.id)).map(e => e.id);
        expect(unreachable).toEqual([]);
    });

    it('a common event must be a REACTION, not weather', () => {
        // THE RULE THIS REPLACED said flatly that any chance above a third was
        // "a recurring cost with a cutscene". That is right about weather and
        // wrong about a reaction: when the company is three quarters from
        // empty, the finance director noticing is not a 12% event, and making
        // it one would mean the warning that arrives is luck rather than the
        // state of the balance sheet.
        //
        // So the test is now about what makes it common. An event may be
        // near-certain if it is gated on a specific situation - and must be
        // rare if the only thing gating it is time passing.
        const narrowing = (e: (typeof EVENTS)[number]) =>
            e.when.some(c => c.kind !== 'quarterAtLeast'
                && c.kind !== 'flag' && c.kind !== 'noFlag');

        for (const e of EVENTS) {
            if (e.chance > 0.33) {
                expect({ id: e.id, narrowed: narrowing(e) })
                    .toEqual({ id: e.id, narrowed: true });
            }
        }
    });
});
