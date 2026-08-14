// src/core/story/quiet.test.ts
//
// ============================================================================
//  SOME QUARTERS NOBODY WRITES
// ============================================================================
//
//  Two complaints arrived as one: there are too many messages, and are they
//  random, because if they are not then every playthrough is the same game.
//
//  Both were true and they had the same cause. The per-quarter allowance
//  bounded the VOLUME at two and did nothing about the RHYTHM, so two optional
//  conversations arrived every quarter for ever - and a beat queues the first
//  quarter its `when` holds, so with no die anywhere the second run delivered
//  the same scenes in the same order as the first.
//
//  Two changes, and the interesting part of both is what they leave alone.
// ============================================================================

import { runInbox, runStoryBeats } from './deliver';
import { QUIET_QUARTER_CHANCE, DELIVERIES_PER_QUARTER } from './inbox';
import { useStoryStore, initialStoryState } from '../store/useStoryStore';
import { useMailStore, initialMailState } from '../store/useMailStore';
import { useMessageStore, initialMessageState } from '../store/useMessageStore';
import { useGameStore } from '../store/useGameStore';
import { STORY_BEATS, CONVERSATIONS } from '../../data/story';

/**
 * Quarter eight, which is when the condolence wave is allowed to exist.
 *
 * currentQuarter counts years from `age`: 26 and month ten is Q8. The inbox is
 * emptied rather than reset, because `initialMailState` ships with seeded
 * letters and a test that counts them from zero would be counting the seed.
 */
const quarterEight = () => {
    useStoryStore.setState({ ...initialStoryState, flags: { fatherDead: true } });
    useMailStore.setState({ ...initialMailState, inbox: [] });
    useMessageStore.setState({ ...initialMessageState, threads: [] });
    useGameStore.setState({ age: 26, currentMonth: 10 } as never);
};

/** A message-channel scene whose gate is open in the world above. */
const MESSAGE_BEAT = 'friend-asks';
/** A letter, for the half of this that must NOT be affected. */
const MAIL_BEAT = 'pear-offer';

const queue = (id: string, urgent = false) =>
    useStoryStore.getState().schedule({
        conversationId: id, dueQuarter: 1, queuedAtQuarter: 1, urgent,
    });

const threads = () => useMessageStore.getState().threads.length;
const letters = () => useMailStore.getState().inbox.length;

beforeEach(quarterEight);

describe('a quiet quarter', () => {
    it('holds an optional message back', () => {
        queue(MESSAGE_BEAT);
        runInbox(true);
        expect(threads()).toBe(0);
    });

    it('and does not lose it, which is the whole difference', () => {
        // Held, not dropped. It keeps its due quarter and arrives next time,
        // so the cost of a tails is one quarter of waiting rather than a
        // scene the player never sees.
        queue(MESSAGE_BEAT);
        runInbox(true);
        expect(useStoryStore.getState().pending
            .some(p => p.conversationId === MESSAGE_BEAT)).toBe(true);
        runInbox(false);
        expect(threads()).toBe(1);
    });

    it('while a noisy one delivers it', () => {
        queue(MESSAGE_BEAT);
        runInbox(false);
        expect(threads()).toBe(1);
    });
});

describe('what a quiet quarter must not touch', () => {
    it('the post still arrives, because letters are the business', () => {
        // A negotiation reply or a sponsorship offer with a quarter to run on
        // it is a mechanic. A letter that comes late because a coin came up
        // tails is a mechanic being decided by weather.
        queue(MAIL_BEAT);
        runInbox(true);
        expect(letters()).toBe(1);
    });

    it('and the spine arrives, because the father does not die on a coin flip', () => {
        queue(MESSAGE_BEAT, true);
        runInbox(true);
        expect(threads()).toBe(1);
    });
});

describe('the odds', () => {
    it('are twenty-five percent, so the phone is worth checking and not a chore', () => {
        expect(QUIET_QUARTER_CHANCE).toBe(0.75);
    });

    it('and the allowance still bounds the noisy ones', () => {
        expect(DELIVERIES_PER_QUARTER).toBe(1);
    });
});

// ============================================================================
//  AND WHICH BEATS ARE ON A CALENDAR AT ALL
// ============================================================================
describe('the spine has no dice in it', () => {
    const beatFor = (id: string) => STORY_BEATS.find(b => b.conversation === id);
    const certain = ['father-q4', 'father-death', 'pear-offer',
        'condolence-friend', 'condolence-brother', 'condolence-board'];

    it.each(certain)('%s is certain', (id) => {
        expect(beatFor(id)!.chance).toBeUndefined();
    });

    it('while the optional arcs are not', () => {
        for (const id of ['cfo-board-room', 'cfo-braga-name', 'cfo-resignation',
            'friend-asks', 'friend-grows']) {
            expect(beatFor(id)!.chance).toBe(0.25);
        }
    });

    it('and nothing in the first year was made a maybe', () => {
        // The act is a script, not a cause-and-effect chain, and it is the one
        // part of this game where the same thing happening every run is the
        // point.
        const { OPENING_ACT } = require('../../data/story/openingAct');
        for (const beat of STORY_BEATS) {
            if (OPENING_ACT.includes(beat.conversation)) {
                expect(beat.chance).toBeUndefined();
            }
        }
    });
});

describe('a beat that loses its roll', () => {
    it('is not marked seen, so it comes back next quarter', () => {
        // The failure this guards is the expensive one: a scene rolled for,
        // missed, recorded as delivered, and gone from the game for ever.
        //
        // Only the OPTIONAL beats are asserted on. The certain ones queue in
        // the same pass and are supposed to - a first draft expected
        // `seenScenes` to be untouched entirely and was measuring the spine.
        const optional = STORY_BEATS.filter(b => b.chance !== undefined)
            .map(b => b.conversation);
        const spy = jest.spyOn(Math, 'random').mockReturnValue(0.99);
        runStoryBeats();
        spy.mockRestore();
        const seen = useStoryStore.getState().seenScenes;
        expect(optional.filter(id => seen.includes(id))).toEqual([]);
    });

    it('and every id named in a beat is a real conversation', () => {
        // Cheap, and it is what keeps the lists above from rotting silently.
        const ids = new Set(CONVERSATIONS.map(c => c.id));
        for (const beat of STORY_BEATS) expect(ids.has(beat.conversation)).toBe(true);
    });
});
