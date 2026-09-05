// src/core/portraits/faces.ts
//
// ============================================================================
//  A FACE FOR SOMEBODY WHO WAS NEVER DRAWN
// ============================================================================
//
//  Most of the people in this game do not exist until the game is running.
//  Partners are built from 66,040 name combinations. Directors are replaced
//  every generation with a new first name. Neither can ever have a portrait
//  of their own, and a pool large enough to stop repeats across a whole run
//  was measured and does not exist at any sane cost.
//
//  So 48 anonymous faces were generated instead - three age bands, two
//  genders, eight each - and this hands them out.
//
//  ---------------------------------------------------------------------------
//  THE AGE BAND IS NOT DECORATION
//  ---------------------------------------------------------------------------
//  A dating card PRINTS the age next to the face. A twenty year old face
//  beside the number 58 is a contradiction the player reads instantly, where
//  a merely unfamiliar face is just a face. So the band is chosen from the
//  age that will be displayed, never from the id.
//
//  ---------------------------------------------------------------------------
//  AND SO IS THE GENDER
//  ---------------------------------------------------------------------------
//  Half the pool is women. Guessing when the caller has not said would be a
//  coin flip on every generated person, which is precisely the failure the
//  pool was regenerated to fix: a long haired man arriving under a woman's
//  name. Callers who do not know the gender get null and the initials circle,
//  which is honest. Nothing here guesses.
//
//  ---------------------------------------------------------------------------
//  TWO WAYS TO ASK, AND THEY ARE FOR DIFFERENT THINGS
//  ---------------------------------------------------------------------------
//    faceFor    one person, the same face forever, whoever else is on screen.
//               For anyone with a lasting identity: a partner, a director.
//
//    facesFor   a whole list at once, no two alike. For a screen where four
//               people appear side by side. Measured below: with eight faces
//               in a bucket and four people drawn independently, the chance
//               of at least one repeat is 59 per cent - not a rare edge, the
//               usual case.
// ============================================================================

import type { ImageSourcePropType } from 'react-native';
import { PORTRAITS } from './registry';
import { portraitForPerson } from './index';

/**
 * The bands, including the two that are not adults.
 *
 * 'teen' is a real pool of its own - twenty faces generated as successors,
 * "in her late teens" - and it exists because the heirs are shown in a list
 * that PRINTS their age from the year they are born onward.
 *
 * 'child' is a band with NO pool, on purpose. Nothing under thirteen was
 * ever drawn, and the nearest thing available is a seventeen year old. A
 * teenager's face beside the number 8 is worse than the initials circle,
 * which says nothing rather than something false. So it resolves to null and
 * the caller falls back, exactly as it does for a stranger.
 */
export type AgeBand = 'child' | 'teen' | 'young' | 'mid' | 'old';

/**
 * Where the bands split.
 *
 * Written down as the boundaries the pools were GENERATED against: the heir
 * prompts said "late teens", the young prompts said late teens to late
 * twenties, mid said thirties and forties, old said fifties and up. Moving
 * these numbers without regenerating would put a wrong face beside a printed
 * age, which is the one thing this is here to prevent.
 */
export const BAND_TEEN_FROM = 13;
export const BAND_YOUNG_FROM = 18;
export const BAND_MID_FROM = 30;
export const BAND_OLD_FROM = 50;

export const bandForAge = (age: number | undefined | null): AgeBand => {
    // A missing or nonsense age lands in 'mid' rather than throwing: it is
    // the band that covers partners, directors and executives alike, so it is
    // the least wrong guess when there is nothing to go on. Note this is NOT
    // 'child' - defaulting to the empty band would silently blank every face
    // whose caller forgot to pass an age.
    const a = typeof age === 'number' && isFinite(age) ? age : BAND_MID_FROM;
    if (a < BAND_TEEN_FROM) return 'child';
    if (a < BAND_YOUNG_FROM) return 'teen';
    if (a < BAND_MID_FROM) return 'young';
    if (a < BAND_OLD_FROM) return 'mid';
    return 'old';
};

/**
 * The pools, read out of the registry rather than listed here.
 *
 * The band and the gender are in the FILE NAME - face_young_f_03, heir_m_07 -
 * because that is how the batch wrote them. Reading them back out means a
 * pool that grows from eight faces a bucket to twelve needs no change here,
 * and cannot silently disagree with what is on disk.
 *
 * Two naming shapes because they were generated as two separate jobs: the
 * adults carry their band in the name, the heirs are all one band and do not.
 * Both are read, because twenty heir portraits that nothing looks at would be
 * this project's signature failure all over again.
 */
const POOL: Record<string, number[]> = (() => {
    const out: Record<string, number[]> = {};
    for (const key of Object.keys(PORTRAITS).sort()) {
        const adult = /^face_(young|mid|old)_(f|m)_(\d+)$/.exec(key);
        if (adult) {
            (out[`${adult[1]}_${adult[2]}`] ||= []).push(PORTRAITS[key]);
            continue;
        }
        const heir = /^heir_(f|m)_(\d+)$/.exec(key);
        if (heir) (out[`teen_${heir[1]}`] ||= []).push(PORTRAITS[key]);
    }
    return out;
})();

/** How many faces are available for a band and gender. Read by the tests. */
export const poolSize = (band: AgeBand, female: boolean): number =>
    (POOL[`${band}_${female ? 'f' : 'm'}`] || []).length;

/**
 * FNV-1a, over the full 32 bits.
 *
 * NOT avatarHue, which is the seat colour hash and folds into 0..359 before
 * anything else happens. Folding a 360 wide value into 8 buckets leaves the
 * last 8 values sharing 5 buckets instead of 8, so some faces would appear
 * appreciably more often than others across a run. This is the same hash the
 * prompt generator used to pick traits, for the same reason.
 */
export const faceHash = (s: string): number => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
};

export type Person = {
    id: string;
    name?: string;
    /** Required for a pool face. Without it there is no face, by design. */
    female?: boolean;
    /** The age that will be SHOWN. The band follows it. */
    age?: number;
    /** Given instead of an age when the caller already knows the band. */
    band?: AgeBand;
};

/**
 * The best face for one person: their own portrait, or a lent one.
 *
 * Deterministic on the id alone, so the same director is the same face after
 * a reload, on every screen, for the rest of the run. Returns null when the
 * gender is unknown or the bucket is empty; callers fall back to initials.
 */
export const faceFor = (p: Person): ImageSourcePropType | null => {
    // Their own portrait always wins. A magnate who happens to be forty does
    // not get a stranger's face because a list asked for one.
    const own = portraitForPerson(p.id, p.name);
    if (own) return own;

    if (p.female === undefined) return null;
    const band = p.band ?? bandForAge(p.age);
    const bucket = POOL[`${band}_${p.female ? 'f' : 'm'}`];
    if (!bucket || bucket.length === 0) return null;
    return bucket[faceHash(p.id) % bucket.length] as ImageSourcePropType;
};

/**
 * Faces for a whole screen, without two people wearing the same one.
 *
 * Each person still starts from the face faceFor would give them, so a list
 * of one and a list of four agree wherever they can. Only where two land on
 * the same face does the second walk forward to the next free one, which
 * keeps the shuffling to the people who actually collided.
 *
 * Order matters and is the caller's: whoever comes first keeps their face.
 * Pass the list in the order it is displayed and a person keeps their face
 * as long as the people above them do not change.
 */
export const facesFor = (
    people: Person[],
): Map<string, ImageSourcePropType | null> => {
    const out = new Map<string, ImageSourcePropType | null>();
    const taken = new Set<number>();

    for (const p of people) {
        const own = portraitForPerson(p.id, p.name);
        if (own) {
            // A real portrait is never displaced. Two of them cannot collide,
            // because a person has exactly one file.
            out.set(p.id, own);
            continue;
        }
        if (p.female === undefined) {
            out.set(p.id, null);
            continue;
        }
        const band = p.band ?? bandForAge(p.age);
        const bucket = POOL[`${band}_${p.female ? 'f' : 'm'}`];
        if (!bucket || bucket.length === 0) {
            out.set(p.id, null);
            continue;
        }
        const start = faceHash(p.id) % bucket.length;
        let chosen = bucket[start];
        for (let step = 0; step < bucket.length; step++) {
            const cand = bucket[(start + step) % bucket.length];
            if (!taken.has(cand)) { chosen = cand; break; }
        }
        // If every face in the bucket is already out - more than eight people
        // of one band and gender on one screen - the walk finds nothing free
        // and the first choice is used again. A repeat is the honest outcome
        // there; a blank circle in a row of faces would look like an error.
        taken.add(chosen);
        out.set(p.id, chosen as ImageSourcePropType);
    }
    return out;
};
