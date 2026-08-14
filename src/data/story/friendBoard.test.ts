// src/data/story/friendBoard.test.ts
//
// ============================================================================
//  TEN YEARS OF BEING DECENT, AND ONE PER CENT
// ============================================================================
//
//  The only scene in the endgame where the player is the one offering, and
//  the only one reachable purely by having been decent for a decade. So the
//  two things worth pinning are that the gate really is that narrow, and that
//  refusing costs nothing - because a warm scene that punishes the cautious
//  answer is not warm, it is a toll.
// ============================================================================

import { friendBoardSeat, friendBoardSeatEvent, FRIEND_STAKE } from './friendBoard';
import { EVENTS } from '../events';
import { CONVERSATIONS } from './index';
import { validate } from '../../core/story/graph';
import { CAST } from './cast';
import { testAll, type World } from '../../core/story/conditions';
import { INITIAL_DIALS } from '../../core/story/state';
import { SEAT_MIN_STAKE, SEAT_MAX_STAKE } from '../../core/market/governance';
import { FOUNDER_BY_COMPANY } from '../market/founders';

const known = new Set(CONVERSATIONS.map(c => c.id));

const earned = (over: Partial<World> = {}): World => ({
    dials: { ...INITIAL_DIALS, friendLoyalty: 95 },
    flags: { fatherDead: true, friendHelped: true, friendGrewUp: true },
    quarter: 200,
    capital: 200_000_000,
    cash: 500_000,
    morale: 71,
    marketShare: 6,
    staffing: 100,
    researchers: 15,
    subsidiaries: ['tech_planora'],
    casinoStreak: 0,
    quartersWithoutSponsor: 0,
    ...over,
});

describe('it is in the game', () => {
    it('registered, valid and in the pool', () => {
        expect(known.has(friendBoardSeat.id)).toBe(true);
        expect(validate(friendBoardSeat, CAST, known)).toEqual([]);
        expect(EVENTS.map(e => e.id)).toContain(friendBoardSeatEvent.id);
    });

    it('and it is a message, because he has had your number since before any of this', () => {
        expect(friendBoardSeat.channel).toBe('message');
        expect(friendBoardSeat.from).toBe('friend');
    });
});

describe('the gate is as narrow as the scene claims', () => {
    it('everything has to be true at once', () => {
        expect(testAll(friendBoardSeatEvent.when, earned())).toBe(true);

        // Take away any one of them and it closes.
        expect(testAll(friendBoardSeatEvent.when, earned({ quarter: 20 }))).toBe(false);
        expect(testAll(friendBoardSeatEvent.when, earned({ subsidiaries: [] }))).toBe(false);
        expect(testAll(friendBoardSeatEvent.when,
            earned({ dials: { ...INITIAL_DIALS, friendLoyalty: 70 } }))).toBe(false);
        expect(testAll(friendBoardSeatEvent.when,
            earned({ flags: { fatherDead: true, friendHelped: true } }))).toBe(false);
    });

    it('a player who ever turned him down never sees it', () => {
        // Consistent with the rest of his arc: one refusal closes everything,
        // silently and forever.
        expect(testAll(friendBoardSeatEvent.when, earned({
            flags: {
                fatherDead: true, friendHelped: true,
                friendGrewUp: true, friendRefused: true,
            },
        }))).toBe(false);
    });

    it('and it cannot happen twice', () => {
        expect(testAll(friendBoardSeatEvent.when, earned({
            flags: {
                fatherDead: true, friendHelped: true,
                friendGrewUp: true, friendOnBoard: true,
            },
        }))).toBe(false);
    });
});

describe('one per cent, and it is a real seat', () => {
    it('inside the same band every other director gets', () => {
        // Not a decoration. He votes with it, on the same cap table.
        expect(FRIEND_STAKE).toBe(0.01);
        expect(FRIEND_STAKE).toBeGreaterThanOrEqual(SEAT_MIN_STAKE);
        expect(FRIEND_STAKE).toBeLessThanOrEqual(SEAT_MAX_STAKE);
    });

    it('every acceptance seats him and records it', () => {
        const seats = friendBoardSeat.nodes
            .flatMap(n => n.choices ?? [])
            .filter(ch => (ch.effects ?? []).some(e => e.kind === 'boardSeat'));
        expect(seats.length).toBeGreaterThan(0);
        for (const ch of seats) {
            const seat = (ch.effects ?? []).find(e => e.kind === 'boardSeat') as any;
            expect(seat.person).toBe('tech_planora');
            expect(seat.stake).toBe(FRIEND_STAKE);
            expect((ch.effects ?? []).some(e =>
                e.kind === 'flag' && (e as any).flag === 'friendOnBoard')).toBe(true);
        }
    });

    it('and he is a person the board system already knows', () => {
        // The seat is issued through the same door an acquisition uses, which
        // reads the founder file - so a name that is not in it would seat
        // nobody and fail silently.
        expect(FOUNDER_BY_COMPANY.tech_planora).toBeDefined();
        expect(FOUNDER_BY_COMPANY.tech_planora.name).toBe('Marco Alvarez');
    });

    it('and taking him on is not free - he has a pet issue and a vote', () => {
        expect(FOUNDER_BY_COMPANY.tech_planora.petIssue).toBe('rnd');
        expect(friendBoardSeat.nodes.find(n => n.id === 'accept')!.text)
            .toContain('difficult about research spending');
    });
});

describe('and refusing costs nothing', () => {
    it('the way out has no effects on it at all', () => {
        // A warm scene that punishes the cautious answer is a toll. He is the
        // one person in this game that is true of.
        const out = friendBoardSeat.nodes.find(n => n.id === 'wrongPerson')!;
        const leave = out.choices!.find(ch => ch.text === '(leave it)')!;
        expect(leave.effects).toEqual([]);
    });

    it('and there is a way back from it, so it is not reached by drifting', () => {
        const out = friendBoardSeat.nodes.find(n => n.id === 'wrongPerson')!;
        expect(out.choices!.some(ch => ch.next === 'why')).toBe(true);
    });

    it('and no dial anywhere in the scene goes down', () => {
        const drops = friendBoardSeat.nodes
            .flatMap(n => n.choices ?? [])
            .flatMap(ch => ch.effects ?? [])
            .filter(e => e.kind === 'dial' && (e as any).delta < 0);
        expect(drops).toEqual([]);
    });

    it('and thinking about it properly still gets him the seat', () => {
        // A version where the careful answer loses it would be punishing care.
        const accept = friendBoardSeat.nodes.find(n => n.id === 'accept')!;
        expect(accept.choices).toHaveLength(2);
        for (const ch of accept.choices!) {
            expect((ch.effects ?? []).some(e => e.kind === 'boardSeat')).toBe(true);
        }
    });
});
