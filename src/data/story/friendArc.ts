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
        { kind: 'quarterAtLeast', quarter: 9 },
        { kind: 'noFlag', flag: 'friendHelped' },
    ],
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'friend',
            text: 'hey. are you about\n\nnot a crisis. well. it is a bit of a crisis\n\ni have been trying to work out how to type this for two days and every version sounds like a man asking for money, which i suppose is what it is',
            choices: [
                { text: 'How much?', next: 'howMuch' },
                { text: 'Just tell me what happened.', next: 'whatHappened' },
            ],
        },

        {
            id: 'whatHappened',
            speaker: 'friend',
            // The detail that makes it real and not a plot device: it is a
            // boring, ordinary, entirely survivable cash-flow problem, which
            // is what actually kills small companies.
            text: 'our biggest customer went to ninety day terms without asking. that is it. that is the whole thing\n\nwe are profitable. we are profitable on paper in a way that means nothing because the money arrives in march and the wages are in january',
            choices: [
                { text: 'How much?', next: 'howMuch' },
            ],
        },

        {
            id: 'howMuch',
            speaker: 'friend',
            text: 'two hundred. thousand\n\ni have gone to a bank and two funds. the bank wants a personal guarantee on the house and the funds want twelve percent of the company for a bridge, which is not a bridge, it is a purchase with extra steps',
            choices: [
                { text: 'When would you pay it back?', next: 'payItBack' },
                { text: 'I will send it today.', next: 'yes' },
            ],
        },

        {
            id: 'payItBack',
            speaker: 'friend',
            // He does not oversell. He gives a real date and hedges it, which
            // is the most honest thing anybody says to the player all game.
            text: 'march. probably march\n\ni am not going to promise you march because i promised the bank march and then had to ring them, and i would rather be the person who told you april in january',
            choices: [
                { text: 'April is fine.', next: 'yes' },
                { text: 'I cannot do this one.', next: 'no' },
            ],
        },

        {
            id: 'yes',
            speaker: 'friend',
            // He does not gush, and he immediately makes it smaller, which is
            // how the people who mean it behave.
            text: 'oh thank god\n\nright. ok. i am going to stop typing before i say something we both have to live with\n\nthank you. i will not do this again',
            choices: [
                {
                    text: 'You can do it again.',
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
                        // Slightly less, and it is not a trap - keeping it a
                        // loan is a perfectly decent answer and he takes it
                        // as one. The difference is small on purpose.
                        { kind: 'dial', dial: 'friendLoyalty', delta: 12 },
                    ],
                },
            ],
        },

        {
            id: 'no',
            speaker: 'friend',
            // THE MOST IMPORTANT CARD IN THE FILE, and it must not sound like
            // a door closing. He is gracious, he means it, and he lets the
            // player off - which is precisely what makes the silence
            // afterwards land rather than feeling like a mechanic.
            //
            // Nothing here says "friendship over". No dial is shown. The only
            // effect the player could ever notice is the absence of every
            // message that would have come next, and they will not notice
            // that either.
            text: 'no of course. honestly i should not have asked, you have had a year\n\nforget i said anything. it will sort itself out, they always do\n\nsee you soon x',
            choices: [
                {
                    text: 'I am sorry.',
                    effects: [
                        { kind: 'flag', flag: 'friendRefused' },
                        { kind: 'dial', dial: 'friendLoyalty', delta: -25 },
                    ],
                },
                {
                    // A second chance, right at the edge, for the same reason
                    // the Pear ending has one: this should not be reachable
                    // by tapping through.
                    text: 'Wait. How long have you got?',
                    next: 'howLong',
                },
            ],
        },

        {
            id: 'howLong',
            speaker: 'friend',
            text: 'eleven days\n\nsorry. that was not fair, i had decided not to say that',
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
        { kind: 'quarterAtLeast', quarter: 15 },
    ],
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'friend',
            text: 'sent you two hundred back. and then i sent it back again by accident so tell your finance man to expect a phone call from a very embarrassed woman called priya\n\nalso we closed a round. properly. actual investors who ask actual questions',
            choices: [
                { text: 'You are paying me twice.', next: 'twice' },
                { text: 'What did you tell them?', next: 'whatDidYouTell' },
            ],
        },

        {
            id: 'twice',
            speaker: 'friend',
            text: 'i am aware. priya is aware. priya has said the words "reconciliation process" to me eleven times this week and i have started to enjoy it\n\ni used to run this company out of a notebook. we have a process now. i have a person whose job is to tell me no',
            choices: [
                { text: 'That is the whole job.', next: 'wholeJob' },
                { text: 'What did you tell the investors?', next: 'whatDidYouTell' },
            ],
        },

        {
            id: 'wholeJob',
            speaker: 'friend',
            text: 'i know that NOW\n\nyou could have said. you had one and everything',
            choices: [
                { text: 'You would not have listened.', next: 'whatDidYouTell' },
            ],
        },

        {
            id: 'whatDidYouTell',
            speaker: 'friend',
            // The line the scene exists for. He does not thank the player
            // again - he tells them what the money actually was, which is
            // more than a thank you and costs him more to say.
            text: 'the truth. that we nearly went under in january and a man i have known since we were nineteen sent me two hundred thousand pounds in an afternoon without asking to see the books\n\none of them asked what the terms were and i said there were not any and he went quiet for a bit',
            choices: [
                {
                    text: 'There were not any.',
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
