// src/core/portraits/index.ts
//
// ============================================================================
//  ONE PLACE THAT TURNS AN ID INTO A FACE
// ============================================================================
//
//  299 portraits sat in assets/portraits and nothing in the app read them.
//  That is the signature failure of this codebase - correct data that nothing
//  reads - so this is deliberately the ONLY door to that folder. Nowhere else
//  requires a png.
//
//  ---------------------------------------------------------------------------
//  IT RETURNS null AND THAT IS THE IMPORTANT PART
//  ---------------------------------------------------------------------------
//  A missing portrait is the normal case, not an error:
//
//    - the four who must stay faceless (unknown, vulture, regulator, fbi) are
//      characters whose whole effect is that you cannot see who they are,
//    - partners are generated at runtime out of 66,040 name combinations and
//      will never all have files,
//    - a new character added tomorrow has no portrait until a batch is run.
//
//  So every caller falls back to the initials circle that was already there,
//  and a face is an upgrade rather than a requirement. Nothing throws, and no
//  screen can be broken by an id that is not in the folder.
// ============================================================================

import type { ImageSourcePropType } from 'react-native';
import { PORTRAITS, PORTRAIT_COUNT } from './registry';

export { PORTRAIT_COUNT };

/**
 * The four who must never have a face.
 *
 * These are not oversights and they are not "not generated yet": an anonymous
 * tip, a vulture fund, a regulator and a federal agent are threatening because
 * they are a name without a person. Listed here rather than only left out of
 * the folder so that a future batch cannot quietly give them one - the test
 * asserts they resolve to null.
 */
export const FACELESS: ReadonlySet<string> = new Set([
    'unknown', 'vulture', 'regulator', 'fbi',
]);

/**
 * Turn whatever a screen is holding into the name of a file.
 *
 * ---------------------------------------------------------------------------
 *  THIS MIRRORS THE GENERATOR, DELIBERATELY, LINE FOR LINE
 * ---------------------------------------------------------------------------
 *  The files were named by tools/portrait_prompts.py with exactly:
 *
 *      re.sub(r'[^a-z0-9]+', '_', name.lower()).strip('_')
 *
 *  so 'Rosalind St Clair' became rosalind_st_clair. Anything looser here and
 *  the mismatch is invisible: a name with a punctuation mark in it simply
 *  falls back to initials and looks like a character who was never drawn.
 *  portraits.test.ts walks the real rosters and checks every one resolves.
 *
 *  The two strips come first because a runtime id carries decoration a file
 *  name never had: board succession issues 'npc-elena-vance::g2' for the same
 *  person the cast calls 'elena_vance', and without this every director would
 *  lose their face the moment the second generation began.
 *
 *  Both keys land here on purpose. The poker table holds NAMES for its
 *  magnates ('Zofia Kowalczyk' under the id 'mg_kowalczyk') while the cast
 *  holds bare ids ('coo'), and callers should not have to know which they are.
 */
const normalise = (id: unknown): string =>
    // typeof rather than `id || ''`: the types say string, but these ids come
    // out of a persisted store and off save files written by older builds, and
    // a number arriving here threw. A face is never worth a crash.
    (typeof id === 'string' ? id : '')
        .toLowerCase()
        .replace(/::.*$/, '')          // a generation suffix: ::g2
        .replace(/^npc-/, '')          // the runtime prefix
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

/**
 * The face for this id, or null when there is not one.
 *
 * Never throws. Callers render the initials circle on null.
 */
export const portraitFor = (id: string | undefined | null): ImageSourcePropType | null => {
    if (!id) return null;
    const key = normalise(id);
    if (FACELESS.has(key)) return null;
    const direct = PORTRAITS[key];
    return direct === undefined ? null : (direct as ImageSourcePropType);
};

/** Whether this id has a face. Same rules as portraitFor, without the source. */
export const hasPortrait = (id: string | undefined | null): boolean =>
    portraitFor(id) !== null;

/**
 * The face for a person who has both an id and a name, trying both.
 *
 * ---------------------------------------------------------------------------
 *  WHY THIS EXISTS AND WHY IT IS NOT OPTIONAL
 * ---------------------------------------------------------------------------
 *  The portraits were named from NAMES: 'Zofia Kowalczyk' became
 *  zofia_kowalczyk.png. But the poker table carries her as id 'mg_kowalczyk',
 *  the rival chief executives are carried under their stock ids, and the named
 *  cast (coo, cto, brother) is carried under ids that ARE the file names.
 *
 *  Look up by id alone and every magnate and every rival loses their face -
 *  which is 61 of the people most often on screen, silently, with the initials
 *  circle making it look intended. Look up by name alone and the cast loses
 *  theirs. So both, id first, because an id is the more specific claim: the
 *  player's own brother is 'brother', whatever he was named.
 */
export const portraitForPerson = (
    id: string | undefined | null,
    name: string | undefined | null,
): ImageSourcePropType | null => {
    // Faceless is checked on the id before the name gets a chance, so a
    // regulator who happens to be given a display name stays faceless.
    if (FACELESS.has(normalise(id))) return null;
    return portraitFor(id) ?? portraitFor(name);
};

/**
 * Every id that has a file, sorted.
 *
 * This is what the procedural picker will draw from for the characters that
 * are generated at runtime and cannot have a portrait of their own.
 */
export const PORTRAIT_IDS: readonly string[] = Object.freeze(
    Object.keys(PORTRAITS).sort(),
);
