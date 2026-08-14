// src/data/events/espionage.ts
//
// ============================================================================
//  SOMEBODY IS INSIDE, AND THEY WOULD LIKE TO BE PAID
// ============================================================================
//
//  Three variants of one scenario: Priya, at an hour she does not usually
//  write at, and then a demand from whoever is holding the company's insides.
//
//  ---------------------------------------------------------------------------
//  SEVENTY / THIRTY, AND WHY IT IS A COIN AND NOT A SLOT MACHINE
//  ---------------------------------------------------------------------------
//  Every other choice in this game is deterministic, deliberately - the whole
//  story system was built against a shelved modal that decided with a die
//  behind a spinner and let you press a button to re-roll it.
//
//  Paying criminals is the exception, and the `risk` effect exists only for
//  this file. The uncertainty is the content: you are not buying an outcome,
//  you are buying a promise from people whose business is promises. Two things
//  keep it honest - the coin is flipped ONCE, at the moment the player decides
//  (an event chance would roll every quarter and reach everybody eventually),
//  and the failure arrives as a SCENE, so you find out from a person.
//
//  ---------------------------------------------------------------------------
//  THREE RANSOMS THAT ARE DIFFERENT IN KIND, NOT IN SIZE
//  ---------------------------------------------------------------------------
//  Three scenes that all ask for money at three price points would be one
//  scene with a slider on it.
//
//      KESTREL   a small crew, a small number, paid in a week. The cheapest
//                and the least professional, which is exactly why the coin is
//                the least reliable it gets.
//      THE BROKER  a large number to a man who has never touched your data and
//                never will. He is an intermediary and he is very good, which
//                is what you are paying for.
//      ORACLE    does not want money at all. Wants you out of a market - and
//                is doing this because you did it first.
//
//  The third is gated on `moleEngaged`. It only reaches a player who hired
//  somebody to get inside Pear, because that is what it is: the same thing,
//  coming back, and Vogel does not send it himself.
// ============================================================================

import type { Conversation } from '../../core/story/graph';
import type { Condition } from '../../core/story/conditions';
import type { GameEvent } from '../../core/events/types';

/** They keep their word seven times in ten. It is the only number in the file. */
export const KEPT_PROMISE = 0.7;

/**
 * How much less reliable the cheap crew is.
 *
 * Not decoration. The small ransom is the tempting one and it has to be worse
 * than the expensive one at the thing you are actually buying, or the price
 * ladder is a discount rather than a decision.
 */
export const KESTREL_PROMISE = 0.55;

const GROWN: Condition[] = [
    { kind: 'flag', flag: 'fatherDead' },
    { kind: 'quarterAtLeast', quarter: 24 },
];

// ============================================================================
//  1. KESTREL — the cheap one
// ============================================================================
export const espionageKestrel: Conversation = {
    id: 'event-espionage-kestrel',
    channel: 'message',
    from: 'cto',
    when: GROWN,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cto',
            text: 'I am at the office late. Someone had access to our design repository for weeks: current architecture, pipeline, and supplier costing.',
            choices: [
                { text: 'How long?', next: 'nineWeeks' },
                { text: 'Have they made demands?', next: 'asked' },
            ],
        },
        {
            id: 'nineWeeks',
            speaker: 'cto',
            text: 'At least nine weeks. An open staging credential was exploited. I take responsibility for the lapse.',
            choices: [
                { text: 'Have they made demands?', next: 'asked' },
                { text: 'Keep working on containment.', next: 'asked' },
            ],
        },
        {
            id: 'asked',
            speaker: 'cto',
            text: 'A group calling itself Kestrel is asking $1.8M to delete the data and disclose the vector.',
            choices: [
                {
                    text: 'Pay ransom ($1.8M).',
                    effects: [
                        { kind: 'capital', amount: -1_800_000 },
                        { kind: 'flag', flag: 'paidTheRansom' },
                        {
                            kind: 'risk',
                            chance: KESTREL_PROMISE,
                            onBetrayal: 'event-espionage-kestrel-betrayal',
                            afterQuarters: 2,
                        },
                    ],
                },
                { text: 'Refuse. Assume data leaked.', next: 'assumeOut' },
            ],
        },
        {
            id: 'assumeOut',
            speaker: 'cto',
            text: 'We must redesign component sourcing from scratch. It will take nine months and compress margins.',
            choices: [
                {
                    text: 'Initiate platform overhaul.',
                    effects: [
                        { kind: 'capital', amount: -2_600_000 },
                        { kind: 'brand', amount: -3 },
                        { kind: 'siege', category: 'Consumer', quarters: 3, pressure: 1.25 },
                    ],
                },
            ],
        },
    ],
};

export const espionageKestrelBetrayal: Conversation = {
    id: 'event-espionage-kestrel-betrayal',
    channel: 'message',
    from: 'cto',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cto',
            text: 'Our supplier file was published on an illicit trading forum despite the ransom payment.',
            choices: [
                {
                    text: 'Understood.',
                    effects: [
                        { kind: 'flag', flag: 'betrayedAfterPaying' },
                        { kind: 'brand', amount: -7 },
                        { kind: 'dial', dial: 'publicReputation', delta: -5 },
                        { kind: 'siege', category: 'Consumer', quarters: 4, pressure: 1.3 },
                        {
                            kind: 'news',
                            headline: 'Hale supplier pricing appears on a public forum. The company has not commented.',
                        },
                    ],
                },
            ],
        },
    ],
};

// ============================================================================
//  2. THE BROKER — the expensive one
// ============================================================================
//  He never touches the data, is never rude, and is worth every penny of the
//  difference. The most professional voice in the file and the most expensive
//  coin, which is the point of the ladder.
// ============================================================================
export const espionageBroker: Conversation = {
    id: 'event-espionage-broker',
    channel: 'message',
    from: 'cto',
    when: GROWN,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cto',
            text: 'Our research directory was exfiltrated. A facilitator contacted me directly offering to handle remediation.',
            choices: [
                { text: 'Who is he?', next: 'whoIsHe' },
                { text: 'What is the fee?', next: 'wants' },
            ],
        },
        {
            id: 'whoIsHe',
            speaker: 'cto',
            text: 'A facilitator who handles corporate disputes privately without retaining data himself.',
            choices: [
                { text: 'What is the fee?', next: 'wants' },
                { text: 'Refuse contact.', next: 'refuse' },
            ],
        },
        {
            id: 'wants',
            speaker: 'cto',
            text: 'Seven and a half million dollars for complete deletion and non-disclosure.',
            choices: [
                {
                    text: 'Pay fee ($7.5M).',
                    effects: [
                        { kind: 'capital', amount: -7_500_000 },
                        { kind: 'flag', flag: 'paidTheRansom' },
                        {
                            kind: 'risk',
                            chance: KEPT_PROMISE,
                            onBetrayal: 'event-espionage-broker-betrayal',
                            afterQuarters: 3,
                        },
                    ],
                },
                { text: 'Reject terms.', next: 'refuse' },
            ],
        },
        {
            id: 'refuse',
            speaker: 'cto',
            text: 'I must inform R&D leadership that programmes are exposed. We will face talent attrition.',
            choices: [
                {
                    text: 'Brief the team today.',
                    effects: [
                        { kind: 'brand', amount: -5 },
                        { kind: 'morale', amount: -8 },
                        { kind: 'raid', company: 'tech_skynet' },
                        {
                            kind: 'news',
                            headline: 'Two Hale research programmes are understood to have been compromised.',
                        },
                    ],
                },
            ],
        },
    ],
};

export const espionageBrokerBetrayal: Conversation = {
    id: 'event-espionage-broker-betrayal',
    channel: 'message',
    from: 'cto',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cto',
            text: 'A second entity reached out claiming the first broker was unauthorized. The vulnerability remains unaddressed.',
            choices: [
                {
                    text: 'We were double-crossed.',
                    effects: [
                        { kind: 'flag', flag: 'betrayedAfterPaying' },
                        { kind: 'brand', amount: -6 },
                        { kind: 'morale', amount: -6 },
                        { kind: 'raid', company: 'tech_skynet' },
                        { kind: 'dial', dial: 'publicReputation', delta: -4 },
                    ],
                },
            ],
        },
    ],
};

// ============================================================================
//  3. ORACLE — the one that is not about money
// ============================================================================
//  Gated on `moleEngaged`. It only reaches a player who paid somebody to get
//  inside Pear, because that is what this is - the same thing coming back.
//
//  The ransom is not a number: they want a market. And ORACLE's tone is the
//  cast file's, unchanged since prompt 3 - "bored professionalism, like a
//  courier reading out a delivery slot".
// ============================================================================
const RETALIATION: Condition[] = [
    ...GROWN,
    { kind: 'flag', flag: 'moleEngaged' },
];

export const espionageOracle: Conversation = {
    id: 'event-espionage-oracle',
    channel: 'message',
    from: 'cto',
    when: RETALIATION,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cto',
            text: 'An anonymous note was dropped on my workstation with our full Deep Tech research archive attached.',
            choices: [
                { text: 'Forward the message.', next: 'forwarded' },
                { text: 'What are their terms?', next: 'want' },
            ],
        },
        {
            id: 'forwarded',
            speaker: 'cto',
            text: 'The note is formatted like a footer: "This is reciprocal. Nothing further will be taken."',
            choices: [
                { text: 'What are their terms?', next: 'want' },
                { text: 'Reciprocal for what?', next: 'reciprocal' },
            ],
        },
        {
            id: 'reciprocal',
            speaker: 'cto',
            text: 'I am asking the same question. I stopped asking once I realized someone retaliated for prior intelligence gathering.',
            choices: [
                { text: 'What do they want?', next: 'want' },
                { text: 'Focus on containment.', next: 'want' },
            ],
        },
        {
            id: 'want',
            speaker: 'cto',
            text: 'They do not want money. They demand we stay out of Deep Tech for two years. In exchange, no disclosure occurs.',
            choices: [
                {
                    text: 'Accept terms (2-yr freeze).',
                    effects: [
                        { kind: 'flag', flag: 'paidTheRansom' },
                        { kind: 'siege', category: 'Deep Tech', quarters: 6, pressure: 1.5 },
                        { kind: 'brand', amount: -2 },
                        {
                            kind: 'risk',
                            chance: KEPT_PROMISE,
                            onBetrayal: 'event-espionage-oracle-betrayal',
                            afterQuarters: 2,
                        },
                    ],
                },
                { text: 'Reject. Trace origin.', next: 'findOut' },
            ],
        },
        {
            id: 'findOut',
            speaker: 'cto',
            text: 'Tracing will require specialized forensics with substantial expense and uncertain success.',
            choices: [
                {
                    text: 'Commission forensics.',
                    effects: [
                        { kind: 'capital', amount: -3_800_000 },
                        { kind: 'brand', amount: -4 },
                        {
                            kind: 'schedule',
                            conversation: 'event-espionage-oracle-betrayal',
                            afterQuarters: 2,
                            urgent: true,
                        },
                    ],
                },
            ],
        },
    ],
};

// ============================================================================
//  ...AND THE ONE THAT IS A REVELATION RATHER THAN A PUNISHMENT
// ============================================================================
//  Reached two ways: the coin came up wrong, or the player refused and paid
//  to find out. Same scene, and it should be - what you learn is the same
//  thing, and the difference is whether you chose to learn it.
// ============================================================================
export const espionageOracleBetrayal: Conversation = {
    id: 'event-espionage-oracle-betrayal',
    channel: 'message',
    from: 'cto',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cto',
            text: 'Forensics traced the corporate entity funding the intrusion back to an affiliate of Pear.',
            choices: [
                { text: 'Confirm the finding.', next: 'sayIt' },
                { text: 'I suspected as much.', next: 'knew' },
            ],
        },
        {
            id: 'knew',
            speaker: 'cto',
            text: 'It confirms escalating corporate countermeasures between our firms.',
            choices: [
                { text: 'Document the evidence.', next: 'sayIt' },
                {
                    text: '(keep quiet)',
                    effects: [
                        { kind: 'flag', flag: 'pearHiredThem' },
                        { kind: 'dial', dial: 'pearHostility', delta: 10 },
                        { kind: 'brand', amount: -3 },
                    ],
                },
            ],
        },
        {
            id: 'sayIt',
            speaker: 'cto',
            text: 'Pear orchestrated the operation through shell entities. The competitive posture is now openly adversarial.',
            choices: [
                {
                    text: 'We are prepared.',
                    effects: [
                        { kind: 'flag', flag: 'pearHiredThem' },
                        { kind: 'flag', flag: 'betrayedAfterPaying' },
                        { kind: 'dial', dial: 'pearHostility', delta: 18 },
                        { kind: 'brand', amount: -4 },
                        {
                            kind: 'news',
                            headline: 'Two industry rivals are said to be investigating parallel intrusions.',
                        },
                    ],
                },
            ],
        },
    ],
};

// ============================================================================
//  THE POOL
// ============================================================================
//  The three openings roll. The three betrayals do NOT - they arrive because
//  a coin came up wrong, which is the whole design: an event chance rolls
//  every quarter and would reach everybody eventually.
// ============================================================================

export const espionageKestrelEvent: GameEvent = {
    id: 'espionage-kestrel',
    when: GROWN,
    chance: 0.10,
    conversation: espionageKestrel,
    headline: 'A credential broker is advertising access to an unnamed manufacturer.',
    priority: 4,
};

export const espionageBrokerEvent: GameEvent = {
    id: 'espionage-broker',
    when: GROWN,
    chance: 0.10,
    conversation: espionageBroker,
    headline: 'Researchers report a large exfiltration from a mid-cap technology firm.',
    priority: 4,
};

export const espionageOracleEvent: GameEvent = {
    id: 'espionage-oracle',
    when: RETALIATION,
    chance: 0.20,
    conversation: espionageOracle,
    headline: 'Quiet talk of a second intrusion in the sector. Nobody will be named.',
    priority: 5,
};

export const ESPIONAGE_CONVERSATIONS = [
    espionageKestrel, espionageKestrelBetrayal,
    espionageBroker, espionageBrokerBetrayal,
    espionageOracle, espionageOracleBetrayal,
];

export const ESPIONAGE_EVENTS = [
    espionageKestrelEvent, espionageBrokerEvent, espionageOracleEvent,
];
