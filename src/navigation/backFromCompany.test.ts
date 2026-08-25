// src/navigation/backFromCompany.test.ts
//
// ============================================================================
//  THE BACK BUTTON ON MY COMPANY DID NOTHING
// ============================================================================
//
//  It called `navigation.navigate('Home')`, which is the obvious thing to write
//  and cannot work from there.
//
//  My Company is a SWIPE TAB inside the navigator RootStack registers as
//  'Home'. So from inside it, `navigate('Home')` resolves to the RootStack
//  route the app is already on, and a navigate to the route you are already on
//  is a no-op that never reaches the child navigator. The button pressed, the
//  ripple ran, nothing moved.
//
//  ---------------------------------------------------------------------------
//  THIRD TIME, SAME SHAPE
//  ---------------------------------------------------------------------------
//  navigation/jumpToCompany.ts was written for this exact fault and its header
//  says so twice over: the bar's Company button had it, then the bar's Home
//  button had it the other way round. Both were fixed by aiming the action at
//  the swipe navigator directly, so RootStack is never asked and cannot swallow
//  it. This screen kept the broken form.
//
//  AND THE TAB IS CALLED `Dashboard`. The inner one was renamed to end the
//  `Home > Home` collision React Navigation had been warning about - see the
//  note above SwipeTabParamList. Passing 'Home' to the working helper would
//  have been the same bug with better plumbing.
// ============================================================================

import fs from 'fs';
import path from 'path';

const code = (...p: string[]) =>
    fs.readFileSync(path.join(__dirname, ...p), 'utf8')
        .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*)/.test(l))
        .map(l => l.replace(/\s\/\/.*$/, ''))
        .join('\n');

const COMPANY = () => code('..', 'features', 'assets', 'screens', 'MyCompanyScreen.tsx');

describe('leaving my company', () => {
    it('aims at the swipe navigator rather than at the stack', () => {
        expect(COMPANY()).toMatch(/onBack=\{\(\) => jumpToTab\(rootNavigationRef, 'Dashboard'\)\}/);
    });

    it('and does not use the form that cannot reach it', () => {
        // `navigate('Home')` from inside the navigator RootStack calls Home.
        expect(COMPANY()).not.toMatch(/onBack=\{\(\) => navigation\.navigate\('Home'\)\}/);
    });

    it('and names the tab by the name it actually has', () => {
        // 'Home' is the OUTER route. The inner tab is Dashboard, and passing
        // the wrong one to a working helper is how this would have looked
        // fixed and stayed broken.
        const nav = code('RootNavigator.tsx');
        expect(nav).toMatch(/Dashboard: undefined;/);
        expect(nav).toMatch(/<SwipeTab\.Screen name="Dashboard" component=\{HomeScreen\} \/>/);
        // And there is no inner route called Home to fall back on.
        expect(nav).not.toMatch(/<SwipeTab\.Screen name="Home"/);
    });

    it('and uses the same helper the nav bar was fixed with', () => {
        // One implementation of "put a swipe tab on screen". Two would drift.
        const bar = code('components', 'CrystalNavBar.tsx');
        expect(bar).toMatch(/jumpToTab\(rootNavigationRef, 'Dashboard'\)/);
        expect(COMPANY()).toMatch(/from '\.\.\/\.\.\/\.\.\/navigation\/jumpToCompany'/);
    });

    it('and the helper still falls back when the navigator is not mounted', () => {
        // The direct jump needs a key to aim at. Before the swipe navigator
        // has mounted there is none, and the nested navigate is the only thing
        // that can work - so it stays.
        const helper = code('jumpToCompany.ts');
        expect(helper).toMatch(/target: key/);
        expect(helper).toMatch(/CommonActions\.navigate\(HOST, \{ screen: tab \}\)/);
    });
});
