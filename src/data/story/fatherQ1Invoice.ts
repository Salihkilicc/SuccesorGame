// src/data/story/fatherQ1Invoice.ts
//
// ============================================================================
//  QUARTER ONE, PART TWO — ONE NUMBER FOR THREE MONTHS
// ============================================================================
//
//  He said the invoice would come as a single figure. It did. He was right,
//  and being right is the problem.
//
//  ---------------------------------------------------------------------------
//  THE JOB OF THIS SCENE
//  ---------------------------------------------------------------------------
//  The first one planted the suspicion. This one CONFIRMS the observable half
//  and leaves the interpretation open, which is the only way the ambiguity
//  survives contact with evidence.
//
//  What he predicted, correctly: the quarterly report leads with a total and
//  puts the breakdown a screen further in. That is true of the actual report
//  screen, and a player who goes and looks will find he was right about the
//  form.
//
//  What he adds, and cannot support: that it is arranged that way ON PURPOSE,
//  by someone, to keep him from looking. Same evidence. Second claim does not
//  follow from the first, and he does not notice the gap - or he noticed it
//  thirty years ago and stopped caring.
//
//  ---------------------------------------------------------------------------
//  ONE DELIBERATE CRACK
//  ---------------------------------------------------------------------------
//  He gets a detail wrong here, and it is the first evidence for the other
//  reading: he refers to a supplier who "did this to me in '09". If the
//  player presses, the year moves. Nothing announces this. The player either
//  notices two numbers or does not, and no line of dialogue points at it.
//
//  A man who is right about everything is a mentor. A man who is right about
//  everything except the year is a man remembering, which is a different
//  thing and the player should be the one to spot it.
// ============================================================================

import type { Conversation } from '../../core/story/graph';

export const fatherQ1Invoice: Conversation = {
    id: 'father-q1-invoice',
    channel: 'message',
    from: 'father',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'father',
            text: 'It came. One line, one total, and the word "operations" doing the work of four hundred decisions.\n\nI told you. Did you open the breakdown or did you read the total and close it?',
            choices: [
                { text: 'I opened it.', next: 'opened' },
                { text: 'I read the total.', next: 'total' },
            ],
        },

        {
            id: 'total',
            speaker: 'father',
            // No scolding. He is worse than that: he is unsurprised.
            text: 'Of course you did. It is designed so that you do.\n\nThat is not an insult, it is the design. A total is restful. Four hundred decisions are not, and the man who laid out that page knew which one you would rather be looking at.',
            choices: [
                { text: 'Or he had a page to fill.', next: 'pageToFill' },
                { text: 'What am I looking for in there?', next: 'lookingFor' },
            ],
        },

        {
            id: 'opened',
            speaker: 'father',
            text: 'Then you are ahead of where I was. I did not open one properly until I was forty-one, and by then a man had been taking three percent off the top of my materials for six years and I had signed every page of it.',
            choices: [
                { text: 'Who was he?', next: 'whoWasHe' },
                { text: 'What am I looking for in there?', next: 'lookingFor' },
            ],
        },

        {
            id: 'whoWasHe',
            speaker: 'father',
            // THE CRACK, first half. He says 2009.
            text: 'Nobody you need. He is dead and the company is dead and I am still here, which is the only part of it I am proud of.\n\nZeidler. Spring of oh-nine. Three percent, on the materials, for six years.',
            choices: [
                { text: 'Six years and nobody caught it?', next: 'sixYears' },
                { text: 'What am I looking for in there?', next: 'lookingFor' },
            ],
        },

        {
            id: 'sixYears',
            speaker: 'father',
            // THE CRACK, second half. The year has moved to 2011, and the
            // arithmetic has quietly stopped working. Nothing draws attention
            // to it. If the player does the sum, it is theirs to do.
            text: 'Who was going to catch it? My accountant signed it. My brother signed it. I signed it.\n\nEleven, it would have been. Two thousand and eleven. You do not forget the season, you forget the year — the season is when it happened to you and the year is only a number somebody else keeps.',
            choices: [
                { text: 'What am I looking for in there?', next: 'lookingFor' },
                { text: 'You said oh-nine a moment ago.', next: 'corrected' },
            ],
        },

        {
            id: 'corrected',
            speaker: 'father',
            // He does not concede and he does not bluster. He reframes, which
            // is what a man does when he has done this before. Whether the
            // reframe is wisdom or cover is exactly the open question.
            text: 'Did I.\n\nThen one of the two is wrong and it does not change the three percent. That is the whole lesson, and you have just given me a better example of it than I had: do not argue with a man about his dates. Argue with his numbers. The dates are memory. The numbers are on paper and paper can be checked.',
            choices: [
                { text: 'What am I looking for in there?', next: 'lookingFor' },
            ],
        },

        {
            id: 'pageToFill',
            speaker: 'father',
            text: 'Perhaps. I have been wrong about this before and I have been right about it twice, and the twice cost me more than every time I was wrong put together.\n\nThat is not an argument. I know it is not an argument. It is still how I read a page.',
            choices: [
                { text: 'What am I looking for in there?', next: 'lookingFor' },
            ],
        },

        {
            id: 'lookingFor',
            speaker: 'father',
            // All of this is true of the engine: COGS is charged on units
            // PRODUCED, and storage is charged per unsold unit per quarter.
            // core/reportTypes.ts says so in as many words.
            text: 'Two things, and neither is the total.\n\nWhat you paid to build, against what you actually sold. You are charged for everything that leaves the line, not everything that leaves the warehouse — build four hundred and sell three hundred and you have bought yourself a hundred units and the shelf they sit on.\n\nAnd the shelf is not free either. It is a small line. It is small every quarter and then it is not.',
            choices: [
                { text: 'So overproducing is the trap.', next: 'trap' },
                { text: 'And if I underbuild?', next: 'underbuild' },
            ],
        },

        {
            id: 'underbuild',
            speaker: 'father',
            text: 'Then somebody else sells to your customer and keeps him. Losing a sale costs you the sale. Losing a customer costs you every sale he was going to make you for nine years, and it does not appear on any line of that page.\n\nBoth directions are expensive. Anyone who tells you there is a safe one is selling you software.',
            choices: [
                { text: 'Understood.', next: 'close' },
            ],
        },

        {
            id: 'trap',
            speaker: 'father',
            text: 'It is one of them. The other is building too little and calling it discipline.\n\nThe page will not tell you which you did. It will show you the same total either way, and you will have to know from the parts.',
            choices: [
                { text: 'Understood.', next: 'close' },
            ],
        },

        {
            id: 'close',
            speaker: 'father',
            // Terminal. The last line is the thesis of the whole year, and it
            // is either the wisest thing in the game or the saddest, and the
            // player is not supposed to know which until he is gone.
            text: 'Good.\n\nRead it every quarter, even the quarters where nothing happened. Especially those. A man who only checks the books when he is worried has told everyone exactly when he is worried.',
        },
    ],
};
