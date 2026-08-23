// src/screens/Home/homeChrome.test.ts
//
// ============================================================================
//  WHAT THE HOME SCREEN COSTS TO DRAW
// ============================================================================
//
//  The quarter tick measures 36 to 79ms. The seconds the player waits are not
//  in the simulation at all; they are in what happens after it, and the device
//  log names both:
//
//      [PERF ASSETS] Loading image at size {2874, 2156},
//                    which is larger than the screen size {1179, 2556}
//
//      (ADVICE) View #414 of type BVLinearGradient has a shadow set but
//               cannot calculate shadow efficiently.  x8, every render
//
//  Neither is the sort of thing anybody notices reading the file. A width in a
//  URL and a missing background colour both look like nothing.
// ============================================================================

import fs from 'fs';
import path from 'path';

const src = () => fs.readFileSync(path.join(__dirname, 'HomeScreen.tsx'), 'utf8');

describe('the wallpaper', () => {
    it('is not asked for at twice the size of the screen', () => {
        // The tallest phone this game runs on is 1179 across. Everything above
        // that is downloaded, decoded and thrown away.
        for (const m of src().matchAll(/[?&]w=(\d+)/g)) {
            expect(Number(m[1])).toBeLessThanOrEqual(1600);
        }
    });

    it('and has a stable identity between renders', () => {
        // `source={{ uri }}` is a new object every render, and the quarter tick
        // re-renders this screen. Nothing downstream can tell it is the same
        // picture it already has.
        expect(src()).toContain('const WALLPAPER = {');
        expect(src()).toContain('source={WALLPAPER}');
        expect(src()).not.toMatch(/source=\{\{\s*uri:/);
    });
});

describe('the gradients that carry a shadow', () => {
    /**
     * One named style block.
     *
     * Found by name rather than by walking every block, because a lazy sweep
     * over the whole sheet swallows blocks whose neighbours contain a nested
     * object - `shadowOffset: { ... }` is enough to do it - and a parser that
     * silently returns undefined is worse than no parser.
     */
    const blockOf = (name: string): string => {
        const body = src().slice(src().indexOf('StyleSheet.create'));
        const start = body.indexOf(`\n  ${name}: {`);
        if (start < 0) throw new Error(`no style named ${name}`);
        const end = body.indexOf('\n  },', start);
        return body.slice(start, end);
    };

    it('have a background colour, so iOS can cache the shadow', () => {
        // A gradient view has no fill of its own, so the shadow cannot be
        // computed from its bounds - the whole thing is rasterised every frame
        // to find its own silhouette. The colour is the one the gradient
        // starts from, so nothing changes on screen.
        for (const name of ['avatarCircle', 'modernCard']) {
            const block = blockOf(name);
            expect(block).toContain('shadowColor');
            // `backgroundColor: 'transparent'` contains the word and is the
            // exact thing this is about, so the assertion has to be that it
            // is a COLOUR. The first version of this test passed against
            // transparent, which is the bug wearing the fix's clothes.
            expect(block).toMatch(/backgroundColor:\s*(?!'transparent')/);
            expect(block).not.toMatch(/backgroundColor:\s*'transparent'/);
        }
        // The per-tile one is inline, because the colour is the item's own.
        expect(src()).toMatch(/backgroundColor: item\.gradient\[0\]/);
    });

    it('and the one that stays uncached is the one that cannot be fixed', () => {
        // The nav bar is glass on purpose - every stop between 0.4 and 0.5
        // alpha - so a background colour would take the effect away. What is
        // left to control is the RADIUS: the blur is recomputed from the
        // alpha mask every frame and the work scales with how far it spreads.
        // It is also the only uncached shadow drawn on EVERY screen.
        const bar = fs.readFileSync(
            path.join(__dirname, '..', '..', 'navigation', 'components', 'CrystalNavBar.tsx'),
            'utf8',
        );
        const start = bar.indexOf('\n    blurContainer: {');
        const block = bar.slice(start, bar.indexOf('\n    },', start));
        const radius = Number(block.match(/shadowRadius:\s*(\d+)/)?.[1]);
        expect(radius).toBeLessThanOrEqual(10);
    });

    it('and the tiles are honest about being solid colours', () => {
        // Five of the eight are the same colour twice. Worth knowing, and
        // worth failing on if somebody adds a transparent stop: the backing
        // colour above would then be visible rather than hidden under the
        // gradient, and the tiles would change appearance.
        const text = src();
        const table = text.slice(text.indexOf('const GRADIENTS = {'));
        const stops = [...table.slice(0, table.indexOf('};')).matchAll(/'([^']+)'/g)]
            .map(m => m[1]);
        expect(stops.length).toBeGreaterThan(10);
        for (const stop of stops) expect(stop).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
});

describe('and the avatar reads', () => {
    it('because a light fill takes the dark text', () => {
        // Rule 1 in core/theme.ts lists #05A8F6 as taking BLACK. The initial
        // was white on it the whole time and the palette audit could not see
        // it, because the fill was a gradient prop rather than a token.
        const body = src().slice(src().indexOf('StyleSheet.create'));
        const start = body.indexOf('\n  avatarInitial: {');
        const avatar = body.slice(start, body.indexOf('\n  },', start));
        expect(avatar).toContain('theme.colors.onLight');
        expect(avatar).not.toContain("'#FFFFFF'");
    });
});
