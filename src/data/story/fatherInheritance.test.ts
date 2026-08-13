// src/data/story/fatherInheritance.test.ts
//
// ============================================================================
//  THE FIRST CHARACTER IN THE GAME IS NOT ALLOWED TO BE WRONG ABOUT THE GAME
// ============================================================================
//
//  He is written as an unreliable narrator, and that only works while every
//  CHECKABLE thing he says checks out. The player can open the shareholder
//  screen thirty seconds after this scene ends. If he says thirty-five and the
//  register says forty, he stops being a man with a blind spot and becomes a
//  bug - and worse, the player learns in the first five minutes that the
//  writing does not match the game, which is a thing they cannot un-learn.
//
//  So the figures in his mouth are pinned to the stores here. A rebalance that
//  moves the opening stake fails this file, which is the only way anybody
//  would ever remember to reopen a scene written months earlier.
// ============================================================================

import { fatherInheritance,
    PLAYER_STAKE, WOLF_STAKE, BROTHER_STAKE, VANCE_STAKE, VICTOR_STAKE,
    OPENING_HEADCOUNT } from './fatherInheritance';
import { CONVERSATIONS, OPENING_CONVERSATIONS, STORY_BEATS } from './index';
import { INITIAL_BOARD_MEMBERS, TOTAL_SHARES } from '../../features/shareholders/stores/useShareholderStore';
import { initialStatsState, START_EMPLOYEES } from '../../core/store/useStatsStore';
import { CAST } from './cast';
import { formalNameOf } from '../../core/story/cast';

const nodes = () => fatherInheritance.nodes;
const node = (id: string) => {
    const n = nodes().find(x => x.id === id);
    if (!n) throw new Error(`no node ${id}`);
    return n;
};
const allText = () => nodes().map(n => n.text).join('\n');

describe('the figures he quotes are the figures the game holds', () => {
    it('the player really does start with a minority', () => {
        expect(initialStatsState.companyOwnership).toBe(PLAYER_STAKE);
        expect(PLAYER_STAKE).toBeLessThan(50);
    });

    it('and the four names hold exactly what he says they hold', () => {
        const pct = (shares: number) => Math.round((shares / TOTAL_SHARES) * 100);
        const held = Object.fromEntries(
            INITIAL_BOARD_MEMBERS.map(m => [m.name, pct(m.shareCount)]),
        );
        expect(held["Marcus 'The Wolf'"]).toBe(WOLF_STAKE);
        expect(held['Elena Vance']).toBe(VANCE_STAKE);
        expect(held['Victor K.']).toBe(VICTOR_STAKE);
        // The brother is on the register under his own name.
        const brother = INITIAL_BOARD_MEMBERS.find(m => /Julian/.test(m.name));
        expect(brother).toBeDefined();
        expect(pct(brother!.shareCount)).toBe(BROTHER_STAKE);
    });

    it('the four of them plus the player account for the whole company', () => {
        expect(PLAYER_STAKE + WOLF_STAKE + BROTHER_STAKE + VANCE_STAKE + VICTOR_STAKE)
            .toBe(92);
        // Nothing is unaccounted for beyond that, which is why he says "four
        // people" rather than "everyone" - there is no fifth face to find.
        const board = INITIAL_BOARD_MEMBERS.reduce((a, m) => a + m.shareCount, 0);
        const player = (PLAYER_STAKE / 100) * TOTAL_SHARES;
        expect(board + player).toBeLessThanOrEqual(TOTAL_SHARES);
    });

    it('twenty-two people, and the store agrees', () => {
        expect(OPENING_HEADCOUNT).toBe(START_EMPLOYEES);
        expect(allText()).toContain('Twenty-two people');
    });

    it('he says there is no debt, and there is no debt', () => {
        // The line "not one penny owed to anybody" is the single most
        // load-bearing factual claim in the scene - it is what makes the
        // dilution a trade rather than a catastrophe.
        expect(initialStatsState.companyDebt).toBe(0);
        expect(initialStatsState.companyDebtTotal).toBe(0);
        expect(node('whatIsLeft').text).toContain('not one penny owed');
    });

    it('he does not claim the company is insolvent, because it is not', () => {
        // He is allowed to be bleak. He is not allowed to describe a
        // bankruptcy the balance sheet will contradict thirty seconds later.
        expect(initialStatsState.money).toBeGreaterThan(0);
        expect(allText()).not.toMatch(/bankrupt|insolven|receivership|going under/i);
        expect(node('notMuch').text).toContain('small solvent company');
    });
});

describe('the shape of the man', () => {
    it('gives a different culprit for each of the four transfers', () => {
        // The point of the scene. Four stories, four external causes.
        expect(node('howGotHere').text).toMatch(/banks had shut the window/);
        expect(node('vance').text).toMatch(/banks wanted an adult/);
        expect(node('victor').text).toMatch(/hourly rate I was paying put it there/);
        expect(node('brother').text).toMatch(/your grandfather wrote a will/);
    });

    it('admits the signature when asked, and immediately changes the subject', () => {
        const n = node('whoSigned');
        expect(n.text).toContain('I did.');
        // He does not deny it, and he does not stay with it.
        expect(n.text).toContain('The floor is what you should be asking about');
    });

    it('does not arrive at it even when pushed a second time', () => {
        // If this ever starts reading as a confession, the character has been
        // resolved in his first scene and the rest of the year has nothing
        // left to reveal.
        expect(node('thePen').text).not.toMatch(/my fault|I was wrong|I ruined/i);
        expect(node('thePen').text).toContain('You will have your own Thursdays');
    });

    it('leaves the question reachable rather than compulsory', () => {
        // Two routes in, so a player who is paying attention finds it and a
        // player who is not is never blocked by it.
        const into = nodes().filter(n =>
            n.choices?.some(c => c.next === 'whoSigned'));
        expect(into.map(n => n.id).sort()).toEqual(['brother', 'victor']);
    });

    it('never once opens with a greeting', () => {
        expect(node('open').text).not.toMatch(/^(hello|hi|good morning|dear)/i);
    });

    it('moves no dial and raises no flag anywhere in the scene', () => {
        // Three days in. There is no relationship yet to move, and a scene
        // that hands out dial points for saying thank you teaches the player
        // to farm the father rather than listen to him.
        const effects = nodes().flatMap(n => n.choices?.flatMap(c => c.effects ?? []) ?? []);
        expect(effects.filter(e => e.kind === 'dial')).toEqual([]);
        expect(effects.filter(e => e.kind === 'flag')).toEqual([]);
    });
});

describe('delivery', () => {
    it('is registered, so it is in the game and the audit can see it', () => {
        expect(CONVERSATIONS).toContain(fatherInheritance);
    });

    it('arrives before the instruction to set a target', () => {
        const mine = OPENING_CONVERSATIONS.indexOf(fatherInheritance.id);
        const q1 = OPENING_CONVERSATIONS.indexOf('father-q1');
        expect(mine).toBeGreaterThanOrEqual(0);
        expect(q1).toBeGreaterThanOrEqual(0);
        // seedOpening walks this list in order and nextPriority hands out
        // increasing priorities within the wave, so index IS reading order.
        expect(mine).toBeLessThan(q1);
    });

    it('is queued from ONE list, not two', () => {
        // It was briefly also exported as a StoryBeat. Two delivery routes for
        // one scene means it arrives twice, on a screen where the player
        // cannot tell that from a bug in the story itself.
        expect(STORY_BEATS.map(b => b.conversation))
            .not.toContain(fatherInheritance.id);
    });

    it('every choice leads somewhere that exists', () => {
        const ids = new Set(nodes().map(n => n.id));
        for (const n of nodes()) {
            for (const c of n.choices ?? []) {
                if (c.next) expect(ids.has(c.next)).toBe(true);
            }
        }
    });

    it('every node is reachable from the start', () => {
        const seen = new Set([fatherInheritance.start]);
        const queue = [fatherInheritance.start];
        while (queue.length) {
            const id = queue.shift()!;
            for (const c of node(id).choices ?? []) {
                if (c.next && !seen.has(c.next)) { seen.add(c.next); queue.push(c.next); }
            }
        }
        expect([...nodes().map(n => n.id)].filter(id => !seen.has(id))).toEqual([]);
    });
});

// ============================================================================
//  THE THROUGH-LINE, ACROSS EVERY SCENE HE IS IN
// ============================================================================
//  These are the assertions that stop him drifting back into a wise mentor
//  three edits from now. He is a man who explains a twenty-year decline
//  entirely in terms of other people, and the tone note in cast.ts says so -
//  but a tone note is a suggestion and this is a check.
// ============================================================================
describe('he explains everything with somebody else in it', () => {
    const HIS_SCENES = ['father-inheritance', 'father-q1', 'father-q1-invoice',
        'father-morale', 'father-marketing'];

    //  ONE scene is deliberately not like the others. See below.
    const BLAMES = HIS_SCENES.filter(id => id !== 'father-q1-invoice');

    it('names an outside cause in every scene but one', () => {
        // Banks, a supplier, a board, a purchasing director, California.
        // Each of these carries at least one thing that was done TO him,
        // because a man who only does this in his opening scene has a quirk
        // rather than a shape.
        const missing = CONVERSATIONS
            .filter(c => BLAMES.includes(c.id))
            .filter(c => !/bank|supplier|board|competitor|California|Microhard|purchasing|grandfather|hourly rate/i
                .test(c.nodes.map(n => n.text).join(' ')))
            .map(c => c.id);
        expect(missing).toEqual([]);
    });

    it('and the exception is the crack, so it stays a crack', () => {
        // father-q1-invoice is the one place he tells a story of being
        // robbed for six years and does NOT hand it to anybody. He lists
        // the people who signed it and puts himself last and last is the
        // position that carries the weight:
        //
        //     'My accountant signed it. My brother signed it. I signed it.'
        //
        // It was written before this pass and it is the best thing he says
        // in the first year, because it is the one moment the machinery
        // slips. Adding a culprit to this scene to make him consistent
        // would be making the character worse in the name of a rule - so
        // the rule has an exception, and the exception is asserted rather
        // than left to somebody's memory.
        const invoice = CONVERSATIONS.find(c => c.id === 'father-q1-invoice');
        expect(invoice).toBeDefined();
        const text = invoice!.nodes.map(n => n.text).join(' ');
        expect(text).toContain('I signed it.');
        expect(text).toContain('the only part of it I am proud of');
    });

    it('and is still factually reliable, which is what makes it work', () => {
        // Named because it is the load-bearing half of the design and the
        // easy half to lose. His instructions are checked in the individual
        // scene tests - fatherQ1.test.ts on units and shared capacity,
        // fatherMorale.test.ts on the eighty-five ceiling,
        // fatherMarketing.test.ts on the four hundred thousand. This asserts
        // only that those scenes still exist to do the checking.
        for (const id of HIS_SCENES) {
            expect(CONVERSATIONS.map(c => c.id)).toContain(id);
        }
    });
});

describe('what your phone calls him', () => {
    it('is not his legal name', () => {
        expect(CAST.father.name).toBe('Your Father');
    });

    it('but the world still has one for the headlines', () => {
        expect(formalNameOf(CAST.father)).toBe('Gerald Hale');
    });
});
