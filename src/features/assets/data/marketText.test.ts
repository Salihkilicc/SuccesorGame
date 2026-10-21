// src/features/assets/data/marketText.test.ts
//
// ============================================================================
//  A PROPER NOUN IS NOT AN UNTRANSLATED STRING
// ============================================================================
//
//  catalogueText.test.ts has one rule for a catalogue: a field the player
//  reads is a getter through `t()`, never a literal. marketData cannot join
//  that list, and the reason is the interesting part rather than an exception
//  to be waved through.
//
//      description   a sentence. Sixty seven of them, all translated.
//      name          `Pear Inc.` It is `Pear Inc.` in Turkish too, the same
//                    way a real company is, and translating it would mean two
//                    players discussing the same stock under two names.
//
//  So the rule here is split, and both halves are asserted. Without the second
//  one, "no literal names" would be satisfied by translating sixty seven
//  proper nouns, which is the wrong fix passing a green tick.
//
//  THE FIVE INSTRUMENTS ARE THE EXCEPTION TO THE EXCEPTION. `Gold Bullion
//  Trust` is not a name, it is a description of what the fund holds. Those are
//  getters, and they are listed by id rather than detected, because the
//  difference between a name and a description is a judgement and judgements
//  belong written down.
// ============================================================================

import fs from 'fs';
import path from 'path';

const ROOT = path.join(__dirname, '..', '..', '..', '..');
const FILE = 'src/features/assets/data/marketData.ts';

const source = () =>
    fs.readFileSync(path.join(ROOT, FILE), 'utf8')
        .split('\n').map(l => l.split('//')[0]).join('\n');

/** The instruments, which describe themselves rather than naming anybody. */
const DESCRIPTIVE_NAMES = ['fund_spy', 'fund_qqq', 'fund_icln', 'fund_gld', 'fund_vym'];

const en = require('../../../core/i18n/en').en as Record<string, string>;
const tr = require('../../../core/i18n/tr').tr as Record<string, string>;

describe('every description goes through the door', () => {
    it('not one literal is left', () => {
        const literals = source().split('\n')
            .filter(l => /(^|[^\w.])description\s*:\s*['"`]/.test(l))
            .map(l => l.trim());
        expect(literals).toEqual([]);
    });

    it('and there are sixty seven of them, so the rule is not passing on an empty file', () => {
        const getters = [...source().matchAll(/get description\(\) \{ return t\('([^']+)'\)/g)];
        expect(getters).toHaveLength(67);
    });
});

describe('the names are left alone on purpose', () => {
    it('most of them are still literals, because they are proper nouns', () => {
        // ------------------------------------------------------------------
        //  THE ASSERTION THAT LOOKS BACKWARDS
        // ------------------------------------------------------------------
        //  Every other test in this repo checks that player text is NOT a
        //  literal. This one checks that it still is, for sixty seven entries,
        //  because the opposite would be somebody dutifully "finishing the
        //  translation" by putting Pear Inc. through a dictionary.
        // ------------------------------------------------------------------
        const literals = [...source().matchAll(/name: '((?:\\.|[^'])*)'/g)];
        expect(literals.length).toBe(67);
    });

    it('and exactly the five instruments are not', () => {
        const getters = [...source().matchAll(/get name\(\) \{ return t\('mkt\.([^.]+)\.name'\)/g)]
            .map(m => m[1]);
        expect(getters.sort()).toEqual([...DESCRIPTIVE_NAMES].sort());
    });
});

describe('and every key those getters ask for exists in both languages', () => {
    const keys = [...source().matchAll(/return t\('([^']+)'\)/g)].map(m => m[1]);

    it('nothing is missing', () => {
        // A missing key renders as the key itself, in dot notation, which
        // reads as a bug rather than as English and is somehow worse.
        const missing = keys.flatMap(k => [
            en[k] === undefined ? `en is missing ${k}` : null,
            tr[k] === undefined ? `tr is missing ${k}` : null,
        ]).filter(Boolean);
        expect(missing).toEqual([]);
    });

    it('and nothing was "translated" by pasting the english in', () => {
        // ------------------------------------------------------------------
        //  THE PROBE THAT STAYED GREEN ON THE DEGREES
        // ------------------------------------------------------------------
        //  Adding a key to tr.ts with the English text in it satisfies every
        //  shape test ever written and changes nothing a player sees. It was
        //  tried as a probe against the education work and the whole suite
        //  stayed green, which is why it is asserted here from the start.
        //
        //  `mRNA devrimcisi.` is the closest call and it still differs; a term
        //  that is genuinely identical in both languages would need listing
        //  here rather than quietly weakening the rule.
        // ------------------------------------------------------------------
        const same = keys.filter(k => en[k] === tr[k]);
        expect(same).toEqual([]);
    });
});
