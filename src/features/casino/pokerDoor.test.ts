// src/features/casino/pokerDoor.test.ts
//
// ============================================================================
//  THE WIRING FOR THE DOOR PRICE AND THE RAISE LADDER
// ============================================================================
//
//  The engine side is in core/casino/pokerStakes.test.ts, including why the
//  raise is a share of your stack rather than of the pot. This is the half
//  that decides whether any of it reaches the player.
//
//  Worth pinning carefully, because the failure this codebase produces over and
//  over is not a wrong calculation. It is a correct one that nothing reads.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { RAISE_STEPS, blindFor, pokerBuyIn } from '../../core/casino/pokerStakes';
import { VIP_POKER_SHARE, pokerBuyInFor } from './data/casinoStakes';
import { CASINO_LOCATIONS } from './data/casinoData';
import { VIP_LOCATION_ID } from './data/vipRoom';

const read = (...p: string[]) => fs.readFileSync(path.join(__dirname, ...p), 'utf8');
const screen = () => read('screens', 'PokerGameScreen.tsx');
const hook = () => read('logic', 'useSixHandedPoker.ts');

describe('every room posts a price, and it is its own share', () => {
    it('each city charges exactly what it plays for', () => {
        const money = 2_000_000_000;
        for (const loc of CASINO_LOCATIONS) {
            if (loc.id === VIP_LOCATION_ID) continue;
            expect([loc.id, pokerBuyInFor(loc, money)])
                .toEqual([loc.id, pokerBuyIn(money, loc.maxBetPercent, loc.minMaxBet)]);
        }
    });

    it('and the VIP room charges a tenth of everything, by name', () => {
        expect(VIP_POKER_SHARE).toBe(0.10);
        const vip = CASINO_LOCATIONS.find(l => l.id === VIP_LOCATION_ID)
            ?? { id: VIP_LOCATION_ID } as any;
        expect(pokerBuyInFor(vip, 5_000_000_000)).toBe(500_000_000);
    });

    it('and no two rooms cost the same, or the ladder means nothing', () => {
        const money = 5_000_000_000;
        const prices = CASINO_LOCATIONS.map(l => pokerBuyInFor(l, money));
        expect(new Set(prices).size).toBe(prices.length);
    });

    it('and a richer player pays more everywhere', () => {
        // The whole point of a share. A fixed price is right for one fortune.
        for (const loc of CASINO_LOCATIONS) {
            const poor = pokerBuyInFor(loc, 1_000_000_000);
            const rich = pokerBuyInFor(loc, 100_000_000_000);
            expect([loc.id, rich > poor]).toEqual([loc.id, true]);
        }
    });
});

describe('and the screen shows the price rather than a rack', () => {
    it('the chip selector is gone from poker', () => {
        // It was borrowed from the one-shot games and asked a question a
        // poker door does not have.
        const src = screen();
        expect(src).not.toMatch(/<CustomChipSelector/);
        expect(src).not.toMatch(/from '\.\.\/components\/CustomChipSelector'/);
    });

    it('and the door price is read reactively, not once at mount', () => {
        // THE TRAP. `getState()` here would freeze the price at whatever the
        // wallet held when the screen opened, and the price is a share OF
        // that wallet.
        const src = screen();
        expect(src).toMatch(/const wallet = useStatsStore\(st => st\.money\)/);
        expect(src).toMatch(/const doorPrice = pokerBuyInFor\(currentLocation, wallet\)/);
        expect(src).not.toMatch(/useStatsStore\.getState\(\)\.money/);
    });

    it('and it is handed to the hook, or the room is decoration', () => {
        const src = screen();
        expect(src).toMatch(/useSixHandedPoker\([\s\S]{0,160}doorPrice,/);
        expect(hook()).toMatch(/roomBuyIn\?: number/);
    });

    it('and the blind is derived from it rather than chosen', () => {
        const src = hook();
        expect(src).toMatch(/const ante = blindFor\(buyIn\)/);
        expect(src).not.toMatch(/const \[ante, setAnte\]/);
    });

    it('and the door says what the blinds will be', () => {
        // A buy-in on its own does not tell a poker player what game it is.
        expect(screen()).toMatch(/casino\.blindsAre/);
    });
});

describe('and raising is a choice again', () => {
    it('the four steps reach the screen', () => {
        const src = screen();
        expect(src).toMatch(/raiseSteps\.map\(step =>/);
        expect(src).toMatch(/onPress=\{\(\) => actions\.setRaisePct\(step\)\}/);
        expect(RAISE_STEPS.length).toBe(4);
    });

    it('and plus and minus are there', () => {
        const src = screen();
        expect(src).toMatch(/actions\.nudgeRaisePct\(-5\)/);
        expect(src).toMatch(/actions\.nudgeRaisePct\(5\)/);
    });

    it('and the fixed pot sized raise is gone', () => {
        // THE DEFECT. One button reading Math.max(pot, ante * 2) removes the
        // one decision poker is actually about.
        expect(screen()).not.toMatch(/act\('raise', Math\.max\(pot, ante \* 2\)\)/);
    });

    it('and the button spends the SAME number it prints', () => {
        // Computing it in the screen as well as the hook is how a button ends
        // up lying about what it will do.
        const src = screen();
        expect(src).toMatch(/act\('raise', raiseChips\)/);
        expect(src).toMatch(/money\(raiseChips\)/);
        expect(hook()).toMatch(/raiseChips: round\s*\n\s*\? raiseAmount\(raisePct/);
    });

    it('and it says ALL IN when it is all in', () => {
        const src = screen();
        expect(src).toMatch(/allIn \? t\('casino\.allIn'\)/);
    });
});

describe('and the new strings exist in both languages, without a dash', () => {
    const KEYS = ['casino.buyInLabel', 'casino.blindsAre', 'casino.allIn'];
    const i18n = (f: string) =>
        fs.readFileSync(path.join(__dirname, '..', '..', 'core', 'i18n', f), 'utf8');

    it('both files carry them', () => {
        for (const f of ['en.ts', 'tr.ts']) {
            for (const k of KEYS) {
                expect([f, k, i18n(f).includes(`'${k}'`)]).toEqual([f, k, true]);
            }
        }
    });

    it('and none of them uses a dash', () => {
        for (const f of ['en.ts', 'tr.ts']) {
            const src = i18n(f);
            for (const k of KEYS) {
                const line = src.split('\n').find(l => l.includes(`'${k}'`)) || '';
                expect([f, k, /—|–| - /.test(line)]).toEqual([f, k, false]);
            }
        }
    });
});
