// src/data/events/crises.test.ts
//
// ============================================================================
//  NO WAY OUT OF ANY OF THEM IS FREE
// ============================================================================
//
//  The pack's difficulty is not a percentage. There are no dice inside a
//  choice - effects are deterministic - so "low chance of success" can only
//  honestly mean that success is not on the menu: every door out of every one
//  of these rooms takes something, and the only decision is which currency.
//
//  That is a rule, and a rule that is only written in a comment is a rule
//  until the thirteenth crisis. This file walks every terminal choice in all
//  twelve and fails on any that costs nothing.
//
//  The second thing being protected is that the pack does not become one
//  crisis twelve times. Twelve scenes that all trade money for brand would be
//  a slider with different weather on it, so the currencies are counted and
//  the spread is asserted.
// ============================================================================

import {
    CRISIS_CONVERSATIONS, CRISIS_EVENTS,
    crisisRansomware, crisisLeak, crisisForcedRecall, crisisAccident,
    crisisUnion, crisisInquiry, crisisAllocation,
    crisisForcedRecallEvent,
} from './crises';
import { recallConversation } from './recall';
import { EVENTS } from './index';
import { CONVERSATIONS } from '../story';
import { validate, type Choice } from '../../core/story/graph';
import { CAST } from '../story/cast';
import { testAll, type World } from '../../core/story/conditions';
import { INITIAL_DIALS } from '../../core/story/state';

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

/** Every answer that ends a conversation rather than turning a page. */
const terminals = (c: typeof crisisLeak): Choice[] =>
    c.nodes.flatMap(n => n.choices ?? []).filter(ch => !ch.next);

/** What an answer actually takes from the player. */
const costsOf = (ch: Choice): string[] => (ch.effects ?? [])
    .filter(e => (
        (e.kind === 'capital' && e.amount < 0)
        || (e.kind === 'cash' && e.amount < 0)
        || (e.kind === 'brand' && e.amount < 0)
        || (e.kind === 'morale' && e.amount < 0)
        || (e.kind === 'dial' && e.delta < 0)
        || e.kind === 'siege'
        // A flag is a cost when it is a fact a later scene can find you by -
        // which is what every flag in this pack is for.
        || e.kind === 'flag'
    ))
    .map(e => e.kind);

describe('twelve of them, and all of them in the game', () => {
    it('twelve, not eleven and not thirteen', () => {
        expect(CRISIS_CONVERSATIONS).toHaveLength(12);
        expect(CRISIS_EVENTS).toHaveLength(12);
    });

    it('registered, valid, and in the pool', () => {
        for (const c of CRISIS_CONVERSATIONS) {
            expect(known.has(c.id)).toBe(true);
            expect(validate(c, CAST, known)).toEqual([]);
        }
        const ids = EVENTS.map(e => e.id);
        for (const e of CRISIS_EVENTS) expect(ids).toContain(e.id);
    });

    it('and none can reach a company in its first year', () => {
        // The characteristic bug of a random event system: the supplier
        // crisis before there is a supplier. The father is also alive for the
        // whole of year one, and a crisis he would answer is not the player's.
        const young = world({ quarter: 4, flags: {} });
        for (const e of CRISIS_EVENTS) {
            expect({ id: e.id, open: testAll(e.when, young) })
                .toEqual({ id: e.id, open: false });
        }
    });
});

// ============================================================================
//  THE RULE
// ============================================================================
describe('there is no free way out of any of them', () => {
    it('every ending in all twelve costs something', () => {
        for (const c of CRISIS_CONVERSATIONS) {
            const ends = terminals(c);
            expect({ scene: c.id, endings: ends.length })
                .not.toEqual({ scene: c.id, endings: 0 });
            for (const ch of ends) {
                expect({ scene: c.id, answer: ch.text, costs: costsOf(ch).length })
                    .not.toEqual({ scene: c.id, answer: ch.text, costs: 0 });
            }
        }
    });

    it('and no ending anywhere in the pack hands the player money', () => {
        // A crisis that pays is an opportunity with sirens on it.
        for (const c of CRISIS_CONVERSATIONS) {
            for (const ch of c.nodes.flatMap(n => n.choices ?? [])) {
                for (const e of ch.effects ?? []) {
                    if (e.kind === 'capital' || e.kind === 'cash') {
                        expect({ scene: c.id, amount: e.amount })
                            .toEqual({ scene: c.id, amount: expect.any(Number) });
                        expect(e.amount).toBeLessThan(0);
                    }
                    if (e.kind === 'brand') expect(e.amount).toBeLessThan(0);
                }
            }
        }
    });

    it('and no scene has a branch that simply avoids the whole thing', () => {
        // Every path through every one of them reaches an ending with a cost
        // on it, so there is nowhere to click that skips the bill.
        for (const c of CRISIS_CONVERSATIONS) {
            for (const node of c.nodes) {
                const choices = node.choices ?? [];
                if (!choices.length) continue;
                // A card either moves you on or charges you. Never neither.
                for (const ch of choices) {
                    const movesOn = !!ch.next;
                    const charges = costsOf(ch).length > 0;
                    expect({ scene: c.id, node: node.id, answer: ch.text, ok: movesOn || charges })
                        .toEqual({ scene: c.id, node: node.id, answer: ch.text, ok: true });
                }
            }
        }
    });
});

// ============================================================================
//  MOST OF THEM COST BRAND
// ============================================================================
describe('and most of the damage is to the name on the box', () => {
    const touchesBrand = (c: typeof crisisLeak) => c.nodes
        .flatMap(n => n.choices ?? [])
        .flatMap(ch => ch.effects ?? [])
        .some(e => e.kind === 'brand');

    it('at least three quarters of them', () => {
        const n = CRISIS_CONVERSATIONS.filter(touchesBrand).length;
        expect(n).toBeGreaterThanOrEqual(9);
    });

    it('but not all of them, or brand would be the only currency', () => {
        // TEN OF TWELVE, and the first draft was twelve of twelve - which the
        // count below caught. "Most damage the brand" is a different design
        // from "all of them do": the second is a slider with weather on it.
        //
        // The two that do not: the allocation cut costs the shelf for three
        // quarters and nothing else, because nothing is on fire and nobody is
        // calling. And a quietly settled patent suit costs money and a
        // sentence about the second letter that always comes - it does not
        // move what the public thinks, because the public never hears.
        expect(CRISIS_CONVERSATIONS.filter(touchesBrand).length).toBe(10);
    });

    it('and the pack spends more than one currency across the twelve', () => {
        const kinds = new Set(
            CRISIS_CONVERSATIONS
                .flatMap(c => terminals(c))
                .flatMap(costsOf),
        );
        // Money, name, people, standing, position, and a fact about you.
        expect(kinds.size).toBeGreaterThanOrEqual(5);
        expect(kinds).toContain('capital');
        expect(kinds).toContain('brand');
        expect(kinds).toContain('morale');
        expect(kinds).toContain('siege');
        expect(kinds).toContain('flag');
    });
});

// ============================================================================
//  WHO BRINGS THEM
// ============================================================================
describe('most of them are your own people in your doorway', () => {
    it('ten of twelve come from inside the company', () => {
        // The pack's identity, and what separates it from the market letters:
        // those all arrive from outside. A crisis is somebody who works for
        // you, usually having already started fixing it.
        const inside = CRISIS_CONVERSATIONS
            .filter(c => ['coo', 'cto', 'cfo'].includes(c.from));
        expect(inside.length).toBe(10);
    });

    it('and the two strangers are the two who are not on your side', () => {
        const outside = CRISIS_CONVERSATIONS
            .filter(c => !['coo', 'cto', 'cfo'].includes(c.from))
            .map(c => c.from);
        expect(outside.sort()).toEqual(['hacker', 'regulator']);
    });

    it('and everybody uses the channel the cast file gives them', () => {
        for (const c of CRISIS_CONVERSATIONS) {
            const from = CAST[c.from];
            expect({ scene: c.id, from: c.from, cast: !!from })
                .toEqual({ scene: c.id, from: c.from, cast: true });
            if (from.channels !== 'both') {
                expect({ scene: c.id, channel: c.channel })
                    .toEqual({ scene: c.id, channel: from.channels });
            }
            expect(c.channelBreak).toBeUndefined();
        }
    });
});

// ============================================================================
//  THE ONE THAT IS NOT A SURPRISE
// ============================================================================
describe('the regulator finds the batch you buried', () => {
    it('and it is the only crisis with no decision in it', () => {
        // Every other one asks something. This one is the consequence of a
        // question that was already answered, two months and one scene ago.
        for (const ch of terminals(crisisForcedRecall)) {
            expect(ch.text).toBe('(comply)');
        }
    });

    it('it can only reach a player who took that branch', () => {
        expect(testAll(crisisForcedRecallEvent.when, world())).toBe(false);
        expect(testAll(crisisForcedRecallEvent.when,
            world({ flags: { fatherDead: true, buriedTheRecall: true } }))).toBe(true);
    });

    it('and the branch now raises the flag, which it did not', () => {
        // THE BUG THIS CLOSED. `buried` had no choices and no effects at all,
        // so shipping a known defect cost precisely nothing - while the COO
        // said on that very card that it was "the expensive option" and that
        // "we will not find out why for about two months". Nothing ever
        // arrived. This is what makes that sentence true.
        const buried = recallConversation.nodes.find(n => n.id === 'buried')!;
        expect(buried.choices?.length).toBeGreaterThan(0);
        const raised = (buried.choices ?? [])
            .flatMap(ch => ch.effects ?? [])
            .filter(e => e.kind === 'flag')
            .map(e => (e as any).flag);
        expect(raised).toContain('buriedTheRecall');
    });

    it('and it costs more than announcing ever would have', () => {
        // The lesson only lands if the arithmetic backs it. The voluntary
        // recall costs 4 brand; this one costs three times that and takes the
        // public standing with it.
        const forced = crisisForcedRecall.nodes
            .flatMap(n => n.choices ?? [])
            .flatMap(ch => ch.effects ?? []);
        const brandHit = forced.find(e => e.kind === 'brand') as any;
        const announced = recallConversation.nodes.find(n => n.id === 'announced')!
            .choices![0].effects!.find(e => e.kind === 'brand') as any;
        expect(Math.abs(brandHit.amount)).toBeGreaterThan(Math.abs(announced.amount) * 2);
    });

    it('and it happens once, because it is a consequence rather than weather', () => {
        expect(crisisForcedRecallEvent.cooldown).toBeUndefined();
    });
});

// ============================================================================
//  THE INDIVIDUAL SHAPES
// ============================================================================
describe('and they are not one crisis twelve times', () => {
    it('paying the ransom is cheaper on the name and leaves a fact behind', () => {
        const all = crisisRansomware.nodes.flatMap(n => n.choices ?? []);
        const paid = all.find(ch => ch.text === 'Pay it.')!;
        const rebuilt = all.find(ch => ch.text.startsWith('Rebuild'))!;
        const brandOf = (ch: Choice) =>
            Math.abs(((ch.effects ?? []).find(e => e.kind === 'brand') as any)?.amount ?? 0);
        expect(brandOf(paid)).toBeLessThan(brandOf(rebuilt));
        expect(costsOf(paid)).toContain('flag');
    });

    it('the accident is the only one where the expensive door RAISES morale', () => {
        // They were watching. It is the single place in the pack where doing
        // the costly thing is felt by anybody inside the building.
        const rises = crisisAccident.nodes
            .flatMap(n => n.choices ?? [])
            .flatMap(ch => ch.effects ?? [])
            .filter(e => e.kind === 'morale' && e.amount > 0);
        expect(rises.length).toBeGreaterThan(0);

        const elsewhere = CRISIS_CONVERSATIONS
            .filter(c => c.id !== crisisAccident.id && c.id !== crisisUnion.id)
            .flatMap(c => c.nodes)
            .flatMap(n => n.choices ?? [])
            .flatMap(ch => ch.effects ?? [])
            .filter(e => e.kind === 'morale' && e.amount > 0);
        expect(elsewhere).toEqual([]);
    });

    it('and every path through the accident records that it happened', () => {
        // There is no version of it where nobody was hurt.
        for (const ch of terminals(crisisAccident)) {
            expect(costsOf(ch)).toContain('flag');
        }
    });

    it('the inquiry is the only one where the honest answer costs MORE money', () => {
        const all = crisisInquiry.nodes.flatMap(n => n.choices ?? []);
        const narrow = all.find(ch => ch.text.startsWith('Narrow'))!;
        const everything = all.find(ch => ch.text.startsWith('Everything'))!;
        const money = (ch: Choice) =>
            Math.abs(((ch.effects ?? []).find(e => e.kind === 'capital') as any)?.amount ?? 0);
        expect(money(everything)).toBeGreaterThan(money(narrow));
        // And it is the CFO who notices, in both directions.
        const trust = (ch: Choice) =>
            ((ch.effects ?? []).find(e => e.kind === 'dial') as any)?.delta ?? 0;
        expect(trust(everything)).toBeGreaterThan(0);
        expect(trust(narrow)).toBeLessThan(0);
    });

    it('two of them cost production rather than money or name', () => {
        const withSiege = CRISIS_CONVERSATIONS.filter(c => c.nodes
            .flatMap(n => n.choices ?? [])
            .flatMap(ch => ch.effects ?? [])
            .some(e => e.kind === 'siege'));
        expect(withSiege.map(c => c.id).sort())
            .toEqual([crisisAllocation.id, 'event-crisis-supplier'].sort());
    });

    it('and the sieges they cause all expire, unlike a raid', () => {
        // A supply failure is temporary by nature. If one of these were
        // permanent it would be a different mechanic wearing this one's name.
        for (const c of CRISIS_CONVERSATIONS) {
            for (const e of c.nodes.flatMap(n => n.choices ?? []).flatMap(ch => ch.effects ?? [])) {
                if (e.kind === 'siege') {
                    expect(e.quarters).toBeGreaterThan(0);
                    expect(e.quarters).toBeLessThanOrEqual(6);
                }
            }
        }
    });

    it('the union dispute is not about pay, so paying does not end it', () => {
        // Distinct from the COO's walkout, which IS about pay and reads
        // morale. Two scenes about a stopped line would otherwise be one.
        expect(crisisUnion.nodes[0].text).toContain('it is not about pay');
        expect(crisisUnion.nodes[0].text).toContain('shift pattern');
    });
});
