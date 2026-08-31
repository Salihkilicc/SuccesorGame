// src/features/casino/vipRoom.test.ts
//
// ============================================================================
//  THE ROOM YOU CANNOT PRESS TWICE
// ============================================================================
//
//  Asked for as: "if your cash is over a billion put a VIP button top right.
//  Build a casino you play with a percentage of your whole fortune, only
//  people over ten billion get in, ten / twenty five / fifty / a hundred per
//  cent of your money, and you can only go once every five quarters. Make it
//  extremely premium. This is preparation."
//
//  THREE GATES DOING THREE JOBS. One billion makes the button exist; ten
//  billion opens it; five quarters is what turns it into a mechanic. Without
//  the cooldown a hundred per cent bet is not a risk, it is a button you press
//  until it comes up heads - and a bet you may repeat is a wait, not a wager.
//
//  AND IT FOUND A LIVE BUG ON THE WAY IN. `currentLocationId` was `useState`
//  inside `useCasinoSystem`, which every screen calls separately, so the
//  lobby, the slots, the blackjack table and the roulette wheel each had their
//  own copy and all four started at Athens. Travelling to Macau and then
//  opening a game put the player back at the cheapest table in the game with
//  the cheapest chips, silently. The VIP room cannot work at all without that
//  being shared, which is how it surfaced.
// ============================================================================

import {
    VIP_BET_FRACTIONS,
    VIP_CASH_TO_ENTER,
    VIP_CASH_TO_SEE,
    VIP_COOLDOWN_QUARTERS,
    VIP_LOCATION_ID,
    canSeeVip,
    richEnoughForVip,
    vipChipsFor,
    vipEntry,
    vipMaxBet,
} from './data/vipRoom';
import { VIP_LOCATION, CASINO_LOCATIONS } from './data/casinoData';
import { chipsFor, maxBetFor } from './data/casinoStakes';

const RICH = 40_000_000_000;

describe('three gates, and they are not the same gate', () => {
    it('a billion makes the door visible', () => {
        expect(canSeeVip(VIP_CASH_TO_SEE)).toBe(true);
        expect(canSeeVip(VIP_CASH_TO_SEE - 1)).toBe(false);
        expect(VIP_CASH_TO_SEE).toBe(1_000_000_000);
    });

    it('and ten billion opens it', () => {
        expect(richEnoughForVip(VIP_CASH_TO_ENTER)).toBe(true);
        expect(richEnoughForVip(VIP_CASH_TO_ENTER - 1)).toBe(false);
        expect(VIP_CASH_TO_ENTER).toBe(10_000_000_000);
    });

    it('and seeing is a long way below entering, which is the point', () => {
        // You are meant to know the room is there and not be able to use it.
        expect(VIP_CASH_TO_SEE).toBeLessThan(VIP_CASH_TO_ENTER);
        expect(canSeeVip(5_000_000_000)).toBe(true);
        expect(richEnoughForVip(5_000_000_000)).toBe(false);
    });

    it('and a billionaire who is not a ten billionaire is told which it is', () => {
        expect(vipEntry(5_000_000_000, null, 40).reason).toBe('tooPoor');
    });
});

describe('the cooldown is what makes it a decision', () => {
    it('somebody who has never been walks straight in', () => {
        expect(vipEntry(RICH, null, 40).allowed).toBe(true);
    });

    it('and having been, they wait five quarters', () => {
        for (let q = 0; q < VIP_COOLDOWN_QUARTERS; q++) {
            const e = vipEntry(RICH, 40, 40 + q);
            expect(`q+${q}:${e.allowed}`).toBe(`q+${q}:false`);
            expect(e.reason).toBe('tooSoon');
        }
        expect(vipEntry(RICH, 40, 40 + VIP_COOLDOWN_QUARTERS).allowed).toBe(true);
    });

    it('and it counts down, so the button can say how long', () => {
        expect(vipEntry(RICH, 40, 40).quartersLeft).toBe(5);
        expect(vipEntry(RICH, 40, 43).quartersLeft).toBe(2);
        expect(vipEntry(RICH, 40, 45).quartersLeft).toBe(0);
    });

    it('and five quarters is fifteen months, which is the number that was asked for', () => {
        expect(VIP_COOLDOWN_QUARTERS).toBe(5);
    });

    it('and money is checked before the clock, so the fixable thing is named first', () => {
        // Broke AND early. Telling them to come back in three quarters would
        // be true and useless.
        expect(vipEntry(100, 40, 41).reason).toBe('tooPoor');
    });

    it('and a save from a different clock opens the door rather than sealing it', () => {
        // A stamp in the future would otherwise lock the room forever.
        expect(vipEntry(RICH, 900, 40).allowed).toBe(true);
        expect(vipEntry(RICH, NaN as any, 40).allowed).toBe(true);
    });
});

describe('the stakes are four answers to one question', () => {
    it('ten, twenty five, fifty and all of it', () => {
        expect(VIP_BET_FRACTIONS).toEqual([0.10, 0.25, 0.50, 1.00]);
    });

    it('and they are shares of what you have, not a rail of denominations', () => {
        expect(vipChipsFor(RICH)).toEqual([
            4_000_000_000, 10_000_000_000, 20_000_000_000, 40_000_000_000,
        ]);
    });

    it('and the largest one really is everything', () => {
        expect(vipMaxBet(RICH)).toBe(RICH);
        expect(vipChipsFor(RICH)[3]).toBe(vipMaxBet(RICH));
    });

    it('and it is rounded DOWN, or the last chip cannot be covered', () => {
        // A bet a penny larger than the bankroll is a crash, not a gamble.
        const odd = 10_000_000_007.7;
        for (const c of vipChipsFor(odd)) expect(c).toBeLessThanOrEqual(odd);
        expect(Number.isInteger(vipMaxBet(odd))).toBe(true);
    });

    it('and rubbish in does not produce rubbish out', () => {
        expect(vipChipsFor(NaN)).toEqual([0, 0, 0, 0]);
        expect(vipChipsFor(-5)).toEqual([0, 0, 0, 0]);
        expect(vipMaxBet(NaN)).toBe(0);
    });
});

describe('and the room routes through the same functions as every other', () => {
    it('so no table can hand it a Macau rail by mistake', () => {
        // Five call sites ask `chipsFor`. Special casing them one at a time is
        // how one of them ends up wrong.
        expect(chipsFor(VIP_LOCATION, RICH)).toEqual(vipChipsFor(RICH));
        expect(maxBetFor(VIP_LOCATION, RICH)).toBe(RICH);
    });

    it('and the ordinary rooms are untouched by it', () => {
        for (const l of CASINO_LOCATIONS) {
            expect(maxBetFor(l, RICH)).toBe(Math.floor(RICH * l.maxBetPercent));
        }
    });
});

describe('it is not on the ladder', () => {
    it('and it is not in the array that every progress bar walks', () => {
        // THE DESIGN DECISION. In the array it would get a `requirement` it
        // does not have and a place on a bar it does not belong on.
        expect(CASINO_LOCATIONS.map(l => l.id)).not.toContain(VIP_LOCATION_ID);
        expect(VIP_LOCATION.id).toBe(VIP_LOCATION_ID);
    });

    it('and its requirement is zero, so a screen that reads it anyway lets you in', () => {
        // Rather than locking a room somebody already paid ten billion to see.
        expect(VIP_LOCATION.requirement).toBe(0);
    });

    it('and it is gold on near black, with silver and violet', () => {
        // The palette that was asked for. Darker than any other room, because
        // the gold has to be the only thing lit.
        expect(VIP_LOCATION.theme.primary).toBe('#EFC94C');
        expect(VIP_LOCATION.theme.secondary).toBe('#C4B5FD');
        expect(VIP_LOCATION.theme.chipColor).toBe('#D8D8DE');
        for (const c of VIP_LOCATION.theme.bgGradient) {
            const lum = parseInt(c.slice(1, 3), 16) + parseInt(c.slice(3, 5), 16) + parseInt(c.slice(5, 7), 16);
            expect(`${c}:${lum}`).toBeTruthy();
            expect(lum).toBeLessThan(80);
        }
    });

    it('and it carries no flag, because it is not anywhere', () => {
        expect(VIP_LOCATION.theme.flag).toBe('');
        for (const l of CASINO_LOCATIONS) expect(l.theme.flag).not.toBe('');
    });

    it('and its faces are objects rather than a landmark', () => {
        expect(VIP_LOCATION.slotFaces).toHaveLength(5);
        // The last face is the jackpot and is always the room's own emblem.
        expect(VIP_LOCATION.slotFaces[4]).toBe(VIP_LOCATION.theme.icon);
    });
});

describe('the wiring', () => {
    const fs = require('fs');
    const read = (p: string) => fs.readFileSync(__dirname + '/' + p, 'utf8');

    it('the room the player is in is SHARED, which it was not', () => {
        // THE BUG THIS FOUND. Local state in a hook that four screens call.
        const hook = read('hooks/useCasinoSystem.ts');
        expect(hook).toMatch(/useCasinoRiskStore\(s => s\.currentLocationId\)/);
        expect(hook).not.toMatch(/useState<LocationId>\('athens'\)/);
    });

    it('and it survives a save, or travelling is forgotten on every launch', () => {
        expect(fs.readFileSync(__dirname + '/../../core/store/useCasinoRiskStore.ts', 'utf8'))
            .toMatch(/currentLocationId: state\.currentLocationId/);
    });

    it('and the cooldown stamp survives one too', () => {
        expect(fs.readFileSync(__dirname + '/../../core/store/useCasinoRiskStore.ts', 'utf8'))
            .toMatch(/lastVipQuarter: state\.lastVipQuarter/);
    });

    it('and the auto switch does not throw the player out of the VIP room', () => {
        // It kicks you to the highest room your STANDING allows, and the VIP
        // room is never in that list. Without the guard, entering it would
        // bounce you straight back to Macau.
        expect(read('hooks/useCasinoSystem.ts')).toMatch(/if \(inVip\) return;/);
    });

    it('and the visit is stamped on entry rather than on the first bet', () => {
        // The cooldown is on the invitation. Walking in, reading the numbers
        // and walking out has used it, which is what makes the decision cost
        // something before it is made.
        const hook = read('hooks/useCasinoSystem.ts');
        expect(hook).toMatch(/recordVipVisit\(currentQuarter\(\)\)/);
    });

    it('and the button only exists above a billion', () => {
        expect(read('screens/CasinoScreen.tsx')).toMatch(/\{vipVisible && \(/);
    });

    it('and a refusal says something rather than doing nothing', () => {
        const screen = read('screens/CasinoScreen.tsx');
        expect(screen).toMatch(/setVipPanel\(/);
        expect(screen).toMatch(/casino\.vipSoonBody/);
        expect(screen).toMatch(/casino\.vipLockedBody/);
    });

    it('and it speaks both languages, without a dash', () => {
        // Named rather than matched by prefix: `casino.vipStatus` already
        // existed and counting by prefix made this test about somebody else's
        // key. It failed on that, which is the test working.
        const keys = [
            'casino.vipTitle', 'casino.vipEnter', 'casino.vipSoon',
            'casino.vipLocked', 'casino.vipSoonBody', 'casino.vipLockedBody',
        ];
        for (const f of ['tr', 'en']) {
            const src = fs.readFileSync(__dirname + `/../../core/i18n/${f}.ts`, 'utf8');
            const lines = keys.map(k => {
                const line = src.split('\n').find((l: string) => l.includes(`'${k}':`));
                expect(`${f}:${k}:${!!line}`).toBe(`${f}:${k}:true`);
                return line as string;
            });
            for (const l of lines) {
                expect(l).not.toMatch(/[—–]/);
                expect(l.replace(/^.*?':/, '')).not.toMatch(/ - /);
            }
        }
    });
});
