// src/core/market/reachRecovery.test.ts
//
// ============================================================================
//  THE WAY BACK, AND WHETHER ANYBODY IS TOLD ABOUT IT
// ============================================================================
//
//  Reported as "I played it and it felt flat". Measured on the live engine
//  over sixty quarters of otherwise good play - plant upgraded, researchers
//  hired, every affordable quality level bought - with one thing left out:
//  the factory was never staffed to its tier.
//
//      quarter   attraction   reach   share
//        1          2.91       0.97   0.44%
//       60          5.47       0.35   0.30%
//
//  The quality ladder was climbing the whole time. `reachIndex` multiplies
//  straight into attraction and it fell faster, so the company got better and
//  smaller at once. With the crew hired and NOTHING else changed, reach holds
//  at 1.00 and the same sixty quarters go 2.3M to 10.6M of revenue.
//
//  So the engine was right and the screen was silent. The report named the
//  loss but not the way out of it. These tests pin the arithmetic behind the
//  sentence, and that the sentence is actually rendered.
// ============================================================================

import fs from 'fs';
import path from 'path';
import {
    REACH_RECOVERY,
    REACH_SERVE_TARGET,
    REACH_FULL_THRESHOLD,
    quartersToRecover,
    updateReachIndex,
} from './attraction';

describe('the recovery estimate is the engine, not a guess beside it', () => {
    it('says nothing is owed when reach is whole', () => {
        expect(quartersToRecover(1)).toBe(0);
        expect(quartersToRecover(0.96)).toBe(0);
        expect(quartersToRecover(undefined)).toBe(0);
    });

    it('agrees with actually running the recovery quarter by quarter', () => {
        // THE POINT OF THE WHOLE FILE. If updateReachIndex is ever retuned and
        // this closed form is not, the screen starts quoting a number the game
        // does not honour - which is a worse failure than saying nothing.
        for (const start of [0.2, 0.35, 0.5, 0.72, 0.9]) {
            const predicted = quartersToRecover(start);

            let reach = start;
            let walked = 0;
            while (reach < 0.95 && walked < 500) {
                reach = updateReachIndex(reach, 1);
                walked++;
            }

            expect([start, predicted]).toEqual([start, walked]);
        }
    });

    it('and the way back from the bottom is long enough to be worth stating', () => {
        // Thirteen quarters. Over three years of never once running short,
        // which is a strategy rather than a correction. A player told only
        // "it recovers slowly" would guess three and be wrong for a decade.
        expect(quartersToRecover(0.35)).toBe(13);
    });

    it('is monotonic: the deeper the hole the longer the climb', () => {
        const points = [0.9, 0.75, 0.6, 0.45, 0.3, 0.15];
        for (let i = 1; i < points.length; i++) {
            expect([points[i], quartersToRecover(points[i]) > quartersToRecover(points[i - 1])])
                .toEqual([points[i], true]);
        }
    });

    it('and it survives nonsense rather than returning one', () => {
        expect(quartersToRecover(-1)).toBeGreaterThan(0);
        expect(Number.isFinite(quartersToRecover(0))).toBe(true);
        expect(quartersToRecover(0.5, 1)).toBeGreaterThan(0);
        expect(Number.isFinite(quartersToRecover(0.5, 1))).toBe(true);
    });

    it('and the serve target the screens quote is the one the engine uses', () => {
        // Two constants that must never drift: the screen says "serve 90 per
        // cent", the engine decides recovery on REACH_FULL_THRESHOLD.
        expect(REACH_SERVE_TARGET).toBe(REACH_FULL_THRESHOLD);

        // Just under the target still bleeds; at the target it turns around.
        const below = updateReachIndex(0.6, REACH_SERVE_TARGET - 0.01);
        const at = updateReachIndex(0.6, REACH_SERVE_TARGET);
        expect(below).toBeLessThan(0.6);
        expect(at).toBeGreaterThan(0.6);
        expect(REACH_RECOVERY).toBeGreaterThan(0);
    });
});

// ============================================================================
//  AND THE NUMBER HAS TO REACH A SCREEN
// ============================================================================
//  This project's signature failure is correct data that nothing reads. The
//  arithmetic above is worthless if the report keeps quoting the loss alone.
//  Comments are stripped before the source is inspected, because a mention of
//  `quartersToRecover` inside an explanation of it is not a call to it - this
//  file has produced that false positive before.
// ============================================================================

const SRC = path.join(__dirname, '..', '..');
const live = (rel: string) =>
    fs.readFileSync(path.join(SRC, rel), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*)/.test(l))
        .map(l => l.replace(/\s\/\/.*$/, ''))
        .join('\n');

describe('the quarterly report says how long and what it takes', () => {
    const report = () =>
        live(path.join('features', 'assets', 'screens', 'QuarterlyReportModal.tsx'));

    it('calls the recovery function rather than printing a fixed number', () => {
        expect(report()).toMatch(/quartersToRecover\s*\(/);
    });

    it('and imports it from the module that owns the decay', () => {
        expect(report()).toMatch(/from\s+'[^']*core\/market\/attraction'/);
    });
});

describe('and so does the screen where the decision is actually made', () => {
    // The report is read once, after the fact. The production target and the
    // marketing budget - the two controls that cause a stockout - are set
    // HERE, and this screen said nothing about the lasting cost.
    const productScreen = () =>
        live(path.join('features', 'products', 'components', 'ProductModals.tsx'));

    it('raises a standing alert while reach is damaged', () => {
        const src = productScreen();
        expect(src).toMatch(/product\.reachDamaged/);
        expect(src).toMatch(/quartersToRecover\s*\(/);
    });

    it('and reads the live index off the product rather than assuming it is whole', () => {
        expect(productScreen()).toMatch(/product\.reachIndex/);
    });
});

describe('both sentences exist in both languages', () => {
    // A key that is missing renders as the key itself. These two are the
    // entire fix, so a missing one is the fix silently not shipping.
    const dict = (lang: string) => live(path.join('core', 'i18n', `${lang}.ts`));

    for (const lang of ['en', 'tr']) {
        it(`${lang} carries the report line and the screen line`, () => {
            const src = dict(lang);
            expect([lang, /'obs\.reachWayBack':/.test(src)]).toEqual([lang, true]);
            expect([lang, /'product\.reachDamaged':/.test(src)]).toEqual([lang, true]);
        });

        it(`${lang} fills every placeholder it promises`, () => {
            const src = dict(lang);
            const line = (key: string) =>
                src.split('\n').find(l => l.includes(`'${key}':`)) ?? '';
            // The report line takes two, the screen line takes three. A
            // sentence quoting {v3} that nobody passes reads as "{v3}".
            expect([lang, /\{v1\}/.test(line('obs.reachWayBack'))]).toEqual([lang, true]);
            expect([lang, /\{v2\}/.test(line('obs.reachWayBack'))]).toEqual([lang, true]);
            for (const v of ['v1', 'v2', 'v3']) {
                expect([lang, v, new RegExp(`\\{${v}\\}`).test(line('product.reachDamaged'))])
                    .toEqual([lang, v, true]);
            }
        });

        it(`${lang} keeps the no-dash rule`, () => {
            // No em dash and no spaced hyphen in anything the player reads.
            const src = dict(lang);
            for (const key of ['obs.reachWayBack', 'product.reachDamaged']) {
                const line = src.split('\n').find(l => l.includes(`'${key}':`)) ?? '';
                expect([lang, key, /—|\s-\s/.test(line)]).toEqual([lang, key, false]);
            }
        });
    }
});
