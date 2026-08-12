// src/core/market/ripple.test.ts
//
// ============================================================================
//  THE DAMAGE LANDS ON THE THING THAT WAS BOUGHT
// ============================================================================
//
//  Three claims, and the first one is the whole feature.
//
//  IT HITS THE DEAL AND NOT THE COMPANY. A rival taking the engineers should
//  cost you the reason you paid a premium and nothing else - you still own the
//  business, it still earns, and the synergy has quietly gone. A share penalty
//  or a cash fine would be the same size and the wrong shape entirely.
//
//  IT IS PERMANENT. The territory siege expires and must; this must not. The
//  cost of the two answers being different SHAPES is what makes both of these
//  dilemmas rather than sliders, and if the raid ever grows a timer the ripple
//  becomes a second, weaker copy of the incumbent letter.
//
//  THE SCENES CARRY NO NUMBERS. Every figure is computed from the deal, which
//  is the only place the target's earnings exist. The first draft hardcoded
//  six retention costs into six letters and the audit found it sideways, by
//  reporting the helpers that should have been doing that work as dead.
// ============================================================================

import {
    RIPPLES, rippleFor, rippleFlagFor, realizationAfter, defenceCost,
    RIVAL_REALIZATION, VULTURE_REALIZATION, DEFENCE_COST_MULTIPLE,
} from './ripple';
import {
    dealQuarterEffect, SYNERGY_ANNUAL_RATIO, SYNERGY_RAMP_QUARTERS,
    HOSTILE_SYNERGY_REALIZATION, type AcquisitionDeal,
} from './mergers';
import { INITIAL_MARKET_ITEMS } from '../../features/assets/data/marketData';
import {
    rippleVoltmotors, rippleStreamify, rippleNovidia,
    rippleBiogen, rippleSkynet, ripplePlanora,
    RIPPLE_CONVERSATIONS, RIPPLE_EVENTS,
} from '../../data/events/ripple';
import { CONVERSATIONS } from '../../data/story';
import { EVENTS } from '../../data/events';
import { validate } from '../story/graph';
import { CAST } from '../../data/story/cast';
import { testAll, type World } from '../story/conditions';
import { INITIAL_DIALS } from '../story/state';

const known = new Set(CONVERSATIONS.map(c => c.id));

const deal = (over: Partial<AcquisitionDeal> = {}): AcquisitionDeal => ({
    id: 'ind_voltmotors',
    name: 'VoltMotors',
    price: 100_000_000,
    fairValue: 90_000_000,
    premium: 10_000_000,
    targetAnnualEbit: 6_000_000,
    // Past the ramp, so the synergy figure is the full-rate one.
    quartersSinceClose: SYNERGY_RAMP_QUARTERS + 2,
    goodwill: 10_000_000,
    impaired: false,
    hostile: false,
    ...over,
});

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
    ...over,
});

// ============================================================================
//  THE SIX
// ============================================================================
describe('six companies, and somebody minded about each of them', () => {
    it('every one of them is a real listed company', () => {
        // A ripple for a company the market has never heard of is the failure
        // marketData.ts already documents: three companies written down in
        // data/AcquisitionData.ts and never wired to anything.
        const ids = new Set((INITIAL_MARKET_ITEMS as any[]).map(i => i.id));
        for (const r of RIPPLES) {
            expect({ company: r.company, listed: ids.has(r.company) })
                .toEqual({ company: r.company, listed: true });
        }
    });

    it('and every writer is somebody the game already had', () => {
        // The whole reason for choosing these six. A ripple is only
        // interesting if the person on the other end is somebody the player
        // already has an opinion about.
        for (const r of RIPPLES) {
            expect({ company: r.company, cast: !!CAST[r.from] })
                .toEqual({ company: r.company, cast: true });
        }
    });

    it('four rivals and two vultures, and the vultures are the dying ones', () => {
        const rivals = RIPPLES.filter(r => r.kind === 'rival');
        const vultures = RIPPLES.filter(r => r.kind === 'vulture');
        expect(rivals).toHaveLength(4);
        expect(vultures).toHaveLength(2);
        // A fund circling a healthy business is not a vulture, it is a buyer.
        // Both of these are High or Extreme risk - the game's own word for a
        // company that is burning money.
        const riskOf = (id: string) =>
            (INITIAL_MARKET_ITEMS as any[]).find(i => i.id === id)?.risk;
        for (const v of vultures) {
            expect({ company: v.company, risk: riskOf(v.company) })
                .toEqual({ company: v.company, risk: expect.stringMatching(/High|Extreme/) });
        }
    });

    it('no company appears twice, so two people cannot both raid one deal', () => {
        expect(new Set(RIPPLES.map(r => r.company)).size).toBe(RIPPLES.length);
        expect(new Set(RIPPLES.map(r => r.flag)).size).toBe(RIPPLES.length);
    });

    it('and buying anything else annoys nobody', () => {
        expect(rippleFor('tech_micro')).toBeUndefined();
        expect(rippleFlagFor('tech_micro')).toBeUndefined();
        expect(rippleFlagFor('ind_voltmotors')).toBe('boughtVoltmotors');
    });
});

// ============================================================================
//  WHAT A RAID DOES
// ============================================================================
describe('the damage lands on the deal and nowhere else', () => {
    it('a rival takes half the synergy, permanently', () => {
        const clean = dealQuarterEffect(deal());
        const raided = dealQuarterEffect(deal({ synergyRealization: RIVAL_REALIZATION }));

        expect(raided.synergy).toBeCloseTo(clean.synergy * RIVAL_REALIZATION, 6);
        // And nothing else about the deal moves. You still own the business
        // and it still earns exactly what it earned.
        expect(raided.earningsContribution).toBe(clean.earningsContribution);
        expect(raided.integrationCost).toBe(clean.integrationCost);
    });

    it('a fund takes less, because all it can do is make people read something', () => {
        const rival = dealQuarterEffect(deal({ synergyRealization: RIVAL_REALIZATION }));
        const fund = dealQuarterEffect(deal({ synergyRealization: VULTURE_REALIZATION }));
        expect(fund.synergy).toBeGreaterThan(rival.synergy);
        expect(realizationAfter('rival')).toBeLessThan(realizationAfter('vulture'));
    });

    it('it never expires - there is no counter anywhere on it', () => {
        // The territory siege ends and must. This must not: people who have
        // left do not come back, and a raid with a timer would make the ripple
        // a weaker copy of the incumbent letter.
        const late = dealQuarterEffect(deal({
            synergyRealization: RIVAL_REALIZATION,
            quartersSinceClose: 80,
        }));
        const cleanLate = dealQuarterEffect(deal({ quartersSinceClose: 80 }));
        expect(late.synergy).toBeCloseTo(cleanLate.synergy * RIVAL_REALIZATION, 6);
    });

    it('an untouched deal is exactly what it always was', () => {
        // The field is optional and undefined must mean "whatever the hostile
        // flag implies", or every deal in every existing save changes value.
        const friendly = dealQuarterEffect(deal());
        expect(friendly.synergy).toBeCloseTo(
            (6_000_000 * SYNERGY_ANNUAL_RATIO) / 4, 6,
        );
        const hostile = dealQuarterEffect(deal({ hostile: true }));
        expect(hostile.synergy).toBeCloseTo(
            friendly.synergy * HOSTILE_SYNERGY_REALIZATION, 6,
        );
    });

    it('and a raid on a hostile deal is not applied twice', () => {
        // The override replaces rather than multiplies, so a company bought
        // rudely and then raided is damaged to a level, not compounded.
        const raided = dealQuarterEffect(deal({
            hostile: true, synergyRealization: RIVAL_REALIZATION,
        }));
        const friendlyRaided = dealQuarterEffect(deal({
            synergyRealization: RIVAL_REALIZATION,
        }));
        expect(raided.synergy).toBeCloseTo(friendlyRaided.synergy, 6);
    });
});

// ============================================================================
//  WHAT DEFENDING COSTS
// ============================================================================
describe('paying is priced off the target, not off the player', () => {
    it('so it stays a real decision at every scale', () => {
        // A flat sum would be unaffordable early and free late, and the choice
        // would only exist in a narrow band of the campaign.
        expect(defenceCost(6_000_000)).toBe(6_000_000 * DEFENCE_COST_MULTIPLE);
        expect(defenceCost(600_000_000)).toBe(600_000_000 * DEFENCE_COST_MULTIPLE);
        expect(defenceCost(0)).toBe(0);
        // A loss-making target costs nothing to defend, which is correct and
        // slightly bleak: there is nothing there worth hiring.
        expect(defenceCost(-5_000_000)).toBe(0);
    });

    it('and it does NOT pay for itself inside a campaign, which is the point', () => {
        // Measured rather than asserted. Full synergy is 30% of EBIT a year;
        // a rival taking half of it costs 15% of EBIT a year, forever. At 1.5x
        // EBIT the defence takes ten years to repay - so it is not a good deal
        // on a spreadsheet, and it is a good deal if you intend to still hold
        // this company in a decade. That is the decision.
        const ebit = 6_000_000;
        const annualLoss = ebit * SYNERGY_ANNUAL_RATIO * (1 - RIVAL_REALIZATION);
        const years = defenceCost(ebit) / annualLoss;
        expect(years).toBeGreaterThan(8);
        expect(years).toBeLessThan(12);
    });
});

// ============================================================================
//  THE SIX LETTERS
// ============================================================================
describe('six letters, one decision each', () => {
    it('registered, valid and in the pool', () => {
        for (const c of RIPPLE_CONVERSATIONS) {
            expect(known.has(c.id)).toBe(true);
            expect(validate(c, CAST, known)).toEqual([]);
        }
        const ids = EVENTS.map(e => e.id);
        for (const e of RIPPLE_EVENTS) expect(ids).toContain(e.id);
    });

    it('all six are letters, and all six writers only write letters', () => {
        for (const c of RIPPLE_CONVERSATIONS) {
            expect(c.channel).toBe('mail');
            expect(CAST[c.from].channels).toBe('mail');
        }
    });

    it('none of them states a number the scene could not know', () => {
        // The first draft hardcoded a retention cost in each letter - six
        // plausible-looking figures, all six wrong, because the price depends
        // on what was bought and at what price and in which quarter.
        for (const c of RIPPLE_CONVERSATIONS) {
            for (const e of c.nodes.flatMap(n => n.choices ?? []).flatMap(ch => ch.effects ?? [])) {
                expect(e.kind).not.toBe('capital');
                expect(e.kind).not.toBe('cash');
                if (e.kind === 'raid' || e.kind === 'retention') {
                    expect(Object.keys(e).sort()).toEqual(['company', 'kind']);
                }
            }
        }
    });

    it('every ending takes one of the two answers', () => {
        for (const c of RIPPLE_CONVERSATIONS) {
            const terminal = c.nodes.flatMap(n => n.choices ?? []).filter(ch => !ch.next);
            expect(terminal.length).toBeGreaterThan(0);
            for (const ch of terminal) {
                const kinds = (ch.effects ?? []).map(e => e.kind);
                expect({ scene: c.id, text: ch.text, decided: kinds.includes('raid') || kinds.includes('retention') })
                    .toEqual({ scene: c.id, text: ch.text, decided: true });
            }
        }
    });

    it('and each letter names the company it is actually about', () => {
        const expected: Record<string, string> = {
            'event-ripple-voltmotors': 'ind_voltmotors',
            'event-ripple-streamify': 'tech_streamify',
            'event-ripple-novidia': 'tech_chip',
            'event-ripple-biogen': 'health_bio',
            'event-ripple-skynet': 'tech_skynet',
            'event-ripple-planora': 'tech_planora',
        };
        for (const c of RIPPLE_CONVERSATIONS) {
            for (const e of c.nodes.flatMap(n => n.choices ?? []).flatMap(ch => ch.effects ?? [])) {
                if (e.kind === 'raid' || e.kind === 'retention') {
                    expect({ scene: c.id, company: (e as any).company })
                        .toEqual({ scene: c.id, company: expected[c.id] });
                }
            }
        }
    });

    it('and each one waits for ITS acquisition', () => {
        const [volt] = RIPPLE_EVENTS;
        expect(testAll(volt.when, world())).toBe(false);
        expect(testAll(volt.when, world({ flags: { boughtVoltmotors: true } }))).toBe(true);
        expect(testAll(volt.when, world({ flags: { boughtSkynet: true } }))).toBe(false);
    });

    it('once each, ever - you buy a company once', () => {
        for (const e of RIPPLE_EVENTS) expect(e.cooldown).toBeUndefined();
    });
});

describe('the rivals and the vultures do not sound alike', () => {
    it('a rival has somewhere to put the people on Monday', () => {
        expect(rippleVoltmotors.nodes[0].text).toContain('I am going to hire his cell engineers');
        expect(rippleNovidia.nodes[0].text).toContain('as many of them as will come');
    });

    it('and a fund cannot be paid to go away, which is why it is worse', () => {
        // Asserted as MECHANICS rather than as a phrase - he says it two
        // different ways and a literal check on one of them was the first
        // version of this test, which failed for the right reason.
        //
        // The claim: in both vulture letters the only thing money can buy is
        // the retention of the acquired company's own people. There is no
        // branch anywhere that pays Halberd, because he is not extorting
        // anybody, and that is exactly what makes him worse than the rivals.
        for (const c of [rippleSkynet, ripplePlanora]) {
            const paying = c.nodes
                .flatMap(n => n.choices ?? [])
                .flatMap(ch => ch.effects ?? [])
                .filter(e => e.kind === 'retention' || e.kind === 'capital' || e.kind === 'cash');
            expect(paying.length).toBeGreaterThan(0);
            for (const e of paying) expect(e.kind).toBe('retention');
            // And he says so out loud, in one form or another.
            expect(c.nodes.map(n => n.text).join(' ').toLowerCase())
                .toMatch(/nothing (you can pay me|i can be paid)/);
        }
    });

    it('the two vulture letters are the same machinery and not the same letter', () => {
        const a = rippleSkynet.nodes.map(n => n.text).join(' ');
        const b = ripplePlanora.nodes.map(n => n.text).join(' ');
        // SkyNet's note is about a burn rate. Planora's is about a cheque the
        // player wrote, mentioned as an aside he does not think is important.
        expect(a).toContain('burn rate');
        expect(b).toContain('related-party disclosure');
        expect(b).toContain('single private cheque');
    });

    it('and the Planora letter never mentions the friendship', () => {
        // The player supplies that. A line about it would be the game telling
        // them how to feel about a thing they did four years ago.
        const text = ripplePlanora.nodes.map(n => n.text).join(' ').toLowerCase();
        for (const word of ['friend', 'friendship', 'loyal', 'betray']) {
            expect(text).not.toContain(word);
        }
    });

    it('and the committee chair is still not threatening anything', () => {
        // Same person as the territory letter, and she has not changed: she
        // answers a question two people asked her, truthfully.
        const text = rippleBiogen.nodes.map(n => n.text).join(' ');
        expect(text).toContain('I am not taking anything');
        expect(text).toContain('I would have given you the same answer');
    });

    it('and Pear still sends a form', () => {
        expect(rippleStreamify.subject).toContain('Ref:');
        expect(rippleStreamify.nodes[0].text).toContain('courtesy notification');
    });
});
