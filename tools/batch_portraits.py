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


def workflow(ckpt: str, positive: str, negative: str, seed: int) -> dict:
    """
    The API format graph, which is NOT the format the interface saves.

    The interface writes nodes with positional `widgets_values`; the API
    wants each node keyed by id with a class_type and named inputs. Built
    here by hand rather than converted, so a change in the interface's save
    format cannot quietly break the batch.

    NO PALETTE NODE. Measured: applying a ramp here and a different one in
    palette_map afterwards is not the same as applying the right one once -
    19/255 mean difference, and the first map flattens 256 tonal steps to
    182 for the second one to work from. The colour is applied exactly once,
    downstream.
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
        '7': {'class_type': 'SaveImage',
              'inputs': {'filename_prefix': 'batch', 'images': ['6', 0]}},
    }


def run_one(ckpt: str, positive: str, negative: str, seed: int, timeout=300):
    """Queue it, wait for it, hand back the PNG bytes."""
    pid = api('/prompt', {'prompt': workflow(ckpt, positive, negative, seed)})['prompt_id']
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


def roster(cast_only: bool):
    """[(id, name, ramp, female)] for whichever set was asked for."""
    if cast_only:
        cast = PP.read_cast()
        return [(cid, nm, PP.ramp_for(cid), PP.is_female(nm, cid))
                for cid, nm in cast.items() if cid not in PP.FACELESS]
    out = []
    for names in PP.read_names().values():
        for nm in names:
            slug = re.sub(r'[^a-z0-9]+', '_', nm.lower()).strip('_')
            # Strangers all carry steel: they owe you nothing and they are
            # not meant to read as anybody's ally.
            out.append((slug, nm, 'steel', PP.is_female(nm)))
    return out


def contact_sheet(rows, dest: str, px: int = 46):
    """
    Every portrait at the size the app really shows it, on one page.

    46 pixels is where a bad one is obvious and a good one is fine, so this
    is the review surface: scan it once, note the few that are wrong, redo
    only those. Nobody should open 153 files.
    """
    from PIL import Image, ImageDraw
    have = [(cid, nm) for cid, nm, _, _ in rows
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
        for cid, nm, ramp, fem in todo[:5]:
            print(f'--- {cid}  ({nm})  ramp={ramp}  {"female" if fem else "male"}')
            print(PP.prompt_for(nm, cid if args.cast else '').split('\n')[0])
        print(f'\n(dry run, {len(todo)} would be queued)')
        return 0

    ckpt = find_checkpoint(args.checkpoint)
    print(f'checkpoint: {ckpt}\n')

    from PIL import Image
    done = failed = 0
    for i, (cid, nm, ramp, fem) in enumerate(todo, 1):
        pos = PP.prompt_for(nm, cid if args.cast else '')
        neg = PP.negative_for(nm, cid if args.cast else '')
        # Seeded from the name, so a rerun of one person is the same person.
        seed = PP.wide_hash(nm) % (2 ** 31)
        try:
            raw = run_one(ckpt, pos, neg, seed)
        except Exception as e:                      # noqa: BLE001
            print(f'  [{i}/{len(todo)}] {cid:24s} FAILED  {e}')
            failed += 1
            continue
        open(os.path.join(RAW_DIR, f'{cid}.png'), 'wb').write(raw)
        img = Image.open(io.BytesIO(raw)).convert('RGB')
        lut = PM.build_lut(PM.RAMPS[ramp])
        mapped = Image.fromarray(lut[PM.luminance(img)], mode='RGB')
        mapped.resize((512, 512), Image.LANCZOS).save(
            os.path.join(OUT_DIR, f'{cid}.png'))
        done += 1
        print(f'  [{i}/{len(todo)}] {cid:24s} {ramp:7s} ok')

    print(f'\n{done} drawn, {failed} failed')
    contact_sheet(rows, os.path.join(OUT_DIR, '_contact_sheet.png'))
    return 0 if failed == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
