// src/features/promptOneWiring.test.ts
//
// ============================================================================
//  THE RULES ARE TESTED NEXT DOOR. THIS IS WHETHER ANYTHING READS THEM
// ============================================================================
//
//  Eight fixes in one pass, and six of them are one line away from being
//  decoration: a rule module nothing calls, a formatter nobody uses, a ceiling
//  computed and then ignored. That is the shape this codebase keeps producing,
//  so it gets its own file.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { formatCompact } from '../core/utils';

const SRC = __dirname;
const live = (...p: string[]) =>
    fs.readFileSync(path.join(SRC, '..', ...p), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*)/.test(l))
        .map(l => l.replace(/\s\/\/.*$/, ''))
        .join('\n');

describe('the money goes as far as the game does', () => {
    it('a quadrillion is a Q rather than a thousand T', () => {
        // ------------------------------------------------------------------
        //  THE NUMBER THAT MADE THIS OBVIOUS
        // ------------------------------------------------------------------
        //  The admin button hands out exactly one quadrillion, and the
        //  formatter stopped at T - so the largest number the game can
        //  produce printed as "1000T".
        // ------------------------------------------------------------------
        expect(formatCompact(1_000_000_000_000_000)).toBe('1Q');
        expect(formatCompact(1_200_000_000_000_000)).toBe('1.2Q');
    });

    it('and the rungs below it did not move', () => {
        expect(formatCompact(2_400_000_000_000)).toBe('2.4T');
        expect(formatCompact(2_400_000_000)).toBe('2.4B');
        expect(formatCompact(1_500_000)).toBe('1.5M');
        expect(formatCompact(50_000)).toBe('50K');
        expect(formatCompact(500)).toBe('500');
    });

    it('and it still signs a negative', () => {
        expect(formatCompact(-2_000_000_000_000_000)).toBe('-2Q');
    });

    it('and the poker table reaches past B, which is where it stopped', () => {
        // Its own short form, because a chip stack and a company valuation
        // round differently. Reported as "the money does not go above B in
        // the casino": a player sitting down with two trillion saw 2000.0B.
        const src = live('features', 'casino', 'screens', 'PokerGameScreen.tsx');
        expect(src).toMatch(/v >= 1e15\).*Q/);
        expect(src).toMatch(/v >= 1e12\).*T/);
    });
});

describe('and the factory offers a crew it could actually use', () => {
    it('the ceiling is the next tier rather than double this one', () => {
        // ------------------------------------------------------------------
        //  83,400 AT THE TOP TIER, AND THE CREW IS 41,700
        // ------------------------------------------------------------------
        //  `Math.max(tier.crew * 2, ...)` - reported as "it says a maximum of
        //  99k and the real one is somewhere in the forties". Doubling was
        //  arbitrary; hiring ahead of an upgrade is the one honest reason to
        //  pass today's crew, so the next tier's crew is the real ceiling.
        // ------------------------------------------------------------------
        const src = live('features', 'assets', 'components', 'FacilityPanel.tsx');
        expect(src).not.toMatch(/max=\{Math\.max\(tier\.crew \* 2/);
        expect(src).toMatch(/next \? next\.crew : tier\.crew/);
    });

    it('and the top tier has no next, so it lands on its own crew', () => {
        const { getTier, getNextTier, MAX_TIER_LEVEL } = require('../core/market/capacity');
        const top = getTier(MAX_TIER_LEVEL);
        expect(getNextTier(MAX_TIER_LEVEL)).toBeUndefined();
        // The number the panel has been calling the crew all along.
        expect(top.crew).toBeGreaterThan(40_000);
        expect(top.crew).toBeLessThan(50_000);
    });
});

describe('and a hookup is one night', () => {
    it('the two answers on the encounter modal run two functions', () => {
        // Reported as "after a hookup the person shows up as my girlfriend,
        // and it was one night". Both buttons were wired to the same handler
        // and that handler ends with setPartner.
        const screen = live('features', 'profile', 'screens', 'ProfileScreen.tsx');
        expect(screen).toMatch(/onDate=\{handleAcceptEncounterDate\}/);
        expect(screen).toMatch(/onHookup=\{handleAcceptEncounterHookup\}/);
    });

    it('and only one of them sets a partner', () => {
        const logic = live('features', 'profile', 'logic', 'useProfileLogic.ts');
        const hookup = logic.slice(
            logic.indexOf('const handleAcceptEncounterHookup'),
            logic.indexOf('const openChildModal'),
        );
        expect(hookup.length).toBeGreaterThan(50);
        expect(hookup).not.toMatch(/setPartner/);
    });

    it('and the hookup still costs you the partner you already had', () => {
        // What it keeps from the date. A night out is still a night out.
        const sys = live('features', 'love', 'components', 'useEncounterSystem.ts');
        const fn = sys.slice(sys.indexOf('const handleHookup'), sys.indexOf('const closeEncounter'));
        expect(fn).toMatch(/cheatingOutcome/);
        expect(fn).toMatch(/breakUp/);
        expect(fn).not.toMatch(/setPartner\(candidate\)/);
    });
});

describe('and the dating message says which of the two happened', () => {
    it('it no longer claims the world is empty', () => {
        const logic = live('features', 'profile', 'logic', 'useProfileLogic.ts');
        expect(logic).not.toMatch(/Nobody worth the evening tonight/);
        expect(logic).toMatch(/love\.roomCoolingOff/);
        expect(logic).toMatch(/love\.noRoomYet/);
    });

    it('and it asks the same function the rule is written in', () => {
        // `earnedTier()` is what runCourtship uses to decide, so the message
        // and the decision cannot disagree about which case this is.
        const logic = live('features', 'profile', 'logic', 'useProfileLogic.ts');
        expect(logic).toMatch(/earnedTier\(\)/);
        expect(logic).toMatch(/from '\.\.\/\.\.\/love\/logic\/runCourtship'/);
    });

    it('and both sentences exist in both languages', () => {
        const missing: string[] = [];
        for (const lang of ['en', 'tr'] as const) {
            const dict = live('core', 'i18n', `${lang}.ts`);
            for (const k of ['love.roomCoolingOff', 'love.noRoomYet']) {
                if (!dict.includes(`'${k}'`)) missing.push(`${lang}:${k}`);
            }
        }
        expect(missing).toEqual([]);
    });
});

describe('and the board screen reads the clock that counts past four', () => {
    it('the grace period is measured in quarters, not in a wrapping month', () => {
        // ------------------------------------------------------------------
        //  currentMonth WRAPS TO 1-12, SO `<= 48` COULD NEVER BE FALSE
        // ------------------------------------------------------------------
        //  The engine had the same comparison and fixed it with a note. The
        //  screen was left reading the wrapped field, so the panel said the
        //  board could not remove you while the vote said it could.
        // ------------------------------------------------------------------
        const src = live('components', 'MyCompany', 'Shares', 'BoardRoomModal.tsx');
        expect(src).not.toMatch(/currentMonth \|\| 1\) <= FOUNDER_GRACE_PERIOD_MONTHS/);
        expect(src).toMatch(/currentQuarter\(\) <= FOUNDER_GRACE_PERIOD_QUARTERS/);
    });
});
