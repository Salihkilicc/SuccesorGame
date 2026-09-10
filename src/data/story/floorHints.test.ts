// src/data/story/floorHints.test.ts
//
// ============================================================================
//  A TUTORIAL THAT ARRIVES WHEN THE LESSON BITES
// ============================================================================
//
//  Seven mechanics, seven people, explained at the moment the player runs into
//  them rather than in a compulsory hour at the front of the game.
//
//  Three kinds of claim, and they need three kinds of test:
//
//    THE TRIGGERS   arithmetic. Each one fires on the world it is about and
//                   on no other, and none of them fires before the father is
//                   dead or in a company that has never traded.
//
//    THE WRITING    two stated rules - no exclamation marks, and short enough
//                   to be read. Both are gates rather than intentions, the
//                   same shape as the ban on dashes.
//
//    THE PLUMBING   registered, queued, paced and skippable. Every one of
//                   those is a place a scene can be written and then never
//                   arrive, which is this project's oldest failure.
// ============================================================================

import {
    FLOOR_HINTS, FLOOR_HINT_IDS, OVERSTOCKED_UNITS, SOLD_OUT_PERCENT, THIN_CAPITAL,
} from './floorHints';
import { CONVERSATIONS, STORY_BEATS } from './index';
import { CAST } from './cast';
import { OPENING_ACT } from './openingAct';
import { testAll, type World } from '../../core/story/conditions';
import { INITIAL_DIALS } from '../../core/story/state';
import { STORY_TR, nodeKey } from '../i18n/storyText';
import { DELIVERIES_PER_QUARTER } from '../../core/story/inbox';
import { FACILITY_TIERS } from '../../core/market/capacity';

/** A world in which nothing has gone wrong. */
const calm = (over: Partial<World> = {}): World => ({
    dials: { ...INITIAL_DIALS },
    flags: { fatherDead: true },
    quarter: 6,
    capital: 3_000_000,
    cash: 500_000,
    morale: 75,
    marketShare: 0.4,
    staffing: 100,
    researchers: 1,
    subsidiaries: [],
    casinoStreak: 0,
    quartersWithoutSponsor: 0,
    sellThrough: 60,
    endingInventory: 100,
    categoriesOpen: 1,
    ...over,
} as World);

const fires = (id: string, world: World): boolean => {
    const c = FLOOR_HINTS.find(h => h.id === id)!;
    return testAll(c.when, world);
};

describe('nobody speaks while the father is alive', () => {
    it('not one of the seven, whatever else is true', () => {
        // The first year has a narrator. A second voice explaining the same
        // company over the top of him is the thing this is meant to replace.
        const loud = calm({
            flags: {},
            sellThrough: 100,
            endingInventory: 999_999,
            capital: 0,
            quarter: 40,
            categoriesOpen: 5,
        });
        for (const id of FLOOR_HINT_IDS) expect(fires(id, loud)).toBe(false);
    });

    it('and a company that has never traded has made no mistakes yet', () => {
        // `sellThrough`, `endingInventory` and `categoriesOpen` come off a
        // report that does not exist before the first quarter closes. The
        // defaults are the "no quarter yet" reading, and they must fire
        // nothing - see the note on those three in conditions.ts.
        const fresh = { ...calm(), quarter: 1 } as World;
        delete (fresh as any).sellThrough;
        delete (fresh as any).endingInventory;
        delete (fresh as any).categoriesOpen;
        for (const id of FLOOR_HINT_IDS) expect(fires(id, fresh)).toBe(false);
    });
});

describe('and each one is about the thing that just happened', () => {
    it('the shelf emptied, which reads backwards and is the point', () => {
        // A hundred per cent sell-through is not triumph. It is the last unit
        // leaving and the next customer buying elsewhere.
        expect(fires('hint-demand', calm({ sellThrough: SOLD_OUT_PERCENT }))).toBe(true);
        expect(fires('hint-demand', calm({ sellThrough: SOLD_OUT_PERCENT - 1 }))).toBe(false);
        expect(fires('hint-demand', calm({ sellThrough: 100 }))).toBe(true);
    });

    it('and the warehouse filled, which costs more and looks like nothing', () => {
        expect(fires('hint-stock-cost', calm({ endingInventory: OVERSTOCKED_UNITS }))).toBe(true);
        expect(fires('hint-stock-cost', calm({ endingInventory: OVERSTOCKED_UNITS - 1 }))).toBe(false);
    });

    it('and the threshold is a real quarter of the starting plant', () => {
        // Not a number somebody liked the look of. Tier one builds this many
        // units in a quarter, so the pile is one entire quarter of work that
        // nobody bought. The weld, because sequence.ts may not import
        // capacity.ts and neither may this data file.
        expect(OVERSTOCKED_UNITS).toBe(FACILITY_TIERS[0].capacity);
    });

    it('and the money ran thin, before the machinery starts counting', () => {
        expect(fires('hint-cash-flow', calm({ capital: THIN_CAPITAL }))).toBe(true);
        expect(fires('hint-cash-flow', calm({ capital: THIN_CAPITAL + 1 }))).toBe(false);
        // Well above insolvency, which only starts once capital is NEGATIVE.
        // A warning that arrives with the consequence is not a warning.
        expect(THIN_CAPITAL).toBeGreaterThan(0);
    });

    it('and the brother counts your votes in the second year', () => {
        expect(fires('hint-board', calm({ quarter: 7 }))).toBe(false);
        expect(fires('hint-board', calm({ quarter: 8 }))).toBe(true);
    });

    it('and the floor stops trying in the third', () => {
        expect(fires('hint-morale', calm({ quarter: 8 }))).toBe(false);
        expect(fires('hint-morale', calm({ quarter: 9 }))).toBe(true);
    });

    it('and the name does not travel to the second market', () => {
        expect(fires('hint-sector-brand', calm({ categoriesOpen: 1 }))).toBe(false);
        expect(fires('hint-sector-brand', calm({ categoriesOpen: 2 }))).toBe(true);
    });

    it('and the skill gate fires on an ABSENCE, which is the useful one', () => {
        // ------------------------------------------------------------------
        //  THE ONLY ONE THAT ARRIVES BEFORE THE MISTAKE
        // ------------------------------------------------------------------
        //  Three years in, money in the bank, still selling one thing: that
        //  is a player who has tried the second category, been refused, and
        //  does not know why. Every other hint explains something that has
        //  already cost them.
        // ------------------------------------------------------------------
        const stuck = calm({ quarter: 12, capital: 2_000_000, categoriesOpen: 1 });
        expect(fires('hint-skill-gate', stuck)).toBe(true);
        // Not to somebody who already got in.
        expect(fires('hint-skill-gate', { ...stuck, categoriesOpen: 2 })).toBe(false);
        // Not to somebody too early to have tried.
        expect(fires('hint-skill-gate', { ...stuck, quarter: 11 })).toBe(false);
        // And not to somebody who simply has no money, because then the
        // answer is the money and Priya would be wrong.
        expect(fires('hint-skill-gate', { ...stuck, capital: 100_000 })).toBe(false);
    });
});

describe('and they are written the way they were asked to be', () => {
    const lines = () => FLOOR_HINTS.flatMap(h => [
        ...h.nodes.map(n => n.text),
        ...h.nodes.map(n => STORY_TR[nodeKey(h.id, n.id)] ?? ''),
    ]);

    it('no exclamation marks, in either language', () => {
        // "Asla ünlem işareti kullanılmayacak, dil soğuk ve profesyonel
        // kalacak." These people are professionals reporting a problem; a
        // raised voice would make the game sound like a helper app.
        expect(lines().filter(l => l.includes('!'))).toEqual([]);
    });

    it('and short enough that they are actually read', () => {
        // "Uzun olursa okunmaz." A hint nobody reads is worse than none: it
        // taught nothing AND spent the quarter's one delivery.
        const long = lines().filter(l => l.length > 160);
        expect(long).toEqual([]);
        // And not so short they say nothing.
        expect(lines().every(l => l.length > 40)).toBe(true);
    });

    it('and none of them uses a dash', () => {
        expect(lines().filter(l => /[–—]|\s-\s/.test(l))).toEqual([]);
    });

    it('and every one exists in Turkish', () => {
        for (const h of FLOOR_HINTS) {
            for (const n of h.nodes) {
                expect(typeof STORY_TR[nodeKey(h.id, n.id)]).toBe('string');
            }
        }
    });

    it('and nobody is handed a line in somebody else voice', () => {
        // The sender and the speaker are the same person, always. A hint
        // attributed to the CFO and spoken by the COO would read as a bug in
        // the inbox rather than in the data.
        for (const h of FLOOR_HINTS) {
            expect(h.channel).toBe('message');
            expect(CAST[h.from]).toBeDefined();
            for (const n of h.nodes) expect(n.speaker).toBe(h.from);
        }
    });

    it('and each is one card with the last word', () => {
        // No choices: graph.ts says a card with no answers means the other
        // person finished speaking, which is the shape of being told a thing.
        for (const h of FLOOR_HINTS) {
            expect(h.nodes).toHaveLength(1);
            expect(h.nodes[0].choices).toBeUndefined();
        }
    });
});

describe('and they actually arrive, which is the half that goes missing', () => {
    it('all seven are registered, so the audit and the translator see them', () => {
        for (const id of FLOOR_HINT_IDS) {
            expect(CONVERSATIONS.find(c => c.id === id)).toBeDefined();
        }
        expect(FLOOR_HINT_IDS).toHaveLength(7);
    });

    it('and all seven are beats, or nothing would ever queue them', () => {
        // Registered and not queued is the exact shape of built-but-never-
        // surfaced, which is the failure this codebase produces most often.
        for (const id of FLOOR_HINT_IDS) {
            expect(STORY_BEATS.find(b => b.conversation === id)).toBeDefined();
        }
    });

    it('and NOT ONE of them is urgent, which is the whole pacing rule', () => {
        // A bad quarter trips three at once: the shelf emptied, the warehouse
        // is full, the money is thin. Urgent bypasses the allowance, so three
        // urgent hints would arrive together and teach the player to stop
        // reading. The queue is the pacing and it already exists.
        for (const id of FLOOR_HINT_IDS) {
            expect(STORY_BEATS.find(b => b.conversation === id)!.urgent).toBeFalsy();
        }
        expect(DELIVERIES_PER_QUARTER).toBe(1);
    });

    it('and skipping the opening silences every one of them', () => {
        // Asked for directly. Somebody skipping the opening has played this
        // before and does not need the floor explaining itself.
        const src = require('fs').readFileSync(
            require('path').join(__dirname, '..', '..', 'core', 'newGame.ts'), 'utf8');
        expect(src).toMatch(/FLOOR_HINT_IDS/);
        expect(src).toMatch(/\.\.\.OPENING_ACT, \.\.\.FLOOR_HINT_IDS/);
    });

    it('and they are a SECOND list rather than more of the opening act', () => {
        // The act is the father's year and these fire after he is dead.
        // Folding them in would make openingAct.test.ts wrong: it checks that
        // nothing gated on the first eight quarters was left out, and none of
        // these is.
        for (const id of FLOOR_HINT_IDS) expect(OPENING_ACT).not.toContain(id);
    });
});
