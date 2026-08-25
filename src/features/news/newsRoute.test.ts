// src/features/news/newsRoute.test.ts
//
// ============================================================================
//  THE LAST SCREEN STILL ARRIVING FROM THE BOTTOM
// ============================================================================
//
//  RootNavigator has carried this comment for a while:
//
//      "Products slid in from the right while My Empire, the stock market and
//       the takeover screen came up from the bottom, because those were Modals
//       and Products was a screen. Two different gestures for the same kind of
//       navigation is what made the app feel like separate pieces bolted
//       together. Everything pushes from the right now."
//
//  Everything except Silicon News, which was never a route and so kept
//  `animationType="slide"` - and an RN Modal has no direction but up. Reported
//  as exactly that: it should come in from the right and leave back to the
//  right like every other screen.
//
//  The stack already does both. A route gets `slide_from_right` on push and
//  the reverse on pop, from the one `screenOptions` block, which is why this
//  file tests that News IS a route rather than testing an animation.
//
//  ---------------------------------------------------------------------------
//  AND IT WAS DRAWING ITS OWN NAV BAR
//  ---------------------------------------------------------------------------
//  Found on the way. RootNavigator renders exactly one bar, absolute against
//  the window, because 44 files used to render their own and on several of them
//  it sat outside the touchable area and did nothing. This screen was the 45th.
// ============================================================================

import fs from 'fs';
import path from 'path';

const read = (...p: string[]) =>
    fs.readFileSync(path.join(__dirname, ...p), 'utf8');

const code = (...p: string[]) =>
    read(...p)
        .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*)/.test(l))
        .map(l => l.replace(/\s\/\/.*$/, ''))
        .join('\n');

const NAV = () => code('..', '..', 'navigation', 'RootNavigator.tsx');
const HOME = () => code('..', '..', 'screens', 'Home', 'HomeScreen.tsx');
const NEWS = () => code('components', 'SiliconNewsModal.tsx');

describe('silicon news', () => {
    it('is a route, which is what makes it push from the right', () => {
        const nav = NAV();
        expect(nav).toMatch(/<RootStack\.Screen name="News" component=\{NewsScreen\} \/>/);
        expect(nav).toMatch(/News: undefined;/);
    });

    it('and the stack it joined pushes from the right and pops back to it', () => {
        // One screenOptions block for the whole stack, which is the point:
        // the direction is not a property of this screen and cannot drift.
        expect(NAV()).toMatch(/animation: 'slide_from_right'/);
    });

    it('and the home screen navigates rather than raising a modal', () => {
        const home = HOME();
        expect(home).toMatch(/case 'news': handleNavigateStack\('News'\);/);
        expect(home).not.toMatch(/setShowNews/);
        expect(home).not.toMatch(/<SiliconNewsModal/);
    });

    it('and the modal it used to be is shelved rather than deleted', () => {
        // It is still raised as a modal from the stats bar button, so the
        // component keeps both paths - that is the point of ScreenHost.
        const raw = read('..', '..', 'screens', 'Home', 'HomeScreen.tsx');
        expect(raw).toContain('SiliconNewsModal');
    });
});

describe('the component itself', () => {
    it('renders through ScreenHost, so one implementation serves both', () => {
        const src = NEWS();
        expect(src).toMatch(/<ScreenHost/);
        expect(src).toMatch(/asScreen=\{asScreen\}/);
        // The bare Modal is gone; ScreenHost is what decides now.
        expect(src).not.toMatch(/<Modal\b/);
    });

    it('and takes the flag that tells it which it is', () => {
        expect(NEWS()).toMatch(/asScreen\?: boolean;/);
    });

    it('and only draws a nav bar when nothing else has', () => {
        // As a route the global one is already there. A second copy is the
        // fault RootNavigator's comment describes.
        const src = NEWS();
        expect(src).toMatch(/\{!asScreen && \(/);
        expect(src).toMatch(/<CrystalNavBar/);
    });

    it('and the button that still raises it as a popup is untouched', () => {
        // A component that only worked as a route would have broken the stats
        // bar, which raises this from somewhere with nothing above it.
        const btn = code('components', 'SiliconNewsButton.tsx');
        expect(btn).toMatch(/<SiliconNewsModal/);
        expect(btn).not.toMatch(/asScreen/);
    });
});
