#!/usr/bin/env python3
"""
gen_portrait_registry.py - write the id to require() map React Native needs.

============================================================================
 WHY THIS IS GENERATED AND NOT WRITTEN
============================================================================

 Metro resolves require() at BUILD time by reading the source, so the path
 has to be a literal string in the file. `require(`../assets/${id}.png`)`
 does not work and does not fail loudly either: it throws at runtime, on the
 screen, for one character.

 So 299 explicit requires have to exist somewhere. Writing them by hand
 means the list and the folder drift the first time a portrait is added, and
 a missing line is invisible - the character just falls back to initials and
 looks like a design choice.

 This writes the file from the folder, and portraitRegistry.test.ts checks
 both directions afterwards, so a drift is a red test rather than a face
 nobody notices is absent.

     python3 tools/gen_portrait_registry.py

 Run it after any batch. It is idempotent; if nothing changed the file is
 byte for byte the same.
"""

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PORTRAITS = os.path.join(HERE, '..', 'assets', 'portraits')
OUT = os.path.join(HERE, '..', 'src', 'core', 'portraits', 'registry.ts')

HEADER = '''// src/core/portraits/registry.ts
//
// ============================================================================
//  GENERATED FILE - DO NOT EDIT
// ============================================================================
//
//  Written by tools/gen_portrait_registry.py from assets/portraits.
//  Run that after any batch; portraitRegistry.test.ts fails if this and the
//  folder disagree in either direction.
//
//  ---------------------------------------------------------------------------
//  WHY A MAP OF LITERAL REQUIRES AND NOT A TEMPLATE STRING
//  ---------------------------------------------------------------------------
//  Metro resolves require() at build time by reading the source. A path built
//  from a variable is not a path it can see, so `require(`...${id}.png`)`
//  bundles nothing and throws at runtime, on one screen, for one character.
//  Every path in this file is a literal for that reason.
// ============================================================================

/* eslint-disable */

export const PORTRAITS: Readonly<Record<string, number>> = {
'''

FOOTER = '''};

/** How many faces exist. Read by the test rather than trusted. */
export const PORTRAIT_COUNT = Object.keys(PORTRAITS).length;
'''


def main() -> int:
    if not os.path.isdir(PORTRAITS):
        print(f'no portraits folder at {PORTRAITS}', file=sys.stderr)
        return 1

    ids = sorted(
        f[:-4] for f in os.listdir(PORTRAITS)
        if f.endswith('.png') and not f.startswith('_')
    )
    if not ids:
        print('no portraits found', file=sys.stderr)
        return 1

    lines = [HEADER]
    for pid in ids:
        # Quoted keys throughout: some ids carry a hyphen (npc-marcus-wolf)
        # and mixing quoted and bare keys in one object is the kind of detail
        # that turns into a lint diff on every regeneration.
        lines.append(f"    '{pid}': require('../../../assets/portraits/{pid}.png'),\n")
    lines.append(FOOTER)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    text = ''.join(lines)
    old = open(OUT, encoding='utf8').read() if os.path.exists(OUT) else ''
    if old == text:
        print(f'{len(ids)} portraits, registry already current')
        return 0
    open(OUT, 'w', encoding='utf8').write(text)
    print(f'{len(ids)} portraits -> {os.path.relpath(OUT, os.path.join(HERE, ".."))}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
