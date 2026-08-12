// src/core/market/territory.test.ts
//
// ============================================================================
//  TWO COSTS THAT ARE DIFFERENT KINDS OF THING
// ============================================================================
//
//  A dilemma is only a dilemma if neither answer is correct twice. The whole
//  design rests on the two costs having different SHAPES - one compounds and
//  never ends, the other is heavy and expires - so these tests assert the
//  shapes rather than the numbers wherever they can:
//
//    DEFERRING costs nothing at zero revenue and grows without limit.
//    FIGHTING costs a fixed fraction of your position and then stops.
//
//  If either of those ever stops being true the choice collapses into a
//  slider, and nothing else in the feature would fail to tell anyone.
//
//  The second thing being protected is that the four incumbents are the four
//  companies the market data actually says are largest. A hand-written roster
//  of giants is a roster that disagrees with a rebalance, which is the exact
//  failure marketData.ts already documents about AcquisitionData.
// ============================================================================

import {
    giantOf, GIANTS, royaltyDue, siegePressure, advanceSieges,
    entriesThisQuarter, CATEGORY_FLAG,
    ROYALTY_RATE, SIEGE_QUARTERS, SIEGE_PRESSURE,
    type Siege, type RoyaltyTerm,
} from './territory';
import { PRODUCT_MARKETS, MARKET_CATEGORIES } from './productMarkets';
import { computeShares } from './attraction';
import {
    territoryRobotics, territoryDeepTech, territoryBioTech, territoryConsumer,
    TERRITORY_CONVERSATIONS, TERRITORY_EVENTS,
    ROYALTY_RATE as SCENE_ROYALTY_RATE,
    SIEGE_QUARTERS as SCENE_SIEGE_QUARTERS,
    SIEGE_PRESSURE as SCENE_SIEGE_PRESSURE,
} from '../../data/events/territory';
import { CONVERSATIONS } from '../../data/story';
import { EVENTS } from '../../data/events';
import { validate } from '../story/graph';
import { CAST } from '../../data/story/cast';
import { testAll, type World } from '../story/conditions';
import { INITIAL_DIALS } from '../story/state';

const known = new Set(CONVERSATIONS.map(c => c.id));

const world = (over: Partial<World> = {}): World => ({
    dials: { ...INITIAL_DIALS },
    flags: { fatherDead: true },
    quarter: 20,
    capital: 100_000_000,
    cash: 500_000,
    morale: 71,
    marketShare: 4,
    staffing: 100,
    researchers: 0,
    // Owns nothing. These tests are not about the portfolio.
    subsidiaries: [],
    // Never at a table, and the name has never been on anything.
    casinoStreak: 0,
    quartersWithoutSponsor: 0,
    ...over,
});

// ============================================================================
//  THE ONE PIECE OF DUPLICATION, AND THE TEST THAT HOLDS IT TOGETHER
// ============================================================================
describe('the scenes and the engine agree on the terms', () => {
    it('to the last decimal', () => {
        // The numbers are declared twice ON PURPOSE - story data may not
        // import the engine, and the first version of the scene file did,
        // which switched off the audit's entire data/events pass without
        // failing anything. See the note at the top of both files.
        //
        // This is the seam. If either side moves, this line names it.
        expect(SCENE_ROYALTY_RATE).toBe(ROYALTY_RATE);
        expect(SCENE_SIEGE_QUARTERS).toBe(SIEGE_QUARTERS);
        expect(SCENE_SIEGE_PRESSURE).toBe(SIEGE_PRESSURE);
    });
});

// ============================================================================
//  WHO OWNS EACH MARKET
// ============================================================================
describe('the giant of a category is whoever the data says', () => {
    it('one for every market, derived rather than listed', () => {
        expect(GIANTS).toHaveLength(MARKET_CATEGORIES.length);
        for (const g of GIANTS) expect(g.name.length).toBeGreaterThan(0);
    });

    it('and it really is the largest, in every market', () => {
        for (const market of PRODUCT_MARKETS) {
            const giant = giantOf(market.category)!;
            for (const c of market.competitors) {
                expect(c.share).toBeLessThanOrEqual(giant.share);
            }
        }
    });

    it('the four letters are written to the four actual incumbents', () => {
        // The claim that stops the fiction and the data drifting apart. If a
        // rebalance makes OpenAI-ish larger than Novidia in Deep Tech, this
        // fails and names the letter that has become wrong.
        expect(giantOf('Robotics')!.name).toBe('Edison Motors');
        // NOT Novidia, whose strength is higher (94 against 90) and whose
        // share is not. The first draft of the Deep Tech letter was written to
        // them and this line is what caught it.
        expect(giantOf('Deep Tech')!.name).toBe('OpenAI-ish');
        expect(giantOf('Bio-Tech')!.name).toBe('Johnson & Swanson');
        expect(giantOf('Consumer')!.name).toBe('Pear Inc.');
    });

    it('an unknown category has no giant rather than a wrong one', () => {
        expect(giantOf('Agriculture')).toBeUndefined();
    });
});

// ============================================================================
//  WALKING IN
// ============================================================================
describe('what counts as walking into a market', () => {
    const never = () => false;

    it('selling something, not owning a design', () => {
        // An incumbent has no way of knowing about a product nobody shipped.
        expect(entriesThisQuarter({ Robotics: 0 }, never)).toEqual([]);
        expect(entriesThisQuarter({ Robotics: 1 }, never)).toEqual(['enteredRobotics']);
    });

    it('and it happens once - the flag is checked before it is raised', () => {
        expect(entriesThisQuarter({ Robotics: 5_000 }, f => f === 'enteredRobotics'))
            .toEqual([]);
    });

    it('several markets in one quarter all count', () => {
        expect(entriesThisQuarter(
            { Robotics: 10, 'Deep Tech': 3, 'Bio-Tech': 1 }, never,
        ).sort()).toEqual(['enteredBioTech', 'enteredDeepTech', 'enteredRobotics']);
    });

    it('Consumer has no entry flag, because the player starts there', () => {
        // The starter product is a phone. An entry flag here would fire in the
        // first quarter, before the father has died and before any of the
        // fiction makes sense.
        expect(CATEGORY_FLAG.Consumer).toBeUndefined();
        expect(entriesThisQuarter({ Consumer: 900_000 }, never)).toEqual([]);
    });
});

// ============================================================================
//  DEFERRING
// ============================================================================
describe('deferring costs nothing today and grows forever', () => {
    const term: RoyaltyTerm[] = [
        { category: 'Robotics', rate: ROYALTY_RATE, since: 12, giant: 'Edison Motors' },
    ];

    it('nothing at all in a quarter you sold nothing', () => {
        // This is the trap, stated as a test: on the day you sign it, it is
        // free, and it is free for as long as the decision looks harmless.
        expect(royaltyDue({ Robotics: 0 }, term)).toBe(0);
        expect(royaltyDue({}, term)).toBe(0);
    });

    it('and it scales with exactly how well you do', () => {
        expect(royaltyDue({ Robotics: 1_000_000 }, term))
            .toBeCloseTo(1_000_000 * ROYALTY_RATE, 6);
        // No cap anywhere. A player who wins the category outright is paying
        // six points of a very large number for the rest of the game.
        expect(royaltyDue({ Robotics: 5_000_000_000 }, term))
            .toBeCloseTo(5_000_000_000 * ROYALTY_RATE, 6);
    });

    it('only on the category it was agreed for', () => {
        expect(royaltyDue({ 'Deep Tech': 100_000_000 }, term)).toBe(0);
    });

    it('and a loss-making quarter does not waive it', () => {
        // Charged on revenue, because no incumbent would ever write it the
        // other way and a royalty that pauses when you are struggling is a
        // subsidy.
        expect(royaltyDue({ Robotics: 10_000_000 }, term)).toBeGreaterThan(0);
    });

    it('it never expires - there is no counter on it to run down', () => {
        expect(Object.keys(term[0])).not.toContain('quartersLeft');
        expect(Object.keys(term[0])).not.toContain('until');
    });
});

// ============================================================================
//  FIGHTING
// ============================================================================
describe('fighting is heavy and then it is over', () => {
    const siege: Siege[] = [
        { category: 'Robotics', quartersLeft: SIEGE_QUARTERS, pressure: SIEGE_PRESSURE, giant: 'x' },
    ];

    it('it presses only on the category it was declared in', () => {
        expect(siegePressure('Robotics', siege)).toBe(SIEGE_PRESSURE);
        expect(siegePressure('Consumer', siege)).toBe(1);
        expect(siegePressure('Robotics', [])).toBe(1);
    });

    it('and it runs out, which is the whole reason it is a real choice', () => {
        let live = siege;
        for (let q = 0; q < SIEGE_QUARTERS; q++) live = advanceSieges(live);
        expect(live).toEqual([]);
        expect(siegePressure('Robotics', live)).toBe(1);
    });

    it('expired sieges are dropped rather than left sitting at zero', () => {
        expect(advanceSieges(siege, 99)).toEqual([]);
    });

    it('it costs about a third of your position while it lasts', () => {
        // Measured against the real share formula rather than asserted. The
        // player's share is sumPlayer / (sumPlayer + K), and a siege multiplies
        // K - so this reads what the engine would actually give them.
        const market = PRODUCT_MARKETS.find(m => m.category === 'Robotics')!;
        const attraction = [3.0];
        const before = computeShares(attraction, market, [], 1).totalShare;
        const under = computeShares(attraction, market, [], SIEGE_PRESSURE).totalShare;

        const lost = (before - under) / before;
        expect(lost).toBeGreaterThan(0.20);
        expect(lost).toBeLessThan(0.40);
    });

    it('and it is survivable - it never takes the player out of the market', () => {
        // At 2.0 the same position falls by half and the fight is unwinnable,
        // which would make the choice fake in the other direction.
        const market = PRODUCT_MARKETS.find(m => m.category === 'Robotics')!;
        const under = computeShares([3.0], market, [], SIEGE_PRESSURE).totalShare;
        expect(under).toBeGreaterThan(0);
        expect(SIEGE_PRESSURE).toBeLessThan(2);
    });

    it('and no pressure at all is the default, so every old caller is untouched', () => {
        const market = PRODUCT_MARKETS.find(m => m.category === 'Robotics')!;
        expect(computeShares([3.0], market, []).totalShare)
            .toBe(computeShares([3.0], market, [], 1).totalShare);
    });
});

// ============================================================================
//  THE TWO COSTS ARE DIFFERENT KINDS OF THING
// ============================================================================
describe('neither answer is correct twice', () => {
    it('the cheap one now is the expensive one later', () => {
        // The crossover, computed rather than claimed. A siege costs a share
        // of six quarters' revenue; the royalty costs four points of every
        // quarter there will ever be. Past roughly forty quarters in a
        // category, deferring has cost more - and a campaign is longer than
        // that.
        const quarterlyRevenue = 20_000_000;
        const term: RoyaltyTerm[] = [
            { category: 'Robotics', rate: ROYALTY_RATE, since: 0, giant: 'x' },
        ];
        const royaltyOver = (quarters: number) =>
            royaltyDue({ Robotics: quarterlyRevenue }, term) * quarters;
        // The crossover has to sit somewhere a campaign reaches. At the first
        // rate it was past forty-six quarters and deferring was simply correct.

        // What the siege costs: the revenue lost while it runs.
        const market = PRODUCT_MARKETS.find(m => m.category === 'Robotics')!;
        const before = computeShares([3.0], market, [], 1).totalShare;
        const under = computeShares([3.0], market, [], SIEGE_PRESSURE).totalShare;
        const siegeCost = quarterlyRevenue * ((before - under) / before) * SIEGE_QUARTERS;

        expect(royaltyOver(SIEGE_QUARTERS)).toBeLessThan(siegeCost);
        expect(royaltyOver(24)).toBeLessThan(siegeCost);
        expect(royaltyOver(36)).toBeGreaterThan(siegeCost);
    });
});

// ============================================================================
//  THE FOUR LETTERS
// ============================================================================
describe('four letters, and not one letter with the names swapped', () => {
    it('registered, valid and in the pool', () => {
        for (const c of TERRITORY_CONVERSATIONS) {
            expect(known.has(c.id)).toBe(true);
            expect(validate(c, CAST, known)).toEqual([]);
        }
        const ids = EVENTS.map(e => e.id);
        for (const e of TERRITORY_EVENTS) expect(ids).toContain(e.id);
    });

    it('all four are letters, from people who only write letters', () => {
        // Mail is distance. Every incumbent here is somebody who does not
        // consider the player a peer, which is what an incumbent is.
        for (const c of TERRITORY_CONVERSATIONS) {
            expect(c.channel).toBe('mail');
            expect(CAST[c.from].channels).toBe('mail');
            expect(c.subject).toBeTruthy();
        }
    });

    it('each one threatens with the thing its own industry actually has', () => {
        const text = (c: typeof territoryRobotics) =>
            c.nodes.map(n => n.text).join(' ');
        // Dealers and warranties.
        expect(text(territoryRobotics)).toContain('service centres');
        // People, which is the only weapon a frontier lab has. She never says
        // the word "poach" and never needs to.
        expect(text(territoryDeepTech)).toContain('neither party recruits');
        expect(text(territoryDeepTech).toLowerCase()).not.toContain('poach');
        // A queue and a standards committee.
        expect(text(territoryBioTech)).toContain('public queue');
        // And a line item in a spreadsheet.
        expect(text(territoryConsumer)).toContain('"other"');
    });

    it('and the medical one never threatens anything at all', () => {
        // The only antagonist in the game with nobody in her to argue with.
        const text = territoryBioTech.nodes.map(n => n.text).join(' ').toLowerCase();
        for (const threat of ['we will', 'you will regret', 'or else', 'withheld from you.']) {
            if (threat === 'withheld from you.') continue;
            expect(text).not.toContain(threat);
        }
        expect(text).toContain('nothing is withheld from you');
        expect(text).toContain('all of that is fair');
    });

    it('every letter offers both answers, and every ending takes one of them', () => {
        for (const c of TERRITORY_CONVERSATIONS) {
            const terminal = c.nodes
                .flatMap(n => n.choices ?? [])
                .filter(ch => !ch.next);
            expect(terminal.length).toBeGreaterThan(0);
            for (const ch of terminal) {
                const kinds = (ch.effects ?? []).map(e => e.kind);
                expect({ scene: c.id, text: ch.text, decided: kinds.includes('royalty') || kinds.includes('siege') })
                    .toEqual({ scene: c.id, text: ch.text, decided: true });
            }
        }
    });

    it('and the four agree on what each answer costs', () => {
        // Written once and shared. Four scenes that each named their own
        // number would drift and nothing would fail.
        for (const c of TERRITORY_CONVERSATIONS) {
            for (const e of c.nodes.flatMap(n => n.choices ?? []).flatMap(ch => ch.effects ?? [])) {
                if (e.kind === 'royalty') expect((e as any).rate).toBe(ROYALTY_RATE);
                if (e.kind === 'siege') {
                    expect((e as any).quarters).toBe(SIEGE_QUARTERS);
                    expect((e as any).pressure).toBe(SIEGE_PRESSURE);
                }
            }
        }
    });

    it('and each one charges the category it is actually about', () => {
        const categoryOf: Record<string, string> = {
            'event-territory-robotics': 'Robotics',
            'event-territory-deeptech': 'Deep Tech',
            'event-territory-biotech': 'Bio-Tech',
            'event-territory-consumer': 'Consumer',
        };
        for (const c of TERRITORY_CONVERSATIONS) {
            for (const e of c.nodes.flatMap(n => n.choices ?? []).flatMap(ch => ch.effects ?? [])) {
                if (e.kind === 'royalty' || e.kind === 'siege') {
                    expect({ scene: c.id, category: (e as any).category })
                        .toEqual({ scene: c.id, category: categoryOf[c.id] });
                }
            }
        }
    });
});

describe('when each letter arrives', () => {
    it('the three entry letters wait for the market to be entered', () => {
        const [robotics, deeptech, biotech] = TERRITORY_EVENTS;
        expect(testAll(robotics.when, world())).toBe(false);
        expect(testAll(robotics.when, world({ flags: { enteredRobotics: true } }))).toBe(true);
        expect(testAll(deeptech.when, world({ flags: { enteredDeepTech: true } }))).toBe(true);
        expect(testAll(biotech.when, world({ flags: { enteredBioTech: true } }))).toBe(true);
    });

    it('and each one waits for ITS market, not for any of them', () => {
        const [robotics, deeptech] = TERRITORY_EVENTS;
        const onlyRobotics = world({ flags: { enteredRobotics: true } });
        expect(testAll(robotics.when, onlyRobotics)).toBe(true);
        expect(testAll(deeptech.when, onlyRobotics)).toBe(false);
    });

    it('Pear waits for share instead, because entry means nothing at home', () => {
        const consumer = TERRITORY_EVENTS[3];
        expect(testAll(consumer.when, world({ marketShare: 4 }))).toBe(false);
        expect(testAll(consumer.when, world({ marketShare: 11 }))).toBe(true);
    });

    it('...and only before the war starts, so it cannot step on his escalation', () => {
        // pearEscalation.ts is what he sends once you are enemies. This is the
        // letter that comes first, and it must not arrive in the middle of it.
        const consumer = TERRITORY_EVENTS[3];
        const atWar = world({
            marketShare: 11,
            dials: { ...INITIAL_DIALS, pearHostility: 85 },
        });
        expect(testAll(consumer.when, atWar)).toBe(false);
    });

    it('every one of them happens once, ever', () => {
        // You enter a market once. A repeatable version of this letter would
        // be a subscription, not an event.
        for (const e of TERRITORY_EVENTS) expect(e.cooldown).toBeUndefined();
    });
});
