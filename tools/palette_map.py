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
 --autocrop find the head and crop to it. NOT RELIABLE, and off by default
           for a reason: see the note above `head_box`. Only reach for it
           when a portrait comes out too wide, and always check --preview.
 --flip    mirror horizontally. These portraits carry no lettering and no
           asymmetric prop, so a mirrored one is the same person facing the
           other way and nothing gives it away.
           (--face-right, which guessed the direction, is SHELVED: it
           scored 0 of 2 on heads whose direction was known. Look once and
           pass --flip.)
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

    # ----------------------------------------------------------------------
    #  NEUTRAL, WHICH IS NOT A LOOK BUT A SOURCE FORMAT
    # ----------------------------------------------------------------------
    #  For portraits that will be tinted at RUNTIME rather than here. A
    #  runtime duotone reads luminance and maps it, exactly as this does, so
    #  handing it an already coloured image maps twice. Measured earlier:
    #  warm then violet against violet directly is 19/255 apart and the
    #  first map flattens 256 tonal steps to 182 for the second to work
    #  from.
    #
    #  Pure black to white, so the full range survives to the filter and any
    #  ramp can be reached from it at full fidelity. Also the safe fallback:
    #  if the filter ever fails to apply, a grey portrait is a portrait.
    # ----------------------------------------------------------------------
    'neutral': [(0.00, '#000000'), (0.50, '#808080'), (1.00, '#FFFFFF')],
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
    Subject versus background, by CONNECTION rather than by colour alone.

    ---------------------------------------------------------------------
     WHY COLOUR ALONE WAS NOT ENOUGH, WHICH A REAL PORTRAIT SHOWED AND MY
     OWN TEST IMAGES DID NOT
    ---------------------------------------------------------------------
     The first version called a pixel "subject" when it was far enough from
     the background colour. That is fine while a person and a backdrop do
     not share a tone. On the first real portrait they did: the ground was
     (163,151,111) and the lit side of the face was almost exactly that, so
     the face came back full of holes. Row widths went 391, 448, 224, 135,
     124 down the cheek, the sudden widening below a hole was taken for a
     shoulder line, and the crop landed just under the eyes. A chin and
     nothing else.

     Every synthetic case I had written passed, because I had drawn faces
     that did not happen to match their own background.

     The fix is to stop asking what colour a pixel is and ask what it is
     CONNECTED to. The background is the region that reaches the border. A
     cheek the same colour as the backdrop is still enclosed by an outline,
     so it is not part of it. Flood fill answers exactly that question, and
     PIL's is in C, so it costs nothing.

     Otsu still chooses the tolerance, so it adapts per image the way it
     did before.
    ---------------------------------------------------------------------
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

    # Flood the background in from all four corners. 255 is reserved as the
    # sentinel, so the data is clipped to 254 and cannot be mistaken for it.
    from PIL import ImageDraw
    # .copy() IS LOad BEARING. Image.fromarray hands back an image backed by
    # the numpy buffer, and floodfill on it does NOTHING - no error, no
    # exception, it simply fills zero pixels and returns. Measured: 0 filled
    # at every threshold from 20 to 254, which read as "the whole picture is
    # subject" and made head_box decline every real portrait. A silent no-op
    # is the worst kind of bug and this file has now produced two.
    flat = Image.fromarray(
        np.clip(dist, 0, 254).astype(np.uint8), mode='L').copy()
    h, w = dist.shape
    # Seeded along the TOP edge only, for the same reason the colour is
    # sampled there: the bottom of a portrait is a person, not a backdrop.
    seeds = [(0, 0), (w - 1, 0), (w // 2, 0), (0, h // 8), (w - 1, h // 8)]
    for seed in seeds:
        if flat.getpixel(seed) != 255:
            ImageDraw.floodfill(flat, seed, 255, thresh=thresh)
    background = np.asarray(flat) == 255

    # Subject is everything the flood could not reach. Colour still has the
    # last word on the edges: a pixel far from the background is subject
    # even if the fill leaked through a soft outline somewhere.
    return (~background) | (dist > thresh)

#  The width jump that means shoulders. Measured against the median width of
#  the head rows above it. A head is roughly one unit wide and a pair of
#  shoulders is roughly two, so 1.55 sits clear of both.
SHOULDER_RATIO = 1.55

#  Breathing room around the head, as a share of its height. Without this the
#  circle mask shaves the top of the hair and the point of the chin.
HEAD_MARGIN = 0.30


def head_box(img: Image.Image):
    """
    The square to crop to, or None if the picture will not give one up.

    -----------------------------------------------------------------------
     THIS IS NOT RELIABLE AND THE HONEST THING IS TO SAY SO
    -----------------------------------------------------------------------
     Five rounds of fixes, each one passing every fixture I had and then
     failing on the next real portrait:

         1  all four corners sampled, but the lower two are jacket
         2  Image.fromarray is read only, so floodfill silently did nothing
         3  the widest row taken from a window containing the shoulders
         4  "width jumps at the shoulders" is false of a portrait
         5  a gradient background makes the mask oscillate, and a hole in
            it reads as a neck: the second real portrait cropped to the nose

     After the fifth it still cut a chin. The pattern is the problem: every
     patch is fitted to the last failure, and heuristics fitted one image at
     a time do not generalise, they just move where they break.

     So it is OFF by default and it is not in the recommended flow. The
     prompt now asks for a close crop and delivers one, which is where
     framing belonged all along: the second real portrait needed no crop at
     all and was damaged by being given one.

     Kept rather than deleted because it is genuinely useful on a portrait
     that comes out too wide, and because the measurement above is worth
     more written down than thrown away. Use it deliberately, one image at
     a time, and look at the --preview sheet before keeping the result.
    -----------------------------------------------------------------------
    """
    a = np.asarray(img.convert('RGB'), dtype=np.int16)
    h, w, _ = a.shape

    # ONLY THE TOP CORNERS, and the reason is the whole shape of a portrait.
    #
    # I sampled all four and it was wrong on the first real image: in a head
    # and shoulders portrait the body runs off the BOTTOM of the frame, so
    # the lower corners are jacket. Measured on that portrait, a tenth of the
    # border ring sat 200 away from the colour I was calling the background.
    # The median was polluted by clothing, and worse, seeding a flood fill
    # down there starts it INSIDE the person: it filled the entire image and
    # declared 100% background.
    #
    # Above the head there is always backdrop. Below it there need not be.
    k = max(4, min(h, w) // 32)
    corners = np.concatenate([
        a[:k, :k].reshape(-1, 3), a[:k, -k:].reshape(-1, 3),
    ])
    bg = np.median(corners, axis=0)

    subject = subject_mask(a, bg)
    widths = subject.sum(axis=1)

    rows = np.flatnonzero(widths > w * 0.02)
    if rows.size == 0:
        return None
    top = int(rows[0])

    # ------------------------------------------------------------------
    #  LOOK FOR THE NECK, NOT THE SHOULDERS
    # ------------------------------------------------------------------
    #  The first rule here was "the subject's width jumps at the shoulders".
    #  It is true of a full length figure and false of a portrait, which is
    #  the only thing this will ever be handed. Measured down the first real
    #  one, row widths went:
    #
    #      crown   41      24
    #      cheeks  201    469     <- the head is widest here
    #      jaw     521    463
    #      neck    681    322     <- and NARROWEST here
    #      collar  921    550
    #      edge   1001    862     <- the shoulders, at the bottom of the frame
    #
    #  The shoulders never widen inside the head's neighbourhood; they arrive
    #  at the very bottom, so the old rule put the cut at y=960 and the crop
    #  came back as the entire image.
    #
    #  The neck is the reliable landmark, because a head is wide at the
    #  cheekbones and narrow under the chin, always, in every framing. So:
    #  find the widest row, then walk down to where the width has fallen
    #  away. That point is the bottom of the head.
    # ------------------------------------------------------------------
    #  AND THE WIDEST ROW HAS TO BE FOUND ON THE WAY DOWN, NOT IN A WINDOW.
    #
    #  My first version took the widest row inside the top three quarters of
    #  the frame. The shoulders are in that window, and they are wider than
    #  any head, so the peak came back as the coat: the neck line was then
    #  measured against a shoulder width, nothing was ever narrow enough,
    #  and six of seven framings were declined. Safe, and useless.
    #
    #  A RUNNING maximum fixes it. At the cheekbones the running max IS the
    #  head, because the shoulders have not been reached yet, so the neck
    #  is caught before the coat can ever set the bar.
    #  AND THE ROW WIDTHS HAVE TO BE SMOOTHED FIRST, because the mask is not
    #  clean. The second real portrait had a GRADIENT background rather than
    #  a flat one, so the separation came out full of small holes and the
    #  widths oscillated down the cheek:
    #
    #      414  530
    #      464  402   <- a hole, read as a neck
    #      514  413
    #      564  448
    #      614  384
    #      664  503
    #
    #  The crop landed at the nose. This is the failure I said must never
    #  happen: too wide is usable, cropped to a jaw is not.
    #
    #  Three things together, rather than another single patch:
    #    smoothing   a moving average over a fortieth of the height, so one
    #                bad row cannot be a landmark
    #    deeper      a real neck is well under two thirds of the head, not
    #                a few per cent under it
    #    longer      and it STAYS narrow for a real distance, not ten rows
    MIN_HEAD = h * 0.12
    NECK_OF_PEAK = 0.66
    SUSTAIN = max(8, int(h * 0.04))
    SMOOTH = max(3, int(h * 0.025))

    start = top + max(4, int(h * 0.02))
    if h - start < MIN_HEAD:
        return None

    kernel = np.ones(SMOOTH) / SMOOTH
    smooth = np.convolve(widths.astype(float), kernel, mode='same')

    run_max = np.maximum.accumulate(smooth)
    neck = None
    for y in range(start + 1, h - SUSTAIN):
        if run_max[y] < w * 0.08 or y - top < MIN_HEAD:
            continue
        line = run_max[y] * NECK_OF_PEAK
        if smooth[y] < line and np.all(smooth[y:y + SUSTAIN] < line):
            neck = y
            break

    # No narrowing at all means the head runs off the bottom of the frame,
    # or the separation failed. Decline rather than guess: a portrait that
    # is merely too wide is usable, one cropped to a jaw is not.
    if neck is None or neck - top < MIN_HEAD:
        return None
    shoulder = neck

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


# ---------------------------------------------------------------------------
#  WHICH WAY THE HEAD FACES, AND WHY THIS IS NOT A CONTROLNET PROBLEM
# ---------------------------------------------------------------------------
#  The cast is meant to face right. It was going to be the expensive part:
#  text to image models ignore direction words, the weights only shift the
#  odds, and the real fix looked like installing ControlNet and driving every
#  portrait off a reference.
#
#  It is not, because these portraits are FLAT VECTOR. No lettering, no
#  badge, no watch, no parting that anyone has seen before. Mirror one and
#  it is the same person facing the other way, and there is nothing left in
#  the frame to give it away. So a whole subsystem collapses into one axis
#  flip, which is exact rather than probabilistic: the model does not have
#  to cooperate at all.
#
#  WHAT WAS MEASURED, including the part that failed.
#
#      mirroring        exact. Flipping reverses the verdict every time and
#                       flipping twice is bit for bit the original.
#
#      faces_right()    DOES NOT WORK. The idea was that in a three quarter
#                       view the hair sits behind the face, so the dark mass
#                       leans away from the gaze. On two synthetic heads
#                       whose direction was known by construction it scored
#                       0 of 2, returning "cannot tell" for both, and on four
#                       real portraits it reached a verdict on one.
#
#  So --face-right is SHELVED rather than shipped hopefully. A wrong
#  automatic flip is worse than no flip: it is silent, and it would run over
#  a portrait that was already correct.
#
#  What would actually fix it is a real facial landmark (the nose tip
#  against the midline of the head), which means a face detector and a
#  dependency. Not worth it while --flip costs one look and one word.
# ---------------------------------------------------------------------------

def faces_right(img: Image.Image):
    """
    True, False, or None when the head is too square on to tell.

    Compares where the dark mass (hair, the back of the skull) sits against
    the centre of the head. Facing right puts the hair on the left.
    """
    box = head_box(img)
    crop = img.crop(box) if box else img
    a = np.asarray(crop.convert('RGB'), dtype=np.int16)
    h, w, _ = a.shape

    k = max(4, min(h, w) // 32)
    bg = np.median(np.concatenate([
        a[:k, :k].reshape(-1, 3), a[:k, -k:].reshape(-1, 3),
    ]), axis=0)
    head = subject_mask(a, bg)
    if head.sum() < h * w * 0.05:
        return None

    lum = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    inside = lum[head]
    dark = head & (lum < np.percentile(inside, 30))
    if dark.sum() < head.sum() * 0.05:
        return None

    xs = np.arange(w)
    head_cx = (head.sum(axis=0) * xs).sum() / head.sum()
    dark_cx = (dark.sum(axis=0) * xs).sum() / dark.sum()

    # As a share of head width, so it does not depend on the crop size.
    lean = (dark_cx - head_cx) / w
    if abs(lean) < 0.015:
        return None          # square on, or too close to call
    return lean < 0          # hair to the left means the face points right


def convert(path: str, out_dir: str, lut: np.ndarray, size: int, circle: bool,
            preview: bool = False, autocrop: bool = False,
            flip: bool = False, face_right: bool = False) -> str:
    img = Image.open(path).convert('RGB')

    # Direction first, so the crop and the preview show what will be kept.
    if flip:
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
    # SHELVED with --face-right, see the note above `faces_right`. Scored
    # 0 of 2 on heads whose direction was known, so it stays off.
    #   elif face_right:
    #       looking = faces_right(img)
    #       if looking is False:
    #           img = img.transpose(Image.FLIP_LEFT_RIGHT)

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
    ap.add_argument('--flip', action='store_true',
                    help='mirror horizontally. The certain way to face the other side.')
    # SHELVED: --face-right. The detector below it does not work; see the
    # note above `faces_right`. Left wired to False so the call sites stay
    # honest rather than half removed.
    #   ap.add_argument('--face-right', dest='face_right', action='store_true',
    #                   help='guess the direction and mirror if it looks left')
    ap.set_defaults(face_right=False)
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
        dest = convert(f, args.out, lut, args.size, args.circle,
                       args.preview, args.autocrop, args.flip, args.face_right)
        print(f'  {os.path.basename(f)} -> {os.path.basename(dest)}')
    print(f'\n{len(files)} image(s), ramp "{args.ramp}", {args.size}px')
    return 0


if __name__ == '__main__':
    sys.exit(main())
