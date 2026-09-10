// src/data/story/cooProduction.ts
//
// ============================================================================
//  THE OTHER MECHANIC NOBODY WORKS OUT BY PRESSING THINGS
// ============================================================================
//
//  Its sister file is ctoResearch.ts, and the pair is deliberate. Research is
//  hard to understand because it is three steps and none of them look like the
//  next. Production is hard for the opposite reason: it looks like ONE step
//  and is actually two numbers being compared, only one of which is on the
//  slider.
//
//  What the player sees is a control with a maximum on it. Every other
//  maximum in this game is a thing to reach - the marketing benchmark, the
//  facility tier, the research team. This one is a ceiling on what the floor
//  can physically do, and building up to it when the market wants half that
//  produces a warehouse the company then pays rent on. The number that
//  decides whether the quarter was any good is the one NOT on the slider.
//
//  A player who slides it to the right and taps save has done the obvious
//  thing, and the obvious thing is wrong. That is the definition of a lesson
//  worth writing.
//
//  ---------------------------------------------------------------------------
//  WHY IT IS THE COO
//  ---------------------------------------------------------------------------
//  Dana Whitfield runs the floor. Her tone note in data/story/cast.ts says she
//  "will tell you the line cannot do what you promised before she tells you
//  good morning", and this is that sentence with a reason attached: the
//  overbuild is not the factory's failure, it is an instruction the factory
//  carried out.
//
//  And NOT the father, for the same reason ctoResearch is not his. He can be
//  dead for most of a run, and a player in year six who has just bought a new
//  factory needs this exactly as much as one in the first quarter. The first
//  year has a narrator; this is not part of the first year, it is triggered by
//  opening a product sheet.
//
//  Her tone: short sentences, concrete nouns, numbers with units. Angry on
//  behalf of the people on the line rather than on her own behalf. She does
//  not do metaphors and she does not do reassurance.
// ============================================================================

import type { Conversation } from '../../core/story/graph';

export const cooProduction: Conversation = {
    id: 'coo-production',
    channel: 'message',
    from: 'coo',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'coo',
            // She opens on the thing she can see the player is about to do,
            // which is the whole difference between a tooltip and a person.
            text: 'You have the production screen open. Before you slide that to the top: the number on the right of it is what the line can build, not what anyone is going to buy.\n\nThose are two different figures and only one of them pays wages.',
            choices: [
                { text: 'What happens if I build the maximum?', next: 'maximum' },
                { text: 'So what do I set it to?', next: 'what' },
            ],
        },

        {
            id: 'maximum',
            speaker: 'coo',
            // Concrete, with the unit, and the cost named rather than
            // gestured at. She is describing a real charge on the report.
            text: 'You build the maximum and the ones nobody buys come back to us. They sit in a building we rent, they cost five a unit every quarter they sit there, and they are worth less next year than they are today.\n\nThat is not a warning. That is the invoice.',
            choices: [
                { text: 'Then what do I set it to?', next: 'what' },
                { text: 'What about building too few?', next: 'tooFew' },
            ],
        },

        {
            id: 'what',
            speaker: 'coo',
            // The actual answer, said plainly, because the screen already
            // shows both figures and she is only telling them which to read.
            text: 'What the market wants. It is on the same screen, under the slider, and it moves every quarter.\n\nMatch it. There is a button on that row that does it for you and I would use it until you have a reason not to.',
            choices: [
                { text: 'What about building too few?', next: 'tooFew' },
                { text: 'Understood.', next: 'close' },
            ],
        },

        {
            id: 'tooFew',
            speaker: 'coo',
            // The other side of the error, because a player who only hears
            // the first half learns to underbuild, which is worse and quieter.
            text: 'Worse, and it does not show up on the report as a loss. It shows up as a sale somebody else made.\n\nEmpty shelves send people to the competition and they do not always come back. Short is more expensive than long, it just costs you somewhere you are not looking.',
            choices: [
                { text: 'So match demand.', next: 'close' },
            ],
        },

        {
            id: 'close',
            speaker: 'coo',
            // Terminal. She does not thank him and she does not soften.
            text: 'Match demand, and check it again when the quarter turns. It moves.\n\nAnd if you ever want more than the line can do, the answer is another building, not a bigger number on that slider.',
            choices: [
                { text: 'Noted.', effects: [] },
            ],
        },
    ],
};
