#!/usr/bin/env python3
"""
palette_map.py - force generated portraits into the game's own palette.

============================================================================
 WHY THIS EXISTS RATHER THAN A PROMPT
============================================================================

 A diffusion model understands "blue". It does not understand #05A8F6. Ask
 sixty portraits for the same blue and you get sixty different blues, and
 the drift is worst exactly where it shows: side by side in a list.

 So the colour is not asked for, it is APPLIED. The model is asked only for
 light and form; this maps the resulting luminance onto a ramp built from
 the real theme hexes. The output is the palette by construction, not by
 luck, and portrait number sixty matches portrait number one.

 The ramp is read from src/core/theme.ts, so it cannot drift from the app.

============================================================================
 USAGE
============================================================================

     python3 tools/palette_map.py IN_DIR OUT_DIR
     python3 tools/palette_map.py IN_DIR OUT_DIR --ramp warm
     python3 tools/palette_map.py one.png out/ --size 512 --circle

 --ramp    which ramp to use (see RAMPS below). Default: cool.
 --size    square output size in pixels. Default 512.
 --circle  also write a circle cropped copy, since every avatar in the app
           is a circle and a square that looks fine can lose a chin to it.
 --strip   write the ramp itself as a PNG, for feeding a ComfyUI gradient
           map node instead of using this script.
 --preview write a sheet showing the portrait at the sizes the app really
           renders it at. This is the only test that decides whether a
           style works, because 46 pixels is where the answer lives.
 --autocrop find the head against the flat background and crop to it, so
           the framing stops depending on what the model felt like doing.
"""

import argparse
import os
import sys

import numpy as np
from PIL import Image

# ---------------------------------------------------------------------------
#  THE PALETTE, READ FROM THE APP RATHER THAN COPIED OUT OF IT
# ---------------------------------------------------------------------------
#  Copying hexes into a second file is how two palettes start existing. The
#  theme is the source; if a hex changes there, the next batch follows.
#
#  Deliberately NOT included: positive #4ADE80 and negative #FF8A8A. Those
#  two are reserved for profit and loss in this game and mean nothing else.
#  A face carrying either would break that rule on every screen it appears.
# ---------------------------------------------------------------------------

THEME = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'core', 'theme.ts',
)

FALLBACK = {
    'ink': '#1C242C',
    'blueDeep': '#0C6C9C',
    'blue': '#05A8F6',
    'blueLight': '#7DD3FC',
    'grey': '#8C9494',
    'greyLight': '#CFD0D2',
    'orange': '#FFA94D',
    'violet': '#C4B5FD',
}


def read_theme() -> dict:
    """Pull the named hexes out of theme.ts. Falls back if the file moved."""
    try:
        import re
        src = open(THEME, encoding='utf8').read()
        found = {}
        for name in FALLBACK:
            m = re.search(rf"\b{name}:\s*'(#[0-9A-Fa-f]{{6}})'", src)
            if m:
                found[name] = m.group(1)
        missing = [k for k in FALLBACK if k not in found]
        if missing:
            print(f'  note: not found in theme.ts, using fallback: {", ".join(missing)}')
        return {**FALLBACK, **found}
    except OSError:
        print('  note: theme.ts not readable, using the built in palette')
        return dict(FALLBACK)


C = read_theme()

# ---------------------------------------------------------------------------
#  THE RAMPS
# ---------------------------------------------------------------------------
#  Each is a list of (position 0..1, hex). Position 0 is pure shadow, 1 is
#  pure highlight. Three or four stops is enough; more just muddies it.
#
#  Why several: sixty identical portraits are as flat as one. The cast can
#  be split by ramp - your own family cool, rivals steel, the board warm -
#  and every ramp is still built only from theme colours, so nothing can
#  land outside the game's world.
# ---------------------------------------------------------------------------

RAMPS = {
    # The default. The game's own blue, shadow to highlight.
    'cool': [(0.00, C['ink']), (0.55, C['blueDeep']), (1.00, C['blueLight'])],

    # Brighter mid. For faces that need to carry a screen on their own.
    'bright': [(0.00, C['ink']), (0.50, C['blue']), (1.00, C['blueLight'])],

    # Brand orange as the light source, blue in shadow. Reads as authority.
    'warm': [(0.00, C['ink']), (0.55, C['blueDeep']), (1.00, C['orange'])],

    # Neutral, no allegiance. Strangers at the poker table.
    'steel': [(0.00, C['ink']), (0.55, C['grey']), (1.00, C['greyLight'])],

    # The research violet. Scientists, the laboratory, anything clinical.
    'violet': [(0.00, C['ink']), (0.55, C['blueDeep']), (1.00, C['violet'])],
}


def hex_to_rgb(h: str) -> tuple:
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def build_lut(stops: list) -> np.ndarray:
    """A 256 x 3 lookup table, linearly interpolated between the stops."""
    stops = sorted(stops, key=lambda s: s[0])
    xs = np.array([s[0] for s in stops]) * 255.0
    cols = np.array([hex_to_rgb(s[1]) for s in stops], dtype=float)
    grid = np.arange(256, dtype=float)
    return np.stack(
        [np.interp(grid, xs, cols[:, ch]) for ch in range(3)], axis=1,
    ).astype(np.uint8)


def luminance(img: Image.Image) -> np.ndarray:
    """
    Perceptual luminance, not the average of the channels.

    A plain mean turns a saturated blue and a saturated orange into the same
    grey, so a face lit from one side flattens out. Rec. 709 keeps the
    modelling that the whole portrait depends on.
    """
    a = np.asarray(img.convert('RGB'), dtype=float)
    lum = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]

    # Stretch to the full range first. A model that returned a washed out
    # 40..200 would otherwise never touch either end of the ramp, and every
    # portrait would come out muddy in the middle.
    lo, hi = np.percentile(lum, 1), np.percentile(lum, 99)
    if hi - lo < 1e-6:
        return np.zeros_like(lum, dtype=np.uint8)
    return np.clip((lum - lo) / (hi - lo) * 255.0, 0, 255).astype(np.uint8)


def circle_crop(img: Image.Image) -> Image.Image:
    """
    What the app actually shows.

    Every avatar in this project is a circle, and a circle keeps about 78%
    of the square. Worth writing out so a chin lost to the mask is found
    now rather than on the poker table.
    """
    size = img.size[0]
    mask = Image.new('L', (size * 4, size * 4), 0)
    from PIL import ImageDraw
    ImageDraw.Draw(mask).ellipse((0, 0, size * 4, size * 4), fill=255)
    mask = mask.resize((size, size), Image.LANCZOS)
    out = img.convert('RGBA')
    out.putalpha(mask)
    return out


# ---------------------------------------------------------------------------
#  CROP TO THE HEAD, BECAUSE THE PROMPT WILL NOT DO IT
# ---------------------------------------------------------------------------
#  Asked for repeatedly and never delivered: "the head is too small and too
#  far away". Every prompt fix moved it a little and none of them held. The
#  model decides framing, the model is not reliable about it, and 153
#  portraits is far too many to inspect one at a time.
#
#  But these images have a property worth using: a plain solid background,
#  because the prompt asks for one and the palette map flattens it further.
#  That makes the subject separable without any face detection at all.
#
#      1. the background colour is whatever the corners agree on
#      2. the subject is every pixel far enough from it
#      3. walking down from the top, the subject's width creeps through the
#         head and then JUMPS at the shoulders
#      4. so the head is everything above that jump
#
#  Deterministic, no model, no extra dependency, and it fails safe: if no
#  shoulder line is found the frame is returned untouched rather than
#  guessed at.
# ---------------------------------------------------------------------------

#  The floor under the subject threshold. The threshold itself is chosen per
#  image (see `subject_mask`); this only stops a picture of nothing from
#  deciding that its own sensor noise is a person.
#
#  A FIXED THRESHOLD WAS WRONG AND THE TEST CAUGHT IT. At a flat 34, a
#  portrait with dark hair on the ink coloured ground lost the hair
#  entirely: the two differ by 27, so the crown read as background, the
#  "top of the head" was found at the forehead, and the crop came back
#  160 pixels tall on a 1024 image. Three of four cases passed, which is
#  exactly the kind of nearly right that ships.
SUBJECT_FLOOR = 12


def subject_mask(a: np.ndarray, bg: np.ndarray) -> np.ndarray:
    """
    Subject versus background, thresholded per image rather than by a constant.

    Distance from the background colour is strongly bimodal in these
    portraits - there is a person and there is a flat backdrop - so Otsu's
    method finds the split without being told where it is. That holds for a
    dark head on a dark ground and for a light head on a light one, which a
    single number never will.
    """
    dist = np.abs(a - bg).sum(axis=2)
    hist = np.bincount(np.clip(dist, 0, 765).ravel().astype(np.int64), minlength=766)
    total = dist.size
    w0 = np.cumsum(hist)
    w1 = total - w0
    levels = np.arange(766)
    csum = np.cumsum(hist * levels)
    grand = csum[-1]
    with np.errstate(invalid='ignore', divide='ignore'):
        m0 = csum / w0
        m1 = (grand - csum) / w1
        between = w0 * w1 * (m0 - m1) ** 2
    between[~np.isfinite(between)] = 0
    thresh = max(SUBJECT_FLOOR, int(np.argmax(between)))
    return dist > thresh

#  The width jump that means shoulders. Measured against the median width of
#  the head rows above it. A head is roughly one unit wide and a pair of
#  shoulders is roughly two, so 1.55 sits clear of both.
SHOULDER_RATIO = 1.55

#  Breathing room around the head, as a share of its height. Without this the
#  circle mask shaves the top of the hair and the point of the chin.
HEAD_MARGIN = 0.30


def head_box(img: Image.Image):
    """The square to crop to, or None if the picture will not give one up."""
    a = np.asarray(img.convert('RGB'), dtype=np.int16)
    h, w, _ = a.shape

    # The background is what the four corners agree on. A corner patch rather
    # than a single pixel, so one stray dark speck cannot define it.
    k = max(4, min(h, w) // 32)
    corners = np.concatenate([
        a[:k, :k].reshape(-1, 3), a[:k, -k:].reshape(-1, 3),
        a[-k:, :k].reshape(-1, 3), a[-k:, -k:].reshape(-1, 3),
    ])
    bg = np.median(corners, axis=0)

    subject = subject_mask(a, bg)
    widths = subject.sum(axis=1)

    rows = np.flatnonzero(widths > w * 0.02)
    if rows.size == 0:
        return None
    top = int(rows[0])

    # Walk down from the crown looking for the shoulders. Start measuring
    # after a little of the head so the first few thin rows of hair do not
    # set the baseline.
    #
    # TWO GUARDS, BOTH PUT THERE BY A FAILING CASE. On a portrait whose hair
    # was nearly the colour of the ground, the crown read as background, the
    # face below it widened suddenly, and that single widening row was taken
    # for a pair of shoulders: the crop came back 160 pixels tall on a 1024
    # image, which is a chin and nothing else.
    #
    #   sustained  a real shoulder line stays wide. One wide row is an ear,
    #              a collar point, or a gap in a badly separated crown.
    #   plausible  a head that is under an eighth of the frame means the
    #              crown was missed. Keep looking rather than believe it.
    #
    # If neither ever agrees, this returns None and the caller leaves the
    # framing alone. Failing safe matters more than framing every one: a
    # portrait that is merely too wide is usable, a portrait cropped to a
    # jaw is not.
    SUSTAIN = max(3, int(h * 0.01))
    MIN_HEAD = h * 0.12

    start = top + max(4, int(h * 0.02))
    shoulder = None
    for y in range(start + 1, h - SUSTAIN):
        seen = widths[start:y]
        seen = seen[seen > 0]
        if seen.size < max(8, h * 0.03):
            continue
        line = np.median(seen) * SHOULDER_RATIO
        if widths[y] > line and np.all(widths[y:y + SUSTAIN] > line):
            if y - top < MIN_HEAD:
                continue
            shoulder = y
            break
    if shoulder is None:
        return None

    # Centre on the head itself, not on the whole picture: a head turned to
    # one side does not sit in the middle of the frame.
    band = subject[top:shoulder]
    cols = np.flatnonzero(band.sum(axis=0) > 0)
    if cols.size == 0:
        return None
    cx = (int(cols[0]) + int(cols[-1])) // 2

    head_h = shoulder - top
    side = int(head_h * (1 + HEAD_MARGIN * 2))
    cy = top + head_h // 2

    left = max(0, min(w - side, cx - side // 2))
    upper = max(0, min(h - side, cy - side // 2))
    side = min(side, w - left, h - upper)
    return (left, upper, left + side, upper + side)


def convert(path: str, out_dir: str, lut: np.ndarray, size: int, circle: bool,
            preview: bool = False, autocrop: bool = False) -> str:
    img = Image.open(path).convert('RGB')
    if autocrop:
        box = head_box(img)
        if box:
            img = img.crop(box)
        else:
            print(f'    (kafa bulunamadi, kadraj degismedi: {os.path.basename(path)})')
    if img.size[0] != img.size[1]:
        side = min(img.size)
        left = (img.size[0] - side) // 2
        top = (img.size[1] - side) // 2
        img = img.crop((left, top, left + side, top + side))
    img = img.resize((max(size, 512), max(size, 512)), Image.LANCZOS)

    mapped = Image.fromarray(lut[luminance(img)], mode='RGB')

    base = os.path.splitext(os.path.basename(path))[0]
    dest = os.path.join(out_dir, f'{base}.png')
    mapped.resize((size, size), Image.LANCZOS).save(dest)
    if circle:
        circle_crop(mapped).save(os.path.join(out_dir, f'{base}_circle.png'))
    if preview:
        preview_sheet(mapped, os.path.join(out_dir, f'{base}_preview.png'))
    return dest


def write_strip(stops: list, dest: str) -> None:
    """The ramp as an image, for a ComfyUI gradient map node."""
    lut = build_lut(stops)
    Image.fromarray(np.tile(lut[None, :, :], (64, 1, 1)), mode='RGB').save(dest)


# ---------------------------------------------------------------------------
#  THE ONLY TEST THAT DECIDES ANYTHING
# ---------------------------------------------------------------------------
#  Every one of these portraits is going to be shown as a circle between 44
#  and 80 points across. Measured off the real styles: the poker seat is 46,
#  the family and succession lists are 44, the shareholder modals are 80.
#
#  A portrait judged at 1024 is judged at twenty times the size it will ever
#  be seen at, and the things that make it look good there - hair strands,
#  stubble, the line weight around an eyelid - are exactly the things that
#  disappear first. So "is this the style we want" cannot be answered by
#  looking at the render. It has to be answered by looking at 46 pixels.
#
#  This writes both, on one sheet, so the question answers itself.
# ---------------------------------------------------------------------------

#  The sizes the app actually renders an avatar at, smallest last so the eye
#  ends on the hardest case.
REAL_SIZES = [80, 46]


def preview_sheet(mapped: Image.Image, dest: str) -> None:
    """Full size, then the real avatar sizes, then those magnified."""
    from PIL import ImageDraw
    pad, big = 24, 300
    cell = 190
    w = pad + big + pad + len(REAL_SIZES) * (cell + pad)
    h = pad + big + pad + 34
    sheet = Image.new('RGB', (w, h), hex_to_rgb(C['ink']))
    d = ImageDraw.Draw(sheet)

    shown = circle_crop(mapped.resize((big, big), Image.LANCZOS))
    sheet.paste(shown, (pad, pad), shown)
    d.text((pad, pad + big + 10), 'rendered', fill=hex_to_rgb(C['greyLight']))

    x = pad + big + pad
    for size in REAL_SIZES:
        small = circle_crop(mapped.resize((size, size), Image.LANCZOS))
        # Actual size, top: this is literally what the player sees.
        sheet.paste(small, (x + (cell - size) // 2, pad), small)
        # Magnified with NEAREST, below: what survived, made legible.
        blown = small.resize((cell, cell), Image.NEAREST)
        sheet.paste(blown, (x, pad + 100), blown)
        d.text((x, pad + big + 10), f'{size}px, real then magnified',
               fill=hex_to_rgb(C['greyLight']))
        x += cell + pad

    sheet.save(dest)


def main() -> int:
    ap = argparse.ArgumentParser(description='Map portraits onto the game palette.')
    ap.add_argument('src', help='an image, or a folder of them')
    ap.add_argument('out', help='where to write')
    ap.add_argument('--ramp', default='cool', choices=sorted(RAMPS))
    ap.add_argument('--size', type=int, default=512)
    ap.add_argument('--circle', action='store_true')
    ap.add_argument('--strip', action='store_true',
                    help='also write the ramp itself as ramp_<name>.png')
    ap.add_argument('--preview', action='store_true',
                    help='write a sheet showing the real 80px and 46px avatar')
    ap.add_argument('--autocrop', action='store_true',
                    help='find the head against the flat background and crop to it')
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)
    stops = RAMPS[args.ramp]
    lut = build_lut(stops)

    if args.strip:
        dest = os.path.join(args.out, f'ramp_{args.ramp}.png')
        write_strip(stops, dest)
        print(f'  ramp -> {dest}')

    if os.path.isdir(args.src):
        files = sorted(
            os.path.join(args.src, f) for f in os.listdir(args.src)
            if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))
        )
    else:
        files = [args.src]

    if not files:
        print('nothing to convert')
        return 1

    for f in files:
        print(f'  {os.path.basename(f)} -> {os.path.basename(convert(f, args.out, lut, args.size, args.circle, args.preview, args.autocrop))}')
    print(f'\n{len(files)} image(s), ramp "{args.ramp}", {args.size}px')
    return 0


if __name__ == '__main__':
    sys.exit(main())
