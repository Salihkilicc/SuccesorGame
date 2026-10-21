// src/features/os/adTestSwitch.test.ts
//
// ============================================================================
//  THE TEST SWITCH CAN ONLY TAKE THE PURCHASE AWAY
// ============================================================================
//
//  Added so a live advertisement could be watched on the one device that can
//  buy, without a second Google account. It sits inside the admin block, seven
//  taps behind the version line.
//
//  The direction is the whole safety property. A control that could set
//  `adFree` to TRUE would be the paid product handed out for free, behind a
//  gesture anybody can learn from a forum post. This file exists so that a
//  later edit cannot quietly turn a one-way switch into a two-way one.
//
//  TEMPORARY. When it is removed, delete this file with it.
// ============================================================================

import fs from 'fs';
import path from 'path';

const ROOT = path.join(__dirname, '..', '..', '..');
const PANEL = 'src/features/os/components/AdDiagnosticsSection.tsx';

/** Source with `//` comments stripped, so prose is never the evidence. */
const code = (rel: string): string =>
    fs.readFileSync(path.join(ROOT, rel), 'utf8')
        .split('\n')
        .filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
        .join('\n');

describe('the ad test switch', () => {
    const src = code(PANEL);

    it('sets the entitlement to false', () => {
        expect(src).toContain('applyEntitlement(false)');
    });

    it('and can NEVER set it to true', () => {
        // ------------------------------------------------------------------
        //  THE ONE ASSERTION THAT MATTERS HERE
        // ------------------------------------------------------------------
        //  Anything that grants the entitlement from a screen belongs in
        //  billing.ts, where the store is the authority. A grant written here
        //  would be a second answer to a question that already has one, and
        //  this one would not involve paying.
        // ------------------------------------------------------------------
        expect(src).not.toContain('applyEntitlement(true)');
        expect(src).not.toMatch(/applyEntitlement\(\s*!/);
        expect(src).not.toMatch(/applyEntitlement\(\s*(?!false\s*\))/);
    });

    it('is only offered to somebody who actually owns it', () => {
        // Rendering it for a player who has not bought anything would be a
        // button that appears to do something and does nothing.
        expect(src).toContain('{adFree && (');
    });

    it('says in the interface that the store is untouched', () => {
        // The alarming reading of this button is "I have just cancelled my
        // purchase". The note under it is what stops that, so its presence is
        // part of the feature rather than decoration.
        expect(src).toContain("t('ads.diagDropEntitlementNote')");

        const tr = fs.readFileSync(path.join(ROOT, 'src/core/i18n/tr.ts'), 'utf8');
        const line = tr.split('\n').find(l => l.includes('ads.diagDropEntitlementNote')) ?? '';
        expect(line).toContain('mağazada hiçbir şey değişmez');
    });

    it('and no player visible string on it uses a dash', () => {
        // His rule for the whole game. Hyphenated words are fine; an em dash
        // or a spaced hyphen as punctuation is not.
        const both = ['src/core/i18n/tr.ts', 'src/core/i18n/en.ts'].map(f =>
            fs.readFileSync(path.join(ROOT, f), 'utf8')
                .split('\n')
                .filter(l => l.includes('ads.diagDropEntitlement'))
                .join('\n'),
        ).join('\n');

        expect(both).not.toContain('—');
        expect(both).not.toContain(' - ');
    });
});

describe('the panel does not grant anything', () => {
    it('it reads the store and never writes a purchase into it', () => {
        const src = code(PANEL);
        // initBilling asks RevenueCat and lets RevenueCat decide. That is the
        // only way the flag is allowed to become true anywhere in the app.
        expect(src).toContain('initBilling()');
        expect(src).not.toContain('purchaseAdFree');
    });
});
