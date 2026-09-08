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

import fs from 'fs';
import path from 'path';
import React from 'react';
import renderer from 'react-test-renderer';
import { Image, Text } from 'react-native';
import PartnerCard from './components/PartnerCard';
import { PartnerCard as ProfilePartnerCard } from '../profile/components/PartnerCard';
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

// ============================================================================
//  FIRST: IS ANYONE LOOKING AT THIS COMPONENT AT ALL
// ============================================================================
//
//  There are two components called PartnerCard. The faces were wired into
//  features/love/components/PartnerCard first, and every test below passed -
//  because a test can mount a component that no screen ever renders. Nothing
//  imports that file. The player would not have seen one of those faces.
//
//  Exactly the failure this whole exercise exists to undo, committed while
//  undoing it. So the wiring is checked before the behaviour, for both.
// ============================================================================

const SRC = path.resolve(__dirname, '..', '..');

/**
 * Every non test file that imports the module at `target`.
 *
 * Each import specifier is RESOLVED against the importing file rather than
 * matched as text. The first version of this compared strings and reported
 * zero importers for a file that ProfileScreen imports every day, because
 * ProfileScreen writes it as '../components/PartnerCard'. A wiring check that
 * cannot see a relative import is worse than none: it would have called the
 * live card dead and sent me to rewire the wrong one again.
 */
const importersOf = (target: string): string[] => {
    const want = path.resolve(SRC, target);
    const out: string[] = [];
    const walk = (dir: string) => {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            const p = path.join(dir, e.name);
            if (e.isDirectory()) { walk(p); continue; }
            if (!/\.tsx?$/.test(e.name) || /\.test\./.test(e.name)) continue;
            const src = fs.readFileSync(p, 'utf8');
            for (const m of src.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
                if (path.resolve(path.dirname(p), m[1]) === want) {
                    out.push(path.relative(SRC, p));
                }
            }
        }
    };
    walk(SRC);
    return out;
};

describe('the card with the faces in it is on a screen', () => {
    it('profile/components/PartnerCard is imported by something', () => {
        expect(importersOf('features/profile/components/PartnerCard')).not.toEqual([]);
    });

    it('and the resolver is not just always returning nothing', () => {
        // The check above passes trivially if importersOf is broken - it was,
        // twice, once by matching text instead of resolving paths and once by
        // being handed the wrong prefix. A negative and a positive control,
        // so an empty result means the module really is unimported.
        expect(importersOf('features/love/components/PartnerCard')).toEqual([]);
        expect(importersOf('components/common/Portrait').length).toBeGreaterThan(2);
    });

    it('and it is the one that draws a Portrait', () => {
        const live = fs.readFileSync(
            path.join(SRC, 'features', 'profile', 'components', 'PartnerCard.tsx'), 'utf8',
        ).replace(/^\s*\/\/.*$/gm, '');
        expect(live).toMatch(/<Portrait/);
        expect(live).toMatch(/faceFor\(/);
    });
});

describe('the profile row shows a face that matches the partner', () => {
    const renderRow = (p: PartnerProfile) => {
        let tree!: renderer.ReactTestRenderer;
        renderer.act(() => {
            tree = renderer.create(
                <ProfilePartnerCard partner={p} onPress={() => undefined} />,
            );
        });
        const faces = tree.root.findAllByType(Image).map(n => nameOf(n.props.source));
        renderer.act(() => { tree.unmount(); });
        return faces;
    };

    it('a woman of twenty four gets a young woman', () => {
        expect(renderRow(partner({
            id: 'row-f', gender: 'female',
            stats: { ...partner({ id: 'x' }).stats, age: 24 },
        }))[0]).toMatch(/^face_young_f_/);
    });

    it('a man of sixty gets an older man', () => {
        expect(renderRow(partner({
            id: 'row-m', gender: 'male',
            stats: { ...partner({ id: 'x' }).stats, age: 60 },
        }))[0]).toMatch(/^face_old_m_/);
    });

    it('and no gender means initials, not a coin flip', () => {
        expect(renderRow(partner({ id: 'row-none' }))).toEqual([]);
    });

    it('and no partner at all does not throw', () => {
        expect(() => {
            let tree!: renderer.ReactTestRenderer;
            renderer.act(() => {
                tree = renderer.create(
                    <ProfilePartnerCard partner={null} onPress={() => undefined} />,
                );
            });
            renderer.act(() => { tree.unmount(); });
        }).not.toThrow();
    });

    // ----------------------------------------------------------------------
    //  AND IT SAYS WHICH, THE SAME WAY THE HOME SCREEN DOES
    // ----------------------------------------------------------------------
    //  Home has drawn a mark next to the player's name since the beginning
    //  and this row had none, which was survivable while every candidate was
    //  a woman and is not now that the pool leans the other way.
    // ----------------------------------------------------------------------
    const wordsOn = (p: PartnerProfile | null) => {
        let tree!: renderer.ReactTestRenderer;
        renderer.act(() => {
            tree = renderer.create(
                <ProfilePartnerCard partner={p} onPress={() => undefined} />,
            );
        });
        const out = tree.root.findAllByType(Text)
            .flatMap(n => (Array.isArray(n.props.children)
                ? n.props.children : [n.props.children]))
            .filter(c => typeof c === 'string') as string[];
        renderer.act(() => { tree.unmount(); });
        return out;
    };

    it('a man carries the male mark', () => {
        const said = wordsOn(partner({ id: 'mark-m', gender: 'male' }));
        expect(said).toContain('♂');
        expect(said).not.toContain('♀');
    });

    it('and a woman the female one', () => {
        const said = wordsOn(partner({ id: 'mark-f', gender: 'female' }));
        expect(said).toContain('♀');
        expect(said).not.toContain('♂');
    });

    it('and a partner from a save older than the field carries neither', () => {
        const said = wordsOn(partner({ id: 'mark-none' }));
        expect(said).not.toContain('♂');
        expect(said).not.toContain('♀');
        expect(said).toContain('⚪');
    });

    it('and the three glyphs are the ones the home screen uses', () => {
        // Two screens writing their own symbol is two screens that can drift.
        const home = fs.readFileSync(
            path.join(SRC, 'screens', 'Home', 'HomeScreen.tsx'), 'utf8');
        const row = fs.readFileSync(
            path.join(SRC, 'features', 'profile', 'components', 'PartnerCard.tsx'), 'utf8');
        for (const glyph of ['♂', '♀', '⚪']) {
            expect({ glyph, home: home.includes(glyph) }).toEqual({ glyph, home: true });
            expect({ glyph, row: row.includes(glyph) }).toEqual({ glyph, row: true });
        }
    });
});

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
