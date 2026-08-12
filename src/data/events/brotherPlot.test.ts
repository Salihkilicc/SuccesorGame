// src/data/events/brotherPlot.test.ts
//
// ============================================================================
//  THE FIRST TIME TWO ARCS DECIDE EACH OTHER
// ============================================================================
//
//  The claim: whether the player is warned that their brother is meeting Pear
//  depends on how they treated somebody else, quarters earlier.
//
//  Two events, same trigger, mirrored gates. Exactly one of them must be
//  possible in any world - if both can fire, the player gets the warning AND
//  the silence; if neither can, the whole thread quietly does not happen and
//  nothing anywhere reports that.
// ============================================================================

import {
    brotherVote, brotherVoteEvent,
    cfoWarnsAboutBrother, cfoWarnsAboutBrotherEvent,
    brotherCaught,
    brotherMeetsPearQuietly, brotherMeetsPearQuietlyEvent,
} from './brotherPlot';
import { EVENTS } from './index';
import { CONVERSATIONS } from '../story';
import { ENDINGS } from '../story/endings';
import { validate } from '../../core/story/graph';
import { CAST } from '../story/cast';
import { testAll, type World } from '../../core/story/conditions';
import { INITIAL_DIALS } from '../../core/story/state';

const known = new Set(CONVERSATIONS.map(c => c.id));

const world = (over: { cfoTrust?: number; cfoResigned?: boolean } = {}): World => ({
    dials: {
        ...INITIAL_DIALS,
        brotherTrust: 20,
        pearHostility: 40,
        cfoTrust: over.cfoTrust ?? 70,
    },
    flags: { fatherDead: true, ...(over.cfoResigned ? { cfoResigned: true } : {}) },
    quarter: 20,
    capital: 30_000_000,
    cash: 200_000,
    morale: 71,
    marketShare: 4,
});

describe('all of it is in the game', () => {
    it('registered, valid, in the pool', () => {
        for (const c of [brotherVote, cfoWarnsAboutBrother, brotherCaught, brotherMeetsPearQuietly]) {
            expect(known.has(c.id)).toBe(true);
            expect(validate(c, CAST, known)).toEqual([]);
        }
        const ids = EVENTS.map(e => e.id);
        for (const e of [brotherVoteEvent, cfoWarnsAboutBrotherEvent, brotherMeetsPearQuietlyEvent]) {
            expect(ids).toContain(e.id);
        }
    });
});

describe('the warning is gated on a different arc', () => {
    it('a player who kept the CFO gets told', () => {
        const w = world({ cfoTrust: 70 });
        expect(testAll(cfoWarnsAboutBrotherEvent.when, w)).toBe(true);
        expect(testAll(brotherMeetsPearQuietlyEvent.when, w)).toBe(false);
    });

    it('a player who lost him does not, and the meeting happens anyway', () => {
        // The punishment for the CFO arc, and it is deliberately almost
        // invisible: no modal, no "you missed something", just a message about
        // drinks that the player has no reason to read anything into.
        const ignored = world({ cfoTrust: 15 });
        expect(testAll(cfoWarnsAboutBrotherEvent.when, ignored)).toBe(false);
        expect(testAll(brotherMeetsPearQuietlyEvent.when, ignored)).toBe(true);

        const gone = world({ cfoTrust: 90, cfoResigned: true });
        expect(testAll(cfoWarnsAboutBrotherEvent.when, gone)).toBe(false);
        expect(testAll(brotherMeetsPearQuietlyEvent.when, gone)).toBe(true);
    });

    it('exactly one of the two is possible, at every level of trust', () => {
        // Both firing would give the player the warning and the silence.
        // Neither firing would drop the thread with nothing reporting it.
        for (let cfoTrust = 0; cfoTrust <= 100; cfoTrust += 1) {
            const w = world({ cfoTrust });
            const live = [cfoWarnsAboutBrotherEvent, brotherMeetsPearQuietlyEvent]
                .filter(e => testAll(e.when, w));
            expect({ cfoTrust, count: live.length }).toEqual({ cfoTrust, count: 1 });
        }
    });

    it('and the same is true once he has resigned', () => {
        for (let cfoTrust = 0; cfoTrust <= 100; cfoTrust += 25) {
            const w = world({ cfoTrust, cfoResigned: true });
            const live = [cfoWarnsAboutBrotherEvent, brotherMeetsPearQuietlyEvent]
                .filter(e => testAll(e.when, w));
            expect({ cfoTrust, count: live.length }).toEqual({ cfoTrust, count: 1 });
        }
    });
});

describe('the silent version still rewards asking', () => {
    it('a direct question gets the whole thing', () => {
        // He said it in the dividend arc - "I have never once said no to a
        // direct question" - and the game honours it. Almost nobody will ask,
        // and the ones who do get the same information the CFO would have
        // brought them.
        const node = brotherMeetsPearQuietly.nodes.find(n => n.id === 'whoWith')!;
        expect(node.text).toContain('Some people from Pear');
    });

    it('and asking routes into the same confrontation the warning does', () => {
        const viaWarning = cfoWarnsAboutBrother.nodes
            .flatMap(n => n.choices ?? [])
            .flatMap(c => c.effects ?? [])
            .find(e => e.kind === 'schedule') as any;
        const viaAsking = brotherMeetsPearQuietly.nodes
            .flatMap(n => n.choices ?? [])
            .flatMap(c => c.effects ?? [])
            .find(e => e.kind === 'schedule') as any;
        expect(viaWarning.conversation).toBe(brotherCaught.id);
        expect(viaAsking.conversation).toBe(brotherCaught.id);
    });
});

describe('he never lies', () => {
    it('confronted, he admits it in the first line', () => {
        expect(brotherCaught.nodes[0].text.startsWith('Yes.')).toBe(true);
    });

    it('and the damning thing is that he does not think he did anything', () => {
        const text = brotherCaught.nodes.map(n => n.text).join(' ');
        expect(text).toContain('What would you have had me do');
        // The clarification is worse than a denial would have been.
        expect(text).toContain('Everything is a condition');
    });

    it('and the only durable thing on offer is notice, not loyalty', () => {
        const node = brotherCaught.nodes.find(n => n.id === 'aCondition')!;
        const best = node.choices!.find(c => c.text === 'Then tell me the day it changes.')!;
        const d = best.effects!.find(e => e.kind === 'dial' && (e as any).dial === 'brotherTrust') as any;
        expect(d.delta).toBeGreaterThan(0);
    });
});

describe('he votes against you and tells you himself', () => {
    it('warmly, and it is not a performance', () => {
        expect(brotherVote.nodes[0].text).toContain('I voted against');
        expect(brotherVote.nodes[0].text).toContain('It is not personal');
    });

    it('and the vote scene can go either way', () => {
        const deltas = brotherVote.nodes
            .flatMap(n => n.choices ?? [])
            .flatMap(c => c.effects ?? [])
            .filter(e => e.kind === 'dial' && (e as any).dial === 'brotherTrust')
            .map(e => (e as any).delta as number);
        expect(deltas.some(d => d > 0)).toBe(true);
        expect(deltas.some(d => d < 0)).toBe(true);
    });
});

describe('the last thing the player reads', () => {
    it('the removal is an ending, not a line in the translation file', () => {
        expect(ENDINGS.removedByBoard).toBeDefined();
    });

    it('and it is his message, sent nine minutes before the vote', () => {
        const body = ENDINGS.removedByBoard.body;
        expect(body).toContain('11:40');
        expect(body).toContain('11:31');
        expect(body).toContain('I will look after Dad\'s company');
    });

    it('he is not gloating, which is what makes it land', () => {
        // Gloating would let the player hate him cleanly and go and have a
        // feeling about it. He is being kind about a thing he arranged.
        const body = ENDINGS.removedByBoard.body.toLowerCase();
        expect(body).toContain('darling');
        expect(body).not.toContain('told you');
        expect(body).not.toContain('deserve');
    });

    it('and the NARRATION does not explain the nine minutes', () => {
        // The whole device is that the timestamps do the work. A line saying
        // "he knew in advance" would be the game reading its own scene aloud.
        //
        // Checked outside his quoted message only - the first draft of this
        // test failed on "I have always thought you knew that", which is him
        // being condescending inside the message and is exactly the sort of
        // line that should survive.
        const narration = ENDINGS.removedByBoard.body
            .split('"')
            .filter((_, i) => i % 2 === 0)
            .join(' ');
        expect(narration).not.toContain('knew');
        expect(narration).not.toContain('advance');
        expect(narration).not.toContain('because');
        // What it does instead: states two times and stops.
        expect(narration).toContain('Nine minutes');
    });
});
