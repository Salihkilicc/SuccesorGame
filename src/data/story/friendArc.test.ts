// src/data/story/friendArc.test.ts
//
// ============================================================================
//  THE SILENCE HAS TO BE COMPLETE, AND IT HAS TO BE SILENT
// ============================================================================
//
//  Two things are being protected and they are easy to lose in opposite ways.
//
//  COMPLETE: if one later scene forgets the `friendRefused` gate, the player
//  who turned him down gets a cheerful message from him three quarters later
//  and the whole point evaporates. This is the failure mode of "the door
//  closes quietly" - it only takes one door left open.
//
//  SILENT: the temptation, always, is to tell the player. A line saying "you
//  and Marco have drifted apart", a dial readout, a closing scene. All of it
//  converts a loss into a transaction they can feel they paid for. There must
//  be nothing after the refusal but absence.
// ============================================================================

import { friendAsks, friendGrows } from './friendArc';
import {
    friendGossipSmall, friendGossipSmallEvent,
    friendGossipReal, friendGossipRealEvent,
    friendPearWeakness, friendPearWeaknessEvent,
    friendOffersPlanora, friendOffersPlanoraEvent,
} from '../events/friendGossip';
import { CONVERSATIONS, STORY_BEATS } from './index';
import { EVENTS } from '../events';
import { validate } from '../../core/story/graph';
import { CAST } from './cast';
import { testAll, type World } from '../../core/story/conditions';
import { INITIAL_DIALS } from '../../core/story/state';
import { INITIAL_MARKET_ITEMS } from '../../features/assets/data/marketData';

const known = new Set(CONVERSATIONS.map(c => c.id));
const SCENES = [friendAsks, friendGrows, friendGossipSmall, friendGossipReal,
    friendPearWeakness, friendOffersPlanora];
const FRIEND_EVENTS = [friendGossipSmallEvent, friendGossipRealEvent,
    friendPearWeaknessEvent, friendOffersPlanoraEvent];

const world = (over: Partial<World> = {}): World => ({
    dials: { ...INITIAL_DIALS, friendLoyalty: 90 },
    flags: {
        fatherDead: true, friendHelped: true, friendGrewUp: true,
        ...(over.flags ?? {}),
    },
    quarter: 24,
    capital: 50_000_000,
    cash: 500_000,
    morale: 71,
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

describe('all of it is in the game', () => {
    it('registered and valid', () => {
        for (const c of SCENES) {
            expect(known.has(c.id)).toBe(true);
            expect(validate(c, CAST, known)).toEqual([]);
        }
        for (const e of FRIEND_EVENTS) expect(EVENTS.map(x => x.id)).toContain(e.id);
    });

    it('and neither beat jumps the queue', () => {
        // He is the one person who never needs an answer this quarter.
        for (const beat of STORY_BEATS) {
            if (beat.conversation.startsWith('friend-')) expect(beat.urgent).toBeFalsy();
        }
    });
});

describe('refusing closes every door', () => {
    const refused = world({
        flags: { fatherDead: true, friendRefused: true, friendHelped: true, friendGrewUp: true },
    });

    it('not one later scene is reachable', () => {
        // Checked over ALL of them rather than a sample: the failure mode is
        // one forgotten gate, and one is enough to undo the whole thing.
        for (const c of [friendGrows]) {
            expect({ id: c.id, open: testAll(c.when, refused) })
                .toEqual({ id: c.id, open: false });
        }
        for (const e of FRIEND_EVENTS) {
            expect({ id: e.id, open: testAll(e.when, refused) })
                .toEqual({ id: e.id, open: false });
        }
    });

    it('including the ask itself, so he does not come back to try again', () => {
        expect(testAll(friendAsks.when, refused)).toBe(false);
    });

    it('and it closes even for a player who is otherwise perfect', () => {
        // Maximum loyalty, every other flag set, twenty quarters of good
        // behaviour. The one refusal outranks all of it, permanently.
        const perfect = world({
            dials: { ...INITIAL_DIALS, friendLoyalty: 100, pearHostility: 60 },
            flags: {
                fatherDead: true, friendRefused: true,
                friendHelped: true, friendGrewUp: true,
            },
            quarter: 60,
        });
        for (const e of FRIEND_EVENTS) expect(testAll(e.when, perfect)).toBe(false);
    });
});

describe('and says nothing about it', () => {
    it('the refusal card is gracious rather than final', () => {
        const no = friendAsks.nodes.find(n => n.id === 'no')!;
        expect(no.text).toContain('forget i said anything');
        expect(no.text).toContain('see you soon');
    });

    it('nothing anywhere announces that a door shut', () => {
        // The whole design. A line telling the player would convert a loss
        // into a transaction they can feel they paid for.
        const everything = SCENES.flatMap(c => c.nodes).map(n => n.text).join(' ').toLowerCase();
        for (const banned of ['no longer', 'you have lost', 'friendship is over',
            'he will not', 'never speak']) {
            expect(everything).not.toContain(banned);
        }
    });

    it('and refusing schedules nothing - there is no follow-up scene', () => {
        const refusals = friendAsks.nodes
            .flatMap(n => n.choices ?? [])
            .filter(c => (c.effects ?? []).some(e =>
                e.kind === 'flag' && (e as any).flag === 'friendRefused'));
        expect(refusals.length).toBeGreaterThan(0);
        for (const r of refusals) {
            expect((r.effects ?? []).some(e => e.kind === 'schedule')).toBe(false);
        }
    });

    it('but it cannot be reached by tapping through', () => {
        // Same rule as the Pear ending: there is a way back on the card that
        // looks final, because a permanent loss arrived at by drifting is one
        // the player will not own.
        const no = friendAsks.nodes.find(n => n.id === 'no')!;
        expect(no.choices!.some(c => c.next === 'howLong')).toBe(true);
    });
});

describe('the ladder improves with loyalty', () => {
    it('the small rumour is what you get at ordinary warmth', () => {
        const ordinary = world({ dials: { ...INITIAL_DIALS, friendLoyalty: 60 } });
        expect(testAll(friendGossipSmallEvent.when, ordinary)).toBe(true);
        expect(testAll(friendGossipRealEvent.when, ordinary)).toBe(false);
        expect(testAll(friendPearWeaknessEvent.when, ordinary)).toBe(false);
    });

    it('and the small one stops once the real ones start', () => {
        // Otherwise the channel would still be mostly noise at the top, and
        // the ladder would not read as a ladder.
        const close = world({ dials: { ...INITIAL_DIALS, friendLoyalty: 90, pearHostility: 40 } });
        expect(testAll(friendGossipSmallEvent.when, close)).toBe(false);
        expect(testAll(friendGossipRealEvent.when, close)).toBe(true);
    });

    it('the top rung needs him grown up as well as fond of you', () => {
        // He does not have Pear's supply chain in year two. He gets it by
        // running a company that shares an assembler with them.
        const fondButEarly = world({
            flags: { fatherDead: true, friendHelped: true },
            dials: { ...INITIAL_DIALS, friendLoyalty: 90, pearHostility: 40 },
        });
        expect(testAll(friendPearWeaknessEvent.when, fondButEarly)).toBe(false);
        expect(testAll(friendPearWeaknessEvent.when,
            world({ dials: { ...INITIAL_DIALS, friendLoyalty: 90, pearHostility: 40 } }))).toBe(true);
    });

    it('and none of it opens for a player who never helped', () => {
        const neverHelped = world({ flags: { fatherDead: true } });
        for (const e of FRIEND_EVENTS) expect(testAll(e.when, neverHelped)).toBe(false);
    });
});

describe('the rewards are real rather than described', () => {
    it('Planora is a company you can actually buy', () => {
        // "He will sell it to you cheap" is worth nothing if the acquisition
        // screen has never heard of it, and the player would be right to read
        // the offer as flavour.
        const planora = INITIAL_MARKET_ITEMS.find((x: any) => x.id === 'tech_planora');
        expect(planora).toBeDefined();
    });

    it('and the discount moves the anchor, so it does not evaporate', () => {
        // A price alone drifts back to the listed value within a few quarters
        // - that was the divestiture bug. A story reward that expires quietly
        // is worse than no reward.
        const reprice = friendOffersPlanora.nodes
            .flatMap(n => n.choices ?? [])
            .flatMap(c => c.effects ?? [])
            .find(e => e.kind === 'reprice') as any;
        expect(reprice.company).toBe('tech_planora');
        expect(reprice.multiplier).toBeLessThan(0.7);
    });

    it('the Pear weakness is specific enough to act on', () => {
        const text = friendPearWeakness.nodes.map(n => n.text).join(' ');
        expect(text).toContain('single sourced');
        expect(text).toContain('six weeks');
    });

    it('and stopping him costs the player the whole thing', () => {
        // The one moment in the arc where being a decent friend is expensive.
        const stop = friendPearWeakness.nodes.find(n => n.id === 'notLikeThis')!;
        const effects = stop.choices!.flatMap(c => c.effects ?? []);
        expect(effects.some(e => e.kind === 'flag')).toBe(false);
        expect(effects.some(e => e.kind === 'dial' && (e as any).delta > 0)).toBe(true);
    });
});
