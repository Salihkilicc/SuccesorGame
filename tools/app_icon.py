#!/usr/bin/env python3
"""
app_icon.py - build the iOS app icon from the player's own portrait.

============================================================================
 WHY THIS IS A SCRIPT AND NOT TWENTY PNGS SOMEBODY DRAGGED IN
============================================================================

 The icon set is twenty files at twelve sizes. Dragged in by hand they are
 twenty binaries nobody can rebuild, and the next time the portrait or the
 palette changes somebody redoes the whole job from memory and gets a
 slightly different crop. The set that was in the repo before this file had
 exactly that problem: a letterboxed source with grey padding bars baked
 into the 1024, and no way to tell what it had been made from.

 So the icon is DERIVED, from two things already in the repo:

     assets/portraits/player_male.png   the man himself
     tools/palette_map.py               the palette, read from theme.ts

 Run it again after either changes and the set follows.

============================================================================
 THE RAMP, AND WHY 'warm' WAS NOT WARM ENOUGH
============================================================================

 palette_map's `warm` is ink -> blueDeep -> orange, so only the brightest
 forty five per cent of the image ever reaches the orange. A portrait whose
 luminance sits mostly in the middle therefore comes out BLUE with an orange
 rim, which is what was on the home screen and what was reported: "ustunde
 mavilik var".

 AMBER moves the orange to the mid. Same three theme colours, one of them in
 a different place, and the face becomes warm while the hair and the suit
 stay ink. Measured at the sizes that matter rather than argued about: see
 --sheet, which renders every candidate at 180, 120 and 60.

 It is kept here rather than added to palette_map.RAMPS on purpose. Those
 ramps are for the CAST, where a warm portrait means something about the
 person. This one is for a single 1024 pixel image on a home screen, and
 adding it there would invite somebody to render a character with it.

============================================================================
 THE CROP
============================================================================

 Not the whole portrait. `pad_portraits.py` leaves a band at the bottom of
 every source file, and the full frame put that band on the icon along with
 a lot of empty shoulder. At sixty pixels a torso is mush; a head is a head.

 The box below is head and collar, and it is off centre because the man is:
 he faces right and sits high in the frame.

============================================================================
 USAGE
============================================================================

     python3 tools/app_icon.py             write the set
     python3 tools/app_icon.py --sheet     just look at the candidates
     python3 tools/app_icon.py --ramp gold use the other warm one
     python3 tools/app_icon.py --check     verify the set on disk
"""

import argparse
import json
import os
import sys

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__))))
import palette_map as PM  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, 'assets', 'portraits', 'player_male.png')
ICONSET = os.path.join(
    ROOT, 'ios', 'Succesor', 'Images.xcassets', 'AppIcon.appiconset')

C = PM.C

# ---------------------------------------------------------------------------
#  THE RAMPS THIS FILE OFFERS
# ---------------------------------------------------------------------------
#  Every stop is a theme colour, which is the rule palette_map.RAMPS states
#  for itself. What differs between these and the cast ramps is only WHERE
#  the warm colour sits.
# ---------------------------------------------------------------------------
RAMPS = {
    # The chosen one. Orange at the mid, ink below it, near white above.
    'amber': [(0.00, C['ink']), (0.45, C['orange']), (1.00, C['greyLight'])],

    # Darker and browner. Orange held all the way to the top, so the
    # highlights stop separating from the mid.
    'gold': [(0.00, C['ink']), (0.70, C['orange']), (1.00, C['orange'])],

    # Warm face, blue shadow. Keeps more of the game's blue than amber does.
    'ember': [(0.00, C['ink']), (0.25, C['blueDeep']),
              (0.60, C['orange']), (1.00, C['greyLight'])],

    # What was on the icon. Here so --sheet can show the difference rather
    # than describe it.
    'warm': PM.RAMPS['warm'],
}

DEFAULT_RAMP = 'amber'

#  Fractions of the source, so the box survives the portrait being redrawn at
#  another resolution.
CROP = (0.16, 0.02, 0.98, 0.84)

MASTER = 1024


def head(src: Image.Image) -> Image.Image:
    """Head and collar, square, at 1024."""
    w, h = src.size
    box = (int(w * CROP[0]), int(h * CROP[1]),
           int(w * CROP[2]), int(h * CROP[3]))
    cut = src.crop(box)
    side = min(cut.size)
    cut = cut.crop((0, 0, side, side))
    # LANCZOS on a flat illustration, and the palette map quantises
    # afterwards, so interpolation fringing does not survive into the file.
    return cut.resize((MASTER, MASTER), Image.LANCZOS)


def paint(img: Image.Image, ramp: str) -> Image.Image:
    lut = PM.build_lut(RAMPS[ramp])
    # RGB, never RGBA. An icon with an alpha channel is rejected by App Store
    # Connect and renders with a black square behind it on device, which is
    # the single most common way an icon that looked fine in Xcode ships
    # wrong.
    return Image.fromarray(lut[PM.luminance(img)].astype('uint8'), 'RGB')


def sizes_wanted() -> set:
    """Every pixel size Contents.json actually asks for."""
    with open(os.path.join(ICONSET, 'Contents.json'), encoding='utf-8') as f:
        spec = json.load(f)
    return {int(float(i['expected-size'])) for i in spec['images']}


def write_set(master: Image.Image) -> list:
    written = []
    for size in sorted(sizes_wanted(), reverse=True):
        dest = os.path.join(ICONSET, f'{size}.png')
        master.resize((size, size), Image.LANCZOS).save(dest, format='PNG')
        written.append(f'{size}.png')
    return written


def check() -> int:
    """Every file Contents.json names exists, is square, is the right size,
    and carries no alpha."""
    with open(os.path.join(ICONSET, 'Contents.json'), encoding='utf-8') as f:
        spec = json.load(f)
    problems = []
    for entry in spec['images']:
        name = entry['filename']
        want = int(float(entry['expected-size']))
        path = os.path.join(ICONSET, name)
        if not os.path.exists(path):
            problems.append(f'{name}: missing')
            continue
        with Image.open(path) as im:
            if im.size != (want, want):
                problems.append(f'{name}: {im.size} but Contents.json says {want}')
            if im.mode not in ('RGB', 'P'):
                problems.append(f'{name}: mode {im.mode}, an icon must not carry alpha')
    for line in problems:
        print('  ' + line)
    print(f'{len(spec["images"])} entries, {len(problems)} problem(s).')
    return 1 if problems else 0


def sheet(src: Image.Image, dest: str) -> None:
    """Every ramp at 1024, and underneath it at the sizes iOS really renders.
    A candidate that only works at 1024 is not an app icon."""
    cut = head(src)
    names = list(RAMPS)
    big, small, pad = 340, [180, 120, 60], 16
    w = len(names) * (big + pad) + pad
    h = big + pad * 2 + 200
    out = Image.new('RGB', (w, h), (24, 28, 34))
    draw = ImageDraw.Draw(out)
    for i, name in enumerate(names):
        im = paint(cut, name)
        x = pad + i * (big + pad)
        out.paste(im.resize((big, big), Image.LANCZOS), (x, pad))
        draw.text((x + 4, pad + big + 6), name, fill=(235, 235, 235))
        xx, yy = x, pad + big + 26
        for s in small:
            out.paste(im.resize((s, s), Image.LANCZOS), (xx, yy))
            xx += s + 8
    out.save(dest)
    print(f'wrote {dest}')


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--ramp', default=DEFAULT_RAMP, choices=sorted(RAMPS))
    ap.add_argument('--sheet', metavar='PATH', nargs='?', const='/tmp/app_icon_sheet.png',
                    help='render the candidates instead of writing the set')
    ap.add_argument('--check', action='store_true',
                    help='verify the set already on disk')
    args = ap.parse_args()

    if args.check:
        return check()

    src = Image.open(SOURCE).convert('RGB')

    if args.sheet:
        sheet(src, args.sheet)
        return 0

    master = paint(head(src), args.ramp)
    written = write_set(master)
    print(f'{len(written)} files from {os.path.basename(SOURCE)} on the {args.ramp} ramp')
    return check()


if __name__ == '__main__':
    raise SystemExit(main())
