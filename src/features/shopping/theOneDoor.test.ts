// src/features/shopping/theOneDoor.test.ts
//
// ============================================================================
//  THERE IS ONE WAY INTO LUXONET AND ONE OF THE SIGNPOSTS POINTED NOWHERE
// ============================================================================
//
//  Asked for as "the LuxoNet on the profile and the inventory pages are the
//  places that will be used, if anything is missing or elsewhere then
//  everything should be in the LuxoNet store on the profile and the inventory
//  opened from there".
//
//  So the door is: PROFILE -> the VIP banner -> the shop, and the same banner
//  -> the vault. Both routes are on the ROOT stack, registered
//  unconditionally, which is why that path works while `FEATURES.shopping` is
//  false.
//
//  ---------------------------------------------------------------------------
//  AND THERE ARE TWO REGISTRATIONS OF THE SAME SCREENS
//  ---------------------------------------------------------------------------
//  `Shopping`, `Belongings` and `ShopDetail` are ALSO registered inside the
//  Assets stack, wrapped in `FEATURES.shopping ? ... : null`. That flag is
//  false, so those three are not registered at all - and React Navigation
//  treats a navigate to an unregistered route as a silent no-op. No crash, no
//  red screen, nothing in the log a player would ever see.
//
//  Which is what LoveScreen was doing. The proposal flow offers GO SHOPPING to
//  a player with no ring, and it called `navigate('Assets', { screen:
//  'Shopping' })`. Nothing happened. On a live screen - `love` is true - in
//  the one flow where the shop actually matters to another system.
//
//  This file exists to stop the two registrations drifting into each other
//  again, because the failure has no symptom.
// ============================================================================

import fs from 'fs';
import path from 'path';
import {
    PRESTIGE_FLOOR, TOTAL_CATALOG_VALUE, calculatePrestigeScore,
} from './data/shoppingRegistry';

const SRC = path.join(__dirname, '..', '..');
const live = (rel: string) =>
    fs.readFileSync(path.join(SRC, rel), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*)/.test(l))
        .map(l => l.replace(/\s\/\/.*$/, ''))
        .join('\n');

const navigator = () => live(path.join('navigation', 'RootNavigator.tsx'));
const profileLogic = () => live(path.join('features', 'profile', 'logic', 'useProfileLogic.ts'));
const profileScreen = () => live(path.join('features', 'profile', 'screens', 'ProfileScreen.tsx'));

/** Everything under src, so a new signpost cannot be added quietly. */
const walk = (dir: string, out: string[] = []): string[] => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) { walk(full, out); continue; }
        if (!/\.tsx?$/.test(e.name) || /\.test\./.test(e.name)) continue;
        out.push(full);
    }
    return out;
};

describe('the door is on the profile and it is the only one', () => {
    it('the banner is mounted on the profile screen', () => {
        const src = profileScreen();
        expect(src).toMatch(/<LuxoNetVipBanner/);
        expect(src).toMatch(/onPress=\{openLuxoNetModal\}/);
        expect(src).toMatch(/onInventoryPress=\{openInventoryModal\}/);
    });

    it('and both of its buttons go to the root stack', () => {
        const src = profileLogic();
        expect(src).toMatch(/navigation\.navigate\('Shopping'\)/);
        expect(src).toMatch(/navigation\.navigate\('Belongings'\)/);
    });

    it('and the root stack really registers all three screens', () => {
        // Unconditionally. If these ever move behind the feature flag, the
        // profile banner stops working and nothing says so.
        const src = navigator();
        for (const route of ['Shopping', 'Belongings', 'Cart']) {
            expect([route, new RegExp(`RootStack\\.Screen name="${route}"`).test(src)])
                .toEqual([route, true]);
        }
    });

    it('and the shop can still reach the cart and the vault from inside', () => {
        const shop = live(path.join('features', 'shopping', 'screens', 'ShoppingScreen.tsx'));
        const cart = live(path.join('features', 'shopping', 'screens', 'CartScreen.tsx'));
        expect(shop).toMatch(/navigation\.navigate\('Cart'\)/);
        expect(cart).toMatch(/navigation\.navigate\('Belongings'\)/);
        expect(cart).toMatch(/navigation\.navigate\('Shopping'\)/);
    });
});

describe('and nothing anywhere points at the door that is not there', () => {
    it('no file navigates into the Assets stack for the shop or the vault', () => {
        // THE DEFECT. Those three are wrapped in `FEATURES.shopping ? ... :
        // null` inside the Assets stack, the flag is false, and navigating to
        // an unregistered route is a SILENT no-op. LoveScreen's proposal flow
        // did exactly this and the button did nothing.
        const offenders = walk(SRC)
            .filter(f => {
                const src = fs.readFileSync(f, 'utf8')
                    .replace(/\/\*[\s\S]*?\*\//g, '')
                    .split('\n')
                    .filter(l => !/^\s*(\/\/|\*)/.test(l))
                    .map(l => l.replace(/\s\/\/.*$/, ''))
                    .join('\n');
                return /screen:\s*'(Shopping|Belongings|ShopDetail)'/.test(src);
            })
            .map(f => path.relative(SRC, f));

        expect(offenders).toEqual([]);
    });

    it('and the proposal flow in particular reaches the shop', () => {
        // The one live screen that was broken, named so a regression is
        // legible rather than a line in a list.
        const src = live(path.join('features', 'love', 'screens', 'LoveScreen.tsx'));
        expect(src).toMatch(/const handleGoShopping/);
        expect(src).toMatch(/navigation\.navigate\('Shopping'\)/);
    });
});

// ============================================================================
//  AND THE NUMBER ON THE BANNER HAD QUIETLY STOPPED MEANING ANYTHING
// ============================================================================
//
//  Prestige was a straight share of the catalogue, which is fine while every
//  item is within an order of magnitude of every other. The space department
//  took the catalogue from $34B to $2.02 TRILLION with one object worth 48.5%
//  of it, so on the linear formula:
//
//      a $1B collection      0.0
//      a $10B collection     0.5     <- a Tycoon, told they are a 0.5
//      everything but space  13.1
//
//  Nothing caught it. Prestige had no test, and adding rows to a data file is
//  not a change anybody re-checks a display formula after.
// ============================================================================

describe('prestige is a scale a player can stand on', () => {
    it('a ten billion dollar collection is not a rounding error', () => {
        // THE DEFECT, as one number. 0.5 on the linear formula.
        expect(calculatePrestigeScore(10_000_000_000)).toBeGreaterThan(50);
    });

    it('and the whole range is spread out rather than piled at the bottom', () => {
        const points = [1e7, 1e8, 1e9, 1e10, 1e11, 1e12].map(calculatePrestigeScore);
        // Every decade of money is worth a real, similar step.
        for (let i = 1; i < points.length; i++) {
            const step = points[i] - points[i - 1];
            expect([i, step > 10]).toEqual([i, true]);
            expect([i, step < 25]).toEqual([i, true]);
        }
    });

    it('and it is bounded at both ends', () => {
        expect(calculatePrestigeScore(0)).toBe(0);
        expect(calculatePrestigeScore(PRESTIGE_FLOOR)).toBe(0);
        expect(calculatePrestigeScore(-5)).toBe(0);
        expect(calculatePrestigeScore(TOTAL_CATALOG_VALUE)).toBe(100);
        expect(calculatePrestigeScore(TOTAL_CATALOG_VALUE * 10)).toBe(100);
        expect(calculatePrestigeScore(NaN)).toBe(0);
    });

    it('and it survives the catalogue growing, which is the whole point', () => {
        // The linear version HALVED every score the day space landed. This is
        // the property that stops that happening again: the scale is
        // logarithmic, so another trillion dollar item moves a ten billion
        // dollar collection by a couple of points rather than by half.
        const owned = 10_000_000_000;
        const now = calculatePrestigeScore(owned);

        const withABiggerCatalogue = (total: number) => {
            const span = Math.log10(total) - Math.log10(PRESTIGE_FLOOR);
            const climbed = Math.log10(owned) - Math.log10(PRESTIGE_FLOOR);
            return 100 * (climbed / span);
        };

        const doubled = withABiggerCatalogue(TOTAL_CATALOG_VALUE * 2);
        expect(Math.abs(now - doubled)).toBeLessThan(5);

        // And what the linear formula would have done to the same collection.
        const linearNow = (owned / TOTAL_CATALOG_VALUE) * 100;
        const linearDoubled = (owned / (TOTAL_CATALOG_VALUE * 2)) * 100;
        expect(linearNow / linearDoubled).toBeCloseTo(2, 5);
    });

    it('and the banner reads it from the same function', () => {
        const src = profileLogic();
        expect(src).toMatch(/formatPrestigeScore\(totalValue\)/);
    });
});
