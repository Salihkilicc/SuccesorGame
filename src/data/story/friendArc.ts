// src/data/story/friendArc.ts
//
// ============================================================================
//  MARCO — the only person who ever asks you for something small
// ============================================================================
//
//  Two hundred thousand dollars. Against the numbers in this game it is
//  nothing: a rounding error on a quarter's marketing. That is exactly why it
//  works as the arc's hinge - the player is not being asked to make a
//  financial decision, they are being asked whether this is still a
//  friendship, and the game is careful never to say so.
//
//  ---------------------------------------------------------------------------
//  REFUSING PRODUCES NOTHING. THAT IS THE WHOLE DESIGN.
//  ---------------------------------------------------------------------------
//  No scene, no "you have lost a friend", no closing door, no dial readout.
//  He says something gracious, and then he never writes again.
//
//  Every later scene in this file requires `noFlag: friendRefused`. There is
//  no branch where he comes back cooler, because a cooler version would tell
//  the player they were being punished, and being told converts a loss into a
//  transaction they can feel they paid for.
//
//  Somebody who plays this and refuses will finish the game not knowing what
//  the market gossip was, that Planora was ever buyable, or that there was a
//  way to find out where Pear is soft. They will not know those things
//  existed. That is the correct amount of information.
//
//  ---------------------------------------------------------------------------
//  THE LADDER
//  ---------------------------------------------------------------------------
//  Helping does not buy a reward, it buys ACCESS, and what comes through the
//  channel improves as friendLoyalty rises:
//
//      any        - a rumour worth almost nothing, offered because he cannot
//                   help himself
//      high       - a competitor's real timing, worth money
//      extreme    - where Pear is soft, which he should not tell anybody
//
//  He is never trading. He is a person who talks too much to people he likes,
//  and the game is careful that the player is the one turning that into an
//  advantage.
// ============================================================================

import type { Conversation } from '../../core/story/graph';

const ASK = 200_000;

/** He has to still be speaking to you, which is the arc's only real gate. */
const STILL_SPEAKING = [
    { kind: 'flag' as const, flag: 'fatherDead' as const },
    { kind: 'noFlag' as const, flag: 'friendRefused' as const },
];

// ============================================================================
//  1. THE ASK
// ============================================================================
//  He is terrible at this. Four messages, lower case, and the number arrives
//  third because he cannot make himself lead with it.
//
//  His character note says he is bad at asking for help and that by the time
//  he asks it is already serious. Both are load-bearing here: he is not
//  chancing it, he has run out of other doors.
// ============================================================================
export const friendAsks: Conversation = {
    id: 'friend-asks',
    channel: 'message',
    from: 'friend',
    when: [
        ...STILL_SPEAKING,
        { kind: 'quarterAtLeast', quarter: 20 },
        { kind: 'noFlag', flag: 'friendHelped' },
    ],
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'friend',
            text: 'hey. are you about?\n\nnot a total crisis, but i need some help with cash flow.',
            choices: [
                { text: 'How much?', next: 'howMuch' },
                { text: 'Just tell me what happened.', next: 'whatHappened' },
            ],
        },

        {
            id: 'whatHappened',
            speaker: 'friend',
            text: 'our biggest customer pushed payment to 90 days. on paper we are fine, but wages are due before the check clears.',
            choices: [
                { text: 'How much?', next: 'howMuch' },
            ],
        },

        {
            id: 'howMuch',
            speaker: 'friend',
            text: 'two hundred thousand.\n\nbanks want personal guarantees and funds want 12% equity for a bridge loan.',
            choices: [
                { text: 'When would you pay it back?', next: 'payItBack' },
                { text: 'I will send it today.', next: 'yes' },
            ],
        },

        {
            id: 'payItBack',
            speaker: 'friend',
            text: 'march or april. i want to be straight with you on timing.',
            choices: [
                { text: 'April is fine.', next: 'yes' },
                { text: 'I cannot do this one.', next: 'no' },
            ],
        },

        {
            id: 'yes',
            speaker: 'friend',
            text: 'thank you so much. i will make sure this gets repaid properly.',
            choices: [
                {
                    text: 'You would do the same for me.',
                    effects: [
                        { kind: 'capital', amount: -ASK },
                        { kind: 'flag', flag: 'friendHelped' },
                        { kind: 'dial', dial: 'friendLoyalty', delta: 18 },
                    ],
                },
                {
                    text: 'Pay me back in April.',
                    effects: [
                        { kind: 'capital', amount: -ASK },
                        { kind: 'flag', flag: 'friendHelped' },
                        { kind: 'dial', dial: 'friendLoyalty', delta: 12 },
                    ],
                },
            ],
        },

        {
            id: 'no',
            speaker: 'friend',
            text: 'totally understand. forget i asked, we will figure something out.\n\ntalk soon x',
            choices: [
                {
                    text: 'I am sorry.',
                    effects: [
                        { kind: 'flag', flag: 'friendRefused' },
                        { kind: 'dial', dial: 'friendLoyalty', delta: -25 },
                    ],
                },
                {
                    text: 'Wait. How long have you got?',
                    next: 'howLong',
                },
            ],
        },

        {
            id: 'howLong',
            speaker: 'friend',
            text: 'about eleven days.',
            choices: [
                { text: 'I will send it today.', next: 'yes' },
                {
                    text: 'I still cannot.',
                    effects: [
                        { kind: 'flag', flag: 'friendRefused' },
                        { kind: 'dial', dial: 'friendLoyalty', delta: -25 },
                    ],
                },
            ],
        },
    ],
};

// ============================================================================
//  2. HE GETS BETTER AT IT
// ============================================================================
//  A year later. The point of this scene is that he is no longer the person
//  who needed rescuing, and he says so without making a thing of it - the
//  money mattered once and the friendship is what is left.
// ============================================================================
export const friendGrows: Conversation = {
    id: 'friend-grows',
    channel: 'message',
    from: 'friend',
    when: [
        ...STILL_SPEAKING,
        { kind: 'flag', flag: 'friendHelped' },
        { kind: 'noFlag', flag: 'friendGrewUp' },
        { kind: 'quarterAtLeast', quarter: 24 },
    ],
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'friend',
            text: 'wired the two hundred thousand back! also, we just closed a real funding round with proper investors.',
            choices: [
                { text: 'You are paying me back.', next: 'twice' },
                { text: 'What did you tell them?', next: 'whatDidYouTell' },
            ],
        },

        {
            id: 'twice',
            speaker: 'friend',
            text: 'we have actual finance processes now. hired someone whose main job is telling me no.',
            choices: [
                { text: 'That is the whole job.', next: 'wholeJob' },
                { text: 'What did you tell the investors?', next: 'whatDidYouTell' },
            ],
        },

        {
            id: 'wholeJob',
            speaker: 'friend',
            text: 'i know that now! you could have warned me.',
            choices: [
                { text: 'You would not have listened.', next: 'whatDidYouTell' },
            ],
        },

        {
            id: 'whatDidYouTell',
            speaker: 'friend',
            text: 'the truth: we nearly went under, and an old friend wired the money same-day with no questions asked.',
            choices: [
                {
                    text: 'No questions needed between friends.',
                    effects: [
                        { kind: 'flag', flag: 'friendGrewUp' },
                        { kind: 'dial', dial: 'friendLoyalty', delta: 10 },
                        { kind: 'cash', amount: ASK },
                        {
                            kind: 'news',
                            headline: 'Planora closes a funding round. The scheduling firm says it is now profitable.',
                        },
                    ],
                },
                {
                    text: 'I would like the interest.',
                    effects: [
                        { kind: 'flag', flag: 'friendGrewUp' },
                        { kind: 'dial', dial: 'friendLoyalty', delta: 4 },
                        { kind: 'cash', amount: Math.round(ASK * 1.08) },
                        {
                            kind: 'news',
                            headline: 'Planora closes a funding round. The scheduling firm says it is now profitable.',
                        },
                    ],
                },
            ],
        },
    ],
};
