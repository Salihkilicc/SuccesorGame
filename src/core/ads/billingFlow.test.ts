// src/core/ads/billingFlow.test.ts
//
// ============================================================================
//  THE PURCHASE, RUN AGAINST A FAKE STORE
// ============================================================================
//
//  billing.ts had no behavioural test until now. It was reasoned about instead,
//  and the reasoning missed the one thing that matters most: the entitlement
//  identifier. Whichever way round it is, a mismatch does not throw.
//  `getCustomerInfo()` returns 200, the purchase completes, the money moves,
//  and
//
//      customerInfo.entitlements.active[THE_WRONG_NAME]
//
//  is undefined for the rest of that customer's life. There is no error to
//  catch and no log to read. A player pays and keeps seeing advertisements.
//
//  THREE VALUES WERE SHIPPED BEFORE THE RIGHT ONE. `ad_free`, then `premium`,
//  and the dashboard defines `Premium`. The third was found by reading it off
//  a device rather than by being told, and the difference between the second
//  and third is one capital letter.
//
//  That is not a bug a code review finds, because both halves are correct on
//  their own. It is only visible when the two are put side by side, which is
//  what this file does: a fake RevenueCat that answers the way the real one
//  does, and assertions about what ends up in the store the game reads.
//
//  ---------------------------------------------------------------------------
//  WHY THE SDK HAS TO BE FAKED AT TWO LEVELS
//  ---------------------------------------------------------------------------
//  billing.ts refuses to `require` the package until the NATIVE module answers
//  - see nativeGuard.test.ts for why that order is the whole fix. Under Jest
//  there is no native side at all, so the guard correctly reports the SDK as
//  unavailable and every function returns `unavailable` before touching the
//  mock. Hence NativeModules.RNPurchases is planted as well as the module.
// ============================================================================

import { NativeModules } from 'react-native';

/** Swapped per test. `mock` prefix is what lets jest.mock reach it. */
let mockSdk: any = {};

jest.mock('react-native-purchases', () => ({
    __esModule: true,
    get default() { return mockSdk; },
}));

/**
 * A customer info object shaped the way RevenueCat shapes one.
 *
 * `active` is what the player owns right now; `all` is every entitlement the
 * project defines, owned or not. Reading the wrong one is a second silent
 * failure of the same family, so both are present here.
 */
const customerInfo = (active: string[], all: string[] = ['Premium']) => ({
    entitlements: {
        active: Object.fromEntries(active.map(k => [k, { identifier: k, isActive: true }])),
        all: Object.fromEntries(all.map(k => [k, { identifier: k }])),
    },
});

const LIFETIME = { identifier: '$rc_lifetime', product: { identifier: 'ad_free' } };

/**
 * Load a fresh copy of billing.ts against the current mock.
 *
 * Its `looked` flag caches the SDK lookup for the life of the module, which is
 * right in the app and wrong in a test file with six different fake stores.
 */
const loadBilling = () => {
    let mod: any;
    jest.isolateModules(() => {
        mod = require('./billing');
    });
    return mod;
};

beforeEach(() => {
    (NativeModules as any).RNPurchases = {};
    mockSdk = {};
});

afterEach(() => {
    delete (NativeModules as any).RNPurchases;
});

// ============================================================================
//  THE IDENTIFIER THE GAME ASKS ABOUT
// ============================================================================

describe('the entitlement the purchase actually grants', () => {
    it('a customer holding Premium comes back ad free', async () => {
        mockSdk = {
            configure: jest.fn(),
            getCustomerInfo: jest.fn(async () => customerInfo(['Premium'])),
        };

        const { initBilling } = loadBilling();
        await expect(initBilling()).resolves.toEqual({ ok: true, adFree: true });
    });

    it('and the identifier is the dashboard\'s exact string, case included', () => {
        // ------------------------------------------------------------------
        //  THE PROBE, WRITTEN AS AN ASSERTION
        // ------------------------------------------------------------------
        //  This is the exact state the code was in an hour ago, expressed from
        //  the other side. If somebody sets AD_FREE_ENTITLEMENT back to
        //  'ad_free', the test above goes red and this one stays green - the
        //  pair says which of the two strings moved.
        // ------------------------------------------------------------------
        const { AD_FREE_ENTITLEMENT } = require('./config');
        expect(AD_FREE_ENTITLEMENT).not.toBe('ad_free');
        expect(AD_FREE_ENTITLEMENT).toBe('Premium');
    });

    it('owning nothing is a success with adFree false, not a failure', async () => {
        // A new player reaches this path on every cold start. If it reported
        // an error the log would be full of them and the real ones would be
        // invisible.
        mockSdk = {
            configure: jest.fn(),
            getCustomerInfo: jest.fn(async () => customerInfo([])),
        };

        const { initBilling } = loadBilling();
        await expect(initBilling()).resolves.toEqual({ ok: true, adFree: false });
    });

    it('and the key handed to configure is the one from config', async () => {
        const configure = jest.fn();
        mockSdk = { configure, getCustomerInfo: jest.fn(async () => customerInfo([])) };

        const { initBilling } = loadBilling();
        await initBilling();

        const { revenueCatKey } = require('./config');
        expect(configure).toHaveBeenCalledWith({ apiKey: revenueCatKey() });
    });
});

// ============================================================================
//  WHICH ROUTE THE PURCHASE TAKES
// ============================================================================

describe('buying through the offering', () => {
    it('takes the lifetime package out of the named offering', async () => {
        const purchasePackage = jest.fn(async () => ({ customerInfo: customerInfo(['Premium']) }));
        const getProducts = jest.fn();

        mockSdk = {
            configure: jest.fn(),
            getOfferings: jest.fn(async () => ({
                all: { default: { availablePackages: [LIFETIME] } },
                current: null,
            })),
            purchasePackage,
            getProducts,
        };

        const { purchaseAdFree } = loadBilling();
        await expect(purchaseAdFree()).resolves.toEqual({ ok: true, adFree: true });

        expect(purchasePackage).toHaveBeenCalledWith(LIFETIME);
        // The whole point of the offering path: the product id never comes up.
        expect(getProducts).not.toHaveBeenCalled();
    });

    it('falls back to the product id when the offering is empty', async () => {
        // ------------------------------------------------------------------
        //  A SERVER-SIDE GAP MUST NOT BE A DEAD BUTTON
        // ------------------------------------------------------------------
        //  Offerings come from RevenueCat's servers. A dashboard edit in
        //  flight, a cold cache or a half-answered network all produce this,
        //  and none of them is a reason to tell a player who wants to pay
        //  that the store is unreachable.
        // ------------------------------------------------------------------
        const product = { identifier: 'ad_free' };
        const purchaseStoreProduct = jest.fn(async () => ({ customerInfo: customerInfo(['Premium']) }));

        mockSdk = {
            configure: jest.fn(),
            getOfferings: jest.fn(async () => ({ all: {}, current: null })),
            getProducts: jest.fn(async () => [product]),
            purchaseStoreProduct,
        };

        const { purchaseAdFree } = loadBilling();
        await expect(purchaseAdFree()).resolves.toEqual({ ok: true, adFree: true });
        expect(purchaseStoreProduct).toHaveBeenCalledWith(product);
    });

    it('and when getOfferings throws outright', async () => {
        const purchaseStoreProduct = jest.fn(async () => ({ customerInfo: customerInfo(['Premium']) }));

        mockSdk = {
            configure: jest.fn(),
            getOfferings: jest.fn(async () => { throw new Error('network'); }),
            getProducts: jest.fn(async () => [{ identifier: 'ad_free' }]),
            purchaseStoreProduct,
        };

        const { purchaseAdFree } = loadBilling();
        await expect(purchaseAdFree()).resolves.toEqual({ ok: true, adFree: true });
        expect(purchaseStoreProduct).toHaveBeenCalled();
    });

    it('reports unavailable only when BOTH routes come back empty', async () => {
        mockSdk = {
            configure: jest.fn(),
            getOfferings: jest.fn(async () => ({ all: {}, current: null })),
            getProducts: jest.fn(async () => []),
        };

        const { purchaseAdFree } = loadBilling();
        await expect(purchaseAdFree()).resolves.toEqual({ ok: false, reason: 'unavailable' });
    });

    it('uses the current offering when the named one is missing', async () => {
        const purchasePackage = jest.fn(async () => ({ customerInfo: customerInfo(['Premium']) }));
        mockSdk = {
            configure: jest.fn(),
            getOfferings: jest.fn(async () => ({
                all: { somethingElse: { availablePackages: [] } },
                current: { availablePackages: [LIFETIME] },
            })),
            purchasePackage,
        };

        const { purchaseAdFree } = loadBilling();
        await expect(purchaseAdFree()).resolves.toEqual({ ok: true, adFree: true });
        expect(purchasePackage).toHaveBeenCalledWith(LIFETIME);
    });
});

// ============================================================================
//  BACKING OUT IS NOT A FAILURE
// ============================================================================

describe('the ways a purchase ends', () => {
    it('cancelling is its own outcome', async () => {
        // Shown as an error this reads "something went wrong with your
        // payment", which is both false and alarming, and it is the single
        // most common way this button ends.
        mockSdk = {
            configure: jest.fn(),
            getOfferings: jest.fn(async () => ({ all: { default: { availablePackages: [LIFETIME] } } })),
            purchasePackage: jest.fn(async () => {
                const e: any = new Error('cancelled');
                e.userCancelled = true;
                throw e;
            }),
        };

        const { purchaseAdFree } = loadBilling();
        await expect(purchaseAdFree()).resolves.toEqual({ ok: false, reason: 'cancelled' });
    });

    it('a real failure carries its message', async () => {
        mockSdk = {
            configure: jest.fn(),
            getOfferings: jest.fn(async () => ({ all: { default: { availablePackages: [LIFETIME] } } })),
            purchasePackage: jest.fn(async () => { throw new Error('Billing is not available'); }),
        };

        const { purchaseAdFree } = loadBilling();
        await expect(purchaseAdFree()).resolves.toEqual({
            ok: false, reason: 'error', message: 'Billing is not available',
        });
    });
});

// ============================================================================
//  RESTORE
// ============================================================================

describe('restoring', () => {
    it('restores when the entitlement comes back', async () => {
        mockSdk = {
            configure: jest.fn(),
            restorePurchases: jest.fn(async () => customerInfo(['Premium'])),
        };

        const { restorePurchases } = loadBilling();
        await expect(restorePurchases()).resolves.toEqual({ ok: true, adFree: true });
    });

    it('and says there was nothing rather than claiming success', async () => {
        // "Restored" and "there was nothing to restore" are different pieces
        // of news. Saying the first when it means the second leaves somebody
        // believing they are ad free until the next advertisement disagrees.
        mockSdk = {
            configure: jest.fn(),
            restorePurchases: jest.fn(async () => customerInfo([])),
        };

        const { restorePurchases } = loadBilling();
        await expect(restorePurchases()).resolves.toEqual({ ok: false, reason: 'nothingToRestore' });
    });
});

// ============================================================================
//  AND THE FLAG THE REST OF THE GAME READS
// ============================================================================

describe('what lands in the store', () => {
    it('a successful purchase writes adFree straight through', async () => {
        mockSdk = {
            configure: jest.fn(),
            getOfferings: jest.fn(async () => ({ all: { default: { availablePackages: [LIFETIME] } } })),
            purchasePackage: jest.fn(async () => ({ customerInfo: customerInfo(['Premium']) })),
        };

        let store: any;
        let purchaseAdFree: any;
        jest.isolateModules(() => {
            store = require('../store/useIdentityStore').useIdentityStore;
            purchaseAdFree = require('./billing').purchaseAdFree;
        });

        store.getState().applyEntitlement(false);
        expect(store.getState().adFree).toBe(false);

        await purchaseAdFree();
        expect(store.getState().adFree).toBe(true);
    });

    it('and the gate stops letting advertisements through', async () => {
        // The purchase and the silence are two separate mechanisms joined by
        // one boolean. This is the join, asserted rather than assumed.
        mockSdk = {
            configure: jest.fn(),
            getCustomerInfo: jest.fn(async () => customerInfo(['Premium'])),
        };

        let gate: any;
        let initBilling: any;
        jest.isolateModules(() => {
            gate = require('./gate');
            initBilling = require('./billing').initBilling;
        });

        const shown = jest.fn(async () => { });
        gate.setAdPresenter(shown);

        await initBilling();

        for (let i = 0; i < 12; i++) await gate.adGate('quarterAdvanced');
        expect(shown).not.toHaveBeenCalled();
    });
});

// ============================================================================
//  NO NATIVE SIDE, NO CRASH
// ============================================================================

describe('without the native module', () => {
    it('every entry point reports unavailable instead of throwing', async () => {
        delete (NativeModules as any).RNPurchases;

        const { initBilling, purchaseAdFree, restorePurchases, isBillingAvailable } = loadBilling();

        expect(isBillingAvailable()).toBe(false);
        await expect(initBilling()).resolves.toEqual({ ok: false, reason: 'unavailable' });
        await expect(purchaseAdFree()).resolves.toEqual({ ok: false, reason: 'unavailable' });
        await expect(restorePurchases()).resolves.toEqual({ ok: false, reason: 'unavailable' });
    });
});

// ============================================================================
//  A NAME THE PROJECT DOES NOT HAVE
// ============================================================================
//
//  Reported from a device, and it took most of a day because every party
//  involved said something true and different:
//
//    Google Play        "you already own this item"
//    RevenueCat panel   Ad Free, Active, unlimited duration
//    restorePurchases   succeeded, and the app said nothing was found
//
//  Nothing failed. The code was asking `entitlements.active['premium']` for an
//  entitlement the project had not defined under that name, so the lookup
//  returned undefined and the player, who had paid, kept seeing ads.
//
//  The rule below is deliberately narrow: the fallback runs ONLY when the
//  configured name is absent from the project's own list, which is the shape
//  of a misconfiguration and nothing else.
// ============================================================================

describe('when config.ts names an entitlement this project does not define', () => {
    const withAll = (active: string[], all: string[]) => ({
        entitlements: {
            active: Object.fromEntries(active.map(k => [k, { identifier: k }])),
            all: Object.fromEntries(all.map(k => [k, { identifier: k }])),
        },
    });

    it('grants anyway, rather than taking money and giving nothing', async () => {
        // The name asked for is not in `all`. Something else is active. This
        // is the state that shipped, expressed as an assertion.
        mockSdk = {
            configure: jest.fn(),
            getCustomerInfo: jest.fn(async () => withAll(['ad_free'], ['ad_free'])),
        };

        const { initBilling } = loadBilling();
        await expect(initBilling()).resolves.toEqual({ ok: true, adFree: true });
    });

    it('and says so on the diagnostics panel instead of hiding it', async () => {
        // A silent recovery is a second silent failure. The configuration is
        // still wrong and somebody has to be told, or it is never fixed.
        let initBilling: any;
        let readDiagnostics: any;
        jest.isolateModules(() => {
            readDiagnostics = require('./diagnostics').readDiagnostics;
            require('./diagnostics').resetDiagnostics();
            initBilling = require('./billing').initBilling;
        });

        mockSdk = {
            configure: jest.fn(),
            getCustomerInfo: jest.fn(async () => withAll(['ad_free'], ['ad_free'])),
        };

        await initBilling();
        const d = readDiagnostics();
        expect(d.configMismatch).not.toBeNull();
        expect(d.configMismatch).toContain('ad_free');
        expect(d.log.join('\n')).toContain('CONFIG MISMATCH');
    });

    it('but a defined name that is simply not owned stays false', async () => {
        // ------------------------------------------------------------------
        //  THE LINE THAT KEEPS THE FALLBACK HONEST
        // ------------------------------------------------------------------
        //  If the configured name IS in the project, an inactive entitlement
        //  means the player does not own it. Falling back here would hand the
        //  ad-free version to anybody holding any other entitlement, which is
        //  giving the product away rather than fixing a typo.
        // ------------------------------------------------------------------
        const { AD_FREE_ENTITLEMENT } = require('./config');
        mockSdk = {
            configure: jest.fn(),
            getCustomerInfo: jest.fn(async () =>
                withAll(['something_else'], [AD_FREE_ENTITLEMENT, 'something_else'])),
        };

        const { initBilling } = loadBilling();
        await expect(initBilling()).resolves.toEqual({ ok: true, adFree: false });
    });

    it('and owning nothing at all is still false', async () => {
        mockSdk = {
            configure: jest.fn(),
            getCustomerInfo: jest.fn(async () => withAll([], [])),
        };

        const { initBilling } = loadBilling();
        await expect(initBilling()).resolves.toEqual({ ok: true, adFree: false });
    });
});

// ============================================================================
//  ONE CAPITAL LETTER
// ============================================================================
//
//  The bug that actually reached a device, twice over. The diagnostics panel
//  reported it in three lines and the difference is invisible at a glance:
//
//      Asked for   premium
//      Held        Premium
//      Defined     Premium
//
//  config.ts now carries the dashboard's exact string. These tests are the net
//  under it, and they are deliberately narrower than the general fallback: a
//  name that differs only in case is almost certainly the same name typed by a
//  human, whereas an unrelated entitlement is a guess.
// ============================================================================

describe('a name that differs only in case', () => {
    const withAll = (active: string[], all: string[]) => ({
        entitlements: {
            active: Object.fromEntries(active.map(k => [k, { identifier: k }])),
            all: Object.fromEntries(all.map(k => [k, { identifier: k }])),
        },
    });

    it('still grants, and is recorded as a mismatch', async () => {
        let initBilling: any;
        let readDiagnostics: any;
        jest.isolateModules(() => {
            readDiagnostics = require('./diagnostics').readDiagnostics;
            require('./diagnostics').resetDiagnostics();
            initBilling = require('./billing').initBilling;
        });

        // The project defines it in a case config.ts does not use.
        mockSdk = {
            configure: jest.fn(),
            getCustomerInfo: jest.fn(async () => withAll(['PREMIUM'], ['PREMIUM'])),
        };

        await expect(initBilling()).resolves.toEqual({ ok: true, adFree: true });

        const d = readDiagnostics();
        expect(d.configMismatch).toContain('PREMIUM');
        expect(d.log.join('\n')).toContain('CONFIG MISMATCH');
    });

    it('and the case rung is tried before the broad one', async () => {
        // ------------------------------------------------------------------
        //  PRECISION MATTERS IN WHAT GETS REPORTED
        // ------------------------------------------------------------------
        //  With two active entitlements and a case-only difference, the
        //  mismatch note must name the one that actually matched rather than
        //  listing everything the customer holds. A vague report is how a
        //  configuration fault survives being noticed.
        // ------------------------------------------------------------------
        let initBilling: any;
        let readDiagnostics: any;
        jest.isolateModules(() => {
            readDiagnostics = require('./diagnostics').readDiagnostics;
            require('./diagnostics').resetDiagnostics();
            initBilling = require('./billing').initBilling;
        });

        mockSdk = {
            configure: jest.fn(),
            getCustomerInfo: jest.fn(async () =>
                withAll(['something_else', 'PREMIUM'], ['something_else', 'PREMIUM'])),
        };

        await initBilling();
        const { configMismatch } = readDiagnostics();
        expect(configMismatch).toContain('PREMIUM');
        expect(configMismatch).not.toContain('Granted from [something_else, PREMIUM]');
    });

    it('but an exact match never reaches any fallback', async () => {
        // The healthy path. Nothing is recorded, because nothing is wrong.
        let initBilling: any;
        let readDiagnostics: any;
        jest.isolateModules(() => {
            readDiagnostics = require('./diagnostics').readDiagnostics;
            require('./diagnostics').resetDiagnostics();
            initBilling = require('./billing').initBilling;
        });

        const { AD_FREE_ENTITLEMENT } = require('./config');
        mockSdk = {
            configure: jest.fn(),
            getCustomerInfo: jest.fn(async () =>
                withAll([AD_FREE_ENTITLEMENT], [AD_FREE_ENTITLEMENT])),
        };

        await expect(initBilling()).resolves.toEqual({ ok: true, adFree: true });
        expect(readDiagnostics().configMismatch).toBeNull();
    });
});

// ============================================================================
//  THE PRICE ON THE BUTTON
// ============================================================================
//
//  The button said "Satin al" and nothing else, so the only way to learn the
//  price was to press a button that takes money and read the sheet. People do
//  not do that, and the ones who do arrive at a payment sheet surprised.
//
//  Two things are pinned: the price comes from the SAME route the purchase
//  takes, and an absent price stays absent.
// ============================================================================

describe('the price shown to the player', () => {
    const priced = (priceString: string) => ({
        identifier: '$rc_lifetime',
        product: { identifier: 'ad_free', priceString },
    });

    it('comes from the offering package, like the purchase does', async () => {
        const getProducts = jest.fn();
        mockSdk = {
            configure: jest.fn(),
            getOfferings: jest.fn(async () => ({
                all: { default: { availablePackages: [priced('₺149,99')] } },
            })),
            getProducts,
        };

        const { adFreePrice } = loadBilling();
        await expect(adFreePrice()).resolves.toBe('₺149,99');
        // Same route as purchaseAdFree, so the price on the button is the
        // price of the thing the button buys.
        expect(getProducts).not.toHaveBeenCalled();
    });

    it('falls back to the product when the offering is empty', async () => {
        mockSdk = {
            configure: jest.fn(),
            getOfferings: jest.fn(async () => ({ all: {}, current: null })),
            getProducts: jest.fn(async () => [{ identifier: 'ad_free', priceString: '$4.99' }]),
        };

        const { adFreePrice } = loadBilling();
        await expect(adFreePrice()).resolves.toBe('$4.99');
    });

    it('and answers null rather than inventing one', async () => {
        // ------------------------------------------------------------------
        //  A WRONG PRICE IS WORSE THAN NO PRICE
        // ------------------------------------------------------------------
        //  Offline, or before the store has answered, there is nothing to
        //  show. A zero, a dash or a placeholder currency would all be a
        //  number somebody believes and is then not charged.
        // ------------------------------------------------------------------
        mockSdk = {
            configure: jest.fn(),
            getOfferings: jest.fn(async () => { throw new Error('offline'); }),
            getProducts: jest.fn(async () => []),
        };

        const { adFreePrice } = loadBilling();
        await expect(adFreePrice()).resolves.toBeNull();
    });

    it('and never formats anything itself', () => {
        // The store produces the currency symbol, its side of the number and
        // the separator, for the account the person is signed in to. Any
        // arithmetic or concatenation here would be this file guessing at a
        // regional price it cannot see.
        const fs = require('fs');
        const path = require('path');
        const src = fs.readFileSync(path.join(__dirname, 'billing.ts'), 'utf8');
        const fn = src.slice(src.indexOf('export const adFreePrice'), src.indexOf('export const purchaseAdFree'));
        expect(fn).toContain('priceString');
        expect(fn).not.toMatch(/toFixed|toLocaleString|Intl\.|['"`]\s*\+\s*\w+Price/);
    });

    it('asks the store once and remembers the answer', async () => {
        // A network call per render is what happens when a component reads a
        // price in its body instead of in an effect, and it is invisible until
        // somebody reads a billing dashboard.
        const getOfferings = jest.fn(async () => ({
            all: { default: { availablePackages: [priced('₺149,99')] } },
        }));
        mockSdk = { configure: jest.fn(), getOfferings };

        const { adFreePrice } = loadBilling();
        await adFreePrice();
        await adFreePrice();
        await adFreePrice();
        expect(getOfferings).toHaveBeenCalledTimes(1);
    });
});
