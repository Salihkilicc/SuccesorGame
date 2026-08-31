// src/features/casino/casinoLadder.test.ts
//
// ============================================================================
//  SEVEN ROOMS, AND THE SIX GATES THAT MEANT NOTHING
// ============================================================================
//
//  The rooms opened at 0, 100, 200, 300, 400, 500, 600 and the screen drew a
//  progress bar against a hardcoded 700 that matched no room at all.
//
//  Even rungs are wrong here and the reason is not in the thresholds, it is in
//  the earning rate. Reputation is paid per bet:
//
//      spendingRep = max(1, floor(bet / 10_000))
//
//  and the chips scale with the room. Athens tops out at a 50,000 chip, so a
//  maximum bet is +5 and the first hundred is about twenty spins - a real
//  climb. Istanbul's top chip is 2,500,000, worth +250 a hand. Under even
//  rungs ONE hand cleared a whole room and the remaining five gates were
//  decoration.
//
//  So the rungs widen with the rooms they gate, and the ceiling had to move
//  with them: reputation was clamped at 1000 in four separate logic files
//  while the top room now asks for 2100, which would have made the last two
//  rooms unreachable at any stake.
// ============================================================================

import fs from 'fs';
import path from 'path';

import {
    CASINO_LOCATIONS,
    CASINO_LADDER_TOP,
    REPUTATION_CEILING,
    MAX_REP_PER_BET,
    reputationForBet,
} from './data/casinoData';
import { chipsFor, maxBetFor } from './data/casinoStakes';
import { MACAU_REPUTATION, HIGH_ROLLER_REPUTATION } from '../../core/story/title';

const byId = (id: string) => CASINO_LOCATIONS.find(l => l.id === id)!;

describe('the ladder', () => {
    it('starts open and climbs from there', () => {
        expect(CASINO_LOCATIONS[0].requirement).toBe(0);
        for (let i = 1; i < CASINO_LOCATIONS.length; i++) {
            expect(CASINO_LOCATIONS[i].requirement)
                .toBeGreaterThan(CASINO_LOCATIONS[i - 1].requirement);
        }
    });

    it('asks sixty to leave the first room', () => {
        // The one gate the player actually climbs at five points a spin, and
        // it came down from a hundred: "make progress easier".
        expect(CASINO_LOCATIONS[1].requirement).toBe(60);
    });

    it('and a widening step for every one after', () => {
        // A FLAT step was the old answer and it was too much of it: 400 a gate
        // over six gates is 42 quarters of maximum standing. The shape that
        // mattered was that each gate costs more than the last, and that is
        // kept - 60, 120, 180, 240 - at a third of the total distance.
        const steps: number[] = [];
        for (let i = 1; i < CASINO_LOCATIONS.length; i++) {
            steps.push(CASINO_LOCATIONS[i].requirement - CASINO_LOCATIONS[i - 1].requirement);
        }
        expect(steps).toEqual([60, 120, 180, 240]);
        for (let i = 1; i < steps.length; i++) {
            const step = steps[i];
            expect(step).toBeGreaterThan(steps[i - 1]);
        }
    });

    it('and the bar is a fraction of the last room, not of a round number', () => {
        // It read `/700` while the ladder ended at 600, so somebody at the top
        // of the game was shown a bar that could never fill.
        expect(CASINO_LADDER_TOP).toBe(CASINO_LOCATIONS[CASINO_LOCATIONS.length - 1].requirement);
    });
});

describe('the ceiling', () => {
    it('is above the last room, or the last room is a door with no handle', () => {
        expect(REPUTATION_CEILING).toBeGreaterThan(CASINO_LADDER_TOP);
    });

    it('and no logic file carries its own copy of it any more', () => {
        // It was the literal 1000, four times, in four files that never read
        // casinoData. Moving the ladder moved none of them.
        for (const f of ['useRouletteLogic', 'useSlotsLogic', 'useBlackjackLogic', 'usePokerLogic']) {
            const src = fs.readFileSync(
                path.join(__dirname, 'logic', `${f}.ts`), 'utf8');
            expect(src).toContain('REPUTATION_CEILING');
            expect(src).not.toMatch(/, 0, 1000\)/);
        }
    });
});

describe('what one bet is worth', () => {
    it('is capped, or the gates are doors drawn on a corridor', () => {
        // ----------------------------------------------------------------
        //  FOUND BY THIS TEST RATHER THAN BY THE CHANGE IT WAS WRITTEN FOR
        // ----------------------------------------------------------------
        //  Widening the rungs did nothing on its own. Reputation was
        //  `max(1, floor(bet / 10_000))` with no ceiling and the chips run to
        //  fifty billion, so at Monte Carlo the SMALLEST chip in the room was
        //  worth a thousand points against a gate of four hundred. The
        //  cheapest bet available cleared the next room four times over.
        // ----------------------------------------------------------------
        // The chips are DERIVED from the player's fortune now rather than
        // listed on the room, so this asks at several fortunes instead of
        // reading a fixed rail. See data/casinoStakes.ts.
        for (const money of [0, 10_000_000, 2_000_000_000_000]) {
            for (const room of CASINO_LOCATIONS) {
                const rail = chipsFor(room, money);
                expect(reputationForBet(Math.min(...rail))).toBeLessThanOrEqual(MAX_REP_PER_BET);
                expect(reputationForBet(Math.max(...rail))).toBeLessThanOrEqual(MAX_REP_PER_BET);
            }
        }
        expect(reputationForBet(50_000_000_000)).toBe(MAX_REP_PER_BET);
    });

    it('and never below one, so a small stake is still a night out', () => {
        expect(reputationForBet(1)).toBe(1);
        expect(reputationForBet(0)).toBe(1);
        expect(reputationForBet(-5)).toBe(1);
        expect(reputationForBet(NaN as any)).toBe(1);
    });

    it('so every gate is the same climb whatever the room charges', () => {
        // Sixteen maximum bets to cross a four hundred gate, against twenty
        // spins to leave Athens at five a spin. The rooms are earned by
        // turning up rather than by the size of one chip.
        // The gates are 60/120/180/240 now rather than a flat 400, so this
        // pins the WIDEST one: ten maximum bets, against twenty spins to
        // leave Athens. See the ladder note in casinoData.ts.
        const widest = CASINO_LOCATIONS[CASINO_LOCATIONS.length - 1].requirement
            - CASINO_LOCATIONS[CASINO_LOCATIONS.length - 2].requirement;
        expect(widest).toBe(240);
        expect(Math.ceil(widest / MAX_REP_PER_BET)).toBe(10);
    });

    it('while the first room is still the quick one it was', () => {
        // Athens tops out at a 50,000 chip, which is under the cap, so
        // nothing about the opening changed.
        // Athens' floor is a 50,000 ceiling, which is under the cap, so a
        // player with nothing still climbs at five a spin. And the first gate
        // came down from 100 to 60, which is what "make it easier" meant.
        const athens = CASINO_LOCATIONS[0];
        expect(reputationForBet(maxBetFor(athens, 0))).toBe(5);
        expect(CASINO_LOCATIONS[1].requirement / 5).toBe(12);
    });

    it('and no logic file works it out for itself any more', () => {
        // Four copies of one expression, in four files, none of which had a
        // cap and none of which knew about the ladder they were feeding.
        for (const f of ['useRouletteLogic', 'useSlotsLogic', 'useBlackjackLogic', 'usePokerLogic']) {
            const src = fs.readFileSync(
                path.join(__dirname, 'logic', `${f}.ts`), 'utf8');
            expect(src).toContain('reputationForBet');
            expect(src).not.toMatch(/Math\.floor\(\w+ \/ 10000\)/);
        }
    });
});

describe('the two titles that hang off it', () => {
    it('are read off the rooms rather than typed beside them', () => {
        // They were 600 and 300 with comments naming the rooms they were meant
        // to match. The rooms moved and they did not, so "Known in Macau"
        // would have arrived a quarter of the way up the ladder.
        expect(MACAU_REPUTATION).toBe(byId('macau').requirement);
        // London was SHELVED when the ladder came down to five rooms, and
        // this pointed at it: `roomRequirement` fell through to its hardcoded
        // 900, which is above Macau's own gate, so the high roller title would
        // have arrived AFTER the Macau one or never at all. Caught here;
        // nothing on screen would have shown it.
        expect(HIGH_ROLLER_REPUTATION).toBe(byId('monte_carlo').requirement);
    });

    it('and they still arrive in the right order', () => {
        expect(HIGH_ROLLER_REPUTATION).toBeLessThan(MACAU_REPUTATION);
    });
});

describe('the four game cards', () => {
    it('draw a symbol rather than a file that never decoded', () => {
        // Reported as "fotolari yok". The four thumbnails are JPEGs with a
        // .png extension - Metro picks its decoder off the extension, so every
        // one of them failed and the cards drew an empty box under the
        // gradient. Two and a half megabytes for four blank rectangles.
        const card = fs.readFileSync(
            path.join(__dirname, 'components', 'GameRoomCard.tsx'), 'utf8');
        expect(card).not.toMatch(/<Image\s/);
        expect(card).not.toMatch(/ImageSourcePropType/);
        // Word boundary: `styles.watermarkX` contains `styles.watermark`, so
        // the loose version of this passed while the icon was unstyled.
        expect(card).toMatch(/style=\{styles\.watermark\}/);
        expect(card).toMatch(/watermark: \{/);

        const screen = fs.readFileSync(
            path.join(__dirname, 'screens', 'CasinoScreen.tsx'), 'utf8');
        expect(screen).not.toMatch(/_thumb\.png/);
    });

    it('and each one already had an icon to use', () => {
        // The screen was passing `iconName` for all four while ALSO loading a
        // photograph on top of it. The icons were there the whole time.
        const screen = fs.readFileSync(
            path.join(__dirname, 'screens', 'CasinoScreen.tsx'), 'utf8');
        for (const icon of ['cards-spade', 'circle-slice-8', 'slot-machine', 'cards-club']) {
            expect(screen).toContain(icon);
        }
    });

    it('and the broken files are left on disk rather than deleted', () => {
        // Nothing requires them, so Metro will not bundle them. Kept because
        // deleting is not this codebase's move and because they are the
        // evidence for what the header of GameRoomCard says.
        const dir = path.join(__dirname, 'assets');
        expect(fs.readdirSync(dir).length).toBe(4);
    });
});

// ============================================================================
//  AND THE TWO HALVES THE PURE MODULES CANNOT SEE
// ============================================================================
//
//  Both of these were added because a probe did NOT fail. Reverting the
//  payout to a flat `bet * 3` and lifting the quarterly allowance to a
//  million each left every test green, which is the same gap that let the
//  buyout screens and the education multiplier through: the arithmetic was
//  covered and the door it goes through was not.
// ============================================================================

describe('the wiring the arithmetic hangs on', () => {
    const fsw = require('fs');
    const pathw = require('path');
    const codeOfW = (...p: string[]): string =>
        fsw.readFileSync(pathw.join(__dirname, ...p), 'utf8')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .split('\n')
            .filter((l: string) => !/^\s*(\/\/|\*)/.test(l))
            .join('\n');

    it('pays what landed rather than a flat multiple', () => {
        // The old line was `winAmount = bet * 3` whatever the reels showed,
        // which is what made eighteen hand-written payouts decoration.
        const src = codeOfW('logic', 'useSlotsLogic.ts');
        expect(src).toMatch(/symbolByIcon\(symbols,/);
        expect(src).toMatch(/bet \* multiple/);
        expect(src).not.toMatch(/winAmount = bet \* 3;/);
        expect(src).not.toMatch(/winAmount = bet \* 2;/);
    });

    it('and takes its odds from the machine rather than from the file', () => {
        const src = codeOfW('logic', 'useSlotsLogic.ts');
        expect(src).toMatch(/JACKPOT: config\.jackpotOdds/);
        expect(src).toMatch(/MINI: miniOdds\(config\)/);
        expect(src).not.toMatch(/1 \/ 14/);
    });

    it('and every table routes its reputation through the quarter', () => {
        for (const f of ['useRouletteLogic', 'useSlotsLogic', 'useBlackjackLogic', 'usePokerLogic']) {
            const src = codeOfW('logic', `${f}.ts`);
            expect(src).toMatch(/bankReputation\(delta\)/);
            expect(src).toMatch(/casinoReputation \+ allowed/);
        }
    });

    it('and poker tells the company it was there, which it never did', () => {
        // Found while adding the allowance. The other three called
        // `recordVisit` - the thing that feeds the scandal streak - and poker
        // did not, so a player who only played poker could sit at a table
        // every quarter for a decade and the board never heard.
        expect(codeOfW('logic', 'usePokerLogic.ts')).toMatch(/recordVisit\(\)/);
    });
});

describe('the quarter has an allowance', () => {
    const { useCasinoRiskStore } = require('../../core/store/useCasinoRiskStore');
    const { MAX_REP_PER_QUARTER } = require('./data/casinoData');

    beforeEach(() => useCasinoRiskStore.getState().reset());

    it('and it runs out', () => {
        // Without this the seven room ladder falls in one evening: there is no
        // energy cost on the casino and no cap on hands played.
        const st = () => useCasinoRiskStore.getState();
        expect(st().bankReputation(MAX_REP_PER_QUARTER)).toBe(MAX_REP_PER_QUARTER);
        expect(st().bankReputation(10)).toBe(0);
        expect(st().bankReputation(1)).toBe(0);
    });

    it('and it hands back only what is left', () => {
        const st = () => useCasinoRiskStore.getState();
        st().bankReputation(MAX_REP_PER_QUARTER - 3);
        expect(st().bankReputation(10)).toBe(3);
    });

    it('and it refills with the quarter', () => {
        const st = () => useCasinoRiskStore.getState();
        st().bankReputation(MAX_REP_PER_QUARTER);
        st().recordVisit();
        st().closeQuarter(1);
        expect(st().bankReputation(10)).toBe(10);
    });

    it('and a whole ladder takes years rather than an afternoon', () => {
        // Twelve quarters at 50 a quarter, which is about three years of
        // turning up. It WAS forty two - ten and a half years - and that is
        // what "it is absurdly hard to make progress" was measuring. The
        // MONEY is untouched: you can still lose a fortune in one sitting.
        const quartersForTheLadder = CASINO_LADDER_TOP / MAX_REP_PER_QUARTER;
        expect(quartersForTheLadder).toBe(12);
        expect(quartersForTheLadder).toBeGreaterThanOrEqual(8);
    });

    it('and asking for nothing is not a way to bank something', () => {
        const st = () => useCasinoRiskStore.getState();
        expect(st().bankReputation(0)).toBe(0);
        expect(st().bankReputation(-50)).toBe(0);
        expect(st().bankReputation(NaN)).toBe(0);
    });
});

describe('the bar counts towards the last room', () => {
    const fsb = require('fs');
    const pathb = require('path');
    const readB = (...p: string[]) => fsb.readFileSync(pathb.join(__dirname, ...p), 'utf8');

    it('in the lobby AND on every game screen', () => {
        // Reported as "hala 700". CasinoScreen had one copy of the number and
        // CasinoHeader had another, so fixing the lobby left every table
        // still counting towards a figure that matches no room.
        for (const f of [
            ['screens', 'CasinoScreen.tsx'],
            ['components', 'CasinoHeader.tsx'],
        ]) {
            const src = readB(...f)
                .split('\n')
                .filter((l: string) => !/^\s*(\/\/|\*)/.test(l))
                .join('\n');
            expect(src).toContain('CASINO_LADDER_TOP');
            expect(src).not.toMatch(/\/ 700/);
        }
    });
});

describe('the slots screen', () => {
    const fss = require('fs');
    const paths = require('path');
    // JSX block comments too: the note explaining why the ScrollView went
    // away contains the word ScrollView, and its continuation lines start
    // with neither a slash nor a star.
    const src: string = fss.readFileSync(
        paths.join(__dirname, 'screens', 'SlotsGameScreen.tsx'), 'utf8')
        .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '')
        .split('\n')
        .filter((l: string) => !/^\s*(\/\/|\*)/.test(l))
        .join('\n');

    it('does not scroll, so the button is never below the fold', () => {
        // A ScrollView is what put SPIN under the tab bar: the content is
        // taller than the space, so at rest the control the screen exists for
        // was hidden and had to be scrolled up to.
        expect(src).not.toMatch(/<ScrollView/);
        expect(src).not.toMatch(/ScrollView,/);
    });

    it('and keeps the controls clear of the nav bar', () => {
        expect(src).toMatch(/paddingBottom: NAV_BAR_CLEARANCE/);
        expect(src).toMatch(/justifyContent: 'space-between'/);
    });
});
