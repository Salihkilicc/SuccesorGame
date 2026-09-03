# succesor_palette.py - a ComfyUI node that forces an image into the game palette.
#
# ============================================================================
#  INSTALL
# ============================================================================
#
#      mkdir -p ~/ComfyUI/custom_nodes/succesor_palette
#      cp succesor_palette.py ~/ComfyUI/custom_nodes/succesor_palette/__init__.py
#
#  Restart ComfyUI. The node appears under "Succesor" as "Succesor Palette Map".
#  Wire it between VAE Decode and Save Image.
#
# ============================================================================
#  WHY
# ============================================================================
#
#  A diffusion model understands "blue". It does not understand #05A8F6. Ask
#  sixty portraits for the same blue and sixty different blues come back, and
#  the drift shows worst exactly where the portraits will live: side by side
#  in a list.
#
#  So the colour is not asked for, it is applied. The sampler is asked only
#  for light and form. This reads the LUMINANCE of each pixel and looks up
#  what colour that brightness should be, from a ramp built out of the app's
#  real hexes. The pixel's original colour is discarded, which is the whole
#  point: an orange cheek and a green cheek at the same brightness land on
#  the same blue.
#
#  Deliberately absent from every ramp: #4ADE80 and #FF8A8A. Those two mean
#  profit and loss in this game and nothing else. A face carrying either
#  would break that rule on every screen it appears on.
#
#  The mapping itself is measured in tools/palette_map.py against a hostile
#  input (an orange face on a bright green ground): 262,144 pixels, zero off
#  the ramp, endpoints landing on the target hexes.
#
#  NOTE: the colour arithmetic below is tested. The ComfyUI plumbing around
#  it - the tensor in, the tensor out - is not, because ComfyUI does not run
#  here. If it throws on the first Run, the error will be in the conversion,
#  not in the ramp.
# ============================================================================

import numpy as np

# ---------------------------------------------------------------------------
#  THE PALETTE, from src/core/theme.ts
# ---------------------------------------------------------------------------
INK = '#1C242C'          # the ground
BLUE_DEEP = '#0C6C9C'
BLUE = '#05A8F6'
BLUE_LIGHT = '#7DD3FC'
GREY = '#8C9494'
GREY_LIGHT = '#CFD0D2'
ORANGE = '#FFA94D'       # brand
VIOLET = '#C4B5FD'       # research

# Each ramp is (position 0..1, hex). Position 0 is deepest shadow, 1 is the
# brightest highlight. Three stops is enough; more just muddies the face.
#
# Several of them because sixty identical portraits are as flat as one. Split
# the cast by ramp - family cool, rivals steel, the board warm - and nothing
# still lands outside the game's world.
RAMPS = {
    'cool':   [(0.0, INK), (0.55, BLUE_DEEP), (1.0, BLUE_LIGHT)],
    'bright': [(0.0, INK), (0.50, BLUE),      (1.0, BLUE_LIGHT)],
    'warm':   [(0.0, INK), (0.55, BLUE_DEEP), (1.0, ORANGE)],
    'steel':  [(0.0, INK), (0.55, GREY),      (1.0, GREY_LIGHT)],
    'violet': [(0.0, INK), (0.55, BLUE_DEEP), (1.0, VIOLET)],
}


def _hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def build_lut(stops):
    """A 256 x 3 table: brightness in, colour out."""
    stops = sorted(stops, key=lambda s: s[0])
    xs = np.array([s[0] for s in stops], dtype=float) * 255.0
    cols = np.array([_hex_to_rgb(s[1]) for s in stops], dtype=float)
    grid = np.arange(256, dtype=float)
    return np.stack(
        [np.interp(grid, xs, cols[:, c]) for c in range(3)], axis=1,
    ).astype(np.uint8)


def luminance(rgb_float):
    """
    Rec. 709 luminance, then stretched to the full range.

    A plain channel average turns a saturated blue and a saturated orange
    into the SAME grey, so a face lit hard from one side flattens out and
    the modelling the whole portrait depends on is lost. Rec. 709 keeps it.

    The stretch matters as much: a sampler that returns a washed out 40..200
    would never touch either end of the ramp, and every portrait would come
    out muddy in the middle of it.

    `rgb_float` is H x W x 3 in 0..1. Returns H x W of uint8.
    """
    a = np.asarray(rgb_float, dtype=np.float32) * 255.0
    lum = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    lo, hi = np.percentile(lum, 1), np.percentile(lum, 99)
    if hi - lo < 1e-6:
        return np.zeros(lum.shape, dtype=np.uint8)
    return np.clip((lum - lo) / (hi - lo) * 255.0, 0, 255).astype(np.uint8)


def map_to_palette(rgb_float, ramp_name='cool', strength=1.0):
    """
    The whole job, on one H x W x 3 array in 0..1. Returns the same shape.

    `strength` below 1 blends back towards the original, which is only ever
    useful for judging what the mapping is doing. At 1 the output is the
    palette by construction.
    """
    lut = build_lut(RAMPS[ramp_name])
    mapped = lut[luminance(rgb_float)].astype(np.float32) / 255.0
    if strength >= 1.0:
        return mapped
    src = np.asarray(rgb_float, dtype=np.float32)
    s = float(np.clip(strength, 0.0, 1.0))
    return src * (1.0 - s) + mapped * s


# ---------------------------------------------------------------------------
#  THE COMFYUI NODE
# ---------------------------------------------------------------------------
#  ComfyUI hands images over as a torch tensor shaped [batch, H, W, 3] in
#  0..1. torch is imported inside the call rather than at module scope so
#  that the colour functions above stay importable and testable without it.
# ---------------------------------------------------------------------------

class SuccesorPaletteMap:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            'required': {
                'image': ('IMAGE',),
                'ramp': (sorted(RAMPS.keys()), {'default': 'cool'}),
                'strength': ('FLOAT', {
                    'default': 1.0, 'min': 0.0, 'max': 1.0, 'step': 0.05,
                }),
            },
        }

    RETURN_TYPES = ('IMAGE',)
    FUNCTION = 'apply'
    CATEGORY = 'Succesor'
    DESCRIPTION = (
        'Maps luminance onto a ramp built from the game palette. '
        'The incoming colours are discarded, so the output is the '
        'palette by construction rather than by prompting.'
    )

    def apply(self, image, ramp, strength):
        import torch
        out = []
        for i in range(image.shape[0]):
            frame = image[i].detach().cpu().numpy()
            out.append(map_to_palette(frame, ramp, strength))
        return (torch.from_numpy(np.stack(out).astype(np.float32)),)


NODE_CLASS_MAPPINGS = {'SuccesorPaletteMap': SuccesorPaletteMap}
NODE_DISPLAY_NAME_MAPPINGS = {'SuccesorPaletteMap': 'Succesor Palette Map'}
