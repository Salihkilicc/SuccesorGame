// src/data/story/fatherQ1.ts
//
// ============================================================================
//  QUARTER ONE — THE FATHER TAKES THE WHEEL
// ============================================================================
//
//  The first thing anyone says to the player, and it has three jobs at once:
//  start production, explain how products share a factory, and put a splinter
//  under the fingernail about who can be trusted.
//
//  ---------------------------------------------------------------------------
//  THE DESIGN PROBLEM, AND IT IS THE WHOLE SCENE
//  ---------------------------------------------------------------------------
//  He has to be teaching correctly and being paranoid AT THE SAME TIME, in the
//  same sentences, so that the player cannot yet tell which is which.
//
//  The cheap version separates them: sound advice here, a mad aside there.
//  Then the player files the asides under "Dad is a bit much" and the question
//  is closed on the first read. The question has to stay open for a year.
//
//  So every instruction he gives is TRUE - absolute unit targets, shared
//  capacity, scrap, the invoice with no breakdown - and the REASON he gives
//  for each one is a man who has decided the world is arranged against him.
//  The mechanics work. The reasoning may not. Both are load-bearing and you
//  cannot pull them apart yet, which is the point:
//
//      "Set a number. Not a percentage. A percentage is what a man says
//       when he does not want to be held to a figure."
//
//  That is genuinely good advice about production targets AND the sentence of
//  someone who assumes bad faith by default. One line, two readings.
//
//  ---------------------------------------------------------------------------
//  WHAT HE IS ACTUALLY RIGHT ABOUT
//  ---------------------------------------------------------------------------
//  Everything factual. Capacity IS shared between products, targets ARE
//  absolute units, the workshop DOES scrap one in ten, and the quarterly
//  invoice DOES arrive as a single figure with the breakdown a screen away.
//  A player who follows him plays well. A player who dismisses him as a
//  paranoid old man plays badly. That is what makes the year work: by the
//  time you know which parts to discard he has been dead for a while.
//
//  He never greets anyone. He starts mid-thought, because in his head the
//  conversation began before you picked up.
// ============================================================================

import type { Conversation } from '../../core/story/graph';

export const fatherQ1: Conversation = {
    id: 'father-q1',
    channel: 'message',
    from: 'father',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'father',
            text: 'The line is running at half. It has been running at half since before you were born, because half is what I could sell.\n\nThat is the number nobody argues with and everybody should. Your grandfather ran it hot through a war. I ran it at half through two recessions, a bank that changed its mind on a Friday, and a man in California who decided we were a rounding error.\n\nI am not going to tell you which buttons to press. Somebody will show you. I want to tell you why the number stuck.',
            choices: [
                { text: 'How much should I make?', next: 'howMuch' },
                { text: 'Good morning to you too.', next: 'goodMorning' },
            ],
        },

        {
            id: 'goodMorning',
            speaker: 'father',
            // The warmth arrives sideways and is withdrawn before it can be
            // answered. This is the only affection in the scene and it is
            // buried in the middle of an instruction, where he can deny it.
            text: 'Your mother taught you that. It is a good habit and it will not help you here.\n\nGood morning. She used to say it to the machines as well, on the Saturdays she came in with me. To the machines. Out loud.',
            choices: [
                { text: 'She came in on Saturdays?', next: 'saturdays' },
                { text: 'How much should I make?', next: 'howMuch' },
            ],
        },

        {
            id: 'saturdays',
            speaker: 'father',
            // Him, sideways. He is answering a question about her and the
            // answer is entirely about what he did with the time.
            text: 'For eleven years. She read, mostly. She said the building was quieter than the house and I never worked out whether that was a joke.\n\nI took it as one at the time. I have had a while to think about it since.',
            choices: [
                { text: 'How much should I make?', next: 'howMuch' },
            ],
        },

        {
            id: 'howMuch',
            speaker: 'father',
            // Every fact here is true of the engine: absolute units, not a
            // percentage. See core/market/production.ts -> resolveTargetUnits.
            text: 'Whatever the number is, it is a number. Units. Not a percentage — I never want to hear a percentage out of you.\n\nA percentage is what a man says when he does not want to be held to a figure. Ask a supplier for "about eighty percent" and see what arrives.',
            choices: [
                { text: 'What limits the number?', next: 'capacity' },
                { text: 'Suppliers have been fine so far.', next: 'soFar' },
            ],
        },

        {
            id: 'soFar',
            speaker: 'father',
            // The first real look at him. He is not arguing - he is
            // conceding the point in a way that makes it worse.
            text: 'So far. Yes.\n\nWe had a supplier for eleven years. Eleven. Christmas card, knew his children. Then somebody in California put an order in front of him that was bigger than everything we had ever bought from him put together, and he took it, and he was RIGHT to take it, and that is what nobody tells you about the word loyalty.\n\nWrite down the date you started counting, so that later you know how long "so far" turned out to be.',
            choices: [
                { text: 'What limits the number?', next: 'capacity' },
            ],
        },

        {
            id: 'capacity',
            speaker: 'father',
            // True: capacity is shared and allocated proportionally when the
            // requests exceed it. core/market/capacity.ts
            text: 'The floor. One floor, and everything you build shares it — ask for more than it holds and every product gets cut back in proportion. Nobody warns you. It simply comes out short and the report explains it afterwards, politely.\n\nAnd of what you do build, the workshop ruins about one in ten. You pay for those too.',
            choices: [
                { text: 'Then I will aim under capacity.', next: 'under' },
                { text: 'One in ten. Can that be fixed?', next: 'fixed' },
            ],
        },

        {
            id: 'fixed',
            speaker: 'father',
            text: 'With a better floor, yes. With better people, a little. Do not let anyone tell you it is the people — that is the first thing a man says when he wants money for a hire and the second thing he says when he is covering for himself.\n\nIt is the floor. It is nearly always the floor. I asked for a new one three times. Three times a room full of people who own more of it than I did explained to me why not, in a tone, and then wrote it into the minutes as a discussion.',
            choices: [
                { text: 'Understood.', next: 'close' },
            ],
        },

        {
            id: 'under',
            speaker: 'father',
            text: 'Aim under it and you will never learn where it is. Aim at it and it will teach you in one quarter what a consultant would take a year and forty thousand to explain badly.\n\nI will look at the invoice with you when it comes. I would like that, actually. I have not read one with anybody in a long time.',
            choices: [
                { text: 'The invoice?', next: 'invoice' },
                { text: 'Fine.', next: 'close' },
            ],
        },

        {
            id: 'invoice',
            speaker: 'father',
            // Seeding the second scene. He is describing the quarterly report
            // accurately - one figure, breakdown a screen away - and giving
            // it a motive it does not have. Or does. Not yet.
            text: 'At the end of the quarter they send you one number and a word like "operations". One number, for three months of your life.\n\nThe parts are there if you go looking. They are always there. Ask yourself, while you are looking for them, who decided they should be a page further in.',
            choices: [
                { text: 'Somebody designing a form, probably.', next: 'form' },
                { text: 'I will look at every line.', next: 'everyLine' },
            ],
        },

        {
            id: 'form',
            speaker: 'father',
            // He does not defend himself. He agrees, and it lands worse.
            text: 'Probably. That is the honest answer and I would like you to keep giving it, right up until the quarter it turns out to be the other one.\n\nI stopped giving it somewhere around fifty. I do not recommend the trade.',
            choices: [
                { text: 'Setting it now.', next: 'close' },
            ],
        },

        {
            id: 'everyLine',
            speaker: 'father',
            text: 'Every line. Every quarter. Including the ones that have been the same for four years — those are the ones worth reading, because a number that never moves is either honest or unexamined and there is no third option.',
            choices: [
                { text: 'Setting the target now.', next: 'close' },
            ],
        },

        {
            id: 'close',
            speaker: 'father',
            // Terminal card: he has the last word, which is how every
            // conversation with him ends. The schedule effect is what brings
            // him back once the quarter has closed and the invoice exists.
            text: 'Good.\n\nOne more thing and then I will leave you to it. Whatever they tell you this quarter — the floor manager, the accountant, your brother — write down what they said and the date. Not because they are lying. Because in a year you will want to know who was wrong, and everybody remembers themselves as having been right.',
            choices: [
                {
                    text: 'I will.',
                    effects: [
                        // ------------------------------------------------
                        //  SHELVED: THE INVOICE SCENE
                        // ------------------------------------------------
                        //  The father had SIX conversations in the first four
                        //  quarters and a message thread carries one at a
                        //  time. They queued behind each other and the last
                        //  one - father-q4, the only scene of his that
                        //  teaches nothing - never arrived at all.
                        //
                        //  This is the one that went, and it is the right
                        //  one: its lesson (open the breakdown, do not read
                        //  the total) is no longer carried by any lock, and
                        //  at 27 cards it is the longest thing he says. What
                        //  it costs is the Zeidler story, which is the best
                        //  three cards in it - see the note in
                        //  data/story/fatherQ1Invoice.ts, which is kept whole
                        //  so it can be folded into another scene later.
                        //
                        //  {
                        //      kind: 'schedule',
                        //      conversation: 'father-q1-invoice',
                        //      afterQuarters: 1,
                        //      urgent: true,
                        //  },
                    ],
                },
                {
                    text: 'That is a strange thing to ask.',
                    effects: [
                        // He does not answer this, and the scene ends on it.
                        //
                        // SHELVED with the other answer's copy - see the note
                        // above. The schedule was on BOTH answers on purpose,
                        // so that the player's scepticism did not cost them
                        // the next scene; shelving one and not the other
                        // would have reintroduced exactly that, quietly, on
                        // the branch nobody tests.
                        //
                        //  {
                        //      kind: 'schedule',
                        //      conversation: 'father-q1-invoice',
                        //      afterQuarters: 1,
                        //      urgent: true,
                        //  },
                    ],
                },
            ],
        },
    ],
};
