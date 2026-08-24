// src/features/casino/logic/slotsData.test.ts
//
// ============================================================================
//  THE MACHINE THAT TOOK FORTY FIVE PER CENT AND THE TABLE NOBODY READ
// ============================================================================
//
//  Two faults, and the second is why the first went unnoticed for so long.
//
//    THE PAYOUT TABLES WERE DEAD. Three machines, each with five multipliers
//    and a two-of-a-kind rate - eighteen hand-written numbers - and nothing
//    anywhere read one of them. `processResult` paid a flat `bet * 3` for a
//    jackpot and `bet * 2` for a mini, whatever landed. The reels were
//    scenery, and the three machines differed only in which pictures went
//    past.
//
//    AND THE RETURN WAS 0.548. A jackpot at one in fourteen paying three
//    times, a mini at one in six paying two: multiply and add and the player
//    loses forty five cents of every dollar. Real machines return 0.92 to
//    0.96. Nobody had put the two lines together, because the two lines were
//    in different files from the table that was supposed to govern them.
//
//  So the fix is not new numbers. Numbers get edited. The two-of-a-kind rate
//  is SOLVED from the payout table and the target return now, so a machine
//  cannot drift off its return however anybody tunes it.
// ============================================================================

import {
    SLOT_CONFIG,
    VARIANTS,
    TARGET_RTP,
    expectedReturn,
    meanJackpot,
    miniOdds,
    isBalanced,
    iconStrip,
    colourOfIcon,
    symbolByIcon,
    symbolsFor,
    VALUE_COLOURS,
    type SlotVariant,
} from './slotsData';
import { CASINO_LOCATIONS } from '../data/casinoData';

/** Whatever the first room shows, for the tests that need faces at all. */
const FACES = CASINO_LOCATIONS[0].slotFaces;
const symbolsOf = (v: SlotVariant) => symbolsFor(SLOT_CONFIG[v], FACES);

const isEmoji = (s: string): boolean =>
    [...s].some(ch => {
        const o = ch.codePointAt(0) ?? 0;
        return (o >= 0x1F300 && o <= 0x1FAFF)
            || (o >= 0x2600 && o <= 0x27BF)
            || (o >= 0x2B00 && o <= 0x2BFF)
            || o === 0xFE0F;
    });

describe('what the house takes', () => {
    it.each(VARIANTS)('is the same on every machine, including %s', (v) => {
        // The old three all shared 1/14 and 1/6 and returned 0.548. These
        // three are tuned to one figure so that choosing a machine is a
        // choice about variance rather than about value.
        expect(expectedReturn(SLOT_CONFIG[v])).toBeCloseTo(TARGET_RTP, 3);
    });

    it('and it is an ordinary house edge rather than a mugging', () => {
        expect(TARGET_RTP).toBeGreaterThan(0.9);
        expect(TARGET_RTP).toBeLessThan(1);
        // What it replaced.
        const OLD_RTP = (1 / 14) * 3 + (1 / 6) * 2;
        expect(OLD_RTP).toBeLessThan(0.6);
        expect(TARGET_RTP - OLD_RTP).toBeGreaterThan(0.35);
    });

    it('and it holds when somebody edits a payout, which is the point', () => {
        // The rate for two of a kind is solved, not stored. Raise a payout by
        // half and the machine rebalances itself instead of quietly becoming
        // a gift, which is what the old flat 3x could never do.
        const generous = {
            ...SLOT_CONFIG.boardroom,
            payouts: SLOT_CONFIG.boardroom.payouts.map(p => p * 1.5) as any,
        };
        expect(isBalanced(generous)).toBe(true);
        expect(expectedReturn(generous)).toBeCloseTo(TARGET_RTP, 3);
    });

    it('and it says so when it cannot, rather than paying out anyway', () => {
        // FOUND BY THIS TEST. Solving the second prize absorbs an edit only
        // while there is slack to absorb it with. Double the Dynasty's
        // payouts and the jackpot leg ALONE is 1.32 of the stake - there is
        // no second prize small enough to fix that, and the machine would
        // have run at a hundred and thirty per cent in the player's favour
        // without a word. `isBalanced` is the word.
        const absurd = {
            ...SLOT_CONFIG.dynasty,
            payouts: SLOT_CONFIG.dynasty.payouts.map(p => p * 2) as any,
        };
        expect(isBalanced(absurd)).toBe(false);
        expect(miniOdds(absurd)).toBe(0);
    });

    it('and all three that ship are balanced', () => {
        for (const v of VARIANTS) {
            expect(isBalanced(SLOT_CONFIG[v])).toBe(true);
        }
    });

    it('and a machine that pays too much on the jackpot alone stops paying twos', () => {
        // The clamp. If the jackpot leg alone exceeds the target there is
        // nothing left for the second prize, and the answer is zero rather
        // than a negative probability.
        const absurd = {
            ...SLOT_CONFIG.ticker,
            payouts: SLOT_CONFIG.ticker.payouts.map(() => 1000) as any,
        };
        expect(miniOdds(absurd)).toBe(0);
        expect(miniOdds(absurd)).not.toBeNaN();
    });
});

describe('the three machines', () => {
    it('are a volatility ladder rather than a quality ladder', () => {
        // The Ticker hits often and small, the Dynasty rarely and hugely.
        const j = (v: SlotVariant) => SLOT_CONFIG[v].jackpotOdds;
        expect(j('ticker')).toBeGreaterThan(j('boardroom'));
        expect(j('boardroom')).toBeGreaterThan(j('dynasty'));

        const top = (v: SlotVariant) => Math.max(...SLOT_CONFIG[v].payouts);
        expect(top('ticker')).toBeLessThan(top('boardroom'));
        expect(top('boardroom')).toBeLessThan(top('dynasty'));
    });

    it('and the rare one really is rare', () => {
        expect(1 / SLOT_CONFIG.dynasty.jackpotOdds).toBeGreaterThan(40);
        expect(1 / SLOT_CONFIG.ticker.jackpotOdds).toBeLessThan(12);
    });

    it('and a spin cannot be a jackpot and a mini at once', () => {
        for (const v of VARIANTS) {
            const c = SLOT_CONFIG[v];
            expect(c.jackpotOdds + miniOdds(c)).toBeLessThanOrEqual(1);
        }
    });

    it('and every one of them can still lose', () => {
        for (const v of VARIANTS) {
            const c = SLOT_CONFIG[v];
            expect(c.jackpotOdds + miniOdds(c)).toBeLessThan(0.9);
        }
    });
});

describe('the symbols', () => {
    it('are icons, not emoji', () => {
        // Thirteen of them across the old three, in a codebase that has now
        // removed emoji from the product screens and the proposal sheet for
        // exactly this reason.
        for (const v of VARIANTS) {
            for (const s of symbolsOf(v)) {
                expect(isEmoji(s.icon)).toBe(false);
            }
            expect(isEmoji(SLOT_CONFIG[v].icon)).toBe(false);
            expect(isEmoji(SLOT_CONFIG[v].title)).toBe(false);
        }
    });

    it('and they are about this game rather than another one', () => {
        // "Street Fighter Slots" and "Poseidon's Fortune", in a game about a
        // succession. Asked for as "bizim oyuna gore, temaya gore".
        const titles = VARIANTS.map(v => SLOT_CONFIG[v].title).join(' ');
        expect(titles).not.toMatch(/street fighter|poseidon/i);
        expect(titles).toMatch(/Ticker/);
        expect(titles).toMatch(/Boardroom/);
        expect(titles).toMatch(/Dynasty/);
    });

    it('and each machine has five distinct ones', () => {
        for (const v of VARIANTS) {
            const icons = iconStrip(symbolsOf(v));
            expect(icons).toHaveLength(5);
            expect(new Set(icons).size).toBe(5);
        }
    });

    it('and every icon on the strip can be priced', () => {
        // The payout reads the symbol back off the landed reel, so a strip
        // entry with no symbol behind it would pay the fallback and nobody
        // would notice.
        for (const v of VARIANTS) {
            const syms = symbolsOf(v);
            for (const icon of iconStrip(syms)) {
                expect(symbolByIcon(syms, icon)).toBeDefined();
                expect(symbolByIcon(syms, icon)!.payout).toBeGreaterThan(0);
            }
            expect(symbolByIcon(syms, 'not-a-symbol')).toBeUndefined();
        }
    });
});

describe('the payouts themselves', () => {
    it('climb within a machine, so a rarer face is worth more', () => {
        for (const v of VARIANTS) {
            const p = SLOT_CONFIG[v].payouts;
            for (let i = 1; i < p.length; i++) {
                expect(p[i]).toBeGreaterThan(p[i - 1]);
            }
        }
    });

    it('and three of a kind always beats two', () => {
        for (const v of VARIANTS) {
            const c = SLOT_CONFIG[v];
            expect(Math.min(...c.payouts)).toBeGreaterThan(c.twoKindMultiplier);
        }
    });

    it('and the mean is what a jackpot is worth on average', () => {
        expect(meanJackpot(SLOT_CONFIG.ticker)).toBeCloseTo((3 + 4 + 5 + 6 + 9) / 5, 6);
        expect(meanJackpot({ ...SLOT_CONFIG.ticker, payouts: [] as any })).toBe(0);
    });
});


// ============================================================================
//  AND THE COLOUR, WHICH IS THE PAYOUT TABLE DRAWN
// ============================================================================
//
//  Every symbol on a reel was tinted with the ROOM's colour, so five
//  different things arrived in one colour and a machine read as a column of
//  identical shapes. Reported as "daha renkli".
//
//  More colours alone would have fixed the look and wasted the chance. They
//  climb with the payout, so a player learns what a good face looks like
//  before they have read a number and a near miss on the crown is visible
//  from across the reel.
// ============================================================================

import { palette, theme } from '../../../core/theme';

describe('the colours', () => {
    it('are a different one for every rung', () => {
        expect(new Set(VALUE_COLOURS).size).toBe(VALUE_COLOURS.length);
    });

    it('and they come from the palette rather than a hex somebody liked', () => {
        const known = new Set(Object.values(palette) as string[]);
        for (const c of VALUE_COLOURS) expect(known.has(c)).toBe(true);
    });

    it('and they are never the profit or the loss colour', () => {
        for (const c of VALUE_COLOURS) {
            expect(c).not.toBe(theme.colors.success);
            expect(c).not.toBe(theme.colors.danger);
        }
    });

    it('and the same ramp is used in every city, so the reading travels', () => {
        // A player who learns that orange is the good one in Athens should
        // not have to learn it again in Macau.
        for (const loc of CASINO_LOCATIONS) {
            const syms = symbolsFor(SLOT_CONFIG.dynasty, loc.slotFaces);
            expect(syms.map(x => x.colour)).toEqual([...VALUE_COLOURS]);
        }
    });

    it('and the reel can look one up, with a visible fallback', () => {
        const syms = symbolsOf('dynasty');
        expect(colourOfIcon(syms, syms[4].icon)).toBe(VALUE_COLOURS[4]);
        expect(colourOfIcon(syms, 'not-a-symbol')).toBe('#FFFFFF');
    });
});

describe('a slot per city', () => {
    it('gives every room its own five faces', () => {
        for (const loc of CASINO_LOCATIONS) {
            expect(loc.slotFaces).toHaveLength(5);
            expect(new Set(loc.slotFaces).size).toBe(5);
        }
    });

    it('and no two rooms look the same', () => {
        // "her sehre ayri slot yap, sadece sembollerini degistir". If two
        // cities shared a set the whole change would be invisible in half
        // the game.
        const seen = CASINO_LOCATIONS.map(l => l.slotFaces.join('|'));
        expect(new Set(seen).size).toBe(CASINO_LOCATIONS.length);
    });

    it('and the jackpot face is the city itself', () => {
        // Index 4 is always the top payout, so the emblem the player already
        // knows the room by is the one worth the most.
        for (const loc of CASINO_LOCATIONS) {
            expect(loc.slotFaces[4]).toBe(loc.theme.icon);
        }
    });

    it('while the maths does not move an inch between them', () => {
        // The whole point of the split: seven rooms, one payout table.
        for (const loc of CASINO_LOCATIONS) {
            for (const v of VARIANTS) {
                const syms = symbolsFor(SLOT_CONFIG[v], loc.slotFaces);
                expect(syms.map(x => x.payout)).toEqual([...SLOT_CONFIG[v].payouts]);
            }
        }
    });

    it('and a room with too few faces still fills the reel', () => {
        // Never an undefined icon on a strip, which renders as nothing.
        const syms = symbolsFor(SLOT_CONFIG.ticker, ['cash']);
        expect(syms).toHaveLength(5);
        for (const x of syms) expect(typeof x.icon).toBe('string');
    });
});
