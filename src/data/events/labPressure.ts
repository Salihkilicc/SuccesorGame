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
            text: 'I wanted to share something: our lab currently has zero researchers. The benches are empty, and our R&D headcount is literally zero.',
            choices: [
                { text: 'Why did my father leave it unstaffed?', next: 'why' },
                { text: 'What headcount do you need?', next: 'what' },
            ],
        },

        {
            id: 'why',
            speaker: 'cto',
            text: 'He believed research was an expense only for firms running out of sales ideas, and he was right about that for roughly fifteen years. I stopped asking. That part is mine, not his.',
            choices: [
                { text: 'What headcount do you need?', next: 'what' },
                { text: 'The company did well without it.', next: 'goodCompany' },
            ],
        },

        {
            id: 'goodCompany',
            speaker: 'cto',
            text: 'It did, on one focused product. I am not asking because research is virtuous; without new technology, growth will stall.',
            choices: [
                { text: 'Tell me the headcount number.', next: 'what' },
                { text: 'Not this year.', next: 'notThisYear' },
            ],
        },

        {
            id: 'what',
            speaker: 'cto',
            text: 'Fifteen people. Not fifty. Fifty is three and a third times the wages for under three times the work. A focused team delivering a second product in two years.',
            choices: [
                {
                    text: 'Approved. Fund fifteen.',
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
            text: 'Understood. I will submit the formal request at year end for the record.',
            choices: [
                {
                    text: 'Send the memo.',
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
    chance: 0.35,
    cooldown: 6,
    conversation: ctoDarkLab,
    headline: 'Analysts note Hale reports no research headcount for another quarter.',
    priority: 1,
};

// ============================================================================
//  2. THEY SHIPPED IT — WITH A LAB
// ============================================================================
const ALARM: Condition[] = [
    { kind: 'flag', flag: 'fatherDead' },
    { kind: 'marketShareAtMost', percent: LOSING },
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
            text: 'A rival just launched into our category with retail units already in stores and strong consumer demand.',
            choices: [
                { text: 'How far ahead are they?', next: 'howFar' },
                { text: 'Can our lab respond?', next: 'answer' },
            ],
        },

        {
            id: 'howFar',
            speaker: 'cto',
            text: 'About eighteen months of engineering lead time. Nothing impossible, but they executed first.',
            choices: [
                { text: 'Can our lab respond?', next: 'answer' },
                { text: 'We compete on price instead.', next: 'onPrice' },
            ],
        },

        {
            id: 'answer',
            speaker: 'cto',
            text: 'Yes. Because our lab is active, we can deliver a counter-product in eighteen months if we expand staffing.',
            choices: [
                {
                    text: 'Submit the headcount request.',
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
                { text: 'We compete on price instead.', next: 'onPrice' },
            ],
        },

        {
            id: 'onPrice',
            speaker: 'cto',
            text: 'Price cuts can defend short-term volume, but each quarter we delay R&D pushes our next launch further out.',
            choices: [
                {
                    text: 'Send the R&D memo.',
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
                    text: 'Back the lab development.',
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
    chance: 0.35,
    cooldown: 6,
    conversation: ctoAlarm,
    headline: 'A rival ships into Hale\'s category. Retail units are already on shelves.',
    priority: 3,
};

// ============================================================================
//  3. THEY SHIPPED IT — WITHOUT A LAB
// ============================================================================
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
            text: 'A competitor launched a next-gen unit in our category today. With an unstaffed lab, we have no quick product counter.',
            choices: [
                { text: 'There must be an option.', next: 'something' },
                { text: 'What is our realistic timeline?', next: 'sayIt' },
            ],
        },

        {
            id: 'sayIt',
            speaker: 'cto',
            text: 'Starting a lab from zero today gives a first real answer in about three years to a two-year product. We are not in it.',
            choices: [
                { text: 'There must be an option.', next: 'something' },
                { text: 'Understood.', next: 'understood' },
            ],
        },

        {
            id: 'something',
            speaker: 'cto',
            text: 'Price discounts will retain market share while we build long-term capability.',
            choices: [
                { text: 'We will adjust pricing.', next: 'understood' },
                { text: 'We will adapt as needed.', next: 'understood' },
            ],
        },

        {
            id: 'understood',
            speaker: 'cto',
            text: 'I kept the benches clean.\n\nP.R.',
        },
    ],
};

export const ctoTooLateEvent: GameEvent = {
    id: 'cto-too-late',
    when: TOO_LATE,
    chance: 0.35,
    cooldown: 6,
    conversation: ctoTooLate,
    headline: 'A rival ships into Hale\'s category. Retail units are already on shelves.',
    priority: 3,
};

// ============================================================================
//  4. THE MEMO — WHERE SHE TALKS HERSELF DOWN
// ============================================================================
export const ctoBudgetMemo: Conversation = {
    id: 'cto-budget-memo',
    channel: 'mail',
    from: 'cto',
    subject: 'R&D headcount, revised request',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cto',
            text: 'Following our discussion, I am formally requesting eight rather than the fifteen I said out loud. Eight is not what I would do, but it is a number you can approve.\n\nP.R.',
            choices: [
                { text: 'What does eight cost us in timing?', next: 'cost' },
                { text: 'Eight is approved.', next: 'fine' },
            ],
        },

        {
            id: 'cost',
            speaker: 'cto',
            text: 'Timing: eight is a bit under six tenths of the work of fifteen, so development extends from two years to closer to three. And nobody, including me, can promise the market will wait.',
            choices: [
                {
                    text: 'Then ask for fifteen.',
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
            text: 'Eight it is. We will organize the team and begin development immediately.',
        },
    ],
};

// ============================================================================
//  5. YOU SAID YES AND THE LAB IS STILL EMPTY
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
            text: 'Quick check: lab headcount is still zero. Checking if hiring on the laboratory screen was delayed or changed.',
            choices: [
                { text: 'It slipped our schedule.', next: 'fellOff' },
                { text: 'It was intentional.', next: 'decision' },
            ],
        },

        {
            id: 'fellOff',
            speaker: 'cto',
            text: 'It is genuinely fine. You can allocate researchers directly on the laboratory screen when ready.',
        },

        {
            id: 'decision',
            speaker: 'cto',
            text: 'Understood. I will stop holding the two benches and reassign the space for now.',
        },
    ],
};

export const ctoStillEmptyEvent: GameEvent = {
    id: 'cto-still-empty',
    when: STILL_EMPTY,
    chance: 0.30,
    // Once per game. Noticing twice would be nagging, and she is not a nag -
    // she is somebody who asks once and then quietly reassigns the space.
    conversation: ctoStillEmpty,
    headline: 'Hale\'s research headcount remains unchanged.',
    priority: 1,
};
