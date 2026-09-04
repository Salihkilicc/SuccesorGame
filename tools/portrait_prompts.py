#!/usr/bin/env python3
"""
portrait_prompts.py - one prompt per character, derived from their name.

============================================================================
 WHY THE VARIETY IS ALL SILHOUETTE
============================================================================

 The obvious way to make sixty portraits differ is to vary skin, hair and
 eye colour. In this game that is wasted work, twice over.

 First, the palette map throws colour away by design: every portrait is
 mapped onto a three stop ramp, so a redhead and a brunette arrive at the
 same blue. Second, these are shown as circles between 44 and 80 points
 across, and at 46 the only information that survives is large shapes.

 So the pools below vary SILHOUETTE: the outline of the hair, whether there
 are glasses and what shape, facial hair, collar and headwear, the weight of
 the jaw. Those are the things still legible at 46 pixels in one colour,
 which makes them the only things worth spending prompt tokens on.

 The appearance is derived from the name with the SAME hash the app uses for
 avatarHue, so a character's portrait and the coloured circle they fall back
 to are two views of one number, and re-running this never reshuffles the
 cast.

 The name pools are READ OUT of the app, not copied, so the roster here and
 the roster in the game cannot drift apart.

============================================================================
 USAGE
============================================================================

     python3 tools/portrait_prompts.py --list
     python3 tools/portrait_prompts.py "Yusuf Demir"
     python3 tools/portrait_prompts.py --all --out prompts/
     python3 tools/portrait_prompts.py --all --csv > cast.csv
"""

import argparse
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
POKER_TABLE = os.path.join(HERE, '..', 'src', 'core', 'casino', 'pokerTable.ts')


# ---------------------------------------------------------------------------
#  TWO HASHES, AND THE SECOND ONE EXISTS BECAUSE THE FIRST WAS MEASURED
# ---------------------------------------------------------------------------
#  `name_hash` mirrors avatarHue in src/core/casino/pokerTable.ts exactly.
#  It is what gives a character their circle colour in the app, so it stays.
#
#  It is NOT good enough to pick appearance from. It ends in `% 360`, so it
#  has 360 buckets, and the roster is 153 people needing seven traits each.
#  Measured with every trait picked from it: only 119 of 153 faces were
#  distinct, and THIRTY pairs came out completely identical - same age, jaw,
#  hair, beard, glasses, clothes. Two strangers at the same poker table
#  looking like the same man is the failure this whole file exists to avoid.
#
#  So traits come from a wide hash (FNV-1a, 2^32 buckets) over the name AND
#  the trait, which also decorrelates the traits from each other: under the
#  old scheme the same 360 value shifted by a constant drove all seven, so
#  they moved together.
# ---------------------------------------------------------------------------

def name_hash(s: str) -> int:
    """avatarHue, exactly. The circle colour, not the face."""
    h = 0
    for ch in s or '':
        h = (h * 31 + ord(ch)) % 360
    return h


def wide_hash(s: str) -> int:
    """FNV-1a. Wide enough that 153 people do not collide seven ways."""
    h = 2166136261
    for ch in s or '':
        h = ((h ^ ord(ch)) * 16777619) % 4294967296
    return h


def pick(pool: list, key: str, trait: str) -> str:
    """Deterministic choice. The trait name is hashed in, so traits differ."""
    return pool[wide_hash(f'{key}:{trait}') % len(pool)]


# ---------------------------------------------------------------------------
#  THE POOLS
# ---------------------------------------------------------------------------
#  Every entry has to change the OUTLINE. "kind eyes" is not in here, because
#  at 46 pixels there are no eyes to be kind. "shaved head" is, because it
#  changes the shape of the top of the circle.
# ---------------------------------------------------------------------------

HAIR = [
    'short cropped hair', 'shaved head', 'slicked back hair',
    'thick wavy hair', 'receding hairline', 'bald on top',
    'shoulder length straight hair', 'hair tied back in a bun',
    'short curly hair', 'buzz cut', 'side parted hair',
    'tight coiled hair', 'long hair swept to one side',
    'straight bob cut', 'messy tousled hair',
]

FACE_HAIR = [
    'clean shaven', 'clean shaven', 'clean shaven',
    'full beard', 'neat goatee', 'thick moustache',
    'short stubble', 'long beard', 'sideburns',
]

GLASSES = [
    'no glasses', 'no glasses', 'no glasses',
    'round wire glasses', 'thick square glasses',
    'thin rectangular glasses', 'heavy black frames',
]

AGE = [
    'in their late twenties', 'in their thirties', 'in their forties',
    'in their fifties', 'in their sixties', 'elderly',
]

BUILD = [
    'narrow face', 'broad heavy jaw', 'long thin face',
    'round full face', 'angular sharp cheekbones', 'square jaw',
]

ATTIRE = [
    'dark suit and tie', 'open collar shirt, no tie',
    'high collared coat', 'turtleneck sweater',
    'blazer over a plain shirt', 'buttoned waistcoat',
    'wide lapel jacket', 'plain work shirt',
]

EXTRA = [
    '', '', '', '',
    'small earring', 'scarf around the neck', 'flat cap',
    'collar pin', 'headscarf',
]


def appearance(name: str) -> dict:
    return {
        'age': pick(AGE, name, 'age'),
        'build': pick(BUILD, name, 'build'),
        'hair': pick(HAIR, name, 'hair'),
        'face_hair': pick(FACE_HAIR, name, 'face_hair'),
        'glasses': pick(GLASSES, name, 'glasses'),
        'attire': pick(ATTIRE, name, 'attire'),
        'extra': pick(EXTRA, name, 'extra'),
    }


# ---------------------------------------------------------------------------
#  THE FRAMING, WHICH IS THE PART THAT KEPT GOING WRONG
# ---------------------------------------------------------------------------
#  An earlier prompt asked for "generous headroom" so the mask would not eat
#  a chin. The model obliged by backing the camera off until the head filled
#  a third of the frame, and since the circle crop takes the CENTRE, the mask
#  then landed on a necktie.
#
#  Both failures are the same axis, so both are stated as one constraint: the
#  head fills most of the frame AND nothing is cut. Repeated in the negative
#  from the other side, because the model listens to that more.
# ---------------------------------------------------------------------------

BASE = """flat vector portrait, bold thick outlines, (flat color:1.4),
(no gradient:1.3), 2 tone shading, posterized, limited palette,
cut paper look, poster art, screen print, clean geometric shapes,

(close up portrait:1.4), (head fills the frame:1.4), tight crop,
head and top of shoulders only, chin and top of hair inside the frame,
centered,

(head turned to the right:1.5), (three-quarter profile view:1.4),
(looking to the side:1.3), one ear visible,

calm neutral expression, plain solid background,
sharp edges, crisp vector lines"""

NEGATIVE = """anime, manga, chibi, big eyes, anime style,

(full body:1.4), (waist up:1.3), wide shot, distant, small head,
lots of empty background, torso, chest, hands, arms,

gradient, soft shading, airbrush, smooth shading, rendered, painterly,
photorealistic, photograph, detailed hair strands, individual hair,
stubble texture, skin texture, pores, volumetric light,

(frontal view:1.4), (looking at viewer:1.4), (symmetrical face:1.3),
eye contact, straight on, back of head,

silhouette, featureless face, blank face, multiple people, crowd,
cropped head, cut off chin, head touching edge, off-center, tilted,
text, watermark, signature, logo, frame, border, blurry, low detail,
deformed face, extra eyes, asymmetric eyes, wrinkles, scowl, angry"""


def prompt_for(name: str) -> str:
    a = appearance(name)
    who = ', '.join(x for x in [
        f"a person {a['age']}", a['build'], a['hair'], a['face_hair'],
        a['glasses'], a['attire'], a['extra'],
    ] if x)
    return f'{who},\n\n{BASE}'


# ---------------------------------------------------------------------------
#  THE ROSTER, READ OUT OF THE APP
# ---------------------------------------------------------------------------

def read_names() -> dict:
    """{region: [names]} straight out of STRANGER_REGIONS."""
    try:
        src = open(POKER_TABLE, encoding='utf8').read()
    except OSError:
        print(f'could not read {POKER_TABLE}', file=sys.stderr)
        return {}
    m = re.search(r'STRANGER_REGIONS[^=]*=\s*\{(.*?)\n\};', src, re.S)
    if not m:
        return {}
    out = {}
    for region, body in re.findall(r"(\w+):\s*\[(.*?)\]", m.group(1), re.S):
        names = re.findall(r"'([^']+)'", body)
        if names:
            out[region] = names
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description='Portrait prompts, one per character.')
    ap.add_argument('name', nargs='?', help='a single character')
    ap.add_argument('--all', action='store_true', help='every name in the app')
    ap.add_argument('--list', action='store_true', help='just show the roster')
    ap.add_argument('--out', help='write one .txt per character into this folder')
    ap.add_argument('--csv', action='store_true', help='name and traits, as csv')
    ap.add_argument('--negative', action='store_true', help='print the negative and stop')
    args = ap.parse_args()

    if args.negative:
        print(NEGATIVE)
        return 0

    regions = read_names()
    everyone = [n for names in regions.values() for n in names]

    if args.list:
        for region, names in regions.items():
            print(f'{region:16s} {len(names):3d}  {", ".join(names[:3])} ...')
        print(f'\n{len(everyone)} names in {len(regions)} regions')
        return 0

    if args.name:
        print(prompt_for(args.name))
        return 0

    if not args.all:
        ap.print_help()
        return 1

    if args.csv:
        print('name,age,build,hair,face_hair,glasses,attire,extra')
        for n in everyone:
            a = appearance(n)
            print(','.join([n] + [a[k].replace(',', ' ') for k in
                                  ('age', 'build', 'hair', 'face_hair',
                                   'glasses', 'attire', 'extra')]))
        return 0

    if args.out:
        os.makedirs(args.out, exist_ok=True)
        for n in everyone:
            slug = re.sub(r'[^a-z0-9]+', '_', n.lower()).strip('_')
            with open(os.path.join(args.out, f'{slug}.txt'), 'w', encoding='utf8') as fh:
                fh.write(prompt_for(n))
        print(f'{len(everyone)} prompt(s) -> {args.out}')
        return 0

    for n in everyone:
        print(f'=== {n} ===\n{prompt_for(n)}\n')
    return 0


if __name__ == '__main__':
    sys.exit(main())
