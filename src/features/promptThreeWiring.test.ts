// src/features/promptThreeWiring.test.ts
//
// ============================================================================
//  FOUR THINGS ON SCREEN, AND WHETHER THEY ARE WHERE THEY WERE PUT
// ============================================================================
//
//  A white iOS sheet in a dark game, a button nobody could tell was a button,
//  a label that hung left when it wrapped, and a control that broke the card
//  it sat in. None of them is a rule, so none of them can be tested by asking
//  a function a question - what can be tested is whether the change is still
//  in the file the next time somebody opens it.
// ============================================================================

import fs from 'fs';
import path from 'path';

const SRC = __dirname;

/**
 * The StyleSheet at the bottom of a file, and nothing above it.
 *
 * The first version of this sliced from `makeOfferButton: {` to
 * `makeOfferButtonPressed`, which reads backwards: both names appear in the
 * JSX as `styles.x` LONG before the style block defines them, so `indexOf`
 * found the usage and the slice came back empty. An empty string matches no
 * pattern, so the test failed for the right reason by luck rather than
 * measuring anything.
 */
const stylesOf = (src: string): string => {
    const at = src.lastIndexOf('StyleSheet.create(');
    return at < 0 ? '' : src.slice(at);
};
const live = (...p: string[]) =>
    fs.readFileSync(path.join(SRC, '..', ...p), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*)/.test(l))
        .map(l => l.replace(/\s\/\/.*$/, ''))
        .join('\n');

describe('the two personal moments arrive in the game s own dialog', () => {
    const family = () => live('features', 'profile', 'screens', 'FamilyMemberScreen.tsx');

    it('a child being born is a panel, not an Alert', () => {
        // ------------------------------------------------------------------
        //  IT WAS THE SECOND MOST IMPORTANT THING THAT HAPPENS IN THIS GAME
        // ------------------------------------------------------------------
        //  And it arrived as an iOS system sheet reading "Dynasty Expanded!"
        //  with an emoji, and a line about being "added to your succession
        //  roster" - which is how a spreadsheet would put it. The Turkish
        //  said "yeni bir hayat", which was reported as nonsense and was.
        // ------------------------------------------------------------------
        const src = family();
        expect(src).toMatch(/family\.babyBornTitle/);
        expect(src).not.toMatch(/Dynasty Expanded/);
        expect(src).not.toMatch(/succession roster/);
    });

    it('and so is naming a successor', () => {
        const src = family();
        const fn = src.slice(
            src.indexOf('const handleDesignateSuccessor'),
            src.indexOf('const handleDate'),
        );
        expect(fn.length).toBeGreaterThan(50);
        expect(fn).toMatch(/setPanel\(\{/);
        expect(fn).not.toMatch(/Alert\.alert/);
    });

    it('and the panel is actually rendered, not merely set', () => {
        // The half that goes missing: state that nothing draws. The screen
        // would look exactly as if the dialog had been deleted.
        const src = family();
        expect(src).toMatch(/<ConfirmPanel/);
        expect(src).toMatch(/from '\.\.\/\.\.\/\.\.\/components\/common\/ConfirmPanel'/);
    });
});

describe('and the buttons look like buttons', () => {
    it('the offer button is the primary blue rather than near invisible', () => {
        // ------------------------------------------------------------------
        //  MEASURED: #FFFFFF ON #CFD0D2 IS 1.54
        // ------------------------------------------------------------------
        //  Reported as "the make offer button is silver, you cannot tell you
        //  are supposed to press it". It was worse than silver: the label was
        //  white on light grey and very nearly not there.
        //
        //  The contrast audit missed it because pass 0f resolves theme TOKENS
        //  through a light fill and both of these were literal hexes written
        //  inline. Worth knowing about that pass, not only about this button.
        // ------------------------------------------------------------------
        const sheet = stylesOf(live('components', 'MyCompany', 'Shares', 'MemberInteractionModal.tsx'));
        expect(sheet.length).toBeGreaterThan(200);

        const block = sheet.slice(sheet.indexOf('makeOfferButton: {'), sheet.indexOf('makeOfferButtonPressed'));
        expect(block.length).toBeGreaterThan(20);
        expect(block).toMatch(/backgroundColor: theme\.colors\.primary/);
        expect(block).not.toMatch(/#CFD0D2/);

        const text = sheet.slice(sheet.indexOf('makeOfferButtonText: {'), sheet.indexOf('infoBox: {'));
        expect(text.length).toBeGreaterThan(20);
        expect(text).toMatch(/color: theme\.colors\.onLight/);
        expect(text).not.toMatch(/color: '#FFFFFF'/);
    });

    it('and a confirm label that wraps stays centred', () => {
        // `alignItems: center` centres the Text ELEMENT and does nothing to
        // the lines inside it, so a short English label looked right and
        // "Satın almayı onayla" hung left on its second line.
        const src = live('components', 'common', 'ConfirmPanel.tsx');
        expect(src).toMatch(/btnConfirmText: \{[^}]*textAlign: 'center'/);
        expect(src).toMatch(/btnCancelText: \{[^}]*textAlign: 'center'/);
    });
});

describe('and the private room is in travel, where the other destinations are', () => {
    it('the casino header no longer draws it', () => {
        // It broke the card because it was a second pill in a row that fits
        // one: the row wrapped and took the layout with it.
        const src = live('features', 'casino', 'screens', 'CasinoScreen.tsx');
        expect(src).not.toMatch(/style=\{\[styles\.vipButton/);
    });

    it('and the travel list draws it, under the cities', () => {
        const src = live('features', 'casino', 'components', 'CasinoLocationModal.tsx');
        expect(src).toMatch(/\{vipVisible && \(/);
        expect(src).toMatch(/styles\.vipRow/);
        // AFTER the map over the cities, or it is the first thing in the list
        // rather than the last.
        expect(src.indexOf('styles.vipRow'))
            .toBeGreaterThan(src.indexOf('CASINO_LOCATIONS.map'));
    });

    it('and it is plainly not a city', () => {
        // A country button but not a country: same height and columns so it
        // belongs to the list, a gold hairline and a crown so nobody counts
        // it as the sixth destination.
        const src = live('features', 'casino', 'components', 'CasinoLocationModal.tsx');
        const sheet = stylesOf(src);
        const row = sheet.slice(sheet.indexOf('vipRow: {'), sheet.indexOf('vipRowShut'));
        expect(row.length).toBeGreaterThan(20);
        expect(row).toMatch(/borderColor: 'rgba\(239, 201, 76/);
        expect(src).toMatch(/name="crown-outline"/);
        // No flag on it. Every city row has one.
        const jsx = src.slice(src.indexOf('{vipVisible && ('), src.indexOf('</ScrollView>'));
        expect(jsx).not.toMatch(/flagEmoji/);
    });

    it('and the same door decides, with the same words', () => {
        // The room did not change, only where the handle is. Feeding it a
        // second copy of the rule is how two answers to one question start.
        const screen = live('features', 'casino', 'screens', 'CasinoScreen.tsx');
        expect(screen).toMatch(/vipVisible=\{vipVisible\}/);
        expect(screen).toMatch(/vipAllowed=\{vipDoor\.allowed\}/);
        expect(screen).toMatch(/onVipPress=\{handleVipPress\}/);
        expect(screen).toMatch(/casino\.vipSoon/);
        expect(screen).toMatch(/casino\.vipLocked/);
    });

    it('and leaving the room is offered once you are in it', () => {
        // The header button toggled. A list row that could only ever take you
        // in would strand a player who wanted out.
        const screen = live('features', 'casino', 'screens', 'CasinoScreen.tsx');
        expect(screen).toMatch(/casino\.vipLeave/);
        for (const lang of ['en', 'tr'] as const) {
            expect(live('core', 'i18n', `${lang}.ts`)).toMatch(/'casino\.vipLeave'/);
        }
    });
});
