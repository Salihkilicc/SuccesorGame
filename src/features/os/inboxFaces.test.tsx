// src/features/os/inboxFaces.test.tsx
//
// ============================================================================
//  WHO IS WRITING TO YOU, AND WHETHER YOU CAN SEE THEM
// ============================================================================
//
//  The inbox is where the named cast live. Unlike the poker table or the
//  family list, nothing here carries a gender or an age, so there is no pool
//  face to lend: a thread either belongs to somebody who was drawn, or it
//  keeps its letters. Both halves are asserted, because "some rows have no
//  face" is the designed behaviour and not a shortfall.
//
//  It is also where a duplicate was found. The seed thread carried the chief
//  operating officer under the id 'ops-lead' while the story engine writes to
//  her as 'coo', so the same woman appeared in the inbox twice. That was
//  there before the portraits; it only became visible when one thread could
//  show her face and the other could not.
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { Image, Text } from 'react-native';
import MessagesScreen from './screens/MessagesScreen';
import { useMessageStore } from '../../core/store/useMessageStore';
import { PORTRAITS } from '../../core/portraits/registry';

const nameOf = (src: unknown): string =>
    Object.keys(PORTRAITS).find(k => PORTRAITS[k] === src) ?? String(src);

// Only useNavigation is replaced. Mocking the whole module removed
// createNavigationContainerRef, which navigationRef.ts calls at import time
// through the nav bar, and the suite failed to load at all.
// Only the two hooks are replaced. Mocking the whole module removed
// createNavigationContainerRef, which navigationRef.ts calls at import time
// through the nav bar, and the suite failed to load at all. useRoute is here
// because the screen header colours its rule by route name and throws
// outside a navigator; neither hook has anything to do with what is being
// measured.
jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
    useRoute: () => ({ name: 'Messages', key: 'messages', params: {} }),
}));

// Same reasoning: the header asks for the notch inset and there is no
// provider outside the app shell.
jest.mock('react-native-safe-area-context', () => ({
    ...jest.requireActual('react-native-safe-area-context'),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const inbox = () => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => { tree = renderer.create(<MessagesScreen />); });
    const faces = tree.root.findAllByType(Image).map(n => nameOf(n.props.source));
    const texts = tree.root.findAllByType(Text)
        .map(n => (Array.isArray(n.props.children)
            ? n.props.children.map(String).join('') : String(n.props.children)));
    renderer.act(() => { tree.unmount(); });
    return { faces, texts };
};

describe('the seed thread is the chief operating officer herself', () => {
    beforeEach(() => { useMessageStore.getState().reset(); });

    it('and she appears once, not twice', () => {
        // Measured before the fix: seeding and then sending one message as
        // the COO produced 'coo/Dana Whitfield, ops-lead/Dana Whitfield'.
        useMessageStore.getState().sendFromCharacter(
            { id: 'coo', name: 'Dana Whitfield', role: 'Chief Operating Officer' },
            'Nothing has changed on the floor.', 4,
        );
        const threads = useMessageStore.getState().threads;
        expect(threads.filter(t => t.name === 'Dana Whitfield')).toHaveLength(1);
        expect(threads.some(t => t.id === 'ops-lead')).toBe(false);
    });

    it('so the inbox can show her portrait', () => {
        expect(inbox().faces).toEqual(['coo']);
    });
});

describe('the named cast are recognised by their thread id', () => {
    beforeEach(() => { useMessageStore.getState().reset(); });

    const write = (id: string, name: string, role = 'Someone') =>
        useMessageStore.getState().sendFromCharacter({ id, name, role }, 'A line.', 3);

    it('the ones with portraits get them', () => {
        write('cfo', 'Arthur Vance', 'Chief Financial Officer');
        write('brother', 'Your Brother');
        const { faces } = inbox();
        expect(faces).toContain('cfo');
        expect(faces).toContain('brother');
    });

    it('and the ones without keep their letters', () => {
        // A courtship candidate, a partner and a child all reach the inbox
        // under ids nothing was drawn for, and the thread carries no gender
        // or age to draw a pool face with. Letters are the honest answer.
        useMessageStore.setState({ threads: [] } as never);
        write('courtship-nine', 'Mira Sen');
        write('partner-thread', 'Alex Vance');
        const { faces, texts } = inbox();
        expect(faces).toEqual([]);
        expect(texts).toContain('MS');
        expect(texts).toContain('AV');
    });

    it('and a face never lands on the wrong row', () => {
        useMessageStore.setState({ threads: [] } as never);
        write('cfo', 'Arthur Vance');
        write('courtship-nine', 'Mira Sen');
        // One portrait between two rows: if the lookup were falling through
        // to a pool draw, both would have one.
        expect(inbox().faces).toEqual(['cfo']);
    });

    it('and an empty inbox does not throw', () => {
        useMessageStore.setState({ threads: [] } as never);
        expect(() => inbox()).not.toThrow();
    });
});
