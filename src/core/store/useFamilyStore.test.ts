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

// ============================================================================
//  STEP 2: ONE STORE
// ============================================================================
//  Both this store and useUserStore held a `partner`, and the two never met.
//  Encounters wrote there; the Profile screen, the succession system and the
//  quarterly buffs read here. So meeting somebody and having somebody were
//  unrelated events, and which store a player's partner landed in depended on
//  which screen they were standing on when they met them.
//
//  Two pieces of real machinery were on the wrong side of that line, and both
//  are the best thing in their area:
//
//    THE PROPOSAL, where a clever partner is harder to talk into a prenup and
//    Royalty will not marry without one. Asked of a partner nobody ever set.
//
//    THE DIVORCE SETTLEMENT, half of personal wealth with no prenup. Taken
//    from a partner this store never had - so the prenup protected nobody and
//    leaving the real partner cost nothing.
// ============================================================================

import { useStatsStore } from './useStatsStore';
import {
    DIVORCE_SHARE,
    FORCED_PRENUP_CLASSES,
    PRENUP_BASE_RESISTANCE,
    migrateLegacyPartner,
} from './useFamilyStore';

const married = (over: Partial<typeof DEMO_PARTNER> = {}) => {
    useFamilyStore.setState({ ...initialFamilyState, _hasHydrated: true });
    useFamilyStore.getState().setPartner({
        ...DEMO_PARTNER, isMarried: true, hasPrenup: false, ...over,
    });
};

describe('the divorce settlement', () => {
    it('takes half of what the player owns personally', () => {
        useStatsStore.setState({ money: 1_000_000 } as never);
        married();
        useFamilyStore.getState().breakup('divorce');
        expect(useStatsStore.getState().money).toBe(1_000_000 * (1 - DIVORCE_SHARE));
    });

    it('and a prenup is what stops it, which is the whole point of the field', () => {
        useStatsStore.setState({ money: 1_000_000 } as never);
        married({ hasPrenup: true });
        useFamilyStore.getState().breakup('divorce');
        expect(useStatsStore.getState().money).toBe(1_000_000);
    });

    it('and leaving somebody you never married costs nothing', () => {
        useStatsStore.setState({ money: 1_000_000 } as never);
        married({ isMarried: false });
        useFamilyStore.getState().breakup('drifted');
        expect(useStatsStore.getState().money).toBe(1_000_000);
    });

    it('while the ex is kept either way', () => {
        married();
        const ex = useFamilyStore.getState().breakup('divorce');
        expect(ex?.breakupReason).toBe('divorce');
        expect(useFamilyStore.getState().exPartners).toHaveLength(1);
        expect(useFamilyStore.getState().partner).toBeNull();
    });
});

describe('the proposal', () => {
    const propose = (withPrenup: boolean, roll: number) => {
        const spy = jest.spyOn(Math, 'random').mockReturnValue(roll);
        const r = useFamilyStore.getState().proposeMarriage(withPrenup);
        spy.mockRestore();
        return r;
    };

    beforeEach(() => married({ isMarried: false, love: 90 }));

    it('lands when they love you and you asked for nothing', () => {
        // 90 love, no prenup, a roll of 50 out of 100.
        expect(propose(false, 0.5).success).toBe(true);
    });

    it('and a prenup is a real question even at ninety', () => {
        // 90 - (30 + intelligence/5). At 88 intelligence that is about 42, so
        // a roll of 50 fails where it passed without the paperwork.
        expect(propose(true, 0.5).success).toBe(false);
    });

    it('and intelligence is what makes it harder, which was never true before', () => {
        married({ isMarried: false, love: 90, stats: { ...DEMO_PARTNER.stats, intelligence: 10 } });
        const clever = propose(true, 0.5);
        married({ isMarried: false, love: 90, stats: { ...DEMO_PARTNER.stats, intelligence: 100 } });
        const cleverer = propose(true, 0.5);
        expect(clever.success).toBe(true);
        expect(cleverer.success).toBe(false);
    });

    it('while a refusal costs you, so asking is not free', () => {
        const before = useFamilyStore.getState().partner!.love;
        const r = propose(false, 0.99);
        expect(r.success).toBe(false);
        expect(useFamilyStore.getState().partner!.love).toBeLessThan(before);
    });

    it('and some families do not allow one without a prenup', () => {
        // Their decision, not the player's and not the partner's, which is the
        // point of having social class as a field at all.
        expect(FORCED_PRENUP_CLASSES).toContain('Royalty');
        married({
            isMarried: false, love: 99,
            stats: { ...DEMO_PARTNER.stats, socialClass: 'Royalty', intelligence: 50 },
        });
        expect(propose(false, 0.1).message).toMatch(/prenup/i);
    });

    it('and nobody proposes twice', () => {
        married({ isMarried: true });
        expect(useFamilyStore.getState().proposeMarriage(false).success).toBe(false);
    });

    it('and the prenup resistance is a stated number, not a magic one', () => {
        expect(PRENUP_BASE_RESISTANCE).toBe(30);
    });
});

describe('a save from before there was one store', () => {
    const { useUserStore } = require('./useUserStore');

    beforeEach(() => {
        useFamilyStore.setState({ ...initialFamilyState, _hasHydrated: true });
        useUserStore.setState({ partner: null });
    });

    it('has its partner moved across', () => {
        useUserStore.setState({ partner: DEMO_PARTNER });
        expect(migrateLegacyPartner()).toBe(true);
        expect(useFamilyStore.getState().partner?.name).toBe('Sophia Vance');
    });

    it('and the old copy is cleared, so nobody has to choose', () => {
        useUserStore.setState({ partner: DEMO_PARTNER });
        migrateLegacyPartner();
        expect(useUserStore.getState().partner).toBeNull();
    });

    it('and it never overwrites a partner that is already here', () => {
        // The assertion that makes it safe to call from two hydration hooks:
        // both stores load asynchronously, neither can wait for the other, so
        // whichever lands second does the work and the first one's data wins.
        useFamilyStore.getState().setPartner({ ...DEMO_PARTNER, name: 'Real Partner' });
        useUserStore.setState({ partner: DEMO_PARTNER });
        expect(migrateLegacyPartner()).toBe(false);
        expect(useFamilyStore.getState().partner?.name).toBe('Real Partner');
    });

    it('and running it twice does nothing the second time', () => {
        useUserStore.setState({ partner: DEMO_PARTNER });
        expect(migrateLegacyPartner()).toBe(true);
        expect(migrateLegacyPartner()).toBe(false);
    });

    it('and a save with nobody in either store is left alone', () => {
        expect(migrateLegacyPartner()).toBe(false);
        expect(useFamilyStore.getState().partner).toBeNull();
    });
});
