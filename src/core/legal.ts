// src/core/legal.ts
//
// ============================================================================
//  THE THREE ADDRESSES BOTH STORES ASK FOR
// ============================================================================
//
//  App Store Connect makes two of these REQUIRED FIELDS on a submission: a
//  privacy policy URL and a support URL. Play Console requires the privacy
//  policy and a contact email. Neither existed, and Settings has shipped a
//  "Privacy Policy" row that calls `handleUnavailable`, so a reviewer pressing
//  it met a dead control on the way to approving a paid feature.
//
//  ---------------------------------------------------------------------------
//  ONE FILE, BECAUSE THREE SURFACES NEED THEM
//  ---------------------------------------------------------------------------
//  The purchase sheet links to the policy and the terms, Settings links to all
//  three, and the store listings carry the same addresses. Four copies of a URL
//  is four places to edit when the hosting moves, and the one that goes stale
//  is whichever nobody opened. So they live here and nothing else writes one.
//
//  ---------------------------------------------------------------------------
//  AN EMPTY STRING IS A VALID STATE AND MUST STAY ONE
//  ---------------------------------------------------------------------------
//  While a URL is empty, every surface HIDES its link rather than offering one
//  that goes nowhere. Inventing a plausible address would pass review, return
//  404 for every real player, and stay broken until somebody complained, which
//  is the worst of the three outcomes.
//
//  `legal.test.ts` keeps the gap visible in the test output rather than in a
//  comment nobody opens.
// ============================================================================

/**
 * Where the documents are published.
 *
 * GitHub Pages, from a SEPARATE public repository rather than this one: Pages
 * needs a public repo and the game's source is not that. Three static files,
 * no build step, no hosting bill.
 */
// NOTE ON THE SPELLING. The GitHub account is `Salihkilicc`, with a capital S
// and two c's; Pages serves it lower cased as `salihkilicc.github.io`. This was
// written as `salihkilic` first and every one of the three pages 404'd, which
// is exactly the failure the empty-string rule exists to prevent and the reason
// step five of the setup is "open all three in a browser".
const BASE = 'https://salihkilicc.github.io/succesor-legal';

/** Required by App Store Connect and Play Console. */
export const PRIVACY_POLICY_URL = `${BASE}/privacy.html`;

/**
 * Optional on both stores, and worth having anyway.
 *
 * If no custom terms are supplied, Apple's standard EULA applies on iOS. These
 * exist because the game needs to say three things that the standard licence
 * does not: the casino is fiction, nothing here is investment advice, and the
 * purchase is a one off rather than a subscription.
 */
export const TERMS_OF_USE_URL = `${BASE}/terms.html`;

/** Required by App Store Connect as the Support URL. */
export const SUPPORT_URL = `${BASE}/support.html`;

/**
 * The address a player writes to.
 *
 * Deliberately not a personal inbox. It is published in the documents, in both
 * store listings, and in the app, which means it is permanently public.
 */
export const SUPPORT_EMAIL = 'successor.support@gmail.com';
