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
    { kind: 'quarterAtLeast' as const, quarter: 28 },
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
            text: 'I voted against the capital plan today. It is not personal: wanted you to hear it directly from me before the tally went out.',
            choices: [
                { text: 'You did not tell me you had concerns.', next: 'concerns' },
                { text: 'Fine. That is what the vote is for.', next: 'thatIsWhat' },
            ],
        },

        {
            id: 'concerns',
            speaker: 'brother',
            text: 'I raised it in writing in the board pack eleven days ago on page four. I assumed you had read it and disagreed.',
            choices: [
                { text: 'I had not read page four.', next: 'pageFour' },
                { text: 'Raising it in a pack is not telling me.', next: 'notTelling' },
            ],
        },

        {
            id: 'pageFour',
            speaker: 'brother',
            text: 'Then that is the real issue. Read the pack next time; I will keep putting my notes in it.',
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
            text: 'It creates a record. You run the business, I write things down. I am using my half of the role.',
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
            text: 'It is. I would rather discuss things beforehand, but this is a standard way to run a board.',
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
    chance: 0.25,
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
            text: 'A quick factual note: your brother had lunch on the fourteenth with Nathan Vogel of Pear.',
            choices: [
                { text: 'Did he see you?', next: 'didHeSeeMe' },
                { text: 'That is not necessarily anything.', next: 'notNecessarily' },
            ],
        },

        {
            id: 'notNecessarily',
            speaker: 'cfo',
            text: 'Perhaps. But in eleven years, Vogel has never had lunch with someone he was not actively trying to acquire from.',
            choices: [
                { text: 'Did he see you?', next: 'didHeSeeMe' },
                { text: 'What do you want me to do?', next: 'whatDoIDo' },
            ],
        },

        {
            id: 'didHeSeeMe',
            speaker: 'cfo',
            text: 'Yes. He came over warmly and introduced me as "my brother\'s finance director", but did not introduce Vogel.',
            choices: [
                { text: 'What do you want me to do?', next: 'whatDoIDo' },
                { text: 'He is not hiding it, then.', next: 'notHiding' },
            ],
        },

        {
            id: 'notHiding',
            speaker: 'cfo',
            text: 'No, he simply did not volunteer the information. He would argue those are different.',
            choices: [
                { text: 'What do you want me to do?', next: 'whatDoIDo' },
            ],
        },

        {
            id: 'whatDoIDo',
            speaker: 'cfo',
            text: 'Ask him directly tonight. If he tells you honestly, no harm done. If not, you learn his intent early.',
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
        { kind: 'dialAtLeast', dial: 'cfoTrust', band: 'high' },
        { kind: 'dialAtLeast', dial: 'pearHostility', band: 'low' },
    ],
    chance: 0.35,
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
            text: 'Yes. I had lunch with Vogel at Cavendish on the fourteenth. I assume Arthur told you.',
            choices: [
                { text: 'What did he want?', next: 'whatWanted' },
                { text: 'You did not tell me.', next: 'didNotTell' },
            ],
        },

        {
            id: 'didNotTell',
            speaker: 'brother',
            text: 'I planned to mention it at the board meeting. What would you have had me do, ring you from the table?',
            choices: [
                { text: 'Yes.', next: 'yes' },
                { text: 'What did he want?', next: 'whatWanted' },
            ],
        },

        {
            id: 'yes',
            speaker: 'brother',
            text: 'Understood. I will keep that in mind for next time.',
            choices: [
                { text: 'What did he want?', next: 'whatWanted' },
            ],
        },

        {
            id: 'whatWanted',
            speaker: 'brother',
            text: 'He wanted to know if my 15% stake would move. I gave my usual answer: not for sale while it is a family company.',
            choices: [
                { text: 'That is a condition, not a no.', next: 'aCondition' },
                { text: 'Thank you for telling me.', next: 'thankYou' },
            ],
        },

        {
            id: 'aCondition',
            speaker: 'brother',
            text: 'Everything is a condition. You would not sell while it is worth building either.',
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
                        { kind: 'dial', dial: 'brotherTrust', delta: 12 },
                        { kind: 'dial', dial: 'pearHostility', delta: 4 },
                    ],
                },
            ],
        },

        {
            id: 'thankYou',
            speaker: 'brother',
            text: 'Always ask me directly. I will always tell you what was said.',
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
            text: 'I am in town on the fourteenth if you want drinks. Lunch is already booked with an acquaintance.',
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
            text: 'Some people from Pear. They have been asking for a meeting, so I agreed to hear them out. I will let you know what they say.',
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
    chance: 0.35,
    cooldown: 10,
    conversation: brotherMeetsPearQuietly,
    headline: 'Sector chatter about informal contact between Pear and Hale shareholders.',
    priority: 4,
};
