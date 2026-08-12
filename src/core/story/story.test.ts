// src/core/story/story.test.ts
//
// The story's memory is read by every scene in the game, so a fault here is
// not one broken conversation - it is a wrong reaction everywhere, and the
// kind that looks intentional. These pin the rules.

import { INITIAL_DIALS, band, clampDial, type Dials, type StoryFlag } from './state';
import { applyEffect, applyEffects, type Effect, type EffectSink } from './effects';
import { flagsMentioned, test, testAll, type Condition, type World } from './conditions';

// --- A sink that records instead of doing ----------------------------------
const recorder = () => {
    const log: string[] = [];
    const sink: EffectSink = {
        capital: a => log.push(`capital:${a}`),
        cash: a => log.push(`cash:${a}`),
        brand: a => log.push(`brand:${a}`),
        dial: (d, delta) => log.push(`dial:${d}:${delta}`),
        flag: f => log.push(`flag:${f}`),
        message: (who, text) => log.push(`message:${who}:${text}`),
        mail: m => log.push(`mail:${m.subject}`),
        news: h => log.push(`news:${h}`),
        ending: id => log.push(`ending:${id}`),
        reprice: (c, m) => log.push(`reprice:${c}:${m}`),
        royalty: (c, r) => log.push(`royalty:${c}:${r}`),
        siege: (c, q, p) => log.push(`siege:${c}:${q}:${p}`),
        raid: c => log.push(`raid:${c}`),
        retention: c => log.push(`retention:${c}`),
        divest: (c, m) => log.push(`divest:${c}:${m}`),
        schedule: i => log.push(`schedule:${i.conversation}:+${i.afterQuarters}`),
    };
    return { log, sink };
};

const world = (over: Partial<World> = {}): World => ({
    dials: { ...INITIAL_DIALS } as Dials,
    flags: {},
    quarter: 1,
    capital: 1_000_000,
    cash: 100_000,
    morale: 75,
    marketShare: 4,
    // A fully crewed plant and an empty lab: the state every one of these
    // tests was implicitly assuming before the COO and the CTO could read
    // either number. Neither arc is what this file is about.
    staffing: 100,
    researchers: 0,
    // Owns nothing. These tests are not about the portfolio.
    subsidiaries: [],
    ...over,
});

describe('dials', () => {
    it('clamps to 0-100 rather than running off either end', () => {
        expect(clampDial(-40)).toBe(0);
        expect(clampDial(140)).toBe(100);
        expect(clampDial(63.4)).toBe(63);
    });

    it('bands are ordered and cover the whole range', () => {
        expect(band(0)).toBe('none');
        expect(band(24)).toBe('none');
        expect(band(25)).toBe('low');
        expect(band(49)).toBe('low');
        expect(band(50)).toBe('high');
        expect(band(74)).toBe('high');
        expect(band(75)).toBe('extreme');
        expect(band(100)).toBe('extreme');
    });

    it('starts Pear indifferent rather than hostile', () => {
        // He has not noticed you yet. If this ever starts high, the whole
        // first act reads as though a war is already underway.
        expect(band(INITIAL_DIALS.pearHostility)).toBe('none');
    });
});

describe('effects', () => {
    it('routes every kind to its own sink call', () => {
        const { log, sink } = recorder();
        const all: Effect[] = [
            { kind: 'capital', amount: -500 },
            { kind: 'cash', amount: 200 },
            { kind: 'brand', amount: -3 },
            { kind: 'dial', dial: 'pearHostility', delta: 20 },
            { kind: 'flag', flag: 'fatherDead' },
            { kind: 'message', who: 'bro', text: 'hi' },
            { kind: 'mail', from: 'pear', subject: 'Offer', body: '...' },
            { kind: 'news', headline: 'Something happened' },
            { kind: 'schedule', conversation: 'pear-reply', afterQuarters: 1 },
        ];
        applyEffects(all, sink);
        expect(log).toEqual([
            'capital:-500',
            'cash:200',
            'brand:-3',
            'dial:pearHostility:20',
            'flag:fatherDead',
            'message:bro:hi',
            'mail:Offer',
            'news:Something happened',
            'schedule:pear-reply:+1',
        ]);
    });

    it('applies in order, so a scene can charge then reward', () => {
        const { log, sink } = recorder();
        applyEffects([
            { kind: 'capital', amount: -100 },
            { kind: 'capital', amount: 250 },
        ], sink);
        expect(log).toEqual(['capital:-100', 'capital:250']);
    });

    it('treats no effects as nothing rather than a crash', () => {
        const { log, sink } = recorder();
        applyEffects(undefined, sink);
        expect(log).toEqual([]);
    });

    it('throws loudly on an unknown kind instead of ignoring it', () => {
        const { sink } = recorder();
        // A scene loaded from an older data file could carry a retired kind.
        // Swallowing it would mean a choice that silently does nothing.
        expect(() => applyEffect({ kind: 'nope' } as unknown as Effect, sink)).toThrow();
    });
});

describe('conditions', () => {
    it('reads flags both ways', () => {
        const w = world({ flags: { fatherDead: true } });
        expect(test({ kind: 'flag', flag: 'fatherDead' }, w)).toBe(true);
        expect(test({ kind: 'noFlag', flag: 'fatherDead' }, w)).toBe(false);
        expect(test({ kind: 'noFlag', flag: 'soldToPear' }, w)).toBe(true);
    });

    it('compares dials by BAND, not by number', () => {
        const w = world({ dials: { ...INITIAL_DIALS, pearHostility: 80 } });
        expect(test({ kind: 'dialAtLeast', dial: 'pearHostility', band: 'high' }, w)).toBe(true);
        expect(test({ kind: 'dialAtLeast', dial: 'pearHostility', band: 'extreme' }, w)).toBe(true);
        expect(test({ kind: 'dialAtMost', dial: 'pearHostility', band: 'high' }, w)).toBe(false);
    });

    it('a dial sitting exactly on a boundary belongs to the higher band', () => {
        // 50 is 'high'. Without this being pinned, a rebalance that moves a
        // dial by one point silently opens or closes scenes.
        const w = world({ dials: { ...INITIAL_DIALS, cfoTrust: 50 } });
        expect(test({ kind: 'dialAtLeast', dial: 'cfoTrust', band: 'high' }, w)).toBe(true);
        expect(test({ kind: 'dialAtMost', dial: 'cfoTrust', band: 'low' }, w)).toBe(false);
    });

    it('gates on time and on money', () => {
        const w = world({ quarter: 4, capital: 50, cash: 10 });
        expect(test({ kind: 'quarterAtLeast', quarter: 4 }, w)).toBe(true);
        expect(test({ kind: 'quarterAtLeast', quarter: 5 }, w)).toBe(false);
        expect(test({ kind: 'capitalAtLeast', amount: 51 }, w)).toBe(false);
        expect(test({ kind: 'cashAtLeast', amount: 10 }, w)).toBe(true);
    });

    it('composes with all / any / not', () => {
        const w = world({ flags: { fatherDead: true }, quarter: 5 });
        const gate: Condition = {
            kind: 'all',
            of: [
                { kind: 'flag', flag: 'fatherDead' },
                { kind: 'not', of: { kind: 'flag', flag: 'soldToPear' } },
                {
                    kind: 'any',
                    of: [
                        { kind: 'quarterAtLeast', quarter: 9 },
                        { kind: 'dialAtLeast', dial: 'friendLoyalty', band: 'high' },
                    ],
                },
            ],
        };
        expect(test(gate, w)).toBe(true);

        // Sell to Pear and the same gate closes - one fact, whole branch gone.
        expect(test(gate, world({ flags: { fatherDead: true, soldToPear: true } }))).toBe(false);
    });

    it('no conditions means always open', () => {
        expect(testAll(undefined, world())).toBe(true);
        expect(testAll([], world())).toBe(true);
    });

    it('lists the flags a gate depends on, however deeply nested', () => {
        // The prompt-2 audit needs this: a scene gated on a flag nothing ever
        // raises can never open, and it looks finished from the outside.
        const gate: Condition = {
            kind: 'all',
            of: [
                { kind: 'flag', flag: 'fatherDead' },
                { kind: 'not', of: { kind: 'noFlag', flag: 'moleUnlocked' } },
                { kind: 'any', of: [{ kind: 'flag', flag: 'fbiGuilty' }] },
                { kind: 'quarterAtLeast', quarter: 2 },
            ],
        };
        expect(flagsMentioned(gate).sort()).toEqual(
            (['fatherDead', 'fbiGuilty', 'moleUnlocked'] as StoryFlag[]).sort(),
        );
    });
});
