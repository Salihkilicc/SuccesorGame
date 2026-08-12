// src/data/events/brotherPlot.ts
//
// ============================================================================
//  WHAT HE DOES WHEN HE HAS STOPPED ASKING
// ============================================================================
//
//  Three scenes, and the interesting one is the third.
//
//    1. HE VOTES AGAINST YOU, and tells you about it himself, warmly.
//    2. HE MEETS PEAR, and does not tell you.
//    3. THE CFO TELLS YOU - if the CFO is still speaking to you.
//
//  ---------------------------------------------------------------------------
//  THE WARNING IS GATED ON A DIFFERENT ARC, AND THAT IS THE POINT
//  ---------------------------------------------------------------------------
//  Scene 3 needs cfoTrust. A player who spent the CFO arc dismissing him gets
//  no warning at all - the meeting still happens, the votes still land, and
//  the first they hear of it is the board removing them.
//
//  This is the first place two arcs are load-bearing on each other, and it is
//  worth being precise about why it is better than a generic "you missed
//  something". The player did not fail a check. They made a decision, several
//  quarters earlier, about somebody unrelated, and it cost them the one thing
//  that would have let them see this coming. Nothing in the game says so at
//  the time. Nothing says so afterwards either.
//
//  ---------------------------------------------------------------------------
//  HE IS NOT LYING IN ANY OF THESE
//  ---------------------------------------------------------------------------
//  Same rule as the dividend file. He votes against you and says so. He meets
//  Pear and, if asked directly, admits it immediately and is puzzled by the
//  fuss. What he never does is volunteer the one that matters before it
//  matters - and he would tell you that is not the same as lying, and he would
//  be right, and it would not help.
// ============================================================================

import type { Conversation } from '../../core/story/graph';
import type { GameEvent } from '../../core/events/types';

/** He has to have somewhere to be aggrieved from, and time to have got there. */
const LATE_AND_COLD = [
    { kind: 'flag' as const, flag: 'fatherDead' as const },
    { kind: 'quarterAtLeast' as const, quarter: 12 },
    { kind: 'dialAtMost' as const, dial: 'brotherTrust' as const, band: 'low' as const },
];

// ============================================================================
//  1. THE VOTE
// ============================================================================
//  He votes against you and messages you about it the same afternoon, kindly.
//  The kindness is not a performance - he genuinely does not think a vote is
//  personal, and he genuinely cannot see that this is the thing about him.
// ============================================================================
export const brotherVote: Conversation = {
    id: 'event-brother-vote',
    channel: 'message',
    from: 'brother',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'brother',
            text: 'I voted against the capital plan. I wanted you to hear it from me before you saw the tally.\n\nIt is not personal. I would have voted against it if Dad had put it up, and I told him so twice about things he put up.',
            choices: [
                { text: 'You did not tell me you had concerns.', next: 'concerns' },
                { text: 'Fine. That is what the vote is for.', next: 'thatIsWhat' },
            ],
        },

        {
            id: 'concerns',
            speaker: 'brother',
            // He is right about the mechanism and wrong about the relationship,
            // and he cannot tell those apart.
            text: 'I raised it. In writing, in the pack, eleven days ago. Page four.\n\nI am not being clever — I genuinely thought you had read it and disagreed, which would have been fine.',
            choices: [
                { text: 'I had not read page four.', next: 'pageFour' },
                { text: 'Raising it in a pack is not telling me.', next: 'notTelling' },
            ],
        },

        {
            id: 'pageFour',
            speaker: 'brother',
            text: 'Then that is the actual problem and it is not one either of us wants to look at tonight.\n\nRead the pack. I will keep writing things in it.',
            choices: [
                {
                    text: 'I will read it.',
                    effects: [{ kind: 'dial', dial: 'brotherTrust', delta: 6 }],
                },
            ],
        },

        {
            id: 'notTelling',
            speaker: 'brother',
            // The needle, in its cold form: not a jab, a correction.
            text: 'It is exactly telling you. It is the only way of telling you that leaves a record, which I have learned to want.\n\nYou get to run it. I get to write things down. I did not choose that division and I am not going to apologise for using my half of it.',
            choices: [
                {
                    text: '(leave it)',
                    effects: [
                        { kind: 'dial', dial: 'brotherTrust', delta: -8 },
                        { kind: 'flag', flag: 'brotherPlottedOpenly' },
                    ],
                },
                {
                    text: 'Then write to me directly. I will answer.',
                    effects: [{ kind: 'dial', dial: 'brotherTrust', delta: 9 }],
                },
            ],
        },

        {
            id: 'thatIsWhat',
            speaker: 'brother',
            text: 'It is.\n\nI would rather we were the kind of family that argued before the meeting instead of during it, but this is fine too. This is a perfectly normal way for a company to work.',
            choices: [
                {
                    text: '(leave it)',
                    effects: [{ kind: 'dial', dial: 'brotherTrust', delta: -4 }],
                },
                {
                    text: 'Come to lunch before the next one.',
                    effects: [{ kind: 'dial', dial: 'brotherTrust', delta: 10 }],
                },
            ],
        },
    ],
};

export const brotherVoteEvent: GameEvent = {
    id: 'brother-vote',
    when: LATE_AND_COLD,
    chance: 0.5,
    cooldown: 5,
    conversation: brotherVote,
    headline: 'A split vote on the Hale board. The company said the item was carried.',
    priority: 2,
};

// ============================================================================
//  2. THE CFO FINDS OUT
// ============================================================================
//  Gated on cfoTrust. A player who burned him gets nothing, and the meeting
//  happens anyway.
//
//  He does not accuse. He reports a diary entry and a restaurant, and lets the
//  player do the arithmetic - which is both in character and considerably more
//  frightening than an accusation would be.
// ============================================================================
export const cfoWarnsAboutBrother: Conversation = {
    id: 'event-cfo-warns-brother',
    channel: 'message',
    from: 'cfo',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cfo',
            text: 'A factual message, and I want to be careful to keep it factual.\n\nYour brother had lunch on the fourteenth at Cavendish with two people. One of them was Nathan Vogel. I know because I was there, at a different table, for an entirely boring reason.',
            choices: [
                { text: 'Did he see you?', next: 'didHeSeeMe' },
                { text: 'That is not necessarily anything.', next: 'notNecessarily' },
            ],
        },

        {
            id: 'notNecessarily',
            speaker: 'cfo',
            // He agrees with the objection completely and then adds one fact,
            // which is how a careful man says something enormous.
            text: 'It is not. I have thought about that for a week before writing to you.\n\nThe fact I keep returning to is that Vogel does not have lunch. In eleven years of watching that man I have never known him eat with somebody he was not buying something from.',
            choices: [
                { text: 'Did he see you?', next: 'didHeSeeMe' },
                { text: 'What do you want me to do?', next: 'whatDoIDo' },
            ],
        },

        {
            id: 'didHeSeeMe',
            speaker: 'cfo',
            // The detail that decides it, and it is small enough to be true.
            text: 'Yes. He came over, and he was warm, and he introduced me to the other man as "my brother\'s finance director".\n\nHe did not introduce me to Vogel. Vogel and I have met four times.',
            choices: [
                { text: 'What do you want me to do?', next: 'whatDoIDo' },
                { text: 'He is not hiding it, then.', next: 'notHiding' },
            ],
        },

        {
            id: 'notHiding',
            speaker: 'cfo',
            // The distinction the whole brother arc turns on, stated by
            // somebody who has watched him do it for a year.
            text: 'No. That is what makes it hard to do anything about.\n\nHe is not hiding it. He is simply not telling you, and he would say those are different, and in a court they are.',
            choices: [
                { text: 'What do you want me to do?', next: 'whatDoIDo' },
            ],
        },

        {
            id: 'whatDoIDo',
            speaker: 'cfo',
            text: 'Ask him. Tonight, plainly, and do not dress it up.\n\nIf he tells you the truth immediately — and I think he will — then you have learned something valuable and nothing has gone wrong yet. If he does not, you have learned something worse and you have learned it early.',
            choices: [
                {
                    text: 'I will ask him.',
                    effects: [
                        { kind: 'dial', dial: 'cfoTrust', delta: 6 },
                        {
                            kind: 'schedule',
                            conversation: 'event-brother-caught',
                            afterQuarters: 0,
                            urgent: true,
                        },
                    ],
                },
                {
                    text: 'I would rather watch him for a quarter.',
                    effects: [
                        // Also a real answer, and it costs the CFO something
                        // to be told his advice is being sat on.
                        { kind: 'dial', dial: 'cfoTrust', delta: -3 },
                        { kind: 'dial', dial: 'pearHostility', delta: 5 },
                    ],
                },
            ],
        },
    ],
};

export const cfoWarnsAboutBrotherEvent: GameEvent = {
    id: 'cfo-warns-brother',
    when: [
        ...LATE_AND_COLD,
        { kind: 'noFlag', flag: 'cfoResigned' },
        // THE GATE THAT MATTERS. He does not bring you this if you have spent
        // two years not listening to him - not out of spite, but because a man
        // who has been ignored eleven times does not bring you the twelfth
        // thing, and this one he would have to stick his neck out for.
        { kind: 'dialAtLeast', dial: 'cfoTrust', band: 'high' },
        { kind: 'dialAtLeast', dial: 'pearHostility', band: 'low' },
    ],
    chance: 0.7,
    cooldown: 10,
    conversation: cfoWarnsAboutBrother,
    headline: 'Sector chatter about informal contact between Pear and Hale shareholders.',
    priority: 4,
};

// ============================================================================
//  3. ASKING HIM
// ============================================================================
//  He admits it instantly. That is the whole scene, and it is why he is not a
//  villain: there is no lie to catch him in, and the player is left holding
//  something worse than a lie, which is a person who genuinely does not think
//  he has done anything.
// ============================================================================
export const brotherCaught: Conversation = {
    id: 'event-brother-caught',
    channel: 'message',
    from: 'brother',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'brother',
            text: 'Yes. Cavendish, the fourteenth. Vogel and a man from their corporate team whose name I did not catch.\n\nI assume Sinclair told you. Good. I would rather you heard it than wondered why I was in town.',
            choices: [
                { text: 'What did he want?', next: 'whatWanted' },
                { text: 'You did not tell me.', next: 'didNotTell' },
            ],
        },

        {
            id: 'didNotTell',
            speaker: 'brother',
            // Genuinely puzzled, and it is the most damning thing in the arc
            // precisely because it is not a defence - it is a description of
            // how he sees the world.
            text: 'I was going to. I was going to tell you at the meeting, in front of everybody, because I thought that was the correct place for it.\n\nWhat would you have had me do — ring you from the restaurant?',
            choices: [
                { text: 'Yes.', next: 'yes' },
                { text: 'What did he want?', next: 'whatWanted' },
            ],
        },

        {
            id: 'yes',
            speaker: 'brother',
            text: 'Right.\n\nI will remember that you said yes, and I will do it next time, and I will feel ridiculous doing it. Noted.',
            choices: [
                { text: 'What did he want?', next: 'whatWanted' },
            ],
        },

        {
            id: 'whatWanted',
            speaker: 'brother',
            // The actual information, and it is bad. He delivers it without
            // any sense that he is the subject of it.
            text: 'To know whether fifteen percent would move. Not to buy it — to know whether it WOULD, in principle, one day, if the price were serious.\n\nI said what I have always said. That it is not for sale while it is a family company.',
            choices: [
                { text: 'That is a condition, not a no.', next: 'aCondition' },
                { text: 'Thank you for telling me.', next: 'thankYou' },
            ],
        },

        {
            id: 'aCondition',
            speaker: 'brother',
            // The line the whole arc has been building to. He does not deny
            // it. He clarifies it, and the clarification is worse.
            text: 'It is a condition.\n\nEverything is a condition. Yours is a condition too — you would not sell while it is worth building, and one day it will not be, and then we will find out what we both meant.',
            choices: [
                {
                    text: '(leave it)',
                    effects: [
                        { kind: 'dial', dial: 'brotherTrust', delta: -6 },
                        { kind: 'dial', dial: 'pearHostility', delta: 8 },
                        { kind: 'flag', flag: 'brotherPlottedOpenly' },
                    ],
                },
                {
                    text: 'Then tell me the day it changes.',
                    effects: [
                        // The only durable thing available: not loyalty, but
                        // notice. He can actually deliver that, and he knows
                        // the difference even if he cannot see the rest.
                        { kind: 'dial', dial: 'brotherTrust', delta: 12 },
                        { kind: 'dial', dial: 'pearHostility', delta: 4 },
                    ],
                },
            ],
        },

        {
            id: 'thankYou',
            speaker: 'brother',
            text: 'You are welcome. Genuinely.\n\nAnd — ask me. Always ask me. I have never once said no to a direct question and I am not going to start.',
            choices: [
                {
                    text: 'I will ask.',
                    effects: [
                        { kind: 'dial', dial: 'brotherTrust', delta: 10 },
                        { kind: 'dial', dial: 'pearHostility', delta: 4 },
                    ],
                },
            ],
        },
    ],
};

// ============================================================================
//  4. THE MEETING THAT NOBODY REPORTS
// ============================================================================
//  The same fact, arriving as nothing at all. Fires when the CFO is not in a
//  position to warn anybody - gone, or long since stopped bothering. There is
//  no scene, no message and no choice: only a line in the news, which the
//  player may or may not open.
//
//  This is the shape of the punishment for the CFO arc, and it is deliberately
//  almost invisible. A modal saying "you missed something" would be the game
//  apologising for its own design.
// ============================================================================
export const brotherMeetsPearQuietly: Conversation = {
    id: 'event-brother-meets-pear-quietly',
    channel: 'message',
    from: 'brother',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'brother',
            // He is not being sinister. He is making conversation, and the
            // player has no reason to read anything into it - because nobody
            // has told them there is anything to read.
            text: 'In town on the fourteenth if you are around. Probably not, I know what your Thursdays look like.\n\nNo agenda. Lunch is already spoken for, but drinks after if you fancy it.',
            choices: [
                {
                    text: 'Not this week.',
                    effects: [
                        { kind: 'dial', dial: 'pearHostility', delta: 6 },
                        { kind: 'dial', dial: 'brotherTrust', delta: -2 },
                    ],
                },
                {
                    text: 'Who is lunch with?',
                    next: 'whoWith',
                },
            ],
        },

        {
            id: 'whoWith',
            speaker: 'brother',
            // A DIRECT QUESTION, AND HE ANSWERS IT. The player who happens to
            // ask gets the whole thing for free, which is the rule he stated
            // and the game honouring it. Almost nobody will ask.
            text: 'Some people from Pear, actually. They have been asking for a year and I ran out of polite reasons.\n\nIt is nothing. I will tell you what they say.',
            choices: [
                {
                    text: 'Tell me afterwards.',
                    effects: [
                        { kind: 'dial', dial: 'pearHostility', delta: 4 },
                        { kind: 'dial', dial: 'brotherTrust', delta: 5 },
                        {
                            kind: 'schedule',
                            conversation: 'event-brother-caught',
                            afterQuarters: 1,
                        },
                    ],
                },
                {
                    text: 'Do not go.',
                    effects: [
                        { kind: 'dial', dial: 'pearHostility', delta: 6 },
                        { kind: 'dial', dial: 'brotherTrust', delta: -7 },
                    ],
                },
            ],
        },
    ],
};

export const brotherMeetsPearQuietlyEvent: GameEvent = {
    id: 'brother-meets-pear-quietly',
    when: [
        ...LATE_AND_COLD,
        { kind: 'dialAtLeast', dial: 'pearHostility', band: 'low' },
        // The mirror of the warning's gate. Either he has gone, or he has
        // stopped bringing you things.
        {
            kind: 'any',
            of: [
                { kind: 'flag', flag: 'cfoResigned' },
                { kind: 'dialAtMost', dial: 'cfoTrust', band: 'low' },
            ],
        },
    ],
    chance: 0.7,
    cooldown: 10,
    conversation: brotherMeetsPearQuietly,
    headline: 'Sector chatter about informal contact between Pear and Hale shareholders.',
    priority: 4,
};
