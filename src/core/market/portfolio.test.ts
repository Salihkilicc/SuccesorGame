// src/core/market/portfolio.test.ts
//
// ============================================================================
//  THE PRICE IS THE CHARACTERISATION, AND THE FUND ARRIVES WHEN IT HURTS
// ============================================================================
//
//  Two claims.
//
//  NONE OF THE THREE PRICES IS THE MARKET PRICE. An ordinary exit returns 85%
//  of a subsidiary's current fair value - you cannot take a premium on the way
//  out. Every one of these three offers is deliberately somewhere else, and
//  the distance from 85 is the scene: Pear pays over because he is not buying
//  an asset, Halberd pays far under because he can see your balance sheet, and
//  Marco pays a little under and apologises for it first.
//
//  THE SQUEEZE CANNOT REACH A COMFORTABLE COMPANY. That is what makes 55% a
//  decision instead of an insult. If the gate ever comes off, the letter stops
//  being about pressure and becomes a bad offer that everybody declines, which
//  is the same as not having written it.
// ============================================================================

import {
    portfolioPear, portfolioPearEvent,
    portfolioVulture, portfolioVultureEvent,
    portfolioFriend, portfolioFriendEvent,
    PEAR_MULTIPLE, VULTURE_MULTIPLE, FRIEND_MULTIPLE, SQUEEZE_THRESHOLD,
} from '../../data/events/portfolio';
import { DIVESTITURE_DISCOUNT, quoteDivestiture, type AcquisitionDeal } from './mergers';
import { cashWarningEvent } from '../../data/events/cashWarning';
import { CONVERSATIONS } from '../../data/story';
import { EVENTS } from '../../data/events';
import { validate } from '../story/graph';
import { CAST } from '../../data/story/cast';
import { testAll, type World } from '../story/conditions';
import { INITIAL_DIALS } from '../story/state';

const known = new Set(CONVERSATIONS.map(c => c.id));
const SCENES = [portfolioPear, portfolioVulture, portfolioFriend];
const OFFERS = [portfolioPearEvent, portfolioVultureEvent, portfolioFriendEvent];

const world = (over: Partial<World> = {}): World => ({
    dials: { ...INITIAL_DIALS },
    flags: { fatherDead: true },
    quarter: 24,
    capital: 200_000_000,
    cash: 500_000,
    morale: 71,
    marketShare: 4,
    staffing: 100,
    researchers: 0,
    subsidiaries: [],
    ...over,
});

const deal: AcquisitionDeal = {
    id: 'tech_skynet',
    name: 'SkyNet AI',
    price: 100_000_000,
    fairValue: 90_000_000,
    premium: 10_000_000,
    targetAnnualEbit: 6_000_000,
    quartersSinceClose: 8,
    goodwill: 10_000_000,
    impaired: false,
    hostile: false,
};

describe('all three are in the game', () => {
    it('registered, valid and in the pool', () => {
        for (const c of SCENES) {
            expect(known.has(c.id)).toBe(true);
            expect(validate(c, CAST, known)).toEqual([]);
        }
        const ids = EVENTS.map(e => e.id);
        for (const e of OFFERS) expect(ids).toContain(e.id);
    });

    it('the two who are not your friend write letters, and he does not', () => {
        // Mail is distance. Marco has had your number since before any of this
        // and a letter from him would be the wrong thing arriving.
        expect(portfolioPear.channel).toBe('mail');
        expect(portfolioVulture.channel).toBe('mail');
        expect(portfolioFriend.channel).toBe('message');
    });
});

// ============================================================================
//  THE PRICES
// ============================================================================
describe('none of the three prices is the market price', () => {
    const market = 1 - DIVESTITURE_DISCOUNT;

    it('and the market price is what selling normally gets you', () => {
        // Read from the engine rather than restated, so a rebalance of the
        // discount moves the thing these three are measured against.
        const q = quoteDivestiture(deal);
        expect(q.proceeds).toBeCloseTo(q.currentFairValue * market, 6);
    });

    it('Pear pays OVER, because he is not buying an asset', () => {
        expect(PEAR_MULTIPLE).toBeGreaterThan(1);
        expect(PEAR_MULTIPLE).toBeGreaterThan(market);
        expect(portfolioPear.nodes.find(n => n.id === 'reasoning')!.text)
            .toContain('worth twenty-five per cent more to us because it is currently yours');
    });

    it('Halberd pays far under, and says so himself', () => {
        expect(VULTURE_MULTIPLE).toBeLessThan(market);
        // A long way under, not a haggle. Half the gap to zero.
        expect(market - VULTURE_MULTIPLE).toBeGreaterThan(0.25);
        expect(portfolioVulture.nodes[0].text).toContain('That is a bad price');
    });

    it('Marco pays a little under, and apologises before the player can', () => {
        expect(FRIEND_MULTIPLE).toBeLessThan(market);
        expect(FRIEND_MULTIPLE).toBeGreaterThan(VULTURE_MULTIPLE);
        expect(portfolioFriend.nodes.find(n => n.id === 'whatPay')!.text)
            .toContain('i know thats under');
    });

    it('and the ordering is the whole design', () => {
        expect(VULTURE_MULTIPLE).toBeLessThan(FRIEND_MULTIPLE);
        expect(FRIEND_MULTIPLE).toBeLessThan(market);
        expect(market).toBeLessThan(PEAR_MULTIPLE);
    });

    it('every scene charges the multiple it names and no other', () => {
        const expected: Record<string, number> = {
            'event-portfolio-pear': PEAR_MULTIPLE,
            'event-portfolio-vulture': VULTURE_MULTIPLE,
            'event-portfolio-friend': FRIEND_MULTIPLE,
        };
        for (const c of SCENES) {
            for (const e of c.nodes.flatMap(n => n.choices ?? []).flatMap(ch => ch.effects ?? [])) {
                if (e.kind === 'divest') {
                    expect({ scene: c.id, multiple: (e as any).priceMultiple })
                        .toEqual({ scene: c.id, multiple: expected[c.id] });
                }
            }
        }
    });
});

// ============================================================================
//  WHO CAN REACH YOU
// ============================================================================
describe('nobody offers to buy something you do not own', () => {
    it('all three require the company to still be yours', () => {
        for (const e of OFFERS) {
            expect(testAll(e.when, world({ capital: 500_000 }))).toBe(false);
        }
    });

    it('and `owns` reads what you HAVE, not what you once bought', () => {
        // The reason it is a condition rather than a flag. A player who bought
        // SkyNet and sold it two years ago should not get a letter offering to
        // buy it - and `boughtSkynet` would still be true forever.
        const soldItAlready = world({
            capital: 500_000,
            flags: { fatherDead: true, boughtSkynet: true },
            subsidiaries: [],
        });
        expect(testAll(portfolioVultureEvent.when, soldItAlready)).toBe(false);
    });

    it('each one asks about ITS company', () => {
        const holdingStreamify = world({ subsidiaries: ['tech_streamify'] });
        expect(testAll(portfolioPearEvent.when, holdingStreamify)).toBe(true);
        expect(testAll(portfolioVultureEvent.when, holdingStreamify)).toBe(false);
    });
});

describe('the fund can only reach a company that is short', () => {
    const holding = { subsidiaries: ['tech_skynet'] };

    it('never at comfortable money, however long the campaign runs', () => {
        for (const capital of [SQUEEZE_THRESHOLD + 1, 50_000_000, 900_000_000]) {
            expect({ capital, open: testAll(portfolioVultureEvent.when, world({ ...holding, capital })) })
                .toEqual({ capital, open: false });
        }
    });

    it('and always when the money has gone', () => {
        expect(testAll(portfolioVultureEvent.when,
            world({ ...holding, capital: SQUEEZE_THRESHOLD }))).toBe(true);
        expect(testAll(portfolioVultureEvent.when,
            world({ ...holding, capital: 0 }))).toBe(true);
    });

    it('and he arrives AFTER the CFO warned you, not instead of him', () => {
        // The sequence is the point. Arthur Vance's warning fires at two
        // million; this is deeper. Being told it was coming and then squeezed
        // anyway is a better quarter than either half alone.
        const cfoThreshold = (cashWarningEvent.when
            .find(c => c.kind === 'capitalAtMost') as any).amount;
        expect(SQUEEZE_THRESHOLD).toBeLessThan(cfoThreshold);
    });

    it('and he is near certain when he can reach you at all', () => {
        // Allowed to be common by the pool's own rule - gated on a specific
        // situation rather than on time. A fund that noticed 30% of the time
        // would make the squeeze luck rather than the balance sheet.
        expect(portfolioVultureEvent.chance).toBeGreaterThan(0.9);
        expect(portfolioVultureEvent.priority).toBe(5);
    });

    it('Pear, by contrast, does not care whether you are short', () => {
        // His offer is about the category and would be the same in any quarter.
        // If it were gated on cash it would read as a second vulture.
        expect(portfolioPearEvent.when.some(c => c.kind === 'capitalAtMost')).toBe(false);
    });
});

// ============================================================================
//  WHAT SELLING COSTS AND BUYS
// ============================================================================
describe('the three sales are three different facts about the player', () => {
    const flagsOf = (c: typeof portfolioPear) => c.nodes
        .flatMap(n => n.choices ?? [])
        .flatMap(ch => ch.effects ?? [])
        .filter(e => e.kind === 'flag')
        .map(e => (e as any).flag as string);

    it('and each records its own', () => {
        expect(flagsOf(portfolioPear)).toContain('soldToPearTactically');
        expect(flagsOf(portfolioVulture)).toContain('soldUnderPressure');
        expect(flagsOf(portfolioFriend)).toContain('gavePlanoraBack');
    });

    it('selling to Pear is the one place his hostility comes down', () => {
        // And it comes down for OBEYING him, which is the trap: the most
        // effective way to stop the escalation arc is to give him what he
        // asked for. Nothing else in the game lowers it by this much.
        const deltas = portfolioPear.nodes
            .flatMap(n => n.choices ?? [])
            .flatMap(ch => ch.effects ?? [])
            .filter(e => e.kind === 'dial' && (e as any).dial === 'pearHostility')
            .map(e => (e as any).delta as number);
        expect(Math.min(...deltas)).toBeLessThanOrEqual(-15);
        // And refusing him raises it, so the offer is not free to decline.
        expect(Math.max(...deltas)).toBeGreaterThan(0);
    });

    it('and refusing the fund costs nothing, because the problem is still there', () => {
        // He does not punish a refusal. The cash crisis does that on its own,
        // and adding a penalty would be the game agreeing with him.
        const refusal = portfolioVulture.nodes.find(n => n.id === 'haggle')!
            .choices!.find(ch => ch.text.startsWith('We will find'))!;
        for (const e of refusal.effects ?? []) {
            expect(e.kind).not.toBe('capital');
            expect(e.kind).not.toBe('divest');
        }
    });

    it('and turning your friend down does not cost you the friendship', () => {
        // Refusing a favour is not a betrayal, and the dial does not move for
        // it. That is a thing this game should be willing to say about
        // somebody, once - and he is the only person it is true of.
        const cannot = portfolioFriend.nodes.find(n => n.id === 'cannot')!;
        const drops = cannot.choices!
            .flatMap(ch => ch.effects ?? [])
            .filter(e => e.kind === 'dial' && (e as any).delta < 0);
        expect(drops).toEqual([]);
    });

    it('and there is no penalty for refusing anywhere in his scene', () => {
        const negative = portfolioFriend.nodes
            .flatMap(n => n.choices ?? [])
            .flatMap(ch => ch.effects ?? [])
            .filter(e => e.kind === 'dial' && (e as any).delta < 0);
        expect(negative).toEqual([]);
    });
});
