// src/data/story/ctoResearch.ts
//
// ============================================================================
//  THE ONE MECHANIC NOBODY WORKS OUT BY PRESSING THINGS
// ============================================================================
//
//  Everything else in this game is one step from its result. Set a target and
//  units come out. Put money behind a product and people hear about it. Pay a
//  bonus and morale moves.
//
//  Research is three steps and none of them look like the next: you hire
//  people, the people make points, and the points - eventually, in a screen
//  you have not opened yet - become a product you could not otherwise build.
//  A player who taps the laboratory, sees a slider full of salaries and a
//  number called RP, and taps back out has understood it correctly. It looks
//  like paying strangers for a currency.
//
//  ---------------------------------------------------------------------------
//  WHY IT IS THE CTO AND NOT THE FATHER
//  ---------------------------------------------------------------------------
//  The father may be dead. The whole first-year sequence is gated on him
//  being alive, and research is not part of the first year - it is triggered
//  by the player opening it, which they might do in the first quarter or in
//  year four.
//
//  Priya Raman is also the right person on the merits. She has been asking
//  for a lab since before the player arrived (see data/events/labPressure.ts,
//  where the company starts with zero researchers and she notices), so being
//  the one who explains it is the payoff for a complaint she has been making
//  in the background.
//
//  Her tone note: precise, technical, impatient with people who are not, and
//  MORE precise under stress rather than less. She quotes real numbers here
//  because the engine's curve is real - 600 x n^0.85 - and because a person
//  who talks like this would.
// ============================================================================

import type { Conversation } from '../../core/story/graph';

export const ctoResearch: Conversation = {
    id: 'cto-research',
    channel: 'message',
    from: 'cto',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cto',
            // She has been waiting to be asked and says so in the first line,
            // without making it a complaint - which is the difference between
            // her and everybody else in this company.
            text: 'You opened the research page. I have had an alert on that for two years and this is the first time it has gone off.\n\nBefore you close it again: the number in there is not a currency and you are not buying it.',
            choices: [
                { text: 'What is it, then?', next: 'what' },
                { text: 'It looks like paying strangers.', next: 'strangers' },
            ],
        },

        {
            id: 'strangers',
            speaker: 'cto',
            // She agrees with the criticism completely, which disarms it.
            text: 'It is paying strangers. That is exactly what it is and I am not going to pretend otherwise.\n\nThe question is what they are doing while you pay them, and the answer is that they are the only way this company ever builds something it cannot build today.',
            choices: [
                { text: 'Meaning what, concretely?', next: 'what' },
            ],
        },

        {
            id: 'what',
            speaker: 'cto',
            // The three steps, stated as three steps, because the whole
            // problem is that they do not look connected.
            text: 'Three things, and they only make sense together.\n\nYou hire researchers. They produce research points every quarter, whether or not you are looking. The points unlock products you do not have and improve the ones you do.\n\nThat is the entire mechanism. It is slower than everything else you can spend money on and it is the only spending that changes what you are capable of.',
            choices: [
                { text: 'How many people is a sensible start?', next: 'howMany' },
                { text: 'Improve them how?', next: 'improve' },
            ],
        },

        {
            id: 'improve',
            speaker: 'cto',
            text: 'Quality and cost, on a product you already sell. A better version of the phone is worth more than the phone and costs less to make than the phone did last year.\n\nNobody notices that happening. They notice the quarter it stops.',
            choices: [
                { text: 'How many people is a sensible start?', next: 'howMany' },
                { text: 'Understood.', next: 'close' },
            ],
        },

        {
            id: 'howMany',
            speaker: 'cto',
            // The real curve. Six hundred at one, and the exponent named -
            // she is the one character in the game allowed to be this exact.
            text: 'One is not a rounding error. One researcher is six hundred points a quarter, which is more than nothing by an infinite margin.\n\nAfter that it bends. The output goes with the team to the power of nought point eight five, so ten people are not ten times one, they are about seven. Salary is not on a curve. It is ten times ten.',
            choices: [
                { text: 'So a big team is a bad deal.', next: 'bigTeam' },
                { text: 'Then start small.', next: 'close' },
            ],
        },

        {
            id: 'bigTeam',
            speaker: 'cto',
            // She corrects the misreading rather than letting it stand,
            // because a player who leaves believing it will never hire again.
            text: 'A big team is an expensive deal. It is not a bad one, it is the only way to reach the things at the far end of the tree, and those are the things that decide whether this company exists in ten years.\n\nWhat I am telling you is to know which you are buying. Cheap discoveries or fast ones.',
            choices: [
                { text: 'Start small, then.', next: 'close' },
            ],
        },

        {
            id: 'close',
            speaker: 'cto',
            // Terminal. She does not thank him, and she does not soften.
            text: 'Then hire somebody and let them work.\n\nAnd do not check it every quarter. It compounds or it does not, and watching it does neither.',
            choices: [
                { text: 'Hiring now.', effects: [] },
            ],
        },
    ],
};
