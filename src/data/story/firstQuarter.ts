// src/data/story/firstQuarter.ts
//
// ============================================================================
//  THE FIRST THING ANYBODY SAYS TO THE NEW ONE
// ============================================================================
//
//  The plan for this step was a list of scenes a successor replays: the
//  sibling of OPENING_ACT, naming the conversations that are about the COMPANY
//  rather than about the founder, so the CFO could size up the new chief
//  executive the way he sized up the last one.
//
//  Reading the beats through, that list has one honest entry on it. Almost
//  everything in this game IS about the founder: the CFO's confession about
//  the widow and the patent is a thing said once to one person, the friend is
//  the founder's friend and would be seventy, the condolences are for a man
//  who died fifty years ago. Replaying any of them would be a scene arriving
//  addressed to somebody who is not there.
//
//  So the mechanism was not the missing thing. What was missing was a
//  BEGINNING: the second generation opens on a quarterly report and silence,
//  where the first opened on a letter from a father.
//
//  ---------------------------------------------------------------------------
//  AND IT COMES FROM THE PERSON WITH THE MOST TO SAY
//  ---------------------------------------------------------------------------
//  Not the CFO and not the board. The SIBLING, who inherited stock under
//  inheritance.ts four days ago and is now a director in a company they do not
//  run, writing to the brother or sister who does.
//
//  Everything in the last several prompts points here. They were writing about
//  the annual report at sixteen, they were passed over, they were paid the same
//  cash and given a fifth of the stock, and they now have a vote. The first
//  message of the new generation is that arriving.
//
//  He is not threatening and must not be. A threat is answerable. He is being
//  correct, which is worse, and the last line is procedural.
//
//  ---------------------------------------------------------------------------
//  NOBODY IS NAMED, FOR THE THIRD TIME
//  ---------------------------------------------------------------------------
//  Same constraint as data/story/heirs.ts and the same solution. A Conversation
//  is STATIC DATA and these people are named by the player, so the poster puts
//  the real name on the thread and the script never says one. It has stopped
//  being a constraint and started being the register the family talks in.
// ============================================================================

import type { Conversation } from '../../core/story/graph';

/**
 * From the sibling who now holds stock.
 *
 * The one that fires when there is anybody else. Cold, procedural, and the
 * closest thing to a threat in it is a sentence about a filing deadline.
 */
export const successionSibling: Conversation = {
    id: 'succession-sibling',
    channel: 'message',
    from: 'heir',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'heir',
            // No condolences, and the absence is the character. They are not
            // pretending this is a sad week for them.
            text: 'The registrar copied me on the transfer this morning, so I know what I have and I know what you have.\n\nI am not going to pretend to be surprised by the split. He told me in the garden two years ago and I have had two years to be reasonable about it.',
            choices: [
                { text: 'And are you being reasonable about it?', next: 'reasonable' },
                { text: 'It is not a competition.', next: 'notACompetition' },
            ],
        },

        {
            id: 'reasonable',
            speaker: 'heir',
            text: 'I am being correct. It is not the same thing and it is more useful to you.\n\nI will read everything you send the shareholders. I will read it properly, which is more than anybody else on that register will do, and if it is good I will say so out loud where it counts.',
            choices: [
                { text: 'And if it is not good?', next: 'ifNotGood' },
                { text: 'That is more than I expected.', next: 'moreThanExpected' },
            ],
        },

        {
            id: 'notACompetition',
            speaker: 'heir',
            // The line the previous generation used, coming back the other
            // way up. In the heir messages it was theirs; here it is yours,
            // and they have an answer to it now.
            text: 'It has one name on it at the end. You used to say that to me.\n\nNow it has your name on it and I have twelve per cent of it, so we are both going to have to live in the sentence.',
            choices: [
                { text: 'And are you being reasonable about it?', next: 'reasonable' },
                { text: 'Then help me with it.', next: 'helpMe' },
            ],
        },

        {
            id: 'ifNotGood',
            speaker: 'heir',
            text: 'Then I will say that out loud too, in the same room, and you will not hear it from me first because you will have already read the numbers.\n\nThat is what a shareholder is. I am sorry it is me.',
            choices: [{ text: 'Do not be sorry.', effects: [] }],
        },

        {
            id: 'moreThanExpected',
            speaker: 'heir',
            text: 'Then you were expecting the wrong thing, which does not fill me with confidence about the rest of it.\n\nThe annual meeting is in eleven weeks. Send me the numbers before you send them to the others. Not as a courtesy. As practice.',
            choices: [{ text: 'I will.', effects: [] }],
        },

        {
            id: 'helpMe',
            speaker: 'heir',
            // The closest this scene comes to warmth, and it is still a
            // negotiation. They have not stopped counting.
            text: 'I was always going to.\n\nI would have liked to be asked before you needed it, but I understand that this week has been what it has been.\n\nThe annual meeting is in eleven weeks. Send me the numbers early.',
            choices: [{ text: 'Eleven weeks.', effects: [] }],
        },
    ],
};

/**
 * And the version where there is nobody else.
 *
 * The only child inherits the whole holding and an empty building. Nobody is
 * competing with them, which is the harder start rather than the easier one,
 * and this is the CFO writing because there is nobody in the family left to.
 */
export const successionAlone: Conversation = {
    id: 'succession-alone',
    channel: 'message',
    from: 'cfo',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cfo',
            text: 'You will find the eleventh floor has been cleared. I asked them to do it before you came in rather than while you were sitting there.\n\nThere is nobody else on the register with your name. I have been doing this a long time and I have not seen that before.',
            choices: [
                { text: 'Is that good or bad?', next: 'goodOrBad' },
                { text: 'It is not a comfort.', next: 'notAComfort' },
            ],
        },

        {
            id: 'goodOrBad',
            speaker: 'cfo',
            text: 'It means nobody in this building can outvote you and nobody in this building will tell you the truth for free.\n\nYou will have to go and get it. I will give you mine when you ask for it and not before, because that is the arrangement I had with the last one and it worked for thirty years.',
            choices: [{ text: 'Then I am asking.', effects: [] }],
        },

        {
            id: 'notAComfort',
            speaker: 'cfo',
            text: 'No. It is not meant to be.\n\nThe quarterly is on your desk. It is not a good one and it was not going to be, and reading it today rather than on Monday is the first decision you get to make.',
            choices: [{ text: 'Today, then.', effects: [] }],
        },
    ],
};

/** Keyed by whether there is anybody else holding stock. */
export const SUCCESSION_CONVERSATIONS = {
    sibling: successionSibling,
    alone: successionAlone,
} as const;
