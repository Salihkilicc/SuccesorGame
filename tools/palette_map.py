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


def convert(path: str, out_dir: str, lut: np.ndarray, size: int, circle: bool) -> str:
    img = Image.open(path)
    if img.size[0] != img.size[1]:
        side = min(img.size)
        left = (img.size[0] - side) // 2
        top = (img.size[1] - side) // 2
        img = img.crop((left, top, left + side, top + side))
    img = img.resize((size, size), Image.LANCZOS)

    mapped = Image.fromarray(lut[luminance(img)], mode='RGB')

    base = os.path.splitext(os.path.basename(path))[0]
    dest = os.path.join(out_dir, f'{base}.png')
    mapped.save(dest)
    if circle:
        circle_crop(mapped).save(os.path.join(out_dir, f'{base}_circle.png'))
    return dest


def write_strip(stops: list, dest: str) -> None:
    """The ramp as an image, for a ComfyUI gradient map node."""
    lut = build_lut(stops)
    Image.fromarray(np.tile(lut[None, :, :], (64, 1, 1)), mode='RGB').save(dest)


def main() -> int:
    ap = argparse.ArgumentParser(description='Map portraits onto the game palette.')
    ap.add_argument('src', help='an image, or a folder of them')
    ap.add_argument('out', help='where to write')
    ap.add_argument('--ramp', default='cool', choices=sorted(RAMPS))
    ap.add_argument('--size', type=int, default=512)
    ap.add_argument('--circle', action='store_true')
    ap.add_argument('--strip', action='store_true',
                    help='also write the ramp itself as ramp_<name>.png')
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
        print(f'  {os.path.basename(f)} -> {os.path.basename(convert(f, args.out, lut, args.size, args.circle))}')
    print(f'\n{len(files)} image(s), ramp "{args.ramp}", {args.size}px')
    return 0


if __name__ == '__main__':
    sys.exit(main())
