// src/core/ads/tracking.test.ts
//
// ============================================================================
//  ASKING AT THE WRONG MOMENT IS INDISTINGUISHABLE FROM ASKING
// ============================================================================
//
//  iOS refuses to present the tracking alert unless the app is ACTIVE. Called
//  during launch it returns immediately, shows nothing, throws nothing, and
//  leaves the status where it was. The app has then used its one opportunity:
//  the system only presents that alert once, and a request it declined to show
//  still counts.
//
//  There is no way to detect that afterwards. The status reads `not-determined`
//  both when nobody has been asked and when the app asked into the void. So it
//  cannot be caught by a device test either, which is why it is pinned here.
// ============================================================================

import { AppState, NativeModules } from 'react-native';

let mockTracking: any = {};

/**
 * The fake library.
 *
 * GETTERS, not a plain object. `jest.mock`'s factory runs ONCE and its return
 * value becomes the module for the whole file, so handing back `mockTracking`
 * directly freezes whatever the first test happened to assign and every later
 * test silently exercises the wrong permission state. That failure reads as a
 * bug in tracking.ts rather than in the test, which is the worst kind.
 *
 * Marked virtual because the package is not installed in this sandbox: it is
 * a real dependency that arrives with `npm install` on the machine that builds
 * iOS. trackingGuard.test.ts checks the real one once it exists.
 */
jest.mock('react-native-tracking-transparency', () => ({
    get getTrackingStatus() { return mockTracking.getTrackingStatus; },
    get requestTrackingPermission() { return mockTracking.requestTrackingPermission; },
}), { virtual: true });

/**
 * Load tracking.ts fresh, and hand back the diagnostics module it writes to.
 *
 * ---------------------------------------------------------------------------
 *  BOTH FROM INSIDE THE SAME ISOLATE, AND THAT IS NOT A DETAIL
 * ---------------------------------------------------------------------------
 *  `jest.isolateModules` gives the code inside it a private module registry.
 *  tracking.ts requires diagnostics from THAT registry, so a `readDiagnostics`
 *  imported at the top of this file is a different module object holding
 *  different state. Written that way the assertions read an empty log and
 *  report that nothing was recorded, which is a test failing for a reason that
 *  has nothing to do with the code under test.
 *
 *  The `looked` flag in tracking.ts is why the isolate is needed at all: it
 *  caches the SDK lookup for the life of the module, which is right in the app
 *  and wrong in a file with six different fake permission states.
 * ---------------------------------------------------------------------------
 */
const load = () => {
    let tracking: any;
    let diagnostics: any;
    jest.isolateModules(() => {
        diagnostics = require('./diagnostics');
        diagnostics.resetDiagnostics();
        tracking = require('./tracking');
    });
    return { ...tracking, readDiagnostics: diagnostics.readDiagnostics };
};

beforeEach(() => {
    (NativeModules as any).RNTrackingTransparency = {};
    mockTracking = {};
    (AppState as any).currentState = 'active';
});

afterEach(() => {
    delete (NativeModules as any).RNTrackingTransparency;
});

describe('when the app is already in the foreground', () => {
    it('asks, and reports what the person chose', async () => {
        mockTracking = {
            getTrackingStatus: jest.fn(async () => 'not-determined'),
            requestTrackingPermission: jest.fn(async () => 'authorized'),
        };

        const { requestTrackingIfNeeded } = load();
        await expect(requestTrackingIfNeeded()).resolves.toBe('authorized');
        expect(mockTracking.requestTrackingPermission).toHaveBeenCalled();
    });

    it('and a refusal is carried through honestly', async () => {
        mockTracking = {
            getTrackingStatus: jest.fn(async () => 'not-determined'),
            requestTrackingPermission: jest.fn(async () => 'denied'),
        };

        const { requestTrackingIfNeeded, trackingAllowed } = load();
        const status = await requestTrackingIfNeeded();
        expect(status).toBe('denied');
        expect(trackingAllowed(status)).toBe(false);
    });
});

describe('when the app has not come to the foreground', () => {
    it('does NOT ask, and says why', async () => {
        // ------------------------------------------------------------------
        //  THE WHOLE POINT OF THIS FILE
        // ------------------------------------------------------------------
        //  Asking here would burn the single prompt on a dialog nobody sees.
        //  Leaving it for the next launch costs one session of
        //  non-personalised advertisements; asking costs the permission
        //  permanently.
        // ------------------------------------------------------------------
        jest.useFakeTimers();
        (AppState as any).currentState = 'background';

        mockTracking = {
            getTrackingStatus: jest.fn(async () => 'not-determined'),
            requestTrackingPermission: jest.fn(async () => 'authorized'),
        };

        const { requestTrackingIfNeeded, readDiagnostics } = load();
        const pending = requestTrackingIfNeeded();
        await Promise.resolve();
        jest.advanceTimersByTime(11_000);

        await expect(pending).resolves.toBe('not-determined');
        expect(mockTracking.requestTrackingPermission).not.toHaveBeenCalled();
        expect(readDiagnostics().trackingHow).toContain('never became active');

        jest.useRealTimers();
    });

    it('but asks as soon as it does come forward', async () => {
        jest.useFakeTimers();
        (AppState as any).currentState = 'background';

        let listener: ((s: string) => void) | null = null;
        const spy = jest.spyOn(AppState, 'addEventListener').mockImplementation(((
            _type: string, cb: (s: string) => void,
        ) => {
            listener = cb;
            return { remove: jest.fn() } as any;
        }) as any);

        mockTracking = {
            getTrackingStatus: jest.fn(async () => 'not-determined'),
            requestTrackingPermission: jest.fn(async () => 'authorized'),
        };

        const { requestTrackingIfNeeded } = load();
        const pending = requestTrackingIfNeeded();
        await Promise.resolve();
        await Promise.resolve();

        expect(listener).not.toBeNull();
        listener!('active');

        await expect(pending).resolves.toBe('authorized');
        expect(mockTracking.requestTrackingPermission).toHaveBeenCalled();

        spy.mockRestore();
        jest.useRealTimers();
    });
});

describe('when the question has already been answered', () => {
    it('does not ask again and does not wait for anything', async () => {
        // The prompt never shows twice. Waiting ten seconds for a foreground
        // that cannot change the answer would delay the first advertisement
        // of every single session.
        (AppState as any).currentState = 'background';

        mockTracking = {
            getTrackingStatus: jest.fn(async () => 'denied'),
            requestTrackingPermission: jest.fn(async () => 'authorized'),
        };

        const { requestTrackingIfNeeded, readDiagnostics } = load();
        await expect(requestTrackingIfNeeded()).resolves.toBe('denied');
        expect(mockTracking.requestTrackingPermission).not.toHaveBeenCalled();
        expect(readDiagnostics().trackingHow).toBe('already settled');
    });

    it('and `restricted` is respected rather than retried', async () => {
        mockTracking = {
            getTrackingStatus: jest.fn(async () => 'restricted'),
            requestTrackingPermission: jest.fn(async () => 'authorized'),
        };

        const { requestTrackingIfNeeded, trackingAllowed } = load();
        const status = await requestTrackingIfNeeded();
        expect(status).toBe('restricted');
        expect(trackingAllowed(status)).toBe(false);
        expect(mockTracking.requestTrackingPermission).not.toHaveBeenCalled();
    });
});

describe('without the native module', () => {
    it('reports unavailable instead of throwing', async () => {
        delete (NativeModules as any).RNTrackingTransparency;

        const { requestTrackingIfNeeded, readDiagnostics } = load();
        await expect(requestTrackingIfNeeded()).resolves.toBe('unavailable');
        expect(readDiagnostics().trackingHow).toBe('module missing');
    });

    it('and a throwing library is swallowed', async () => {
        mockTracking = {
            getTrackingStatus: jest.fn(async () => { throw new Error('boom'); }),
        };

        const { requestTrackingIfNeeded, readDiagnostics } = load();
        await expect(requestTrackingIfNeeded()).resolves.toBe('unavailable');
        expect(readDiagnostics().trackingHow).toContain('boom');
    });
});

describe('what counts as permission to personalise', () => {
    it('authorized and unavailable, and nothing else', () => {
        // ------------------------------------------------------------------
        //  `unavailable` IS NOT A LOOPHOLE
        // ------------------------------------------------------------------
        //  It means the device has no tracking API to consult: every Android
        //  device, and every iPhone below iOS 14. There is no permission being
        //  ignored, because there is no permission to ask for.
        // ------------------------------------------------------------------
        const { trackingAllowed } = load();
        expect(trackingAllowed('authorized')).toBe(true);
        expect(trackingAllowed('unavailable')).toBe(true);
        expect(trackingAllowed('denied')).toBe(false);
        expect(trackingAllowed('restricted')).toBe(false);
        expect(trackingAllowed('not-determined')).toBe(false);
    });
});
