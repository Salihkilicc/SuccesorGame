// src/components/MyCompany/Shares/buyoutWiring.test.ts
//
// ============================================================================
//  THAT THE SCREEN AND THE STORE ARE ANSWERING THE SAME QUESTION
// ============================================================================
//
//  core/market/buyout.test.ts proves the rule is right. This proves anybody
//  reads it, which in this codebase is the half that keeps going missing:
//  `calculateBuyoutPrice` was eighty correct lines that decided nothing,
//  because the one place calling it compared its answer against a quantity in
//  a different unit.
//
//  Four separate answers to "will they sell, and for how much":
//
//    calculateBuyoutPrice     trust + trait, deterministic, quoted to the
//                             player, enforced by nothing
//    calculateNegotiationChance   a die against trust, thrown inside the
//                             store AFTER the screen said yes
//    negotiateSharePurchase   its own price, off a different store, spent
//                             without anybody being quoted it
//    ShareholderProfileModal  a fourth copy of the chance formula, inline,
//                             to draw a bar
//
//  What the player saw: a panel headed "Offer accepted" listing what they
//  would pay and what their stake would become, followed on confirm by
//  "Purchase failed".
// ============================================================================

import fs from 'fs';
import path from 'path';

const ROOT = path.join(__dirname, '..', '..', '..');
const read = (...p: string[]) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');

/** The comments in these files quote the old code at length. */
const code = (...p: string[]) => read(...p)
    .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '')
    .split('\n')
    .filter(l => !/^\s*(\/\/|\*)/.test(l))
    .map(l => l.replace(/\s\/\/.*$/, ''))
    .join('\n');

/**
 * The body of `negotiateSharePurchase`, and only it.
 *
 * `lastIndexOf` because the name appears first in the store's interface
 * declaration, hundreds of lines above the implementation, and `sellSharesToMember`
 * is what follows it.
 */
const purchaseBody = (src: string): string => {
    const start = src.lastIndexOf('negotiateSharePurchase: (');
    const end = src.indexOf('sellSharesToMember: (', start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    return src.slice(start, end);
};

const MEMBER_SCREEN = ['components', 'MyCompany', 'Shares', 'MemberInteractionModal.tsx'];
const STORE = ['features', 'shareholders', 'stores', 'useShareholderStore.ts'];

describe('the offer screen', () => {
    it('compares a total against a total', () => {
        const src = code(...MEMBER_SCREEN);
        expect(src).toMatch(/requiredPrice = buyoutResult\.askingTotal/);
        // The old line. `askingPrice` is per share and is still on the type
        // for anything that has not moved, so the comparison is the thing to
        // watch rather than the field.
        expect(src).not.toMatch(/requiredPrice = buyoutResult\.askingPrice/);
    });

    it('and does not promise a yes before the store has given one', () => {
        // The panel is a question now, so "accepted" cannot appear as a title
        // ahead of the roll. The confirm handler is where it is settled.
        const src = code(...MEMBER_SCREEN);
        const beforeConfirm = src.slice(
            src.indexOf('const handleMakeOffer'),
            src.indexOf('onConfirm: () =>', src.indexOf('const handleMakeOffer')),
        );
        expect(beforeConfirm).not.toMatch(/mem\.offerAccepted/);
        expect(beforeConfirm).not.toMatch(/has accepted your offer/);
    });

    it('and shows the odds before the button is pressed', () => {
        expect(code(...MEMBER_SCREEN)).toMatch(/acceptanceChance\(offerPrice, requiredPrice\)/);
    });

    it('and lets go of the money, because the store spends it', () => {
        // `money` is captured at render, so this wrote a stale absolute over
        // the store's own deduction and quietly decided the price.
        expect(code(...MEMBER_SCREEN)).not.toMatch(/updateStats\(\{\s*money: money - offerPrice/);
    });

    it('and can reach the dearest ask in the game', () => {
        // The stepper stopped at 100 while an ask can be 150.
        const src = code(...MEMBER_SCREEN);
        expect(src).toMatch(/MAX_ASK_PREMIUM/);
        expect(src).not.toMatch(/Math\.min\(100, prev \+ delta\)/);
    });
});

describe('the store', () => {
    it('asks the rule rather than carrying its own copy', () => {
        const src = code(...STORE);
        expect(src).toMatch(/from '\.\.\/\.\.\/\.\.\/core\/market\/buyout'/);
        expect(src).toMatch(/settleBuyout\(/);
        expect(src).toMatch(/buyoutAsk\(/);
    });

    it('and prices the trade off the same figure the screen showed', () => {
        // The screen reads stats.companySharePrice; this used to read
        // useEquityStore.stockPrice, which is only equal after a refresh
        // nobody guarantees and starts life at 0 - so before the first sync
        // every holding on the register was free.
        const src = code(...STORE);
        const body = purchaseBody(src);
        expect(body).not.toMatch(/useEquityStore\.getState\(\)\.stockPrice/);
        expect(body).toMatch(/companySharePrice/);
    });

    it('and the die it throws is the one that knows the asking price', () => {
        const src = code(...STORE);
        expect(purchaseBody(src)).not.toMatch(/calculateNegotiationChance/);
    });

    it('while the old chance formula is shelved rather than deleted', () => {
        // It still draws the likelihood bar on the profile screen, which has
        // not been moved over yet. Kept whole, per the rule for this codebase.
        expect(read(...STORE)).toContain('calculateNegotiationChance');
    });
});

describe('the buyout result type', () => {
    it('says the unit of every price on it', () => {
        const src = read(...STORE);
        expect(src).toMatch(/askingPricePerShare: number/);
        expect(src).toMatch(/askingTotal: number/);
    });
});
