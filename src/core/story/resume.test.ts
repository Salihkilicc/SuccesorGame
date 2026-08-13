// src/core/story/resume.test.ts
//
// ============================================================================
//  LEAVING A CONVERSATION HALFWAY USED TO RE-RUN THE HALF YOU HAD PLAYED
// ============================================================================
//
//  The runner kept its position in component state. So the back arrow, the tab
//  bar, the home gesture or the phone locking all threw it away, and opening
//  the thread again started the scene at its first card.
//
//  That reads as a bug and is worse than one. Effects are applied AS answers
//  are picked - so every dial nudge, every transfer and every `schedule` in
//  the part already played happened a second time. A player who wandered out
//  of the inheritance scene to look at their cash and came back had paid for
//  it twice, and nothing on any screen said so.
//
//  Two decisions, which are the two the player offered ("ya kapansin ya da
//  kaydetsin"):
//
//    - A scene SAVES. Position and transcript live in the story store, keyed
//      by conversation id, written on every card.
//    - A finished scene CLOSES, and leaves the conversation behind as ordinary
//      messages, because this is a messages app and answering somebody does
//      not delete the exchange.
// ============================================================================

import { useStoryStore, initialStoryState } from '../store/useStoryStore';
import { useMessageStore, initialMessageState } from '../store/useMessageStore';

beforeEach(() => {
    useStoryStore.setState({ ...initialStoryState, sceneProgress: {} });
    useMessageStore.setState({ ...initialMessageState });
});

describe('where the player got to', () => {
    it('is remembered per scene, not per screen', () => {
        useStoryStore.getState().saveScene('father-inheritance', {
            nodeId: 'whoSigned',
            history: [{ from: 'them', text: 'I did. All four.' }],
        });
        const saved = useStoryStore.getState().sceneProgress['father-inheritance'];
        expect(saved.nodeId).toBe('whoSigned');
        expect(saved.history).toHaveLength(1);
    });

    it('survives a save being written and read back', () => {
        // The partialize list is the thing that actually decides this, and it
        // is one word long and easy to forget - which is exactly the kind of
        // omission that only shows up as "it forgot again" a week later.
        const { partialize } = (useStoryStore as any).persist.getOptions();
        useStoryStore.getState().saveScene('pear-offer', {
            nodeId: 'rest', history: [],
        });
        expect(partialize(useStoryStore.getState()).sceneProgress)
            .toHaveProperty('pear-offer');
    });

    it('and a finished scene is stored as finished rather than deleted', () => {
        // `nodeId: null` is not the same as no record. A letter stays in the
        // inbox after it is answered, and opening it should show what was
        // said - not an empty scene, and certainly not a replay.
        useStoryStore.getState().saveScene('pear-offer', {
            nodeId: null,
            history: [
                { from: 'them', text: 'We are prepared to make an offer.' },
                { from: 'player', text: 'They wrote this before he was buried.' },
            ],
        });
        const saved = useStoryStore.getState().sceneProgress['pear-offer'];
        expect(saved.nodeId).toBeNull();
        expect(saved.history).toHaveLength(2);
    });

    it('and a new company plays everything again from the top', () => {
        useStoryStore.getState().saveScene('father-q4', { nodeId: 'noted', history: [] });
        useStoryStore.getState().reset();
        expect(useStoryStore.getState().sceneProgress).toEqual({});
    });
});

describe('a scene that has been played out', () => {
    const lines = [
        { from: 'them' as const, text: 'It has been a year.' },
        { from: 'player' as const, text: 'Then what are you asking?' },
        { from: 'them' as const, text: 'Whether you are sleeping.' },
    ];

    it('stays in the thread as ordinary messages', () => {
        // It used to vanish: clearConversation freed the thread for the next
        // scene and the thread fell back to whatever plain messages it had,
        // so a player who finished a conversation with their father and
        // opened the thread again found no trace of it.
        useMessageStore.getState().appendTranscript('ops-lead', lines, 5);
        const t = useMessageStore.getState().threads.find(x => x.id === 'ops-lead')!;
        expect(t.messages.slice(-3).map(m => m.text)).toEqual(lines.map(l => l.text));
        expect(t.messages.slice(-3).map(m => m.from))
            .toEqual(['them', 'player', 'them']);
        // Dated with the month it was PLAYED, which is when it was said.
        expect(t.messages[t.messages.length - 1].atMonth).toBe(5);
    });

    it('with ids that do not collide with what was already there', () => {
        // They are React keys. Two messages sharing one is a rendering bug
        // that looks like a missing message.
        useMessageStore.getState().appendTranscript('ops-lead', lines, 5);
        useMessageStore.getState().appendTranscript('ops-lead', lines, 9);
        const t = useMessageStore.getState().threads.find(x => x.id === 'ops-lead')!;
        expect(new Set(t.messages.map(m => m.id)).size).toBe(t.messages.length);
    });

    it('and then the thread is free for the next one', () => {
        useMessageStore.setState({
            threads: [{
                id: 'father', name: 'Your Father', role: 'Chairman', initials: 'YF',
                unread: 0, messages: [], conversationId: 'father-q1',
            }],
        });
        useMessageStore.getState().appendTranscript('father', lines, 2);
        useMessageStore.getState().clearConversation('father');
        const t = useMessageStore.getState().threads[0];
        expect(t.conversationId).toBeUndefined();
        expect(t.messages).toHaveLength(3);
    });

    it('and its saved position goes, so the lines are not kept twice', () => {
        useStoryStore.getState().saveScene('father-q1', { nodeId: null, history: lines });
        useStoryStore.getState().clearScene('father-q1');
        expect(useStoryStore.getState().sceneProgress['father-q1']).toBeUndefined();
    });

    it('while clearing a scene nobody started changes nothing', () => {
        const before = useStoryStore.getState().sceneProgress;
        useStoryStore.getState().clearScene('never-played');
        expect(useStoryStore.getState().sceneProgress).toBe(before);
    });
});
