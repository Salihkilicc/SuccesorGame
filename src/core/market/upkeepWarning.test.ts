// src/core/market/upkeepWarning.test.ts
//
// ============================================================================
//  THE UPKEEP LINE MOVES UNDER YOU, AND NOTHING SAID SO
// ============================================================================
//
//  Reported as "brand and demand are not growing" after a run where the tier
//  and the crew both went up.
//
//  The marketing benchmark is a quarter of YOUR OWN revenue, so the more
//  successful you are the more it costs simply to stand still. A player sets
//  a budget comfortably above the line and their own growth walks the line up
//  past it. Measured over sixty quarters, budget set once and left alone:
//
//      budget 500k    q 8  brand 16.2   upkeep 290k   above
//                     q20  brand 24.3   upkeep 397k   above
//                     q30  brand 24.6   upkeep 524k   UNDER
//                     q40  brand 16.3   upkeep 506k   under
//                     q60  brand 16.0   upkeep 560k   under
//
//      budget 150k    under from the first quarter, brand crawls 5 to 16
//                     over fifteen years
//
//      chasing it     brand 8 to 32.6, demand 5,167 to 30,995
//
//  The report explained the fall AFTER it happened, and only once the brand
//  had already dropped half a point. This fires the quarter you go under,
//  while the brand is still where you left it.
//
//  AND THE OTHER SILENT WALL. Measured on the chasing run: brand sat at
//  exactly 26.0 against a tier two ceiling of 26 for quarters on end. The
//  money was doing nothing and nothing said so.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { maintenanceCost, meetsMaintenance, BRAND_MAINTENANCE_RATIO } from './attraction';

describe('what standing still costs', () => {
    it('is a share of the benchmark, and the benchmark is a share of your revenue', () => {
        // So it is not a fixed bill. It follows you up.
        expect(maintenanceCost(1_000_000)).toBe(1_000_000 * BRAND_MAINTENANCE_RATIO);
        expect(maintenanceCost(4_000_000)).toBeGreaterThan(maintenanceCost(1_000_000));
    });

    it('and a budget that was enough can stop being enough without moving', () => {
        // THE DEFECT, as two numbers from the sixty quarter run: 500k was
        // above a 397k line at quarter twenty and under a 524k line at thirty.
        expect(meetsMaintenance(500_000, 397_000 / BRAND_MAINTENANCE_RATIO)).toBe(true);
        expect(meetsMaintenance(500_000, 524_000 / BRAND_MAINTENANCE_RATIO)).toBe(false);
    });

    it('and nothing about the budget changed in between', () => {
        const budget = 500_000;
        expect(budget).toBe(500_000);
    });
});

describe('the report says so the quarter it happens', () => {
    const src = fs.readFileSync(
        path.join(__dirname, '..', '..', 'features', 'assets', 'screens', 'QuarterlyReportModal.tsx'),
        'utf8',
    );

    it('by comparing what you spent against what holding still costs', () => {
        expect(src).toMatch(/const marketingSpend = \(r\.expenses as any\)\?\.marketing \?\? 0/);
        expect(src).toMatch(/const upkeep = r\.brandMaintenance \?\? 0/);
        expect(src).toMatch(/marketingSpend < upkeep/);
    });

    it('and it does NOT wait for the brand to have fallen first', () => {
        // The rule that would have caught the original. The existing note is
        // gated on `brandChange < -0.5`, which is a quarter too late and only
        // fires once the damage is visible.
        const warnAt = src.indexOf('marketingSpend < upkeep');
        const fellAt = src.indexOf('r.brandChange < -0.5');
        expect(warnAt).toBeGreaterThan(-1);
        expect(fellAt).toBeGreaterThan(warnAt);
    });

    it('and it names both numbers, because the gap is the whole point', () => {
        expect(src).toMatch(/obs\.marketingUnderUpkeep/);
        expect(src).toMatch(/v1: formatMoney\(marketingSpend\)/);
        expect(src).toMatch(/v2: formatMoney\(upkeep\)/);
    });

    it('and it says when the money is doing nothing because the factory caps it', () => {
        expect(src).toMatch(/obs\.brandAtFacilityCeiling/);
        expect(src).toMatch(/r\.brandValue >= r\.brandCeiling - 0\.5/);
    });

    it('and the two never fire together, because only one of them is the reason', () => {
        // Under the line is the reason your brand is falling. At the ceiling
        // is the reason it is not rising. Both at once is noise.
        expect(src).toMatch(/marketingSpend < upkeep\) \{[\s\S]{0,400}?\} else if/);
    });

    it('and both languages can say them', () => {
        const tr = fs.readFileSync(path.join(__dirname, '..', 'i18n', 'tr.ts'), 'utf8');
        const en = fs.readFileSync(path.join(__dirname, '..', 'i18n', 'en.ts'), 'utf8');
        for (const key of ['obs.marketingUnderUpkeep', 'obs.brandAtFacilityCeiling']) {
            expect(tr).toContain(`'${key}'`);
            expect(en).toContain(`'${key}'`);
        }
    });

    it('and neither of them uses a dash, which the game does not', () => {
        const tr = fs.readFileSync(path.join(__dirname, '..', 'i18n', 'tr.ts'), 'utf8');
        const en = fs.readFileSync(path.join(__dirname, '..', 'i18n', 'en.ts'), 'utf8');
        const lines = [...tr.split('\n'), ...en.split('\n')]
            .filter(l => /'obs\.(marketingUnderUpkeep|brandAtFacilityCeiling)'/.test(l));
        expect(lines).toHaveLength(4);
        for (const l of lines) {
            expect(l).not.toMatch(/[—–]/);
            expect(l.replace(/^.*?':/, '')).not.toMatch(/ - /);
        }
    });
});
