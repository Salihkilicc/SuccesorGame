// src/components/MyCompany/Shares/ipoModal.test.ts
//
// ============================================================================
//  A SCREEN CANNOT RAISE A DIALOG ON ANOTHER SCREEN
// ============================================================================
//
//  The bug: Launch IPO sits on the Stock Market screen and did nothing when
//  pressed. The confirmation turned up later, on My Company, once the player
//  had navigated back.
//
//  The handler was `handleLaunchIPO` in MyCompanyScreen, passed across as a
//  ROUTE PARAM, and all it did was `setPanel` on MyCompanyScreen's own state.
//  That screen is not mounted in front of you when you are on Stock Market, so
//  the panel rendered into a screen nobody was looking at and waited.
//
//  ---------------------------------------------------------------------------
//  WHY THIS IS A SOURCE TEST
//  ---------------------------------------------------------------------------
//  What is wrong here is not a value, it is a WIRE: a callback that closes over
//  the wrong component's state and travels through navigation. Rendering proves
//  nothing, because the handler runs perfectly and sets its state correctly -
//  on a screen that is not there. The only honest assertion is that the wire is
//  gone and that both entry points open the same local modal.
//
//  Same argument as navigation/routes.test.ts, which exists because a route
//  name that does not resolve is invisible to the type checker for the same
//  reason: it is a string that travels.
// ============================================================================

/// <reference types="node" />
//  Node APIs in a React Native tsconfig. See the identical note in
//  navigation/routes.test.ts.
import * as fs from 'fs';
import * as path from 'path';

const SRC = path.join(__dirname, '..', '..', '..');
const read = (p: string) => fs.readFileSync(path.join(SRC, p), 'utf8');

/** Comments stripped, so shelved code does not read as live code. */
const codeOf = (p: string) => read(p)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

const STOCK_MARKET = 'features/assets/screens/CompanyScreens.tsx';
const MY_COMPANY = 'features/assets/screens/MyCompanyScreen.tsx';
const MODAL = 'components/MyCompany/Shares/IpoModal.tsx';

describe('the wire that broke it', () => {
    it('is gone: nothing hands a handler through navigation any more', () => {
        // `navigate('StockMarket', { onOpenIPO: handleLaunchIPO })` is the
        // whole bug in one line.
        expect(codeOf(MY_COMPANY)).not.toMatch(/onOpenIPO/);
        expect(codeOf(STOCK_MARKET)).not.toMatch(/route\?\.params\?\.onOpenIPO/);
    });

    it('and the screen with the button opens its own modal', () => {
        const code = codeOf(STOCK_MARKET);
        expect(code).toMatch(/onOpenIPO=\{\(\) => setIpo\(true\)\}/);
        expect(code).toMatch(/<IpoModal/);
    });

    it('exactly as its three siblings on that screen already did', () => {
        // The pattern was there the whole time. The listing was the one that
        // did it differently, and it was the one that did not work.
        const code = codeOf(STOCK_MARKET);
        for (const modal of ['IpoModal', 'BuybackModal', 'DilutionModal', 'DividendModal']) {
            expect(code).toMatch(new RegExp(`<${modal}\\s+visible=`));
        }
    });

    it('and the other entry point opens the same one', () => {
        // My Company can still launch a listing from the share hub. It opens
        // the modal rather than building a panel, so there is one flow with
        // two doors rather than two flows.
        const code = codeOf(MY_COMPANY);
        expect(code).toMatch(/<IpoModal\s+visible=\{ipoOpen\}/);
        expect(code).toMatch(/handleLaunchIPO = \(\) => setIpoOpen\(true\)/);
    });

    it('and neither screen prices the listing any more', () => {
        // Two callers holding their own copy of `quoteIpo` is how the offer
        // table and the receipt drift apart.
        expect(codeOf(MY_COMPANY)).not.toMatch(/quoteIpo/);
        expect(codeOf(STOCK_MARKET)).not.toMatch(/quoteIpo/);
        expect(codeOf(MODAL)).toMatch(/quoteIpo/);
    });
});

// ============================================================================
//  AND THE MODAL ITSELF
// ============================================================================
describe('the listing modal', () => {
    const code = codeOf(MODAL);

    it('is three states, because listing is not a confirmation', () => {
        // Not ready, the offer, and the receipt. The receipt is a step rather
        // than a toast because the number that matters is not the money, it
        // is the ownership line, and the player should have to look at it.
        expect(code).toMatch(/!ready && !done/);
        expect(code).toMatch(/ready && !done/);
        expect(code).toMatch(/\{!!done && \(/);
    });

    it('and shows the two costs an IPO screen usually hides', () => {
        // ------------------------------------------------------------------
        //  THE KEY, NOT THE ENGLISH
        // ------------------------------------------------------------------
        //  This read `/Underwriting fee/` and went red the day the modal was
        //  translated, which is the same mistake the untranslated sweep was
        //  making: it pinned the WORD rather than the claim. The claim is that
        //  this screen names the fee and the discount instead of quietly
        //  netting them off, and that survives being said in Turkish.
        // ------------------------------------------------------------------
        expect(code).toMatch(/t\('ipo\.underwritingFee'\)/);
        expect(code).toMatch(/moneyLeftOnTable/);

        // And the words themselves still exist, in both catalogues, which is
        // where checking the wording belongs.
        for (const lang of ['tr', 'en']) {
            const dict = read(`core/i18n/${lang}.ts`);
            expect(dict).toMatch(/'ipo\.underwritingFee':/);
            expect(dict).toMatch(/'ipo\.discountNote':/);
        }
    });

    it('and a refusal keeps the offer on screen rather than closing it', () => {
        // `goPublic` can decline. Closing the modal on a failure would leave
        // the player looking at the hub with no idea what happened.
        expect(code).toMatch(/setFailure\(result\.error\)/);
    });

    it('and reopening does not show the last run\'s receipt', () => {
        expect(code).toMatch(/setDone\(null\)/);
        expect(code).toMatch(/setFailure\(null\)/);
    });

    it('and it wears the theme rather than a system sheet', () => {
        // The whole reason ConfirmPanel exists: a white iOS dialog dropped
        // into a dark game. See the header of components/common/ConfirmPanel.
        expect(code).not.toMatch(/Alert\.alert/);
        expect(code).toMatch(/theme\.colors\.surfaceRaised/);
        // Black on the bright blue, which is what the theme says that fill
        // takes.
        expect(code).toMatch(/theme\.colors\.primaryText/);
    });

    it('and uses the loss colour as text only, never as a fill', () => {
        // core/theme.ts rule 3: signal tokens are TEXT only.
        const fills = code.match(/backgroundColor:\s*theme\.colors\.(danger|error|success)/g);
        expect(fills).toBeNull();
    });

    it('and has no dash in anything the player reads', () => {
        const DASH = /[—–]|(?:^|\s)-(?:\s|$)/;
        const spoken = read(MODAL)
            .split('\n')
            // Comments are exempt from the dash ban; player-visible text is not.
            .filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
            .filter(l => /<Text|'[A-Z][a-z]/.test(l));
        expect(spoken.filter(l => DASH.test(l.replace(/[-\w]+=/g, '')))).toEqual([]);
    });
});
