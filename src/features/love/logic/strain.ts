// src/features/love/logic/strain.ts
//
// ============================================================================
//  JEALOUSY AND CRAZY, WITHOUT A DIE
// ============================================================================
//
//  These were the last two PartnerStats fields that decided nothing, and they
//  are the two that are hardest to add honestly, because the obvious version is
//  a percentage: roll every quarter, and at `jealousy / 100` somebody has a
//  scene about it.
//
//  That is the shape this project has spent weeks removing. A relationship that
//  deteriorates because a hidden number came up is not a relationship, it is
//  weather with a name on it - and the player cannot learn anything from it,
//  because there is nothing to learn.
//
//  ---------------------------------------------------------------------------
//  SO IT IS BUILT ON WHAT THE PLAYER ACTUALLY DID
//  ---------------------------------------------------------------------------
//  Three facts, all of them already on the quarter:
//
//    OVERTIME. The plant ran late, which means you did. It is a switch the
//    player throws deliberately and it is the most direct "I was not there"
//    the game can measure.
//
//    THE CASINO. `casinoStreak` counts consecutive quarters with a visit. Being
//    at the tables is not the same as being at work and everybody knows it.
//
//    SILENCE. Their message thread unread for a quarter, which is the same
//    signal core/story/neglect.ts already acts on - one fact, read twice, and
//    the two systems agree by construction rather than by coincidence.
//
//  `jealousy` does not decide WHETHER anything happens. It decides HOW MUCH the
//  same behaviour costs. A Loyal Confidante at fifteen barely notices a quarter
//  of overtime; a High Maintenance at eighty-five is counting.
//
//  `crazy` decides nothing until they leave, and then it decides how loudly.
//
//  ---------------------------------------------------------------------------
//  PURE. No stores, no clock, no random.
//  ---------------------------------------------------------------------------
// ============================================================================

import type { PartnerProfile } from '../../../data/relationshipTypes';

/** What the player did this quarter, as far as their partner can tell. */
export type QuarterConduct = {
    /** The plant ran late, so the player did. */
    overtime: boolean;
    /** Consecutive quarters with a casino visit. */
    casinoStreak: number;
    /** Their thread has gone a quarter unanswered. See core/story/neglect.ts. */
    ignored: boolean;
};

/**
 * What each thing costs, at a jealousy of 100.
 *
 * Scaled DOWN by jealousy rather than up, so these read as the worst case and
 * the numbers on the page are the numbers at the top of the range.
 */
export const STRAIN_OVERTIME = 6;
export const STRAIN_CASINO = 5;
export const STRAIN_IGNORED = 8;

/**
 * The floor under jealousy's scaling.
 *
 * Even the most easy-going partner in the game notices being ignored for a
 * year. Without this a jealousy of 15 makes conduct free, and "she does not
 * mind" becomes "she is not implemented".
 */
export const MIN_SENSITIVITY = 0.25;

/**
 * Above this, a partner is loud about leaving.
 *
 * `crazy` does nothing at all until the relationship ends, which is the honest
 * reading of the field: it is not a personality tax, it is what happens when
 * somebody is hurt and has nothing left to lose.
 */
export const LOUD_DEPARTURE_CRAZY = 60;

/** And what a loud one takes off public standing. */
export const SCANDAL_REPUTATION = 12;

export type Strain = {
    /** Negative. What this quarter did to how they feel about you. */
    loveChange: number;
    /**
     * Which single thing was the worst of it, so the message can name it.
     *
     * ONE reason, not a list. A partner who recites three grievances in a
     * message is a changelog; a partner who names the one that actually hurt
     * is a person.
     */
    reason: 'overtime' | 'casino' | 'ignored' | null;
};

/** How hard this person feels things. 0.25 to 1. */
export const sensitivity = (partner: PartnerProfile): number =>
    Math.max(MIN_SENSITIVITY, (partner.stats?.jealousy ?? 0) / 100);

/**
 * What a quarter of the player's behaviour costs the relationship.
 *
 * Returns zero and no reason when the player was present, which is most
 * quarters and has to be: a relationship that only ever falls is a countdown.
 */
export const strainFor = (
    partner: PartnerProfile | null | undefined,
    conduct: QuarterConduct,
): Strain => {
    if (!partner) return { loveChange: 0, reason: null };

    const weights: [Strain['reason'], number][] = [
        ['ignored', conduct.ignored ? STRAIN_IGNORED : 0],
        ['overtime', conduct.overtime ? STRAIN_OVERTIME : 0],
        // One quarter at the tables is a night out. Four in a row is a habit,
        // and the habit is what gets mentioned.
        ['casino', conduct.casinoStreak >= 2 ? STRAIN_CASINO : 0],
    ];

    const raw = weights.reduce((sum, [, w]) => sum + w, 0);
    if (raw === 0) return { loveChange: 0, reason: null };

    // The worst single thing, which is what they will actually say.
    const worst = weights.reduce((a, b) => (b[1] > a[1] ? b : a));

    return {
        loveChange: -Math.round(raw * sensitivity(partner)),
        reason: worst[0],
    };
};

/**
 * They have run out of patience.
 *
 * Separate from `strainFor` because leaving is not a quantity, it is a line
 * being crossed - and the caller needs to know which side of it the player is
 * on before it decides whether to send a message or a breakup.
 */
export const hasLeft = (partner: PartnerProfile | null | undefined): boolean =>
    !!partner && (partner.love ?? 0) <= 0;

/** And whether they go quietly. `crazy`'s one job. */
export const leavesLoudly = (partner: PartnerProfile): boolean =>
    (partner.stats?.crazy ?? 0) >= LOUD_DEPARTURE_CRAZY;
