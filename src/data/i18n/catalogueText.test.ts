// src/data/i18n/catalogueText.test.ts
//
// ============================================================================
//  THE BLIND SPOT IN THE SWEEP, CLOSED FOR THE CATALOGUES
// ============================================================================
//
//  `scripts/untranslated.js` reads .tsx files: Text children, and the props
//  that name things. It is the right shape for a screen and it cannot see a
//  string that arrives on that screen through a VARIABLE from a .ts file, so
//  a catalogue full of English sails past it while the sweep reports zero.
//
//  Which is what happened. `node scripts/untranslated.js` said "Nothing on a
//  reachable screen" on the same afternoon the report came in as "argede
//  cevrilmeyen yazolar var", and the report was right:
//
//      FACILITY_TIERS       five building names, five descriptions
//                           LaboratoryScreen renders name, description, and
//                           the next tier's name inside the upgrade button
//      UNLOCKABLE_PRODUCTS  'eVTOL SkyCar', one plain string among fourteen
//                           getters, shown in the tech tree
//
//  Eleven English lines behind one green tick. The same blind spot hid the
//  magnate lines earlier and it will hide the next one too, so this stops
//  being a list of strings somebody found and becomes a rule about SHAPE:
//
//      in these catalogues, a field the player reads is a getter through
//      `t()`, never a literal.
//
//  A getter rather than a value for a second reason worth stating: a value
//  is evaluated once at module load, in whatever language was active then,
//  and does not follow the player when they change language in Settings.
//
//  Read from the source text rather than by comparing rendered strings.
//  Comparing en against tr would pass for anything a translator had not got
//  to yet, and would refuse a name that is deliberately the same word in
//  both - which is a real case here: 'eVTOL' is 'eVTOL'.
// ============================================================================

import fs from 'fs';
import path from 'path';

const ROOT = path.join(__dirname, '..', '..');

/**
 * The catalogues whose text reaches a screen through a variable.
 *
 * NOT every data file. A file whose strings are ids, keys, categories or
 * console output has no business being in here, and adding it would make the
 * rule below meaningless by making it universal.
 */
const CATALOGUES = [
    'features/laboratory/data/laboratoryData.ts',
    'features/products/data/unlockableProductsData.ts',
];

/** Fields a player reads, as opposed to fields the engine reads. */
const PLAYER_FACING = ['name', 'description'];

const source = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

describe('a catalogue the player reads goes through the door', () => {
    for (const rel of CATALOGUES) {
        it(`${rel} has no player-facing literal left in it`, () => {
            const offenders: string[] = [];
            source(rel).split('\n').forEach((raw, i) => {
                const cleaned = raw.split('//')[0];
                for (const field of PLAYER_FACING) {
                    // `field: 'something'` - a literal. A getter reads
                    // `get field() { return t('key'); }` and does not match.
                    const literal = new RegExp(`(^|[^\\w.])${field}\\s*:\\s*['"\`]`);
                    if (literal.test(cleaned)) {
                        offenders.push(`${rel}:${i + 1}  ${raw.trim()}`);
                    }
                }
            });
            expect(offenders).toEqual([]);
        });

        it(`${rel} actually calls t, so the rule cannot be passed by deleting the fields`, () => {
            // Both halves matter. A file with no literals and no `t()` has
            // had its text removed rather than translated, and the screen
            // then renders undefined - which is a worse bug wearing a green
            // tick.
            const src = source(rel);
            expect(src).toContain("from '../../../core/i18n'");
            expect(src.split(/\bt\(/).length - 1).toBeGreaterThan(5);
        });
    }
});

describe('and every key those getters ask for exists in both languages', () => {
    // The getters are only a door. A door onto a missing key gives the
    // player the key itself, in dot notation, which reads as a bug rather
    // than as English and is somehow worse.
    const en = require('../../core/i18n/en').en as Record<string, string>;
    const tr = require('../../core/i18n/tr').tr as Record<string, string>;

    const keysAskedFor = (rel: string): string[] =>
        Array.from(source(rel).matchAll(/\bt\(\s*'([^']+)'/g)).map(m => m[1]);

    for (const rel of CATALOGUES) {
        it(`${rel} asks for nothing that is missing`, () => {
            const missing = keysAskedFor(rel)
                .flatMap(k => [
                    en[k] === undefined ? `en is missing ${k}` : null,
                    tr[k] === undefined ? `tr is missing ${k}` : null,
                ])
                .filter(Boolean);
            expect(missing).toEqual([]);
        });
    }

    it('and the laboratory names really are different in the two languages', () => {
        // The shape test above cannot tell a translated key from one that was
        // added to both files with the English text pasted into each. This
        // can, for the five buildings, which are the ones that were reported.
        for (const key of [
            'lab.tierCorporateAnnex',
            'lab.tierInnovationPlaza',
            'lab.tierAdvancedTechCenter',
            'lab.tierFutureCampus',
            'lab.tierGlobalSiliconHQ',
        ]) {
            expect([key, tr[key] === en[key]]).toEqual([key, false]);
        }
    });
});
