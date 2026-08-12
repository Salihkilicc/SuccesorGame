// src/data/story/cfoArc.test.ts
//
// ============================================================================
//  THE ARC'S CLAIM, MADE CHECKABLE
// ============================================================================
//
//  The claim is: listening to him opens content, and refusing him closes it.
//  That is easy to say about any dial and usually turns out to mean a number
//  on a profile screen, so it is worth proving mechanically rather than
//  asserting in a comment.
//
//  These simulate two players - one who listens, one who does not - by walking
//  the actual scenes, applying the actual effects, and checking which
//  conversations become reachable. Nothing is stubbed except the sink.
// ============================================================================

import { cfoBoardRoom, cfoBragaName, cfoBragaTruth, cfoResignation } from './cfoArc';
import { cashWarningConversation, cashWarningEvent } from '../events/cashWarning';
import { cfoDividend } from './cfoDividend';
import { CONVERSATIONS, STORY_BEATS } from './index';
import { EVENTS } from '../events';
import { validate } from '../../core/story/graph';
import { CAST } from './cast';
import { testAll, type World } from '../../core/story/conditions';
import { applyEffects, type Effect, type EffectSink } from '../../core/story/effects';
import { INITIAL_DIALS, clampDial } from '../../core/story/state';
import { rollQuarter } from '../../core/events/engine';
import { emptyHistory } from '../../core/events/types';

const known = new Set(CONVERSATIONS.map(c => c.id));
const ARC = [cfoBoardRoom, cfoBragaName, cfoBragaTruth, cfoResignation, cashWarningConversation];

const world = (over: Partial<World> = {}): World => ({
    dials: { ...INITIAL_DIALS },
    flags: { fatherDead: true },
    quarter: 8,
    capital: 20_000_000,
    cash: 200_000,
    morale: 71,
    marketShare: 4,
    // A fully crewed plant and an empty lab: the state every one of these
    // tests was implicitly assuming before the COO and the CTO could read
    // either number. Neither arc is what this file is about.
    staffing: 100,
    researchers: 0,
    ...over,
});

/**
 * A world that a scene's effects can actually move.
 *
 * The point of the arc is that the dial changes what is reachable, so the test
 * has to carry state forward rather than assert against fixed numbers.
 */
const playable = () => {
    const w = world();
    const sink: EffectSink = {
        capital: () => { }, cash: () => { }, brand: () => { },
        dial: (d, delta) => { w.dials[d] = clampDial(w.dials[d] + delta); },
        flag: f => { (w.flags as any)[f] = true; },
        message: () => { }, mail: () => { }, news: () => { },
        ending: () => { }, schedule: () => { }, reprice: () => { },
    royalty: () => { },
    siege: () => { },
    };
    return { w, sink };
};

/** Take a named path through a conversation, applying what it does. */
const walk = (c: typeof cfoBoardRoom, choices: string[], sink: EffectSink) => {
    let node = c.nodes.find(n => n.id === c.start)!;
    for (const label of choices) {
        const choice = node.choices?.find(ch => ch.text === label);
        if (!choice) throw new Error(`${c.id}: no choice "${label}" on ${node.id}`);
        if (choice.effects) applyEffects(choice.effects as Effect[], sink);
        if (!choice.next) return;
        node = c.nodes.find(n => n.id === choice.next)!;
    }
};

describe('all of it is in the game', () => {
    it('every scene is registered and valid', () => {
        for (const c of ARC) {
            expect(known.has(c.id)).toBe(true);
            expect(validate(c, CAST, known)).toEqual([]);
        }
    });

    it('the arc beats fire on their own conditions', () => {
        const beats = STORY_BEATS.map(b => b.conversation);
        expect(beats).toContain(cfoBoardRoom.id);
        expect(beats).toContain(cfoBragaName.id);
        expect(beats).toContain(cfoResignation.id);
    });

    it('and the truth is scheduled by the scene before it, not by a clock', () => {
        // It is a promise he makes - "a few weeks" - so it must come from the
        // conversation where he made it.
        const agreed = cfoBragaName.nodes.find(n => n.id === 'bothAsk')!.choices![0];
        const s = agreed.effects!.find(e => e.kind === 'schedule') as any;
        expect(s.conversation).toBe(cfoBragaTruth.id);
    });
});

describe('listening opens it', () => {
    it('a player who takes his trades reaches the secret', () => {
        const { w, sink } = playable();
        expect(testAll(cfoBoardRoom.when, w)).toBe(true);

        walk(cfoBoardRoom, ['Why did he not stop it?', 'Then tell me what mood they arrive in.',
            'Noted.', 'I am saying yes to it.'], sink);
        expect(testAll(cfoBragaName.when, w)).toBe(true);

        walk(cfoBragaName, ['You said you never looked.', 'It does not hold.',
            'Then let us both ask.', 'Agreed.'], sink);

        // The dividend crisis and a cash warning are where the rest comes from.
        walk(cfoDividend as any, ['How much is he asking for?', 'And if we spend it instead?',
            'We spend it. Let him complain.', 'Let him say it.'], sink);
        walk(cashWarningConversation, ['What are the options?', 'Which would you do?',
            'Then that is what we do.'], sink);

        expect(w.dials.cfoTrust).toBeGreaterThanOrEqual(75);
        expect(testAll(cfoBragaTruth.when, w)).toBe(true);
    });

    it('and the secret is the reward - it is not reachable any other way', () => {
        // No flag, no quarter, no amount of money opens it. Only the dial.
        const rich = world({
            capital: 500_000_000, quarter: 60,
            flags: { fatherDead: true, cfoToldBoardRoom: true, cfoToldBragaName: true },
        });
        expect(testAll(cfoBragaTruth.when, rich)).toBe(false);
        rich.dials.cfoTrust = 80;
        expect(testAll(cfoBragaTruth.when, rich)).toBe(true);
    });
});

describe('refusing closes it', () => {
    it('a player who brushes him off never gets past the first trade', () => {
        const { w, sink } = playable();
        walk(cfoBoardRoom, ['Who is on it?', 'I would rather have the names.',
            'Names, or do not bring me half a thing.', '(leave it)'], sink);

        // The flag is set - he does not offer again - and the trust is spent.
        expect(w.flags.cfoToldBoardRoom).toBe(true);
        expect(w.dials.cfoTrust).toBeLessThan(INITIAL_DIALS.cfoTrust);
        expect(testAll(cfoBragaName.when, w)).toBe(false);
        expect(testAll(cfoBragaTruth.when, w)).toBe(false);
    });

    it('and repeated dismissals reach the resignation', () => {
        const { w, sink } = playable();
        expect(testAll(cfoResignation.when, w)).toBe(false);

        // Four cash warnings, brushed off each time. This is the arc's engine:
        // the set-pieces fire once, this is the one that can fire repeatedly.
        for (let i = 0; i < 4; i++) {
            walk(cashWarningConversation, ['We have been lower.', '(leave it)'], sink);
        }
        walk(cfoBoardRoom, ['Who is on it?', 'I would rather have the names.',
            'Names, or do not bring me half a thing.', '(leave it)'], sink);

        expect(w.dials.cfoTrust).toBeLessThan(25);
        expect(testAll(cfoResignation.when, w)).toBe(true);
    });

    it('the resignation cannot be argued out of', () => {
        // By the time it fires it has been earned over many quarters. Letting
        // it be talked away would make every previous refusal free in hindsight.
        for (const node of cfoResignation.nodes) {
            for (const choice of node.choices ?? []) {
                const dials = (choice.effects ?? []).filter(e => e.kind === 'dial') as any[];
                expect(dials.some(d => d.dial === 'cfoTrust' && d.delta > 0)).toBe(false);
            }
        }
    });

    it('and it names the cost without naming what was in it', () => {
        const text = cfoResignation.nodes.map(n => n.text).join(' ');
        expect(text).toContain('second drawer');
        expect(text).toContain('I would have told you everything in it');
    });
});

describe('the cash warning is right, which is what makes ignoring it a decision', () => {
    it('fires on a real number rather than on a mood', () => {
        const broke = world({ capital: 1_000_000 });
        const fine = world({ capital: 50_000_000 });
        expect(testAll(cashWarningEvent.when, broke)).toBe(true);
        expect(testAll(cashWarningEvent.when, fine)).toBe(false);
    });

    it('is in the pool and outranks a bad batch', () => {
        expect(EVENTS.map(e => e.id)).toContain(cashWarningEvent.id);
        const recall = EVENTS.find(e => e.id === 'recall')!;
        expect(cashWarningEvent.priority!).toBeGreaterThan(recall.priority ?? 0);
    });

    it('and it wins the quarter when the company is running out', () => {
        const broke = world({ capital: 1_000_000, quarter: 20, dials: { ...INITIAL_DIALS, pearHostility: 60 } });
        const fired = rollQuarter(EVENTS, broke, emptyHistory(), 20, () => 0).fired;
        expect(fired.map(e => e.id)).toEqual([cashWarningEvent.id]);
    });

    it('stops once he has gone', () => {
        const gone = world({ capital: 1_000_000, flags: { fatherDead: true, cfoResigned: true } });
        expect(testAll(cashWarningEvent.when, gone)).toBe(false);
    });
});

describe('what the father was hiding', () => {
    const text = cfoBragaTruth.nodes.map(n => n.text).join(' ');

    it('is not a mistress', () => {
        // The first guess, the cheap one, and it would make him smaller.
        expect(text).toContain('widow');
        expect(text).toContain('patent');
    });

    it('and it was defensible when he did it and theft five years later', () => {
        // The honest answer, which is worse than either clean one.
        expect(text).toContain('defensible');
        expect(text).toContain('By 1991 it was theft');
    });

    it('it explains "trust nobody" as a confession', () => {
        // The load-bearing line of the first act. He was not describing the
        // world; he was describing himself, with the example to hand.
        const node = cfoBragaTruth.nodes.find(n => n.id === 'heKnew')!;
        expect(node.text).toContain('three percent off the top');
    });

    it('and the decent option is the expensive one, with no verdict attached', () => {
        const tellHer = cfoBragaTruth.nodes.find(n => n.id === 'tellHer')!;
        const send = tellHer.choices!.find(c => c.text === 'Send the letter.')!;
        const capital = send.effects!.find(e => e.kind === 'capital') as any;
        expect(capital.amount).toBeLessThan(0);
        // He states the invoice rather than the morality.
        expect(tellHer.text).toContain('I am telling you the invoice');
    });
});
