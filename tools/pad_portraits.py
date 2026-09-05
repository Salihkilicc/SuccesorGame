#!/usr/bin/env python3
"""
pad_portraits.py - give every portrait a margin, so a circle stops cutting hair.

============================================================================
 WHY, AND WHY NOT THE OBVIOUS FIX
============================================================================

 Reported as "bazi fotolar saclari kirpik", with the suggestion that the
 avatars be made bigger. Measured on 40 portraits before touching anything,
 because that suggestion does not work:

     the circle removes 12.6% of the subject on average
     for the 130 portraits whose hair reaches the top row, 30-39% of the
     top quarter

 That fraction is SCALE INVARIANT. A circle inscribed in a square always
 loses the same proportion of it, so a bigger avatar shows the same crop
 bigger. The head has to sit smaller INSIDE the circle, not the circle
 larger on the screen.

     scale   subject lost   in the top quarter
     1.00        11.9%           11.9%     today
     0.92         6.2%            5.8%
     0.86         3.3%            2.6%     <- chosen
     0.80         1.2%            0.7%
     0.71         0.0%            0.0%     the whole square fits

 0.86 keeps the hair and still leaves the face the subject rather than a
 stamp in the middle of a disc.

============================================================================
 FOUR WAYS TO FILL THE MARGIN, THREE OF THEM LOOKED WRONG
============================================================================

 The margin cannot be left transparent, so something has to go in it. All
 four were rendered and LOOKED AT rather than reasoned about:

   flat colour   Visibly a rectangle around the face. The 299 portraits have
                 215 distinct corner colours - the backgrounds are soft
                 gradients, not one tone - so no single fill can match.

   edge repeat   Fine on most, but any structure at the border becomes a
                 streak: one portrait has a dark frame in its background and
                 the padding drew it as bands across the whole margin.

   mirror        Doubles that same frame, and mirrors hair and collars into
                 recognisable duplicates. The worst of the four.

   blurred self  Looks right - and destroys the palette. Measured: a blur
                 turns 242 colours into 8,204, of which 8,179 are off the
                 ramp. That is the exact failure the whole colour pipeline
                 exists to prevent.

 So the blur happens in RAMP INDEX space instead of in colour space. Each
 pixel is turned back into its position on the 256-entry ramp, the padding
 and the smoothing happen on those indices, and the result is looked up in
 the ramp again. Every output pixel is a ramp colour by construction:
 measured at 242 colours in, 242 out, zero off the ramp.

 The portrait itself is pasted back untouched afterwards, so no pixel of the
 face is resampled, blurred or shifted.

============================================================================
 RUNNING IT
============================================================================

     python3 tools/pad_portraits.py            # do it
     python3 tools/pad_portraits.py --measure  # report, change nothing

 Idempotent: anything not 512 square is left alone, so a second run is a
 no-op. It refuses to touch a portrait carrying colours that are not on the
 ramp, because that would mean the file did not come from the batch and the
 index round trip would corrupt it.

 It overwrites in place on purpose. The originals are in git, and a portrait
 having two homes is how 297 of them were nearly lost once already.
"""

import argparse
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import palette_map as PM  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
PORTRAITS = os.path.join(HERE, '..', 'assets', 'portraits')

#  How much of the circle the original square should fill. See the table.
SCALE = 0.86
#  Every portrait in the folder was generated on this one ramp.
RAMP = 'warm'
#  Wide enough that no edge detail survives as a streak, narrow enough that
#  the background's own gradient still reads as continuing.
BLUR = 24
#  What the batch wrote. Anything else is not ours to rewrite.
SOURCE_SIZE = 512

LUT = PM.build_lut(PM.RAMPS[RAMP])
RAMP_COLOURS = set(map(tuple, LUT))

#  colour -> ramp index, as a flat table so the conversion is one lookup
#  rather than a Python loop over a quarter of a million pixels.
_REVERSE = np.zeros(1 << 24, dtype=np.uint8)
for _i in range(255, -1, -1):
    _REVERSE[(int(LUT[_i][0]) << 16) | (int(LUT[_i][1]) << 8) | int(LUT[_i][2])] = _i


def files() -> list:
    return sorted(
        f for f in os.listdir(PORTRAITS)
        if f.endswith('.png') and not f.startswith('_')
    )


def to_index(a: np.ndarray) -> np.ndarray:
    """Each pixel as its position on the ramp."""
    packed = ((a[:, :, 0].astype(np.uint32) << 16)
              | (a[:, :, 1].astype(np.uint32) << 8)
              | a[:, :, 2].astype(np.uint32))
    return _REVERSE[packed]


def target_size(h: int) -> tuple:
    t = int(round(h / SCALE))
    t += (t - h) % 2                      # keep the margin symmetric
    return t, (t - h) // 2


def pad(a: np.ndarray) -> np.ndarray:
    """
    Grow the canvas, filling the margin with a smoothed continuation.

    The smoothing is on ramp indices, so the result cannot leave the palette.
    """
    h = a.shape[0]
    t, m = target_size(h)
    idx = to_index(a)
    grown = np.pad(idx, ((m, m), (m, m)), mode='edge')
    smooth = np.asarray(
        Image.fromarray(grown, 'L').filter(ImageFilter.GaussianBlur(BLUR)),
    ).copy()
    # The portrait itself goes back exactly as it was. Only the margin is new.
    smooth[m:m + h, m:m + h] = idx
    return LUT[smooth].astype(np.uint8)


def subject_mask(a: np.ndarray) -> np.ndarray:
    """
    Which pixels are the person rather than the background.

    The corner is background by construction - a plain background is asked
    for and the head is centred - so anything far from that colour is the
    subject. Crude on purpose: it is only used to REPORT what a circle costs.
    """
    return np.abs(a.astype(int) - a[0, 0].astype(int)).sum(2) > 30


def lost_to_circle(a: np.ndarray, keep: int = None) -> tuple:
    """
    What an inscribed circle removes, as (all, top quarter) per cent.

    `keep` is the width of the ORIGINAL portrait inside a padded image. The
    margin is excluded from the count: it is background by construction, and
    counting it would report the padding as loss and hide the improvement.
    """
    h, w, _ = a.shape
    mask = subject_mask(a)
    if keep is not None and keep < h:
        m = (h - keep) // 2
        only = np.zeros_like(mask)
        only[m:m + keep, m:m + keep] = mask[m:m + keep, m:m + keep]
        mask = only
    yy, xx = np.mgrid[0:h, 0:w]
    r = ((yy - (h - 1) / 2) ** 2 + (xx - (w - 1) / 2) ** 2) ** 0.5
    outside = mask & (r > h / 2)
    q = h // 4 if keep is None else (h - keep) // 2 + keep // 4
    return (
        100 * outside.sum() / max(1, mask.sum()),
        100 * outside[:q].sum() / max(1, mask[:q].sum()),
    )


def main() -> int:
    ap = argparse.ArgumentParser(description='Pad the portraits.')
    ap.add_argument('--measure', action='store_true',
                    help='report and write nothing')
    args = ap.parse_args()

    names = files()
    if not names:
        print(f'no portraits in {PORTRAITS}', file=sys.stderr)
        return 1

    before, before_top, after, after_top = [], [], [], []
    done = skipped = 0
    refused = []

    for name in names:
        path = os.path.join(PORTRAITS, name)
        a = np.asarray(Image.open(path).convert('RGB'))

        if a.shape[0] != SOURCE_SIZE or a.shape[1] != SOURCE_SIZE:
            skipped += 1
            continue

        cols = set(map(tuple, np.unique(a.reshape(-1, 3), axis=0)))
        if cols - RAMP_COLOURS:
            # Not from the batch, or from a different ramp. The index round
            # trip would map its colours onto the wrong ones.
            refused.append(name)
            continue

        b, bt = lost_to_circle(a)
        before.append(b)
        before_top.append(bt)

        out = pad(a)
        a2, at = lost_to_circle(out, keep=SOURCE_SIZE)
        after.append(a2)
        after_top.append(at)

        if args.measure:
            continue

        got = set(map(tuple, np.unique(out.reshape(-1, 3), axis=0)))
        if got - RAMP_COLOURS:
            print(f'{name}: padding left the ramp, refusing', file=sys.stderr)
            return 1

        Image.fromarray(out).save(path)
        done += 1

    verb = 'would be lost' if args.measure else 'lost'
    print(f'{len(names)} portraits: {done} padded, {skipped} already done, '
          f'{len(refused)} refused')
    if refused:
        print('  refused (not on the ramp): ' + ', '.join(refused[:8]))
    if before:
        print(f'  before: {np.mean(before):5.1f}% of the subject {verb} to the '
              f'circle, {np.mean(before_top):5.1f}% in the top quarter')
        print(f'  after:  {np.mean(after):5.1f}%'
              f'{"":31s}{np.mean(after_top):5.1f}%')
    return 0


if __name__ == '__main__':
    sys.exit(main())
