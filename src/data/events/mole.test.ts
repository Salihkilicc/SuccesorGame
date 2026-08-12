// src/data/events/mole.test.ts
//
// ============================================================================
//  A DOOR MOST PLAYERS WILL NEVER SEE, AND A COST THEY WILL NOT SEE COMING
// ============================================================================
//
//  Three things are being protected.
//
//  THE ARC IS GENUINELY HIDDEN. It needs Pear to have become an enemy AND the
//  friend to be close enough to hand over something that could ruin him. If
//  either gate slips, the game's one secret arc becomes a thing that happens
//  to everybody, and it stops being a secret the first time somebody mentions
//  it in a review.
//
//  THE ESCALATION IS A PROBABILITY, NOT A GATE. The player who bought once and
//  the player who said "there will be more" get exactly the same letter. One
//  gets it three times sooner. Nothing in the game says the odds moved.
//
//  THE HONEST DOOR IS NOT WORTHLESS. Buying only the legal tier has to be a
//  real option with real value, or the arc is a morality play with one answer.
// ============================================================================

import {
    moleNumber, moleNumberEvent,
    moleFirstContact, moleFirstContactEvent,
    moleOffer, moleOfferEvent,
    fbiFirstContact, fbiFirstContactEvent, fbiFirstContactRepeatEvent,
} from './mole';
import { EVENTS } from './index';
import { CONVERSATIONS } from '../story';
import { validate } from '../../core/story/graph';
import { CAST } from '../story/cast';
import { canUseChannel } from '../../core/story/cast';
import { testAll, type World } from '../../core/story/conditions';
import { INITIAL_DIALS, type StoryFlag } from '../../core/story/state';

const known = new Set(CONVERSATIONS.map(c => c.id));
const SCENES = [moleNumber, moleFirstContact, moleOffer, fbiFirstContact];

const world = (over: {
    flags?: Partial<Record<StoryFlag, true>>;
    friendLoyalty?: number;
    pearHostility?: number;
} = {}): World => ({
    dials: {
        ...INITIAL_DIALS,
        friendLoyalty: over.friendLoyalty ?? 90,
        pearHostility: over.pearHostility ?? 80,
    },
    flags: { fatherDead: true, friendHelped: true, ...(over.flags ?? {}) },
    quarter: 30,
    capital: 80_000_000,
    cash: 1_000_000,
    morale: 71,
    marketShare: 4,
    // A fully crewed plant and an empty lab: the state every one of these
    // tests was implicitly assuming before the COO and the CTO could read
    // either number. Neither arc is what this file is about.
    staffing: 100,
    researchers: 0,
    // Owns nothing. These tests are not about the portfolio.
    subsidiaries: [],
    // Never at a table, and the name has never been on anything.
    casinoStreak: 0,
    quartersWithoutSponsor: 0,
});

describe('all of it is in the game', () => {
    it('registered, valid, in the pool', () => {
        for (const c of SCENES) {
            expect(known.has(c.id)).toBe(true);
            expect(validate(c, CAST, known)).toEqual([]);
        }
        const ids = EVENTS.map(e => e.id);
        for (const e of [moleNumberEvent, moleFirstContactEvent, moleOfferEvent,
            fbiFirstContactEvent, fbiFirstContactRepeatEvent]) {
            expect(ids).toContain(e.id);
        }
    });

    it('the unknown number cannot write a letter', () => {
        // A letter has a return address. That is the whole character.
        expect(canUseChannel(CAST.unknown, 'message')).toBe(true);
        expect(canUseChannel(CAST.unknown, 'mail')).toBe(false);
        expect(moleFirstContact.channel).toBe('message');
    });

    it('and the FBI cannot text', () => {
        // Everything they send is built to be read aloud in a courtroom.
        expect(canUseChannel(CAST.fbi, 'mail')).toBe(true);
        expect(canUseChannel(CAST.fbi, 'message')).toBe(false);
        expect(fbiFirstContact.channel).toBe('mail');
    });
});

describe('the door is hidden behind two other arcs', () => {
    it('a player at peace with Pear never sees it', () => {
        expect(testAll(moleNumberEvent.when, world({ pearHostility: 20 }))).toBe(false);
    });

    it('a player who is not that close to Marco never sees it', () => {
        expect(testAll(moleNumberEvent.when, world({ friendLoyalty: 60 }))).toBe(false);
    });

    it('a player who refused him never sees it, whatever else is true', () => {
        expect(testAll(moleNumberEvent.when,
            world({ flags: { friendRefused: true }, friendLoyalty: 100 }))).toBe(false);
    });

    it('and it takes both together', () => {
        expect(testAll(moleNumberEvent.when, world())).toBe(true);
    });

    it('the stranger does not write to somebody Marco never told', () => {
        // FOUND BY READING HIS FIRST LINE. `moleUnlocked` is raised by two
        // OTHER arcs - the CFO's "look into Braga" and the brother's Halberd
        // disclosure - and both are reasonable ways to learn this world
        // exists. Neither involves Marco.
        //
        // Gated on the flag alone, a player who took either path would get a
        // stranger opening with "Marco said you might not" about a number
        // Marco never sent. Nothing would crash; the scene would just be
        // about something that did not happen.
        const viaAnotherArc = world({
            flags: { moleUnlocked: true, friendRefused: true },
        });
        expect(testAll(moleFirstContactEvent.when, viaAnotherArc)).toBe(false);
        expect(moleFirstContact.nodes[0].text).toContain('Marco said');
    });
});

describe('three doors, and only the third is the crime', () => {
    it('taking the number commits to nothing', () => {
        // Almost everybody who gets this far will take it - it would be odd
        // not to. Nothing about it raises `moleEngaged`.
        const effects = moleNumber.nodes.flatMap(n => n.choices ?? []).flatMap(c => c.effects ?? []);
        const flags = effects.filter(e => e.kind === 'flag').map(e => (e as any).flag);
        expect(flags).toContain('moleUnlocked');
        expect(flags).not.toContain('moleEngaged');
    });

    it('and the friend can be stopped before he sends it', () => {
        const stop = moleNumber.nodes.find(n => n.id === 'marcoNo')!;
        expect(stop.text).toContain('i think i wanted someone to tell me not to');
        const forget = stop.choices!.find(c => c.text === 'Forgotten.')!;
        expect((forget.effects ?? []).some(e => e.kind === 'flag')).toBe(false);
    });

    it('the legal tier is a real option with real value', () => {
        // If the honest door were worthless the arc would be a morality play
        // with one answer, and the crime would be the only interesting move.
        const legal = moleFirstContact.nodes.find(n => n.id === 'firstTierOnly')!;
        const buy = legal.choices!.find(c => c.text === 'Send an invoice.')!;
        const effects = buy.effects!;
        expect(effects.some(e => e.kind === 'capital')).toBe(true);
        expect(effects.some(e => e.kind === 'brand' && (e as any).amount > 0)).toBe(true);
        // And it is not a crime: nothing here can lead to the letter.
        expect(effects.some(e => e.kind === 'flag' && (e as any).flag === 'moleRepeated')).toBe(false);
    });

    it('the crime itself is a spreadsheet', () => {
        // Deliberately the dullest possible version. The interesting failure
        // is not "player commits espionage" - it is a player arriving here
        // having never made a decision they would describe as one.
        expect(moleOffer.nodes[0].text).toContain('price book');
        expect(moleOffer.nodes[0].text).not.toContain('break');
    });
});

describe('the odds move, and nothing says so', () => {
    const once = world({ flags: { moleEngaged: true } });
    const repeated = world({ flags: { moleEngaged: true, moleRepeated: true } });

    it('exactly one tier is live at a time', () => {
        for (const w of [once, repeated]) {
            const live = [fbiFirstContactEvent, fbiFirstContactRepeatEvent]
                .filter(e => testAll(e.when, w));
            expect(live).toHaveLength(1);
        }
    });

    it('and neither is live for a player who never engaged', () => {
        const clean = world();
        expect(testAll(fbiFirstContactEvent.when, clean)).toBe(false);
        expect(testAll(fbiFirstContactRepeatEvent.when, clean)).toBe(false);
    });

    it('buying twice is three times the odds', () => {
        expect(fbiFirstContactRepeatEvent.chance)
            .toBeCloseTo(fbiFirstContactEvent.chance * 3, 5);
    });

    it('but it is the SAME letter', () => {
        // The escalation must not be visible in the content, or the player
        // learns the mechanic instead of living with the consequence.
        expect(fbiFirstContactRepeatEvent.conversation).toBe(fbiFirstContactEvent.conversation);
        expect(fbiFirstContactRepeatEvent.headline).toBe(fbiFirstContactEvent.headline);
    });

    it('and the choice that raises the odds does not mention them', () => {
        const send = moleOffer.nodes.find(n => n.id === 'sendIt')!;
        const worse = send.choices!.find(c =>
            (c.effects ?? []).some(e => e.kind === 'flag' && (e as any).flag === 'moleRepeated'))!;
        expect(worse.text).toBe('Pay it, and there will be more.');
        // No warning, no risk readout, nothing that reads as a difficulty
        // setting. It is a sentence somebody would say.
        expect(worse.text.toLowerCase()).not.toContain('risk');
    });
});

describe('the letter is a request, because the first one always is', () => {
    it('it says a reply is not required', () => {
        expect(fbiFirstContact.nodes[0].text).toContain('A reply is not required');
        expect(fbiFirstContact.nodes[0].text).toContain('not a subject of this inquiry');
    });

    it('and the second letter is the first one with that sentence removed', () => {
        // Nothing else changes. That is the threat.
        const second = fbiFirstContact.nodes.find(n => n.id === 'notRequired')!;
        expect(second.text).toContain('responses and non-responses in the same schedule');
        expect(second.text).not.toContain('A reply is not required');
    });

    it('cooperating early is worth something the player cannot yet price', () => {
        const coop = fbiFirstContact.nodes.find(n => n.id === 'everything')!;
        expect(coop.text).toContain('worth more to you than it currently appears');
        const d = coop.choices![0].effects!
            .find(e => e.kind === 'dial' && (e as any).dial === 'publicReputation') as any;
        expect(d.delta).toBeGreaterThan(0);
    });
});
