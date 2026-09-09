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
        // Four per voice now rather than one, so a player turned down twice
        // does not read the same paragraph from two different people.
        expect(Object.values(REFUSAL_LINES).flat())
            .toContain(threads()[0].messages[0].text);
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

        // ------------------------------------------------------------------
        //  AND THE NEXT ATTEMPT IS NOBODY, NOT A POORER ROOM
        // ------------------------------------------------------------------
        //  This used to allow a candidate from a lower tier, which is what
        //  the demotion bug was: being turned down by old money handed the
        //  player an artist, then a shift manager, then a student. Eight taps
        //  from the top of the ladder to the bottom, company untouched.
        // ------------------------------------------------------------------
        expect(runCourtship(() => 0).kind).toBe('nobody');
    });

    it('while the room being shut means nobody, rather than a dead card', () => {
        // One refusal is enough now. It used to take six, because each one
        // only shut the rung the player was standing on and dropped them to
        // the next.
        world(4_500_000, 5);
        expect(runCourtship(() => 1).kind).toBe('refused');
        expect(availableTiers()).not.toContain('BLUE_COLLAR');
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

// ============================================================================
//  AND THE TAP SAYS SOMETHING
// ============================================================================
//
//  `triggerEncounter` returned null on a refusal and every caller read null as
//  "no encounter this time". So the player pressed the button to go and meet
//  somebody, watched nothing happen, and a message arrived some seconds later
//  from a person they had never seen a card for. Nothing connected the two.
// ============================================================================
describe('the refusal is answerable in the moment', () => {
    it('so the runner names the person who said no', () => {
        world(10_000_000_000, 20);
        const r = runCourtship(() => 1);
        expect(r.kind).toBe('refused');
        if (r.kind === 'refused') {
            expect(r.candidate.name.length).toBeGreaterThan(0);
        }
    });

    it('and the screen is given an outcome rather than a null', () => {
        // Read off the source: the hook is a React file and this is the shape
        // that was wrong, not the rendering.
        const fs = require('fs');
        const path = require('path');
        const hook = fs.readFileSync(
            path.join(__dirname, '..', 'components', 'useEncounterSystem.ts'), 'utf8',
        );
        expect(hook).toContain('export type EncounterOutcome');
        expect(hook).toMatch(/kind: 'refused'; name: string/);
        expect(hook).toMatch(/return \{ kind: 'refused', name: result\.candidate\.name \}/);
    });

    it('and the one screen that asks for a partner reports it', () => {
        const fs = require('fs');
        const path = require('path');
        const profile = fs.readFileSync(
            path.join(__dirname, '..', '..', 'profile', 'logic', 'useProfileLogic.ts'), 'utf8',
        );
        expect(profile).toMatch(/outcome\.kind === 'refused'/);
        expect(profile).not.toMatch(/^\s*encounter\.triggerEncounter\('VIP_LOUNGE'\);\s*$/m);
    });
});
