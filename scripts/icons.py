#!/usr/bin/env python3
# scripts/icons.py
#
# =============================================================================
#  EVERY ICON THE TWO STORES WANT, GENERATED FROM ONE MASTER
# =============================================================================
#
#  WHAT WAS WRONG
#  --------------
#  `ic_launcher_foreground.png` was the full artwork, opaque, edge to edge.
#  An adaptive icon layer is 108dp and the system guarantees only the CENTRE
#  72dp is visible: the outer 18dp on each side is reserved for the launcher's
#  mask and its parallax. So Android cropped 72px off every edge of the 432px
#  file and showed a zoomed crop of the face, with the top of the hair cut, the
#  shoulders gone, and the chin against the edge.
#
#  Two smaller faults rode along:
#
#    * the foreground was OPAQUE, so `ic_launcher_background.png` was never
#      visible. Two layers existed and the layering did nothing.
#    * `ic_launcher_round.png` was a SQUARE image with no alpha channel. On the
#      API 24 and 25 launchers that actually use it - and minSdkVersion is 24 -
#      a round icon slot was being filled with a square.
#
#  None of this reports itself. The build succeeds, the icon appears, and it
#  is simply wrong on the home screen of every Android device.
#
#  ---------------------------------------------------------------------------
#  WHY A SCRIPT RATHER THAN TWENTY EXPORTED FILES
#  ---------------------------------------------------------------------------
#  There are 20 Android files across 5 densities plus the store assets, and
#  they must agree with each other. Hand exported, they drift: one density gets
#  re-cut and the others do not, and nobody looks at mdpi again. Here the
#  master is the single source and every output is derived, so changing the
#  artwork is one file and one command.
#
#  The geometry is also the part that was wrong, and geometry belongs in code
#  where it can be read and argued with rather than in a designer's memory.
#
#  ---------------------------------------------------------------------------
#  THE HEAD SIZE WAS MEASURED, NOT CHOSEN
#  ---------------------------------------------------------------------------
#  HEAD_DP was picked by rendering 50, 56, 62 and 68 through both launcher
#  masks and looking: at 62 the circle starts clipping the hair, at 68 it
#  clips plainly. 56 leaves a margin on every side and still reads at 48dp.
#
#  USAGE
#  -----
#      python3 scripts/icons.py
#
#  Writes the Android resources in place and the store uploads to
#  `assets/icon/store/`. The originals are kept in `assets/icon/original/`.
# =============================================================================

import os
import struct
import sys

try:
    from PIL import Image, ImageDraw
except ImportError:
    sys.exit('Pillow is needed: pip3 install --break-system-packages pillow')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MASTER = os.path.join(ROOT, 'assets/icon/original/master-1024.png')
RES = os.path.join(ROOT, 'android/app/src/main/res')
STORE = os.path.join(ROOT, 'assets/icon/store')

# --- The adaptive icon's geometry, from Android's own specification ---------
LAYER_DP = 108   # the size of each layer
WINDOW_DP = 72   # the part the system guarantees is visible
HEAD_DP = 56     # how tall the head is drawn inside that window

# --- Where the head is in the master, measured once -------------------------
#  Found by walking the master for pixels that differ from the background gold,
#  ignoring the bottom fifth so the suit and shoulder do not drag the box down.
#  Re-measure if the artwork is ever replaced; `measure_head` below does it.
HEAD_BOX = (126, 62, 782, 818)

DENSITIES = {
    'mdpi': 1.0,
    'hdpi': 1.5,
    'xhdpi': 2.0,
    'xxhdpi': 3.0,
    'xxxhdpi': 4.0,
}

LEGACY_DP = 48   # the pre adaptive launcher icon


def measure_head(img, skip_bottom=0.20, tol=30):
    """The bounding box of the subject, excluding the suit at the bottom."""
    px = img.load()
    w, h = img.size
    gold = px[8, 8]
    x0, y0, x1, y1 = w, h, 0, 0
    for y in range(0, int(h * (1 - skip_bottom)), 2):
        for x in range(0, w, 2):
            r, g, b = px[x, y][:3]
            if abs(r - gold[0]) > tol or abs(g - gold[1]) > tol or abs(b - gold[2]) > tol:
                x0, y0 = min(x0, x), min(y0, y)
                x1, y1 = max(x1, x), max(y1, y)
    return (x0, y0, x1, y1)


def place(master, canvas_px, head_px):
    """
    Draw the artwork so the head is `head_px` tall and centred on the canvas.

    -------------------------------------------------------------------------
     THE SURROUND IS THE ARTWORK'S OWN EDGE, STRETCHED, NOT A FLAT FILL
    -------------------------------------------------------------------------
     Filling the margin with a gold sampled from the corner was the first
     attempt and it left a faint rectangle: the master's background is not flat,
     it carries a slight vignette, so a flat fill meets it at a visible seam.
     Shrinking the head until the seam fell outside the window would have traded
     a visible line for a smaller icon.

     The margin is instead the artwork's outermost row and column stretched
     outwards, which continues the vignette rather than butting against it.

     It is not cosmetic for the round legacy icon, it is structural. There the
     artwork is smaller than the canvas, so without the extension the circle
     mask cuts through empty space at the top, bottom and sides and the icon
     comes out with four transparent bites taken out of its edge.
    -------------------------------------------------------------------------
    """
    hx0, hy0, hx1, hy1 = HEAD_BOX
    scale = head_px / (hy1 - hy0)
    size = round(master.size[0] * scale)
    art = master.resize((size, size), Image.LANCZOS).convert('RGBA')

    ox = round(canvas_px / 2 - ((hx0 + hx1) / 2) * scale)
    oy = round(canvas_px / 2 - ((hy0 + hy1) / 2) * scale)

    canvas = Image.new('RGBA', (canvas_px, canvas_px), (0, 0, 0, 255))

    def stretch(src_box, dest_box):
        """Blow a strip or a single pixel of the artwork up to fill a region."""
        dx0, dy0, dx1, dy1 = dest_box
        if dx1 <= dx0 or dy1 <= dy0:
            return                      # nothing to fill on this side
        canvas.paste(
            art.crop(src_box).resize((dx1 - dx0, dy1 - dy0), Image.BILINEAR),
            (dx0, dy0),
        )

    n, L, T = canvas_px, max(ox, 0), max(oy, 0)
    R, B = min(ox + size, n), min(oy + size, n)
    last = size - 1

    # The eight regions around the artwork. Corners take a single pixel, edges
    # take the outermost row or column.
    stretch((0, 0, 1, 1),                 (0, 0, L, T))
    stretch((last, 0, size, 1),           (R, 0, n, T))
    stretch((0, last, 1, size),           (0, B, L, n))
    stretch((last, last, size, size),     (R, B, n, n))
    stretch((0, 0, 1, size),              (0, T, L, B))
    stretch((last, 0, size, size),        (R, T, n, B))
    stretch((0, 0, size, 1),              (L, 0, R, T))
    stretch((0, last, size, size),        (L, B, R, n))

    canvas.paste(art, (ox, oy))
    return canvas


def circle_mask(img):
    """Clip to the inscribed circle, leaving real transparency outside it."""
    n = img.size[0]
    m = Image.new('L', img.size, 0)
    ImageDraw.Draw(m).ellipse((0, 0, n - 1, n - 1), fill=255)
    out = Image.new('RGBA', img.size, (0, 0, 0, 0))
    out.paste(img, (0, 0), m)
    return out


def save(img, path, keep_alpha):
    """
    PNG, with the alpha channel kept or dropped DELIBERATELY.

    It matters in both directions. Apple rejects a 1024 app icon that carries
    an alpha channel at all. Google requires the 512 Play icon to be a 32 bit
    PNG WITH alpha. A single `img.save()` for everything gets one of them
    wrong, and the rejection arrives days later.
    """
    os.makedirs(os.path.dirname(path), exist_ok=True)
    (img if keep_alpha else img.convert('RGB')).save(path, 'PNG', optimize=True)
    return path


def colour_type(path):
    """Read the PNG header back, so the alpha claim above is not just a claim."""
    with open(path, 'rb') as f:
        return f.read(26)[25]


#  The wordmark, which must match the STORE listings and the app label rather
#  than the AppRegistry component id. See android/.../values/strings.xml.
APP_NAME = 'SUCCESSOR'
TAGLINE = 'Build the company. Choose the heir.'


def feature_graphic(master, w=1024, h=500):
    """
    The 1024x500 Play feature graphic.

    Laid out against Google's own guidance rather than by eye: the focal point
    stays central, background elements are pushed to the edges, and no key
    element sits in the left or right cutoff zones. It avoids white and dark
    grey, which Google notes blend into the Play Store background.

    -------------------------------------------------------------------------
     TWO LAYOUT FAULTS WERE MEASURED OUT RATHER THAN EYEBALLED
    -------------------------------------------------------------------------
      * the first attempt put the wordmark over the portrait's hair. The
        assertion at the bottom now fails the build instead of shipping it,
        which matters because the word got LONGER when the name was corrected
        from Succesor to Successor and would have collided again.
      * the portrait was first cut with a blurred CIRCLE, which left a dark
        crescent where the suit sat and read as a smudge. A linear fade from
        the left dissolves the artwork's own background instead.
    -------------------------------------------------------------------------
    """
    from PIL import ImageFont

    gold = master.getpixel((8, 8))[:3]
    deep = (166, 121, 28)    # theme.colors.premium
    ink = (28, 36, 44)       # theme.colors.background

    base = Image.new('RGB', (w, h), gold)
    ramp = Image.new('L', (1, h))
    for y in range(h):
        ramp.putpixel((0, y), int(255 * (y / h) ** 1.2))
    base = Image.composite(Image.new('RGB', (w, h), deep), base, ramp.resize((w, h)))

    side, fade_px = 470, 210
    art = master.convert('RGB').resize((side, side), Image.LANCZOS)
    fade = Image.new('L', (side, side), 255)
    px = fade.load()
    for x in range(fade_px):
        v = int(255 * (x / fade_px) ** 1.4)
        for y in range(side):
            px[x, y] = v
    band_x = w - side - 8
    base.paste(art, (band_x, h - side + 34), fade)

    draw = ImageDraw.Draw(base)
    lato = '/usr/share/fonts/truetype/lato/'
    try:
        title = ImageFont.truetype(lato + 'Lato-Black.ttf', 78)
        sub = ImageFont.truetype(lato + 'Lato-Regular.ttf', 27)
    except OSError:
        print('  (Lato not installed, falling back to DejaVu)')
        dj = '/usr/share/fonts/truetype/dejavu/'
        title = ImageFont.truetype(dj + 'DejaVuSans-Bold.ttf', 70)
        sub = ImageFont.truetype(dj + 'DejaVuSans.ttf', 25)

    x, y = 98, 196
    visible_from = band_x + int(fade_px * 0.45)
    ends = max(x + draw.textlength(APP_NAME, font=title),
               x + 4 + draw.textlength(TAGLINE, font=sub))
    if ends >= visible_from:
        raise SystemExit(
            f'the wordmark would run into the portrait: text ends at {ends:.0f}, '
            f'the face becomes visible at {visible_from}. Shorten the text or '
            f'drop the point size.')

    draw.text((x, y), APP_NAME, font=title, fill=ink)
    draw.text((x + 4, y + 100), TAGLINE, font=sub, fill=ink)
    return base.convert('RGBA')


def main():
    master = Image.open(MASTER).convert('RGBA')
    if master.size != (1024, 1024):
        sys.exit(f'master must be 1024x1024, found {master.size}')

    gold = master.getpixel((8, 8))[:3]
    written = []

    # --- Android, five densities -------------------------------------------
    for name, k in DENSITIES.items():
        layer = round(LAYER_DP * k)
        legacy = round(LEGACY_DP * k)
        out = os.path.join(RES, f'mipmap-{name}')

        # Foreground: the head inside the guaranteed window, gold to the edge.
        written.append(save(
            place(master, layer, round(HEAD_DP * k)),
            os.path.join(out, 'ic_launcher_foreground.png'), keep_alpha=False))

        # Background: flat. Anything with detail here is only ever glimpsed
        # during the launcher's parallax, so detail would be noise.
        written.append(save(
            Image.new('RGB', (layer, layer), gold),
            os.path.join(out, 'ic_launcher_background.png'), keep_alpha=False))

        # Legacy square, for API 24 and 25. Not masked, so the artwork is
        # framed more generously than the adaptive foreground.
        written.append(save(
            place(master, legacy, round(legacy * 0.80)),
            os.path.join(out, 'ic_launcher.png'), keep_alpha=False))

        # Legacy round. Actually round, and actually transparent outside it.
        written.append(save(
            circle_mask(place(master, legacy, round(legacy * 0.66))),
            os.path.join(out, 'ic_launcher_round.png'), keep_alpha=True))

    # --- The store uploads --------------------------------------------------
    #  Google Play: 512x512, 32 bit PNG WITH alpha, under 1024KB.
    written.append(save(
        place(master, 512, round(512 * 0.80)),
        os.path.join(STORE, 'play-icon-512.png'), keep_alpha=True))

    #  App Store: 1024x1024, NO alpha, square, no rounded corners.
    written.append(save(
        master, os.path.join(STORE, 'appstore-icon-1024.png'), keep_alpha=False))

    #  Play feature graphic: 1024x500, JPEG or 24 bit PNG, no alpha.
    written.append(save(
        feature_graphic(master),
        os.path.join(STORE, 'play-feature-graphic-1024x500.png'), keep_alpha=False))

    for path in written:
        img = Image.open(path)
        kind = {0: 'gray', 2: 'RGB', 3: 'palette', 4: 'gray+A', 6: 'RGBA'}
        size_kb = os.path.getsize(path) / 1024
        print(f'{os.path.relpath(path, ROOT):<58} '
              f'{img.size[0]}x{img.size[1]:<5} '
              f'{kind.get(colour_type(path), "?"):<8} {size_kb:6.1f} KB')

    print(f'\n{len(written)} files written.')


if __name__ == '__main__':
    main()
