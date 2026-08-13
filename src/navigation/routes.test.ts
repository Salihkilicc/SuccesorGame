// src/navigation/routes.test.ts
//
// ============================================================================
//  EVERY navigate() IN THE APP LANDS SOMEWHERE
// ============================================================================
//
//  This exists because of a bug that was live on the tab bar - the one control
//  visible on every screen in the game - and could not be found by using the
//  app the way it was built.
//
//  `navigation.navigate('MyCompany')` looks fine and is fine, from Home.
//  MyCompany is a screen inside the swipe navigator, the swipe navigator is
//  what RootStack registers as 'Home', and navigate() resolves a name by
//  checking the CURRENT navigator and then walking UP through its parents. It
//  does not descend into a sibling navigator's children.
//
//  So from Home it resolved, and from Messages - a RootStack screen - there
//  was no MyCompany in RootStack or above it, and it threw. The route had
//  been in RootStack once and was commented out with a note wondering whether
//  anybody still needed it.
//
//  The shape of that failure is the reason for this file rather than a fix:
//  it is invisible to the type checker (route names are strings), invisible
//  to the reachability audit (which asks whether code is called, not whether
//  a string resolves), and invisible to anyone testing from the screen the
//  feature was built on.
//
//  ---------------------------------------------------------------------------
//  IT READS THE NAVIGATOR AS TEXT, WHICH IS UGLY AND CORRECT
//  ---------------------------------------------------------------------------
//  Rendering the tree and asking React Navigation would be nicer and would
//  test less: the routes are declared conditionally on FEATURES, so a render
//  answers for one flag combination. Reading the source answers for the file.
//
//  Comments are stripped first. A screen that is commented out is not a route,
//  and the whole bug was a commented-out route that still looked present.
// ============================================================================

/// <reference types="node" />
//  This test reads source files, which means Node APIs in a project whose
//  tsconfig is aimed at React Native. The reference above is what keeps
//  `npx tsc --noEmit` at its baseline rather than adding four errors about
//  `fs`, `path` and `__dirname` - and a growing baseline is a baseline
//  nobody reads.
import * as fs from 'fs';
import * as path from 'path';

const SRC = path.join(__dirname, '..');
const NAVIGATOR = path.join(SRC, 'navigation/RootNavigator.tsx');

/** Source with block and line comments removed. Shelved code is not code. */
const live = (file: string): string =>
    fs.readFileSync(file, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');

const screensOf = (source: string, navigator: string): string[] =>
    [...source.matchAll(new RegExp(`${navigator}\\.Screen\\s+name="(\\w+)"`, 'g'))]
        .map(m => m[1]);

const navigatorSource = live(NAVIGATOR);

/** What `navigate('X')` can reach from anywhere, because RootStack is the top. */
const ROOT_ROUTES = new Set(screensOf(navigatorSource, 'RootStack'));

/** Screens that only exist inside a nested navigator. */
const NESTED: Record<string, string[]> = {
    AssetsStack: screensOf(navigatorSource, 'AssetsStack'),
    CasinoStack: screensOf(navigatorSource, 'CasinoStack'),
    SwipeTab: screensOf(navigatorSource, 'SwipeTab'),
    LifeStack: screensOf(navigatorSource, 'LifeStack'),
    LoveStack: screensOf(navigatorSource, 'LoveStack'),
};

const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e: fs.Dirent) => {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) return walk(p);
        return /\.tsx?$/.test(e.name) && !/\.test\./.test(e.name) ? [p] : [];
    });

interface Call { file: string; route: string; nested: boolean }

/**
 * Every `x.navigate('Name')` with a literal name, and whether it was given the
 * nested form. The object form - navigate('Parent', { screen: 'Child' }) - is
 * how a nested route is addressed correctly, and is recognised here.
 *
 * THE RECEIVER MUST BE THE NAVIGATION OBJECT, and it took two goes to say so.
 *
 * The first draft matched a bare `navigate('X')`. Several screens have a local
 * `navigate(view)` that switches a tab inside themselves - the gym hub calls
 * navigate('WORKOUT') - and it reported seven broken routes that were not
 * routes.
 *
 * The second draft required any receiver, and matched `push('stockouts')` on
 * an array. Four more.
 *
 * A check with false positives is a check somebody switches off, and this one
 * has to survive being read by whoever is annoyed at it.
 */
const literalCalls = (): Call[] => {
    const out: Call[] = [];
    for (const file of walk(SRC)) {
        if (file === NAVIGATOR) continue;
        const source = live(file);
        for (const m of source.matchAll(
            /\b(?:navigation|nav)\b[^.\n]{0,24}\.\s*(?:navigate|replace|push)\(\s*'([A-Za-z]+)'\s*(,\s*\{[^}]*\bscreen\b)?/g,
        )) {
            out.push({
                file: path.relative(SRC, file),
                route: m[1],
                nested: !!m[2],
            });
        }
    }
    return out;
};

describe('the route table', () => {
    it('was read, rather than assumed', () => {
        expect(ROOT_ROUTES.size).toBeGreaterThan(20);
        expect(ROOT_ROUTES.has('Home')).toBe(true);
        expect(ROOT_ROUTES.has('Messages')).toBe(true);
    });

    it('does not contain MyCompany, which is the whole point', () => {
        // If this ever fails, somebody restored the shelved RootStack entry.
        // That is a fine thing to do - but then MyCompany exists twice, and
        // the two copies hold separate state. Decide, do not drift.
        expect(ROOT_ROUTES.has('MyCompany')).toBe(false);
        expect(NESTED.SwipeTab).toContain('MyCompany');
    });
});

describe('every navigate() with a literal name', () => {
    it('names a root route, or addresses a nested one through its parent', () => {
        const broken = literalCalls()
            .filter(c => !ROOT_ROUTES.has(c.route) && !c.nested)
            // A call from inside the navigator that owns the route resolves
            // through the current navigator, which is legitimate. Those are
            // listed rather than guessed at - see the note below.
            .filter(c => !SAME_STACK.some(([f, r]) => c.file.startsWith(f) && c.route === r))
            .map(c => `${c.file}  ->  ${c.route}`);
        expect(broken).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
//  CALLS THAT RESOLVE THROUGH THE CURRENT NAVIGATOR
// ---------------------------------------------------------------------------
//  A screen inside AssetsStack navigating to another screen in AssetsStack is
//  correct and needs no parent name. Listed explicitly rather than inferred
//  from the folder, because the inference is exactly the assumption that hid
//  the original bug: the file's folder is not the navigator it is mounted in.
//
//  Adding a line here is a claim that the caller and the target are in the
//  same navigator. Make it deliberately.
// ---------------------------------------------------------------------------
const SAME_STACK: [string, string][] = [
    ['features/assets/screens/MarketScreen', 'StockDetail'],
    ['features/casino/screens/CasinoScreen', 'SlotsGame'],
    ['features/casino/screens/CasinoScreen', 'RouletteGame'],
    ['features/casino/screens/CasinoScreen', 'PokerGame'],
    ['features/casino/screens/CasinoScreen', 'BlackjackGame'],
    // Shopping is behind a flag that is off. Kept so switching it back on
    // does not fail this file for a reason unrelated to whatever was changed.
    ['features/shopping/screens/BelongingsScreen', 'Shopping'],
    ['features/shopping/screens/ShoppingScreen', 'Belongings'],
    ['features/shopping/screens/ShoppingScreen', 'Life'],
];
