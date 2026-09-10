// src/components/MyCompany/Shares/logic/trustLook.ts
//
// ============================================================================
//  THREE ANSWERS TO "HOW MUCH DOES THIS DIRECTOR TRUST YOU"
// ============================================================================
//
//  One number, `BoardMember.trust`, shown on three screens, and every screen
//  had written its own idea of what it looks like:
//
//    BoardRoomModal          3 bands   >=60 up, >=35 textSecondary, else down
//    MemberInteractionModal  5 bands   with LABELS, and a considered comment
//                                      about why four of them stopped being red
//    ShareholderProfileModal 4 bands   and only TWO colours
//
//  The third is the one that was reported as looking old, and this is most of
//  why. Its four bands were:
//
//      trust < 30  '#FF8A8A'  // Red
//      trust < 50  '#FF8A8A'  // Orange
//      trust < 70  '#FF8A8A'  // Yellow
//      else        '#CFD0D2'  // Green
//
//  Four thresholds, four colour names in the comments, and two actual values.
//  Red, Orange and Yellow are the SAME pink, so three quarters of the scale
//  looked identical - a director at 29 and a director at 69 were painted the
//  same. And the one labelled "Green" is #CFD0D2, which is the light grey from
//  the palette. The comments described a design that was never built.
//
//  Worse in the direction that matters: #FF8A8A is `negative`, and the theme
//  says what that colour means in a sentence - "this is costing you". A
//  director sitting at 65 trust is costing the player nothing, and was drawn
//  in the loss colour anyway. That is the leak rule 3 of the theme exists to
//  stop, and Salih's own rule about green and red belonging to profit and loss
//  alone.
//
//  ---------------------------------------------------------------------------
//  SO ONE DOOR, AND IT IS THE VERSION THAT WAS ALREADY RIGHT
//  ---------------------------------------------------------------------------
//  Nothing new is invented here. This is MemberInteractionModal's five bands,
//  lifted out unchanged, along with the reasoning that was written above them.
//  It was already the most considered of the three: it has labels, so the
//  colour is not carrying the meaning alone, and it had already been through
//  the pass that took the loss red off four of the five.
//
//  PURE apart from `t`, which is what turns a band into a sentence.
// ============================================================================

import { t } from '../../../../core/i18n';
import { theme } from '../../../../core/theme';

export type TrustLook = {
    /** What this level of trust IS, in words. */
    label: string;
    /** And what it looks like. A TEXT colour; never a fill. */
    color: string;
    /** 0-100, clamped, for a bar. */
    percent: number;
};

/** The floor of each band, warmest first. Read by the test that pins them. */
export const TRUST_BANDS: { from: number; key: string }[] = [
    { from: 80, key: 'equity.loyalAlly' },
    { from: 60, key: 'equity.supportive' },
    { from: 40, key: 'equity.neutral' },
    { from: 20, key: 'equity.suspiciousOfYou' },
    { from: 0, key: 'equity.hostileEnemy' },
];

/**
 * How a director's trust reads.
 *
 * ---------------------------------------------------------------------------
 *  WHY MOST OF IT IS PLAIN WHITE
 * ---------------------------------------------------------------------------
 *  Carried over verbatim from where this lived: four of the five used to be
 *  the loss red, so "Supportive" and "Hostile Enemy" were the same colour and
 *  the label was doing all of the work while the colour actively misled. Red
 *  is reserved for loss; only outright suspicion keeps the caution colour, and
 *  the rest is plain white at two weights.
 *
 *  That is not a colour scheme being timid. It is the theme's third rule: a
 *  colour that means something means ONE thing, and "somebody feels warmly
 *  towards you" is not a sentence any of the signal colours say.
 */
export const trustLook = (trust: number | undefined): TrustLook => {
    const value = Math.max(0, Math.min(100, Number.isFinite(trust) ? (trust as number) : 0));
    const band = TRUST_BANDS.find(b => value >= b.from) ?? TRUST_BANDS[TRUST_BANDS.length - 1];
    return {
        label: t(band.key),
        color: value >= 60 ? theme.colors.textPrimary
            : value >= 40 ? theme.colors.textSecondary
                : theme.colors.warning,
        percent: value,
    };
};

// ============================================================================
//  AND THE SAME FAULT, ON THE OFFER BESIDE IT
// ============================================================================
//
//  `getReactionColor` on the profile screen had three bands and two colours,
//  the third labelled "Green - Happy" and painted the same light grey:
//
//      offerPremium < 0    '#FF8A8A'  // Red - Insulted
//      offerPremium <= 20  '#FF8A8A'  // Yellow - Neutral
//      else                '#CFD0D2'  // Green - Happy
//
//  An insulting offer and a fair one looked identical, which is a real thing
//  to get wrong: how the other side is taking your number is the ONE piece of
//  feedback that screen gives while the player drags the premium slider.
//
//  Three bands, three appearances, and the labels already exist.
// ============================================================================

/** How the person across the table is taking the number. */
export const offerLook = (premiumPercent: number): { label: string; color: string } => {
    const premium = Number.isFinite(premiumPercent) ? premiumPercent : 0;
    // Below the asking price. They are being asked to take less than it is
    // worth, and `warning` is the caution colour rather than the loss red -
    // nobody has lost anything yet, the player has simply said something rude.
    if (premium < 0) return { label: t('mem.insulted'), color: theme.colors.warning };
    if (premium <= 20) return { label: t('mem.neutralMood'), color: theme.colors.textSecondary };
    return { label: t('mem.happy'), color: theme.colors.textPrimary };
};
