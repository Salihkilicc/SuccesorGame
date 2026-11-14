// src/core/i18n/categoryLabel.test.ts
//
// ============================================================================
//  THE ENGLISH THAT WAS NOT IN ANY SCREEN
// ============================================================================
//
//  Reported from a device as two things: the filters on the hostile takeover
//  screen were English, and so were the headings in the research centre.
//  `node scripts/untranslated.js` said, at the same moment, that nothing on a
//  reachable screen was untranslated.
//
//  Both were true. The audit looks for English LITERALS inside JSX, which is
//  the right net for the mistake this project keeps making. This English was
//  never a literal in a screen: it sat in a data file as
//
//      category: 'Robotics',
//
//  and reached the player through `<Text>{category}</Text>`. The audit was
//  reading the screens and the English was in the cupboard.
//
//  ---------------------------------------------------------------------------
//  TWO ASSERTIONS, AND THE SECOND ONE IS THE POINT
//  ---------------------------------------------------------------------------
//  The first half checks that every category in the data has a translation.
//  That is the fix, and on its own it is worth little: it goes green the day
//  the keys are added and stays green while somebody adds an eleventh
//  `<Text>{category}</Text>` next week.
//
//  The second half reads the SCREENS and fails on a raw category rendered
//  without going through `categoryLabel`. That is the class, rather than the
//  instance, and it is the only half that would have caught this bug before a
//  phone did.
// ============================================================================

import fs from 'fs';
import path from 'path';

import { CATEGORY_KEYS, categoryKeyFor, categoryLabel } from './categoryLabel';
import { en } from './en';
import { tr } from './tr';
import { useLocaleStore } from './index';

const ROOT = path.join(__dirname, '..', '..', '..');
const SRC = path.join(ROOT, 'src');

/**
 * Where the categories are authored.
 *
 * Read from the files rather than listed here, so a category added to the data
 * and not to the catalogue is a failure rather than a thing nobody noticed.
 */
const DATA_FILES = [
    'src/data/AcquisitionData.ts',
    'src/features/products/data/unlockableProductsData.ts',
];

/** Flagged off, and excluded from the reachability audit for the same reason. */
const OFF = ['features/life', 'features/shopping'];

/**
 * The project's existing marker for a file nothing renders.
 *
 * Honoured rather than ignored, because the first run of this test found four
 * offenders and three of them were superseded screens carrying this marker:
 * `components/Market/StockDetailHeader.tsx`, `components/Market/StocksList.tsx`
 * and `components/MyCompany/Actions/CompanyAnalysisModal.tsx`. Nobody reads
 * them, so translating them would be work with no reader, and failing on them
 * forever is how a check gets weakened until it stops being run.
 *
 * The marker is a DECLARATION, which is what makes skipping it safe: a file
 * that starts being rendered again loses the marker, and the reachability
 * audit is what notices if it does not.
 */
const ORPHAN = /@orphan-ok/;

const categoriesInData = (): string[] => {
    const found = new Set<string>();
    for (const rel of DATA_FILES) {
        const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
        for (const m of src.matchAll(/category: '([^']+)'/g)) found.add(m[1]);
    }
    return [...found].sort();
};

const screenFiles = (dir: string = SRC, out: string[] = []): string[] => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        const rel = path.relative(ROOT, full).replace(/\\/g, '/');
        if (OFF.some(off => rel.includes(off))) continue;
        if (e.isDirectory()) screenFiles(full, out);
        else if (e.name.endsWith('.tsx') && !e.name.includes('.test.')) out.push(full);
    }
    return out;
};

describe('every category in the data can be shown in both languages', () => {
    const inData = categoriesInData();

    it('found the categories, rather than an empty list', () => {
        // The guard against this whole file passing because the regex stopped
        // matching, which would be a check that passes by not looking.
        expect(inData.length).toBeGreaterThanOrEqual(8);
    });

    it.each(['en', 'tr'])('has a %s label for each of them', (locale) => {
        const catalogue = locale === 'en' ? en : tr;
        const missing = inData.filter(c => !(categoryKeyFor(c) in catalogue));
        expect(missing).toEqual([]);
    });

    it('declares every data category in CATEGORY_KEYS', () => {
        const undeclared = inData.filter(c => !(CATEGORY_KEYS as readonly string[]).includes(c));
        expect(undeclared).toEqual([]);
    });

    it('translates the two the acquisition filter makes up as well', () => {
        // "All" is prepended to the tab strip and "Other" stands in for a
        // company with no category. Neither is in any data file, and both are
        // on the same strip as the ones that are.
        for (const synthetic of ['All', 'Other']) {
            expect(categoryKeyFor(synthetic) in en).toBe(true);
            expect(categoryKeyFor(synthetic) in tr).toBe(true);
        }
    });

    it('does not pass the English off as Turkish', () => {
        // Four of these are the same word in both languages, which is honest.
        // All eleven being identical would mean the catalogue was pasted.
        const keys = CATEGORY_KEYS.map(categoryKeyFor);
        const differing = keys.filter(k => (en as any)[k] !== (tr as any)[k]);
        expect(differing.length).toBeGreaterThanOrEqual(7);
    });
});

describe('categoryLabel', () => {
    const asLocale = (locale: 'en' | 'tr', run: () => void) => {
        const before = useLocaleStore.getState().locale;
        useLocaleStore.setState({ locale });
        try { run(); } finally { useLocaleStore.setState({ locale: before }); }
    };

    it('returns the Turkish word, not the key', () => {
        asLocale('tr', () => {
            expect(categoryLabel('Robotics')).toBe('Robotik');
            expect(categoryLabel('Deep Tech')).toBe('İleri Teknoloji');
            expect(categoryLabel('Bio-Tech')).toBe('Biyoteknoloji');
        });
    });

    it('returns the English word in English', () => {
        asLocale('en', () => {
            expect(categoryLabel('Robotics')).toBe('Robotics');
            expect(categoryLabel('Deep Tech')).toBe('Deep Tech');
        });
    });

    it('falls back to the key rather than to a blank', () => {
        // A category added to the data tomorrow and not here. Ugly beats empty:
        // the test above is what stops it staying ugly.
        expect(categoryLabel('Quantum Freight')).toBe('Quantum Freight');
    });

    it('is empty for nothing, rather than the word undefined', () => {
        expect(categoryLabel(undefined)).toBe('');
        expect(categoryLabel(null)).toBe('');
        expect(categoryLabel('')).toBe('');
    });

    it('builds the key the same way for a space and for a hyphen', () => {
        expect(categoryKeyFor('Deep Tech')).toBe('sector.deepTech');
        expect(categoryKeyFor('Bio-Tech')).toBe('sector.bioTech');
        expect(categoryKeyFor('Media')).toBe('sector.media');
    });
});

// ===========================================================================
//  AND THE HALF THAT CATCHES THE NEXT ONE
// ===========================================================================

describe('no screen puts a raw category on the player', () => {
    /**
     * `<Text ...>{category}</Text>` and its relatives.
     *
     * Deliberately narrow. A sweep for every identifier rendered inside a Text
     * node would drown in names, figures and dates; this looks only for the
     * handful of words that are known to hold an English KEY rather than a
     * sentence, which is the thing that went wrong.
     */
    const RAW = /<Text[^>]*>\s*\{\s*((?:\w+\.)?(?:category|sector|cat))\s*\}/g;

    it('renders every one of them through categoryLabel', () => {
        const offenders: string[] = [];

        for (const file of screenFiles()) {
            const src = fs.readFileSync(file, 'utf8');
            if (ORPHAN.test(src)) continue;
            for (const m of src.matchAll(RAW)) {
                const line = src.slice(0, m.index).split('\n').length;
                offenders.push(`${path.relative(ROOT, file)}:${line}  {${m[1]}}`);
            }
        }

        expect(offenders).toEqual([]);
    });

    it('only skips files that declare themselves orphaned', () => {
        // The skip above is the kind of thing that quietly grows until the
        // check covers nothing. Three files use it today; a jump means
        // somebody reached for the marker to silence this test.
        const skipped = screenFiles()
            .filter(f => ORPHAN.test(fs.readFileSync(f, 'utf8')))
            .filter(f => RAW.test(fs.readFileSync(f, 'utf8')))
            .map(f => path.relative(ROOT, f));
        expect(skipped.length).toBeLessThanOrEqual(3);
    });

    it('is actually looking, and would see one if it were there', () => {
        // The probe, written into the test. Without this the regex could stop
        // matching anything at all and the assertion above would go green for
        // the worst possible reason.
        const planted = '      <Text style={styles.x}>{product.category}</Text>';
        expect([...planted.matchAll(RAW)]).toHaveLength(1);
        expect([...'<Text>{categoryLabel(cat)}</Text>'.matchAll(RAW)]).toHaveLength(0);
    });
});
