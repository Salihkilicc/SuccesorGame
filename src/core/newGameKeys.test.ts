// src/core/newGameKeys.test.ts
//
// ============================================================================
//  A NEW GAME THAT LEAVES THE LAST FAMILY ON DISK
// ============================================================================
//
//  `newGame.ts` does two things to every store: it resets the copy in memory
//  and it deletes the copy on disk. Missing the second half is silent in the
//  worst possible way, because the FIRST half hides it. The screen goes empty,
//  the run looks new, and the old data comes back on the next launch when the
//  store rehydrates from a file nobody cleared.
//
//  ---------------------------------------------------------------------------
//  TWO STORES HAD DRIFTED AND ONE OF THEM WAS THE FAMILY
//  ---------------------------------------------------------------------------
//  `useNewsStore` writes `succesor_news_v4` and the list said v1. Three
//  versions of a key nothing had written since.
//
//  `useFamilyStore` writes `succesor_family_v3` and the list said v1. So a
//  player who started again and reopened the app found the previous dynasty's
//  partner, children, generation and designated successor in a company they
//  had never met.
//
//  ---------------------------------------------------------------------------
//  AND WHY A TEST AS WELL AS THE AUDIT
//  ---------------------------------------------------------------------------
//  There was already a reachability pass for this and it reported green,
//  because it read `@orphan-ok-symbol` (a NARROW exemption for one unused
//  export) as a whole file pass, and the family store carries one.
//
//  So the check existed, the defect existed, and the two never met. A second
//  reading of the same rule, by a different route, is worth having on the one
//  thing in the game whose failure mode is "your children came back".
// ============================================================================

import fs from 'fs';
import path from 'path';
import { PERSIST_KEYS } from './newGame';

const SRC = __dirname;

const walk = (dir: string, out: string[] = []): string[] => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) { walk(full, out); continue; }
        if (!/\.tsx?$/.test(e.name) || /\.test\./.test(e.name)) continue;
        out.push(full);
    }
    return out;
};

/** Every persisted store in the app, and the key it actually writes. */
const persistedStores = (): { file: string; key: string; declared: boolean }[] => {
    const found: { file: string; key: string; declared: boolean }[] = [];
    for (const file of walk(path.join(SRC, '..'))) {
        const src = fs.readFileSync(file, 'utf8');
        if (!/persist\(/.test(src)) continue;
        // The LAST one, which is the persist config rather than a character
        // called Sophia Vance. useFamilyStore has four earlier `name:` fields
        // and they are all people.
        const key = [...src.matchAll(/name:\s*'([\w-]+)'/g)].pop()?.[1];
        if (!key) continue;
        found.push({
            file: path.relative(path.join(SRC, '..'), file),
            key,
            // The one narrow way out, and it has to be written down.
            declared: /@survives-new-game\s/.test(src),
        });
    }
    return found;
};

describe('a new game clears every store it wrote', () => {
    it('every persisted key is in the list, or says out loud why it is not', () => {
        const missing = persistedStores()
            .filter(s => !s.declared && !PERSIST_KEYS.includes(s.key))
            .map(s => `${s.key}  (${s.file})`);
        expect(missing).toEqual([]);
    });

    it('and the two that had drifted are named, so a rename cannot pass quietly', () => {
        // Pinned by name rather than by count. A version bump on either of
        // these is exactly the change that caused this, and it would satisfy
        // the sweep above by simply having a different key.
        expect(PERSIST_KEYS).toContain('succesor_family_v3');
        expect(PERSIST_KEYS).toContain('succesor_news_v4');
    });

    it('and the old versions are still cleaned off devices that carry them', () => {
        // Superseded, not replaced. A device upgraded from an older build
        // still has the file, and a new game should take it.
        expect(PERSIST_KEYS).toContain('succesor_family_v1');
        expect(PERSIST_KEYS).toContain('succesor_news_v1');
    });

    it('and the sweep really is looking at the stores, not at nothing', () => {
        // The way this file could pass while checking nothing at all.
        const stores = persistedStores();
        expect(stores.length).toBeGreaterThan(15);
        expect(stores.some(s => s.key === 'succesor_family_v3')).toBe(true);
    });

    it('and only what is meant to outlive a run is exempt', () => {
        // `@survives-new-game` is a real category - the player's own name is
        // not part of a save - but it must be a short list, or the default
        // has quietly become "keep everything".
        const declared = persistedStores().filter(s => s.declared).map(s => s.key);
        expect(declared.length).toBeLessThanOrEqual(3);
    });
});
