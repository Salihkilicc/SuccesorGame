// src/features/os/mailFaces.test.tsx
//
// ============================================================================
//  THE INBOX, WHERE THE SENDER LINE IS NOT A NAME
// ============================================================================
//
//  Mail was the hardest of the six surfaces and for an interesting reason:
//  its rows carried only `fromName`, and that is a LABEL, not a name.
//  deliver.ts builds it as "Nathan Vogel, CEO, Pear" on purpose, because a
//  bare name at the top of an inbox is unrecognisable.
//
//  Measured before any of this was written: looking up every member of the
//  cast BY NAME found zero portraits, because the files are keyed on cast ids
//  - cfo, coo - and no name ever matched one. So the id had to be carried,
//  and both senders already had it and both threw it away.
//
//  The other half is that most letters are not from a person at all.
//  Facilities, a bank and a contacts service each send one, and they keep the
//  tinted circle. That is the designed answer, not a gap.
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { Image, Text } from 'react-native';
import MailScreen from './screens/MailScreen';
import { useMailStore, type Mail } from '../../core/store/useMailStore';
import { PORTRAITS } from '../../core/portraits/registry';
import { CAST } from '../../data/story/cast';
import { portraitForPerson } from '../../core/portraits';

const nameOf = (src: unknown): string =>
    Object.keys(PORTRAITS).find(k => PORTRAITS[k] === src) ?? String(src);

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
    useRoute: () => ({ name: 'Mail', key: 'mail', params: {} }),
}));
jest.mock('react-native-safe-area-context', () => ({
    ...jest.requireActual('react-native-safe-area-context'),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const letter = (over: Partial<Mail> & { id: string }): Mail => ({
    fromName: 'Facilities',
    fromEmail: 'x@hale.co',
    subject: 'A subject',
    body: 'A body',
    atMonth: 3,
    isRead: true,
    category: 'Primary',
    ...over,
} as Mail);

const inbox = (mails: Mail[]) => {
    useMailStore.setState({ inbox: mails } as never);
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => { tree = renderer.create(<MailScreen />); });
    const faces = tree.root.findAllByType(Image).map(n => nameOf(n.props.source));
    const texts = tree.root.findAllByType(Text)
        .map(n => (Array.isArray(n.props.children)
            ? n.props.children.map(String).join('') : String(n.props.children)));
    renderer.act(() => { tree.unmount(); });
    return { faces, texts };
};

describe('the name was never going to be enough', () => {
    it('not one member of the cast is findable by their name', () => {
        // The measurement this whole change rests on. If it ever stops being
        // true, fromId could be dropped - and if it silently became false the
        // other way, the ids would be doing nothing.
        const byName = Object.values(CAST as Record<string, { name: string }>)
            .filter(c => portraitForPerson(null, c.name) !== null);
        expect(byName).toEqual([]);
    });

    it('but they are all findable by their id', () => {
        const cast = CAST as Record<string, { name: string }>;
        const faceless = ['unknown', 'vulture', 'regulator', 'fbi', 'heir'];
        const missing = Object.keys(cast)
            .filter(id => !faceless.includes(id))
            .filter(id => portraitForPerson(id, cast[id].name) === null);
        expect(missing).toEqual([]);
    });
});

describe('a letter from a person shows that person', () => {
    it('the chief financial officer, under the label he actually signs with', () => {
        const { faces } = inbox([letter({
            id: 'm1', fromId: 'cfo', fromName: 'Arthur Vance, Chief Financial Officer',
        })]);
        expect(faces).toEqual(['cfo']);
    });

    it('and the label being a mouthful changes nothing', () => {
        // "Nathan Vogel, CEO, Pear" is the shape deliver.ts produces. The id
        // is what is read, so the label can say whatever it needs to.
        const a = inbox([letter({ id: 'm2', fromId: 'coo', fromName: 'Dana Whitfield' })]);
        const b = inbox([letter({
            id: 'm3', fromId: 'coo', fromName: 'Dana Whitfield, Chief Operating Officer, Hale',
        })]);
        expect(a.faces).toEqual(['coo']);
        expect(b.faces).toEqual(a.faces);
    });
});

describe('a letter from an organisation keeps its tinted circle', () => {
    it('Facilities, a bank and a contacts service have no faces', () => {
        const { faces, texts } = inbox([
            letter({ id: 'o1', fromName: 'Facilities' }),
            letter({ id: 'o2', fromName: 'Ashgrove Partners' }),
            letter({ id: 'o3', fromName: 'Rolodex' }),
        ]);
        expect(faces).toEqual([]);
        expect(texts).toContain('F');
        expect(texts).toContain('AP');
    });

    it('and an id that names nobody does not invent one', () => {
        expect(inbox([letter({ id: 'o4', fromId: 'nobody-at-all' })]).faces).toEqual([]);
    });

    it('and the faceless four stay faceless even carrying an id', () => {
        // A regulator and a federal agent are frightening because they are a
        // name without a person.
        for (const id of ['regulator', 'fbi', 'vulture', 'unknown']) {
            expect(inbox([letter({ id: `f-${id}`, fromId: id })]).faces).toEqual([]);
        }
    });

    it('and a mixed inbox puts the one face on the one row', () => {
        const { faces } = inbox([
            letter({ id: 'x1', fromName: 'Facilities' }),
            letter({ id: 'x2', fromId: 'cfo', fromName: 'Arthur Vance' }),
            letter({ id: 'x3', fromName: 'Rolodex' }),
        ]);
        expect(faces).toEqual(['cfo']);
    });

    it('and an empty inbox does not throw', () => {
        expect(() => inbox([])).not.toThrow();
    });
});
