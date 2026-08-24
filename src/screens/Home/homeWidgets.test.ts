// src/screens/Home/homeWidgets.test.ts
//
// ============================================================================
//  THE WHITE BAND DOWN EACH EDGE OF THE TWO HOME CARDS
// ============================================================================
//
//  Both widgets are LinearGradients, and their four stops were
//
//      rgba(255,255,255,0.48) -> #1C242C -> #1C242C -> #CFD0D2
//
//  laid out horizontally at 0, 0.2, 0.8 and 1. Dark in the middle, a bright
//  band down the LEFT edge and a light grey one down the RIGHT. Reported as
//  "beyaz icindeki efekt".
//
//  Not only a smear. The labels are left aligned and the figures are right
//  aligned, so white text was landing on a near-white ground at both ends of
//  every row.
//
//  ---------------------------------------------------------------------------
//  AND THE AUDIT CANNOT SEE THIS
//  ---------------------------------------------------------------------------
//  scripts/reachability.js has a "Text unreadable on the ground" rule and it
//  reports nine failures, none of them here. It reads `backgroundColor` off a
//  stylesheet, and a gradient's colours are a PROP. So the worst contrast on
//  the busiest screen in the game sat in the one place the checker
//  structurally cannot look, which is why this file exists as well.
//
//  ---------------------------------------------------------------------------
//  WHAT THIS DELIBERATELY DOES NOT DO
//  ---------------------------------------------------------------------------
//  The gradient stays, the radius stays, the shadow stays, the app tiles are
//  untouched. The ask was to fix the bands and the size, and a redesign
//  smuggled in beside a fix is a change nobody agreed to.
// ============================================================================

import fs from 'fs';
import path from 'path';

const read = () => fs.readFileSync(path.join(__dirname, 'HomeScreen.tsx'), 'utf8');

const code = () => read()
    .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '')
    .split('\n')
    .filter(l => !/^\s*(\/\/|\*)/.test(l))
    .map(l => l.replace(/\s\/\/.*$/, ''))
    .join('\n');

describe('the two widget cards', () => {
    it('have no light stop left in them', () => {
        const src = code();
        expect(src).not.toMatch(/colors=\{\['rgba\(255,255,255,0\.48\)'/);
        expect(src).not.toMatch(/'#1C242C', '#1C242C', '#CFD0D2'/);
    });

    it('and both of them, not just the one that was open', () => {
        // Two identical gradients, twenty lines apart. Fixing one and
        // reading the other as done is how the casino's 700 survived a
        // whole commit.
        const src = code();
        const dark = src.match(/colors=\{\['#1C242C', '#1C242C', '#1C242C', '#1C242C'\]\}/g) ?? [];
        expect(dark).toHaveLength(2);
    });

    it('and are shorter than they were', () => {
        // 32 of padding on a 250 tall card, for four rows of text. The pair
        // of them pushed the app icons to the bottom edge of the screen.
        const src = code();
        expect(src).not.toMatch(/widgetCard: \{[\s\S]{0,400}paddingVertical: 32/);
        expect(src).not.toMatch(/widgetCard: \{[\s\S]{0,400}minHeight: 250/);
        expect(src).toMatch(/widgetCard: \{[\s\S]{0,400}minHeight: 200/);
        expect(src).not.toMatch(/statusCardAdjuster: \{[\s\S]{0,200}paddingTop: 30/);
    });
});

describe('and nothing else moved', () => {
    it('the cards are still gradients', () => {
        // Replacing them with plain views would have been the tidier code
        // and it is not what was asked for.
        const src = code();
        expect(src).toMatch(/<LinearGradient[\s\S]{0,300}styles\.widgetCard, styles\.modernCard/);
    });

    it('and modernCard keeps its own look', () => {
        const src = code();
        expect(src).toMatch(/modernCard: \{[\s\S]{0,600}borderRadius: 33/);
        expect(src).toMatch(/modernCard: \{[\s\S]{0,600}backgroundColor: theme\.colors\.background/);
    });

    it('and the app tiles are exactly as they were', () => {
        // They were changed once and put back. The report was about the
        // cards; the tiles are a separate question and not this one.
        const src = code();
        expect(src).toMatch(/name=\{item\.icon\} size=\{34\} color="#FFFFFF"/);
        expect(src).not.toMatch(/glyphOn/);
    });
});

describe('the note on modernCard', () => {
    it('does not still claim the first stop is translucent', () => {
        // It was true and it is not any more. A stale comment is worse than
        // no comment, because the next reader trusts it.
        const raw = read();
        const note = raw.slice(raw.indexOf('modernCard: {'), raw.indexOf('modernCard: {') + 1400);
        expect(note).not.toMatch(/Only the FIRST gradient stop is translucent/);
    });
});
