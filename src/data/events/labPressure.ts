// src/data/events/labPressure.ts
//
// ============================================================================
//  THE CTO — RIGHT, EXPENSIVE, AND SOMETIMES TOO EARLY TO BE USEFUL
// ============================================================================
//
//  Priya Raman also starts from a number in a store default, and hers is
//  bleaker than the COO's:
//
//      useLaboratoryStore  ->  researcherCount: 0
//
//  The company begins with a Chief Technology Officer and no researchers. Not
//  a small lab - none. That is a fact about Gerald Hale that has been sitting
//  in an initialiser since long before any of this story existed, and it is
//  her entire opening scene.
//
//  ---------------------------------------------------------------------------
//  THE THINGS SHE SAYS ABOUT RESEARCH ARE ARITHMETIC, NOT OPINION
//  ---------------------------------------------------------------------------
//  Output is `600 * n^0.85` (workforce.ts), deliberately sublinear - Brooks.
//  Which means, checked rather than asserted:
//
//      15 researchers  ->  ~6,000 RP a quarter
//      50 researchers  ->  ~16,700 RP a quarter
//
//  Fifty people is 3.3x the wage bill for 2.8x the output. So when she says
//  fifty is not three times fifteen, she is quoting the curve, and when she
//  says fifteen is the right number she is quoting the game's own calibration
//  note: 15 researchers at tier 1-2 reaches the second product in about eight
//  quarters. Two years. She says two years.
//
//  ---------------------------------------------------------------------------
//  SHE HAS TO BE ABLE TO BE UNAFFORDABLE, AND SHE HAS TO BE ABLE TO BE LATE
//  ---------------------------------------------------------------------------
//  A visionary who is always right is a quest marker. Two things stop her
//  being one, and neither is a scene where she is stupid:
//
//    SHE ASKS FOR MONEY WITH NO RETURN THIS QUARTER. The lab is a wage line
//    that produces nothing sellable for years. Cutting it is free for exactly
//    one quarter, which is what makes it the first thing every CEO cuts, and
//    saying no to her can be the correct decision.
//
//    SHE CAN BE RIGHT TOO LATE. `ctoTooLate` is the same alarm as
//    `ctoAlarm` at a company with an empty lab, and it contains no request,
//    because by then there is nothing to ask for. It is the only scene in her
//    arc with no decision in it. That is the cost of the previous ten.
//
//  ---------------------------------------------------------------------------
//  NO DIAL. HER STANDING IS THE SIZE OF THE LAB.
//  ---------------------------------------------------------------------------
//  Same reasoning as the COO - see core/story/state.ts. You cannot be on good
//  terms with your CTO by choosing the encouraging answer.
// ============================================================================

import type { Conversation } from '../../core/story/graph';
import type { Condition } from '../../core/story/conditions';
import type { GameEvent } from '../../core/events/types';

/**
 * Losing the category.
 *
 * 6 percent, and it is a ceiling rather than a floor - the mirror condition
 * added with this file. Every earlier scene could ask whether the player had
 * ENOUGH share; her alarm is about not having it, which nothing could express.
 */
const LOSING = 6;

// ============================================================================
//  1. THERE IS NOBODY IN THE LAB
// ============================================================================
//  Her first scene is not a pitch. It is a disclosure she has been sitting on
//  for years, and the reason she never made it is the most interesting thing
//  about her: she stopped trying, and she knows it.
// ============================================================================
/** Nobody in the lab. Named because three separate gates ask about it. */
const EMPTY_LAB: Condition = { kind: 'researchersAtMost', count: 0 };

const DARK_LAB: Condition[] = [
    { kind: 'flag', flag: 'fatherDead' },
    EMPTY_LAB,
];

export const ctoDarkLab: Conversation = {
    id: 'event-cto-dark-lab',
    channel: 'message',
    from: 'cto',
    when: DARK_LAB,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cto',
            text: 'I want to tell you something I never managed to tell your father.\n\nThere is nobody in the lab. Not a skeleton team, not two people and a student. Nobody. The building is there, the benches are there, my title is on a door, and the headcount is zero.',
            choices: [
                { text: 'Why did he never staff it?', next: 'why' },
                { text: 'What would you do with it?', next: 'what' },
            ],
        },

        {
            id: 'why',
            speaker: 'cto',
            // She defends him accurately before criticising him, and the
            // criticism she lands on is of herself.
            text: 'He said research is what a company does when it has run out of ideas about selling.\n\nAnd I want to be fair to him — he was right about that for roughly fifteen years. Then he was wrong for eleven, and nobody could tell him, including me. I stopped trying somewhere around the third attempt. That part is mine, not his.',
            choices: [
                { text: 'What would you do with it?', next: 'what' },
                { text: 'He built a good company without it.', next: 'goodCompany' },
            ],
        },

        {
            id: 'goodCompany',
            speaker: 'cto',
            // The strongest case against her own department, made by her,
            // because a character who cannot state the opposing argument is
            // not making an argument.
            text: 'He did. I am not being sarcastic — he built it out of one product and thirty years of not being distracted, and half the labs I admire are attached to companies that never made money.\n\nI am not asking because research is virtuous. I am asking because the thing he was selling has a ceiling and we are standing on it.',
            choices: [
                { text: 'Then tell me the number.', next: 'what' },
                { text: 'Not this year.', next: 'notThisYear' },
            ],
        },

        {
            id: 'what',
            speaker: 'cto',
            text: 'Fifteen people. Not fifty.\n\nFifty is not three times fifteen — the output curve flattens hard and you would be paying three and a third times the wages for under three times the work. Anyone quoting you a bigger number is selling you a building.\n\nFifteen is a team small enough to hold one problem in its head. It is roughly the difference between a second product in two years and not having one.',
            choices: [
                {
                    text: 'Do it. Fifteen.',
                    effects: [
                        { kind: 'flag', flag: 'labBacked' },
                        {
                            kind: 'schedule',
                            conversation: 'cto-budget-memo',
                            afterQuarters: 1,
                            expiresAfter: 4,
                        },
                    ],
                },
                { text: 'Not this year.', next: 'notThisYear' },
            ],
        },

        {
            id: 'notThisYear',
            speaker: 'cto',
            // No sulking, no closed door. She is an employee, she will ask
            // again, and the memo arrives regardless - that is what a memo is.
            text: 'Fine. I mean that — it is a real answer and I would rather have it than a maybe.\n\nI will send the formal version at quarter close anyway, because if I do not put it in writing then in three years this conversation will not have happened.',
            choices: [
                {
                    text: 'Send it.',
                    effects: [
                        {
                            kind: 'schedule',
                            conversation: 'cto-budget-memo',
                            afterQuarters: 1,
                            expiresAfter: 4,
                        },
                    ],
                },
                {
                    text: 'Do not bother.',
                    // Refusing the memo does not close her arc - she sends it.
                    // The player declining paperwork does not delete the
                    // paperwork, and pretending otherwise would make her a
                    // door rather than a colleague.
                    effects: [
                        {
                            kind: 'schedule',
                            conversation: 'cto-budget-memo',
                            afterQuarters: 1,
                            expiresAfter: 4,
                        },
                    ],
                },
            ],
        },
    ],
};

export const ctoDarkLabEvent: GameEvent = {
    id: 'cto-dark-lab',
    when: DARK_LAB,
    chance: 0.7,
    cooldown: 6,
    conversation: ctoDarkLab,
    headline: 'Analysts note Hale reports no research headcount for another quarter.',
    priority: 1,
};

// ============================================================================
//  2. THEY SHIPPED IT — WITH A LAB
// ============================================================================
//  The emergency message. She is alarmed and, underneath it, delighted, which
//  the cast file says she cannot keep out of writing and never quite does.
//
//  This one has a decision in it. Its twin does not.
// ============================================================================
const ALARM: Condition[] = [
    { kind: 'flag', flag: 'fatherDead' },
    { kind: 'marketShareAtMost', percent: LOSING },
    // There is a lab. `not` over the empty test rather than a new condition:
    // the vocabulary already composes, and adding `researchersAtLeast` for a
    // single use would be dead the day it landed.
    { kind: 'not', of: EMPTY_LAB },
];

export const ctoAlarm: Conversation = {
    id: 'event-cto-alarm',
    channel: 'message',
    from: 'cto',
    when: ALARM,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cto',
            text: 'They shipped it.\n\nI have one on my desk. I bought it at retail on the way in, which is the part I want you to sit with — not a prototype, not a demo behind glass. In a shop. With a queue.',
            choices: [
                { text: 'How far ahead are they?', next: 'howFar' },
                { text: 'Can we answer it?', next: 'answer' },
            ],
        },

        {
            id: 'howFar',
            speaker: 'cto',
            text: 'Two years of decisions, not two years of genius. I have had it apart on the bench since seven this morning and there is nothing in it I could not have told you about.\n\nThat is the bad news, incidentally. If it were genius we would have an excuse.',
            choices: [
                { text: 'Can we answer it?', next: 'answer' },
                { text: 'We compete on price, then.', next: 'onPrice' },
            ],
        },

        {
            id: 'answer',
            speaker: 'cto',
            // The honest version of a visionary's ask: she leads with the
            // timescale she cannot shorten, and she does not pretend the
            // money is small.
            text: 'Yes. Not this quarter and not next year.\n\nBecause the lab has been running, the answer is eighteen months away instead of never, and I want to be precise about that: eighteen months is not soon, but it is a real place with a date on it. Never is not.\n\nIt costs more people. I will put the number in the memo rather than say it out loud and watch your face.',
            choices: [
                {
                    text: 'Put the number in. The real one.',
                    effects: [
                        { kind: 'flag', flag: 'labBacked' },
                        {
                            kind: 'schedule',
                            conversation: 'cto-budget-memo',
                            afterQuarters: 1,
                            expiresAfter: 4,
                        },
                    ],
                },
                { text: 'We compete on price, then.', next: 'onPrice' },
            ],
        },

        {
            id: 'onPrice',
            speaker: 'cto',
            // She does not pretend this is stupid. It is a real strategy the
            // game supports, and it is also the one that needs her least,
            // which she is honest enough to say.
            text: 'That works, and I am the wrong person to ask about it. It is arithmetic and you do not need a laboratory for arithmetic.\n\nOne thing only, and then I will stop. Price is a decision you can reverse in a quarter. The eighteen months starts the day it starts, and every quarter we do not start it is a quarter added to the end, not taken off the front.',
            choices: [
                {
                    text: 'Understood. Send the memo.',
                    effects: [
                        {
                            kind: 'schedule',
                            conversation: 'cto-budget-memo',
                            afterQuarters: 1,
                            expiresAfter: 4,
                        },
                    ],
                },
                {
                    text: 'Then start it. Send me the number.',
                    effects: [
                        { kind: 'flag', flag: 'labBacked' },
                        {
                            kind: 'schedule',
                            conversation: 'cto-budget-memo',
                            afterQuarters: 1,
                            expiresAfter: 4,
                        },
                    ],
                },
            ],
        },
    ],
};

export const ctoAlarmEvent: GameEvent = {
    id: 'cto-alarm',
    when: ALARM,
    chance: 0.75,
    cooldown: 6,
    conversation: ctoAlarm,
    headline: 'A rival ships into Hale\'s category. Retail units are already on shelves.',
    priority: 3,
};

// ============================================================================
//  3. THEY SHIPPED IT — WITHOUT A LAB
// ============================================================================
//  The same morning, the same object on the same desk, at a company that never
//  hired anybody. The gates are exclusive with the scene above: one requires a
//  lab, this one requires the absence of one, so a quarter can only ever
//  produce one of them.
//
//  IT HAS NO REQUEST IN IT, and that is the whole scene. Every other beat she
//  has ends in a number she wants. This one ends in her telling you there is
//  no decision here, because a lab funded today answers a two-year product in
//  three years. She is not punishing the player and there is no dial to move.
//  The consequence of ten quarters of saying no is simply that the eleventh
//  conversation is not a conversation.
// ============================================================================
// Exactly the alarm's gate with the lab test inverted, so the two can never
// both be eligible and can never both be ineligible while share is low.
const TOO_LATE: Condition[] = [
    { kind: 'flag', flag: 'fatherDead' },
    { kind: 'marketShareAtMost', percent: LOSING },
    EMPTY_LAB,
];

export const ctoTooLate: Conversation = {
    id: 'event-cto-too-late',
    channel: 'message',
    from: 'cto',
    when: TOO_LATE,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cto',
            text: 'They shipped it. I have one on my desk — bought it at retail, there was a queue.\n\nI am not going to ask you for anything this time. I want to be clear that this is not a negotiating position. There is nothing to ask for.',
            choices: [
                { text: 'There must be something.', next: 'something' },
                { text: 'Say it anyway.', next: 'sayIt' },
            ],
        },

        {
            id: 'sayIt',
            speaker: 'cto',
            text: 'A lab we start funding this afternoon produces its first real answer in about three years. This is a two-year product and it is already out.\n\nSo we are not late to it. We are not in it. Those are different words and I have spent the morning making sure I use the right one.',
            choices: [
                { text: 'There must be something.', next: 'something' },
                { text: 'Understood.', next: 'understood' },
            ],
        },

        {
            id: 'something',
            speaker: 'cto',
            // The only remaining lever, offered plainly, along with the fact
            // that offering it is not her job. This is what a technology
            // officer sounds like at a company with no technology.
            text: 'There is. We cut the price until they stop noticing us.\n\nThat is arithmetic and you do not need me for it, which I think is the honest summary of my position here.',
            choices: [
                { text: 'That is not what I meant.', next: 'understood' },
                { text: 'Then that is what we do.', next: 'understood' },
            ],
        },

        {
            id: 'understood',
            speaker: 'cto',
            // She had the last word, and it is not bitter. The line about the
            // benches is the whole arc: she has been the CTO of an empty
            // building the entire time and never said so until it stopped
            // mattering.
            text: 'I will send the usual note at quarter close. It will be short.\n\nFor what it is worth, I have kept the benches clean for eleven years. That was not optimism. It was mostly habit.',
        },
    ],
};

export const ctoTooLateEvent: GameEvent = {
    id: 'cto-too-late',
    when: TOO_LATE,
    chance: 0.75,
    cooldown: 6,
    conversation: ctoTooLate,
    headline: 'A rival ships into Hale\'s category. Retail units are already on shelves.',
    priority: 3,
};

// ============================================================================
//  4. THE MEMO — WHERE SHE TALKS HERSELF DOWN
// ============================================================================
//  Her "formal mail at quarter end", and the gap between it and the message is
//  the opposite of the COO's.
//
//  Dana's paper is a weapon: the same letter, plus a cc, because you did not
//  answer her. Priya's paper is a RETREAT: she asked for fifteen out loud and
//  writes down eight, because eight is what she thinks she can get through a
//  board meeting. The cast file calls her "impatient with money questions and
//  slightly embarrassed about that" - this is what that looks like on a page.
//
//  And then she does the one thing that redeems it: she writes down what the
//  smaller number costs, so that the record shows she knew.
// ============================================================================
export const ctoBudgetMemo: Conversation = {
    id: 'cto-budget-memo',
    channel: 'mail',
    from: 'cto',
    subject: 'R&D headcount — revised request',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cto',
            text: 'Following our conversation, and having looked properly at the quarterly wage line, I am formally requesting eight rather than the fifteen I said out loud.\n\nEight is not what I would do. Eight is what I can defend in a room where somebody asks what it returns this year. I would rather ask for a number you can approve than be correct in a document nobody signs.\n\nP.R.',
            choices: [
                { text: 'What does eight cost us?', next: 'cost' },
                { text: 'Eight is fine.', next: 'fine' },
            ],
        },

        {
            id: 'cost',
            speaker: 'cto',
            // The output curve, read the other way. 8^0.85 ~ 5.8 against
            // 15^0.85 ~ 10.0 - a bit under six tenths of the work - which is
            // where "two years becomes closer to three" comes from.
            text: 'Time, and only time. Eight people do a bit under six tenths of the work of fifteen, so the two years I quoted becomes closer to three.\n\nI have put that sentence in the memo itself rather than in this reply, so that nobody — including me, in three years, when I have had time to reorganise my memory — can claim they were not told.',
            choices: [
                {
                    text: 'Then ask for fifteen. I will carry the board.',
                    effects: [
                        { kind: 'flag', flag: 'labBacked' },
                        {
                            kind: 'message',
                            who: 'cto',
                            text: 'Thank you. I will resend it with the number I meant.',
                        },
                    ],
                },
                { text: 'Eight is fine.', next: 'fine' },
            ],
        },

        {
            id: 'fine',
            speaker: 'cto',
            text: 'Then eight it is, and I will not sulk about it — eight is a team and a team is not nothing.\n\nI will send the same memo next year with a bigger number and a worse reason, which I suspect is the actual job.',
        },
    ],
};

// ============================================================================
//  5. YOU SAID YES AND THE LAB IS STILL EMPTY
// ============================================================================
//  The mirror of the COO's cc note, and it needs both halves of her state at
//  once: `labBacked` (you told her to go ahead) AND an empty lab. There is no
//  cc, no record and no consequence. She just notices, once.
//
//  This exists because `labBacked` records that the player SAID yes, and no
//  effect in the game can hire anybody - so the gap between agreeing and doing
//  is a real gap that the story can see and nothing else in the app can.
// ============================================================================
const STILL_EMPTY: Condition[] = [
    { kind: 'flag', flag: 'labBacked' },
    EMPTY_LAB,
];

export const ctoStillEmpty: Conversation = {
    id: 'event-cto-still-empty',
    channel: 'message',
    from: 'cto',
    when: STILL_EMPTY,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cto',
            text: 'Small thing.\n\nThe lab headcount is still zero. I am not chasing you — I know what a quarter looks like from your side. I am checking that it was a decision and not a thing that fell off a list.',
            choices: [
                { text: 'It fell off a list.', next: 'fellOff' },
                { text: 'It was a decision.', next: 'decision' },
            ],
        },

        {
            id: 'fellOff',
            speaker: 'cto',
            text: 'That is genuinely fine and I would rather know.\n\nThe control is on the laboratory screen and it takes about nine seconds. I have made the mistake of assuming that a yes and a number are the same event, which after four years in this building is embarrassing of me.',
        },

        {
            id: 'decision',
            speaker: 'cto',
            // Not wounded, not passive-aggressive. She simply removes the
            // thing she was holding open, which is a smaller and sadder
            // gesture than an argument.
            text: 'Then I will stop holding the two benches at the end.\n\nI have had them empty since spring on the assumption something was coming. Better to give the space to logistics than to keep a corridor that means nothing.',
        },
    ],
};

export const ctoStillEmptyEvent: GameEvent = {
    id: 'cto-still-empty',
    when: STILL_EMPTY,
    chance: 0.6,
    // Once per game. Noticing twice would be nagging, and she is not a nag -
    // she is somebody who asks once and then quietly reassigns the space.
    conversation: ctoStillEmpty,
    headline: 'Hale\'s research headcount remains unchanged.',
    priority: 1,
};
