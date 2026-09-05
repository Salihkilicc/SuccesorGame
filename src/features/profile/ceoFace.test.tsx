// src/features/profile/ceoFace.test.tsx
//
// ============================================================================
//  THE FACE AT THE TOP OF THE PROFILE
// ============================================================================
//
//  Two portraits were drawn OF THE PLAYER - player_male and player_female -
//  and they are the only two in the folder that are not either a named
//  character or an anonymous pool face. If the header does not use them,
//  nothing does.
//
//  The harder half is the second generation. The chair passes to a child, and
//  that child already has a face in the family list. Reusing the founder's
//  photograph for them would say the two are the same person, which is the
//  one thing the picture must not say.
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { Image, Text } from 'react-native';
import { CeoStatusHeader } from './components/CeoStatusHeader';
import { PORTRAITS } from '../../core/portraits/registry';
import { useIdentityStore, initialIdentityState } from '../../core/store/useIdentityStore';

const nameOf = (src: unknown): string =>
    Object.keys(PORTRAITS).find(k => PORTRAITS[k] === src) ?? String(src);

const show = (props: Partial<React.ComponentProps<typeof CeoStatusHeader>>) => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
        tree = renderer.create(
            <CeoStatusHeader ceoFullName="Salih Hale" companyName="Hale Group" {...props} />,
        );
    });
    const faces = tree.root.findAllByType(Image).map(n => nameOf(n.props.source));
    const texts = tree.root.findAllByType(Text)
        .map(n => (Array.isArray(n.props.children)
            ? n.props.children.map(String).join('') : String(n.props.children)));
    renderer.act(() => { tree.unmount(); });
    return { faces, texts };
};

describe('the founder gets their own portrait', () => {
    it('a man gets player_male', () => {
        expect(show({ gender: 'male' }).faces).toEqual(['player_male']);
    });

    it('a woman gets player_female', () => {
        expect(show({ gender: 'female' }).faces).toEqual(['player_female']);
        // The two are DIFFERENT files. A single player portrait would be
        // wrong for half the players, which is how the two came to exist.
        expect(show({ gender: 'female' }).faces)
            .not.toEqual(show({ gender: 'male' }).faces);
    });

    it('and an unknown gender falls back to the monogram', () => {
        const { faces, texts } = show({ gender: undefined });
        expect(faces).toEqual([]);
        expect(texts).toContain('SH');
    });
});

describe('and an heir in the chair keeps their own face', () => {
    it('not the founder photograph, which belongs to somebody else', () => {
        const { faces } = show({
            ceoId: 'child-7fk', ceoFullName: 'Elena Hale',
            gender: 'female', ceoAge: 34,
        });
        expect(faces).toHaveLength(1);
        expect(faces[0]).not.toBe('player_female');
        expect(faces[0]).toMatch(/^face_mid_f_/);
    });

    it('and their band follows their age, generation after generation', () => {
        expect(show({ ceoId: 'h1', gender: 'male', ceoAge: 17 }).faces[0])
            .toMatch(/^heir_m_/);
        expect(show({ ceoId: 'h1', gender: 'male', ceoAge: 26 }).faces[0])
            .toMatch(/^face_young_m_/);
        expect(show({ ceoId: 'h1', gender: 'male', ceoAge: 66 }).faces[0])
            .toMatch(/^face_old_m_/);
    });

    it('and two different heirs are two different people', () => {
        const a = show({ ceoId: 'heir-qz7', gender: 'female', ceoAge: 30 }).faces[0];
        const b = show({ ceoId: 'heir-m4k', gender: 'female', ceoAge: 30 }).faces[0];
        expect(a).not.toBe(b);
    });
});

describe('the store carries who is in the chair', () => {
    afterEach(() => { useIdentityStore.setState(initialIdentityState); });

    it('nobody, for a founder', () => {
        expect(initialIdentityState.ceoId).toBeUndefined();
    });

    it('and the id survives a write, so a reload keeps the right face', () => {
        // planSuccession has always returned plan.ceo.id and runSuccession
        // dropped it, so no screen could tell one heir from another. This is
        // the field that ended that.
        useIdentityStore.setState({ ceoId: 'child-3', gender: 'female' });
        expect(useIdentityStore.getState().ceoId).toBe('child-3');
    });

    it('and a new identity clears it', () => {
        // Otherwise a second playthrough opens with the previous run's
        // grandchild looking out of the header.
        useIdentityStore.setState({ ceoId: 'child-3' });
        useIdentityStore.getState().setIdentity({
            firstName: 'Salih', lastName: 'Hale', gender: 'male',
        });
        expect(useIdentityStore.getState().ceoId).toBeUndefined();
    });
});
