// src/data/events/fbi.test.ts
//
// ============================================================================
//  THE TRAP IS THE GRAPH, AND THE VERDICT HAS TO KEEP COSTING
// ============================================================================
//
//  Three claims.
//
//  EVERY CASE HAS A REACHABLE WAY TO BE CAUGHT AND A REACHABLE WAY OUT. An
//  interview with no survivable path is a cutscene with buttons; one with no
//  fatal path is a formality. Both branches are walked here.
//
//  THE BRIBE IS ALWAYS FATAL AND ALWAYS OFFERED. It is the only thing in the
//  game that is unconditionally the wrong answer, and it has to be present in
//  all three or it is a trick rather than a rule.
//
//  `fbiGuilty` IS A POISON AND NOT A LABEL. This is the one that would fail
//  silently: a flag raised once, read by a couple of gates, and free from the
//  next quarter onwards. The verdict takes 25 points of brand; the tick keeps
//  taking 1.5 a quarter afterwards and every board's resistance is 0.30
//  higher forever. Both are asserted against the engine rather than described.
// ============================================================================

import {
    FBI_CONVERSATIONS, FBI_EVENTS,
    fbiFinancial, fbiInsider, fbiEspionage,
    fbiFinancialEvent, fbiInsiderEvent, fbiEspionageEvent,
} from './fbi';
import { EVENTS } from './index';
import { CONVERSATIONS } from '../story';
import { validate, type Choice, type Conversation } from '../../core/story/graph';
import { CAST } from '../story/cast';
import { testAll, type World } from '../../core/story/conditions';
import {
    INITIAL_DIALS, CONVICTION_BRAND_DRAIN, CONVICTION_CEILING_PENALTY,
} from '../../core/story/state';
import { resistance, CONVICTION_RESISTANCE, willEngage } from '../../core/market/negotiation';

const known = new Set(CONVERSATIONS.map(c => c.id));

const world = (over: Partial<World> = {}): World => ({
    dials: { ...INITIAL_DIALS },
    flags: { fatherDead: true },
    quarter: 24,
    capital: 100_000_000,
    cash: 500_000,
    morale: 71,
    marketShare: 4,
    staffing: 100,
    researchers: 0,
    subsidiaries: [],
    // Never at a table, and the name has never been on anything.
    casinoStreak: 0,
    quartersWithoutSponsor: 0,
    ...over,
});

const allChoices = (c: Conversation): Choice[] =>
    c.nodes.flatMap(n => n.choices ?? []);

const endsIn = (c: Conversation, flag: string): Choice[] =>
    allChoices(c).filter(ch => (ch.effects ?? [])
        .some(e => e.kind === 'flag' && (e as any).flag === flag));

/** Can this node be reached by walking from the start? */
const reachable = (c: Conversation, id: string): boolean => {
    const seen = new Set([c.start]);
    const queue = [c.start];
    while (queue.length) {
        // SHIFTED ONCE, OUTSIDE THE PREDICATE. The first version of this
        // helper read `c.nodes.find(n => n.id === queue.shift())`, which calls
        // shift() once per node and empties the queue while searching it. It
        // reported half the graph as unreachable and the bug was in the test.
        const id = queue.shift();
        const node = c.nodes.find(n => n.id === id);
        for (const ch of node?.choices ?? []) {
            if (ch.next && !seen.has(ch.next)) { seen.add(ch.next); queue.push(ch.next); }
        }
    }
    return seen.has(id);
};

describe('three cases, three different reasons to be sitting there', () => {
    it('registered, valid and in the pool', () => {
        expect(FBI_CONVERSATIONS).toHaveLength(3);
        for (const c of FBI_CONVERSATIONS) {
            expect(known.has(c.id)).toBe(true);
            expect(validate(c, CAST, known)).toEqual([]);
        }
        const ids = EVENTS.map(e => e.id);
        for (const e of FBI_EVENTS) expect(ids).toContain(e.id);
    });

    it('all three are letters, because everything they send is written to be quoted', () => {
        for (const c of FBI_CONVERSATIONS) {
            expect(c.channel).toBe('mail');
            expect(c.from).toBe('fbi');
            expect(c.subject).toContain('File');
        }
    });

    it('and each needs a different thing to have happened', () => {
        const clean = world();
        for (const e of FBI_EVENTS) expect(testAll(e.when, clean)).toBe(false);

        expect(testAll(fbiFinancialEvent.when,
            world({ flags: { fatherDead: true, bragaKeptPaying: true } }))).toBe(true);
        expect(testAll(fbiEspionageEvent.when,
            world({ flags: { fatherDead: true, moleEngaged: true } }))).toBe(true);
        expect(testAll(fbiInsiderEvent.when,
            world({ dials: { ...INITIAL_DIALS, brotherTrust: 20 } }))).toBe(true);
        // And NOT at the starting value, which is the trap this gate fell into
        // on the first pass: brotherTrust begins at 40, already inside 'low'.
        expect(testAll(fbiInsiderEvent.when,
            world({ dials: { ...INITIAL_DIALS } }))).toBe(false);
    });

    it('and none of them arrives twice, because a campaign has one verdict', () => {
        for (const flag of ['fbiGuilty', 'fbiCleared'] as const) {
            const after = world({
                flags: { fatherDead: true, bragaKeptPaying: true, moleEngaged: true, [flag]: true },
                dials: { ...INITIAL_DIALS, brotherTrust: 20 },
            });
            for (const e of FBI_EVENTS) {
                expect({ id: e.id, flag, open: testAll(e.when, after) })
                    .toEqual({ id: e.id, flag, open: false });
            }
        }
    });
});

// ============================================================================
//  THE INTERVIEW
// ============================================================================
describe('every interview can be survived and can be lost', () => {
    it('both endings are reachable in all three', () => {
        // An interview with no survivable path is a cutscene with buttons.
        // One with no fatal path is a formality.
        for (const c of FBI_CONVERSATIONS) {
            const guilty = endsIn(c, 'fbiGuilty');
            const cleared = endsIn(c, 'fbiCleared');
            expect({ case: c.id, guilty: guilty.length, cleared: cleared.length })
                .not.toEqual({ case: c.id, guilty: 0, cleared: expect.anything() });
            expect(cleared.length).toBeGreaterThan(0);
        }
    });

    it('and every node in all three can actually be walked to', () => {
        // The audit found a dead card in the first draft of the financial
        // case - written, wired to nothing, and invisible by reading.
        for (const c of FBI_CONVERSATIONS) {
            for (const n of c.nodes) {
                expect({ case: c.id, node: n.id, reachable: reachable(c, n.id) })
                    .toEqual({ case: c.id, node: n.id, reachable: true });
            }
        }
    });

    it('the interview is at least four cards deep before a verdict', () => {
        // "3-4 adimlik derin graf". Two cards and a verdict is a form.
        for (const c of FBI_CONVERSATIONS) {
            expect(c.nodes.length).toBeGreaterThanOrEqual(6);
        }
    });

    it('and the trap is a branch rather than a die', () => {
        // The second card commits you to a version of events and leads to two
        // DIFFERENT third cards. Without that, "contradicting yourself" would
        // have to be a random penalty, because a conversation cannot remember.
        const second = fbiFinancial.nodes.find(n => n.id === 'q1')!;
        const branches = (second.choices ?? []).map(ch => ch.next);
        expect(new Set(branches).size).toBe(2);
        for (const b of branches) expect(fbiFinancial.nodes.some(n => n.id === b)).toBe(true);
    });

    it('and being wrong ONCE is survivable - it is the second version that kills', () => {
        // Every case offers a revision after the first bad answer, and taking
        // it leads somewhere that can still be cleared. People misremember
        // dates; that is not what these interviews are about.
        const revise = fbiInsider.nodes.find(n => n.id === 'nobody')!;
        const revising = revise.choices!.find(ch => ch.next === 'revised')!;
        expect(revising).toBeDefined();
        expect(reachable(fbiInsider, 'verdictClear')).toBe(true);
    });
});

describe('the bribe', () => {
    it('is offered in all three', () => {
        for (const c of FBI_CONVERSATIONS) {
            expect(c.nodes.some(n => n.id === 'bribe')).toBe(true);
            expect(reachable(c, 'bribe')).toBe(true);
        }
    });

    it('and is always fatal, with no way back off that card', () => {
        for (const c of FBI_CONVERSATIONS) {
            const node = c.nodes.find(n => n.id === 'bribe')!;
            expect(node.choices).toHaveLength(1);
            const [only] = node.choices!;
            expect(only.next).toBeUndefined();
            expect((only.effects ?? []).some(e =>
                e.kind === 'flag' && (e as any).flag === 'fbiGuilty')).toBe(true);
        }
    });

    it('and it reads as the reasonable thing to try, which is the point', () => {
        // Written plausibly rather than as a moustache-twirl. A player who has
        // been sweating for three cards will reach for it.
        for (const c of FBI_CONVERSATIONS) {
            const offers = allChoices(c).filter(ch => ch.next === 'bribe');
            expect(offers.length).toBeGreaterThan(0);
            for (const o of offers) {
                expect(o.text.toLowerCase()).not.toContain('bribe');
                expect(o.text.toLowerCase()).not.toContain('illegal');
            }
        }
    });
});

// ============================================================================
//  THE VERDICT
// ============================================================================
describe('being found guilty', () => {
    const guiltyEffects = endsIn(fbiFinancial, 'fbiGuilty')[0].effects!;

    it('costs money, the name and the public, all at once', () => {
        const kinds = guiltyEffects.map(e => e.kind);
        expect(kinds).toContain('capital');
        expect(kinds).toContain('brand');
        expect(kinds).toContain('dial');
        expect(kinds).toContain('morale');
    });

    it('and the share collapse runs through brand rather than being written', () => {
        // A one-off write to companyValue would be erased by the next tick,
        // which recomputes the valuation from earnings, revenue, brand and
        // share. That is the bug this codebase already found once in
        // gameSink.brand. Brand persists and carries into the multiple.
        const brand = guiltyEffects.find(e => e.kind === 'brand') as any;
        expect(brand.amount).toBeLessThanOrEqual(-20);
        // And nothing anywhere in these three writes a valuation directly.
        for (const c of FBI_CONVERSATIONS) {
            for (const e of allChoices(c).flatMap(ch => ch.effects ?? [])) {
                expect(e.kind).not.toBe('reprice');
            }
        }
    });

    it('all three cases share one verdict, so no case is secretly milder', () => {
        const shape = (c: Conversation) => endsIn(c, 'fbiGuilty')
            .map(ch => JSON.stringify(ch.effects));
        const first = shape(fbiFinancial)[0];
        for (const c of FBI_CONVERSATIONS) {
            for (const s of shape(c)) expect(s).toBe(first);
        }
    });

    it('and being cleared is not free either', () => {
        const cleared = endsIn(fbiFinancial, 'fbiCleared')[0].effects!;
        expect(cleared.some(e => e.kind === 'capital' && e.amount < 0)).toBe(true);
        expect(cleared.some(e => e.kind === 'brand' && e.amount < 0)).toBe(true);
    });
});

// ============================================================================
//  AND THE POISON
// ============================================================================
describe('fbiGuilty is a poison rather than a label', () => {
    it('the conviction keeps taking brand every quarter, forever', () => {
        // The failure this guards: a flag raised once, read by two gates, and
        // free from the next quarter onwards.
        // The shelved drain. Kept as a constant with the measurement that
        // retired it written next to it - see core/story/state.ts.
        expect(CONVICTION_BRAND_DRAIN).toBeGreaterThan(0);
        expect(CONVICTION_CEILING_PENALTY).toBeGreaterThan(10);
        // Small and relentless rather than large and memorable - a larger
        // number would be a slow game over, which is a different thing from
        // a permanent handicap.
        expect(CONVICTION_BRAND_DRAIN).toBeLessThan(3);
    });

    it('and every board becomes harder to buy from, measured', () => {
        const base = {
            targetMarketCap: 100_000_000,
            acquirerValuation: 500_000_000,
            risk: 'Medium' as const,
            subject: 'purchase' as const,
            personalityShift: 0,
            priorRefusals: 0,
        };
        const clean = resistance(base);
        const convicted = resistance({ ...base, convicted: true });

        expect(convicted - clean).toBeCloseTo(CONVICTION_RESISTANCE, 6);
        // And it is enough to actually close an ordinary target rather than
        // being a number that changes nothing.
        expect(willEngage(clean)).toBe(true);
        expect(willEngage(convicted)).toBe(false);
    });

    it('...and the hostile route gets more expensive by the same number', () => {
        // The same score feeds hostilePremiumFor, so a convicted CEO can still
        // buy anything - at a price that has also gone up. Nothing is closed
        // outright, which would be a game over wearing a flag.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { hostilePremiumFor } = require('../../core/market/negotiation');
        // Against a board that ALREADY refuses, so both scores are past the
        // threshold and the premium is on its sloped section. Below the
        // threshold both sit on the floor and the comparison says nothing -
        // which is what the first version of this test measured.
        const base = {
            targetMarketCap: 700_000_000,
            acquirerValuation: 500_000_000,
            risk: 'Low' as const,
            strength: 85,
            subject: 'purchase' as const,
            personalityShift: 0,
            priorRefusals: 0,
        };
        expect(willEngage(resistance(base))).toBe(false);
        expect(hostilePremiumFor(resistance({ ...base, convicted: true })))
            .toBeGreaterThan(hostilePremiumFor(resistance(base)));
    });
});
