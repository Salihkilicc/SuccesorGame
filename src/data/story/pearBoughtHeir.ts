// src/data/story/pearBoughtHeir.ts
//
// ============================================================================
//  THE SAME COMPLETION LETTER, WRITTEN BY SOMEBODY WHO WAS NOT THERE
// ============================================================================
//
//  pearBought.ts is the founder's version and it is good BECAUSE it is
//  personal: Vogel wrote to this player's father in 1997, kept the two line
//  refusal for twenty years, and reads the file again the night he loses. Not
//  one sentence of that survives a succession.
//
//  Reported exactly: the letter talks as though the second generation bought
//  it, and we do not know which generation will. Worse than that once the
//  seats started turning over - by the fourth Hale, Pear is run by somebody
//  four names down the roster, and the founder's letter had her saying she
//  had been wrong about the number twice and had read a 1997 valuation again
//  last night. Three separate impossibilities in one paragraph.
//
//  ---------------------------------------------------------------------------
//  SO THE CRACK MOVES FROM THE MAN TO THE FILE
//  ---------------------------------------------------------------------------
//  The founder's version is one person conceding to another. This one cannot
//  be, and pretending otherwise is what would make it hollow. What it is
//  instead: an INSTITUTION handing over a grudge it has been keeping on
//  somebody else's behalf, by a chief executive who inherited the folder along
//  with the desk and has never understood why it was kept.
//
//  That is a different scene and a truer one for a game about inheritance. The
//  founder's letter is about a man who lost. This one is about how long a
//  company can carry something after everybody who felt it has gone.
//
//  ---------------------------------------------------------------------------
//  ONE FLAG SPLITS THEM
//  ---------------------------------------------------------------------------
//  `succeeded` is raised by runSuccession and never comes off. The founder has
//  it not; everybody after has it. So the two letters are `noFlag` and `flag`
//  on the same thing and exactly one can ever arrive.
//
//  The reference number is deliberately the same series. One filing system,
//  however many generations - which is the whole idea the scene is about.
// ============================================================================

import type { Conversation } from '../../core/story/graph';

export const pearBoughtHeir: Conversation = {
    id: 'pear-bought-heir',
    channel: 'mail',
    from: 'pear',
    subject: 'Completion, ref 7724-B',
    when: [
        { kind: 'flag', flag: 'ownsPear' },
        // Everybody after the founder. See the note above.
        { kind: 'flag', flag: 'succeeded' },
    ],
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'pear',
            // No warmth and no rancour. They have never met and both of them
            // know the letter is a formality.
            text: 'The transfer completed at nine this morning. The paperwork was clean, which I would expect, since my people drew most of it.\n\nI am not going to be gracious about this. You paid too much and you know that you paid too much. That is how it is done. This firm has done it.',
            choices: [
                { text: 'I paid what it cost.', next: 'whatItCost' },
                { text: 'Your predecessors tried to buy us.', next: 'triedToBuy' },
            ],
        },

        {
            id: 'whatItCost',
            speaker: 'pear',
            // The folder, as an object rather than a memory. She is describing
            // something she found, not something she did.
            text: 'Yes. That is the answer this desk would have given.\n\nThere is a folder on the eleventh floor with your family name on the spine. It predates me by a long way. Somebody has been adding to it since before I was hired, and nobody wrote down why.\n\nI have read it twice. It is a valuation, a refusal, and forty years of somebody keeping score.',
            choices: [
                { text: 'Who was keeping it?', next: 'whoKept' },
                { text: 'Send it with the rest.', next: 'sendIt' },
            ],
        },

        {
            id: 'triedToBuy',
            speaker: 'pear',
            text: 'Twice, that I can find. Neither of them was me and both of them are in the folder.\n\nWhat I notice is that the firm never stopped watching you. There is a file on your company thicker than the one on our own second factory, and no board paper anywhere explaining what it was for.\n\nThat is the part I would want, in your chair. Not the company. The forty years of attention.',
            choices: [
                { text: 'Who was keeping it?', next: 'whoKept' },
                { text: 'Send it with the rest.', next: 'sendIt' },
            ],
        },

        {
            id: 'whoKept',
            speaker: 'pear',
            // The whole scene, and it does not name him. A player who met
            // Vogel in the first act will know; one who did not loses nothing.
            text: 'A chief executive who left before my time, and then everybody who sat here after him, because it was in the handover and nobody wanted to be the one who threw it out.\n\nI inherited a grudge with the desk. I have never been able to work out whose it was.\n\nYou are getting it now. Do what you like with it.',
            choices: [
                {
                    text: '(close)',
                    effects: [{
                        kind: 'news',
                        headline: 'Pear passes to Hale. The board is replaced by Friday.',
                    }],
                },
            ],
        },

        {
            id: 'sendIt',
            speaker: 'pear',
            text: 'It will be on your desk with everything else. I would ask you to read it before you have the eleventh floor cleared.\n\nThere is a two line letter in it, from a man in your family, refusing an offer. It is the shortest document in the file and it is the reason for all the rest of them.\n\nI am out by Friday. I do not expect you to keep the folder. I would understand if you did.',
            choices: [
                {
                    text: '(close)',
                    effects: [{
                        kind: 'news',
                        headline: 'Pear passes to Hale. The board is replaced by Friday.',
                    }],
                },
            ],
        },
    ],
};
