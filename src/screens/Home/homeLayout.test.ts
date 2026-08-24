// src/screens/Home/homeLayout.test.ts
//
// ============================================================================
//  THE PAGE WAS PACKED TOO TIGHTLY
// ============================================================================
//
//  Reported as "cok dar kaldi, yukari asagi biraz ayir" - the vertical rhythm
//  of the whole home screen was an 8 point gap between the brand line, the
//  header card and the widgets, with the card itself on 10 of padding and its
//  Advance button on 11.
//
//  ---------------------------------------------------------------------------
//  WHY THIS IS A TEST AND NOT JUST A COMMIT
//  ---------------------------------------------------------------------------
//  The home screen has been retuned eight times in this project and every pass
//  moved numbers in this same block. A pass that "tidied the spacing" could put
//  the 8 back without anybody noticing, because nothing here fails loudly - the
//  page just gets tight again and it takes a person looking at a phone to say
//  so.
//
//  So these rules pin the DIRECTION rather than the exact value. They pass for
//  anything roomier than what was there and fail for anything that goes back,
//  which leaves the next tuning pass free to keep going without having to
//  rewrite the test to move a number up.
//
//  ---------------------------------------------------------------------------
//  AND NOTHING ELSE CHANGED
//  ---------------------------------------------------------------------------
//  "gorsel olarak baska seye dokunma sakin, sadece boyutlar ve yerler." So the
//  last block below is about what did NOT move: colours, gradients, radii, the
//  widget cards' own size, the app tiles.
// ============================================================================

import fs from 'fs';
import path from 'path';

const read = () =>
    fs.readFileSync(path.join(__dirname, 'HomeScreen.tsx'), 'utf8');

const code = () =>
    read()
        .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*)/.test(l))
        .map(l => l.replace(/\s\/\/.*$/, ''))
        .join('\n');

/** A numeric style value, read out of a named style block. */
const styleNum = (block: string, key: string): number => {
    const src = code();
    const start = src.indexOf(`  ${block}: {`);
    expect(start).toBeGreaterThan(-1);
    const body = src.slice(start, src.indexOf('\n  },', start));
    const m = body.match(new RegExp(`\\b${key}:\\s*(-?[0-9.]+)`));
    expect(m).not.toBeNull();
    return Number(m![1]);
};

describe('the page has room to breathe', () => {
    it('between the brand, the header card and the widgets', () => {
        // Was 8, and it was the only separation those three blocks had.
        expect(styleNum('content', 'gap')).toBeGreaterThan(8);
    });

    it('and it is no longer yanked upward to find that room', () => {
        // -14 is where the space at the bottom had gone. Not zero: the brand
        // line still wants to clear the notch.
        const pull = styleNum('content', 'translateY');
        expect(pull).toBeLessThan(0);
        expect(pull).toBeGreaterThan(-14);
    });

    it('and the widgets sit a little lower without changing size', () => {
        expect(styleNum('widgetsContainer', 'marginTop')).toBeGreaterThan(0);
        // Their own size was explicitly fine. See homeWidgets.test.ts, which
        // still owns minHeight and the paddings.
        expect(styleNum('widgetCard', 'minHeight')).toBe(200);
    });
});

describe('the header card', () => {
    it('is bigger than it was', () => {
        expect(styleNum('headerCard', 'padding')).toBeGreaterThan(10);
        expect(styleNum('headerCard', 'gap')).toBeGreaterThan(8);
    });

    it('and so is everything inside it', () => {
        expect(styleNum('avatarCircle', 'width')).toBeGreaterThan(44);
        expect(styleNum('avatarInitial', 'fontSize')).toBeGreaterThan(20);
        expect(styleNum('name', 'fontSize')).toBeGreaterThan(17);
        expect(styleNum('bio', 'fontSize')).toBeGreaterThan(11);
        expect(styleNum('ageChipValue', 'fontSize')).toBeGreaterThan(15);
        expect(styleNum('ageChipLabel', 'fontSize')).toBeGreaterThan(8);
    });

    it('and the avatar stays a circle while it grows', () => {
        // A radius left behind at 22 on a 50 point circle is a squircle, and
        // it is the kind of thing that survives a resize unnoticed.
        expect(styleNum('avatarCircle', 'borderRadius') * 2)
            .toBe(styleNum('avatarCircle', 'width'));
        expect(styleNum('avatarCircle', 'height'))
            .toBe(styleNum('avatarCircle', 'width'));
    });

    it('and the chip divider still spans its chips', () => {
        // It is a hairline sized by hand rather than stretched, so growing the
        // chips around it would have left it short.
        expect(styleNum('ageChipDivider', 'height')).toBeGreaterThan(22);
    });
});

describe('the advance button', () => {
    it('is taller', () => {
        expect(styleNum('nextMonthContent', 'paddingVertical')).toBeGreaterThan(11);
    });

    it('and its label is bigger', () => {
        expect(styleNum('nextMonthText', 'fontSize')).toBeGreaterThan(11.3);
    });

    it('and its chevron grew with the label', () => {
        // A 16 point glyph beside a 13 point label reads as an afterthought.
        const m = code().match(/name="chevron-double-right" size=\{(\d+)\}/);
        expect(m).not.toBeNull();
        expect(Number(m![1])).toBeGreaterThan(16);
    });

    it('and the tracking that gives it its look survived', () => {
        // The letter spacing IS the button. Growing the size without paying
        // for the width somewhere would have wrapped the label; the tracking
        // came down a little rather than being dropped.
        expect(styleNum('nextMonthText', 'letterSpacing')).toBeGreaterThan(3);
    });
});

describe('and nothing else moved', () => {
    it('the widget cards keep the rim and the rake', () => {
        // ----------------------------------------------------------------
        //  SCOPED TO `modernCard`, AND THE FIRST VERSION WAS NOT
        // ----------------------------------------------------------------
        //  It asserted that `rgba(255,255,255,0.22)` appeared ANYWHERE in the
        //  file. Two things carry that value - the card's rim and the app
        //  tiles' icon boxes - so the probe that changed the tile passed a
        //  rule meant to protect the card. A test that cannot tell which of
        //  two identical values it is looking at is guarding neither.
        //
        //  Eight rounds of work went into this rim. This pass was about
        //  sizes and positions.
        // ----------------------------------------------------------------
        const src = code();
        expect(src).toMatch(/modernCard: \{[\s\S]{0,2000}borderColor: 'rgba\(255,255,255,0\.22\)'/);
        // Both widgets, not just the one that happened to be open.
        expect((src.match(/locations=\{\[0, 0\.3, 0\.68, 1\]\}/g) ?? []).length).toBe(2);
        // And the tiles' own boxes, which is what the loose rule was
        // accidentally matching.
        expect(src).toMatch(/appCardInner: \{[\s\S]{0,600}borderColor: 'rgba\(255,255,255,0\.22\)'/);
    });

    it('and the app tiles are exactly as they were', () => {
        const src = code();
        expect(src).toMatch(/name=\{item\.icon\} size=\{34\} color="#FFFFFF"/);
        expect(src).toMatch(/width: '19%'/);
    });

    it('and the header card keeps its own colour and radius', () => {
        const src = code();
        expect(src).toMatch(/headerCard: \{\s*\n\s*backgroundColor: 'rgba\(255,255,255,0\.04\)',\s*\n\s*borderRadius: 16,/);
    });

    it('and the nav bar clearance is untouched', () => {
        // Reducing this would have bought room by putting the app tiles under
        // the bar, which is not a spacing fix.
        expect(styleNum('content', 'paddingBottom')).toBe(110);
    });
});
