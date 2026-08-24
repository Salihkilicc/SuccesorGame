// src/core/market/tierTagLayout.test.ts
//
// ============================================================================
//  THE CAP TIER TAG, AND THE NAMES IT WAS SITTING NEXT TO
// ============================================================================
//
//  Every company in the game carries a valuation tier - MEGA-CAP, LARGE-CAP,
//  MID-CAP, SMALL-CAP - and three screens drew it as a small coloured tag ON
//  THE SAME LINE AS THE COMPANY NAME:
//
//      [icon]  Nakatomi Trading Corporation [LARGE-]
//              INDUSTRIAL
//
//  The name had `numberOfLines={1}` and no `flexShrink`, and the tag had
//  neither, so in a fixed-width row the two fought over the same space and the
//  tag lost the end of itself. Reported as "isimler uzunken sigmiyor", and it
//  is worse than a cosmetic clip: the tier is the one thing on that row telling
//  you whether this is a company you could plausibly buy, and it is exactly the
//  long, important-sounding names that pushed it off.
//
//  ---------------------------------------------------------------------------
//  SO IT MOVES DOWN A LINE, NEXT TO THE SECTOR
//  ---------------------------------------------------------------------------
//  Which is where it belonged anyway. The second line already held the sector,
//  and sector and cap tier are the same KIND of fact - two labels that place a
//  company in a bracket - while the name is the only thing on the row that is
//  the company itself. Giving the name the full width and the two labels the
//  line below is the arrangement the content already implied.
//
//  The tag never shrinks and the sector always does. Eight capital letters at
//  nine point have nothing to give up; a sector name can lose its tail and
//  still be read.
//
//  SAME IN ALL THREE, and that is the part worth pinning. Hostile Takeover, My
//  Empire and the subsidiary page show the SAME COMPANIES, so a row that reads
//  one way in one place and another way in the next is a worse bug than the
//  clipping was.
// ============================================================================

import fs from 'fs';
import path from 'path';

import { getCompanyVisual } from './companyVisuals';

const SRC = path.join(__dirname, '..', '..');
const read = (...p: string[]) => fs.readFileSync(path.join(SRC, ...p), 'utf8');

/** The comments above and in those files quote the old layout. */
const code = (...p: string[]) => read(...p)
    .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '')
    .split('\n')
    .filter(l => !/^\s*\/\//.test(l))
    .join('\n');

/** Everywhere the tier tag is drawn. */
const ROWS: readonly (readonly string[])[] = [
    ['components', 'MyCompany', 'Actions', 'AcquisitionModal.tsx'],
    ['components', 'MyCompany', 'Finance', 'ExistingCompaniesModal.tsx'],
    ['components', 'MyCompany', 'Finance', 'SubsidiaryDetailModal.tsx'],
];

describe('the tier tag', () => {
    it.each(ROWS.map(p => [p.join('/'), p]))('sits below the name in %s', (_label, p) => {
        const src = code(...(p as string[]));
        // The tag lives in metaRow, and metaRow is not the line the name is on.
        expect(src).toMatch(/metaRow:\s*\{[\s\S]{0,160}flexDirection:\s*'row'/);
        expect(src).toMatch(/<View style=\{styles\.metaRow\}>[\s\S]{0,400}tierLabel\}/);
    });

    it.each(ROWS.map(p => [p.join('/'), p]))('and holds its width in %s', (_label, p) => {
        const src = code(...(p as string[]));
        expect(src).toMatch(/tierTag:\s*\{[\s\S]{0,200}flexShrink:\s*0/);
    });

    it.each(ROWS.map(p => [p.join('/'), p]))('while the sector gives way in %s', (_label, p) => {
        const src = code(...(p as string[]));
        expect(src).toMatch(/(itemSector|sector|sectorText):\s*\{[\s\S]{0,200}flexShrink:\s*1/);
    });

    it('is never back on the name line in any of them', () => {
        // The shape that caused it: a row wrapper holding the name and the tag
        // as siblings. If somebody puts one back, this is what it looks like.
        for (const p of ROWS) {
            const src = code(...(p as string[]));
            expect(src).not.toMatch(
                /flexDirection: 'row'[^}]*\}\}>\s*<Text style=\{styles\.(name|itemName|companyName)\}[\s\S]{0,300}tierLabel\}/,
            );
        }
    });
});

describe('the tiers themselves', () => {
    it('are four brackets with no gap and no overlap between them', () => {
        // The tag is only worth a line of its own if it says something, and it
        // only says something if the thresholds actually partition the range.
        const at = (v: number) => getCompanyVisual({}, v).tierLabel;
        expect(at(0)).toBe('SMALL-CAP');
        expect(at(999_999_999)).toBe('SMALL-CAP');
        expect(at(1_000_000_000)).toBe('MID-CAP');
        expect(at(49_999_999_999)).toBe('MID-CAP');
        expect(at(50_000_000_000)).toBe('LARGE-CAP');
        expect(at(499_999_999_999)).toBe('LARGE-CAP');
        expect(at(500_000_000_000)).toBe('MEGA-CAP');
    });

    it('and a company with no valuation is not silently a mid-cap', () => {
        // The default parameter is 0, so anything that forgets to pass a
        // valuation lands in SMALL-CAP - visibly wrong rather than plausibly
        // wrong, which is the one to prefer.
        expect(getCompanyVisual({}).tierLabel).toBe('SMALL-CAP');
    });
});
