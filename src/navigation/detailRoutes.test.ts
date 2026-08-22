// src/navigation/detailRoutes.test.ts
//
// ============================================================================
//  EVERY DETAIL PAGE ARRIVES THE SAME WAY
// ============================================================================
//
//  "Urunlere girip cikinca ekran saga gitmeli, girerken sola gelmeli."
//  "Sirketlere girerken ekrandan sagdan gelmeli, cikarken saga gitmeli,
//   oyunda her yerdeki gibi ekran gecisi olsun."
//
//  RootStack has pushed everything from the right for a while. What was left
//  were the pages that are not on RootStack at all: a product and a company
//  you own were Modals raised from a list, so each one FADED IN on top of a
//  screen that had itself slid in from the right. Two different gestures, one
//  after the other, on the way to the same place.
//
//  A Modal also draws above the nav bar, which is the other half of what
//  ScreenHost exists for.
//
//  The rule this pins is not the animation - that is one line of
//  screenOptions and it was already right. It is that a DETAIL PAGE IS A
//  ROUTE, because that is the thing somebody undoes by reaching for a Modal
//  the next time a list needs a sheet.
// ============================================================================

import fs from 'fs';
import path from 'path';

const SRC = path.join(__dirname, '..');
const read = (...p: string[]) => fs.readFileSync(path.join(SRC, ...p), 'utf8');

/**
 * Comments in this codebase describe the bugs at length, and shelved code is
 * kept rather than deleted - so a rule about what the file does has to read
 * past both. Block comments go whole, including the JSX kind, because a
 * shelved `{/* <ProductDetailModal ... /*}` is exactly the string these
 * rules are looking for and exactly the thing they must not find.
 */
const code = (...p: string[]) => read(...p)
    // Whole block comments first, JSX and plain alike.
    .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '')
    .split('\n')
    .filter(l => !/^\s*\/\//.test(l))
    .join('\n');

const nav = () => code('navigation', 'RootNavigator.tsx');

describe('the stack pushes from the right', () => {
    it('for everything, which is what the routes are for', () => {
        expect(nav()).toContain("animation: 'slide_from_right'");
    });
});

describe('and the detail pages are routes', () => {
    const ROUTES = [
        ['ProductDetail', 'productId'],
        ['Subsidiary', 'companyId'],
        ['BoardMember', 'memberId'],
    ] as const;

    it.each(ROUTES)('%s is registered and takes an id', (name, param) => {
        expect(nav()).toContain(`name="${name}"`);
        expect(nav()).toMatch(new RegExp(`${name}:\\s*\\{\\s*${param}:\\s*string\\s*\\}`));
    });

    it.each(ROUTES)('%s keeps the Company tab lit', (name) => {
        // Pushed on top of the Company tab, so dropping the highlight would
        // read as having left the section.
        expect(nav()).toMatch(new RegExp(`COMPANY_ROUTES[\\s\\S]{0,400}'${name}'`));
    });

    it('and nothing takes a callback across a route boundary', () => {
        // Route params must be serialisable, and this codebase has paid for a
        // function travelling between screens once: the IPO handler was a
        // param that called setPanel on the screen it came FROM, so the
        // confirmation appeared on a screen nobody was looking at.
        const params = nav().match(/(ProductDetail|Subsidiary|BoardMember):\s*\{[^}]*\}/g) ?? [];
        expect(params.length).toBe(ROUTES.length);
        for (const p of params) expect(p).not.toMatch(/=>|\(\)\s*:/);
    });
});

describe('and the lists open them by navigating', () => {
    it('the products list', () => {
        const src = code('features', 'products', 'screens', 'ProductsScreen.tsx');
        expect(src).toContain("navigation.navigate('ProductDetail'");
        expect(src).not.toContain('<ProductDetailModal');
    });

    it('the companies you own', () => {
        const src = code('components', 'MyCompany', 'Finance', 'ExistingCompaniesModal.tsx');
        expect(src).toContain("navigation.navigate('Subsidiary'");
        expect(src).not.toContain('<SubsidiaryDetailModal');
    });

    it('and the board', () => {
        const src = code('components', 'MyCompany', 'Shares', 'BoardRoomModal.tsx');
        expect(src).toContain("navigation.navigate('BoardMember'");
        expect(src).not.toContain('<MemberInteractionModal');
    });
});

describe('and each sheet can be a screen', () => {
    it.each([
        ['features/products/components/ProductModals.tsx'],
        ['components/MyCompany/Finance/SubsidiaryDetailModal.tsx'],
        ['components/MyCompany/Shares/MemberInteractionModal.tsx'],
    ])('%s renders through ScreenHost', (file) => {
        const src = code(...file.split('/'));
        expect(src).toContain('ScreenHost');
        expect(src).toMatch(/asScreen/);
    });
});
