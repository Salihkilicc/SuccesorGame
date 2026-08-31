// src/core/market/unaffectedPrice.test.ts
//
// ============================================================================
//  YOU COULD BREAK THE COMPANY ON PURPOSE AND BUY IT BACK FOR THE CHANGE
// ============================================================================
//
//  Reported as: "I can create losses on purpose, take a billion dollar company
//  down to a million, and then buy the shares out. It is an exploit, I can take
//  the company over easily, and it works during the first four years of founder
//  protection too."
//
//  The founder protection was never the guard here and could not have been: it
//  stops the BOARD REMOVING THE CEO, and this is the CEO doing the buying. See
//  FOUNDER_GRACE_PERIOD_QUARTERS.
//
//  The real hole was one line. `askPerShare = market * (1 + premium)`, where
//  `market` is the spot price, which the player controls. Measured on one
//  company, healthy against deliberately wrecked (cash spent, debt loaded,
//  earnings driven negative):
//
//      HEALTHY   valuation $7,029.2M   $702.92 a share   whole board $8,217.10M
//      WRECKED   valuation     $1.5M     $0.15 a share   whole board     $1.75M
//
//  The board's ask fell by EXACTLY the ratio the price fell by, to six decimal
//  places, because spot was its only input.
//
//  THE FIX IS THE UNAFFECTED PRICE, which is what real takeovers are measured
//  against: not the screen on the day, but what the stock was worth before the
//  thing that moved it. Measured through the same crash with the reference
//  running, the whole board costs:
//
//      quarter      spot    reference    board     board without the fix
//      start     $702.92     $702.92   $8,217.1M
//      q4         $28.97     $470.90   $5,504.9M          $338.63M
//      q8          $1.33     $284.48   $3,325.6M           $15.57M
//      q12         $0.20     $170.74   $1,996.0M            $2.32M
//
//  Twelve quarters of deliberately destroying the company, and control still
//  costs two billion. The strategy is not merely worse, it is pointless.
//
//  AND AN HONEST DECLINE STILL GETS CHEAP, which is the test that matters,
//  because a rule that only ever says no is a wall rather than a mechanic. A
//  company sliding eight per cent a quarter settles at a steady premium and
//  stays there; it does not run away.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { buyoutAsk, decayReference, UNAFFECTED_DECAY } from './buyout';
import { companyValuation, sharePrice, smoothPrice } from './equity';

const TOTAL = 10_000_000;
const holder = { trust: 50, trait: 'Conservative', shareCount: 1_000_000 };

describe('what the reference does', () => {
    it('follows a rising price at once, because nobody sells cheap into good news', () => {
        expect(decayReference(100, 140)).toBe(140);
        expect(decayReference(100, 100)).toBe(100);
    });

    it('and follows a falling one slowly, which is the whole defence', () => {
        // A 90 per cent crash moves the reference by 12 per cent of the gap.
        expect(decayReference(100, 10)).toBeCloseTo(100 - 90 * UNAFFECTED_DECAY, 6);
        expect(decayReference(100, 10)).toBeGreaterThan(80);
    });

    it('and it forgives eventually, so a real collapse is not remembered forever', () => {
        let ref = 100;
        for (let q = 0; q < 40; q++) ref = decayReference(ref, 10);
        // Ten years on, within a twentieth of the new price.
        expect(ref / 10).toBeLessThan(1.1);
    });

    it('and it starts from the price when there is no history yet', () => {
        expect(decayReference(0, 42)).toBe(42);
        expect(decayReference(NaN, 42)).toBe(42);
    });

    it('and rubbish in does not produce rubbish out', () => {
        expect(decayReference(100, NaN)).toBeCloseTo(88, 6);
        expect(decayReference(-5, 20)).toBe(20);
        expect(Number.isFinite(decayReference(100, -50))).toBe(true);
    });
});

describe('what a director prices a block against', () => {
    it('the higher of the ticker and the reference, never the lower', () => {
        const crashed = buyoutAsk(holder, 1, 'X', 100);
        expect(crashed.basePerShare).toBe(100);
        expect(crashed.pricedOffReference).toBe(true);
    });

    it('and the ticker when the company is genuinely worth more than it was', () => {
        const risen = buyoutAsk(holder, 200, 'X', 100);
        expect(risen.basePerShare).toBe(200);
        expect(risen.pricedOffReference).toBe(false);
    });

    it('and omitting the reference prices off spot exactly as it always did', () => {
        // Every caller written before this, and every test, still means what
        // it meant.
        expect(buyoutAsk(holder, 40, 'X').askTotal).toBe(buyoutAsk(holder, 40, 'X', 0).askTotal);
        expect(buyoutAsk(holder, 40, 'X').askPerShare).toBeCloseTo(40 * (1 + 0.5 + 0.10), 6);
    });

    it('and a holder who will not sell still will not, whatever it is priced off', () => {
        const hostile = buyoutAsk({ trust: 5, trait: 'Shark', shareCount: 100 }, 1, 'S', 1000);
        expect(hostile.canSell).toBe(false);
        expect(hostile.askTotal).toBe(0);
    });
});

describe('the exploit, run end to end', () => {
    const healthy = {
        cash: 300_000_000, ttmRevenue: 900_000_000, ttmEbit: 220_000_000,
        tangibleAssets: 400_000_000, debt: 0, isPublic: true, brandValue: 60, marketShare: 4,
    };
    const wrecked = {
        ...healthy, cash: 5_000_000, ttmRevenue: 120_000_000,
        ttmEbit: -180_000_000, debt: 500_000_000,
    };

    /** The crash the player engineers, quarter by quarter. */
    const crash = (quarters: number) => {
        const hp = sharePrice(companyValuation(healthy as any).total, TOTAL);
        const wv = companyValuation(wrecked as any).total;
        const wp = sharePrice(wv, TOTAL);
        let price = hp;
        let ref = hp;
        for (let q = 0; q < quarters; q++) {
            price = smoothPrice(price, wp, true, wv);
            ref = decayReference(ref, price);
        }
        return { price, ref, start: hp };
    };

    it('wrecking the company really does destroy the share price', () => {
        // The premise is sound and the fix does not pretend otherwise. What it
        // denies is the CONSEQUENCE.
        const { price, start } = crash(12);
        expect(price / start).toBeLessThan(0.001);
    });

    it('but control does not go on sale with it', () => {
        const { price, ref } = crash(12);
        const withFix = buyoutAsk(holder, price, 'X', ref).askTotal;
        const without = buyoutAsk(holder, price, 'X').askTotal;
        expect(withFix / without).toBeGreaterThan(500);
    });

    it('and after three years of it the block still costs a serious fraction of the peak', () => {
        const { price, ref, start } = crash(12);
        const atPeak = buyoutAsk(holder, start, 'X', start).askTotal;
        const now = buyoutAsk(holder, price, 'X', ref).askTotal;
        // Roughly a quarter of what it cost before the sabotage, against a
        // share price that fell by more than three orders of magnitude.
        expect(now / atPeak).toBeGreaterThan(0.15);
    });

    it('and every extra quarter of sabotage still costs more than it saves', () => {
        // The test of whether it is a strategy at all: is the ask falling
        // faster than the damage accumulates? It is not.
        const a = crash(8);
        const b = crash(12);
        const askA = buyoutAsk(holder, a.price, 'X', a.ref).askTotal;
        const askB = buyoutAsk(holder, b.price, 'X', b.ref).askTotal;
        expect(askB).toBeLessThan(askA);
        // But only by a fifth, over a year of running the company into a wall.
        expect(askB / askA).toBeGreaterThan(0.5);
    });
});

describe('and a company that is honestly worth less does get cheaper', () => {
    it('the premium settles rather than running away', () => {
        // Eight per cent a quarter for ten years, nothing engineered. The
        // steady state is algebraic: a ratio k where the reference falls at
        // the same rate as the price, so 0.92k = 0.88k + 0.12, giving k = 3.
        let price = 100;
        let ref = 100;
        const ratios: number[] = [];
        for (let q = 1; q <= 40; q++) {
            price *= 0.92;
            ref = decayReference(ref, price);
            ratios.push(ref / price);
        }
        expect(ratios[ratios.length - 1]).toBeLessThan(3);
        expect(ratios[ratios.length - 1]).toBeGreaterThan(2);
    });

    it('and the block gets cheaper in absolute money the whole way down', () => {
        let price = 100;
        let ref = 100;
        let previous = Infinity;
        for (let q = 1; q <= 40; q++) {
            price *= 0.92;
            ref = decayReference(ref, price);
            const ask = buyoutAsk(holder, price, 'X', ref).askTotal;
            expect(ask).toBeLessThan(previous);
            previous = ask;
        }
    });
});

// ============================================================================
//  AND EVERYTHING THAT ASKS THE QUESTION PASSES THE REFERENCE
// ============================================================================
//  A reference nothing reads is the failure this codebase keeps producing: a
//  correct number computed every quarter that never reaches the decision. And
//  a HALF wired one is worse than none, because the screen would quote a price
//  the store then refuses.
// ============================================================================
describe('the wiring', () => {
    const read = (...p: string[]) =>
        fs.readFileSync(path.join(__dirname, '..', '..', ...p), 'utf8');

    it('the tick computes it every quarter', () => {
        const src = read('core', 'store', 'useGameStore.ts');
        expect(src).toMatch(/sharePriceReference: decayReference\(/);
        expect(src).toMatch(/import \{ decayReference \} from '\.\.\/market\/buyout'/);
    });

    it('and the store keeps it, or every reload hands the exploit back', () => {
        const src = read('core', 'store', 'useStatsStore.ts');
        expect(src).toMatch(/sharePriceReference: \(START_COMPANY_CAPITAL \* 1\.5\) \/ 10_000_000/);
        // In partialize, or persist drops it silently.
        expect(src).toMatch(/sharePriceReference: state\.sharePriceReference/);
    });

    it('and the quote, the charge and the odds bar all use it', () => {
        // Three call sites. The store quotes, the store charges, the profile
        // modal draws the likelihood; any one of them left on spot is a
        // disagreement the player meets as "it said yes and then no".
        const store = read('features', 'shareholders', 'stores', 'useShareholderStore.ts');
        const asks = store.match(/buyoutAsk\([\s\S]*?\);/g) || [];
        expect(asks).toHaveLength(2);
        for (const a of asks) expect(a).toMatch(/sharePriceReference/);

        expect(read('components', 'MyCompany', 'Shares', 'ShareholderProfileModal.tsx'))
            .toMatch(/sharePriceReference/);
    });

    it('and the screen says why the ask is above the ticker', () => {
        // Otherwise the number simply looks broken and the player concludes
        // the price is bugged rather than that the board is refusing.
        expect(read('components', 'MyCompany', 'Shares', 'MemberInteractionModal.tsx'))
            .toMatch(/buyoutResult\.pricedOffReference/);
        for (const f of ['tr', 'en'] as const) {
            const line = read('core', 'i18n', `${f}.ts`)
                .split('\n').find(l => /'mem\.pricedOffReference'/.test(l));
            expect(`${f}:${line}`).toContain('pricedOffReference');
            expect(line).not.toMatch(/[—–]/);
            expect(line!.replace(/^.*?':/, '')).not.toMatch(/ - /);
        }
    });
});
