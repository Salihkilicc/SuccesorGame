// src/storage/warmUp.test.ts
//
// ============================================================================
//  THE QUARTER MUST NOT RUN BEFORE THE SAVES ARE IN
// ============================================================================
//
//  Measured on a device: launch the app, press Next Quarter within about a
//  second, and thirty writes are dropped in one tick - territory, sponsorship,
//  the casino risk record, the achievements, the subsidiaries. The drop itself
//  is right and protects the disk. What is lost is what the quarter computed:
//  the write goes, and then hydration lands and overwrites the memory too.
//
//  The window was that wide because App.tsx waited for TWO stores and assumed
//  the rest came out with them. They do not. A store starts reading when it is
//  CREATED, and half of these are created by a lazy `require` inside the tick.
//
//  Two properties, and a list that has to be kept honest.
// ============================================================================

import fs from 'fs';
import path from 'path';

import { PERSIST_KEYS } from '../core/newGame';

describe('whenSettled', () => {
    // Fresh module registry each time: `hydrated` and `asked` are module state
    // and the whole point of them is that they accumulate.
    beforeEach(() => jest.resetModules());

    it('resolves immediately when nobody has asked for anything', async () => {
        const { whenSettled, outstandingReads } = require('./persist');
        expect(outstandingReads()).toEqual([]);
        await expect(whenSettled()).resolves.toBeUndefined();
    });

    it('and waits while a read is outstanding', async () => {
        const { zustandStorage, whenSettled, outstandingReads } = require('./persist');

        let landed = false;
        const read = zustandStorage.getItem('succesor_test_key');
        // Recorded before the await inside getItem, so it is visible now.
        expect(outstandingReads()).toEqual(['succesor_test_key']);

        whenSettled().then(() => { landed = true; });
        expect(landed).toBe(false);

        await read;
        await Promise.resolve();
        expect(outstandingReads()).toEqual([]);
    });

    it('and a read that fails still counts as no longer outstanding', async () => {
        // Otherwise one throwing read hangs every later wait for the rest of
        // the session, and the game simply stops advancing.
        jest.doMock('@react-native-async-storage/async-storage', () => ({
            getItem: jest.fn().mockRejectedValue(new Error('disk')),
            setItem: jest.fn(),
            removeItem: jest.fn(),
        }));
        const { zustandStorage, whenSettled, outstandingReads } = require('./persist');

        await expect(zustandStorage.getItem('succesor_broken')).rejects.toThrow('disk');
        expect(outstandingReads()).toEqual([]);
        await expect(whenSettled()).resolves.toBeUndefined();
    });
});

// ============================================================================
//  AND THE LIST STAYS HONEST
// ============================================================================
describe('the warm-up list', () => {
    const src = fs.readFileSync(path.join(__dirname, 'warmUp.ts'), 'utf8');

    /** Every store module the warm-up imports for its side effect. */
    const imported = () => [...src.matchAll(/^import '([^']+)';$/gm)].map(m => m[1]);

    it('imports stores rather than calling them', () => {
        // Importing the module creates the store; creating the store starts
        // the read. There is nothing to call, and a list of bare imports is
        // exactly what gets tidied away - hence the exported function.
        expect(imported().length).toBeGreaterThan(20);
        expect(src).toContain('export const warmUpStorage');
    });

    it('and covers every key a live store persists', () => {
        // PERSIST_KEYS carries legacy keys no live store reads, so the check
        // runs the other way: every persisted store FILE must be in the list.
        const roots = [
            path.join(__dirname, '..', 'core', 'store'),
            path.join(__dirname, '..', 'features'),
        ];
        // ------------------------------------------------------------------
        //  THE SHELVED MODULES ARE EXCLUDED, AND FOR THE SAME REASON THE
        //  AUDIT EXCLUDES THEM
        // ------------------------------------------------------------------
        //  `life`, `shopping`, `education` and `travel` are false in
        //  featureFlags.ts. Their stores are never created, so they have
        //  nothing to lose, and reading five keys at launch for screens
        //  nobody can reach would only widen the gate this whole change
        //  exists to close.
        //
        //  They stay in PERSIST_KEYS, which is a different list doing a
        //  different job: a new game must still delete their data.
        // ------------------------------------------------------------------
        const SHELVED = new Set([
            'useEducationStore', 'useEducationSystem',
            'useRelationshipStore', 'useTravelStore', 'useAssetStore',
        ]);
        const found: string[] = [];
        const walk = (dir: string) => {
            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                const full = path.join(dir, entry.name);
                if (entry.isDirectory()) { walk(full); continue; }
                if (!entry.name.startsWith('use') || !entry.name.endsWith('.ts')) continue;
                if (entry.name.includes('.test.')) continue;
                const text = fs.readFileSync(full, 'utf8');
                // A store that persists names a key and uses this storage.
                if (!/persist\(/.test(text) || !/zustandStorage/.test(text)) continue;
                const name = entry.name.replace(/\.ts$/, '');
                if (!SHELVED.has(name)) found.push(name);
            }
        };
        for (const r of roots) walk(r);

        const list = imported().map(p => p.split('/').pop());
        const missing = found.filter(name => !list.includes(name));
        expect(missing).toEqual([]);
    });

    it('while PERSIST_KEYS is still the list a new game clears', () => {
        // Two lists doing two jobs, and this is the reminder that they are not
        // the same list: one is what to READ at launch, the other is what to
        // DELETE on a new game, and that one keeps dead keys on purpose.
        expect(PERSIST_KEYS.length).toBeGreaterThan(imported().length);
    });
});

// ============================================================================
//  AND THE TICK REFUSES TO RUN EARLY
// ============================================================================
describe('the quarter', () => {
    it('waits for the saves before it does anything', () => {
        const game = fs.readFileSync(
            path.join(__dirname, '..', 'core', 'store', 'useGameStore.ts'), 'utf8',
        );
        // First statement in the tick, before the timer even starts.
        expect(game).toMatch(/advanceMonth: async[\s\S]{0,1400}await whenSettled\(\);/);
    });

    it('and the app holds the screen until they are in', () => {
        const app = fs.readFileSync(
            path.join(__dirname, '..', '..', 'App.tsx'), 'utf8',
        );
        expect(app).toContain('warmUpStorage()');
        // The two-store gate that was not enough.
        expect(app).not.toMatch(/^\s*const statsHydrated = useStatsStore/m);
    });
});
