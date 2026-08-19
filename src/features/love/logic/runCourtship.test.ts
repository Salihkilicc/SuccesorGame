// src/features/love/logic/runCourtship.test.ts
//
// ============================================================================
//  AND THE HALF THAT TOUCHES THE GAME
// ============================================================================
//  courtship.test.ts proves the rule. This mounts it against the real stores,
//  because in this codebase the rule being right has never been the thing that
//  goes wrong - what goes wrong is a correct decision nothing acts on.
// ============================================================================

import { runCourtship, availableTiers } from './runCourtship';
import { useFamilyStore, initialFamilyState } from '../../../core/store/useFamilyStore';
import { useMessageStore, initialMessageState } from '../../../core/store/useMessageStore';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { useStoryStore, initialStoryState } from '../../../core/store/useStoryStore';
import { useGameStore } from '../../../core/store/useGameStore';
import { REFUSAL_LINES } from '../data/strainLines';
import { TIER_UNLOCK } from './courtship';

const world = (companyValue: number, reputation: number) => {
    useFamilyStore.setState({ ...initialFamilyState, _hasHydrated: true });
    useMessageStore.setState({ ...initialMessageState, threads: [] });
    useStoryStore.setState({
        ...initialStoryState,
        dials: { ...initialStoryState.dials, publicReputation: reputation },
    });
    useStatsStore.setState({ companyValue } as never);
    useGameStore.setState({ age: 26, currentMonth: 4 } as never);
};

const threads = () => useMessageStore.getState().threads;

describe('pressing the button', () => {
    it('introduces somebody from the best room the money opens', () => {
        world(10_000_000_000, 95);
        const r = runCourtship(() => 0);
        expect(r.kind).toBe('candidate');
        if (r.kind === 'candidate') {
            expect(r.tier).toBe('HIGH_SOCIETY');
            expect(r.candidate.stats.socialClass).toBe('OldMoney');
        }
    });

    it('and a small company meets people from small rooms', () => {
        world(4_500_000, 95);
        const r = runCourtship(() => 0);
        expect(r.kind).toBe('candidate');
        if (r.kind === 'candidate') {
            expect(TIER_UNLOCK[r.tier]).toBe(0);
        }
    });
});

describe('being turned down', () => {
    it('arrives as a message from the person who did it', () => {
        // The player's call, and the reason it is worth a thread on the phone
        // for somebody they have not met properly: they find out, from them,
        // in the app where everything else in this game happens.
        world(10_000_000_000, 20);
        const r = runCourtship(() => 1);
        expect(r.kind).toBe('refused');
        expect(threads()).toHaveLength(1);
        expect(Object.values(REFUSAL_LINES)).toContain(threads()[0].messages[0].text);
    });

    it('and the message never says why in mechanical terms', () => {
        world(10_000_000_000, 20);
        runCourtship(() => 1);
        const text = threads()[0].messages[0].text.toLowerCase();
        expect(text).not.toContain('reputation');
        expect(text).not.toContain('standing');
        expect(text).not.toContain('money');
    });

    it('and it shuts that room, so tapping again is not a re-roll', () => {
        world(10_000_000_000, 20);
        const first = runCourtship(() => 1);
        expect(first.kind).toBe('refused');

        const cooling = useFamilyStore.getState().courtshipCooldown;
        expect(Object.keys(cooling)).toHaveLength(1);

        // The next attempt cannot land in the room that just said no.
        const second = runCourtship(() => 0);
        if (second.kind === 'candidate') {
            expect(second.tier).not.toBe('HIGH_SOCIETY');
        }
    });

    it('while every room cooling off means nobody, rather than a dead card', () => {
        world(4_500_000, 5);
        for (let i = 0; i < 6; i++) runCourtship(() => 1);
        expect(availableTiers()).toEqual([]);
        expect(runCourtship(() => 0).kind).toBe('nobody');
    });
});

describe('a disgraced player with all the money in the game', () => {
    it('is refused by the room their money opened', () => {
        // The assertion the two-number split exists for.
        world(50_000_000_000, 5);
        expect(runCourtship(() => 0).kind).toBe('refused');
    });
});
