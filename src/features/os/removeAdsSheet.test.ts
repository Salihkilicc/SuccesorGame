// src/features/os/removeAdsSheet.test.ts
//
// ============================================================================
//  ONE SHEET, EVERY DOOR
// ============================================================================
//
//  The purchase used to be a button in a settings list that opened the store's
//  payment sheet directly, so the first screen that mentioned a price was the
//  screen that takes it.
//
//  Now there is a sheet, and the thing worth guarding is not how it looks. It
//  is that there stays exactly ONE of it. The offer after an advertisement
//  will open this same component, and the moment somebody writes a second
//  purchase surface the two begin to disagree: a price shown in one place and
//  not the other, a restore control on one and not the other, and the one that
//  falls behind is always the one nobody opened while testing.
// ============================================================================

import fs from 'fs';
import path from 'path';

const ROOT = path.join(__dirname, '..', '..', '..');

const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/** Source with `//` comments stripped, so prose is never the evidence. */
const code = (rel: string): string =>
    read(rel).split('\n')
        .filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
        .join('\n');

const SHEET = 'src/features/os/components/RemoveAdsSheet.tsx';
const SECTION = 'src/features/os/components/RemoveAdsSection.tsx';

describe('the sheet is the only thing that takes money', () => {
    it('it is the one component that calls purchaseAdFree', () => {
        // ------------------------------------------------------------------
        //  WALKED, NOT LISTED
        // ------------------------------------------------------------------
        //  A list of allowed files is a list somebody forgets to update. This
        //  reads every screen and component in the app, so a second paywall
        //  fails on the day it is written rather than on the day the prices
        //  disagree.
        // ------------------------------------------------------------------
        const callers: string[] = [];
        const walk = (dir: string) => {
            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                const full = path.join(dir, entry.name);
                if (entry.isDirectory()) { walk(full); continue; }
                if (!/\.tsx$/.test(entry.name)) continue;
                if (/\.test\.tsx$/.test(entry.name)) continue;
                if (code(path.relative(ROOT, full)).includes('purchaseAdFree')) {
                    callers.push(path.relative(ROOT, full));
                }
            }
        };
        walk(path.join(ROOT, 'src'));
        expect(callers).toEqual([SHEET]);
    });

    it('and the settings row is a door rather than a till', () => {
        const src = code(SECTION);
        expect(src).toContain('RemoveAdsSheet');
        expect(src).not.toContain('purchaseAdFree');
        expect(src).not.toContain('restorePurchases');
    });
});

describe('what the sheet has to carry', () => {
    const src = code(SHEET);

    it('the price, read from the store rather than written here', () => {
        expect(src).toContain('adFreePrice()');
        // No currency symbol typed into the component. The store formats it
        // for the account the person is actually signed in to.
        expect(src).not.toMatch(/['"`][$€£₺]/);
    });

    it('and it shows nothing at all when there is no price', () => {
        // A zero, a dash or a skeleton is a number somebody believes and is
        // then not charged. Absent has to stay absent.
        expect(src).toContain('{!!price && ');
    });

    it('a restore control, which Apple requires and a second phone needs', () => {
        expect(src).toContain('restorePurchases');
        // Its own sentence, not the Settings row's label: the row reads as a
        // list item, the line under the button reads as a footnote.
        expect(src).toContain("t('ads.restoreLine')");
    });

    it('and it survives the player already owning it', () => {
        // The sheet still opens for an owner, because this device's copy of
        // the flag can be wrong after a reinstall and restore is the way back.
        expect(src).toContain('adFree ?');
    });

    it('it reads ownership from the store and never writes it', () => {
        // billing.ts is written by RevenueCat and is the only authority. A
        // second opinion here would disagree on exactly the paths nobody
        // tests: a refund, a restore on another device, an expiry.
        expect(src).toContain('useIdentityStore(s => s.adFree)');
        expect(src).not.toContain('applyEntitlement');
    });
});

describe('and the words it shows exist in both languages', () => {
    const en = require('../../core/i18n/en').en as Record<string, string>;
    const tr = require('../../core/i18n/tr').tr as Record<string, string>;

    const keys = Array.from(code(SHEET).matchAll(/t\(\s*'([^']+)'/g)).map(m => m[1])
        .concat(['ads.sheetBenefitOne', 'ads.sheetBenefitTwo', 'ads.sheetBenefitThree']);

    it('nothing is missing', () => {
        const missing = keys.flatMap(k => [
            en[k] === undefined ? `en is missing ${k}` : null,
            tr[k] === undefined ? `tr is missing ${k}` : null,
        ]).filter(Boolean);
        expect(missing).toEqual([]);
    });

    it('and none of them uses a dash', () => {
        // His rule for every player visible string in the game. Hyphenated
        // words are fine; an em dash or a spaced hyphen as punctuation is not.
        const offenders = keys
            .flatMap(k => [en[k], tr[k]])
            .filter(Boolean)
            .filter(v => v.includes('—') || v.includes(' - '));
        expect(offenders).toEqual([]);
    });
});

// ============================================================================
//  AND THE OFFER REACHES THE SAME SHEET
// ============================================================================

describe('the offer host', () => {
    const HOST = 'src/features/os/components/AdFreeOfferHost.tsx';
    const src = code(HOST);

    it('registers with the gate rather than being called by a screen', () => {
        // The four triggers are on four screens. A screen that called the
        // sheet directly would only be able to offer while it was mounted.
        expect(src).toContain('setOfferPresenter');
    });

    it('and opens the one sheet, not a second one of its own', () => {
        expect(src).toContain('RemoveAdsSheet');
    });

    it('and it is mounted at the root, once', () => {
        // ------------------------------------------------------------------
        //  MOUNTED, OR THE WHOLE CHAIN IS A NO-OP
        // ------------------------------------------------------------------
        //  policy decides, the gate calls, and nothing happens: the seam ships
        //  with a default that logs and returns. That is the correct shape for
        //  a seam and it is also exactly how a feature ships switched off.
        //  Two gates in this repo have done it.
        // ------------------------------------------------------------------
        const app = read('App.tsx');
        expect(app).toContain('<AdFreeOfferHost />');
        expect(app.split('<AdFreeOfferHost').length - 1).toBe(1);
    });

    it('and does not unregister itself on cleanup', () => {
        // A cleanup that restored the no-op would run on a fast refresh and
        // leave the gate with nothing registered: a feature that works in
        // release and silently does not while somebody is building it.
        expect(src).not.toMatch(/return\s*\(\)\s*=>\s*\{?\s*setOfferPresenter/);
    });
});

// ============================================================================
//  WHAT APP REVIEW LOOKS FOR, AND WHAT IS STILL MISSING
// ============================================================================
//
//  A privacy policy URL is a required field in App Store Connect and in Play
//  Console for any app serving advertisements, and AdMob asks for one too.
//  This app has had a "Privacy Policy" row in Settings for a long time and it
//  calls handleUnavailable, so a reviewer pressing it meets a dead control on
//  the way to approving a paid feature.
//
//  The two tests below are deliberately RED until the URLs exist. That is the
//  point: a to-do in a comment is a to-do nobody runs, and this one blocks a
//  submission rather than a feature.
// ============================================================================

describe('the links app review expects', () => {
    const src = code(SHEET);

    it('no URL is invented to satisfy the check', () => {
        // ------------------------------------------------------------------
        //  A PLAUSIBLE URL WOULD BE WORSE THAN NONE
        // ------------------------------------------------------------------
        //  It would pass review, 404 for every real player, and nobody would
        //  find out until somebody complained. So the constants are empty and
        //  the links are hidden while they are, which keeps the sheet honest.
        // ------------------------------------------------------------------
        // The sheet declares none of its own now; core/legal.ts owns them and
        // legal.test.ts checks their shape. What is left to assert here is
        // that the sheet did not quietly grow a replacement pair.
        expect(src).not.toMatch(/_URL\s*=\s*'/);
        expect(src).toContain("from '../../../core/legal'");
    });

    it('and the links are hidden rather than dead if a URL is ever emptied', () => {
        // Kept even though both are filled in: the guard is what makes
        // emptying one a hidden link rather than a 404.
        expect(src).toContain('!!PRIVACY_POLICY_URL || !!TERMS_OF_USE_URL');
    });

    it('the privacy policy URL is filled in', () => {
        // ------------------------------------------------------------------
        //  MARKED `it.failing` SO IT IS A TRACKED HOLE, NOT A RED SUITE
        // ------------------------------------------------------------------
        //  `it.failing` passes while the assertion fails and FAILS the moment
        //  it starts passing, which is exactly backwards from what is wanted
        //  here and exactly right: the day somebody fills the URL in, this
        //  goes red and whoever sees it deletes the `.failing` and the test
        //  becomes a real guard.
        //
        //  Until then the suite stays green and the gap stays visible in the
        //  test output rather than in a comment nobody opens.
        // ------------------------------------------------------------------
        // It moved to core/legal.ts, which is the point: the sheet no longer
        // owns a URL it could leave blank.
        const { PRIVACY_POLICY_URL } = require('../../core/legal');
        expect(PRIVACY_POLICY_URL).not.toBe('');
    });

    it('the Settings privacy row goes somewhere', () => {
        // Settings has shipped a row that reports itself unavailable. A
        // reviewer presses it.
        const settings = code('src/features/os/screens/SettingsScreen.tsx');
        const row = settings.slice(
            Math.max(0, settings.indexOf("t('os.privacyPolicy')") - 200),
            settings.indexOf("t('os.privacyPolicy')") + 200,
        );
        expect(row).not.toContain('handleUnavailable');
    });
});

// ============================================================================
//  THE GOLD, AND WHERE THE DOORS ARE
// ============================================================================

describe('the purchase has exactly one colour', () => {
    it('premium is used by the three surfaces of the purchase and nowhere else', () => {
        // ------------------------------------------------------------------
        //  A RANK STOPS BEING A RANK WHEN IT IS EVERYWHERE
        // ------------------------------------------------------------------
        //  Gold means "this is the paid thing". The moment a second kind of
        //  control is gold it means nothing, and the palette has four blues
        //  precisely so that a button's job is legible before its label is
        //  read. This keeps the newest rank honest.
        // ------------------------------------------------------------------
        const users: string[] = [];
        const walk = (dir: string) => {
            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                const full = path.join(dir, entry.name);
                if (entry.isDirectory()) { walk(full); continue; }
                if (!/\.tsx?$/.test(entry.name) || /\.test\.tsx?$/.test(entry.name)) continue;
                const rel = path.relative(ROOT, full);
                if (rel.endsWith(path.join('core', 'theme.ts'))) continue;
                if (/colors\.premium/.test(code(rel))) users.push(rel);
            }
        };
        walk(path.join(ROOT, 'src'));

        // Three, and each one is the SAME thing seen from a different screen:
        // the crown on the home screen, the crown in the settings row, and the
        // crown on the button that takes the money. A fourth would mean gold
        // had started meaning "important" instead of "this is the paid one".
        expect(users.sort()).toEqual([
            path.join('src', 'features', 'os', 'components', 'RemoveAdsSection.tsx'),
            path.join('src', 'features', 'os', 'components', 'RemoveAdsSheet.tsx'),
            path.join('src', 'screens', 'Home', 'HomeScreen.tsx'),
        ].sort());
    });

    it('and white on it clears the contrast floor the audit enforces', () => {
        // Measured, not chosen by eye. scripts/reachability.js refuses
        // anything under 3 and the bright primary measures 2.65 against white,
        // which is why this button is not the bright primary.
        const theme = fs.readFileSync(path.join(ROOT, 'src/core/theme.ts'), 'utf8');
        const fill = (theme.match(/premium:\s*'(#[0-9A-Fa-f]{6})'/) || [])[1];
        expect(fill).toBeDefined();

        const lum = (hex: string) => {
            const c = [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16) / 255)
                .map(x => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
            return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
        };
        const ratio = (1.0 + 0.05) / (lum(fill!) + 0.05);
        expect(ratio).toBeGreaterThanOrEqual(3);
    });
});

describe('the home screen door', () => {
    const HOME = 'src/screens/Home/HomeScreen.tsx';
    const src = code(HOME);

    it('opens the one sheet rather than navigating to Settings', () => {
        // Sending somebody to a settings list to find the thing they just
        // decided they want is how an impulse dies.
        expect(src).toContain('RemoveAdsSheet');
        expect(src).toContain('setAdsSheetOpen(true)');
    });

    it('and disappears for somebody who already paid', () => {
        // A button selling an owner what they own is the clearest possible
        // signal that nobody checked.
        expect(src).toContain('{!adFree && (');
        expect(src).toContain("useIdentityStore(s => s.adFree)");
    });

    it('and uses the glyph rather than a drawn word', () => {
        // `advertisements-off` ships with the icon set and reads as "no ads"
        // in every language. The word ADS does not.
        expect(src).toContain('advertisements-off');
    });
});

describe('the crown is the one symbol for the paid thing', () => {
    it('it is the same glyph on the row and on the button', () => {
        // ------------------------------------------------------------------
        //  RECOGNISED BEFORE IT IS READ
        // ------------------------------------------------------------------
        //  The settings row used to carry `close-octagon-outline`, which is
        //  the icon for a thing that is blocked or wrong, on a row offering to
        //  sell something. Two different symbols for one product also means a
        //  player has to learn both.
        // ------------------------------------------------------------------
        expect(code(SECTION)).toMatch(/name=\{adFree \? 'crown' : 'crown-outline'\}/);
        expect(code(SHEET)).toContain('name="crown"');
    });
});

describe('restore is reachable but is not the decision', () => {
    const src = code(SHEET);

    it('it is a line of text rather than a second button', () => {
        // Two buttons of similar weight ask the reader to choose between them,
        // and almost nobody opening this sheet came here to restore.
        expect(src).toContain('styles.restoreLink');
        expect(src).not.toContain('styles.restoreRow');
    });

    it('and it still actually restores', () => {
        // A quieter control is still a control. The one thing that must not
        // happen is it becoming decoration.
        expect(src).toMatch(/onPress=\{\(\) => \{ if \(storeReady && !busy\) void run\('restore'\); \}\}/);
    });
});

describe('and it stays small and stays a sentence', () => {
    it('smaller than the promise line under it, so it reads as a footnote', () => {
        // ------------------------------------------------------------------
        //  SIZE IS THE WHOLE INSTRUCTION
        // ------------------------------------------------------------------
        //  Asked for as "small, one sentence, stuck underneath, the way games
        //  do it". The way games do it is the right way for a reason: restore
        //  must be findable by the one person looking for it and must cost the
        //  buying reader nothing. Any growth here takes attention from the
        //  button it sits under.
        // ------------------------------------------------------------------
        const sheet = read(SHEET);
        const sizeIn = (block: string) => {
            const at = sheet.indexOf(block);
            const chunk = sheet.slice(at, at + 1200);
            return Number((chunk.match(/fontSize:\s*(\d+)/) || [])[1]);
        };
        const restore = sizeIn('restoreLink: {');
        const foot = sizeIn('footNote: {');
        expect(restore).toBeLessThanOrEqual(11);
        expect(restore).toBeLessThan(foot);
    });

    it('and the words are a sentence somebody can answer, not a command', () => {
        // "Restore purchases" talks to a person who already knows the concept.
        const en = require('../../core/i18n/en').en as Record<string, string>;
        const tr = require('../../core/i18n/tr').tr as Record<string, string>;
        expect(en['ads.restoreLine']).toBeDefined();
        expect(tr['ads.restoreLine']).toBeDefined();
        expect(tr['ads.restoreLine']).not.toBe(tr['ads.restore']);
    });
});
