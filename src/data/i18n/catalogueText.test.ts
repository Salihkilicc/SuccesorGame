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
    'features/education/data/educationData.ts',
];

/**
 * Fields a player reads, as opposed to fields the engine reads.
 *
 * `title` joined the list with the fifty three degrees. `field` did not, and
 * the difference is the whole point of keeping this list short: nothing
 * renders `field`, it is the engine's category, and translating a key turns a
 * lookup into prose.
 */
const PLAYER_FACING = ['name', 'description', 'title'];

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
            // The depth differs per catalogue, so the assertion is that it
            // imports the door at all rather than from one exact path.
            expect(src).toMatch(/from '(\.\.\/)+core\/i18n'/);
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

describe('and a key added to both files with the english pasted in is not a translation', () => {
    const en = require('../../core/i18n/en').en as Record<string, string>;
    const tr = require('../../core/i18n/tr').tr as Record<string, string>;

    /** The ids the education catalogue actually defines. */
    const degreeIds = (): string[] =>
        Array.from(
            source('features/education/data/educationData.ts')
                .matchAll(/get title\(\) \{ return t\('edu\.([^']+)'\)/g),
        ).map(m => m[1]);

    const degreeKeys = (): string[] => degreeIds().map(id => `edu.${id}`);

    it('every degree reads differently in the two languages', () => {
        // ------------------------------------------------------------------
        //  THE PROBE THAT STAYED GREEN
        // ------------------------------------------------------------------
        //  The shape tests above prove the literals became getters and the
        //  keys exist in both files. Neither can tell a translated key from
        //  one where somebody added the key to tr.ts and pasted the English
        //  into it, which is the single easiest way to "finish" a translation
        //  job while changing nothing a player sees.
        //
        //  Setting one Turkish degree back to its English text was tried as a
        //  probe and the whole suite stayed green. This is that hole.
        //
        //  It holds for all fifty three because no degree is spelled the same
        //  way in both languages. Somewhere with a genuine loan word - the
        //  laboratory list has 'eVTOL' - this assertion would be wrong and the
        //  file says so rather than quietly carving out an exception.
        // ------------------------------------------------------------------
        const same = degreeKeys().filter(k => en[k] === tr[k]);
        expect(same).toEqual([]);
    });

    it('and one exists for every degree in the catalogue', () => {
        // ------------------------------------------------------------------
        //  DERIVED, NOT A NUMBER TYPED IN
        // ------------------------------------------------------------------
        //  This said `toHaveLength(53)` for about ten minutes and then went
        //  red when two unrelated keys, `edu.graduated` and
        //  `edu.progressMade`, were added for the graduation message. The
        //  count was right and the thing it counted was wrong.
        //
        //  Reading the ids out of the catalogue means adding a degree fails
        //  this until its key exists, which is the actual rule, and adding a
        //  message key alongside it changes nothing.
        // ------------------------------------------------------------------
        const missing = degreeIds().filter(id => en[`edu.${id}`] === undefined);
        expect(missing).toEqual([]);
        expect(degreeIds().length).toBeGreaterThan(50);
    });
});
