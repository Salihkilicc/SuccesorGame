// src/data/story/pearOffer.ts
//
// ============================================================================
//  THE OFFER — dictated, not written
// ============================================================================
//
//  It arrives the same day. That is the first insult and the only one Vogel
//  would defend as a courtesy: moving quickly is respectful of everyone's
//  time.
//
//  ---------------------------------------------------------------------------
//  HOW "HE IS NOT EVEN ADDRESSING YOU" IS DONE
//  ---------------------------------------------------------------------------
//  Not by making him rude. A rude letter is a letter written TO you, and being
//  insulted is a form of being noticed. Every device here is administrative:
//
//    - The subject line is a workflow, with a reference number and a slash.
//    - The salutation is "Dear Mr Hale", which is the dead man and also, now,
//      the player. Nobody updated the address book. It is not even wrong.
//    - One merge field did not populate. ONE - used once, so it lands as a
//      fact about the machine rather than as a running gag.
//    - The condolence and the offer share a paragraph.
//    - It references an attachment that is not attached.
//    - Vogel does not sign it. His office does, on his behalf, while he is
//      travelling.
//
//  He never uses the word "you" about the player as a person. It is "the
//  estate", "the holder", "the counterparty". The one place a human voice
//  appears is the postscript, and it is about something else entirely - which
//  is worse than if it were not there.
//
//  ---------------------------------------------------------------------------
//  THE TWO ANSWERS
//  ---------------------------------------------------------------------------
//  YES is a real ending and a fair price. It is the secret early finish, and
//  it must not be written as a punishment - the game does not get to scold
//  someone for taking a life-changing amount of money at twenty-six. The
//  bitterness is in the specifics, not in the verdict. See data/story/endings.
//
//  NO starts the actual game. Vogel does not argue, does not raise, does not
//  threaten. He acknowledges receipt. Four words of reply establish the
//  antagonist better than a page of menace: he is not going to fight you, he
//  is going to wait, and he has more time than you do.
// ============================================================================

import type { Conversation } from '../../core/story/graph';

/** Roughly a year of the company's revenue. Fair. That is the trap. */
const OFFER = 48_000_000;

export const pearOffer: Conversation = {
    id: 'pear-offer',
    channel: 'mail',
    from: 'pear',
    // The subject is an internal workflow with the player's family in it.
    subject: 'HALE / condolence + preliminary approach — ref 4471-C',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'pear',
            text:
                'Dear Mr Hale,\n\n'
                + 'Pear was saddened to learn of the passing of Gerald Hale, and we extend '
                + 'our condolences to the family and to the wider «COMPANY» team. In light '
                + 'of the transition, and to avoid a period of uncertainty for your staff '
                + 'and suppliers, we are writing to register a preliminary interest in '
                + 'acquiring the business in its entirety.\n\n'
                + 'Our indicative valuation is set out in the attached. In summary: '
                + `$${(OFFER / 1_000_000).toFixed(0)} million, cash, no financing condition, `
                + 'signed within thirty days.',
            choices: [
                { text: 'Read the rest.', next: 'rest' },
                { text: 'Look at the number again.', next: 'number' },
            ],
        },

        {
            id: 'number',
            speaker: 'pear',
            // The offer is genuinely fair, and that is what makes it hard.
            // An insultingly low offer would be easy to refuse and would cost
            // the scene everything.
            text:
                'The valuation reflects a full year of revenue and a premium for the '
                + 'brand, which we consider to be carried personally by the founder and '
                + 'therefore depreciating.\n\n'
                + 'We would not expect to improve on it and we would not expect the estate '
                + 'to find better. This is not a negotiating position; it is the number.',
            choices: [
                { text: 'Read the rest.', next: 'rest' },
            ],
        },

        {
            id: 'rest',
            speaker: 'pear',
            text:
                'Should the holder wish to proceed, our office will instruct counsel and '
                + 'the counterparty need take no further action.\n\n'
                + 'Sent on behalf of Nathan Vogel, who is travelling.\n\n'
                + 'P.S. Gerald and I sat on a panel in Lisbon a long time ago. He was very '
                + 'funny about a man from Siemens. I have thought about it since.',
            choices: [
                { text: 'Accept the offer.', next: 'accept' },
                { text: 'Decline.', next: 'decline' },
            ],
        },

        {
            id: 'accept',
            speaker: 'pear',
            // He does not celebrate and does not thank the player. The
            // machine simply moves to the next state, which is the last
            // thing it does.
            text:
                'Noted with thanks. Counsel will be in contact within the week; there is '
                + 'nothing further required from your side.\n\n'
                + 'We will retain the Hale name on the product line for a transitional '
                + 'period.',
            choices: [
                {
                    text: 'Sign it.',
                    effects: [
                        { kind: 'flag', flag: 'soldToPear' },
                        { kind: 'cash', amount: OFFER },
                        {
                            kind: 'news',
                            headline: 'Pear acquires Hale in an all-cash deal. Terms described as friendly.',
                        },
                        { kind: 'ending', ending: 'soldToPear' },
                    ],
                },
                {
                    // Still a way back, right at the edge. The scene is long
                    // enough that a player can drift into the ending, and an
                    // ending reached by drifting is one the player will not
                    // own afterwards.
                    text: 'Wait. No.',
                    next: 'decline',
                },
            ],
        },

        {
            id: 'decline',
            speaker: 'pear',
            // Four words. He is not going to fight; he is going to wait, and
            // he has more time than the player does.
            text: 'Noted. We will revisit.',
            choices: [
                {
                    text: '(close)',
                    effects: [
                        { kind: 'dial', dial: 'pearHostility', delta: 15 },
                        { kind: 'flag', flag: 'refusedPear' },
                        {
                            kind: 'news',
                            headline: 'Hale rejects an approach from Pear. The company declined to comment on the price.',
                        },
                    ],
                },
                {
                    text: 'Reply: we are not for sale.',
                    effects: [
                        // Saying it out loud costs more than silence. He now
                        // knows it is personal, and he files that.
                        { kind: 'dial', dial: 'pearHostility', delta: 22 },
                        { kind: 'flag', flag: 'refusedPear' },
                        { kind: 'dial', dial: 'publicReputation', delta: 3 },
                        // Everyone who writes to you next quarter read this.
                        { kind: 'flag', flag: 'refusedPearPublicly' },
                        {
                            kind: 'news',
                            headline: 'Hale rejects Pear approach publicly. "Not for sale" — the new chief executive.',
                        },
                    ],
                },
            ],
        },
    ],
};
