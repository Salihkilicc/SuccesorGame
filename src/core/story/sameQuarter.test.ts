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
    // currentQuarter counts years from `age`, so this is quarter one.
    useGameStore.setState({ age: 25, currentMonth: 1 } as never);
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

// ============================================================================
//  AND THE LETTER HAS TO BE FINDABLE
// ============================================================================
//  Three commits went into "Pear's mail does not arrive". It arrived every
//  time. It was at the top of the inbox, from "Nathan Vogel", subject "HALE /
//  condolence + preliminary approach - ref 4471-C" - and the word Pear was
//  nowhere on the row.
//
//  That is exactly the letter's character and exactly why it got scrolled
//  past. The engine was right and the label was useless, which is a failure
//  no amount of testing the engine would have found.
// ============================================================================
describe('who a letter says it is from', () => {
    it('names the company when the sender represents one', () => {
        const { senderLabel } = require('./deliver');
        const { CAST } = require('../../data/story/cast');
        expect(senderLabel(CAST.pear)).toContain('Pear');
        expect(senderLabel(CAST.friend)).toContain('Planora');
    });

    it('and does not explain the people you already know', () => {
        const { senderLabel } = require('./deliver');
        const { CAST } = require('../../data/story/cast');
        // Your own CFO, and your father. A label that appends "Founder" to
        // "Your Father" is explaining a relationship to the person in it.
        expect(senderLabel(CAST.cfo)).toBe('Arthur Vance');
        expect(senderLabel(CAST.father)).toBe('Your Father');
    });

    it('and never repeats an organisation that is already the name', () => {
        const { senderLabel } = require('./deliver');
        const { CAST } = require('../../data/story/cast');
        expect(senderLabel(CAST.vulture)).toBe('Halberd Partners');
    });

    it('so Pear is findable the quarter it lands', () => {
        gameSink().schedule({ conversation: 'pear-offer', afterQuarters: 0, urgent: true });
        const letter = inbox().find(m => m.conversationId === 'pear-offer');
        expect(letter).toBeDefined();
        expect(letter!.fromName).toContain('Pear');
    });
});

// ============================================================================
//  A THREAD HOLDS ONE SCENE, AND NOTHING WAS PROTECTING IT
// ============================================================================
//  This is where the second act actually went, and it is not the scheduler.
//
//  Message threads carry exactly one conversation id. Nothing ever cleared it
//  and nothing held the next scene back, so:
//
//    - re-opening a played thread replayed the whole scene, and the runner
//      applies effects as answers are picked: dials moved twice, a schedule
//      fired twice;
//    - the next conversation from that person overwrote one the player had
//      not got round to, however many quarters later, silently.
//
//  The father's death lands on the CFO's thread and PEAR'S LETTER IS
//  SCHEDULED BY AN EFFECT INSIDE IT. A player who had not opened that thread
//  had not answered the CFO, so nothing was ever scheduled - and the next
//  beat from the CFO would have deleted the death itself.
// ============================================================================
describe('a thread with an unanswered scene on it', () => {
    const threads = () => useMessageStore.getState().threads;
    const threadFor = (id: string) => threads().find(t => t.id === id);

    it('holds the next one back rather than overwriting it', () => {
        useStoryStore.setState({ ...initialStoryState, flags: {} });
        // Two scenes from the same person, both due.
        gameSink().schedule({ conversation: 'father-inheritance', afterQuarters: 0, urgent: true });
        expect(threadFor('father')?.conversationId).toBe('father-inheritance');

        gameSink().schedule({ conversation: 'father-q1', afterQuarters: 0, urgent: true });

        // THE ASSERTION. The first is still there, and the second is waiting.
        expect(threadFor('father')?.conversationId).toBe('father-inheritance');
        expect(useStoryStore.getState().pending
            .some(p => p.conversationId === 'father-q1')).toBe(true);
    });

    it('and lets it through once the first has been played', () => {
        useStoryStore.setState({ ...initialStoryState, flags: {} });
        gameSink().schedule({ conversation: 'father-inheritance', afterQuarters: 0, urgent: true });
        gameSink().schedule({ conversation: 'father-q1', afterQuarters: 0, urgent: true });

        // What MessageThreadScreen does when the runner finishes.
        useMessageStore.getState().clearConversation('father');
        runInbox();

        expect(threadFor('father')?.conversationId).toBe('father-q1');
    });

    it('and a different person is not blocked by it', () => {
        useStoryStore.setState({ ...initialStoryState, flags: {} });
        // The death's own gate is quarter five. currentQuarter counts years
        // from `age`, so a year on is a quarter five.
        useGameStore.setState({ age: 26, currentMonth: 1 } as never);
        gameSink().schedule({ conversation: 'father-inheritance', afterQuarters: 0, urgent: true });
        gameSink().schedule({ conversation: 'father-death', afterQuarters: 0, urgent: true });
        // The death is the CFO's, so it lands beside the father's, not behind.
        expect(threadFor('father')?.conversationId).toBe('father-inheritance');
        expect(threadFor('cfo')?.conversationId).toBe('father-death');
    });

    it('and playing one clears it, so it cannot be replayed for its effects', () => {
        useStoryStore.setState({ ...initialStoryState, flags: {} });
        useGameStore.setState({ age: 26, currentMonth: 1 } as never);
        gameSink().schedule({ conversation: 'father-death', afterQuarters: 0, urgent: true });
        expect(threadFor('cfo')?.conversationId).toBe('father-death');
        useMessageStore.getState().clearConversation('cfo');
        expect(threadFor('cfo')?.conversationId).toBeUndefined();
    });
});
