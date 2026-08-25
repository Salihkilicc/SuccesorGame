// src/logic/personalCash.test.ts
//
// ============================================================================
//  THERE WERE TWO WALLETS AND THE GAME ONLY EVER FILLED ONE
// ============================================================================
//
//  Reported as taking a partner on a date and being told "insufficient funds"
//  by a player with millions.
//
//      useStatsStore.money        every income in the game lands here
//      usePlayerStore.core.money  starts at 5,000, nothing ever adds to it
//
//  So the date, the proposal, the gift, the divorce settlement and every
//  LuxoNet purchase were checked against a number that had not moved since the
//  run began. The date costs 2,500 and the starting balance is 5,000, which is
//  why it worked exactly twice and then never again.
//
//  ---------------------------------------------------------------------------
//  AND THIS WAS ALREADY WRITTEN DOWN
//  ---------------------------------------------------------------------------
//  useEquityStore carries a note from the time a DIVIDEND was paid into the
//  invisible wallet:
//
//      "Bu projede ONUNCU kez ayni desen: ayni sey iki yerde tutuluyor, biri
//       digerini bilmiyor. Kisisel nakit artik TEK yerde - useStatsStore.money."
//
//  The tenth. This is the eleventh, and it was in six files that the fix never
//  reached. Which is the whole reason this file does not test the date: it
//  tests that nothing outside the store that owns the field reads it at all.
// ============================================================================

import fs from 'fs';
import path from 'path';

const SRC = path.join(__dirname, '..');

/** Every .ts/.tsx under src, minus tests. */
const walk = (dir: string, out: string[] = []): string[] => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) { walk(full, out); continue; }
        if (!/\.tsx?$/.test(entry.name) || /\.test\./.test(entry.name)) continue;
        out.push(full);
    }
    return out;
};

/** Live source: block comments and line comments stripped. */
const live = (file: string) =>
    fs.readFileSync(file, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*)/.test(l))
        .map(l => l.replace(/\s\/\/.*$/, ''))
        .join('\n');

describe('personal cash', () => {
    it('is read from exactly one store, and it is the one the game credits', () => {
        const offenders = walk(SRC)
            .filter(f => !f.endsWith(path.join('core', 'store', 'usePlayerStore.ts')))
            .filter(f => /\bcore\.money\b/.test(live(f)))
            .map(f => path.relative(SRC, f));

        expect(offenders).toEqual([]);
    });

    it('and is spent through the same store it is checked against', () => {
        // The half-fix that would have been worse than the bug: check the real
        // balance, deduct from the imaginary one, and the money never leaves.
        const offenders = walk(SRC)
            .filter(f => !f.endsWith(path.join('core', 'store', 'usePlayerStore.ts')))
            .filter(f => /(playerStore|player)\.spendMoney\(/.test(live(f)))
            .map(f => path.relative(SRC, f));

        expect(offenders).toEqual([]);
    });

    it('and money from a sale returns to the pocket it was paid from', () => {
        // Selling a LuxoNet asset used to credit the other wallet, so the
        // proceeds of something bought with real money arrived somewhere the
        // player could not see or spend.
        const offenders = walk(SRC)
            .filter(f => !f.endsWith(path.join('core', 'store', 'usePlayerStore.ts')))
            .filter(f => /(playerStore|player)\.earnMoney\(/.test(live(f)))
            .map(f => path.relative(SRC, f));

        expect(offenders).toEqual([]);
    });

    it('and the store that owns the other field still has it, shelved not deleted', () => {
        // usePlayerStore keeps `core.money` because it also keeps health,
        // happiness, stress and reputation, and those are genuinely its own.
        // The field is not the bug; reading it from six other files was.
        const player = fs.readFileSync(
            path.join(SRC, 'core', 'store', 'usePlayerStore.ts'), 'utf8',
        );
        expect(player).toContain('money');
    });
});
