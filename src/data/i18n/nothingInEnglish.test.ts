// src/data/i18n/nothingInEnglish.test.ts
//
// ============================================================================
//  THE SWEEP IS THE TEST
// ============================================================================
//
//  Reported as a list of places found by playing: the mail, the message
//  previews, the reply screen, the financial report, the financing tab, the
//  partner cards, LuxoNet, the marriage modals, the successor modal, the
//  titles on the home screen.
//
//  A list found by playing is never finished. The tenth one is always found by
//  somebody who was not looking, which is how these nine were found. So the
//  fix is not to translate nine screens, it is to make the tenth one fail
//  before it ships.
//
//  `scripts/untranslated.js` does the looking and this makes it a gate. It
//  found 87 strings across 33 files on its first run and the list is empty
//  now; what this file guarantees is that it stays empty.
//
//  ---------------------------------------------------------------------------
//  AND IT CANNOT BE PASSED BY LOOKING AT NOTHING
//  ---------------------------------------------------------------------------
//  Two ways to make a sweep like this green without doing any work: point it
//  at no files, or exempt everything. Both are one line and both look like
//  tidying, so both are pinned below.
// ============================================================================

import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const ROOT = path.join(__dirname, '..', '..', '..');
const SCRIPT = path.join(ROOT, 'scripts', 'untranslated.js');

/** Run the sweep and hand back what it found. */
const sweep = (): { rel: string; line: number; text: string; kind: string }[] => {
    // Required rather than spawned: the module exports its findings, and a
    // child process would only give the report back as text to re-parse.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(SCRIPT);
    return mod.findings;
};

describe('no reachable screen speaks English at a Turkish player', () => {
    it('the sweep comes back empty', () => {
        const found = sweep();
        // Reported per string rather than as a count: a bare number tells
        // whoever added the eighty eighth nothing about which line to change.
        expect(found.map(f => `${f.rel}:${f.line}  ${f.kind}  ${f.text}`)).toEqual([]);
    });
});

describe('and the sweep is really looking', () => {
    const src = fs.readFileSync(SCRIPT, 'utf8');

    it('at the whole of src rather than at a list somebody maintains', () => {
        // A named list of files is a list somebody has to remember to add to,
        // and forgetting is the entire failure being fixed here.
        expect(src).toMatch(/const walk = \(dir/);
        expect(src).toMatch(/path\.join\(__dirname, '\.\.', 'src'\)/);
    });

    it('and it catches a raw string when one is put back', () => {
        // ------------------------------------------------------------------
        //  THE NET, TESTED ON A FISH, IN ITS OWN BUCKET
        // ------------------------------------------------------------------
        //  Without this the assertion above could be green because the
        //  matcher is broken rather than because the app is translated.
        //
        //  The first version wrote the probe into the real `src` and deleted
        //  it afterwards. Jest runs suites in parallel and several of them
        //  walk the source tree, so personalCash.test.ts failed once on a
        //  file that existed for about a second. A temporary directory makes
        //  it hermetic, which is what a probe should have been anyway.
        // ------------------------------------------------------------------
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'english-probe-'));
        try {
            fs.writeFileSync(path.join(dir, 'Probe.tsx'), [
                "import React from 'react';",
                "import { Text } from 'react-native';",
                'const P = () => <Text>This sentence was never translated</Text>;',
                'export default P;',
            ].join('\n'));
            const out = execFileSync('node', [SCRIPT, dir], { encoding: 'utf8' });
            expect(out).toContain('Probe.tsx');
            expect(out).toContain('This sentence was never translated');
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    it('and the exemptions are narrow and have to give a reason', () => {
        // `@english-ok` on a line, or in the first few lines for a whole file
        // that nothing mounts. Both require a space after, so the marker
        // cannot be a bare word somebody pasted.
        expect(src).toMatch(/@english-ok\\s/);
        expect(src).toMatch(/const fileExempt/);
    });

    it('and only what is genuinely unreadable is exempt today', () => {
        // Six files, and the list is named rather than counted so that adding
        // to it is a decision somebody has to write down.
        //
        //   LuxeNetFooter, LuxoNetInventoryModal, LuxoNetModalWrapper,
        //   LuxoNetPreviewModal   shelved, nothing mounts them
        //
        //   newGame.ts            a developer integrity warning. It fires only
        //                         when a field survived a reset that should
        //                         have cleared it, it names store fields, and
        //                         the only useful response is to open the
        //                         code. Translating it would dress a bug
        //                         report up as something to act on in game.
        //
        //   useSettingsLogic.ts   'Successor OS', the name of the in game
        //                         operating system. A phone says iOS in every
        //                         language.
        //
        // If this list grows the exemption has become the way to pass rather
        // than the exception.
        const walk = (dir: string, out: string[] = []): string[] => {
            for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
                const full = path.join(dir, e.name);
                if (e.isDirectory()) { walk(full, out); continue; }
                if (/\.tsx?$/.test(e.name)) out.push(full);
            }
            return out;
        };
        const exempt = walk(path.join(ROOT, 'src'))
            .filter(f => /@english-ok\s/.test(fs.readFileSync(f, 'utf8')))
            .map(f => path.basename(f))
            .sort();
        expect(exempt).toEqual([
            'LuxeNetFooter.tsx',
            'LuxoNetInventoryModal.tsx',
            'LuxoNetModalWrapper.tsx',
            'LuxoNetPreviewModal.tsx',
            'newGame.ts',
            'useSettingsLogic.ts',
        ]);
    });
});

describe('and the words it moved really exist in both languages', () => {
    const dict = (lang: 'en' | 'tr') =>
        fs.readFileSync(path.join(ROOT, 'src', 'core', 'i18n', `${lang}.ts`), 'utf8');

    it('every key added by the translation pass is in en and in tr', () => {
        const keys = [
            'luxo.boutique', 'luxo.cartEmpty', 'luxo.payableTotal', 'luxo.enter',
            'fin.raiseMoney', 'fin.unitCost', 'fin.ceoAnnualBonus', 'fin.paidOn',
            'onb.firstName', 'onb.gender', 'onb.start',
            'love.luxury', 'love.casualHookup',
            'tut.skipStep', 'spon.ceilingLost', 'ui.newOffer',
        ];
        const missing: string[] = [];
        for (const lang of ['en', 'tr'] as const) {
            const d = dict(lang);
            for (const k of keys) if (!d.includes(`'${k}'`)) missing.push(`${lang}:${k}`);
        }
        expect(missing).toEqual([]);
    });

    it('and hostile takeover reads as difficult rather than as spiteful', () => {
        // Asked for: "düşmanca devralma" is too negative. The English keeps
        // `hostile`, which is the term of art; the Turkish stops calling the
        // player's own strategy an act of malice.
        const tr = dict('tr');
        expect(tr).toMatch(/'company\.hostileTakeover': 'Zorlu Devralma'/);
        expect(tr).not.toMatch(/'acq\.hostileTakeover': 'Düşmanca/);
        // A DIRECTOR who is hostile to you is still hostile. That one is a
        // person's stance, not a transaction, and it was right.
        expect(tr).toMatch(/'board\.stance\.Hostile': 'Düşmanca'/);
    });

    it('and the shopping button says the shorter, truer thing', () => {
        // It overflowed its box. "Yüzük al" is eight characters instead of
        // fourteen and is also more accurate: the player is buying one
        // specific object the flow has just told them they need.
        expect(dict('tr')).toMatch(/'love\.goShopping': 'Yüzük al'/);
        expect(dict('en')).toMatch(/'love\.goShopping': 'Buy a ring'/);
    });
});
