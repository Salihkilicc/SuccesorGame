// src/components/story/ConversationRunner.test.tsx
//
// ============================================================================
//  THE ASSERTION THE STORE TEST CANNOT MAKE
// ============================================================================
//
//  core/story/resume.test.ts proves the store can hold a position. It cannot
//  prove the runner reads it, and "correct code that nothing calls" is the
//  failure this project keeps hitting - so this mounts the real component,
//  answers a card, throws the screen away and mounts it again.
//
//  The thing being defended is not tidiness. Effects are applied AS answers
//  are picked, so a scene that restarts applies the part already played a
//  second time: a dial nudged twice, money moved twice, a scheduled letter
//  queued twice. The last test here is the one that matters.
// ============================================================================

import React from 'react';
import { Text } from 'react-native';
import renderer, { act, type ReactTestRenderer } from 'react-test-renderer';

import ConversationRunner from './ConversationRunner';
import { useStoryStore, initialStoryState } from '../../core/store/useStoryStore';
import type { Conversation } from '../../core/story/graph';

/**
 * A two-card scene with an effect on the first answer.
 *
 * Written here rather than borrowed from the game: a real scene would tie
 * this test to writing that is still being edited, and the shape is the
 * point, not the words.
 */
const SCENE: Conversation = {
    id: 'test-resume',
    channel: 'message',
    from: 'father',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'father',
            text: 'FIRST CARD',
            choices: [
                {
                    text: 'ANSWER ONE',
                    next: 'second',
                    // A REAL dial. The first draft used `trust`, which does
                    // not exist - so the nudge produced NaN, and NaN is equal
                    // to itself under toBe, so both assertions passed while
                    // measuring nothing at all.
                    effects: [{ kind: 'dial', dial: 'cfoTrust', delta: 5 }],
                },
            ],
        },
        {
            id: 'second',
            speaker: 'father',
            text: 'SECOND CARD',
            choices: [{ text: 'ANSWER TWO' }],
        },
    ],
};

beforeEach(() => {
    // Inside act: a renderer left mounted by the previous test is subscribed
    // to this store, so resetting it is a React update like any other.
    act(() => {
        useStoryStore.setState({ ...initialStoryState, sceneProgress: {} });
    });
});

// ---------------------------------------------------------------------------
//  react-test-renderer, not @testing-library, because that is what this
//  project has - see TutorialTarget.test.tsx. Two helpers cover everything
//  needed here: is this string on screen, and press the thing that says it.
// ---------------------------------------------------------------------------
const shown = (r: ReactTestRenderer): string[] =>
    r.root.findAllByType(Text)
        .map(n => (Array.isArray(n.props.children)
            ? n.props.children.join('')
            : n.props.children))
        .filter((c): c is string => typeof c === 'string');

const press = (r: ReactTestRenderer, label: string) => {
    const text = r.root.findAllByType(Text).find(n => n.props.children === label);
    if (!text) throw new Error(`nothing on screen says "${label}"`);
    // Walk up to whatever accepted the tap. The label is inside the
    // Pressable, not on it.
    let node: any = text.parent;
    while (node && typeof node.props?.onPress !== 'function') node = node.parent;
    if (!node) throw new Error(`"${label}" is not pressable`);
    act(() => { node.props.onPress(); });
};

const runner = (onFinished?: (h: any[]) => void): ReactTestRenderer => {
    let r!: ReactTestRenderer;
    act(() => {
        r = renderer.create(
            <ConversationRunner conversation={SCENE} variant="message" onFinished={onFinished} />,
        );
    });
    return r;
};

describe('a scene that is left halfway', () => {
    it('writes its position down as soon as it is opened', () => {
        runner();
        expect(useStoryStore.getState().sceneProgress['test-resume'].nodeId).toBe('open');
    });

    it('and moves it on with every answer', () => {
        const r = runner();
        press(r, 'ANSWER ONE');
        expect(useStoryStore.getState().sceneProgress['test-resume'].nodeId).toBe('second');
    });

    it('so a fresh screen opens on the card the player was looking at', () => {
        const first = runner();
        press(first, 'ANSWER ONE');
        act(() => { first.unmount(); });

        const again = shown(runner());
        expect(again).toContain('SECOND CARD');
        // And the answer that was already given is not on offer again.
        expect(again.filter(t => t === 'ANSWER ONE')).toHaveLength(1);
    });

    it('with everything that was said still above it', () => {
        const first = runner();
        press(first, 'ANSWER ONE');
        act(() => { first.unmount(); });

        // The opening card, the reply, and the card it led to - the whole
        // conversation, not just where it stopped. ANSWER ONE appears once,
        // as something the player SAID rather than as a button.
        expect(shown(runner())).toEqual(
            expect.arrayContaining(['FIRST CARD', 'ANSWER ONE', 'SECOND CARD']),
        );
    });

    it('AND THE PLAYER DOES NOT PAY FOR THE SAME ANSWER TWICE', () => {
        // ------------------------------------------------------------------
        //  THE ONLY TEST HERE THAT IS ABOUT HARM
        // ------------------------------------------------------------------
        //  Written first as "mount, unmount, mount, expect the dial not to
        //  have moved" - which passed with the fix taken back out, because
        //  remounting does not apply anything. Effects run when an answer is
        //  PRESSED, so the damage needed the player to walk the same card
        //  again, which is exactly what a restarted scene invites them to do.
        //
        //  So it presses. With the position saved, the answer is a line of
        //  transcript and there is nothing to press; without it, it is a
        //  button and the dial moves a second time.
        // ------------------------------------------------------------------
        const before = useStoryStore.getState().dials.cfoTrust;
        const first = runner();
        press(first, 'ANSWER ONE');
        const after = useStoryStore.getState().dials.cfoTrust;
        expect(after).toBe(before + 5);

        act(() => { first.unmount(); });
        const again = runner();
        try {
            press(again, 'ANSWER ONE');
        } catch {
            // Not offered any more. That IS the fix.
        }
        expect(useStoryStore.getState().dials.cfoTrust).toBe(after);
    });
});

describe('a scene that is played to the end', () => {
    it('hands the whole transcript to the screen', () => {
        // The message thread turns this into ordinary messages, so it has to
        // be everything that was said and in order.
        const said: any[] = [];
        const r = runner(h => said.push(...h));
        press(r, 'ANSWER ONE');
        press(r, 'ANSWER TWO');

        expect(said.map(s => s.text)).toEqual([
            'FIRST CARD', 'ANSWER ONE', 'SECOND CARD', 'ANSWER TWO',
        ]);
        expect(said.map(s => s.from)).toEqual(['them', 'player', 'them', 'player']);
    });

    it('and is recorded as finished rather than left mid-scene', () => {
        const r = runner();
        press(r, 'ANSWER ONE');
        press(r, 'ANSWER TWO');
        expect(useStoryStore.getState().sceneProgress['test-resume'].nodeId).toBeNull();
    });

    it('SAVES THE LAST ANSWER EVEN THOUGH THE SCREEN LEAVES IMMEDIATELY', () => {
        // ------------------------------------------------------------------
        //  THE TEST BELOW PASSED WHILE THIS WAS BROKEN
        // ------------------------------------------------------------------
        //  It unmounts on its own line, one commit after the answer, which
        //  gives a save-on-effect all the time in the world. The screen does
        //  not: `onFinished` navigates away inside the same event handler, so
        //  React batches the state change and the unmount together and the
        //  effect for the final card never runs.
        //
        //  So this unmounts INSIDE onFinished, which is what the thread and
        //  the mail screen actually do. Told Arthur "I will write it myself",
        //  left, came back, and both answers were on offer again - and the
        //  dial had already moved, so picking the other one moved it twice.
        // ------------------------------------------------------------------
        const before = useStoryStore.getState().dials.cfoTrust;
        let leaving!: ReactTestRenderer;
        leaving = runner(() => { leaving.unmount(); });
        press(leaving, 'ANSWER ONE');
        const after = useStoryStore.getState().dials.cfoTrust;
        press(leaving, 'ANSWER TWO');

        expect(useStoryStore.getState().sceneProgress['test-resume'].nodeId).toBeNull();

        // And coming back cannot move the dial a second time.
        const again = runner();
        try { press(again, 'ANSWER TWO'); } catch { /* not on offer */ }
        try { press(again, 'ANSWER ONE'); } catch { /* nor this */ }
        expect(useStoryStore.getState().dials.cfoTrust).toBe(after);
        expect(after).toBe(before + 5);
    });

    it('so re-opening it shows what was said and offers only a way out', () => {
        // This is the mail case: a letter stays in the inbox after it has
        // been answered. Opening it must not replay it.
        const r = runner();
        press(r, 'ANSWER ONE');
        press(r, 'ANSWER TWO');
        act(() => { r.unmount(); });

        const again = runner();
        expect(shown(again)).toContain('SECOND CARD');
        expect(shown(again)).toContain('Close');
        // The only thing that can be pressed is the way out.
        expect(() => press(again, 'ANSWER TWO')).toThrow(/not pressable|nothing on screen/);
    });
});
