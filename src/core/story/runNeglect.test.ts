// src/core/story/runNeglect.test.ts
//
// ============================================================================
//  AND THE HALF THAT TOUCHES THE GAME
// ============================================================================
//  neglect.test.ts proves the rule. This mounts it against the real stores,
//  because the rule being right has never been the thing that goes wrong here -
//  what goes wrong is a correct decision that nothing acts on.
// ============================================================================

import { runNeglect } from './runNeglect';
import { useMessageStore, initialMessageState } from '../store/useMessageStore';
import { useStoryStore, initialStoryState } from '../store/useStoryStore';
import { useMailStore } from '../store/useMailStore';
import { useGameStore } from '../store/useGameStore';
import { NEGLECT_STEP } from './neglect';

const ignoredCfo = () => {
    useStoryStore.setState({ ...initialStoryState });
    useMessageStore.setState({
        ...initialMessageState,
        threads: [{
            id: 'cfo', name: 'Arthur Vance', role: 'Chief Financial Officer',
            initials: 'AV', unread: 1,
            messages: [{ id: 'a', from: 'them', text: 'The item.', atMonth: 1 }],
        }],
    });
    useGameStore.setState({ currentMonth: 6 } as never);
};

describe('when the quarter turns on an unanswered message', () => {
    beforeEach(ignoredCfo);

    it('they write again', () => {
        runNeglect();
        const t = useMessageStore.getState().threads[0];
        expect(t.messages).toHaveLength(2);
        expect(t.messages[1].from).toBe('them');
    });

    it('and it is their own words, not a notice', () => {
        runNeglect();
        expect(useMessageStore.getState().threads[0].messages[1].text)
            .toContain('I keep a note of what I have raised');
    });

    it('and the relationship moves one tick', () => {
        const before = useStoryStore.getState().dials.cfoTrust;
        runNeglect();
        expect(useStoryStore.getState().dials.cfoTrust).toBe(before - NEGLECT_STEP);
    });

    it('and it does not happen twice in one quarter', () => {
        runNeglect();
        const after = useStoryStore.getState().dials.cfoTrust;
        expect(runNeglect()).toEqual([]);
        expect(useStoryStore.getState().dials.cfoTrust).toBe(after);
    });

    it('while opening the thread ends it', () => {
        runNeglect();
        useMessageStore.getState().markRead('cfo');
        expect(useMessageStore.getState().threads[0].chasedAtMonth).toBeUndefined();
        useGameStore.setState({ currentMonth: 24 } as never);
        expect(runNeglect()).toEqual([]);
    });

    it('and a stranger with nothing written for them is left alone', () => {
        // A mechanic firing with no writing behind it is a notification, and
        // a notification is the thing this design exists instead of.
        useMessageStore.setState({
            threads: [{
                id: 'ops-lead', name: 'Dana Whitfield', role: 'Head of Production',
                initials: 'DW', unread: 1,
                messages: [{ id: 'a', from: 'them', text: 'x', atMonth: 1 }],
            }],
        });
        expect(runNeglect()).toEqual([]);
    });
});

describe('and it costs once, which is what a person does', () => {
    it('they say it, and then they let it go', () => {
        // ------------------------------------------------------------------
        //  THIS ASSERTED FIVE COMPLAINTS AND THE DESIGN WAS THE BUG
        // ------------------------------------------------------------------
        //  It read "once a quarter, for as long as the player keeps not
        //  answering", and the note under it called that cumulative damage
        //  with a person as the source. The arithmetic worked exactly as
        //  written: five quarters of silence, five steps, five messages.
        //
        //  Reported from the sofa as "hala ardarda ilgili yazismamiz hakkinda
        //  maili geliyor, bir kere gelsin bitsin". Which is the same mechanic
        //  described by somebody living with it: one letter left unopened
        //  produced a complaint every three months for the rest of the run,
        //  and the complaint is the same complaint.
        //
        //  Cumulative damage from a repeated source reads as a system with a
        //  grudge rather than as a colleague. So: once per thing ignored. The
        //  step is unchanged and it lands once; a person who is ignored again
        //  years later, on something else, may still say so - the record is
        //  keyed on the conversation. See useStoryStore.chased.
        // ------------------------------------------------------------------
        ignoredCfo();
        const start = useStoryStore.getState().dials.cfoTrust;
        for (let m = 6; m <= 18; m += 3) {
            useGameStore.setState({ currentMonth: m } as never);
            runNeglect();
        }
        expect(useStoryStore.getState().dials.cfoTrust).toBe(start - NEGLECT_STEP);
        // The thread they wrote in, plus one complaint. Not six.
        expect(useMessageStore.getState().threads[0].messages.length).toBe(2);
    });

    it('and the record says what it was about, not merely who', () => {
        // Keyed on the conversation, so being ignored on a DIFFERENT letter
        // years later is a different silence and may still be said out loud.
        ignoredCfo();
        useGameStore.setState({ currentMonth: 6 } as never);
        expect(runNeglect()).toEqual(['cfo']);
        const marks = useStoryStore.getState().chased;
        expect(marks).toHaveLength(1);
        expect(marks[0]).toContain('cfo');
    });
});

// ============================================================================
//  READING IS NOT ANSWERING
// ============================================================================
//
//  The exploit this closes, reported as "secim yapmadan ciksam para cezasi
//  yemiyorum, veya girmesem de yemiyorum": every branch of a crisis takes
//  something and backing out of one took nothing, so the optimal way to play
//  the whole conversation system was to open each letter, read both costs and
//  press back. `unread` alone could not see it, because opening the thread is
//  what marks it read.
// ============================================================================
describe('a question left hanging', () => {
    const readButUnanswered = () => {
        useStoryStore.setState({ ...initialStoryState });
        useMessageStore.setState({
            ...initialMessageState,
            threads: [{
                id: 'cfo', name: 'Arthur Vance', role: 'Chief Financial Officer',
                initials: 'AV',
                // READ. This is the whole point of the case.
                unread: 0,
                conversationId: 'event-cash-warning',
                messages: [{ id: 'a', from: 'them', text: 'The item.', atMonth: 1 }],
            }],
        });
        useMailStore.getState().reset();
        useMailStore.setState({ inbox: [] } as never);
        useGameStore.setState({ currentMonth: 6 } as never);
    };

    beforeEach(readButUnanswered);

    it('is still being ignored, even though the thread was opened', () => {
        expect(runNeglect()).toEqual(['cfo']);
    });

    it('and answering it is what stops them', () => {
        // `finish()` records a null node and nothing else does, which makes it
        // the one reliable "the player got to the end of it" mark in the game.
        useStoryStore.getState().saveScene('event-cash-warning', {
            nodeId: null, history: [],
        });
        expect(runNeglect()).toEqual([]);
    });

    it('while a thread that asks nothing is left alone when it is read', () => {
        // The original rule, unchanged: a plain unread message still counts
        // and a plain read one still does not.
        useMessageStore.setState(s => ({
            threads: s.threads.map(t => ({ ...t, conversationId: undefined })),
        }));
        expect(runNeglect()).toEqual([]);
    });
});

// ============================================================================
//  AND THIRTY THREE OF THEM ARRIVE BY POST
// ============================================================================
//
//  This swept `useMessageStore` only. Every letter from Pear, the fund, the
//  Bureau and the regulator is mail, so the people whose silence carries the
//  most were the only ones outside the sweep entirely.
// ============================================================================
describe('the inbox counts too', () => {
    const unansweredLetterFromPear = () => {
        useStoryStore.setState({ ...initialStoryState });
        useMessageStore.setState({ ...initialMessageState, threads: [] });
        useMailStore.setState({
            inbox: [{
                id: 'm1',
                fromName: 'Nathan Vogel',
                fromEmail: 'office.vogel@pear.com',
                subject: 'A proposal',
                body: '...',
                atMonth: 1,
                isRead: true,
                category: 'Primary',
                conversationId: 'event-pear-patent',
            }],
            _hasHydrated: true,
        } as never);
        useGameStore.setState({ currentMonth: 6 } as never);
    };

    beforeEach(unansweredLetterFromPear);

    it('so a letter nobody answered is noticed', () => {
        expect(runNeglect()).toEqual(['pear']);
    });

    it('and he replies by POST, because he does not have your number', () => {
        // His cast entry: "he does not have your number and has never wanted
        // it. If he ever texts you, something has broken in him, which is a
        // scene worth saving for." A chase arriving as a text would spend it.
        runNeglect();
        expect(useMessageStore.getState().threads).toHaveLength(0);
        const inbox = useMailStore.getState().inbox;
        expect(inbox).toHaveLength(2);
        expect(inbox.some(m => m.subject.includes('4471-B'))).toBe(true);
    });

    it('and being ignored makes him worse, not sadder', () => {
        // The one dial in the game where the number rising is the
        // relationship falling.
        const before = useStoryStore.getState().dials.pearHostility;
        runNeglect();
        expect(useStoryStore.getState().dials.pearHostility).toBe(before + NEGLECT_STEP);
    });

    it('and he does not write every quarter forever', () => {
        // His own chase letter restarts the clock. Message threads get that
        // for free because the chase lands in the thread; mail needed the
        // address lookup to find it.
        runNeglect();
        expect(runNeglect()).toEqual([]);
    });

    it('while an answered letter is not chased at all', () => {
        useStoryStore.getState().saveScene('event-pear-patent', {
            nodeId: null, history: [],
        });
        expect(runNeglect()).toEqual([]);
    });
});
