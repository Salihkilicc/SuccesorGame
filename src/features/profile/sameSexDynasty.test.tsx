// src/features/profile/sameSexDynasty.test.tsx
//
// ============================================================================
//  MARRY A WOMAN AS A WOMAN, AND STILL HAVE SOMEBODY TO LEAVE IT TO
// ============================================================================
//
//  The pure rule is measured in core/story/surrogacy.test.ts. This is the
//  half that has gone wrong every other time in this codebase: whether
//  anything actually CALLS it.
//
//  Three things, and the third is the one that matters.
//
//    1. THE BIOLOGICAL BUTTON IS REALLY GONE for a same gender couple. Not
//       "the offer says notNeeded" - the button, off the rendered card.
//
//    2. THE PAID ONE IS REALLY THERE, saying the price and the wait before it
//       is pressed rather than in an alert afterwards.
//
//    3. AND THE MONEY AND THE CHILD MOVE. Booked through the real store,
//       walked forward the real number of quarters, and a child on the
//       succession roster at the end of it - because a route to an heir that
//       does not reach an heir is the dead end this exists to remove.
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { Text } from 'react-native';
import { useFamilyStore, initialFamilyState } from '../../core/store/useFamilyStore';
import { useStatsStore } from '../../core/store/useStatsStore';
import { useIdentityStore } from '../../core/store/useIdentityStore';
import { SURROGACY_COST, SURROGACY_QUARTERS } from '../../core/story/surrogacy';
import { generatePartner } from '../love/logic/partnerGenerator';
import type { PartnerProfile } from '../../data/relationshipTypes';

// ----------------------------------------------------------------------------
//  THE SCREEN TAKES ITS ROUTE FROM A HOOK, NOT FROM PROPS
// ----------------------------------------------------------------------------
//  So mounting it needs a navigator, and standing one up would test
//  react-navigation rather than this card. Two hooks, stubbed, and everything
//  the card actually reads still comes out of the real stores.
// ----------------------------------------------------------------------------
jest.mock('react-native-safe-area-context', () => ({
    ...jest.requireActual('react-native-safe-area-context'),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ goBack: () => undefined, navigate: () => undefined }),
    useRoute: () => ({ params: { memberId: 'partner', memberType: 'partner' } }),
}));

const married = (gender: 'male' | 'female'): PartnerProfile => ({
    ...generatePartner('HIGH_SOCIETY'),
    id: 'spouse',
    name: 'Vera Holm',
    gender,
    isMarried: true,
    hasPrenup: true,
});

/** A run set up the way the player would have set it up. */
const start = (player: 'male' | 'female', spouse: 'male' | 'female', money: number) => {
    useIdentityStore.setState({ gender: player } as never);
    useFamilyStore.setState({ ...initialFamilyState, _hasHydrated: true } as never);
    useFamilyStore.setState({ partner: married(spouse) } as never);
    useStatsStore.setState({ money } as never);
};

afterEach(() => {
    useFamilyStore.setState({ ...initialFamilyState, _hasHydrated: true } as never);
    useIdentityStore.setState({ gender: 'male' } as never);
});

describe('the money and the child actually move', () => {
    it('a booking costs what it says and starts the clock', () => {
        start('female', 'female', SURROGACY_COST * 2);
        const before = useStatsStore.getState().money;

        expect(useFamilyStore.getState().bookSurrogacy('Juno', 'Female')).toBe(true);

        expect(before - useStatsStore.getState().money).toBe(SURROGACY_COST);
        expect(useFamilyStore.getState().pendingBirth).toEqual({
            name: 'Juno', gender: 'Female', quartersLeft: SURROGACY_QUARTERS,
        });
        // Nothing on the roster yet. Nine months is the point.
        expect(useFamilyStore.getState().children).toEqual([]);
    });

    it('and a couple who can simply have one is refused, with the money untouched', () => {
        // ------------------------------------------------------------------
        //  A BUTTON IS NOT A PERMISSION
        // ------------------------------------------------------------------
        //  The card hides this route from a couple of different genders, and
        //  the store checks anyway. Every other rule in this codebase that
        //  lived only on a screen has been got round eventually.
        // ------------------------------------------------------------------
        start('female', 'male', SURROGACY_COST * 2);
        const before = useStatsStore.getState().money;
        expect(useFamilyStore.getState().bookSurrogacy('Juno', 'Female')).toBe(false);
        expect(useStatsStore.getState().money).toBe(before);
        expect(useFamilyStore.getState().pendingBirth).toBeNull();
    });

    it('and so is a couple who are not married, and one who cannot pay', () => {
        start('female', 'female', SURROGACY_COST * 2);
        useFamilyStore.setState({ partner: { ...married('female'), isMarried: false } } as never);
        expect(useFamilyStore.getState().bookSurrogacy('Juno', 'Female')).toBe(false);

        start('female', 'female', SURROGACY_COST - 1);
        expect(useFamilyStore.getState().bookSurrogacy('Juno', 'Female')).toBe(false);
        expect(useStatsStore.getState().money).toBe(SURROGACY_COST - 1);
    });

    it('and a second booking cannot be started on top of the first', () => {
        start('female', 'female', SURROGACY_COST * 5);
        expect(useFamilyStore.getState().bookSurrogacy('Juno', 'Female')).toBe(true);
        const after = useStatsStore.getState().money;
        expect(useFamilyStore.getState().bookSurrogacy('Otto', 'Male')).toBe(false);
        // Charged once, not twice. This is the shape of the double charge
        // that was found in the shop.
        expect(useStatsStore.getState().money).toBe(after);
    });

    it('and the child arrives on the third quarter and not before', () => {
        start('female', 'female', SURROGACY_COST * 2);
        useFamilyStore.getState().bookSurrogacy('Juno', 'Female');

        const arrivals: (string | null)[] = [];
        for (let q = 0; q < 5; q++) {
            arrivals.push(useFamilyStore.getState().advancePendingBirth());
        }
        expect(arrivals).toEqual([null, null, 'Juno', null, null]);

        const kids = useFamilyStore.getState().children;
        expect(kids).toHaveLength(1);
        expect(kids[0].name).toContain('Juno');
        expect(kids[0].age).toBe(0);
        expect(useFamilyStore.getState().pendingBirth).toBeNull();
    });

    it('and they are a real heir rather than a lesser one', () => {
        // ------------------------------------------------------------------
        //  THE WHOLE REASON THIS ROUTE EXISTS
        // ------------------------------------------------------------------
        //  A founder who dies with no children gets `diedWithoutAnHeir` and
        //  the run ends. A child who cannot inherit would leave the dead end
        //  exactly where it was and cost the player money on the way.
        // ------------------------------------------------------------------
        start('male', 'male', SURROGACY_COST * 2);
        useFamilyStore.getState().bookSurrogacy('Konrad', 'Male');
        for (let q = 0; q < SURROGACY_QUARTERS; q++) {
            useFamilyStore.getState().advancePendingBirth();
        }
        const heir = useFamilyStore.getState().children[0];
        expect(heir).toBeDefined();
        // Same shape a birth produces: the surname, the stats, the roster.
        expect(heir.name).toMatch(/Hale$/);
        expect(heir.stats.businessAcumen).toBeGreaterThan(0);
        expect(heir.stats.loyalty).toBe(95);
        expect(heir.role).toBe('Infant');

        const { heirInWaiting } = require('../../core/story/mortality');
        const waiting = heirInWaiting([{ id: heir.id, name: heir.name, age: heir.age }]);
        expect(waiting).not.toBeNull();
        expect(waiting.heir.name).toBe(heir.name);
    });
});

describe('and the quarter really turns the clock', () => {
    // ------------------------------------------------------------------
    //  A COUNTDOWN NOTHING DECREMENTS IS A CHILD WHO NEVER ARRIVES
    // ------------------------------------------------------------------
    //  Every test above drives `advancePendingBirth` by hand, which proves
    //  the action and proves nothing about the game. This is the signature
    //  failure of this codebase: correct data that nothing reads.
    // ------------------------------------------------------------------
    const fs = require('fs');
    const path = require('path');
    const tick = fs.readFileSync(
        path.join(__dirname, '..', '..', 'core', 'store', 'useGameStore.ts'), 'utf8');

    it('the tick calls it', () => {
        expect(tick).toContain('advancePendingBirth()');
    });

    it('and once, so a quarter is one quarter', () => {
        expect(tick.match(/advancePendingBirth\(\)/g)).toHaveLength(1);
    });

    it('and from the quarterly body, not the annual one', () => {
        // ------------------------------------------------------------------
        //  THE MISTAKE THIS WOULD HAVE BEEN
        // ------------------------------------------------------------------
        //  The family lifecycle runs inside `if (newMonth === 1)`. Putting a
        //  countdown measured in quarters in there makes it a countdown in
        //  YEARS, and three quarters becomes three years - long enough to
        //  read as broken and short enough that nobody would be sure.
        // ------------------------------------------------------------------
        const at = tick.indexOf('advancePendingBirth()');
        const annual = tick.indexOf('if (newMonth === 1)');
        expect(at).toBeGreaterThan(0);
        expect(annual).toBeGreaterThan(0);
        expect(at).toBeLessThan(annual);
    });

    it('and outside the love feature gate, because it was paid for', () => {
        // ------------------------------------------------------------------
        //  A CHILD THAT WAS PAID FOR LANDS WHATEVER A FLAG SAYS LATER
        // ------------------------------------------------------------------
        //  Half this game is behind feature flags that get turned on and off
        //  while it is being built. Money has already left the player's
        //  account by the time this runs; a flag flipped in between must not
        //  swallow the child it bought.
        //
        //  Read as PROXIMITY rather than by parsing braces: `FEATURES.love`
        //  appears eight times in this file, and the question is only whether
        //  the block this call sits in is one of them. The nearest gate above
        //  it is thirty lines further up and closed.
        // ------------------------------------------------------------------
        const lines = tick.split('\n');
        const at = lines.findIndex((l: string) => l.includes('advancePendingBirth()'));
        expect(at).toBeGreaterThan(0);
        const block = lines.slice(at - 12, at + 4).join('\n')
            .replace(/^\s*\/\/.*$/gm, '');
        expect(block).not.toMatch(/if \(FEATURES\./);
        expect(block).not.toMatch(/isEnabled\(/);
    });
});

describe('and the card really shows one door and not the other', () => {
    const FamilyMemberScreen = require('./screens/FamilyMemberScreen').default;

    const wordsOn = () => {
        let tree!: renderer.ReactTestRenderer;
        renderer.act(() => {
            tree = renderer.create(<FamilyMemberScreen />);
        });
        const out = tree.root.findAllByType(Text)
            .flatMap(n => (Array.isArray(n.props.children) ? n.props.children : [n.props.children]))
            .filter(c => typeof c === 'string')
            .join(' | ');
        renderer.act(() => { tree.unmount(); });
        return out;
    };

    it('a same gender marriage is not offered a biological child', () => {
        start('female', 'female', SURROGACY_COST * 2);
        const said = wordsOn();
        expect(said).not.toMatch(/Have a child|Çocuk sahibi ol/);
        expect(said).toMatch(/surrogate|Taşıyıcı/);
        // The price and the wait, before the press.
        expect(said).toContain(SURROGACY_COST.toLocaleString());
        expect(said).toMatch(new RegExp(`\\b${SURROGACY_QUARTERS}\\b`));
    });

    it('and a different gender marriage sees exactly what it always saw', () => {
        start('female', 'male', SURROGACY_COST * 2);
        const said = wordsOn();
        expect(said).toMatch(/Have a child|Çocuk sahibi ol/);
        expect(said).not.toMatch(/surrogate|Taşıyıcı/);
    });

    it('and once it is booked the card counts down instead of selling again', () => {
        start('female', 'female', SURROGACY_COST * 3);
        useFamilyStore.getState().bookSurrogacy('Juno', 'Female');
        const said = wordsOn();
        expect(said).toMatch(/on the way|yolda/);
        expect(said).not.toMatch(/surrogate •|Taşıyıcı anne ile/);
    });
});
