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
    // ------------------------------------------------------------------
    //  QUARTER SEVEN, BECAUSE THAT IS WHEN PEAR IS ALLOWED TO EXIST
    // ------------------------------------------------------------------
    //  These tests used pear-offer as a convenient stand-in for "any
    //  conversation" while it had no gate of its own. It has one now - the
    //  backstop below - so the world they run in has to be a world the
    //  letter could arrive in, or they are testing the gate rather than the
    //  scheduler.
    //
    //  It was six. The whole act moved a quarter later when the death did -
    //  the fifth quarter was still draining the father's own queue, so the
    //  morale lesson and the phone call were arriving together. See the note
    //  in data/story/fatherDeath.ts.
    //
    //  currentQuarter counts years from `age`: 26 and month seven is Q7.
    // ------------------------------------------------------------------
    useGameStore.setState({ age: 26, currentMonth: 7 } as never);
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

        useGameStore.setState({ currentMonth: 10 } as never);
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

    it('and the condolences are on a quarter, not on Pear being answered', () => {
        // They were gated on `refusedPear`, and the reasoning read well:
        // four people reacting to a decision should not arrive before it.
        //
        // They are not reacting to the decision. They are reacting to a
        // death, which happened whatever the player did about the letter -
        // and the flag made four written scenes hostage to one letter that
        // had four ways to go missing.
        const base = ['condolence-friend', 'condolence-cfo-mail',
            'condolence-brother', 'condolence-board'];
        for (const id of base) {
            const c = CONVERSATIONS.find(x => x.id === id)!;
            expect(JSON.stringify(c.when ?? [])).toContain('quarterAtLeast');
            expect(JSON.stringify(c.when ?? [])).not.toContain('refusedPear');
        }
    });

    it('while the public variants keep their flag, because that IS a choice', () => {
        // Refusing him in public is a decision, and what people say about it
        // is a consequence. That is what a flag is for.
        for (const id of ['condolence-friend-public', 'condolence-board-public']) {
            const c = CONVERSATIONS.find(x => x.id === id)!;
            expect(JSON.stringify(c.when ?? [])).toContain('refusedPearPublicly');
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
describe("the letter the father's death does NOT send", () => {
    it('because a fixed beat should not depend on a scene being played', () => {
        // It was scheduled from both answers of the death, and that made the
        // second act depend on this conversation being reached, delivered,
        // opened and answered. Four ways not to start, all of which happened.
        const death = CONVERSATIONS.find(c => c.id === 'father-death')!;
        const scheduled = death.nodes
            .flatMap(n => n.choices?.flatMap(c => c.effects ?? []) ?? [])
            .filter((e: any) => e.kind === 'schedule');
        expect(scheduled).toEqual([]);
    });

    it('and the death still does the one thing only it can do', () => {
        // Raise the flag. Everything downstream is on a quarter now, but the
        // father being dead is a fact this scene establishes and nothing
        // else does.
        const death = CONVERSATIONS.find(c => c.id === 'father-death')!;
        const last = death.nodes.find(n => n.id === 'tellThem')!;
        for (const choice of last.choices!) {
            expect((choice.effects ?? []).some((e: any) =>
                e.kind === 'flag' && e.flag === 'fatherDead')).toBe(true);
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
        gameSink().schedule({ conversation: 'father-inheritance', afterQuarters: 0, urgent: true });
        gameSink().schedule({ conversation: 'father-death', afterQuarters: 0, urgent: true });
        // The death is the CFO's, so it lands beside the father's, not behind.
        expect(threadFor('father')?.conversationId).toBe('father-inheritance');
        expect(threadFor('cfo')?.conversationId).toBe('father-death');
    });

    it('and playing one clears it, so it cannot be replayed for its effects', () => {
        useStoryStore.setState({ ...initialStoryState, flags: {} });
        gameSink().schedule({ conversation: 'father-death', afterQuarters: 0, urgent: true });
        expect(threadFor('cfo')?.conversationId).toBe('father-death');
        useMessageStore.getState().clearConversation('cfo');
        expect(threadFor('cfo')?.conversationId).toBeUndefined();
    });
});

// ============================================================================
//  THE LETTER HAS TWO WAYS TO ARRIVE, AND ONE OF THEM IS A BACKSTOP
// ============================================================================
//  It was scheduled by an effect inside the father's death scene and by
//  nothing else. One effect, firing once, with the entire second act behind
//  it - the condolence wave cannot start until Pear has been answered - so a
//  schedule that goes missing does not delay the story, it ends it.
//
//  And it can go missing: a save carried across a build where the scheduler
//  changed, a queue entry dropped, a scene played in a version that wrote the
//  schedule differently. The effect has already run, it will never run again,
//  and nothing anywhere notices.
// ============================================================================
describe('Pear cannot be lost', () => {
    it('is a story beat as well as a scheduled effect', () => {
        const { STORY_BEATS } = require('../../data/story');
        expect(STORY_BEATS.map((b: any) => b.conversation)).toContain('pear-offer');
    });

    it('whose only condition is the quarter', () => {
        const pear = CONVERSATIONS.find(c => c.id === 'pear-offer')!;
        const w = (q: number) => ({
            dials: {} as never, flags: { fatherDead: true }, quarter: q,
            capital: 1, cash: 1, morale: 70, marketShare: 1, staffing: 100,
            researchers: 0, subsidiaries: [], casinoStreak: 0,
            quartersWithoutSponsor: 0,
        } as never);
        const { testAll } = require('./conditions');
        expect(testAll(pear.when, w(6))).toBe(false);
        expect(testAll(pear.when, w(7))).toBe(true);
        // And nothing else. A quarter number cannot go missing; a flag
        // raised by a scene in another app can, and did, four times.
        expect(pear.when).toHaveLength(1);
    });

    it('so it arrives even for a player who never opened the death', () => {
        const pear = CONVERSATIONS.find(c => c.id === 'pear-offer')!;
        const { testAll } = require('./conditions');
        const w = (flags: Record<string, true>) => ({
            dials: {} as never, flags, quarter: 7,
            capital: 1, cash: 1, morale: 70, marketShare: 1, staffing: 100,
            researchers: 0, subsidiaries: [], casinoStreak: 0,
            quartersWithoutSponsor: 0,
        } as never);
        expect(testAll(pear.when, w({}))).toBe(true);
    });
});
