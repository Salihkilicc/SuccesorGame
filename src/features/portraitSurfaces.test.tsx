// src/features/portraitSurfaces.test.tsx
//
// ============================================================================
//  THE FOUR SURFACES REPORTED AS STILL HAVING NO FACE
// ============================================================================
//
//  Reported as "partner cardlar eksik", "board membersda sembol var foto
//  yerine", "ana sayfada da ana karakterin fotosu yok" and, underneath all
//  three, "her yerde yuvarlaklari sadece casinoda gordum fotolari".
//
//  Diagnosed one at a time rather than fixed at once, and they turned out to
//  be four different things:
//
//    - the dating card drew initials and the night out card drew an EMOJI,
//      two of them for a whole pool, so every woman was the same woman,
//    - the board member's portrait had been deliberately removed earlier and
//      replaced with a trait symbol,
//    - the home screen had never been wired at all,
//    - and the profile partner row was already correct: measured, 200 of 200
//      generated partners resolve to a face.
//
//  Each is mounted here and its Image sources read back, because the one
//  thing a source-level check cannot tell you is whether the face reaches
//  the screen.
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { Image } from 'react-native';
import { PORTRAITS } from '../core/portraits/registry';
import { useIdentityStore, initialIdentityState } from '../core/store/useIdentityStore';
import { EncounterModal } from './love/components/EncounterModal';
import { HookupModal } from './life/components/HookupModal';
import { generatePartner } from './love/logic/partnerGenerator';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
    useRoute: () => ({ name: 'Home', key: 'home', params: {} }),
}));
jest.mock('react-native-safe-area-context', () => ({
    ...jest.requireActual('react-native-safe-area-context'),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const nameOf = (src: unknown): string =>
    Object.keys(PORTRAITS).find(k => PORTRAITS[k] === src) ?? String(src);

const facesIn = (el: React.ReactElement): string[] => {
    let tree!: renderer.ReactTestRenderer;
    renderer.act(() => { tree = renderer.create(el); });
    const out = tree.root.findAllByType(Image).map(n => nameOf(n.props.source));
    renderer.act(() => { tree.unmount(); });
    return out;
};

// ---------------------------------------------------------------------------
//  THE DATING CARD
// ---------------------------------------------------------------------------

const scenario = { id: 's', title: 'A room', description: 'x', context: 'VIP_LOUNGE' } as never;

const encounter = (p: unknown) => (
    <EncounterModal
        visible
        candidate={p as never}
        scenario={scenario}
        context="VIP_LOUNGE"
        onIgnore={() => undefined}
        onHookup={() => undefined}
        onDate={() => undefined}
    />
);

describe('the encounter card shows the person being offered', () => {
    it('and the face is in the band of the age it prints', () => {
        const p: Record<string, unknown> = {
            id: 'enc-1', name: 'Mira Sen', gender: 'female',
            stats: { age: 26, socialClass: 'HighSociety', occupation: 'Architect' },
        };
        expect(facesIn(encounter(p))[0]).toMatch(/^face_young_f_/);

        const older = { ...p, id: 'enc-2', gender: 'male', stats: { ...(p.stats as object), age: 58 } };
        expect(facesIn(encounter(older))[0]).toMatch(/^face_old_m_/);
    });

    it('and a real generated candidate always has one', () => {
        // This is the pool the game actually offers. Measured separately at
        // 200 of 200; three here is enough to catch a wiring break.
        for (let i = 0; i < 3; i++) {
            expect(facesIn(encounter(generatePartner()))).toHaveLength(1);
        }
    });

    it('but no gender on record still means initials, not a coin flip', () => {
        const p = { id: 'enc-3', name: 'Alex Vance', stats: { age: 30 } };
        expect(facesIn(encounter(p))).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
//  THE NIGHT OUT CARD, WHICH USED TWO EMOJI FOR A WHOLE POOL
// ---------------------------------------------------------------------------

const candidate = (over: Record<string, unknown>) => ({
    id: 'h1', name: 'Nadia Sol', age: 27, job: 'Curator', bio: 'x',
    difficulty: 40, gender: 'female', imageColor: '#434B50',
    distance: 4, interests: ['art'],
    ...over,
} as never);

const hookup = (c: unknown, matched = false) => (
    <HookupModal
        visible
        candidate={c as never}
        matchStatus={matched ? 'MATCHED' : 'IDLE'}
        onSwipeLeft={() => undefined}
        onSwipeRight={() => undefined}
        nextCandidate={() => undefined}
        onClose={() => undefined}
    />
);

describe('the night out card shows a person rather than an emoji', () => {
    afterEach(() => { useIdentityStore.setState(initialIdentityState); });

    it('a woman of twenty seven gets a young woman', () => {
        expect(facesIn(hookup(candidate({})))[0]).toMatch(/^face_young_f_/);
    });

    it('a man of sixty gets an older man', () => {
        expect(facesIn(hookup(candidate({ id: 'h2', gender: 'male', age: 60 })))[0])
            .toMatch(/^face_old_m_/);
    });

    it('and two candidates are two different people', () => {
        // The emoji made every woman the same woman. Ids that do not differ
        // only in a trailing digit, because those cannot collide anyway.
        const a = facesIn(hookup(candidate({ id: 'qz7' })))[0];
        const b = facesIn(hookup(candidate({ id: 'm4k' })))[0];
        expect(a).not.toBe(b);
    });

    it('and the match overlay shows the player, not a sunglasses emoji', () => {
        useIdentityStore.setState({ ...initialIdentityState, gender: 'female' });
        const faces = facesIn(hookup(candidate({ id: 'h3' }), true));
        expect(faces).toContain('player_female');

        useIdentityStore.setState({ ...initialIdentityState, gender: 'male' });
        expect(facesIn(hookup(candidate({ id: 'h4' }), true))).toContain('player_male');
    });
});

// ---------------------------------------------------------------------------
//  AND THE TWO THAT ARE ABOUT THE SOURCE RATHER THAN THE RENDER
// ---------------------------------------------------------------------------
//  The board modal and the home screen both sit on top of several stores and
//  a navigator. Mounting them would be measuring the mocks. What is worth
//  guarding is that each still reaches for a Portrait at all, with the
//  comments stripped so a shelved line cannot pass - the mistake that was
//  made once already today.
// ---------------------------------------------------------------------------

describe('the board member and the home screen ask for a face', () => {
    const fs = require('fs');
    const path = require('path');
    const live = (...p: string[]): string =>
        fs.readFileSync(path.join(__dirname, '..', ...p), 'utf8')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/^\s*\/\/.*$/gm, '');

    it('the director gets their portrait beside the trait, not instead of it', () => {
        // The symbol was a deliberate choice about the sixty pixel HERO, not
        // about having no face. Both are on the row now.
        const src = live('components', 'MyCompany', 'Shares', 'MemberInteractionModal.tsx');
        expect(src).toMatch(/<Portrait/);
        expect(src).toMatch(/id=\{member\.id\}/);
        expect(src).toMatch(/getTraitVisual\(member\.trait\)\.icon/);
    });

    it('and the board room LIST shows them too, not just the member page', () => {
        // Asked for as "boardin kendi sayfasi var ya hemen girise oraya da
        // koy sembollerin yerine". The row carried a rounded square with the
        // trait icon in it, and the trait is already written in words on the
        // line below - so the symbol said twice what the row said once.
        const src = live('components', 'MyCompany', 'Shares', 'BoardRoomModal.tsx');
        expect(src).toMatch(/<Portrait/);
        expect(src).toMatch(/id=\{m\.id\}/);
        // The trait colour stays, as the ring. It is what tells five
        // directors apart when a later generation falls back to initials.
        expect(src).toMatch(/borderColor=\{`\$\{traitVisual\.color\}35`\}/);
    });

    it('and the home screen uses the same two player files as the profile', () => {
        const src = live('screens', 'Home', 'HomeScreen.tsx');
        expect(src).toMatch(/player_female/);
        expect(src).toMatch(/player_male/);
        expect(src).toMatch(/<Portrait/);
        // The gradient stays as the fallback rather than being deleted.
        expect(src).toMatch(/LinearGradient/);
    });
});
