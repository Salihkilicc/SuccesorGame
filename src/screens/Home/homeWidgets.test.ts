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
    // The gradient's own fingerprint. There are four other LinearGradients on
    // this screen and none of them uses these stops, so this is how the two
    // cards are picked out without counting every gradient in the file.
    const CARD_STOPS = /locations=\{\[0, 0\.3, 0\.68, 1\]\}/g;

    it('are lit by their RIM, which is a different technique', () => {
        // ----------------------------------------------------------------
        //  FOUR ROUNDS OF MOVING THE SAME NUMBERS
        // ----------------------------------------------------------------
        //  Direction, alpha, ramp, plateau - and it never landed. A wash
        //  behind the text can only ever be a paler rectangle, however wide
        //  it is, which is why widening it kept not helping.
        //
        //  A card looks lit BY ITS EDGE. The rim is on `modernCard` and it
        //  is the change; the gradient is now the supporting half.
        // ----------------------------------------------------------------
        const src = code();
        expect(src).toMatch(/modernCard: \{[\s\S]{0,2000}borderWidth: 1,\s*\n\s*borderColor: 'rgba\(255,255,255,0\.\d+\)'/);
        expect(src).not.toMatch(/modernCard: \{[\s\S]{0,2000}borderWidth: 0,/);
    });

    it('and raked corner to corner rather than side to side', () => {
        // A diagonal reads as light falling on a surface. Left-to-right
        // symmetry reads as a painted stripe, which is what every previous
        // attempt was - including the one I argued for.
        const src = code();
        const cards = src.match(/<LinearGradient[\s\S]{0,700}?locations=\{\[0, 0\.3, 0\.68, 1\]\}/g) ?? [];
        expect(cards).toHaveLength(2);
        for (const c of cards) {
            expect(c).toMatch(/start=\{\{ x: 0, y: 0 \}\}/);
            expect(c).toMatch(/end=\{\{ x: 1, y: 1 \}\}/);
        }
    });

    it('and the sheen is bright at the corner and gone by two thirds', () => {
        const src = code();
        expect(src).toMatch(/'rgba\(255,255,255,0\.16\)',\s*\n\s*'rgba\(255,255,255,0\.06\)',/);
        // Nowhere near the 48% that made a near-white ground and broke the
        // text. Scoped to a gradient STOP: the same rgba is a chevron colour
        // and a label colour elsewhere in this file.
        expect(src).not.toMatch(/colors=\{\['rgba\(255,255,255,0\.48\)'/);
        expect(src).not.toMatch(/'#1C242C', '#1C242C', '#CFD0D2'/);
    });

    it('and both of them, not just the one that was open', () => {
        // Two identical gradients, forty lines apart. Fixing one and reading
        // the other as done is how the casino's 700 survived a whole commit.
        expect(code().match(CARD_STOPS) ?? []).toHaveLength(2);
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

describe('and it covers the card, which was the doubt', () => {
    it('because the gradient IS the card rather than a layer inside it', () => {
        // "Kenarlari birakiyor mu, tam kaplamiyor mu." It carries
        // `styles.card` itself and is `flex: 1`, so there is no inset layer
        // and nothing between it and the corners - it runs edge to edge.
        // What was missing was never coverage; the lit part was too narrow
        // and too faint to read as an effect.
        const src = code();
        expect(src).toMatch(/<LinearGradient[\s\S]{0,600}style=\{\[styles\.card, styles\.widgetCard, styles\.modernCard/);
        expect(src).toMatch(/widgetCard: \{\s*\n\s*flex: 1,/);
    });

    it('and it spans corner to corner rather than part of the way', () => {
        // A gradient from 0.1 to 0.9 would leave the very edges flat and is
        // exactly the shape the doubt describes. And the rim, which is the
        // effect now, is a border - it cannot miss an edge by construction.
        const src = code();
        const stops = (src.match(/locations=\{\[0, 0\.3, 0\.68, 1\]\}/)?.[0] ?? '');
        expect(stops).toBeTruthy();
        expect(src).toMatch(/modernCard: \{[\s\S]{0,2000}borderColor:/);
    });
});

describe('and nothing else moved', () => {
    it('the cards are still gradients', () => {
        // Replacing them with plain views would have been the tidier code
        // and it is not what was asked for.
        const src = code();
        expect(src).toMatch(/<LinearGradient[\s\S]{0,600}styles\.widgetCard, styles\.modernCard/);
    });

    it('and modernCard keeps the radius, which is the look', () => {
        expect(code()).toMatch(/modernCard: \{[\s\S]{0,1400}borderRadius: 33/);
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


// ============================================================================
//  AND THE HALO THAT WAS LEFT WHEN THE BANDS CAME OFF
// ============================================================================
//
//  Taking the white out was right and it exposed three things underneath that
//  had only ever worked because the bands were there. Reported the second
//  time as "beyaz kisim arkada kalmis, gri kisim biraz fazla buyuk" - the
//  card had become the same colour as the screen and all that was left of it
//  was a light grey glow.
// ============================================================================

describe('what the bands were hiding', () => {
    it('is that the card is dark, and needs the sheen to have an edge', () => {
        // The colour was never the fault. The card is the dark one - "kart
        // siyah olmali" - and it reads against the WALLPAPER rather than a
        // flat ground. What went wrong was removing the sheen and leaving it
        // with no edge at all; painting it grey was the wrong repair and it
        // was reverted.
        const src = code();
        expect(src).toMatch(/modernCard: \{[\s\S]{0,1600}backgroundColor: '#1C242C'/);
        expect(src).toMatch(/colors=\{\[\s*\n\s*'rgba\(255,255,255,0\.16\)',/);
    });

    it('and the sheen it needs is bright enough to BE an edge', () => {
        // ----------------------------------------------------------------
        //  A BAND RATHER THAN A DIGIT
        // ----------------------------------------------------------------
        //  This used to forbid `0.1x` by regex, which was only ever right
        //  while the answer happened to be 0.20 - the next nudge downwards
        //  would have failed a rule that has nothing to say about it. The
        //  floor is what matters: bright enough to draw an edge on a dark
        //  card, dim enough that white text on it still clears 4.5:1.
        // ----------------------------------------------------------------
        const src = code();
        const alpha = Number(
            src.match(/colors=\{\[\s*\n\s*'rgba\(255,255,255,([0-9.]+)\)',\s*\n\s*'rgba/)?.[1],
        );
        expect(alpha).toBeGreaterThanOrEqual(0.10);
        expect(alpha).toBeLessThanOrEqual(0.24);
    });

    it('and that the shadow behind it was light grey', () => {
        // #CFD0D2 at radius 20 behind a card that had just gone invisible.
        // That halo WAS the "beyaz kisim arkada".
        const src = code();
        expect(src).not.toMatch(/modernCard: \{[\s\S]{0,1400}shadowColor: '#CFD0D2'/);
        expect(src).not.toMatch(/modernCard: \{[\s\S]{0,1400}shadowRadius: 20/);
    });

    it('and that it overhung its own column', () => {
        // -12 and -8 pulled it wider and taller than the slot it sits in.
        const src = code();
        expect(src).not.toMatch(/modernCard: \{[\s\S]{0,1400}marginHorizontal: -12/);
        expect(src).not.toMatch(/modernCard: \{[\s\S]{0,1400}marginVertical: -8/);
    });
});
