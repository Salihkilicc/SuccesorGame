// src/core/ads/callSites.test.ts
//
// ============================================================================
//  A POLICY NOTHING CALLS IS THE SAME AS NO POLICY
// ============================================================================
//
//  policy.test.ts proves the rules are right. gate.test.ts proves the door
//  behaves. Both would stay green forever with the four triggers never wired
//  to anything, which is this repository's signature failure stated exactly:
//  correct data that nothing reads.
//
//  So this reads the four files and checks each one actually knocks. It is the
//  same shape as the audit in scripts/reachability.js and for the same reason.
//
//  ---------------------------------------------------------------------------
//  WHY IT MATCHES TEXT RATHER THAN RENDERING THE SCREENS
//  ---------------------------------------------------------------------------
//  Three of the four are React screens with navigation, animation timers and
//  five stores behind them. Mounting them to observe one side effect would be
//  a large, slow, flaky test of the wrong thing: the claim here is not "an ad
//  appears", it is "this file asks the gate". The first belongs on a device,
//  the second belongs in the source.
// ============================================================================

import fs from 'fs';
import path from 'path';

import type { AdTrigger } from './policy';

const ROOT = path.join(__dirname, '..', '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/** Source with `//` comments removed, so prose about a call is not a call. */
const code = (rel: string): string =>
    read(rel)
        .split('\n')
        .filter(line => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
        .join('\n');

/**
 * The four triggers and the file that is supposed to fire each one.
 *
 * Typed as AdTrigger so that renaming one in policy.ts fails to compile here
 * rather than silently leaving this test checking for a string nothing sends.
 */
const SITES: ReadonlyArray<{ trigger: AdTrigger; file: string; what: string }> = [
    {
        trigger: 'quarterAdvanced',
        file: 'src/screens/Home/HomeScreen.tsx',
        what: 'the quarter button',
    },
    {
        trigger: 'leftPokerTable',
        file: 'src/features/casino/screens/PokerGameScreen.tsx',
        what: 'standing up from the poker table',
    },
    {
        trigger: 'casinoTick',
        file: 'src/core/ads/useCasinoAdClock.ts',
        what: 'the casino clock',
    },
    {
        trigger: 'datePressed',
        file: 'src/features/love/components/useEncounterSystem.ts',
        what: 'the end of a date',
    },
];

describe('every trigger has a caller', () => {
    it.each(SITES)('$what fires $trigger', ({ trigger, file }) => {
        const src = code(file);
        expect([file, src.includes(`adGate('${trigger}')`) || src.includes(`adGate('${trigger}',`)])
            .toEqual([file, true]);
    });

    it.each(SITES)('$what imports the gate, so the call resolves', ({ file }) => {
        expect(code(file)).toMatch(/import\s*\{[^}]*adGate[^}]*\}\s*from/);
    });

    it('and the casino clock is actually mounted somewhere', () => {
        // The clock is the one trigger whose caller is itself a hook. A hook
        // nobody calls is the most invisible kind of dead code: it type
        // checks, it tests, and it never runs.
        const casino = code('src/features/casino/screens/CasinoScreen.tsx');
        expect(casino).toContain('useCasinoAdClock()');
        expect(casino).toMatch(/import\s*\{[^}]*useCasinoAdClock[^}]*\}\s*from/);
    });
});

describe('and the casino tap counter is wired to all four games', () => {
    // ------------------------------------------------------------------
    //  OTHERWISE HALF OF WHAT HE ASKED FOR IS DEAD ARITHMETIC
    // ------------------------------------------------------------------
    //  "eger cok tiklanirsa bu dussun." The shrinking interval is a real
    //  rule with real tests, and if no game ever counted a tap then
    //  `casinoTapsSinceAd` would be zero forever, `casinoIntervalMs` would
    //  return five minutes forever, and every one of those tests would
    //  still pass.
    // ------------------------------------------------------------------
    const GAMES = [
        'src/features/casino/logic/useSlotsLogic.ts',
        'src/features/casino/logic/useRouletteLogic.ts',
        'src/features/casino/logic/useSixHandedPoker.ts',
        'src/features/casino/logic/useBlackjackLogic.ts',
    ];

    it.each(GAMES)('%s counts the action', file => {
        expect([file, code(file).includes('countCasinoTap()')]).toEqual([file, true]);
    });
});

describe('and nothing outside the gate touches the policy or the sdk', () => {
    it('no screen imports policy.ts directly', () => {
        // ------------------------------------------------------------------
        //  "SADECE bu dosyadan yapilmalidir"
        // ------------------------------------------------------------------
        //  The value of one door is that it is the only one. A screen that
        //  imported `decide` could take its own decision, with its own copy
        //  of the state, and the purchase would be honoured everywhere except
        //  in that one place - which is precisely the bug nobody finds,
        //  because three of the four triggers would behave perfectly.
        // ------------------------------------------------------------------
        const walk = (dir: string, out: string[] = []): string[] => {
            for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
                const full = path.join(dir, e.name);
                if (e.isDirectory()) walk(full, out);
                else if (/\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) out.push(full);
            }
            return out;
        };

        const offenders = walk(path.join(ROOT, 'src'))
            .map(f => path.relative(ROOT, f))
            // The gate and the policy's own neighbours are allowed to.
            .filter(f => !f.startsWith('src/core/ads/'))
            .filter(f => /from\s+['"][^'"]*ads\/policy['"]/.test(read(f)));

        expect(offenders).toEqual([]);
    });
});
