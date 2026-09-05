// src/features/love/partnerFace.test.tsx
//
// ============================================================================
//  THE PARTNER CARD, RENDERED
// ============================================================================
//
//  This card prints the age directly under the face - "Sophia Vance, 29" -
//  and the picture fills half the screen, so it is the surface where a wrong
//  band or a guessed gender is least forgivable.
//
//  It is also the surface most likely to have NO face: `gender` is optional
//  on PartnerProfile because every save written before the field existed has
//  none, and the demo partner has none either. That path is tested here as
//  carefully as the happy one, because falling back to the single large
//  letter is the correct behaviour rather than a failure.
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { Image, Text } from 'react-native';
import PartnerCard from './components/PartnerCard';
import { PORTRAITS } from '../../core/portraits/registry';
import type { PartnerProfile } from '../../data/relationshipTypes';

const nameOf = (src: unknown): string =>
    Object.keys(PORTRAITS).find(k => PORTRAITS[k] === src) ?? String(src);

const partner = (over: Partial<PartnerProfile> & { id: string }): PartnerProfile => ({
    name: 'Sophia Vance',
    photo: null,
    love: 60,
    relationYears: 1,
    isMarried: false,
    hasPrenup: false,
    stats: {
        ethnicity: 'RoyalEuropean',
        age: 29,
        occupation: 'Art Gallery Director',
        looks: 80, style: 'Luxury', socialClass: 'HighSociety', familyWealth: 70,
        intelligence: 70, jealousy: 40, crazy: 30, libido: 50,
        reputationBuff: 5, financialAidChance: 10, networkPower: 40,
    },
    ...over,
} as PartnerProfile);

const render = (p: PartnerProfile) => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => {
        tree = renderer.create(<PartnerCard partner={p} usedToday={false} />);
    });
    const faces = tree.root.findAllByType(Image).map(n => nameOf(n.props.source));
    const texts = tree.root.findAllByType(Text)
        .map(n => (Array.isArray(n.props.children)
            ? n.props.children.join('') : String(n.props.children)));
    renderer.act(() => { tree.unmount(); });
    return { faces, texts };
};

describe('the partner card shows a face that matches what it prints', () => {
    it('a woman in her twenties gets a young woman', () => {
        const { faces } = render(partner({
            id: 'p-young-f', gender: 'female',
            stats: { ...partner({ id: 'x' }).stats, age: 24 },
        }));
        expect(faces).toHaveLength(1);
        expect(faces[0]).toMatch(/^face_young_f_/);
    });

    it('a man in his fifties gets an older man', () => {
        const { faces } = render(partner({
            id: 'p-old-m', gender: 'male',
            stats: { ...partner({ id: 'x' }).stats, age: 55 },
        }));
        expect(faces[0]).toMatch(/^face_old_m_/);
    });

    it('and the band tracks the age the card is displaying', () => {
        // Not the id, not the tier, not the looks score. The number under the
        // picture is what the player compares the picture to.
        const bands: [number, RegExp][] = [
            [22, /^face_young_/], [35, /^face_mid_/], [61, /^face_old_/],
        ];
        for (const [age, want] of bands) {
            const { faces, texts } = render(partner({
                id: `p-${age}`, gender: 'female',
                stats: { ...partner({ id: 'x' }).stats, age },
            }));
            expect(faces[0]).toMatch(want);
            // And the number really is on the card, so this is not testing
            // against an age nobody sees.
            expect(texts.some(s => s.includes(String(age)))).toBe(true);
        }
    });

    it('but a partner with no gender on record keeps the single letter', () => {
        // Optional by migration decision: saves older than the field have no
        // gender, and the demo partner has none. A coin flip on a picture
        // this large is the worst possible guess.
        const { faces, texts } = render(partner({ id: 'p-nogender', name: 'Alex Vance' }));
        expect(faces).toEqual([]);
        expect(texts).toContain('A');
    });

    it('and the same partner is the same face every time', () => {
        const p = partner({ id: 'p-stable', gender: 'female' });
        expect(render(p).faces).toEqual(render(p).faces);
    });
});
