// src/features/love/logic/runStrain.test.ts
//
// ============================================================================
//  AND THE HALF THAT TOUCHES THE GAME
// ============================================================================
//  strain.test.ts proves the rule. This mounts it against the real stores,
//  because the rule being right has never been the thing that goes wrong in
//  this codebase - what goes wrong is a correct decision nothing acts on.
// ============================================================================

import { runStrain, PARTNER_THREAD_ID } from './runStrain';
import { useFamilyStore, initialFamilyState } from '../../../core/store/useFamilyStore';
import { useMessageStore, initialMessageState } from '../../../core/store/useMessageStore';
import { useStoryStore, initialStoryState } from '../../../core/store/useStoryStore';
import { useGameStore } from '../../../core/store/useGameStore';
import { SCANDAL_REPUTATION, LOUD_DEPARTURE_CRAZY } from './strain';
import { PERSONALITY_TRAITS } from '../data/personalitiesData';
import type { PartnerProfile } from '../../../data/relationshipTypes';

const seat = (over: { love?: number; jealousy?: number; crazy?: number; personality?: string } = {}) => {
    useStoryStore.setState({ ...initialStoryState });
    useMessageStore.setState({ ...initialMessageState, threads: [] });
    useGameStore.setState({ currentMonth: 12 } as never);
    useFamilyStore.setState({ ...initialFamilyState, _hasHydrated: true });
    const p: PartnerProfile = {
        id: 'p', name: 'Test Partner', photo: null,
        love: over.love ?? 70, relationYears: 1, isMarried: false, hasPrenup: false,
        personality: PERSONALITY_TRAITS.find(t => t.id === (over.personality ?? 'sharp'))
            ?? PERSONALITY_TRAITS.find(t => t.id === 'gold_digger'),
        stats: {
            ethnicity: 'Mixed', age: 30, occupation: 'x', looks: 60, style: 'Business',
            socialClass: 'MiddleClass', familyWealth: 0, intelligence: 60,
            jealousy: over.jealousy ?? 100, crazy: over.crazy ?? 0, libido: 50,
            reputationBuff: 0, financialAidChance: 0, networkPower: 0,
        },
    };
    useFamilyStore.getState().setPartner(p);
};

const thread = () =>
    useMessageStore.getState().threads.find(t => t.id === PARTNER_THREAD_ID);

describe('a quarter of overtime', () => {
    it('costs love and arrives as a message', () => {
        seat();
        const before = useFamilyStore.getState().partner!.love;
        runStrain({ overtime: true, casinoStreak: 0 });
        expect(useFamilyStore.getState().partner!.love).toBeLessThan(before);
        expect(thread()?.messages).toHaveLength(1);
    });

    it('and the message names the overtime rather than the mechanic', () => {
        seat();
        runStrain({ overtime: true, casinoStreak: 0 });
        expect(thread()!.messages[0].text.toLowerCase()).toMatch(/plant|late|night/);
    });

    it('while a quarter with nothing in it says nothing', () => {
        seat();
        const before = useFamilyStore.getState().partner!.love;
        runStrain({ overtime: false, casinoStreak: 0 });
        expect(useFamilyStore.getState().partner!.love).toBe(before);
        expect(thread()).toBeUndefined();
    });

    it('and a player with no partner is untouched', () => {
        seat();
        useFamilyStore.getState().setPartner(null);
        expect(runStrain({ overtime: true, casinoStreak: 9 }).loveChange).toBe(0);
    });
});

describe('when it runs out', () => {
    it('they leave, and they say so first', () => {
        seat({ love: 1 });
        const r = runStrain({ overtime: true, casinoStreak: 3 });
        expect(r.left).toBe(true);
        expect(useFamilyStore.getState().partner).toBeNull();
        // Two messages: the complaint, then the goodbye.
        expect(thread()!.messages.length).toBeGreaterThanOrEqual(2);
    });

    it('and the ex is kept', () => {
        seat({ love: 1 });
        runStrain({ overtime: true, casinoStreak: 0 });
        expect(useFamilyStore.getState().exPartners).toHaveLength(1);
    });

    it('and a quiet one costs nothing but the person', () => {
        seat({ love: 1, crazy: 0 });
        const before = useStoryStore.getState().dials.publicReputation;
        runStrain({ overtime: true, casinoStreak: 0 });
        expect(useStoryStore.getState().dials.publicReputation).toBe(before);
    });

    it('while a loud one goes to the people who ask', () => {
        // `crazy`'s one job, and it costs the thing a CEO cannot buy back
        // quickly.
        seat({ love: 1, crazy: LOUD_DEPARTURE_CRAZY });
        const before = useStoryStore.getState().dials.publicReputation;
        runStrain({ overtime: true, casinoStreak: 0 });
        expect(useStoryStore.getState().dials.publicReputation)
            .toBe(before - SCANDAL_REPUTATION);
    });

    it('and the clamp is read from the store, not from the local copy', () => {
        // A partner at 2 losing 8 is at ZERO, not at -6. Reading the local
        // number would have them leave next quarter instead of this one, and
        // the player would have watched a message arrive and nothing happen.
        seat({ love: 2, jealousy: 100 });
        expect(runStrain({ overtime: true, casinoStreak: 3 }).left).toBe(true);
    });
});

describe('silence', () => {
    it('is read from the same place the story reads it', () => {
        // core/story/neglect.ts owns "has this thread gone a quarter
        // unanswered". Two systems agreeing by construction rather than by
        // coincidence.
        seat();
        useMessageStore.getState().sendFromCharacter(
            { id: PARTNER_THREAD_ID, name: 'Test Partner', role: 'Partner' },
            'earlier', 1,
        );
        useGameStore.setState({ currentMonth: 12 } as never);
        const before = useFamilyStore.getState().partner!.love;
        const r = runStrain({ overtime: false, casinoStreak: 0 });
        expect(r.reason).toBe('ignored');
        expect(useFamilyStore.getState().partner!.love).toBeLessThan(before);
    });

    it('and a thread that was read is not silence', () => {
        seat();
        useMessageStore.getState().sendFromCharacter(
            { id: PARTNER_THREAD_ID, name: 'Test Partner', role: 'Partner' },
            'earlier', 1,
        );
        useMessageStore.getState().markRead(PARTNER_THREAD_ID);
        useGameStore.setState({ currentMonth: 12 } as never);
        expect(runStrain({ overtime: false, casinoStreak: 0 }).reason).toBeNull();
    });
});
