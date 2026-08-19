// src/data/story/pearBought.ts
//
// ============================================================================
//  THE LETTER RUNNING THE OTHER WAY
// ============================================================================
//
//  In the first quarter of the game Nathan Vogel wrote to buy your father's
//  company. It was a fair price, Vogel does not underpay, and the ending for
//  taking it is already in the endings file. This is the same letter twenty
//  years later, going the other direction.
//
//  ---------------------------------------------------------------------------
//  HE DOES NOT BEG, AND THAT IS THE WHOLE CRAFT PROBLEM
//  ---------------------------------------------------------------------------
//  The obvious version has him broken: pleading, or bitter, or making a speech
//  about respect. All three are worse, and for the same reason - they let the
//  player win an ARGUMENT, and an argument is something you can lose.
//
//  So he concedes nothing. He is precise, he is not gracious, and he says out
//  loud that you overpaid, which is true. He is not humbled by the letter; he
//  is simply writing it, and having to write it at all is the whole of it. The
//  fact does the work. Nothing he says can take the fact back.
//
//  THE CRACK IS ONE SENTENCE. He read a file again last night. That is the
//  second time in this game he has been up in the small hours because of this
//  family, and the first was pearMidnight, at 00:41, the one time he ever used
//  the player's number. Neither scene mentions the other. A player who saw
//  both will feel it and a player who saw only this one loses nothing.
//
//  ---------------------------------------------------------------------------
//  AND IT IS MAIL
//  ---------------------------------------------------------------------------
//  He texted once, ever, and closed it with "I will not use this number
//  again". Taking that back for a bigger occasion would spend the most
//  expensive thing the character owns on the scene that needs it least.
//
//  Mail is also the rhyme. He opened on this channel and he closes on it, with
//  a reference number in the subject line, exactly as he has done every time.
// ============================================================================

import type { Conversation } from '../../core/story/graph';

/**
 * Fires the quarter after the acquisition closes.
 *
 * Gated on `ownsPear`, which useCorporateFinanceStore raises inside
 * `executeAcquisition` once the money has actually moved. NOT on `movedOnPear`:
 * that one is raised by a bid he noticed, and a letter conceding the company
 * from a man who still owns it would be the loudest bug in the game.
 */
export const pearBought: Conversation = {
    id: 'pear-bought',
    channel: 'mail',
    from: 'pear',
    subject: 'Completion, ref 7724-B',
    when: [{ kind: 'flag', flag: 'ownsPear' }],
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'pear',
            // The same reference number as the first letter he ever sent about
            // your patents. He has one filing system and it does not care who
            // owns the building.
            text: 'The transfer completed at nine this morning. The paperwork was clean, which I would expect, since my people drew most of it.\n\nI am not going to be gracious about this. You paid too much and you know that you paid too much. That is how it is done. I have done it myself.',
            choices: [
                { text: 'I paid what it cost.', next: 'whatItCost' },
                { text: 'I would have paid more.', next: 'paidMore' },
            ],
        },

        {
            id: 'whatItCost',
            speaker: 'pear',
            text: 'Yes. That is the answer I would have given.\n\nThere is a folder on the eleventh floor with your father\'s name on the spine. It is a valuation we commissioned in 1997 and did not act on. I read it again last night.\n\nWe were four million out. Four million, on a company I could have owned for the price of the car I was driving.',
            choices: [
                { text: 'Why are you telling me this?', next: 'whyTelling' },
                { text: 'He would have said no.', next: 'wouldHaveSaidNo' },
            ],
        },

        {
            id: 'paidMore',
            speaker: 'pear',
            // He believes it, and it costs him more than the money did. This
            // is the only line in the letter where he is not in control of
            // the conversation.
            text: 'I believe you. That is the part I did not price, and I have had nineteen years to learn to.\n\nThere is a folder on the eleventh floor with your father\'s name on the spine, from 1997. I read it again last night. We were four million out on him.\n\nI have been wrong about the number twice now, about the same family.',
            choices: [
                { text: 'Why are you telling me this?', next: 'whyTelling' },
                { text: 'He would have said no.', next: 'wouldHaveSaidNo' },
            ],
        },

        {
            id: 'whyTelling',
            speaker: 'pear',
            text: 'Because in thirty years somebody will do this to you, and nobody told me either.\n\nI am out of the building by Friday. The staff list is on your desk with my recommendations written against forty of the names.\n\nYou should ignore the recommendations. You should read the list.',
            choices: [
                {
                    text: '(close)',
                    effects: [{ kind: 'ending', ending: 'boughtPear' }],
                },
            ],
        },

        {
            id: 'wouldHaveSaidNo',
            speaker: 'pear',
            // The confirmation, and the closest thing to a wound in the
            // letter. He kept the reply. He has kept it for twenty years.
            text: 'He did say no. In March, in writing, in two lines.\n\nIt is in the same folder. I have carried it badly for a long time and I am not going to carry it into your building.\n\nI am out by Friday. Do not redecorate the eleventh floor for a year. You will not know what you are throwing away.',
            choices: [
                {
                    text: '(close)',
                    effects: [{ kind: 'ending', ending: 'boughtPear' }],
                },
            ],
        },
    ],
};
