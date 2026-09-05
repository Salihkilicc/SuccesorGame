#!/usr/bin/env python3
"""
batch_portraits.py - draw the whole poker pool without sitting there.

============================================================================
 WHAT THIS IS FOR
============================================================================

 The named cast is fifteen people who get looked at one at a time, because
 they are characters and a wrong one is worth rejecting. The poker pool is
 153 strangers who appear for a few seconds beside their own name, and
 nobody is going to judge them individually. That is a job for a machine.

 ComfyUI serves an HTTP API on the same port as its interface, so this
 queues every prompt, waits, collects the image, maps it onto the right
 ramp and writes it out under the character's id. Start it and leave.

 Roughly forty five seconds a portrait, so about two hours for the pool.

============================================================================
 USAGE
============================================================================

     python3 tools/batch_portraits.py --dry-run          # print, send nothing
     python3 tools/batch_portraits.py --limit 3          # try three first
     python3 tools/batch_portraits.py                    # the whole pool
     python3 tools/batch_portraits.py --cast             # the named cast
     python3 tools/batch_portraits.py --sheet            # contact sheet only

 It RESUMES. Anything already written is skipped, so a run that dies at
 portrait ninety picks up at ninety one.
"""

import argparse
import io
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import portrait_prompts as PP           # noqa: E402
import palette_map as PM                # noqa: E402

OUT_DIR = os.path.join(HERE, '..', 'assets', 'portraits')
RAW_DIR = os.path.join(OUT_DIR, '_ham')
SERVER = '127.0.0.1:8188'

# ---------------------------------------------------------------------------
#  SETTINGS, THE ONES THAT MADE THE PORTRAITS THAT WERE KEPT
# ---------------------------------------------------------------------------
#  Not adjustable from the command line on purpose. Nine portraits were
#  accepted at exactly these numbers and the whole point of a batch is that
#  the 153 match the nine.
# ---------------------------------------------------------------------------
STEPS = 30
CFG = 6.5
SAMPLER = 'dpmpp_2m'
SCHEDULER = 'karras'
SIZE = 1024                # SDXL native. 512 on an SDXL model is mush.


def api(path: str, data=None):
    url = f'http://{SERVER}{path}'
    if data is None:
        with urllib.request.urlopen(url, timeout=30) as r:
            return json.loads(r.read())
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body,
                                 headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def find_checkpoint(preferred: str = '') -> str:
    """Ask the server what it has rather than hardcoding a filename."""
    info = api('/object_info/CheckpointLoaderSimple')
    names = info['CheckpointLoaderSimple']['input']['required']['ckpt_name'][0]
    if not names:
        raise SystemExit('ComfyUI has no checkpoints installed.')
    if preferred:
        for n in names:
            if preferred.lower() in n.lower():
                return n
        raise SystemExit(f'No checkpoint matching "{preferred}". Have: {names}')
    return names[0]


def workflow(ckpt: str, positive: str, negative: str, seed: int,
             ramp: str = 'warm') -> dict:
    """
    The API format graph, which is NOT the format the interface saves.

    The interface writes nodes with positional `widgets_values`; the API
    wants each node keyed by id with a class_type and named inputs. Built
    here by hand rather than converted, so a change in the interface's save
    format cannot quietly break the batch.

    THE PALETTE NODE IS IN THE GRAPH, asked for as "I want it generated
    warm, not raw". So ComfyUI hands back a portrait that is already on the
    ramp and nothing downstream touches the colour.

    The rule that mattered still holds and is the reason the second map was
    removed rather than left in: the colour is applied EXACTLY ONCE. Mapping
    here and again in palette_map would be the double map measured earlier -
    19/255 apart from a single correct map, with 256 tonal steps flattened
    to 182 before the second one starts.

    The cost, stated once: there is no unmapped master any more. Changing a
    character's colour later means generating them again rather than
    remapping in a second. That was the trade asked for.
    """
    return {
        '1': {'class_type': 'CheckpointLoaderSimple',
              'inputs': {'ckpt_name': ckpt}},
        '2': {'class_type': 'CLIPTextEncode',
              'inputs': {'text': positive, 'clip': ['1', 1]}},
        '3': {'class_type': 'CLIPTextEncode',
              'inputs': {'text': negative, 'clip': ['1', 1]}},
        '4': {'class_type': 'EmptyLatentImage',
              'inputs': {'width': SIZE, 'height': SIZE, 'batch_size': 1}},
        '5': {'class_type': 'KSampler',
              'inputs': {'seed': seed, 'steps': STEPS, 'cfg': CFG,
                         'sampler_name': SAMPLER, 'scheduler': SCHEDULER,
                         'denoise': 1.0, 'model': ['1', 0],
                         'positive': ['2', 0], 'negative': ['3', 0],
                         'latent_image': ['4', 0]}},
        '6': {'class_type': 'VAEDecode',
              'inputs': {'samples': ['5', 0], 'vae': ['1', 2]}},
        '8': {'class_type': 'SuccesorPaletteMap',
              'inputs': {'image': ['6', 0], 'ramp': ramp, 'strength': 1.0}},
        '9': {'class_type': 'SaveImage',
              'inputs': {'filename_prefix': 'batch', 'images': ['8', 0]}},
    }


def run_one(ckpt: str, positive: str, negative: str, seed: int,
            ramp: str = 'warm', timeout=300):
    """Queue it, wait for it, hand back the PNG bytes."""
    pid = api('/prompt',
              {'prompt': workflow(ckpt, positive, negative, seed, ramp)})['prompt_id']
    waited = 0
    while waited < timeout:
        hist = api(f'/history/{pid}')
        if pid in hist:
            outs = hist[pid]['outputs']
            for node in outs.values():
                for img in node.get('images', []):
                    q = urllib.parse.urlencode({
                        'filename': img['filename'],
                        'subfolder': img.get('subfolder', ''),
                        'type': img.get('type', 'output'),
                    })
                    with urllib.request.urlopen(
                            f'http://{SERVER}/view?{q}', timeout=60) as r:
                        return r.read()
            raise RuntimeError('finished with no image')
        time.sleep(2)
        waited += 2
    raise TimeoutError(f'{timeout}s with no result')


# ---------------------------------------------------------------------------
#  WHY STRANGERS GET TWO RAMPS AND NOT ONE, AND NOT FIVE
# ---------------------------------------------------------------------------
#  Every stranger on steel is the correct meaning - grey is "owes you
#  nothing" - and it looks wrong, because five of them sit down together and
#  the table comes out as five grey circles.
#
#  All five ramps would fix the look and break the meaning: a stranger in
#  cool reads as family, a stranger in violet reads as somebody from the
#  laboratory. The ramp is carrying information everywhere else in this
#  game and it cannot be decoration in one place.
#
#  Steel and warm are the two that both mean "not yours". Steel is nobody in
#  particular; warm is private money, which is exactly what half a casino
#  table is. So the pool splits between them, off the name, so a given
#  stranger is the same colour every time you sit down with them.
# ---------------------------------------------------------------------------

#  SUPERSEDED: the split above described the world correctly and is kept
#  because the reasoning still holds if the colour ever moves back offline.
#  The colour is now applied in the app at runtime, so what gets written
#  here is the SOURCE, and a source has to be neutral - see the note on the
#  'neutral' ramp in palette_map. Everybody is written grey; who is steel
#  and who is warm is decided by the app, from RAMP_BY_ID and this split.
#
#    def stranger_ramp(name: str) -> str:
#        return 'warm' if PP.wide_hash(f'{name}:ramp') % 2 else 'steel'

# ---------------------------------------------------------------------------
#  WARM, ASKED FOR AND MEASURED
# ---------------------------------------------------------------------------
#  I argued for neutral twice, on the grounds that a source which is tinted
#  again later is mapped twice. That is true and it is measurable, at 46
#  pixels as much as at 1024:
#
#      warm source + filter, against neutral source + filter
#          1024px   13 to 16 / 255
#            46px   13 to 16 / 255
#      for scale:  the eye notices about 2, two different portraits are 50
#
#  So the difference is real and does not shrink at avatar size. What it is
#  NOT is damage: nothing tears, nothing bands, the face is the same face in
#  a slightly softer colour. It was chosen by looking at the two, which is
#  the right way to settle a question about how something looks, and the
#  numbers above are the cost of that choice rather than an argument
#  against it.
#
#  Written down so nobody re-derives the same measurement in a year and
#  assumes it was an oversight.
# ---------------------------------------------------------------------------
SOURCE_RAMP = 'warm'


def stranger_ramp(name: str) -> str:
    return SOURCE_RAMP


def roster(cast_only: bool):
    """[(id, name, ramp, female)] for whichever set was asked for."""
    if cast_only:
        cast = PP.read_cast()
        return [(cid, nm, SOURCE_RAMP, PP.is_female(nm, cid), '')
                for cid, nm in cast.items() if cid not in PP.FACELESS]
    out = []
    groups = {**PP.read_names(), **PP.read_rivals()}
    for region, names in groups.items():
        for nm in names:
            slug = re.sub(r'[^a-z0-9]+', '_', nm.lower()).strip('_')
            # The region rides along so the prompt can say what somebody
            # looks like. It was being read and thrown away before.
            out.append((slug, nm, stranger_ramp(nm), PP.is_female(nm), region))
    return out


def contact_sheet(rows, dest: str, px: int = 46):
    """
    Every portrait at the size the app really shows it, on one page.

    46 pixels is where a bad one is obvious and a good one is fine, so this
    is the review surface: scan it once, note the few that are wrong, redo
    only those. Nobody should open 153 files.
    """
    from PIL import Image, ImageDraw
    have = [(cid, nm) for cid, nm, *_ in rows
            if os.path.exists(os.path.join(OUT_DIR, f'{cid}.png'))]
    if not have:
        print('nothing written yet')
        return
    cols = 12
    cell, pad, label = px * 2, 10, 12
    rows_n = (len(have) + cols - 1) // cols
    W = cols * (cell + pad) + pad
    H = rows_n * (cell + label + pad) + pad + 24
    sheet = Image.new('RGB', (W, H), PM.hex_to_rgb(PM.C['ink']))
    d = ImageDraw.Draw(sheet)
    d.text((pad, 6), f'{len(have)} portrait(s), shown at {px}px, doubled',
           fill=PM.hex_to_rgb(PM.C['greyLight']))
    for i, (cid, nm) in enumerate(have):
        x = pad + (i % cols) * (cell + pad)
        y = 24 + pad + (i // cols) * (cell + label + pad)
        im = Image.open(os.path.join(OUT_DIR, f'{cid}.png')).convert('RGB')
        small = PM.circle_crop(im.resize((px, px), Image.LANCZOS))
        sheet.paste(small.resize((cell, cell), Image.NEAREST), (x, y),
                    small.resize((cell, cell), Image.NEAREST))
        d.text((x, y + cell + 1), nm[:16], fill=PM.hex_to_rgb(PM.C['grey']))
    sheet.save(dest)
    print(f'contact sheet -> {dest}  ({len(have)} shown)')


def main() -> int:
    ap = argparse.ArgumentParser(description='Batch the portraits through ComfyUI.')
    ap.add_argument('--cast', action='store_true', help='the named cast, not the pool')
    ap.add_argument('--limit', type=int, default=0, help='stop after N')
    ap.add_argument('--dry-run', action='store_true', help='print, send nothing')
    ap.add_argument('--sheet', action='store_true', help='contact sheet only')
    ap.add_argument('--checkpoint', default='', help='substring of the ckpt name')
    ap.add_argument('--redo', action='store_true', help='overwrite existing')
    args = ap.parse_args()

    rows = roster(args.cast)
    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(RAW_DIR, exist_ok=True)

    if args.sheet:
        contact_sheet(rows, os.path.join(OUT_DIR, '_contact_sheet.png'))
        return 0

    todo = [r for r in rows
            if args.redo or not os.path.exists(os.path.join(OUT_DIR, f'{r[0]}.png'))]
    if args.limit:
        todo = todo[:args.limit]
    print(f'{len(rows)} in the roster, {len(todo)} to draw\n')

    if args.dry_run:
        for cid, nm, ramp, fem, region in todo[:5]:
            print(f'--- {cid}  ({nm})  ramp={ramp}  {"female" if fem else "male"}')
            print(PP.prompt_for(nm, cid if args.cast else '', region).split('\n')[0])
        print(f'\n(dry run, {len(todo)} would be queued)')
        return 0

    ckpt = find_checkpoint(args.checkpoint)
    print(f'checkpoint: {ckpt}\n')

    from PIL import Image
    done = failed = 0
    for i, (cid, nm, ramp, fem, region) in enumerate(todo, 1):
        pos = PP.prompt_for(nm, cid if args.cast else '', region)
        neg = PP.negative_for(nm, cid if args.cast else '')
        # Seeded from the name, so a rerun of one person is the same person.
        seed = PP.wide_hash(nm) % (2 ** 31)
        try:
            raw = run_one(ckpt, pos, neg, seed, ramp)
        except Exception as e:                      # noqa: BLE001
            print(f'  [{i}/{len(todo)}] {cid:24s} FAILED  {e}')
            failed += 1
            continue
        # Already on the ramp: ComfyUI applied it. The full size copy is
        # kept as the master, but it is a MAPPED master now, not a raw one.
        master = os.path.join(RAW_DIR, f'{cid}.png')
        open(master, 'wb').write(raw)
        # NO SECOND MAP. Only a resize, and it has to be a resize of an
        # image that is already on the ramp, which LANCZOS will blur across
        # ramp steps. Measured when the batch did map then resize: a 242
        # colour image came back with 11,922, none of the extras on the
        # ramp. So the shrink is NEAREST, which cannot invent a colour that
        # was not already there.
        img = Image.open(io.BytesIO(raw)).convert('RGB')
        img.resize((512, 512), Image.NEAREST).save(
            os.path.join(OUT_DIR, f'{cid}.png'))
        done += 1
        print(f'  [{i}/{len(todo)}] {cid:24s} {ramp:7s} ok')

    print(f'\n{done} drawn, {failed} failed')
    contact_sheet(rows, os.path.join(OUT_DIR, '_contact_sheet.png'))
    return 0 if failed == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
