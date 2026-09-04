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


def prompt_for(name: str, cast_id: str = '') -> str:
    """The cast are written by hand; everybody else comes off the hash."""
    if cast_id and cast_id in CAST_LOOKS:
        who = CAST_LOOKS[cast_id]
    else:
        a = appearance(name)
        who = ', '.join(x for x in [
            f"a person {a['age']}", a['build'], a['hair'], a['face_hair'],
            a['glasses'], a['attire'], a['extra'],
        ] if x)
    return f'{who},\n\n{BASE}'


def ramp_for(cast_id: str) -> str:
    """Which ramp a character carries. Strangers get the neutral one."""
    return RAMP_BY_ID.get(cast_id, 'steel')


# ===========================================================================
#  THE NAMED CAST, WHO ARE NOT STRANGERS
# ===========================================================================
#
#  The 153 in the poker pool are people you meet once, so a hash picking
#  their face is exactly right. The sixteen in src/data/story/cast.ts are
#  not: they are written characters with a stated voice, and deriving their
#  appearance from the letters of their name would be throwing that away.
#
#  So these are set by hand, off the tone lines in cast.ts. Arthur Vance
#  "has outlived four CEOs and expects to outlive you", so he is old and
#  buttoned up. Priya Raman "talks in what is possible in eighteen months",
#  so she is young and dressed like a lab rather than a board.
#
#  ---------------------------------------------------------------------------
#  AND FOUR OF THEM MUST NOT HAVE A FACE
#  ---------------------------------------------------------------------------
#  Not an oversight, a rule. "Unknown Number" is written as "no greeting, no
#  sign-off, every message a door left slightly open"; the whole effect is
#  that you do not know who it is. Halberd Partners is a fund, the Consumer
#  Safety Directorate is a division, the Field Office is a building. Give any
#  of them a portrait and the character is gone: an anonymous threat with a
#  face is just a man, and a process with a face is somebody you can argue
#  with.
#
#  They keep the initials-in-a-circle they already have, which is the right
#  picture of an institution.
# ===========================================================================

FACELESS = {
    'unknown': 'the whole point is that you do not know who it is',
    'vulture': 'a fund, not a person',
    'regulator': 'a division with letterhead',
    'fbi': 'a field office, not a face',
}

#  Which ramp a character carries, and why. The ramp is doing work here: it
#  says what KIND of person is looking at you before the name is read.
#
#      cool    family, your own blood
#      bright  the people inside your company who are with you
#      violet  research and the technical world
#      warm    money and rival power, lit by the brand's own orange
#      steel   process and institutions, owing you nothing
RAMP_BY_ID = {
    # THE PLAYER IS BRIGHT AND THEIR FAMILY IS COOL, which is the one place
    # the ramp is doing something other than sorting people into camps. You
    # are the only face that ever carries a screen alone - the profile
    # header, the home screen - and you should not read as one more Hale in
    # a row of Hales. Same palette, one step brighter.
    'player_male': 'bright', 'player_female': 'bright',
    'father': 'cool', 'brother': 'cool', 'heir': 'cool',
    'coo': 'bright', 'friend': 'bright',
    'cto': 'violet', 'openai': 'violet', 'hacker': 'violet',
    'pear': 'warm', 'edison': 'warm',
    'cfo': 'steel', 'swanson': 'steel',
}

#  Appearance, in the same silhouette vocabulary as the pools above.
CAST_LOOKS = {
    # ------------------------------------------------------------------
    #  YOU, TWICE, BECAUSE THE GAME ASKS
    # ------------------------------------------------------------------
    #  src/core/identity.ts declares `Gender = 'male' | 'female'` and the
    #  opening asks for it. One player portrait would show half the players
    #  somebody else, on the profile header, every session.
    #
    #  Deliberately plainer than the rest of the cast: no glasses, no
    #  moustache, no flat cap. The protagonist is the face the player brings
    #  themselves to, and a strong tic on it is a character they did not
    #  choose. It also keeps them clear of the brother, who owns the slicked
    #  hair and the square glasses.
    # ------------------------------------------------------------------
    'player_male': 'a person in their thirties, square jaw, '
                   'short cropped hair, clean shaven, no glasses, '
                   'dark suit and tie',
    'player_female': 'a person in their thirties, angular sharp cheekbones, '
                     'long hair swept to one side, no glasses, '
                     'dark suit and tie',

    'father': 'a person elderly, broad heavy jaw, receding hairline, '
              'clean shaven, no glasses, dark suit and tie',
    'brother': 'a person in their forties, angular sharp cheekbones, '
               'slicked back hair, clean shaven, thick square glasses, '
               'blazer over a plain shirt',
    'heir': 'a person in their late teens, narrow face, messy tousled hair, '
            'clean shaven, no glasses, open collar shirt, no tie',
    'cfo': 'a person in their sixties, long thin face, receding hairline, '
           'clean shaven, thin rectangular glasses, buttoned waistcoat',
    'coo': 'a person in their forties, square jaw, hair tied back in a bun, '
           'no glasses, plain work shirt',
    'cto': 'a person in their thirties, narrow face, '
           'shoulder length straight hair, no glasses, turtleneck sweater',
    'friend': 'a person in their forties, round full face, short curly hair, '
              'short stubble, no glasses, open collar shirt, no tie',
    'pear': 'a person in their fifties, angular sharp cheekbones, '
            'side parted hair, clean shaven, no glasses, dark suit and tie',
    'edison': 'a person in their sixties, broad heavy jaw, bald on top, '
              'thick moustache, no glasses, plain work shirt',
    'openai': 'a person in their thirties, narrow face, straight bob cut, '
              'clean shaven, thin rectangular glasses, turtleneck sweater',
    'swanson': 'a person in their sixties, long thin face, short cropped hair, '
               'clean shaven, heavy black frames, buttoned waistcoat',
    'hacker': 'a person in their thirties, narrow face, shaved head, '
              'short stubble, heavy black frames, high collared coat',
}


#  The player is not in cast.ts - they are the person holding the phone -
#  so they are added to the roster here rather than read from it.
PLAYER = {
    'player_male': 'You (male)',
    'player_female': 'You (female)',
}


def read_cast() -> dict:
    """{id: name} out of src/data/story/cast.ts, plus the player."""
    path = os.path.join(HERE, '..', 'src', 'data', 'story', 'cast.ts')
    try:
        src = open(path, encoding='utf8').read()
    except OSError:
        return {}
    out = {}
    for m in re.finditer(r"\n    (\w+): \{(.*?)\n    \},", src, re.S):
        key, body = m.group(1), m.group(2)
        nm = re.search(r"name:\s*'((?:[^'\\]|\\.)*)'", body)
        if nm:
            out[key] = nm.group(1).replace("\\'", "'")
    return {**PLAYER, **out}


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
    ap.add_argument('--cast', action='store_true',
                    help='the named cast, with the ramp each one carries')
    ap.add_argument('--id', help='a cast id such as brother or cfo')
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

    cast = read_cast()

    if args.cast:
        print(f'{"id":10s} {"name":26s} {"ramp":7s} file')
        print('-' * 72)
        for cid, nm in cast.items():
            if cid in FACELESS:
                print(f'{cid:10s} {nm:26s} {"-":7s} YUZ YOK: {FACELESS[cid]}')
            else:
                print(f'{cid:10s} {nm:26s} {ramp_for(cid):7s} assets/portraits/{cid}.png')
        drawn = [c for c in cast if c not in FACELESS]
        print(f'\n{len(drawn)} portre, {len(FACELESS)} yuzsuz, {len(cast)} kadro')
        return 0

    if args.id:
        cid = args.id
        if cid in FACELESS:
            print(f'{cid}: bu karaktere portre YAPMA. {FACELESS[cid]}')
            return 1
        if cid not in cast:
            print(f'{cid} kadroda yok. --cast ile listeye bak.')
            return 1
        print(f'# {cast[cid]}  ->  ramp {ramp_for(cid)}  ->  assets/portraits/{cid}.png\n')
        print(prompt_for(cast[cid], cid))
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
