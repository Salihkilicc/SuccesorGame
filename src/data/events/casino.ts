// src/data/events/casino.ts
//
// ============================================================================
//  THREE QUARTERS IN A ROW IS A PATTERN, AND A PATTERN IS PRINTABLE
// ============================================================================
//
//  The casino has been in this game since before any of the story was written
//  and it has never cost the chief executive anything except money. There was
//  no counter of any kind - a player could be at a roulette table every week
//  for nine years and nothing in the company would know.
//
//  `useCasinoRiskStore` is the counter and it counts the only thing that
//  matters here: not how much was lost, not how often, but HOW MANY QUARTERS
//  IN A ROW. One heavy weekend is a story nobody writes. Three consecutive
//  quarters is a pattern, and a pattern is what a journalist can print.
//
//  ---------------------------------------------------------------------------
//  THIRTY PER CENT, AND IT KEEPS ROLLING
//  ---------------------------------------------------------------------------
//  Rolled every quarter the streak is still standing, which is deliberate and
//  is not the same as the espionage coin. There, the player pays once and the
//  outcome is settled; here they are choosing, every quarter, to go on doing
//  the thing. A single roll would let somebody survive one bad quarter and
//  then play for a decade in perfect safety.
//
//  Stopping for ONE clean quarter clears the whole streak. That is merciful
//  and it is what makes this a decision the player can act on rather than a
//  debt they accumulate - and it means the 30% is a tap the player controls,
//  not weather.
// ============================================================================

import type { Conversation } from '../../core/story/graph';
import type { Condition } from '../../core/story/conditions';
import type { GameEvent } from '../../core/events/types';

/** Three quarters in a row. Also in useCasinoRiskStore as SCANDAL_STREAK. */
export const SCANDAL_AT = 3;

const CAUGHT: Condition[] = [
    { kind: 'flag', flag: 'fatherDead' },
    { kind: 'casinoStreakAtLeast', quarters: SCANDAL_AT },
    { kind: 'noFlag', flag: 'casinoScandal' },
];

export const casinoScandalScene: Conversation = {
    id: 'event-casino-scandal',
    channel: 'message',
    from: 'cfo',
    when: CAUGHT,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cfo',
            // Arthur, being dry about a thing that is not dry. He does not
            // moralise once in the whole scene, which is what makes it land.
            text: 'A financial paper has been through nine months of your movements and has photographs from three of them.\n\nThey are not alleging anything unlawful and nothing unlawful has happened. The piece is about a chief executive who was somewhere on a Tuesday, repeatedly, while the company was doing what it was doing.\n\nThey run on Friday.',
            choices: [
                { text: 'It is my own money.', next: 'ownMoney' },
                { text: 'What do they actually have?', next: 'whatTheyHave' },
            ],
        },
        {
            id: 'ownMoney',
            speaker: 'cfo',
            text: 'It is, entirely, and I would say so if anybody asked me.\n\nNobody is going to ask me. The story is not about the money, it is about a pattern, and a pattern is the only thing a paper can print without a lawyer in the room.',
            choices: [
                { text: 'What do they actually have?', next: 'whatTheyHave' },
                { text: 'Say nothing. Let it run.', next: 'sayNothing' },
            ],
        },
        {
            id: 'whatTheyHave',
            speaker: 'cfo',
            text: 'Three photographs, a doorman who talked, and a table of dates set against our quarterly results. The table is the part that will be reprinted.\n\nI have seen the layout. Two of the quarters in it were good ones, which nobody will notice.',
            choices: [
                { text: 'Get ahead of it.', next: 'getAhead' },
                { text: 'Say nothing. Let it run.', next: 'sayNothing' },
            ],
        },
        {
            id: 'getAhead',
            speaker: 'cfo',
            text: 'A statement before Friday, short, no denial of anything factual, and a line about the demands of the job that I will write and you will hate.\n\nIt takes about a third of the heat off and it makes the story two days old by the time it appears.',
            choices: [
                {
                    text: 'Write it. I will sign it.',
                    effects: [
                        { kind: 'flag', flag: 'casinoScandal' },
                        { kind: 'brand', amount: -6 },
                        { kind: 'dial', dial: 'publicReputation', delta: -8 },
                        { kind: 'dial', dial: 'cfoTrust', delta: 3 },
                        {
                            kind: 'news',
                            headline: 'Hale\'s chief executive addresses questions about his private time ahead of a press report.',
                        },
                    ],
                },
                { text: 'No. Say nothing.', next: 'sayNothing' },
            ],
        },
        {
            id: 'sayNothing',
            speaker: 'cfo',
            // He does not argue and he does not sulk. He tells you what
            // Monday will look like, and he is right.
            text: 'Then it runs on Friday with "the company declined to comment", which is a sentence that has never once helped anybody.\n\nI will have the switchboard ready on Monday.',
            choices: [
                {
                    text: '(let it run)',
                    effects: [
                        { kind: 'flag', flag: 'casinoScandal' },
                        { kind: 'brand', amount: -12 },
                        { kind: 'dial', dial: 'publicReputation', delta: -15 },
                        { kind: 'morale', amount: -6 },
                        {
                            kind: 'news',
                            headline: 'Nine months, three photographs and a table of dates. Hale declined to comment.',
                        },
                    ],
                },
            ],
        },
    ],
};

export const casinoScandalEvent: GameEvent = {
    id: 'casino-scandal',
    when: CAUGHT,
    // Thirty per cent, rolled again every quarter the streak survives. The
    // player is choosing to keep going, and each quarter is a fresh choice.
    chance: 0.30,
    // No cooldown: once per game, because the flag closes the gate anyway and
    // a second identical story is not a second story.
    conversation: casinoScandalScene,
    headline: 'A financial paper is understood to be preparing a piece on a chief executive\'s private time.',
    priority: 4,
};
