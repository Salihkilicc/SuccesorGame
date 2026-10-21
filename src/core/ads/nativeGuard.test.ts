// src/core/ads/nativeGuard.test.ts
//
// ============================================================================
//  A try/catch AROUND require DOES NOT CATCH A MISSING NATIVE MODULE
// ============================================================================
//
//  Reported from a device as a red screen:
//
//      TurboModuleRegistry.getEnforcing(...): 'RNGoogleMobileAdsModule'
//      could not be found. Verify that a module by this name is registered
//      in the native binary.
//        at ads (admob.ts:41)
//
//  Line 41 was inside a try. The catch never ran. The reason is in Metro
//  itself, and it is quoted here because a claim about somebody else's
//  library is the kind that goes stale silently:
//
//      metro-runtime/src/polyfills/require.js:178
//        function guardedLoadModule(moduleId, module) {
//          if (!inGuard && global.ErrorUtils) {
//            inGuard = true;
//            let returnValue;
//            try { returnValue = loadModuleImplementation(moduleId, module); }
//            catch (e) { global.ErrorUtils.reportFatalError(e); }
//            inGuard = false;
//            return returnValue;
//          }
//          ...
//
//  In development Metro CATCHES the module-init error, sends it to the red
//  screen, and returns `undefined`. It does not re-throw. So no try/catch
//  downstream can prevent the crash screen; the only way to avoid it is to
//  not load the package when its native half is absent.
//
//  What is pinned below is therefore not "we handle the error" - we cannot -
//  but "we ask first, with the non-throwing lookup".
// ============================================================================

import fs from 'fs';
import path from 'path';

const ROOT = path.join(__dirname, '..', '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/** Source with `//` comments stripped, so the explanation is not the evidence. */
const code = (rel: string): string =>
    read(rel)
        .split('\n')
        .filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
        .join('\n');

const ADAPTERS = [
    { file: 'src/core/ads/admob.ts', module: 'RNGoogleMobileAdsModule' },
    { file: 'src/core/ads/billing.ts', module: 'RNPurchases' },
] as const;

describe('each adapter asks before it loads', () => {
    it.each(ADAPTERS)('$file uses the non-throwing lookup', ({ file }) => {
        const src = code(file);
        // `get` answers. `getEnforcing` asserts and throws, which is the
        // function that produced the red screen in the first place.
        expect(src).toContain('TurboModuleRegistry?.get?.(');
        expect(src).not.toContain('getEnforcing');
    });

    it.each(ADAPTERS)('$file names the module the native side registers', ({ file, module }) => {
        expect(code(file)).toContain(`const NATIVE_MODULE = '${module}';`);
    });

    it.each(ADAPTERS)('$file checks the old bridge too', ({ file }) => {
        // Which registry answers depends on whether the app is running the
        // new architecture. react-native-purchases is a legacy bridge module
        // and would be invisible to TurboModuleRegistry alone.
        expect(code(file)).toContain('NativeModules');
    });

    it.each(ADAPTERS)('$file guards BEFORE the require, not after', ({ file }) => {
        // ------------------------------------------------------------------
        //  ORDER IS THE WHOLE FIX
        // ------------------------------------------------------------------
        //  A check after the require is a check that runs once the red screen
        //  is already up. This is the assertion that would have caught the
        //  original bug, and it is about position rather than presence.
        // ------------------------------------------------------------------
        const src = code(file);
        const guard = src.indexOf('if (!nativeSideIsPresent())');
        const requireCall = src.indexOf("require('react-native-");
        expect(guard).toBeGreaterThan(-1);
        expect(requireCall).toBeGreaterThan(-1);
        expect(guard).toBeLessThan(requireCall);
    });
});

describe('and the claim about metro is still true', () => {
    it('guardedLoadModule reports and returns rather than rethrowing', () => {
        // ------------------------------------------------------------------
        //  THE EVIDENCE, READ FROM node_modules RATHER THAN REMEMBERED
        // ------------------------------------------------------------------
        //  If a future Metro starts re-throwing, the guard above becomes
        //  unnecessary rather than wrong - but the comments explaining it
        //  become false, and a false explanation is worse than none. This
        //  test goes red when the reasoning expires.
        // ------------------------------------------------------------------
        const metro = 'node_modules/metro-runtime/src/polyfills/require.js';
        if (!fs.existsSync(path.join(ROOT, metro))) return;

        const src = read(metro);
        const start = src.indexOf('function guardedLoadModule');
        expect(start).toBeGreaterThan(-1);
        const body = src.slice(start, start + 500);

        expect(body).toContain('reportFatalError');
        // The catch hands the error to the reporter and stops there. A
        // `throw e` in this block would mean our try/catch could have worked.
        const clause = body.slice(body.indexOf('catch'), body.indexOf('inGuard = false'));
        expect(clause).not.toContain('throw');
    });
});
