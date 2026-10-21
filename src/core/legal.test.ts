// src/core/legal.test.ts
//
// ============================================================================
//  THE ROWS THAT SHIPPED AS DEAD CONTROLS
// ============================================================================
//
//  Settings has carried three rows since long before the purchase existed:
//  Terms & Conditions, Privacy Policy, Help & Support. All three called
//  `handleUnavailable`, which draws a panel saying the thing is not available.
//
//  Two of the three are REQUIRED FIELDS on a store submission:
//
//      App Store Connect   privacy policy URL, support URL
//      Play Console        privacy policy URL, contact address
//
//  So the app could not be submitted at all, and the discovery route was a
//  reviewer pressing a row on the way to approving a paid feature and being
//  told it was unavailable.
//
//  What is pinned here is not the text of the documents. It is that the
//  addresses exist, that they are not invented, and that every surface reads
//  the same ones.
// ============================================================================

import fs from 'fs';
import path from 'path';

import {
    PRIVACY_POLICY_URL,
    SUPPORT_EMAIL,
    SUPPORT_URL,
    TERMS_OF_USE_URL,
} from './legal';

const ROOT = path.join(__dirname, '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/** Source with `//` comments stripped, so prose is never the evidence. */
const code = (rel: string): string =>
    read(rel).split('\n')
        .filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
        .join('\n');

describe('the addresses', () => {
    it('all three are https and none is a placeholder', () => {
        for (const url of [PRIVACY_POLICY_URL, TERMS_OF_USE_URL, SUPPORT_URL]) {
            expect(url).toMatch(/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}\/\S+$/i);
            // The shapes a hurried placeholder takes.
            expect(url).not.toMatch(/example\.|TODO|CHANGEME|localhost|yoursite/i);
        }
    });

    it('and the three are three different pages', () => {
        // One URL pasted into all three satisfies every check above and sends
        // a reviewer looking for the support page to the privacy policy.
        const set = new Set([PRIVACY_POLICY_URL, TERMS_OF_USE_URL, SUPPORT_URL]);
        expect(set.size).toBe(3);
    });

    it('and the support address is not a personal inbox', () => {
        // ------------------------------------------------------------------
        //  IT IS PUBLISHED IN FOUR PLACES AND CANNOT BE WITHDRAWN
        // ------------------------------------------------------------------
        //  The documents, both store listings and the app itself. Once a
        //  personal address is in a store listing it is scraped, and there is
        //  no way to take it back.
        // ------------------------------------------------------------------
        expect(SUPPORT_EMAIL).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i);
        expect(SUPPORT_EMAIL).toContain('support');
    });
});

describe('every surface reads the same file', () => {
    const SURFACES = [
        'src/features/os/screens/SettingsScreen.tsx',
        'src/features/os/components/RemoveAdsSheet.tsx',
    ];

    it('nothing declares a URL of its own', () => {
        // ------------------------------------------------------------------
        //  FOUR COPIES IS THREE GOING STALE
        // ------------------------------------------------------------------
        //  The sheet held its own pair of blank constants first. When the
        //  hosting moves, the copy that is forgotten is always the one nobody
        //  opened while testing.
        // ------------------------------------------------------------------
        for (const rel of SURFACES) {
            const src = code(rel);
            expect(src).toContain("from '../../../core/legal'");
            expect(src).not.toMatch(/_URL\s*=\s*'/);
        }
    });

    it('and the three Settings rows actually go somewhere', () => {
        const src = code('src/features/os/screens/SettingsScreen.tsx');
        for (const url of ['TERMS_OF_USE_URL', 'PRIVACY_POLICY_URL', 'SUPPORT_URL']) {
            expect(src).toContain(`Linking.openURL(${url})`);
        }
        // The panel that says "not available" must not be what any of them
        // reaches any more.
        for (const key of ['os.termsConditions', 'os.privacyPolicy', 'os.helpSupport']) {
            const at = src.indexOf(`t('${key}')`);
            expect(at).toBeGreaterThan(-1);
            expect(src.slice(at, at + 220)).not.toContain('handleUnavailable');
        }
    });
});

describe('and the documents themselves exist to be published', () => {
    // ----------------------------------------------------------------------
    //  THEY LIVE OUTSIDE THIS REPOSITORY ON PURPOSE
    // ----------------------------------------------------------------------
    //  GitHub Pages serves from a PUBLIC repository and the game's source is
    //  not public. So the three files belong to a separate legal repository,
    //  which is why this test checks the URL's shape rather than looking for
    //  files that are not here.
    //
    //  What it can check is that the URLs agree with each other about where
    //  that repository is, which is the mistake a hand-edited third URL makes.
    // ----------------------------------------------------------------------
    it('all three sit under one base', () => {
        const base = (u: string) => u.slice(0, u.lastIndexOf('/'));
        expect(base(TERMS_OF_USE_URL)).toBe(base(PRIVACY_POLICY_URL));
        expect(base(SUPPORT_URL)).toBe(base(PRIVACY_POLICY_URL));
    });
});
