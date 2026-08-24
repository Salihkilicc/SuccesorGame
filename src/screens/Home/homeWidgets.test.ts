// src/screens/Home/homeWidgets.test.ts
//
// ============================================================================
//  THE TWO CARDS THAT HAD A WHITE STRIPE DOWN EACH EDGE
// ============================================================================
//
//  Both widgets on the home screen were LinearGradients running
//
//      rgba(255,255,255,0.48) -> #1C242C -> #1C242C -> #CFD0D2
//
//  horizontally, with the stops at 0, 0.2, 0.8 and 1. So each card was dark
//  in the middle with a bright band down the LEFT edge and a light grey one
//  down the RIGHT. Reported as "beyaz icindeki efekt".
//
//  ---------------------------------------------------------------------------
//  AND THE TEXT WAS SITTING ON THE BANDS
//  ---------------------------------------------------------------------------
//  Which is the part that makes this a rule rather than a preference. The
//  labels are left aligned and the figures are right aligned, so white text
//  was landing on a near-white ground at both ends of every row - the one
//  rule this project does not bend.
//
//  ---------------------------------------------------------------------------
//  THE AUDIT COULD NOT SEE IT
//  ---------------------------------------------------------------------------
//  scripts/reachability.js has a "Text unreadable on the ground" rule and it
//  reports nine of them, none of these. It reads `backgroundColor`, and a
//  gradient's colours are not a background colour - they are a prop. So the
//  worst contrast on the busiest screen in the game was in the one place the
//  checker structurally cannot look.
//
//  That is why this file exists as well as the audit.
// ============================================================================

import fs from 'fs';
import path from 'path';

import { theme, glyphOn } from '../../core/theme';

const read = () => fs.readFileSync(path.join(__dirname, 'HomeScreen.tsx'), 'utf8');

const code = () => read()
    .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '')
    .split('\n')
    .filter(l => !/^\s*(\/\/|\*)/.test(l))
    .map(l => l.replace(/\s\/\/.*$/, ''))
    .join('\n');

describe('the overview and status widgets', () => {
    it('are cards rather than gradients', () => {
        const src = code();
        expect(src).toMatch(/<View style=\{\[styles\.card, styles\.widgetCard, styles\.modernCard\]\}>/);
        expect(src).toMatch(/styles\.statusCardAdjuster\]\}>/);
    });

    it('and no light stop is left anywhere on the screen', () => {
        // The exact gradient, and the shape of it: a stop at or above 48%
        // white, or the #CFD0D2 fill tone, inside a colours array.
        const src = code();
        expect(src).not.toMatch(/colors=\{\[\s*'rgba\(255,255,255,0\.48\)'/);
        // The four-stop shape the two widgets used. The app tiles further up
        // the file also carry #CFD0D2 and are a different question - see the
        // glyph block below, which is how they got fixed.
        expect(src).not.toMatch(/'#1C242C', '#1C242C', '#CFD0D2'/);
    });

    it('and they sit ON the ground rather than being it', () => {
        // `modernCard` was `theme.colors.background`, the same colour as the
        // screen, so the card was not a card - it read as one only because
        // of a light grey shadow, which is what made the pair look like two
        // heavy blocks.
        const src = code();
        expect(src).toMatch(/modernCard: \{[\s\S]{0,400}backgroundColor: theme\.colors\.surface/);
        expect(src).not.toMatch(/modernCard: \{[\s\S]{0,400}backgroundColor: theme\.colors\.background/);
    });
});

describe('and they are smaller', () => {
    it('because thirty two of padding on a two hundred and fifty tall card is a lot for four rows', () => {
        const src = code();
        expect(src).toMatch(/widgetCard: \{[\s\S]{0,600}minHeight: 1\d\d,/);
        expect(src).not.toMatch(/widgetCard: \{[\s\S]{0,600}minHeight: 250/);
        expect(src).not.toMatch(/widgetCard: \{[\s\S]{0,600}paddingVertical: 32/);
    });

    it('and the status card no longer has its own bigger spacing', () => {
        // 30 of top padding and 24 of gap against the card beside it, which
        // is where the two of them stopped looking like a pair.
        const src = code();
        expect(src).not.toMatch(/statusCardAdjuster: \{[\s\S]{0,300}paddingTop: 30/);
        expect(src).not.toMatch(/statusCardAdjuster: \{[\s\S]{0,300}spacing\.xl/);
    });

    it('and the padding is not being set twice in opposite directions', () => {
        // `modernCard` had `padding: 30` with negative margins pulling it
        // back out again. Two numbers doing one job, disagreeing.
        const src = code();
        expect(src).not.toMatch(/modernCard: \{[\s\S]{0,500}marginHorizontal: -12/);
        expect(src).not.toMatch(/modernCard: \{[\s\S]{0,500}padding: 30/);
    });
});

describe('the note on modernCard', () => {
    it('describes what the card is now rather than what it was', () => {
        // It explained how to give a LinearGradient a shadow iOS could
        // cache. There is no gradient, so there is no problem - and a stale
        // comment is worse than none, because the next reader trusts it.
        const raw = read();
        const note = raw.slice(raw.indexOf('modernCard: {'), raw.indexOf('modernCard: {') + 1400);
        expect(note).not.toMatch(/BVLinearGradient/);
        expect(note).toMatch(/surface/);
    });
});


describe('the app tiles', () => {
    it('choose a glyph colour from the tile rather than always white', () => {
        // Mail and News are #CFD0D2 fills and the icon was hardcoded to
        // #FFFFFF: about 1.4:1 against a floor of 3. Visible in the
        // screenshot as two washed out tiles beside two legible ones.
        const src = code();
        expect(src).toMatch(/color=\{glyphOn\(item\.gradient\[0\]\)\}/);
        // The quotes matter: without them this passes against the very
        // line it is meant to forbid.
        expect(src).not.toMatch(/color="#FFFFFF" style=\{styles\.appIconVector\}/);
    });
});


describe('and the rule they now ask', () => {
    it('gives black on a light fill and white on a dark one', () => {
        expect(glyphOn('#CFD0D2')).toBe(theme.colors.onLight);
        expect(glyphOn('#FFFFFF')).toBe(theme.colors.onLight);
        expect(glyphOn('#1C242C')).toBe(theme.colors.textPrimary);
        expect(glyphOn('#000000')).toBe(theme.colors.textPrimary);
    });

    it('and agrees with the palette rather than coincidentally matching it', () => {
        // core/theme.ts says `primaryText: '#000000'` for the primary blue,
        // by hand. The function reaches the same answer from the colour.
        expect(glyphOn(theme.colors.primary)).toBe(theme.colors.primaryText);
    });

    it('and does not throw on rubbish', () => {
        for (const bad of ['', 'blue', '#fff', undefined as any, null as any]) {
            expect(typeof glyphOn(bad)).toBe('string');
        }
    });
});
