// src/core/ads/trackingGuard.test.ts
//
// ============================================================================
//  CLOSING THE ONE GUESS IN tracking.ts
// ============================================================================
//
//  admob.ts and billing.ts each name exactly one native module, read out of
//  the library's own source:
//
//      RNGoogleMobileAdsModule   from ReactNativeGoogleMobileAdsModule.kt
//      RNPurchases               from RNPurchasesModule.java:66
//
//  tracking.ts could not do that. The package was not installed when it was
//  written, so the registered name was not measurable, and a hard-coded guess
//  would have been a check that passes because it is not looking: the guard
//  would report the module absent on every device and the tracking prompt
//  would never appear, with nothing anywhere saying why.
//
//  So it carries a LIST of candidates, and this file closes it by measurement
//  as soon as the package exists on the machine. Until then it skips and says
//  so, which is an honest unknown rather than a silent one.
// ============================================================================

import fs from 'fs';
import path from 'path';

const ROOT = path.join(__dirname, '..', '..', '..');
const PKG = 'node_modules/react-native-tracking-transparency';

const installed = fs.existsSync(path.join(ROOT, PKG));
const itInstalled = installed ? it : it.skip;

/** tracking.ts with `//` comments stripped, so prose is never the evidence. */
const code = (): string =>
    fs.readFileSync(path.join(ROOT, 'src/core/ads/tracking.ts'), 'utf8')
        .split('\n')
        .filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
        .join('\n');

/** Every quoted string the candidate list contains. */
const candidates = (): string[] => {
    const block = code().match(
        /NATIVE_MODULE_CANDIDATES\s*=\s*\[([\s\S]*?)\]/,
    );
    if (!block) return [];
    return [...block[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
};

describe('the native module name', () => {
    itInstalled('is one the guard actually looks for', () => {
        // ------------------------------------------------------------------
        //  READ FROM THE INSTALLED PACKAGE, NOT FROM MEMORY
        // ------------------------------------------------------------------
        //  Both halves are searched: the iOS sources name the module in an
        //  RCT_EXPORT_MODULE macro or a Swift @objc(...) attribute, and the
        //  JavaScript entry point names it in a NativeModules lookup. One of
        //  them will say it.
        // ------------------------------------------------------------------
        const root = path.join(ROOT, PKG);

        const files: string[] = [];
        const walk = (dir: string) => {
            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                const full = path.join(dir, entry.name);
                if (entry.isDirectory()) walk(full);
                else if (/\.(m|mm|swift|h|js|ts|tsx)$/.test(entry.name)) files.push(full);
            }
        };
        walk(root);

        const names = new Set<string>();
        for (const f of files) {
            const src = fs.readFileSync(f, 'utf8');
            for (const m of src.matchAll(/RCT_EXPORT_MODULE(?:_NO_LOAD)?\(\s*([A-Za-z_][\w]*)/g)) {
                names.add(m[1]);
            }
            for (const m of src.matchAll(/@objc\(\s*([A-Za-z_][\w]*)\s*\)/g)) names.add(m[1]);
            for (const m of src.matchAll(/NativeModules\.([A-Za-z_][\w]*)/g)) names.add(m[1]);
            for (const m of src.matchAll(/NativeModules\[\s*'([^']+)'\s*\]/g)) names.add(m[1]);
        }

        expect(names.size).toBeGreaterThan(0);

        const listed = candidates();
        const matched = [...names].filter(n => listed.includes(n));

        // If this fails, the message names what the package actually
        // registers, so the fix is one line in tracking.ts.
        expect({ registers: [...names].sort(), weLookFor: listed, matched })
            .toEqual(expect.objectContaining({ matched: expect.arrayContaining([expect.any(String)]) }));
    });

    it('the candidate list is not empty, installed or not', () => {
        // A list that silently emptied would make nativeSideIsPresent() always
        // false, which reads exactly like a device that does not support ATT.
        expect(candidates().length).toBeGreaterThan(0);
    });

    it('and the guard runs BEFORE the require, as in the other two adapters', () => {
        // Order is the whole fix; see nativeGuard.test.ts for why a try/catch
        // around require cannot protect anybody under Metro.
        const src = code();
        const guard = src.indexOf('if (!nativeSideIsPresent())');
        const requireCall = src.indexOf("require('react-native-tracking-transparency')");
        expect(guard).toBeGreaterThan(-1);
        expect(requireCall).toBeGreaterThan(-1);
        expect(guard).toBeLessThan(requireCall);
        expect(src).not.toContain('getEnforcing');
    });

    it('and the package is a declared dependency', () => {
        // The guard degrades gracefully when the package is missing, which is
        // exactly why a forgotten dependency would never be noticed: the
        // prompt would simply never appear.
        const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
        expect(pkg.dependencies['react-native-tracking-transparency']).toBeDefined();
    });
});

if (!installed) {
    // eslint-disable-next-line no-console
    console.log(
        '[trackingGuard] react-native-tracking-transparency is not installed here, ' +
        'so the module name check was skipped. It runs after `npm install`.',
    );
}
