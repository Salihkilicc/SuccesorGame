// src/core/story/cast.ts
//
// ============================================================================
//  WHO IS ALLOWED TO WRITE TO YOU, AND HOW
// ============================================================================
//
//  The channel a character uses is not decoration - it is characterisation,
//  and it is the cheapest characterisation in the game.
//
//  Pear's CEO sends mail. Always mail, from an assistant's template, with a
//  subject line. He is not being polite; he does not have your number and has
//  never wanted it. Your brother sends messages, at eleven at night, because
//  he has always had your number and has never once respected it. Neither of
//  those facts is ever stated in dialogue. The player works it out from the
//  app the words arrive in.
//
//  Which is why the rule is DATA and enforced rather than remembered. The day
//  a scene has Pear text you is the day that whole piece of characterisation
//  quietly dies - and it would be an easy mistake, because a text is faster to
//  write than a letter.
//
//  ---------------------------------------------------------------------------
//  THE TYPE CARRIES HALF THE ENFORCEMENT
//  ---------------------------------------------------------------------------
//  A character who can send mail must have an address, and one who cannot must
//  not pretend to. That is a union rather than an optional field, so a
//  mail-capable character with no address does not compile. The other half -
//  a scene putting a mail-only character on the message channel - is a data
//  question, and the audit answers it.
//
//  This file holds the SHAPE. The people are in data/story/cast.ts, so core
//  stays free of fiction and the fiction stays free of logic.
// ============================================================================

/** Every character id in the game. Widened by the data file, not by scenes. */
export type CastId = string;

export type Channel = 'message' | 'mail';

type Common = {
    id: CastId;
    /** What the inbox row says. */
    name: string;
    /**
     * The name the WORLD uses, when it differs from the one you use.
     *
     * Only the father has one. Nobody saves their father in their phone under
     * his full legal name, so the inbox says "Your Father" - but the news
     * headline that reports his death, the letter Pear sends afterwards and
     * the board's notice of condolence all say Gerald Hale, because to them
     * that is who he was. The gap between the two names is the relationship,
     * and it is doing work in the scene where those letters arrive.
     *
     * Falls back to `name` when absent, so this is not a field every member
     * has to think about.
     */
    legalName?: string;
    /** Their relationship to you - shown under the name. */
    role: string;
    /**
     * A writing direction, for whoever writes the next scene with them.
     *
     * Required, not optional. A cast member without a stated voice gets
     * written as whoever the author felt like that day, and three scenes
     * later the character is four different people.
     */
    tone: string;
};

export type CastMember =
    /** Phone only. No address, because they would never use one. */
    | (Common & { channels: 'message' })
    /** Mail, or both. An address is mandatory - a letter needs a sender. */
    | (Common & { channels: 'mail' | 'both'; email: string });

export type Cast = Record<CastId, CastMember>;

/** May this person write on this channel at all? */
export const canUseChannel = (member: CastMember | undefined, channel: Channel): boolean => {
    if (!member) return false;
    if (member.channels === 'both') return true;
    return member.channels === channel;
};

/** Their address, or undefined for the ones who only ever text. */
export const emailOf = (member: CastMember | undefined): string | undefined =>
    member && member.channels !== 'message' ? member.email : undefined;

/**
 * The name for a formal context: a headline, a legal notice, a stranger.
 *
 * Anything the player would not have typed themselves goes through here.
 */
export const formalNameOf = (member: CastMember | undefined): string =>
    member ? (member.legalName ?? member.name) : '';

/** Two letters for an avatar. Derived, so it cannot drift from the name. */
export const initialsOf = (name: string): string =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
