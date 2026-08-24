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
const PROFILE_SCREEN = ['components', 'MyCompany', 'Shares', 'ShareholderProfileModal.tsx'];
const STORE = ['features', 'shareholders', 'stores', 'useShareholderStore.ts'];

/** Both screens that can buy a holding. The second one kept getting missed. */
const BUYING_SCREENS = [MEMBER_SCREEN, PROFILE_SCREEN];

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


// ============================================================================
//  THE THREE THAT GOT THROUGH
// ============================================================================
//
//  Found by reading rather than by any test, one commit after the routes
//  landed, and all three in the same blind spot: the store and the pure module
//  were covered and neither SCREEN was opened.
//
//    THE WALLET GUARD SURVIVED. `handleMakeOffer` still began with
//    `if (money < offerPrice) return`, so a successor with a big stake and no
//    cash could choose "company buys it back", press the button, and be told
//    they had insufficient funds - about money that was never going to be
//    spent. The whole point of the commit, defeated by a line above it.
//
//    THE SECOND SCREEN CAPPED AT FIFTY. ShareholderProfileModal buys holdings
//    too, and its premium stepper stopped at 50 while a sibling asks 70. That
//    was harmless while every offer was accepted regardless of price, and
//    became "you can no longer buy out any of your family from this screen"
//    the moment the ask started being enforced.
//
//    AND THE LIKELIHOOD BAR STILL GUESSED. Both screens drew it from the
//    premium alone, so it read "Very interested" at fifty per cent to
//    somebody asking seventy. The one copy of the decision the player
//    actually looks at.
// ============================================================================

describe('both screens that can buy a holding', () => {
    it.each(BUYING_SCREENS.map(p => [p.join('/'), p]))(
        'can reach the dearest ask in the game, in %s',
        (_label, p) => {
            const src = code(...(p as string[]));
            expect(src).toMatch(/MAX_ASK_PREMIUM/);
            // The two ceilings that were typed by hand.
            expect(src).not.toMatch(/Math\.min\(100, prev \+ delta\)/);
            expect(src).not.toMatch(/Math\.min\(50, newValue\)/);
        },
    );

    it.each(BUYING_SCREENS.map(p => [p.join('/'), p]))(
        'and works the odds off the asking price rather than the premium, in %s',
        (_label, p) => {
            const src = code(...(p as string[]));
            expect(src).toMatch(/acceptanceChance\(/);
            // The shape of every hand-rolled copy: a bonus for clearing 20%.
            expect(src).not.toMatch(/offerPremium > 20\) chance = Math\.min\(100, chance \+ 30\)/);
        },
    );
});

describe('the offer handler', () => {
    it('does not gate the company routes on the player\'s wallet', () => {
        const src = code(...MEMBER_SCREEN);
        const handler = src.slice(
            src.indexOf('const handleMakeOffer'),
            src.indexOf('const adjustPremium'),
        );
        expect(handler).not.toMatch(/if \(money < offerPrice\)/);
        expect(handler).toMatch(/routeQuotes\[route\]/);
    });
});
