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

// ============================================================================
//  AND NO TWO ROUTES SHARE A NAME
// ============================================================================
//
//  React Navigation said this on every launch:
//
//      Found screens with the same name nested inside one another.
//      Check: Home, Home > Home
//
//  RootStack's `Home` owns the swipe navigator, and the swipe navigator had a
//  `Home` inside it, so every `navigate('Home')` in the app resolved to
//  whichever the caller happened to be nearest.
//
//  It had already cost one bug and was quietly costing a second.
//  jumpToCompany.ts exists because a navigate to the route you are already on
//  never reaches the child navigator; the bar's HOME button had the same fault
//  the other way round and nobody noticed, because Home is where people start.
// ============================================================================
describe('the route names', () => {
    const routeNames = (text: string): string[] =>
        [...text.matchAll(/<\w+\.Screen\s+name="(\w+)"/g)].map(m => m[1]);

    it('never put a route inside a route of the same name', () => {
        // The rule React Navigation actually enforces, and the only kind of
        // duplicate that breaks a `navigate`: a name resolving to two places,
        // one nested in the other, so the answer depends on where the caller
        // happens to be sitting.
        //
        // Duplicates across SIBLING branches are a different thing and this
        // file does not claim to police them - `DNA` exists in RootStack and
        // in the shelved LifeStack, which is untidy and is not this bug.
        const hosts = [...nav().matchAll(
            /<RootStack\.Screen\s+name="(\w+)"\s+component=\{(\w+)\}/g,
        )].map(m => ({ route: m[1], component: m[2] }));

        const swipeHost = hosts.find(h => h.component === 'SwipeNavigator');
        expect(swipeHost).toBeDefined();

        const inside = [...nav().matchAll(/<SwipeTab\.Screen\s+name="(\w+)"/g)]
            .map(m => m[1]);
        expect(inside).not.toContain(swipeHost!.route);
    });

    it('so the swipe tab is not called Home', () => {
        // The container route keeps the name, because a dozen callers say
        // `navigate('Home')` meaning "go back to the home area" and that is
        // what they get. The inner one is what moved.
        expect(nav()).toContain('name="Dashboard"');
        expect(nav()).toMatch(/SwipeTabParamList[\s\S]{0,300}Dashboard: undefined/);
        expect(nav()).not.toMatch(/SwipeTab\.Screen\s+name="Home"/);
    });

    it('and the bar addresses the tab rather than the stack', () => {
        const bar = code('navigation', 'components', 'CrystalNavBar.tsx');
        expect(bar).toMatch(/jumpToTab\(rootNavigationRef, 'Dashboard'\)/);
        // The generic fall-through was what did nothing from another tab.
        expect(bar).not.toMatch(/screen === 'Home'[\s\S]{0,80}navigation\.navigate\('Home'\)/);
    });

    it('while the helper is about tabs rather than about one tab', () => {
        // The bug it documents is a fact about every tab in the swipe
        // navigator, not about My Company.
        const helper = code('navigation', 'jumpToCompany.ts');
        expect(helper).toContain('export const jumpToTab');
        expect(helper).toMatch(/jumpToCompany[\s\S]{0,200}jumpToTab\(ref, 'MyCompany'\)/);
    });
});
