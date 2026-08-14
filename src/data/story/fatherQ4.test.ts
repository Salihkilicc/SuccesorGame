// src/data/story/fatherQ4.test.ts
//
// ============================================================================
//  THE LAST QUARTER OF HIM, AND THE ONE THING IT MUST NOT DO
// ============================================================================
//
//  A message from a man who died that morning is the single bug in this game
//  a player would remember afterwards, and it would not look like a bug. It
//  would look like the writing not knowing what it was doing.
//
//  So the collision is asserted from both ends: his scene cannot be due once
//  he is dead, and the death cannot arrive before the quarter his scene is
//  already gone from.
// ============================================================================

import { fatherQ4 } from './fatherQ4';
import { fatherDeath } from './fatherDeath';
import { CONVERSATIONS, STORY_BEATS } from './index';
import { CAST } from './cast';
import { validate } from '../../core/story/graph';
import { testAll, type World } from '../../core/story/conditions';
import { INITIAL_DIALS } from '../../core/story/state';

const world = (over: Partial<World> = {}): World => ({
    dials: { ...INITIAL_DIALS }, flags: {}, quarter: 1,
    capital: 2_000_000, cash: 2_000_000, morale: 75, marketShare: 0.4,
    staffing: 100, researchers: 0, subsidiaries: [],
    casinoStreak: 0, quartersWithoutSponsor: 0,
    ...over,
} as World);

const due = (c: typeof fatherQ4, w: World) => testAll(c.when, w);

describe('when it arrives', () => {
    it('not before the fourth quarter', () => {
        for (const quarter of [1, 2, 3]) {
            expect(due(fatherQ4, world({ quarter }))).toBe(false);
        }
        expect(due(fatherQ4, world({ quarter: 4 }))).toBe(true);
    });

    it('and never once he is gone', () => {
        expect(due(fatherQ4, world({ quarter: 4, flags: { fatherDead: true } })))
            .toBe(false);
        // Including for a player who reaches the fourth quarter late, which
        // is the only route by which the two could ever have met.
        expect(due(fatherQ4, world({ quarter: 7, flags: { fatherDead: true } })))
            .toBe(false);
    });
});

describe('it cannot share an inbox with the news', () => {
    it('the death waits for the quarter after his', () => {
        expect(due(fatherDeath as never, world({ quarter: 4 }))).toBe(false);
        expect(due(fatherDeath as never, world({ quarter: 5 }))).toBe(true);
    });

    it('so there is no quarter in which both are due', () => {
        // The assertion this file exists for, checked by exhaustion rather
        // than by reading the two condition lists and believing them.
        const both: number[] = [];
        for (let quarter = 1; quarter <= 12; quarter += 1) {
            const w = world({ quarter });
            if (due(fatherQ4, w) && due(fatherDeath as never, w)) both.push(quarter);
        }
        expect(both).toEqual([]);
    });

    it('and his beat is checked first, so a late player still gets him', () => {
        // Both are queued from STORY_BEATS and a beat is taken the first
        // quarter its `when` holds. Order in the list is therefore the
        // tiebreak for a player who arrives at quarter four having already
        // passed quarter five's condition.
        const ids = STORY_BEATS.map(b => b.conversation);
        expect(ids.indexOf(fatherQ4.id)).toBeGreaterThanOrEqual(0);
        expect(ids.indexOf(fatherQ4.id)).toBeLessThan(ids.indexOf(fatherDeath.id));
    });

    it('and both jump the queue, because his window is one quarter wide', () => {
        // It was written non-urgent, on the reasoning that a conversation
        // which teaches nothing can wait. That reasoning is right for a beat
        // whose window stays open and wrong for this one: with
        // `quarterAtMost: 4`, waiting behind two random events does not delay
        // the scene, it deletes it.
        const mine = STORY_BEATS.find(b => b.conversation === fatherQ4.id)!;
        const news = STORY_BEATS.find(b => b.conversation === fatherDeath.id)!;
        expect(mine.urgent).toBe(true);
        expect(news.urgent).toBe(true);
    });

    it('his window really is only the one quarter', () => {
        expect(due(fatherQ4, world({ quarter: 4 }))).toBe(true);
        expect(due(fatherQ4, world({ quarter: 5 }))).toBe(false);
    });
});

describe('what it is', () => {
    it('is registered and valid', () => {
        const known = new Set(CONVERSATIONS.map(c => c.id));
        expect(known.has(fatherQ4.id)).toBe(true);
        expect(validate(fatherQ4, CAST, known)).toEqual([]);
    });

    it('teaches nothing and costs nothing', () => {
        // The point of the scene. Every other conversation of his hangs off a
        // mechanic; this one hangs off nothing, and the moment it starts
        // handing out dial points it becomes another lesson with a reward.
        const effects = fatherQ4.nodes
            .flatMap(n => n.choices?.flatMap(c => c.effects ?? []) ?? []);
        expect(effects).toEqual([]);
    });

    it('names no screen and gives no instruction', () => {
        const text = fatherQ4.nodes.map(n => n.text).join(' ');
        expect(text).not.toMatch(/Products|Team Morale|budget|target/i);
    });

    it('is not a goodbye, because he does not know', () => {
        // He dies at his desk next quarter with the coffee still warm. A man
        // who had been putting his affairs in order would not.
        const text = fatherQ4.nodes.map(n => n.text).join(' ');
        expect(text).not.toMatch(/goodbye|farewell|proud of you|before I go|last time/i);
    });

    it('gets to the edge of something and stops', () => {
        // The card the scene is for. If this line ever gets finished, the
        // death arrives on a man who had already said it.
        const trying = fatherQ4.nodes.find(n => n.id === 'trying')!;
        expect(trying.text).toContain('meaning to say to you since about April');
        // And what he actually does with the sentence is change it.
        expect(trying.text).toContain('written you about the yield instead');
    });

    it('will not say it even when asked twice', () => {
        const asked = fatherQ4.nodes.find(n => n.id === 'whatThing')!;
        expect(asked.text).toContain('It will keep.');
        const pushed = fatherQ4.nodes.find(n => n.id === 'sayItBadly')!;
        // He offers a smaller thing in its place and says so out loud.
        expect(pushed.text).toContain('That is not the thing.');
    });

    it('ends on a filing cabinet', () => {
        const last = fatherQ4.nodes.find(n => n.id === 'noted')!;
        expect(last.text).toContain('Second cabinet');
        expect(last.choices?.every(c => !c.next)).toBe(true);
    });
});
