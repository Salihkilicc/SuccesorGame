// src/core/ads/diagnostics.test.ts
//
// ============================================================================
//  A DIAGNOSTIC THAT IS WRONG IS WORSE THAN NO DIAGNOSTIC
// ============================================================================
//
//  The whole point of this panel is to be believed. Somebody stares at it at
//  midnight after a purchase did not work and takes the next action from what
//  it says. If it reports stale lists, or drops the one field that matters, or
//  quietly stops recording in release builds, it sends them down a path that
//  does not end.
//
//  So the three things pinned here are the three that would do that:
//    - the lists it shows are the lists that came back
//    - it records in EVERY build, not only in development
//    - reading it cannot change it
// ============================================================================

import {
    noteAdEvent,
    noteAdUnit,
    noteBillingFailure,
    noteEntitlements,
    noteSdkPresence,
    readDiagnostics,
    resetDiagnostics,
} from './diagnostics';

const info = (active: string[], all: string[]) => ({
    entitlements: {
        active: Object.fromEntries(active.map(k => [k, { identifier: k }])),
        all: Object.fromEntries(all.map(k => [k, { identifier: k }])),
    },
});

beforeEach(resetDiagnostics);

describe('the three lists', () => {
    it('records what came back, next to what was asked for', () => {
        noteEntitlements('purchase', 'premium', info(['premium'], ['premium']));

        const d = readDiagnostics();
        expect(d.lookingFor).toBe('premium');
        expect(d.activeEntitlements).toEqual(['premium']);
        expect(d.knownEntitlements).toEqual(['premium']);
        expect(d.lastSource).toBe('purchase');
        expect(d.lastSeenAt).not.toBeNull();
    });

    it('shows the shape of the bug that shipped', () => {
        // ------------------------------------------------------------------
        //  THIS EXACT READING COST AN AFTERNOON
        // ------------------------------------------------------------------
        //  Asked for `ad_free`, nothing held, and the project defines
        //  `premium`. Read off a screen this is a five second diagnosis. Read
        //  off a dashboard, an adb command and a guess, it was not.
        // ------------------------------------------------------------------
        noteEntitlements('launch', 'ad_free', info([], ['premium']));

        const d = readDiagnostics();
        expect(d.lookingFor).toBe('ad_free');
        expect(d.knownEntitlements).toEqual(['premium']);
        expect(d.knownEntitlements).not.toContain(d.lookingFor);
    });

    it('and the shape of the OTHER bug, which looks nothing like it', () => {
        // Identifier correct, project correct, customer simply owns nothing.
        // The product was never attached to the entitlement in the dashboard.
        noteEntitlements('purchase', 'premium', info([], ['premium']));

        const d = readDiagnostics();
        expect(d.knownEntitlements).toContain(d.lookingFor);
        expect(d.activeEntitlements).toEqual([]);
    });

    it('survives customer info that is missing or malformed', () => {
        // RevenueCat has returned objects without an `all` map. An undefined
        // here would render as "undefined" on the panel, which reads as a
        // fault in the store rather than in this file.
        noteEntitlements('restore', 'premium', undefined);
        noteEntitlements('restore', 'premium', { entitlements: {} });

        const d = readDiagnostics();
        expect(d.activeEntitlements).toEqual([]);
        expect(d.knownEntitlements).toEqual([]);
    });
});

describe('it is not switched off in the build that needs it', () => {
    it('records regardless of __DEV__', () => {
        // ------------------------------------------------------------------
        //  THE MISTAKE THIS FILE WAS WRITTEN TO UNDO
        // ------------------------------------------------------------------
        //  The first version of the entitlement report began with
        //  `if (!__DEV__) return;`. Google Play Billing only works in an app
        //  installed from Play, which is a release build, where __DEV__ is
        //  false. The diagnostic was therefore absent from the only build
        //  that could produce the bug.
        //
        //  Asserted from the source rather than by flipping the global,
        //  because __DEV__ is baked in at bundle time and a test that sets it
        //  is testing itself.
        // ------------------------------------------------------------------
        const fs = require('fs');
        const path = require('path');
        const src = fs.readFileSync(path.join(__dirname, 'diagnostics.ts'), 'utf8');
        const code = src.split('\n').filter((l: string) => !l.trim().startsWith('//')).join('\n');
        expect(code).not.toContain('__DEV__');
    });

    it('and billing.ts records before it checks __DEV__', () => {
        const fs = require('fs');
        const path = require('path');
        const src = fs.readFileSync(path.join(__dirname, 'billing.ts'), 'utf8');
        const code = src.split('\n')
            .filter((l: string) => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
            .join('\n');

        const record = code.indexOf('noteEntitlements(where');
        const guard = code.indexOf("if (!__DEV__) return;");
        expect(record).toBeGreaterThan(-1);
        expect(guard).toBeGreaterThan(-1);
        // Order is the fix. Behind the guard, it is off in release.
        expect(record).toBeLessThan(guard);
    });
});

describe('the log', () => {
    it('is newest first and bounded', () => {
        for (let i = 0; i < 40; i++) noteAdEvent(`event ${i}`);

        const { log } = readDiagnostics();
        expect(log.length).toBeLessThanOrEqual(14);
        expect(log[0]).toContain('event 39');
        // Unbounded, this grows for as long as the app is open.
        expect(log.join('\n')).not.toContain('event 0\n');
    });

    it('carries the reason a call failed, not just that it did', () => {
        noteBillingFailure('purchase', 'Billing is not available in this device');

        const { log } = readDiagnostics();
        expect(log[0]).toContain('purchase failed');
        expect(log[0]).toContain('Billing is not available');
    });
});

describe('the ad unit', () => {
    it('remembers which one and whether it is the test one', () => {
        noteAdUnit('ca-app-pub-3940256099942544/1033173712', true);
        expect(readDiagnostics().usingTestUnit).toBe(true);

        noteAdUnit('ca-app-pub-9881104469619624/6204992791', false);
        const d = readDiagnostics();
        expect(d.usingTestUnit).toBe(false);
        expect(d.adUnit).toContain('9881104469619624');
    });
});

describe('reading cannot change it', () => {
    it('hands out copies of the arrays', () => {
        // A caller that sorted these in place would silently reorder the
        // panel's own state and nothing would ever say so.
        noteEntitlements('launch', 'premium', info(['premium'], ['premium', 'other']));
        noteSdkPresence(true, true);

        const first = readDiagnostics();
        first.activeEntitlements.push('injected');
        first.knownEntitlements.length = 0;
        first.log.length = 0;

        const second = readDiagnostics();
        expect(second.activeEntitlements).toEqual(['premium']);
        expect(second.knownEntitlements).toEqual(['premium', 'other']);
        expect(second.log.length).toBeGreaterThan(0);
    });
});

describe('nothing that identifies a person', () => {
    it('the recorded fields are names of things, not people', () => {
        // This screen can be photographed and pasted into a chat. Entitlement
        // and product identifiers are already compiled into the binary and are
        // the whole question; an app user id or an order number is somebody
        // else's business.
        noteEntitlements('purchase', 'premium', {
            ...info(['premium'], ['premium']),
            originalAppUserId: 'RCAnonymousID:should-never-appear',
            managementURL: 'https://play.google.com/store/account/subscriptions?sku=x',
        });

        const dumped = JSON.stringify(readDiagnostics());
        expect(dumped).not.toContain('RCAnonymousID');
        expect(dumped).not.toContain('managementURL');
    });
});
