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

describe('and it keeps costing, which is the cumulative part', () => {
    it('once a quarter, for as long as the player keeps not answering', () => {
        ignoredCfo();
        const start = useStoryStore.getState().dials.cfoTrust;
        for (let m = 6; m <= 18; m += 3) {
            useGameStore.setState({ currentMonth: m } as never);
            runNeglect();
        }
        // Five quarters of silence, five steps, and every one of them arrived
        // as a message the player could have opened.
        expect(useStoryStore.getState().dials.cfoTrust).toBe(start - NEGLECT_STEP * 5);
        expect(useMessageStore.getState().threads[0].messages.length).toBe(6);
    });
});
