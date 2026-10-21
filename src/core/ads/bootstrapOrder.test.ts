// src/core/ads/bootstrapOrder.test.ts
//
// ============================================================================
//  THE TWO LINES NOTHING WAS WATCHING
// ============================================================================
//
//  Both of these were written, reasoned about at length in comments, and left
//  completely unguarded. The probe that should have turned them red stayed
//  green, which is how they were found:
//
//    1. bootstrap calls the tracking prompt BEFORE the advertising SDK.
//       Reordered, every session's first advertisement is non-personalised
//       whatever the person answers, because the IDFA is read when a request
//       is built and initAds builds one immediately.
//
//    2. `requestNonPersonalizedAdsOnly` is INVERTED. Permission granted has to
//       become `false`. Flipped, the app serves targeted advertisements to
//       somebody who refused tracking, and nothing in the SDK complains. That
//       is a privacy failure rather than a revenue one.
//
//  Neither has a symptom. Both are silent in exactly the way this codebase
//  keeps being bitten by.
// ============================================================================

import { AppState, NativeModules } from 'react-native';

let mockAds: any = {};
let mockTracking: any = {};
let mockPurchases: any = {};

jest.mock('react-native-google-mobile-ads', () => mockAds);
jest.mock('react-native-tracking-transparency', () => ({
    get getTrackingStatus() { return mockTracking.getTrackingStatus; },
    get requestTrackingPermission() { return mockTracking.requestTrackingPermission; },
}), { virtual: true });
jest.mock('react-native-purchases', () => ({
    __esModule: true,
    get default() { return mockPurchases; },
}));

/** Records what happened and in what order, across all three adapters. */
let order: string[] = [];

const adRequestOptions: any[] = [];

const freshAdsMock = () => ({
    default: () => ({
        initialize: jest.fn(async () => {
            order.push('ads:init');
        }),
    }),
    AdEventType: { LOADED: 'loaded', ERROR: 'error', CLOSED: 'closed' },
    InterstitialAd: {
        createForAdRequest: jest.fn((_unit: string, options: any) => {
            order.push('ads:request');
            adRequestOptions.push(options);
            return {
                addAdEventListener: jest.fn(() => jest.fn()),
                load: jest.fn(),
                show: jest.fn(),
            };
        }),
    },
});

const load = () => {
    let mod: any;
    jest.isolateModules(() => {
        require('./diagnostics').resetDiagnostics();
        mod = require('./bootstrap');
    });
    return mod;
};

beforeEach(() => {
    order = [];
    adRequestOptions.length = 0;

    // iOS will not present the tracking alert unless the app is active, so
    // tracking.ts waits for it. Under Jest nothing ever becomes active, and
    // without this every `not-determined` case would sit out the full
    // ACTIVE_TIMEOUT_MS and then assert on a prompt that was never shown.
    (AppState as any).currentState = 'active';

    (NativeModules as any).RNGoogleMobileAdsModule = {};
    (NativeModules as any).RNTrackingTransparency = {};
    (NativeModules as any).RNPurchases = {};

    mockAds = freshAdsMock();
    mockPurchases = {
        configure: jest.fn(),
        getCustomerInfo: jest.fn(async () => ({ entitlements: { active: {}, all: {} } })),
    };
    mockTracking = {
        getTrackingStatus: jest.fn(async () => {
            order.push('tracking:read');
            return 'not-determined';
        }),
        requestTrackingPermission: jest.fn(async () => {
            order.push('tracking:ask');
            return 'authorized';
        }),
    };
});

afterEach(() => {
    delete (NativeModules as any).RNGoogleMobileAdsModule;
    delete (NativeModules as any).RNTrackingTransparency;
    delete (NativeModules as any).RNPurchases;
});

describe('the order bootstrap runs things in', () => {
    it('asks for tracking before the advertising SDK starts', async () => {
        const { bootstrapAds } = load();
        await bootstrapAds();

        const ask = order.indexOf('tracking:ask');
        const init = order.indexOf('ads:init');
        const request = order.indexOf('ads:request');

        expect(ask).toBeGreaterThan(-1);
        expect(init).toBeGreaterThan(-1);
        expect(request).toBeGreaterThan(-1);

        // The whole point. An advertisement requested before the answer is a
        // non-personalised one whatever the person then taps.
        expect(ask).toBeLessThan(init);
        expect(ask).toBeLessThan(request);
    });

    it('and reports what it settled on', async () => {
        const { bootstrapAds } = load();
        await expect(bootstrapAds()).resolves.toEqual(
            expect.objectContaining({ personalised: true }),
        );
    });
});

describe('the personalisation flag, which is inverted', () => {
    it('permission granted asks for personalised advertisements', async () => {
        const { bootstrapAds } = load();
        await bootstrapAds();

        expect(adRequestOptions.length).toBeGreaterThan(0);
        // `requestNonPersonalizedAdsOnly: true` means DO NOT personalise.
        // Authorized therefore has to produce false.
        expect(adRequestOptions[0].requestNonPersonalizedAdsOnly).toBe(false);
    });

    it('and a refusal is honoured', async () => {
        // ------------------------------------------------------------------
        //  THE DIRECTION THAT COSTS SOMEBODY ELSE SOMETHING
        // ------------------------------------------------------------------
        //  Getting this backwards the other way costs money. Getting it
        //  backwards THIS way spends a permission that was explicitly
        //  refused, and no error is raised anywhere.
        // ------------------------------------------------------------------
        mockTracking.getTrackingStatus = jest.fn(async () => 'denied');

        const { bootstrapAds } = load();
        const result = await bootstrapAds();

        expect(result.personalised).toBe(false);
        expect(adRequestOptions[0].requestNonPersonalizedAdsOnly).toBe(true);
    });

    it('and so is a device that cannot be asked', async () => {
        mockTracking.getTrackingStatus = jest.fn(async () => 'restricted');

        const { bootstrapAds } = load();
        await bootstrapAds();
        expect(adRequestOptions[0].requestNonPersonalizedAdsOnly).toBe(true);
    });

    it('but a device with no tracking API at all is not treated as a refusal', async () => {
        // Android, and every iPhone below iOS 14. There is no permission being
        // ignored because there is no permission to ask for.
        mockTracking.getTrackingStatus = jest.fn(async () => 'unavailable');

        const { bootstrapAds } = load();
        await bootstrapAds();
        expect(adRequestOptions[0].requestNonPersonalizedAdsOnly).toBe(false);
    });
});

describe('nothing in the chain can take the app down', () => {
    it('a tracking module that throws still lets advertising start', async () => {
        mockTracking.getTrackingStatus = jest.fn(async () => { throw new Error('nope'); });

        const { bootstrapAds } = load();
        const result = await bootstrapAds();

        expect(result.ads).toBe(true);
        // Unknown permission is treated as no permission for personalisation,
        // which is the forgiving direction for the player rather than for us.
        expect(adRequestOptions[0].requestNonPersonalizedAdsOnly).toBe(false);
    });
});

describe('and the default, for anyone who calls initAds directly', () => {
    it('is non-personalised', async () => {
        // ------------------------------------------------------------------
        //  A DEFAULT NO LIVE PATH REACHES IS STILL WORTH PINNING
        // ------------------------------------------------------------------
        //  bootstrap always passes an explicit value, so flipping this default
        //  changes nothing today and every other test stays green. It matters
        //  for the next caller: the safe direction is the one that respects a
        //  refusal, and the cost of getting it wrong is spending somebody's
        //  permission rather than losing revenue.
        // ------------------------------------------------------------------
        let initAds: any;
        jest.isolateModules(() => { initAds = require('./admob').initAds; });

        await initAds();
        expect(adRequestOptions[0].requestNonPersonalizedAdsOnly).toBe(true);
    });
});
