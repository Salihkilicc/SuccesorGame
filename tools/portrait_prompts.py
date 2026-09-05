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



# ===========================================================================
#  WHO IS A WOMAN, WHICH THE PROMPT WAS NOT SAYING AT ALL
# ===========================================================================
#
#  Every prompt began "a person", which reads as neutral and is not. The
#  model resolves it to a man essentially always, and "dark suit and tie"
#  pushes the same way. Reported from the other end: asking for the female
#  player produced a long haired man.
#
#  The consequence was much wider than one portrait. The poker pool is 153
#  names from fifteen regions and 74 of them are women; the cast has Dana
#  Whitfield, Priya Raman and Eleanor Ratliff. Every one of them would have
#  come back male, and the poker seat prints the NAME beside the face, so
#  "Hanna Virtanen" would have sat there with a beard.
#
#  Listed by full name rather than guessed from the first name at runtime,
#  because no rule survives fifteen naming traditions: "Andrea" is a man in
#  Italy, "Nguyen Thi Lan" is marked female by the middle name and not the
#  first, "Ji-woo" is used both ways.
#
#  SOME OF THESE ARE GENUINELY UNISEX and I have made a call rather than
#  leaving them to default male. Marked below. If one reads wrong to you,
#  move the name and regenerate: nothing else depends on it.
# ===========================================================================

FEMALE = {
    # nordic
    'Hanna Virtanen', 'Sigrid Dahl', 'Elin Bjornsson', 'Ingrid Halvorsen',
    # britishIsles
    'Niamh Gallagher', 'Fiona Blackwood', 'Sinead Doherty',
    # westernEurope
    'Claire Dubois', 'Sofia Marchetti', 'Rosa Iglesias', 'Greta Hoffmann',
    'Lena Brandt', 'Anouk Visser',
    # easternEurope
    'Ana Petrescu', 'Milena Horvat', 'Katarzyna Zielinska',
    'Iryna Kovalenko', 'Zsofia Balogh',
    # mediterranean
    'Eleni Stavrou', 'Zeynep Aksoy', 'Beatriz Alves', 'Selin Korkmaz',
    'Ines Cardoso',
    # middleEast
    'Leila Haddad', 'Dalia Mansour', 'Nadia Khoury', 'Yara Kassab',
    'Mona Sleiman',
    # persianCentralAsia
    'Roya Tabrizi', 'Aigerim Sultanova', 'Parisa Golzar', 'Nargiz Aliyeva',
    # southAsia
    'Priya Nair', 'Fatima Siddiqui', 'Nilanthi Perera', 'Ananya Bose',
    'Kavya Rajan',
    # eastAsia   (Ji-woo, Yuki and Sora are used both ways; called female)
    'Mei Chen', 'Ji-woo Han', 'Yuki Morimoto', 'Seo-yeon Baek',
    'Wen Xiaoling', 'Sora Nakagawa', 'Fang Yuwen',
    # southeastAsia   (Thi in Nguyen Thi Lan is the female marker)
    'Nguyen Thi Lan', 'Dewi Kusuma', 'Aina Rahim', 'Siti Nurhaliza',
    'Pornthip Chaiya',
    # westAfrica
    'Grace Okonkwo', 'Aminata Diallo', 'Yaa Mensah', 'Adaeze Nwosu',
    'Mariam Cisse',
    # eastAfrica   (Zawadi is unisex Swahili; called female)
    'Zawadi Mwangi', 'Hodan Warsame', 'Neema Kimani', 'Selamawit Haile',
    'Rehema Otieno',
    # southernAfrica   (Lerato is unisex Sotho; called female)
    'Lerato Khumalo', 'Anneke Botha', 'Naledi Moyo', 'Refilwe Mokoena',
    # latinAmerica
    'Camila Ferreira', 'Valentina Cruz', 'Luana Barbosa', 'Paola Quispe',
    'Renata Aguilar', 'Yamila Duarte',
    # northAmericaPacific   (Dana and Harper are unisex; called female)
    'Dana Kealoha', 'Aroha Waitoa', 'Tiare Moala', 'Harper Vandermeer',
    'Elodie Tremblay',
}

#  The named cast, set by hand off cast.ts rather than by any rule.
CAST_FEMALE = {'coo', 'cto', 'swanson', 'openai',
               'player_female',
               *(f'heir_f_{i:02d}' for i in range(1, 11)),
               'npc-elena-vance', 'npc-sarah-jen'}

#  Pools that cannot be shared. A hairline recedes on a man in this
#  vocabulary and a tie is a man's tie; everything else (age, jaw, glasses,
#  the small extras) reads the same either way and stays common.
HAIR_F = [
    'short cropped hair', 'shoulder length straight hair',
    'hair tied back in a bun', 'short curly hair', 'straight bob cut',
    'long hair swept to one side', 'tight coiled hair',
    'hair pulled back tightly', 'thick wavy hair', 'blunt fringe',
]

ATTIRE_F = [
    'dark tailored blazer', 'open collar shirt',
    'high collared coat', 'turtleneck sweater',
    'blazer over a plain shirt', 'buttoned waistcoat',
    'wide lapel jacket', 'plain work shirt',
]


def is_female(name: str, cast_id: str = '') -> bool:
    return (cast_id in CAST_FEMALE) or (name in FEMALE)


def appearance(name: str, female: bool = False) -> dict:
    return {
        'age': pick(AGE, name, 'age'),
        'build': pick(BUILD, name, 'build'),
        'hair': pick(HAIR_F if female else HAIR, name, 'hair'),
        # A woman is clean shaven, so that slot carries nothing rather than
        # a word the model can misread.
        'face_hair': '' if female else pick(FACE_HAIR, name, 'face_hair'),
        'glasses': pick(GLASSES, name, 'glasses'),
        'attire': pick(ATTIRE_F if female else ATTIRE, name, 'attire'),
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

# ---------------------------------------------------------------------------
#  I WEIGHTED ALL OF THIS AND IT MADE IT WORSE, SO IT IS BACK
# ---------------------------------------------------------------------------
#  One portrait came back too smooth, so I raised the weights on every style
#  term and added anti-smooth words to the negative. The next one came back
#  as a pulp comic cover: ink splattered background, exaggerated hair, an
#  angry face. Overcorrected past the target in one step.
#
#  The plain reading is that this file is the same mistake as autocrop. Four
#  portraits were already right - father, brother, cfo, player_male - and
#  they were made with the UNWEIGHTED text below. I kept adding to a thing
#  that worked, one reasonable sounding step at a time, and each step took
#  emphasis from the step before it until the prompt was arguing with
#  itself.
#
#  So this is exactly what produced the four that were kept, and the rule
#  for anything that comes out wrong from here is to change ONE line and
#  look, rather than to raise a weight and add three words.
#
#  ONE line has since changed, under that rule. Reported as "the brush is
#  slightly off, otherwise good": `bold thick outlines` now carries 1.3.
#  Nothing else moved, no word was added, and if the next one is still soft
#  the answer is 1.4 on that same term. The four kept portraits were made at
#  no weight at all, so regenerating one now would come back marginally
#  bolder, which is the direction asked for anyway.
# ---------------------------------------------------------------------------
#  Reported as "this one is not hand drawn like the others, it is too smooth,
#  it looks like AI". Correct: the first portraits had thick ink lines and
#  flat planes and this one came back airbrushed.
#
#  Nothing about the style words changed. What changed is how many OTHER
#  words are in the prompt beside them. Adding the gender lead, the female
#  hair and attire, the collar and the glasses pushed the token count up, and
#  emphasis in a prompt is a share of a fixed budget: every word added takes
#  weight away from every word already there. The style was being outvoted by
#  its own prompt.
#
#  So the terms that define the look are weighted rather than merely present.
#  They have to win an argument, not just be in the room.
# ---------------------------------------------------------------------------

BASE = """flat vector portrait, (bold thick outlines:1.3), (flat color:1.4),
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
    female = is_female(name, cast_id)
    if cast_id and cast_id in CAST_LOOKS:
        who = CAST_LOOKS[cast_id]
    else:
        a = appearance(name, female)
        # WEIGHTED, because the plain word is not enough. "a woman" alone
        # still came back as a man often enough to matter; the emphasis and
        # the second term together hold it.
        lead = f"(a woman:1.4), (female:1.3) {a['age']}" if female \
            else f"(a man:1.3) {a['age']}"
        who = ', '.join(x for x in [
            lead, a['build'], a['hair'], a['face_hair'],
            a['glasses'], a['attire'], a['extra'],
        ] if x)
    return f'{who},\n\n{BASE}'


def negative_for(name: str, cast_id: str = '') -> str:
    """
    The shared negative, plus the push away from the wrong gender.

    This has to live in the negative as well as the positive. Asking for a
    woman and getting a long haired man is the model reaching for what it
    saw most of; naming that outcome is what stops it.
    """
    if is_female(name, cast_id):
        return NEGATIVE + (
            '\n\n(man:1.4), (male:1.3), masculine face, beard, moustache,\n'
            'stubble, necktie, receding hairline, bald,\n\n'
            'bare shoulders, strapless, evening gown, glamour, fashion model,\n'
            'heavy makeup, long eyelashes, pin up,\n\n'
            # The second drift, named the same way the first one was. These
            # are the words for "somebody who works for the boss".
            'doe eyed, wide innocent eyes, girlish, cute, ingenue,\n'
            'student, nurse, doctor, lab coat, scrubs, timid,\n'
            'big round glasses, loose flowing hair, windswept hair,\n'
            'ink splatter, paint splatter, busy background, comic cover'
        )
    return NEGATIVE + '\n\n(woman:1.3), (female:1.2), long flowing hair'


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
    # The heir is a Child, and Child.gender is 'Male' | 'Female' in
    # useFamilyStore. Same shape of bug as the player, found the same way:
    # by listing the roster and asking what a single file would show half
    # the players. Two portraits, and the child who takes over is the one
    # whose portrait the profile header switches to.
    **{f'heir_m_{i:02d}': 'cool' for i in range(1, 11)},
    **{f'heir_f_{i:02d}': 'cool' for i in range(1, 11)},
    'father': 'cool', 'brother': 'cool',
    'coo': 'bright', 'friend': 'bright',
    'cto': 'violet', 'openai': 'violet', 'hacker': 'violet',
    'pear': 'warm', 'edison': 'warm',
    'cfo': 'steel', 'swanson': 'steel',
    # The board is outside capital sitting at your own table. Warm is the
    # ramp for money that is not yours, which is what every one of them is.
    'npc-marcus-wolf': 'warm', 'npc-elena-vance': 'warm',
    'npc-victor-k': 'warm', 'npc-sarah-jen': 'warm',
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
    'player_male': '(a man:1.3) in his thirties, square jaw, '
                   'short cropped hair, clean shaven, no glasses, '
                   'dark suit and tie',
    # Glasses and a collar were asked for after seeing the first pass: it
    # came back reading as a fashion portrait rather than somebody who runs
    # a company. The collar is what does most of that work, and it survives
    # the circle mask because it sits right under the chin.
    # THE THIRD PASS, and the note is the useful part. Asked for a chief
    # executive and got, twice, somebody who works for one: first a fashion
    # portrait, then "she looks like a doctor".
    #
    # The words that were doing it are not the ones you would suspect. Round
    # glasses, wide eyes and loose flowing hair together read as young and
    # deferential no matter what the clothes say, and "in her thirties" was
    # letting the model pick the youngest reading of it. Authority is carried
    # by AGE, by CONTROL - hair that is deliberately restrained rather than
    # styled - and by a level gaze, and only then by the suit.
    #
    # Pulled back hair also survives the circle at 46 pixels, where a loose
    # mane is one dark blob filling half of it.
    #  Third pass, and the lesson is that authority is worn, not shouted.
    #  "(chief executive:1.3), (commanding presence:1.3)" produced a scowling
    #  comic villain; the same person described plainly reads as somebody who
    #  runs things. Age and restrained hair do the work, in ordinary words.
    #  FOURTH PASS, and this time the difference was countable rather than
    #  aesthetic. Side by side, the four kept portraits are built from
    #  faceted planes and she was built from smooth surfaces and fine line
    #  detail. It looked like a brush problem. It was a length problem:
    #
    #      brother        21 words of description
    #      father         16
    #      cfo            17
    #      player_male    18
    #      player_female  27   <- 26% of the prompt, against their 19%
    #
    #  Style got 74% of her prompt and 81% of theirs, and that gap is the
    #  whole visible difference. Every extra descriptor she carried - the
    #  second gender term, the jawline, "crisp", "tailored" - was taken out
    #  of the thing that makes them look like one set.
    #
    #  So she is cut to their length rather than shouted louder. Same fix as
    #  the last two, arrived at from the other end: the answer to a diluted
    #  prompt is fewer words, never more weight.
    'player_female': '(a woman:1.4), (female:1.3) in her forties, '
                     'sharp cheekbones, hair pulled back tightly, '
                     'thin rectangular glasses, dark suit and white collar',

    'father': 'a person elderly, broad heavy jaw, receding hairline, '
              'clean shaven, no glasses, dark suit and tie',
    'brother': 'a person in their forties, angular sharp cheekbones, '
               'slicked back hair, clean shaven, thick square glasses, '
               'blazer over a plain shirt',
    'cfo': 'a person in their sixties, long thin face, receding hairline, '
           'clean shaven, thin rectangular glasses, buttoned waistcoat',
    'coo': '(a woman:1.4), (female:1.3) in her forties, square jaw, '
           'hair tied back in a bun, no glasses, collared work shirt',
    'cto': '(a woman:1.4), (female:1.3) in her thirties, narrow face, '
           'shoulder length straight hair, no glasses, high collared turtleneck',
    'friend': 'a person in their forties, round full face, short curly hair, '
              'short stubble, no glasses, open collar shirt, no tie',
    'pear': 'a person in their fifties, angular sharp cheekbones, '
            'side parted hair, clean shaven, no glasses, dark suit and tie',
    'edison': 'a person in their sixties, broad heavy jaw, bald on top, '
              'thick moustache, no glasses, plain work shirt',
    'openai': '(a woman:1.4), (female:1.3) in her thirties, narrow face, '
              'straight bob cut, thin rectangular glasses, turtleneck sweater',
    'swanson': '(a woman:1.4), (female:1.3) in her sixties, long thin face, short cropped hair, heavy black frames, buttoned waistcoat',
    'hacker': 'a person in their thirties, narrow face, shaved head, '
              'short stubble, heavy black frames, high collared coat',

    # The board. Four silhouettes that cannot be confused with each other or
    # with the executives, because these are the faces you argue with.
    'npc-marcus-wolf': 'a person in their fifties, broad heavy jaw, '
                       'slicked back hair, clean shaven, no glasses, '
                       'dark suit and tie',
    'npc-elena-vance': '(a woman:1.4), (female:1.3) in her fifties, '
                       'angular sharp cheekbones, hair tied back tightly, '
                       'thin rectangular glasses, dark suit and white collar',
    'npc-victor-k': 'a person in their sixties, long thin face, shaved head, '
                    'thick moustache, heavy black frames, high collared coat',
    'npc-sarah-jen': '(a woman:1.4), (female:1.3) in her forties, '
                     'round full face, straight bob cut, no glasses, '
                     'blazer over a collared shirt',
}


#  The player is not in cast.ts - they are the person holding the phone -
#  so they are added to the roster here rather than read from it.
PLAYER = {
    'player_male': 'You (male)',
    'player_female': 'You (female)',
}

#  The heir is in cast.ts as one entry, but the child who inherits has a
#  gender, so the single entry is split on the way through.
# ---------------------------------------------------------------------------
#  TEN AND TEN, BECAUSE ONE HEIR IS NOT A RANDOM HEIR
# ---------------------------------------------------------------------------
#  I had this as two files, one per gender, and that was wrong. The number of
#  children is not fixed and which one inherits is not decided in advance, so
#  a single face per gender would mean every run's successor looked like
#  every other run's. The randomness would be a claim rather than a fact.
#
#  Ten each. The child who takes over draws one from their own id, so the
#  same child is the same face for the whole of their generation, and two
#  different playthroughs get different heirs.
#
#  Their looks come off the SAME hash as the poker pool, but from teenage
#  pools: no receding hairlines, no beards, no waistcoats. They are sixteen
#  or a little older and they should read as somebody's child.
# ---------------------------------------------------------------------------

HEIR_COUNT = 10

HAIR_TEEN_M = [
    'messy tousled hair', 'short cropped hair', 'buzz cut',
    'thick wavy hair', 'short curly hair', 'side parted hair',
    'shaved head', 'slicked back hair', 'tight coiled hair',
    'long hair swept to one side',
]

HAIR_TEEN_F = [
    'hair tied back in a bun', 'shoulder length straight hair',
    'straight bob cut', 'short curly hair', 'long hair swept to one side',
    'tight coiled hair', 'messy tousled hair', 'hair pulled back tightly',
    'blunt fringe', 'short cropped hair',
]

ATTIRE_TEEN = [
    'open collar shirt', 'plain t shirt under a jacket',
    'hooded sweatshirt', 'crew neck sweater', 'collared school shirt',
    'plain work shirt', 'blazer over a plain shirt', 'turtleneck sweater',
]

#  Weighted towards none: a teenager in glasses is a choice, not a default.
GLASSES_TEEN = [
    'no glasses', 'no glasses', 'no glasses', 'no glasses',
    'round wire glasses', 'thin rectangular glasses', 'heavy black frames',
]


def heir_look(cid: str, female: bool) -> str:
    """A different child every time, from the id, deterministically."""
    lead = ('(a young woman:1.4), (female:1.3) in her late teens' if female
            else '(a young man:1.3) in his late teens')
    return ', '.join([
        lead,
        pick(BUILD, cid, 'build'),
        pick(HAIR_TEEN_F if female else HAIR_TEEN_M, cid, 'hair'),
        pick(GLASSES_TEEN, cid, 'glasses'),
        pick(ATTIRE_TEEN, cid, 'attire'),
    ])


# ---------------------------------------------------------------------------
#  AND THE BOARD HAS THE SAME PROBLEM, FOUND THE SAME WAY
# ---------------------------------------------------------------------------
#  boardSuccession.ts already replaces every director each generation: the
#  seat and the family stay, the person does not. The new id is
#  `npc-elena-vance::g2` and the new name is the same surname with a first
#  name drawn from SUCCESSOR_FIRST_NAMES.
#
#  So board ids are unbounded exactly like children's, and four fixed
#  portraits would have shown generation two the same four faces their
#  parents had. Same fix: a pool, drawn from the id, so a given director in a
#  given generation is always the same face.
#
#  A TRAP WORTH WRITING DOWN. SUCCESSOR_FIRST_NAMES looks like it alternates
#  male, female, male, female all the way down - Adrian, Beatrice, Caleb,
#  Delia - and it does for twenty two entries and then stops: Wendell and
#  Yusuf are adjacent and both male. Anything that picked a gender from the
#  index being odd would put a woman's face on Yusuf Vance. The app has to
#  read the NAME, not the position.
#
#  Ten each is enough: four seats, and a dynasty that runs ten generations
#  before a face repeats has bigger things to notice.
# ---------------------------------------------------------------------------

BOARD_POOL_COUNT = 10

#  Directors, not executives: older, heavier, dressed for a boardroom. Kept
#  clear of the named four so a successor never looks like the parent's twin.
ATTIRE_BOARD = [
    'dark suit and tie', 'buttoned waistcoat', 'wide lapel jacket',
    'high collared coat', 'blazer over a collared shirt',
    'dark suit and white collar',
]

AGE_BOARD = [
    'in their forties', 'in their fifties', 'in their sixties', 'elderly',
]


def board_look(cid: str, female: bool) -> str:
    """One director, from the id. Adult, corporate, and not a twin."""
    lead = ('(a woman:1.4), (female:1.3) ' if female else '(a man:1.3) ')
    parts = [
        lead + pick(AGE_BOARD, cid, 'age'),
        pick(BUILD, cid, 'build'),
        pick(HAIR_F if female else HAIR, cid, 'hair'),
    ]
    if not female:
        parts.append(pick(FACE_HAIR, cid, 'face_hair'))
    parts += [pick(GLASSES, cid, 'glasses'), pick(ATTIRE_BOARD, cid, 'attire')]
    return ', '.join(parts)


BOARD_POOL = {
    **{f'board_m_{i:02d}': f'Director, man {i}'
       for i in range(1, BOARD_POOL_COUNT + 1)},
    **{f'board_f_{i:02d}': f'Director, woman {i}'
       for i in range(1, BOARD_POOL_COUNT + 1)},
}


HEIR_SPLIT = {
    **{f'heir_m_{i:02d}': f'Successor, boy {i}' for i in range(1, HEIR_COUNT + 1)},
    **{f'heir_f_{i:02d}': f'Successor, girl {i}' for i in range(1, HEIR_COUNT + 1)},
}

#  Filled in here rather than inside CAST_LOOKS because the teenage pools are
#  defined below it, and one table read from top to bottom beats two tables
#  that have to be kept in the same order.
for _i in range(1, HEIR_COUNT + 1):
    CAST_LOOKS[f'heir_m_{_i:02d}'] = heir_look(f'heir_m_{_i:02d}', False)
    CAST_LOOKS[f'heir_f_{_i:02d}'] = heir_look(f'heir_f_{_i:02d}', True)

for _i in range(1, BOARD_POOL_COUNT + 1):
    CAST_LOOKS[f'board_m_{_i:02d}'] = board_look(f'board_m_{_i:02d}', False)
    CAST_LOOKS[f'board_f_{_i:02d}'] = board_look(f'board_f_{_i:02d}', True)
    RAMP_BY_ID[f'board_m_{_i:02d}'] = 'warm'
    RAMP_BY_ID[f'board_f_{_i:02d}'] = 'warm'
    CAST_FEMALE.add(f'board_f_{_i:02d}')

# ---------------------------------------------------------------------------
#  THE BOARD, WHICH IS FIXED AND WAS NOT ON THE LIST
# ---------------------------------------------------------------------------
#  Asked as "what about the board, and does my child's board change?". It
#  does not. useShareholderStore seats five people and they are the same five
#  in every run and in every generation: these four and Julian Hale, who is
#  already drawn as `brother`.
#
#  There IS an appointDirectorFromNetwork, which would put a stranger on the
#  board and would have made this a pool rather than a list. It is called
#  from nowhere - governance.ts already carries a note saying so - so the
#  board is four portraits and no mechanism can add a fifth.
#
#  Ids are the store's own, so the app can look a member up by the id it
#  already holds rather than by matching a name.
# ---------------------------------------------------------------------------
BOARD = {
    'npc-marcus-wolf': "Marcus 'The Wolf'",
    'npc-elena-vance': 'Elena Vance',
    'npc-victor-k': 'Victor K.',
    'npc-sarah-jen': 'Sarah Jen',
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
    out.pop('heir', None)
    return {**PLAYER, **HEIR_SPLIT, **BOARD, **BOARD_POOL, **out}


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
