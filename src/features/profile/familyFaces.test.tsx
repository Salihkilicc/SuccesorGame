// src/features/profile/familyFaces.test.tsx
//
// ============================================================================
//  THE FAMILY LIST, RENDERED, NOT GREPPED
// ============================================================================
//
//  Every other check in this area reads the source file and matches a regex.
//  That catches a line being deleted and nothing else: it cannot tell whether
//  the face that reaches the screen is the right one, and it happily matches
//  code that was commented out.
//
//  So this renders the component and looks at what came out. It is the only
//  way to answer the question that matters - does a fourteen year old get a
//  fourteen year old face, and do two sisters get two different ones - which
//  is exactly the question 299 correct portraits and no wiring failed to
//  answer for months.
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { Image } from 'react-native';
import { FamilySuccessionList } from './components/FamilySuccessionList';
import { PORTRAITS } from '../../core/portraits/registry';
import type { Child } from '../../core/store/useFamilyStore';

/** Which file a rendered source is, so a failure names a portrait. */
const nameOf = (src: unknown): string =>
    Object.keys(PORTRAITS).find(k => PORTRAITS[k] === src) ?? String(src);

const child = (over: Partial<Child> & { id: string }): Child => ({
    name: 'Ada Kilic',
    age: 20,
    gender: 'Female',
    educationLevel: 'University',
    relationshipWithPlayer: 50,
    role: 'Student',
    stats: { intelligence: 50, charisma: 50, ambition: 50, discipline: 50 },
    ...over,
} as Child);

/**
 * Every portrait the list actually put on screen, in row order.
 *
 * Wrapped in act and unmounted afterwards because the list subscribes to the
 * locale: without act React warns about an update outside it, and without the
 * unmount the subscription outlives the test and jest complains about an
 * import after teardown. Neither is a fault in the component.
 */
const facesOf = (children: Child[]): string[] => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
        tree = renderer.create(
            <FamilySuccessionList
                children={children}
                designatedSuccessorId={null}
                onSelectChild={() => undefined}
            />,
        );
    });
    const out = tree.root.findAllByType(Image).map(n => nameOf(n.props.source));
    renderer.act(() => { tree.unmount(); });
    return out;
};

describe('the family list puts a face on every heir', () => {
    it('and the face is in the band of the age printed beside it', () => {
        // The row reads "son - age 14 - High School" right next to the
        // circle. A face from the wrong band contradicts a number the player
        // is already reading.
        expect(facesOf([child({ id: 'k1', age: 14 })])[0]).toMatch(/^heir_f_/);
        expect(facesOf([child({ id: 'k2', age: 24 })])[0]).toMatch(/^face_young_f_/);
        expect(facesOf([child({ id: 'k3', age: 40 })])[0]).toMatch(/^face_mid_f_/);
        expect(facesOf([child({ id: 'k4', age: 60 })])[0]).toMatch(/^face_old_f_/);
    });

    it('and a son does not get a daughter face', () => {
        expect(facesOf([child({ id: 'b1', age: 24, gender: 'Male' })])[0])
            .toMatch(/^face_young_m_/);
        expect(facesOf([child({ id: 'b2', age: 14, gender: 'Male' })])[0])
            .toMatch(/^heir_m_/);
    });

    it('but a small child gets no face at all, only initials', () => {
        // Nothing under thirteen was ever drawn. A seventeen year old beside
        // the number 4 is worse than a circle with letters in it.
        expect(facesOf([child({ id: 'baby', age: 0 })])).toEqual([]);
        expect(facesOf([child({ id: 'kid', age: 8 })])).toEqual([]);
        expect(facesOf([child({ id: 'teen', age: 13 })])).toHaveLength(1);
    });

    it('and no two siblings wear the same face', () => {
        // The worst case for the pool: same band, same gender, several of
        // them. Ids that are unrelated rather than numbered, because ids
        // differing in a trailing digit cannot collide and would prove
        // nothing.
        const ids = ['qz7', 'm4k', 'vv2', 'p9x', 'ha3', 'ee8'];
        const faces = facesOf(ids.map(id => child({ id, age: 35 })));
        expect(faces).toHaveLength(ids.length);
        expect(new Set(faces).size).toBe(ids.length);
    });

    it('and a mixed household still gets each band right', () => {
        const faces = facesOf([
            child({ id: 'mix1', age: 6 }),
            child({ id: 'mix2', age: 15, gender: 'Male' }),
            child({ id: 'mix3', age: 27 }),
            child({ id: 'mix4', age: 55, gender: 'Male' }),
        ]);
        // The six year old contributes no Image at all, so three rows, in
        // order.
        expect(faces).toHaveLength(3);
        expect(faces[0]).toMatch(/^heir_m_/);
        expect(faces[1]).toMatch(/^face_young_f_/);
        expect(faces[2]).toMatch(/^face_old_m_/);
    });

    it('and the same household renders the same faces every time', () => {
        const kids = [
            child({ id: 'st1', age: 22 }),
            child({ id: 'st2', age: 31, gender: 'Male' }),
        ];
        expect(facesOf(kids)).toEqual(facesOf(kids));
    });

    it('and an empty family does not throw', () => {
        expect(() => facesOf([])).not.toThrow();
    });
});
