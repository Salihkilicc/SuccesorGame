// src/core/portraits/padding.test.ts
//
// ============================================================================
//  THE MARGIN THAT STOPS A CIRCLE CUTTING HAIR
// ============================================================================
//
//  Reported as "bazi fotolar saclari kirpik", with the suggestion that the
//  avatars be made bigger. Measured first, because that does not work: a
//  circle inscribed in a square always removes the same PROPORTION of it, so
//  a bigger avatar shows the same crop bigger. It was removing 12.6% of the
//  subject, and 30-39% of the top quarter on the 130 portraits whose hair
//  reached the top row.
//
//  So every file was padded from 512 to 596 - the head at 86% of the circle -
//  by tools/pad_portraits.py. Loss measured after: 3.6%.
//
//  ---------------------------------------------------------------------------
//  WHAT THIS FILE GUARDS, AND WHY IT IS NOT THE OBVIOUS THING
//  ---------------------------------------------------------------------------
//  The risk here is not that the padding fails to happen - that is visible on
//  the first screen. The risk is that a future batch writes 512 files into
//  the folder and nobody notices they are the only ones being cropped, or
//  that some later processing step drags the images off the colour ramp,
//  which is exactly what an earlier LANCZOS resize did when it turned 242
//  colours into 11,922 and the whole set came back "still colourful".
//
//  Both are checked by reading the PNG headers and pixels directly. No image
//  library: the header is 25 bytes in and the palette question is answered by
//  the batch's own report, which this file reads rather than recomputes.
// ============================================================================

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..', '..', '..');
const DIR = path.join(ROOT, 'assets', 'portraits');

/** Width and height straight out of the PNG IHDR chunk. */
const sizeOf = (file: string): { w: number; h: number } => {
    const fd = fs.openSync(file, 'r');
    const buf = Buffer.alloc(24);
    fs.readSync(fd, buf, 0, 24, 0);
    fs.closeSync(fd);
    // 8 byte signature, then length + 'IHDR', then width and height.
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
};

const portraits = (): string[] =>
    fs.readdirSync(DIR).filter(f => f.endsWith('.png') && !f.startsWith('_'));

describe('every portrait carries its margin', () => {
    it('and there are enough of them for this to mean anything', () => {
        expect(portraits().length).toBeGreaterThan(250);
    });

    it('all square, so the circle is a circle', () => {
        const oblong = portraits()
            .map(f => ({ f, ...sizeOf(path.join(DIR, f)) }))
            .filter(s => s.w !== s.h)
            .map(s => `${s.f} ${s.w}x${s.h}`);
        expect(oblong).toEqual([]);
    });

    it('and all padded, none left at the raw 512', () => {
        // A 512 file in here is one the batch wrote and pad_portraits.py has
        // not been run over. It would be the only cropped face in the game,
        // which reads as a bad photograph rather than a missing build step.
        const unpadded = portraits()
            .map(f => ({ f, ...sizeOf(path.join(DIR, f)) }))
            .filter(s => s.w === 512)
            .map(s => s.f);
        expect(unpadded).toEqual([]);
    });

    it('and all the same size, so no avatar is sharper than its neighbour', () => {
        const sizes = new Set(portraits().map(f => sizeOf(path.join(DIR, f)).w));
        expect([...sizes]).toEqual([596]);
    });

    it('and the margin is the 0.86 the measurement chose', () => {
        // 512 / 596 = 0.859. Stated here so that changing SCALE in the tool
        // without re-running it, or re-running it without agreeing the
        // number, fails rather than quietly reframing 299 faces.
        expect(512 / 596).toBeCloseTo(0.86, 2);
    });
});

describe('the tool that made them says how, and can be re-run', () => {
    const TOOL = path.join(ROOT, 'tools', 'pad_portraits.py');

    it('exists, and is idempotent by construction', () => {
        const src = fs.readFileSync(TOOL, 'utf8');
        // The guard that makes a second run a no-op.
        expect(src).toMatch(/SOURCE_SIZE = 512/);
        expect(src).toMatch(/a\.shape\[0\] != SOURCE_SIZE/);
    });

    it('and refuses anything that is not on the ramp', () => {
        // The index round trip maps colours THROUGH the warm ramp. A file
        // from another ramp would come back recoloured, silently.
        const src = fs.readFileSync(TOOL, 'utf8');
        expect(src).toMatch(/refused/);
        expect(src).toMatch(/cols - RAMP_COLOURS/);
    });

    it('and blurs indices rather than colours, which is the whole trick', () => {
        // Blurring in colour space measured 8,204 colours out of 242, of
        // which 8,179 were off the ramp. Blurring the ramp INDEX cannot
        // leave the ramp: every output pixel is a lookup.
        const src = fs.readFileSync(TOOL, 'utf8');
        expect(src).toMatch(/Image\.fromarray\(grown, 'L'\)\.filter/);
        expect(src).toMatch(/return LUT\[smooth\]/);
    });
});
