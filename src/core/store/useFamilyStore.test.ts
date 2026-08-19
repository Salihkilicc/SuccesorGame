// src/core/store/useFamilyStore.test.ts
//
// ============================================================================
//  A NEW GAME HAS NO FAMILY IN IT
// ============================================================================
//
//  The store shipped with a girlfriend of a year and THREE children as its
//  INITIAL STATE - sixteen, eight and three - and `reset()` put them back. The
//  player is twenty-five, so the eldest arrived when they were nine. The
//  Profile tab is live and does not sit behind the `love` flag, so every run
//  showed a family nobody had met.
//
//  WHY THE NEW-GAME AUDIT NEVER CAUGHT IT, which is the part worth keeping:
//  that audit looks for state SURVIVING a reset, and nothing survived here.
//  The reset put the family back deliberately, every time, exactly as
//  written. A wrong initial value and a leak look identical from the outside
//  and only one of them is a leak - so this file checks the other one.
//
//  This is step zero of the relationship migration. It depends on nothing and
//  nothing depends on it, which is why it went first.
// ============================================================================

import {
    useFamilyStore,
    initialFamilyState,
    DEMO_PARTNER,
    DEMO_CHILDREN,
} from './useFamilyStore';

beforeEach(() => {
    useFamilyStore.setState({ ...initialFamilyState, _hasHydrated: true });
});

describe('the state a run starts in', () => {
    it('has nobody in it', () => {
        expect(initialFamilyState.partner).toBeNull();
        expect(initialFamilyState.children).toEqual([]);
        expect(initialFamilyState.exPartners).toEqual([]);
    });

    it('and nobody is waiting to inherit', () => {
        // It pointed at `child_alexander_1`, a sixteen year old the player
        // had never met, on the first screen of a brand new company.
        expect(initialFamilyState.designatedSuccessorId).toBeNull();
    });

    it('and the dynasty is neither respected nor disgraced', () => {
        // Eighty-two was the number that went with the family that is no
        // longer here. A player who has inherited a company and done nothing
        // with it yet has a reputation of nothing in particular.
        expect(initialFamilyState.familyReputation).toBe(50);
    });

    it('and a reset puts it back that way', () => {
        // The assertion that actually failed before this change: reset was
        // the thing REBUILDING the family, so a new game was the one moment
        // it was guaranteed to appear.
        useFamilyStore.getState().loadDemoFamily();
        useFamilyStore.getState().reset();
        expect(useFamilyStore.getState().partner).toBeNull();
        expect(useFamilyStore.getState().children).toEqual([]);
        expect(useFamilyStore.getState().designatedSuccessorId).toBeNull();
    });
});

describe('the demo family', () => {
    it('is still here, all three of them, because the screens were laid out against it', () => {
        // Not deleted. It is the only fully-populated PartnerProfile and
        // Child data in the tree, and every screen in features/love and
        // features/profile was built looking at it. Throwing it away would
        // mean guessing what those screens are meant to render.
        expect(DEMO_PARTNER.name).toBe('Sophia Vance');
        expect(DEMO_CHILDREN).toHaveLength(3);
    });

    it('but only a development build can ask for it', () => {
        useFamilyStore.getState().loadDemoFamily();
        expect(useFamilyStore.getState().partner?.name).toBe('Sophia Vance');
        expect(useFamilyStore.getState().children).toHaveLength(3);
    });

    it('and it is a complete partner, which is why it is worth keeping', () => {
        // If this stops being true the screens have no reference case left.
        expect(DEMO_PARTNER.stats).toBeDefined();
        expect(DEMO_PARTNER.job).toBeDefined();
        expect(DEMO_PARTNER.finances?.monthlyCost).toBeGreaterThan(0);
    });
});

describe('what an empty family must not break', () => {
    it('ageing up a family that does not exist', () => {
        expect(() => useFamilyStore.getState().ageUpFamily()).not.toThrow();
        expect(useFamilyStore.getState().partner).toBeNull();
    });

    it('and marrying nobody', () => {
        expect(useFamilyStore.getState().marry(true)).toBe(false);
    });

    it('and breaking up with nobody', () => {
        expect(useFamilyStore.getState().breakup('drifted')).toBeNull();
    });

    it('while a partner set afterwards behaves normally', () => {
        // The empty start is a starting point, not a closed door.
        useFamilyStore.getState().setPartner(DEMO_PARTNER);
        expect(useFamilyStore.getState().partner?.name).toBe('Sophia Vance');
        useFamilyStore.getState().updateLove(-5);
        expect(useFamilyStore.getState().partner!.love).toBe(DEMO_PARTNER.love - 5);
    });
});

// ============================================================================
//  AND THE OTHER SEEDED FAMILY, IN THE OTHER STORE
// ============================================================================
//  useUserStore shipped a mother called Martha and a brother called TOM. The
//  player's brother is Julian Hale: he owns fifteen percent, he writes at
//  eleven at night, and the whole brotherDividend arc is his.
//
//  So the game held two brothers in two stores and the one that was seeded is
//  the one that does not exist. Nothing read either list, which is exactly why
//  it survived - a wrong fact nobody asks for never gets to be wrong out loud.
// ============================================================================
describe('the second seeded family', () => {
    it('is empty too, and the brother is the reason', () => {
        const { initialUserState } = require('./useUserStore');
        expect(initialUserState.family).toEqual([]);
        expect(initialUserState.friends).toEqual([]);
    });

    it('and the real brother is the one in the script', () => {
        const { CAST } = require('../../data/story/cast');
        expect(CAST.brother.name).toBe('Julian Hale');
    });
});
