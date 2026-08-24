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

    it('asks a hundred to leave the first room', () => {
        // The one gate the player actually climbs at five points a spin.
        expect(CASINO_LOCATIONS[1].requirement).toBe(100);
    });

    it('and four hundred for every one after', () => {
        // Two hundred was the alternative and it is one hand at the top of
        // Istanbul's chip range, which is how the ladder collapsed the first
        // time. Four hundred is the smallest step that still costs more than
        // a single maximum bet at the bottom of each tier.
        for (let i = 2; i < CASINO_LOCATIONS.length; i++) {
            const step = CASINO_LOCATIONS[i].requirement - CASINO_LOCATIONS[i - 1].requirement;
            expect(step).toBe(400);
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
        for (const room of CASINO_LOCATIONS) {
            const smallest = Math.min(...room.chips);
            const largest = Math.max(...room.chips);
            expect(reputationForBet(smallest)).toBeLessThanOrEqual(MAX_REP_PER_BET);
            expect(reputationForBet(largest)).toBeLessThanOrEqual(MAX_REP_PER_BET);
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
        const step = 400;
        expect(Math.ceil(step / MAX_REP_PER_BET)).toBe(16);
    });

    it('while the first room is still the quick one it was', () => {
        // Athens tops out at a 50,000 chip, which is under the cap, so
        // nothing about the opening changed.
        const athens = CASINO_LOCATIONS[0];
        expect(reputationForBet(Math.max(...athens.chips))).toBe(5);
        expect(CASINO_LOCATIONS[1].requirement / 5).toBe(20);
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
        expect(HIGH_ROLLER_REPUTATION).toBe(byId('london').requirement);
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
        // 400 a gate at 50 a quarter is eight quarters, and the walk from
        // Athens to Macau is about ten years of turning up. The MONEY is
        // untouched - you can still lose a fortune in one sitting. It is the
        // standing that takes a career, which is the right way round.
        const quartersForTheLadder = CASINO_LADDER_TOP / MAX_REP_PER_QUARTER;
        expect(quartersForTheLadder).toBeGreaterThanOrEqual(40);
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
