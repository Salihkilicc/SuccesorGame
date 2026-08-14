// src/data/story/condolences.test.ts
//
// ============================================================================
//  FOUR PEOPLE, ONE DEATH, AND WHAT EACH OF THEM WANTS
// ============================================================================
//
//  The wave is the first time the cast is asked to be four distinguishable
//  people rather than four names, and the way that fails is not a crash - it
//  is everyone sounding faintly like the author. So most of what is pinned
//  here is difference: who mentions the company, who asks for something, who
//  knows what.
// ============================================================================

import {
    friendCondolence, friendCondolencePublic,
    cfoCondolenceMail, cfoCondolenceMessage, cfoCondolencePublic,
    brotherCondolence, brotherCondolencePublic,
    boardCondolence, boardCondolencePublic,
} from './condolences';
import { CONVERSATIONS, STORY_BEATS } from './index';
import { validate } from '../../core/story/graph';
import { CAST } from './cast';
import { drain, DELIVERIES_PER_QUARTER, type Pending } from '../../core/story/inbox';
import { testAll } from '../../core/story/conditions';
import { INITIAL_DIALS } from '../../core/story/state';
import type { World } from '../../core/story/conditions';

const known = new Set(CONVERSATIONS.map(c => c.id));
const WAVE = [
    friendCondolence, friendCondolencePublic,
    cfoCondolenceMail, cfoCondolenceMessage, cfoCondolencePublic,
    brotherCondolence, brotherCondolencePublic,
    boardCondolence, boardCondolencePublic,
];
const textOf = (c: typeof friendCondolence) => c.nodes.map(n => n.text).join(' ');

const world = (flags: Partial<Record<string, true>>, quarter = 5): World => ({
    dials: { ...INITIAL_DIALS },
    flags: flags as any,
    quarter,
    capital: 5_000_000,
    cash: 100_000,
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
    it('every scene is registered and valid', () => {
        for (const c of WAVE) {
            expect(known.has(c.id)).toBe(true);
            expect(validate(c, CAST, known)).toEqual([]);
        }
    });

    it('the wave is queued as beats, in the order it should be read', () => {
        const order = STORY_BEATS.map(b => b.conversation);
        expect(order.indexOf(friendCondolence.id)).toBeLessThan(order.indexOf(cfoCondolenceMail.id));
        expect(order.indexOf(cfoCondolenceMail.id)).toBeLessThan(order.indexOf(brotherCondolence.id));
        expect(order.indexOf(brotherCondolence.id)).toBeLessThan(order.indexOf(boardCondolence.id));
    });

    it('and none of it is urgent, because the pacing IS the wave', () => {
        // Marking them urgent would dump four in one quarter and turn a
        // sequence into a pile.
        for (const beat of STORY_BEATS) {
            if (beat.conversation.startsWith('condolence-')) expect(beat.urgent).toBeFalsy();
        }
    });
});

describe('the wave is on a quarter, not on Pear being answered', () => {
    // ------------------------------------------------------------------
    //  IT WAS `refusedPear`, AND THE REASONING READ WELL
    // ------------------------------------------------------------------
    //  Four people reacting to a decision should not arrive before the
    //  decision. True, and about the wrong thing: they are not reacting to
    //  the decision, they are reacting to a DEATH - which happened whatever
    //  the player did about the letter. The friend does not mention the
    //  company once.
    //
    //  What the flag cost: Pear's letter is the only thing that raises it,
    //  and that letter had four ways to go missing. When it did, four
    //  written scenes went with it and nothing said so.
    // ------------------------------------------------------------------
    it('does not arrive in the quarter of the death itself', () => {
        const q5 = world({ fatherDead: true }, 5);
        for (const c of WAVE) {
            if (c.id === cfoCondolenceMessage.id) continue;  // scheduled by the mail
            expect(testAll(c.when, q5)).toBe(false);
        }
    });

    it('and arrives the quarter after Pear writes, answered or not', () => {
        const q6 = world({ fatherDead: true }, 6);
        expect(testAll(friendCondolence.when, q6)).toBe(true);
        expect(testAll(cfoCondolenceMail.when, q6)).toBe(true);
        expect(testAll(brotherCondolence.when, q6)).toBe(true);
        expect(testAll(boardCondolence.when, q6)).toBe(true);
    });

    it('and none of the four still names that flag', () => {
        for (const c of [friendCondolence, cfoCondolenceMail,
            brotherCondolence, boardCondolence]) {
            expect(JSON.stringify(c.when ?? [])).not.toContain('refusedPear');
        }
    });
});

describe('they know HOW you refused', () => {
    // The public variants KEEP their flag, and that is the distinction the
    // change above rests on: refusing him in public is a choice, and what
    // people say about it is a consequence. That is what a flag is for.
    const quiet = world({ fatherDead: true, refusedPear: true }, 8);
    const loud = world(
        { fatherDead: true, refusedPear: true, refusedPearPublicly: true }, 8,
    );

    it('the public follow-ups are dropped on the quiet branch', () => {
        for (const c of [friendCondolencePublic, cfoCondolencePublic,
            brotherCondolencePublic, boardCondolencePublic]) {
            expect(testAll(c.when, quiet)).toBe(false);
            expect(testAll(c.when, loud)).toBe(true);
        }
    });

    it('and each of the four reacts to it as themselves', () => {
        // The friend is proud, the CFO is frightened, the brother has done
        // arithmetic, the board wants to know why it read about it. Four
        // people, one fact - that is the whole test.
        expect(textOf(friendCondolencePublic)).toContain('NOT FOR SALE');
        expect(textOf(cfoCondolencePublic)).toContain('started a file');
        expect(textOf(brotherCondolencePublic)).toContain('Seven point two million');
        expect(textOf(boardCondolencePublic)).toContain('was not consulted');
    });
});

describe('who wants what', () => {
    it('the friend does not mention the company once', () => {
        // He is the only one, and it is why he goes first: after him, nobody
        // in this game writes to you for free.
        const t = (textOf(friendCondolence) + textOf(friendCondolencePublic)).toLowerCase();
        expect(t).not.toContain('board');
        expect(t).not.toContain('shares');
        expect(t).toContain('thursday');
    });

    it('the brother needles and then says the quiet part when pressed', () => {
        expect(textOf(brotherCondolence)).toContain('Just asking');
        expect(textOf(brotherCondolence)).toContain('fifteen percent');
    });

    it('and he is allowed one honest answer', () => {
        // Without it he is a villain rather than a brother, and a villain is
        // easy to refuse for the next fifty years.
        const node = brotherCondolence.nodes.find(n => n.id === 'howAreYou')!;
        expect(node.text).toContain('Nobody has asked');
    });

    it('the board puts condolences and a demand in one document', () => {
        expect(textOf(boardCondolence)).toContain('condolences');
        expect(textOf(boardCondolence)).toContain('statement of intent');
    });

    it('and it is the CFO who has to send it, in his other capacity', () => {
        // The quiet cruelty: the man who wrote the letter about thirty-one
        // years also has to send this, and does, because it is the job.
        expect(boardCondolence.from).toBe('cfo');
        expect(cfoCondolenceMail.from).toBe('cfo');
    });
});

describe('the CFO writes twice, and the gap is the character', () => {
    it('a letter first, then a text', () => {
        expect(cfoCondolenceMail.channel).toBe('mail');
        expect(cfoCondolenceMessage.channel).toBe('message');
    });

    it('and the letter schedules the text on every path', () => {
        const node = cfoCondolenceMail.nodes.find(n => n.id === 'needFromMe')!;
        for (const choice of node.choices!) {
            const s = (choice.effects ?? []).find(e => e.kind === 'schedule') as any;
            expect(s?.conversation).toBe(cfoCondolenceMessage.id);
        }
    });

    it('what he will not put on the company server is the whole point', () => {
        expect(textOf(cfoCondolenceMail)).toContain('company server');
        expect(textOf(cfoCondolenceMessage)).toContain('my own phone');
    });

    it('and the first secret is a name and an amount, not an explanation', () => {
        expect(textOf(cfoCondolenceMessage)).toContain('Braga');
        expect(textOf(cfoCondolenceMessage)).toContain('not yet');
    });
});

describe('two conversations from one person cannot collide', () => {
    // FOUND BY PLAYING THIS WAVE. A message thread holds ONE conversation id,
    // so the brother's condolence and his follow-up both coming due in the
    // same quarter meant the second overwrote the first - and the player
    // never saw one of the two best messages in the wave. No error, no
    // warning, no way to notice except by reading the queue.
    const P = (id: string, priority: number): Pending =>
        ({ id, conversationId: id, dueQuarter: 1, priority, queuedAtQuarter: 1 });

    const senders: Record<string, string> = {
        a: 'brother', b: 'brother', c: 'cfo',
    };
    const senderOf = (p: Pending) => senders[p.conversationId];

    it('the second is held back a quarter', () => {
        const r = drain([P('a', 0), P('b', 1), P('c', 2)], 1, () => true, undefined, senderOf);
        expect(r.deliver.map(d => d.conversationId)).toEqual(['a', 'c']);
        expect(r.keep.map(d => d.conversationId)).toEqual(['b']);
    });

    it('and arrives the next one', () => {
        const first = drain([P('a', 0), P('b', 1), P('c', 2)], 1, () => true, undefined, senderOf);
        const second = drain(first.keep, 2, () => true, undefined, senderOf);
        expect(second.deliver.map(d => d.conversationId)).toEqual(['b']);
    });

    it('without the sender the rule simply does not apply', () => {
        // Every existing caller passed four arguments. Adding a fifth had to
        // leave them behaving exactly as before.
        const r = drain([P('a', 0), P('b', 1)], 1, () => true);
        expect(r.deliver).toHaveLength(DELIVERIES_PER_QUARTER);
    });
});
