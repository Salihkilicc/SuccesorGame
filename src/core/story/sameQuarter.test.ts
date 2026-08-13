// src/core/story/sameQuarter.test.ts
//
// ============================================================================
//  "IN THE SAME QUARTER" HAD TO ACTUALLY MEAN THAT
// ============================================================================
//
//  The father dies, and the scene schedules Pear's letter with
//  `afterQuarters: 0` under a comment saying it arrives in the same quarter
//  because the obscenity of the timing is the point.
//
//  It did not. The inbox is drained by the quarterly tick, and anything
//  scheduled from inside a conversation is scheduled AFTER that quarter's
//  drain has already run - so the letter waited for the player to advance
//  time and turned up a quarter late.
//
//  The condolence wave sits behind it: all four are gated on `refusedPear`,
//  which cannot be raised until Pear has been answered. So the whole act
//  stalled. Nothing from Pear, nothing from the friend, nothing from the CFO,
//  nothing from the board - a player buries their father and the game says
//  nothing at all.
// ============================================================================

import { useStoryStore, initialStoryState } from '../store/useStoryStore';
import { useMailStore, initialMailState } from '../store/useMailStore';
import { useMessageStore, initialMessageState } from '../store/useMessageStore';
import { gameSink } from './gameSink';
import { runInbox } from './deliver';
import { useGameStore } from '../store/useGameStore';
import { CONVERSATIONS } from '../../data/story';

const fresh = () => {
    useStoryStore.setState({ ...initialStoryState, flags: { fatherDead: true } });
    useMailStore.setState({ ...initialMailState });
    useMessageStore.setState({ ...initialMessageState });
};

const inbox = () => useMailStore.getState().inbox;
const hasMail = (subject: string) =>
    inbox().some(m => m.subject === subject);

beforeEach(fresh);

describe('a scene that schedules for this quarter', () => {
    it('delivers without waiting for the tick', () => {
        const pear = CONVERSATIONS.find(c => c.id === 'pear-offer')!;
        expect(hasMail(pear.subject!)).toBe(false);

        gameSink().schedule({ conversation: 'pear-offer', afterQuarters: 0, urgent: true });

        // THE ASSERTION THIS FILE EXISTS FOR. No tick in between.
        expect(hasMail(pear.subject!)).toBe(true);
    });

    it('and leaves a later one alone', () => {
        const pear = CONVERSATIONS.find(c => c.id === 'pear-offer')!;
        gameSink().schedule({ conversation: 'pear-offer', afterQuarters: 2 });
        expect(hasMail(pear.subject!)).toBe(false);
        // Still queued, not lost.
        expect(useStoryStore.getState().pending
            .some(p => p.conversationId === 'pear-offer')).toBe(true);
    });

    it('sends one copy when two things queued the same scene', () => {
        // The realistic shape: two code paths - a beat and a lock, say - both
        // queue a conversation before the drain runs. Each checks the queue
        // before adding and neither can see what the other put in, so the
        // guard has to be at the point of sending.
        //
        // Scheduled for LATER and then drained once, because scheduling for
        // now drains immediately and the second call would be a second drain
        // - which is a different situation and one the game does not create.
        gameSink().schedule({ conversation: 'pear-offer', afterQuarters: 1 });
        gameSink().schedule({ conversation: 'pear-offer', afterQuarters: 1 });
        expect(useStoryStore.getState().pending.length).toBe(2);

        useGameStore.setState({ currentMonth: 4 } as never);
        runInbox();

        const pear = CONVERSATIONS.find(c => c.id === 'pear-offer')!;
        expect(inbox().filter(m => m.subject === pear.subject).length).toBe(1);
    });
});

describe('so the act after the death can actually start', () => {
    it("Pear's letter is in the inbox the moment the scene ends", () => {
        // Exactly the effect data/story/fatherDeath.ts carries, on both of
        // its answers.
        gameSink().schedule({ conversation: 'pear-offer', afterQuarters: 0, urgent: true });
        const pear = CONVERSATIONS.find(c => c.id === 'pear-offer')!;
        const letter = inbox().find(m => m.subject === pear.subject);
        expect(letter).toBeDefined();
        expect(letter!.isRead).toBe(false);
    });

    it('and the condolences are still gated on him being answered', () => {
        // Not changed by any of this, and worth pinning: the wave reacts to a
        // decision, so it must not be able to arrive before the decision.
        //
        // condolence-cfo-message is the exception and not an oversight - it
        // has no gate because it is not a beat. The CFO's LETTER schedules
        // it an hour later, so its timing is the letter's timing and giving
        // it a second gate would be a second source for one fact.
        const wave = CONVERSATIONS.filter(
            c => c.id.startsWith('condolence-') && c.id !== 'condolence-cfo-message',
        );
        expect(wave.length).toBeGreaterThan(3);
        for (const c of wave) {
            expect(JSON.stringify(c.when ?? [])).toMatch(/refusedPear/);
        }
    });
});

// ============================================================================
//  AND WHEN PEAR ACTUALLY ARRIVES
// ============================================================================
//  The quarter after the funeral. It was written for the same quarter, under
//  a note about the obscenity of the timing - and the note was right about the
//  effect and wrong about the mechanism, so what it produced was "whenever the
//  player next advances time": the same delay dressed as immediacy.
//
//  One quarter is the honest statement of the same thing, and it does not
//  depend on a side effect of the scheduler to be true.
// ============================================================================
describe("the letter the father's death sends", () => {
    const deathEffects = () => {
        const death = CONVERSATIONS.find(c => c.id === 'father-death')!;
        return death.nodes
            .flatMap(n => n.choices?.flatMap(c => c.effects ?? []) ?? [])
            .filter((e: any) => e.kind === 'schedule' && e.conversation === 'pear-offer') as any[];
    };

    it('is scheduled from both answers, identically', () => {
        const scheduled = deathEffects();
        expect(scheduled.length).toBe(2);
        // Asking for a day does not buy one, and the two answers must not
        // differ on when it lands or the choice becomes a delay tactic.
        expect(scheduled[0].afterQuarters).toBe(scheduled[1].afterQuarters);
    });

    it('for the quarter after, and it jumps the queue when it comes', () => {
        for (const e of deathEffects()) {
            expect(e.afterQuarters).toBe(1);
            expect(e.urgent).toBe(true);
        }
    });
});

// ============================================================================
//  NO REAL COMPANIES IN THE INBOX
// ============================================================================
//  Three of them shipped: a Google Workspace welcome, a letter from Vanguard
//  Capital and a LinkedIn notification - trademarks of firms that exist, two
//  of them financial, in a game about running a company badly.
// ============================================================================
describe('the seeded inbox', () => {
    it('names nobody real', () => {
        const { initialMailState } = require('../store/useMailStore');
        const text = JSON.stringify(initialMailState.inbox);
        for (const name of [
            'Google', 'LinkedIn', 'Vanguard', 'Microsoft', 'Apple', 'Meta',
            'Amazon', 'Goldman', 'Salesforce',
        ]) {
            expect(text).not.toMatch(new RegExp(name, 'i'));
        }
    });

    it('and still opens on something that says you have a job', () => {
        const { initialMailState } = require('../store/useMailStore');
        // The welcome-to-your-inbox letter is gone rather than renamed: a mail
        // app explaining what a mail app is for is the most skippable letter
        // that could open this game.
        const first = initialMailState.inbox[0];
        expect(first.subject).not.toMatch(/welcome/i);
        expect(first.fromEmail).toContain('@hale.co');
    });
});
