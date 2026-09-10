// src/features/love/logic/partnerText.ts
//
// ============================================================================
//  THE ENCOUNTER CARD WAS THE ONE PARTNER SURFACE THAT NEVER ASKED
// ============================================================================
//
//  Four screens show a partner. Three of them - the profile card, the family
//  detail modal and the family member screen - go through
//  data/i18n/profileLoveShopText.ts, which has translated all fifty one job
//  titles and all eight social classes for a long time.
//
//  The ENCOUNTER CARD, which is the screen where the player decides whether
//  they want this person at all, read the raw fields:
//
//      candidate.stats.occupation              'Old-Money Dynasty Heiress'
//      deepPartner.personality.label           'Old-Money Elegance'
//      socialClass.replace(/([a-z])([A-Z])/...) 'OLD MONEY'
//      t('love.luxury')                        every partner in the game
//
//  So the whole of the prestige, on the one screen where prestige is the
//  point, was in English however the app was set. scripts/untranslated.js
//  could not have found it either: it reads .tsx and looks at Text children
//  and naming props, and these arrive through a variable from a .ts data file.
//
//  ---------------------------------------------------------------------------
//  AND THE FIRST DRAFT OF THIS FILE MADE IT WORSE
//  ---------------------------------------------------------------------------
//  Worth recording. It added a `job.<id>` key for all forty seven jobs, a
//  `trait.<id>` for all ten personalities and a `class.<name>` for all eight
//  classes to en.ts and tr.ts - a second, complete, independent translation of
//  the same three tables, keyed differently from the one that existed.
//
//  That is the exact fault this project has spent weeks removing: one fact in
//  two places, found one at a time. Backed out. Measured afterwards: all
//  fifty one titles and all eight classes were ALREADY in the registry, and
//  the only real gap was the ten personality labels, which are added there
//  rather than here.
//
//  So this file translates nothing. It is a door, and everything behind it is
//  somebody else's table.
// ============================================================================

import { t, hasKey } from '../../../core/i18n';
import {
    translateOccupation,
    translateSocialClass,
    translateTrait,
} from '../../../data/i18n/profileLoveShopText';
import { titleOf } from './partnerGenerator';
import type {
    JobDefinition,
    PartnerProfile,
    PersonalityTrait,
    SocialClass,
    SocialTier,
} from '../../../data/relationshipTypes';

/**
 * The job's name, in the player's language and for this person.
 *
 * `titleOf` picks the gendered form where the English word has one - an Heir
 * and an Heiress are one job - and the registry is keyed on those exact
 * strings, both of which it carries. Turkish has no gendered third person and
 * folds the pair onto one word, which is why "erkekler de tabii" costs
 * nothing on this screen.
 */
export const jobTitle = (
    job: Pick<JobDefinition, 'id' | 'title' | 'titleFor'> | null | undefined,
    gender?: 'male' | 'female',
): string => {
    if (!job?.title) return '';
    return translateOccupation(titleOf(job as JobDefinition, gender));
};

/** What sort of person they are. */
export const traitLabel = (
    personality: Pick<PersonalityTrait, 'label'> | null | undefined,
): string => (personality?.label ? translateTrait(personality.label) : '');

/**
 * The class badge.
 *
 * It was built by a regex on the enum member - clever, and it produces nothing
 * at all in another language. `.toUpperCase()` stays at the call site because
 * the badge is the only surface that shouts; the profile row uses the same
 * function without it.
 */
export const classLabel = (socialClass: SocialClass | string | undefined): string =>
    translateSocialClass(String(socialClass || ''));

/**
 * The little badge beside the monthly bill.
 *
 * It said `love.luxury` for EVERY partner in the game, so a physics fellow on
 * two hundred a month and a reigning queen on thirteen million were both
 * labelled LUXURY. It follows the room now, which is the only thing it could
 * ever have honestly followed. New words, so these ARE new keys.
 */
export const lifestyleLabel = (tier: SocialTier | string | undefined): string => {
    const key = `life.${tier ?? ''}`;
    return hasKey(key) ? t(key) : t('love.luxury');
};

/** Where they came from. Empty for a partner from before backgrounds existed. */
export const backgroundLine = (partner: PartnerProfile | null | undefined): string => {
    const key = partner?.stats?.background;
    if (!key || !hasKey(key)) return '';
    return t(key);
};

// ---------------------------------------------------------------------------
//  WHAT THEIR FAMILY HAS, IN WORDS
// ---------------------------------------------------------------------------
//  `familyWealth` is 0 to 100, it is derived from the room and the person
//  (psychometrics.ts), and it decides what `aidOffer` is worth. The player has
//  never been shown it anywhere except as an unlabelled bar on a detail
//  screen they have to go looking for.
//
//  Five bands rather than the number. A number out of a hundred invites the
//  player to compare two candidates on a decimal; a sentence tells them what
//  sort of family it is, which is the thing that actually matters while
//  somebody is standing in front of them.
// ---------------------------------------------------------------------------

/** The floor of each band, richest first. */
export const WEALTH_BANDS: { from: number; key: string }[] = [
    { from: 90, key: 'wealth.4' },
    { from: 70, key: 'wealth.3' },
    { from: 45, key: 'wealth.2' },
    { from: 20, key: 'wealth.1' },
    { from: 0, key: 'wealth.0' },
];

export const wealthLabel = (familyWealth: number | undefined): string => {
    const w = Math.max(0, Math.min(100, familyWealth ?? 0));
    const band = WEALTH_BANDS.find(b => w >= b.from) ?? WEALTH_BANDS[WEALTH_BANDS.length - 1];
    return t(band.key);
};

/**
 * Whether they would help, and with how much.
 *
 * Read off `partnerEffects`'s own constant rather than restated:
 * `familyWealth * AID_SHARE_OF_WEALTH` is what they put up and
 * `financialAidChance` is whether they offer at all. Somebody who will never
 * offer is worth saying so about, because it is half of what a High
 * Maintenance partner IS and the card has never said it.
 */
export const aidLine = (
    partner: PartnerProfile | null | undefined,
    format: (n: number) => string,
): string => {
    const chance = partner?.stats?.financialAidChance ?? 0;
    if (chance <= 0) return t('love.wouldNotHelp');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { AID_SHARE_OF_WEALTH } = require('./partnerEffects');
    const amount = Math.round((partner?.stats?.familyWealth ?? 0) * AID_SHARE_OF_WEALTH);
    if (amount <= 0) return t('love.wouldNotHelp');
    return t('love.wouldHelp', { amount: format(amount) });
};
