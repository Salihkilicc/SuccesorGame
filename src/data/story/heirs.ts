// src/data/story/heirs.ts
//
// ============================================================================
//  THREE SHORT SCENES, AND NOBODY IS NAMED IN ANY OF THEM
// ============================================================================
//
//  These are ordinary Conversations, played by the ordinary runner, and that
//  buys everything: the player answers, the scene ends, the transcript stays in
//  the thread, the audit validates the graph, and the translator gets keys like
//  every other line in the game.
//
//  ---------------------------------------------------------------------------
//  WHICH MEANT THEY COULD NOT USE THE CHILDREN'S NAMES
//  ---------------------------------------------------------------------------
//  A Conversation is STATIC DATA - see the note at the top of
//  core/market/postNegotiationReplies.ts, which had to be generated for exactly
//  this reason. Children are named by the player. So a sibling saying "Elena
//  has never sold anything" would need a templating language inside a data
//  file, and the whole story system exists to keep them out of one.
//
//  The constraint turned out to be the writing advice. Nobody in this family
//  says a name:
//
//      "the one you put in the annual report"
//      "your other son"
//      "whoever it is this month"
//
//  Which is how people talk about a sibling they are furious with, and it is
//  the register the rest of this game is written in anyway. It is also load-
//  bearing: it works whether there are two children or five.
//
//  ---------------------------------------------------------------------------
//  SHORT, AND THEY END
//  ---------------------------------------------------------------------------
//  Two cards each. The player answers once, sometimes twice, and it is over -
//  the request was "let them write a lot and we answer and it finishes", and
//  the second half of that is the harder one to hold to.
//
//  NO EFFECTS. Nothing here moves a dial or a number, and that is deliberate
//  for now: a child lobbying you should be a thing you feel rather than a thing
//  you optimise. The moment it pays out, the player answers to farm it.
// ============================================================================

import type { Conversation } from '../../core/story/graph';

/**
 * The only child, selling themselves to a parent who has not asked.
 *
 * The saddest of the three. There is nobody to run down, so they run
 * themselves up, and they are transparently working from a script they
 * rehearsed.
 */
export const heirAlone: Conversation = {
    id: 'heir-alone',
    channel: 'message',
    from: 'heir',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'heir',
            text: 'I read the quarterly. All of it, not the summary.\n\nI had some thoughts about the marketing line but I am not going to send them unless you want them. I just wanted you to know that I read it.',
            choices: [
                { text: 'Send me the thoughts.', next: 'thoughts' },
                { text: 'You do not have to read those.', next: 'notHaveTo' },
            ],
        },
        {
            id: 'thoughts',
            speaker: 'heir',
            // The tell: they had it ready. They were waiting to be asked.
            text: 'Right. Give me an hour and I will write it properly.\n\nIt is mostly one thing. We spend on the products that are already selling, which is the safe half of the money doing the easy half of the job.\n\nThat might be wrong. I have not run a company.',
            choices: [
                { text: 'It is not wrong.', next: 'notWrong' },
                { text: 'It is not wrong, and it is not the whole picture.', next: 'notWrong' },
            ],
        },
        {
            id: 'notHaveTo',
            speaker: 'heir',
            text: 'I know.\n\nI do it anyway. You do not have to do anything with that.',
            choices: [
                { text: 'Send me the thoughts anyway.', next: 'thoughts' },
                { text: 'I am glad you do.', next: 'notWrong' },
            ],
        },
        {
            id: 'notWrong',
            speaker: 'heir',
            // Terminal. The last line is the one the whole scene is for.
            text: 'Okay.\n\nI was not fishing. I want to be clear that I was not fishing.\n\nGoodnight.',
            choices: [{ text: 'Goodnight.', effects: [] }],
        },
    ],
};

/**
 * Passed over, and taking it out on whoever was not.
 *
 * The one with the digs in it. They never say the sibling's name, which reads
 * as fury rather than as a constraint - people do not use the name of somebody
 * they are this angry with.
 */
export const heirPassedOver: Conversation = {
    id: 'heir-passed-over',
    channel: 'message',
    from: 'heir',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'heir',
            text: 'I see the one you put in the annual report has opinions about the plant now.\n\nGreat. Genuinely. Somebody should.',
            choices: [
                { text: 'Say what you actually want to say.', next: 'actually' },
                { text: 'This is not a competition.', next: 'notACompetition' },
            ],
        },
        {
            id: 'actually',
            speaker: 'heir',
            text: 'Fine.\n\nI have been in that building every summer since I was fourteen. I know the names of people on the floor. The other one turned up in March, said something about digital, and got a paragraph.\n\nI am not asking you to change anything. I am asking you to have noticed.',
            choices: [
                { text: 'I noticed.', next: 'noticed' },
                { text: 'A paragraph is not the company.', next: 'notTheCompany' },
            ],
        },
        {
            id: 'notACompetition',
            speaker: 'heir',
            // The line that does the work. They are right, and being right is
            // not going to help them.
            text: 'It has one name on it at the end.\n\nYou can call that whatever you like.',
            choices: [
                { text: 'Say what you actually want to say.', next: 'actually' },
                { text: 'Not yet it does not.', next: 'notYet' },
            ],
        },
        {
            id: 'noticed',
            speaker: 'heir',
            text: 'Okay.\n\nThat is all I wanted. I am aware of how this sounded and I am not going to apologise for it, because I meant all of it and an apology would be the second lie.',
            choices: [{ text: 'Nothing to apologise for.', effects: [] }],
        },
        {
            id: 'notTheCompany',
            speaker: 'heir',
            text: 'No. But it is what people read.\n\nI will let it go. I am not going to bring it up again, which you should probably not take as good news.',
            choices: [{ text: 'Understood.', effects: [] }],
        },
        {
            id: 'notYet',
            speaker: 'heir',
            text: 'Not yet.\n\nI will take that. It is more than I was expecting and I am going to be annoying about how much I am taking it.',
            choices: [{ text: 'Goodnight.', effects: [] }],
        },
    ],
};

/**
 * Chosen, and defending a position nobody has attacked.
 *
 * They fire because `pressure` reads their ambition against their loyalty, so
 * this only arrives from an heir who is ambitious and unsure. A loyal one has
 * nothing to prove and never sends it.
 */
export const heirChosen: Conversation = {
    id: 'heir-chosen',
    channel: 'message',
    from: 'heir',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'heir',
            text: 'Can I ask you something and have you answer it properly.\n\nIs it decided, or is it decided for now.',
            choices: [
                { text: 'It is decided.', next: 'decided' },
                { text: 'Nothing is decided for ever.', next: 'forNow' },
            ],
        },
        {
            id: 'decided',
            speaker: 'heir',
            // Reassurance does not land, which is the truth about this kind
            // of anxiety and the reason the scene is worth having.
            text: 'Right.\n\nI am going to believe that for about a week and then I am going to be back here asking again, and we will both pretend that is the first time.\n\nSorry. Thank you. Both of those.',
            choices: [{ text: 'Ask as often as you want.', effects: [] }],
        },
        {
            id: 'forNow',
            speaker: 'heir',
            text: 'That is the honest answer and I would rather have it than the other one.\n\nI do watch, you know. Every time somebody else gets a good quarter I read your face in the photographs.',
            choices: [
                { text: 'You are reading a photograph.', next: 'photograph' },
                { text: 'Then stop watching and go and get one.', next: 'goGetOne' },
            ],
        },
        {
            id: 'photograph',
            speaker: 'heir',
            text: 'I know.\n\nIt is still the only thing I have got to read.',
            choices: [{ text: 'Then ask me instead.', effects: [] }],
        },
        {
            id: 'goGetOne',
            speaker: 'heir',
            text: 'Yes.\n\nThat is the correct answer and I hate it, which is usually how I know.',
            choices: [{ text: 'Goodnight.', effects: [] }],
        },
    ],
};

/** Keyed by the scene `heirTurnFor` chose. */
export const HEIR_CONVERSATIONS = {
    alone: heirAlone,
    passedOver: heirPassedOver,
    chosen: heirChosen,
} as const;
