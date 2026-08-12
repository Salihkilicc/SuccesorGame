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
    { kind: 'quarterAtLeast', quarter: 8 },
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
            // She is not composed. It is the only scene in her arc where she
            // writes the way people actually write at that hour.
            text: 'I am in the building. It is quarter past two.\n\nSomebody has had access to the design share for at least nine weeks. Not encrypted — copied. They have the current platform, the next one, and the supplier file with every unit price in it.\n\nI have pulled the share offline. That is closing a door in an empty room.',
            choices: [
                { text: 'Nine weeks?', next: 'nineWeeks' },
                { text: 'Have they asked for anything?', next: 'asked' },
            ],
        },
        {
            id: 'nineWeeks',
            speaker: 'cto',
            text: 'Nine that I can prove. The logs roll at ninety days and they were in before that.\n\nI want to say something and then not say it again: this is mine. The share was open because I opened it, in a bad week, for a contractor who is no longer here.',
            choices: [
                { text: 'Have they asked for anything?', next: 'asked' },
                { text: 'It is not yours. Keep working.', next: 'asked' },
            ],
        },
        {
            id: 'asked',
            speaker: 'cto',
            text: 'An hour ago. They call themselves Kestrel and they want one point eight million to delete their copy and tell us how they got in.\n\nIt is a small number. I noticed that too and I do not know whether it is good news.',
            choices: [
                {
                    text: 'Pay them.',
                    effects: [
                        { kind: 'capital', amount: -1_800_000 },
                        { kind: 'flag', flag: 'paidTheRansom' },
                        // The cheap crew, and the worst coin in the file.
                        {
                            kind: 'risk',
                            chance: KESTREL_PROMISE,
                            onBetrayal: 'event-espionage-kestrel-betrayal',
                            afterQuarters: 2,
                        },
                    ],
                },
                { text: 'No. Assume it is out.', next: 'assumeOut' },
            ],
        },
        {
            id: 'assumeOut',
            speaker: 'cto',
            text: 'Then I change the platform. Not the drawings — the parts. Every price we negotiated on the assumption nobody else had the file is now a price somebody else has.\n\nIt is nine months and it is the only version where I know where we stand.',
            choices: [
                {
                    text: 'Do it. Assume everything is out.',
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
            // No drama. She is reading a forum post.
            text: 'The supplier file is on a forum. Posted eleven days ago, free, by an account that has posted four other companies this year.\n\nWe paid them. I checked the wallet this morning out of some feeling I could not name and the money is long gone.',
            choices: [
                {
                    text: 'So we paid for nothing.',
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
            text: 'Four in the morning. I am sorry.\n\nOur research directory has been exfiltrated — eleven years of it, including the two programmes that are the entire reason this department exists. I found out because a man emailed me directly, politely, at my personal address, which he should not have.',
            choices: [
                { text: 'Who is he?', next: 'whoIsHe' },
                { text: 'What does he want?', next: 'wants' },
            ],
        },
        {
            id: 'whoIsHe',
            speaker: 'cto',
            text: 'He describes himself as a facilitator. He says — and this is a quote — that he has never seen our files, will never see them, and could not decrypt them if he wanted to.\n\nI believe him. That is the arrangement: whoever took it does not want to talk to us, and he does not want to know what he is selling.',
            choices: [
                { text: 'What does he want?', next: 'wants' },
                { text: 'Then he is useless to us.', next: 'refuse' },
            ],
        },
        {
            id: 'wants',
            speaker: 'cto',
            text: 'Seven and a half million, and a signed acknowledgement that no law enforcement agency has been contacted.\n\nHe was very clear that the second part is not a threat. He said his clients simply prefer tidy files, and then he said the word "tidy" again in a way I have been thinking about since.',
            choices: [
                {
                    text: 'Pay him. All of it.',
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
                { text: 'No.', next: 'refuse' },
            ],
        },
        {
            id: 'refuse',
            speaker: 'cto',
            // The cost of refusing is the CTO's own arc, which is what makes
            // this variant hurt somewhere the other two do not.
            text: 'Then I have to assume both programmes are for sale, and I have to tell the team, because they will find out and I would rather it was from me.\n\nI will lose people over this. Not because of what happened — because of what I will have to say about what we are going to do instead.',
            choices: [
                {
                    text: 'Tell them yourself. Today.',
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
            // The most elegant betrayal of the three: he did not lie.
            text: 'A second facilitator has emailed me. Different name, same phrasing, same assurance that he has never seen the files.\n\nHe is aware we paid. He says that payment was to a different party and that he is sorry for the confusion, and I do not think he is lying — I think we bought a promise from somebody who genuinely was not holding anything.',
            choices: [
                {
                    text: 'And now he wants his own number.',
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
            text: 'Something is wrong and I cannot tell you how wrong yet.\n\nThere is a message on my machine that was not delivered by anything. It is a single line: "Ask him what he bought last year." I do not know who "him" is and I do not like that I have a guess.\n\nAttached to it is our Deep Tech programme file. All of it.',
            choices: [
                { text: 'Forward me the message.', next: 'forwarded' },
                { text: 'What do they want?', next: 'want' },
            ],
        },
        {
            id: 'forwarded',
            speaker: 'cto',
            text: 'Sent. There is a second line under the attachment that I did not read at first because it is formatted like a footer.\n\n"This is reciprocal. Nothing further will be taken."',
            choices: [
                { text: 'What do they want?', next: 'want' },
                { text: 'Reciprocal for what?', next: 'reciprocal' },
            ],
        },
        {
            id: 'reciprocal',
            speaker: 'cto',
            // She does not know what the player did. She is simply good at her
            // job, and the player has to sit with the fact that she is asking.
            text: 'That is my question. I have asked it four times today in four different rooms and everybody has looked at me the way you are about to.\n\nI am not going to ask a fifth time. But I would like you to know that I stopped asking rather than that I got an answer.',
            choices: [
                { text: 'What do they want?', next: 'want' },
                { text: 'Nothing you need to carry.', next: 'want' },
            ],
        },
        {
            id: 'want',
            speaker: 'cto',
            text: 'They do not want money. I have read it three times.\n\nThey want us out of Deep Tech — no new programmes, no hires, nothing announced, for two years. In exchange the file is deleted and they never contact us again.\n\nThere is no account number anywhere in the message. That is what frightens me about it.',
            choices: [
                {
                    text: 'Take the deal. Two years.',
                    effects: [
                        { kind: 'flag', flag: 'paidTheRansom' },
                        // The ransom IS the concession: two years of somebody
                        // else's weight on the category you agreed to leave.
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
                { text: 'No. Find out who they are.', next: 'findOut' },
            ],
        },
        {
            id: 'findOut',
            speaker: 'cto',
            text: 'I can try and it will cost a great deal and I will probably fail, and if I succeed the answer will be a company in a country neither of us can sue in.\n\nMeanwhile the file is out and I would build on the assumption that everything in it is known.',
            choices: [
                {
                    text: 'Find out anyway.',
                    effects: [
                        { kind: 'capital', amount: -3_800_000 },
                        { kind: 'brand', amount: -4 },
                        // Refusing is how you learn who sent them, and it is
                        // the only route to that fact.
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
            text: 'I have a name. Not theirs — the name on the retainer that paid them.\n\nIt is a procurement entity registered in Delaware with one director and one client, and the client files consolidated accounts under a parent you and I both write letters to.',
            choices: [
                { text: 'Say it.', next: 'sayIt' },
                { text: 'I know who it is.', next: 'knew' },
            ],
        },
        {
            id: 'knew',
            speaker: 'cto',
            // The line that closes the mole arc from the other end.
            text: 'Yes. I thought you might.\n\nI have spent a week being frightened of a stranger and it turns out I should have been frightened of an arrangement, which is worse, because arrangements are reciprocal and I do not know what we did first.',
            choices: [
                { text: 'Say it out loud anyway.', next: 'sayIt' },
                {
                    text: '(let it go)',
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
            text: 'Pear. Two removes, deniable, and absolutely them.\n\nI am not going to advise you on what to do with that. I will say that whoever they used is now a person who has been paid by both of us, and that is not a stable arrangement for anybody.',
            choices: [
                {
                    text: 'Then we know where we stand.',
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
    chance: 0.2,
    conversation: espionageKestrel,
    headline: 'A credential broker is advertising access to an unnamed manufacturer.',
    priority: 4,
};

export const espionageBrokerEvent: GameEvent = {
    id: 'espionage-broker',
    when: GROWN,
    chance: 0.15,
    conversation: espionageBroker,
    headline: 'Researchers report a large exfiltration from a mid-cap technology firm.',
    priority: 4,
};

export const espionageOracleEvent: GameEvent = {
    id: 'espionage-oracle',
    when: RETALIATION,
    chance: 0.4,
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
