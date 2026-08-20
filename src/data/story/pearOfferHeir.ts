// src/data/story/pearOfferHeir.ts
//
// ============================================================================
//  THE SAME LETTER, TO THE NEXT ONE
// ============================================================================
//
//  Vogel wrote to a twenty six year old who had just buried his father and
//  inherited a factory. The letter was polite, the price was fair, and the
//  timing was obscene: it arrived a fortnight after the funeral, because a
//  company changing hands is the only moment it can be bought cheaply.
//
//  A succession is that moment again. So he writes again, and the thing that
//  makes it land is that he does not pretend otherwise.
//
//  ---------------------------------------------------------------------------
//  IT IS THE MAIN STORY, SEEN FROM THE OTHER END
//  ---------------------------------------------------------------------------
//  The whole spine of this game is one question asked twice: will you sell your
//  father's company. The first act asks it of the founder. This asks it of
//  somebody who never met the man whose name is on the building, and who was
//  handed the answer rather than choosing it.
//
//  That is why the price is not the interesting part. He is offering a
//  fortune - `pearOfferAmount` is a premium on a company that is now worth
//  billions - and the heir has spent four days in a chair they did not earn.
//  Taking it is the easiest decision in the game and the one with the most
//  behind it.
//
//  ---------------------------------------------------------------------------
//  AND HE DOES NOT WRITE IF YOU ALREADY OWN HIM
//  ---------------------------------------------------------------------------
//  Gated on `noFlag: ownsPear`, which is the point of the whole thing. A
//  player whose grandfather bought Pear gets no letter, because there is
//  nobody left to send it. That is the reward, and it is silence.
// ============================================================================

import type { Conversation } from '../../core/story/graph';

export const pearOfferHeir: Conversation = {
    id: 'pear-offer-heir',
    channel: 'mail',
    from: 'pear',
    // The same reference series as every other letter he has ever sent this
    // family. One filing system, three generations.
    subject: 'HALE / transition, renewed approach, ref 4471-C',
    when: [
        { kind: 'flag', flag: 'succeeded' },
        // He cannot write to you about buying a company you own.
        { kind: 'noFlag', flag: 'ownsPear' },
    ],
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'pear',
            // Addressed to the office rather than the person. He does not know
            // this one and is not going to pretend he does.
            text: 'Dear {title} Hale,\n\nPear notes the change at the head of «COMPANY» and extends its regards to the family.\n\nWe wrote in materially these terms to your predecessor. The circumstances are the same and so is our view, though the number has moved a good deal: {pearOffer}, cash, no financing condition, signed within thirty days.',
            choices: [
                { text: 'You wrote this to my father.', next: 'toMyFather' },
                { text: 'Why now?', next: 'whyNow' },
            ],
        },

        {
            id: 'toMyFather',
            speaker: 'pear',
            // He confirms it without a shred of embarrassment, which is the
            // character. Twenty years and he has not learned to be sorry.
            text: 'We did. He declined, and he was entitled to.\n\nI would observe that he declined a number he had spent his life earning, and that you are declining one you were handed on a Tuesday. Those are not the same act and it would be a mistake to feel them as though they were.',
            choices: [
                { text: 'Send the papers.', next: 'accept' },
                { text: 'It is not for sale.', next: 'decline' },
            ],
        },

        {
            id: 'whyNow',
            speaker: 'pear',
            text: 'Because a company changes hands twice in its life and this is the second one.\n\nA business is never cheaper than in the quarter somebody inherits it, and I would be failing the people I work for if I pretended not to know that. You would do the same. You may find you have to.',
            choices: [
                { text: 'Send the papers.', next: 'accept' },
                { text: 'It is not for sale.', next: 'decline' },
            ],
        },

        {
            id: 'accept',
            speaker: 'pear',
            text: 'Noted with thanks. Counsel will be in contact within the week.\n\nThe name comes off the building in the second year. I mention it now rather than letting you find it in a schedule, which is more courtesy than I extended to your father and is the only thing about this I would do differently.',
            choices: [
                {
                    text: 'Sign it.',
                    effects: [
                        { kind: 'flag', flag: 'soldToPear' },
                        { kind: 'sellToPear' },
                        {
                            kind: 'news',
                            headline: 'Pear acquires Hale from the family. The transition was described as orderly.',
                        },
                        { kind: 'ending', ending: 'soldWhatYouInherited' },
                    ],
                },
                {
                    // The way back, right at the edge, exactly as the first
                    // letter has one. An ending reached by drifting is one the
                    // player will not own afterwards.
                    text: 'Wait. No.',
                    next: 'decline',
                },
            ],
        },

        {
            id: 'decline',
            speaker: 'pear',
            // Five words this time, one fewer than the first letter. He has
            // done this before and he has less to say about it.
            text: 'Noted. We will revisit in time.',
            choices: [
                {
                    text: '(close)',
                    effects: [
                        { kind: 'dial', dial: 'pearHostility', delta: 12 },
                        { kind: 'flag', flag: 'refusedPear' },
                        {
                            kind: 'news',
                            headline: 'Hale rejects a renewed approach from Pear. The family retains control.',
                        },
                    ],
                },
                {
                    text: 'Reply: my father said no as well.',
                    effects: [
                        // Claiming the refusal as inherited rather than made
                        // is the answer that costs most, and he files it.
                        { kind: 'dial', dial: 'pearHostility', delta: 20 },
                        { kind: 'flag', flag: 'refusedPear' },
                        { kind: 'flag', flag: 'refusedPearPublicly' },
                        { kind: 'dial', dial: 'publicReputation', delta: 4 },
                        {
                            kind: 'news',
                            headline: 'The new head of Hale rejects Pear, citing the founder. Analysts call it sentiment.',
                        },
                    ],
                },
            ],
        },
    ],
};
