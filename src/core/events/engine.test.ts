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

    it('and a large old company can see all of them', () => {
        const grown = world({
            quarter: 40,
            capital: 500_000_000,
            dials: { ...INITIAL_DIALS, pearHostility: 60 },
        });
        const eligible = rollQuarter(EVENTS, grown, emptyHistory(), 40, () => 1).eligible;
        expect(eligible).toHaveLength(EVENTS.length);
    });

    it('every one of them is rare enough to be an event', () => {
        // A per-quarter chance above a third is not a random event, it is a
        // recurring cost with a cutscene.
        for (const e of EVENTS) expect(e.chance).toBeLessThanOrEqual(0.33);
    });
});
