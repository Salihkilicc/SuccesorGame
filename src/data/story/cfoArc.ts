// src/data/story/cfoArc.ts
//
// ============================================================================
//  THE CFO — an argument that opens or closes
// ============================================================================
//
//  The one arc that both READS and MOVES its dial, and it is worth saying what
//  that means in practice, because "the relationship matters" is easy to claim
//  and usually turns out to be a number on a profile screen.
//
//  Here it decides CONTENT. Listen to him and he tells you things: what is
//  said in the board room when you are not in it, and eventually what your
//  father was paying for. Dismiss him and those scenes do not fire - not
//  softened, not summarised, they do not exist - and at the bottom he leaves.
//
//  THE COST OF NOT LISTENING IS THAT YOU NEVER FIND OUT. That is the whole
//  design. A stat penalty would have been easier and would have taught the
//  player to treat him as a resource; making the secret itself the reward
//  means the player who ignores him loses something they cannot see, which is
//  exactly what ignoring your finance director costs in life.
//
//  ---------------------------------------------------------------------------
//  WHY FLAGS STAGE IT AND THE DIAL ONLY GUARDS THE ENDS
//  ---------------------------------------------------------------------------
//  cfoTrust starts at 50, which is already the `high` band, and the bands are
//  none/low/high/extreme. So `dialAtLeast: high` is true on day one and the
//  only gates that mean anything are the two ends: `extreme` (he tells you
//  everything) and `none` (he goes). The middle of the arc is staged with
//  flags, which is what flags are for.
//
//  I could have added finer bands. That would have made every OTHER dial's
//  vocabulary worse to serve one arc, and the bands exist precisely so that
//  scenes cannot each invent their own threshold.
//
//  ---------------------------------------------------------------------------
//  WHAT THE FATHER WAS HIDING
//  ---------------------------------------------------------------------------
//  Four thousand a month to a woman in Braga, for nine years, coded to
//  consultancy. It is not a mistress - that is the first guess and it is the
//  cheap one, and it would make the father smaller.
//
//  It is the widow of the man whose patent the company was built on, bought
//  out for almost nothing in the year Hale nearly failed, and paid the
//  difference ever since in instalments too small to notice. Nobody made him.
//  She never asked. He could not say it out loud, because saying it would have
//  been admitting the original deal was theft - and he was not sure it was.
//
//  This is the load-bearing reveal of the first act, because it explains him.
//  A man who took something once and has been paying for it quietly for thirty
//  years is EXACTLY the man who assumes everybody else is doing the same, and
//  "trust nobody" stops being a personality and becomes a confession.
// ============================================================================

import type { Conversation } from '../../core/story/graph';

/** He has not walked out, and there is still a company to talk about. */
const STILL_HERE = [
    { kind: 'noFlag' as const, flag: 'cfoResigned' as const },
    { kind: 'flag' as const, flag: 'fatherDead' as const },
];

// ============================================================================
//  1. THE ROOM YOU ARE NOT IN
// ============================================================================
//  The first thing he gives you that he did not have to. Small, useless on its
//  own, and the whole point: he is testing whether telling you costs him.
// ============================================================================
export const cfoBoardRoom: Conversation = {
    id: 'cfo-board-room',
    channel: 'message',
    from: 'cfo',
    when: [
        ...STILL_HERE,
        { kind: 'quarterAtLeast', quarter: 7 },
        { kind: 'noFlag', flag: 'cfoToldBoardRoom' },
        // He does not do this for someone who has been brushing him off.
        { kind: 'dialAtLeast', dial: 'cfoTrust', band: 'high' },
    ],
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cfo',
            text: 'Something you should know, and I am aware I am not supposed to tell you.\n\nThere is a call before every board meeting. Not all of them are on it. It has been happening for six years and your father knew and never once asked to be on it.',
            choices: [
                { text: 'Why did he not stop it?', next: 'whyNot' },
                { text: 'Who is on it?', next: 'whoIsOn' },
            ],
        },

        {
            id: 'whyNot',
            speaker: 'cfo',
            text: 'Because a call you know about is worth more than one you have banned. He used to ask me what mood they arrived in and work backwards.\n\nIt is the single most useful thing he ever taught me and he taught it by accident.',
            choices: [
                { text: 'Who is on it?', next: 'whoIsOn' },
                { text: 'Then tell me what mood they arrive in.', next: 'mood' },
            ],
        },

        {
            id: 'whoIsOn',
            speaker: 'cfo',
            // He declines, again, and says why - the third time the player has
            // seen him refuse to be useful in the way that makes him worth
            // having. By now it should be reading as reliability.
            text: 'Three of them, and I am not going to name them, for the reason I gave you the first week.\n\nWhat I will do is tell you what came out of it, every time, before it reaches the agenda. That is worth more than the names and it does not cost me anything I cannot replace.',
            choices: [
                { text: 'That is a good trade.', next: 'goodTrade' },
                { text: 'I would rather have the names.', next: 'ratherNames' },
            ],
        },

        {
            id: 'ratherNames',
            speaker: 'cfo',
            text: 'I know. Everyone would.\n\nA man who gives you three names has three names to give somebody else, and you would be right to wonder about that for the next twenty years. I would rather be dull and certain.',
            choices: [
                { text: 'Then be dull.', next: 'goodTrade' },
                { text: 'Names, or do not bring me half a thing.', next: 'halfAThing' },
            ],
        },

        {
            id: 'halfAThing',
            speaker: 'cfo',
            // The refusal has a real cost and he does not sulk about it. He
            // simply stops offering, which is what closing looks like.
            text: 'Understood.\n\nThen I will bring you the agenda when it is published, like the company secretary I am.',
            choices: [
                {
                    text: '(leave it)',
                    effects: [
                        { kind: 'dial', dial: 'cfoTrust', delta: -8 },
                        { kind: 'flag', flag: 'cfoToldBoardRoom' },
                    ],
                },
            ],
        },

        {
            id: 'mood',
            speaker: 'cfo',
            text: 'Impatient, this quarter. Not hostile — impatient, which is earlier and easier to fix.\n\nThey want to hear you say a number out loud and be held to it. Any number. The size matters far less than the being held to it.',
            choices: [
                { text: 'Noted.', next: 'goodTrade' },
            ],
        },

        {
            id: 'goodTrade',
            speaker: 'cfo',
            text: 'Then that is what we will do.\n\nAnd — thank you. Your father never said yes to this arrangement. He simply started acting on what I told him, which I chose to take as agreement.',
            choices: [
                {
                    text: 'I am saying yes to it.',
                    effects: [
                        { kind: 'dial', dial: 'cfoTrust', delta: 10 },
                        { kind: 'flag', flag: 'cfoToldBoardRoom' },
                        {
                            kind: 'news',
                            headline: 'Board watchers note an unusually specific set of guidance targets from Hale.',
                        },
                    ],
                },
            ],
        },
    ],
};

// ============================================================================
//  2. THE NAME
// ============================================================================
//  Only after the board-room trade, and only if he is still being listened to.
//  He gives the name and nothing else, and he is honest that he is testing.
// ============================================================================
export const cfoBragaName: Conversation = {
    id: 'cfo-braga-name',
    channel: 'message',
    from: 'cfo',
    when: [
        ...STILL_HERE,
        { kind: 'flag', flag: 'cfoToldBoardRoom' },
        { kind: 'noFlag', flag: 'cfoToldBragaName' },
        { kind: 'dialAtLeast', dial: 'cfoTrust', band: 'high' },
    ],
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cfo',
            text: 'The Braga payment went out again on the first. It goes out on the first of every month and it has since 2016.\n\nHer name is Amália Roque. That is all I have and I have had it for nine years.',
            choices: [
                { text: 'You said you never looked.', next: 'neverLooked' },
                { text: 'What do you want me to do with a name?', next: 'whatDoIDo' },
            ],
        },

        {
            id: 'neverLooked',
            speaker: 'cfo',
            // The one crack in him, and it is the opposite of the father's -
            // he admits it immediately and it costs him nothing because he
            // has already decided what he did wrong.
            text: 'I said I never looked into her. I did not have to look to see a name on a transfer I processed every month for nine years.\n\nThat is a distinction I have made to myself a great many times and I no longer think it holds.',
            choices: [
                { text: 'It does not hold.', next: 'doesNotHold' },
                { text: 'What do you want me to do with a name?', next: 'whatDoIDo' },
            ],
        },

        {
            id: 'doesNotHold',
            speaker: 'cfo',
            text: 'No.\n\nI have been very careful for thirty-one years about the difference between not knowing and not asking. Your father relied on that. I am not sure either of us should be proud of it.',
            choices: [
                { text: 'Then let us both ask.', next: 'bothAsk' },
                { text: 'You were doing your job.', next: 'doingJob' },
            ],
        },

        {
            id: 'doingJob',
            speaker: 'cfo',
            text: 'That is the sentence I have been using. It is a very good sentence. It has kept me employed and it has kept me from finding out something I did not want to be true.',
            choices: [
                { text: 'Then let us both ask.', next: 'bothAsk' },
            ],
        },

        {
            id: 'whatDoIDo',
            speaker: 'cfo',
            text: 'Nothing, if you like. It is four thousand a month against a company this size and it will never show on any statement you are asked about.\n\nI am giving you the name because you should be the one who decides not to look, rather than not knowing there was a decision.',
            choices: [
                { text: 'Then let us both ask.', next: 'bothAsk' },
                { text: 'I am deciding not to look.', next: 'notLooking' },
            ],
        },

        {
            id: 'notLooking',
            speaker: 'cfo',
            // Refusing here is legitimate and he says so. It still closes the
            // thread, and nothing tells the player what they have declined.
            text: 'That is a real answer and I will not raise it again.\n\nI would only say: he said "not yet" to me in 2019, which means he intended there to be a yet.',
            choices: [
                {
                    text: '(leave it)',
                    effects: [
                        { kind: 'flag', flag: 'cfoToldBragaName' },
                        { kind: 'dial', dial: 'cfoTrust', delta: -4 },
                    ],
                },
                { text: 'Fine. Ask.', next: 'bothAsk' },
            ],
        },

        {
            id: 'bothAsk',
            speaker: 'cfo',
            text: 'Then I will find out properly, and I will bring you all of it at once rather than in pieces. It will take me a few weeks.\n\nOne condition, and it is for me rather than for you: whatever it is, we do not do anything about it on the day I tell you.',
            choices: [
                {
                    text: 'Agreed.',
                    effects: [
                        { kind: 'flag', flag: 'cfoToldBragaName' },
                        { kind: 'dial', dial: 'cfoTrust', delta: 8 },
                        { kind: 'schedule', conversation: 'cfo-braga-truth', afterQuarters: 2 },
                    ],
                },
            ],
        },
    ],
};

// ============================================================================
//  3. WHAT IT WAS
// ============================================================================
//  The reveal, and it recontextualises every scene the father was in.
//
//  It needs `extreme` trust, and that is the point of the arc: this is the
//  content the player buys by listening. It also arrives with a decision that
//  is genuinely open - keeping the payment costs money forever, stopping it
//  costs nothing and is legally impeccable.
// ============================================================================
export const cfoBragaTruth: Conversation = {
    id: 'cfo-braga-truth',
    channel: 'message',
    from: 'cfo',
    when: [
        ...STILL_HERE,
        { kind: 'flag', flag: 'cfoToldBragaName' },
        { kind: 'noFlag', flag: 'cfoToldBragaTruth' },
        // The one gate that is a real achievement from a start of 50.
        { kind: 'dialAtLeast', dial: 'cfoTrust', band: 'extreme' },
    ],
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cfo',
            text: 'I have it. I would rather do this badly and quickly than well and slowly.\n\nAmália Roque is the widow of Tomás Roque. In 1986 your father bought a patent from him for eleven thousand pounds. Every product this company has ever made is downstream of it.',
            choices: [
                { text: 'Eleven thousand.', next: 'elevenThousand' },
                { text: 'Was it a fair price?', next: 'fairPrice' },
            ],
        },

        {
            id: 'fairPrice',
            speaker: 'cfo',
            // The honest answer, which is worse than either clean answer.
            text: 'In 1986, for an unproven process from a man who had failed to sell it twice? It was defensible. Two lawyers would tell you it was fine and mean it.\n\nBy 1991 it was theft. Nobody committed a crime in between; the thing simply became worth something.',
            choices: [
                { text: 'And he knew that.', next: 'heKnew' },
                { text: 'Eleven thousand.', next: 'elevenThousand' },
            ],
        },

        {
            id: 'elevenThousand',
            speaker: 'cfo',
            text: 'Roque died in 1994. In 2016 your father started paying his widow four thousand a month, and he has never missed one, and he has never told her why beyond a letter I have not seen.\n\nShe has never asked. She cashes them.',
            choices: [
                { text: 'Why 2016?', next: 'why2016' },
                { text: 'And he knew.', next: 'heKnew' },
            ],
        },

        {
            id: 'why2016',
            speaker: 'cfo',
            // The detail that makes it a person rather than a plot. He was
            // frightened, and the fear was of the thing he had done.
            text: 'That is the year he had the first scare with his heart.\n\nI have thought about that a great deal and I would rather not say what I think it means, because you knew him and I only worked for him.',
            choices: [
                { text: 'Say it anyway.', next: 'sayItAnyway' },
                { text: 'And he knew.', next: 'heKnew' },
            ],
        },

        {
            id: 'sayItAnyway',
            speaker: 'cfo',
            text: 'I think he was not paying her. I think he was paying so that it would be true that he had paid.\n\nThose are not the same thing and only one of them helps her.',
            choices: [
                { text: 'That is a hard thing to say about a dead man.', next: 'hardThing' },
                { text: 'And he knew.', next: 'heKnew' },
            ],
        },

        {
            id: 'hardThing',
            speaker: 'cfo',
            text: 'It is. I liked him.\n\nI have also spent nine years processing a payment I did not understand, and I would like to have understood it while there was somebody to ask.',
            choices: [
                { text: 'What do we do now?', next: 'decision' },
            ],
        },

        {
            id: 'heKnew',
            speaker: 'cfo',
            // The line the whole first act pays off into. "Trust nobody" was
            // not a philosophy. It was a man describing himself.
            text: 'He knew exactly. That is what I keep arriving at.\n\nEvery time he told you somebody was taking three percent off the top — he was not warning you about the world. He was telling you what a person does when the opportunity is there and nobody is looking, and he had the example to hand.',
            choices: [
                { text: 'What do we do now?', next: 'decision' },
            ],
        },

        {
            id: 'decision',
            speaker: 'cfo',
            text: 'Three options and I have a view on all of them, which I will keep to myself until you have said yours.\n\nWe stop. We keep paying and say nothing, as he did. Or we tell her what it is, which is the only one of the three she has any say in.',
            choices: [
                { text: 'Keep paying. Say nothing.', next: 'keepPaying' },
                { text: 'Tell her what it is.', next: 'tellHer' },
            ],
        },

        {
            id: 'keepPaying',
            speaker: 'cfo',
            text: 'Then it goes out on the first, as it has.\n\nFor what it is worth, that is what he would have done, and it is the option that keeps her money coming and leaves her not knowing what it is for. I have not decided whether that is kindness.',
            choices: [
                {
                    text: 'Neither have I.',
                    effects: [
                        { kind: 'flag', flag: 'cfoToldBragaTruth' },
                        { kind: 'flag', flag: 'bragaKeptPaying' },
                        { kind: 'dial', dial: 'cfoTrust', delta: 5 },
                    ],
                },
                { text: 'Actually — tell her.', next: 'tellHer' },
            ],
        },

        {
            id: 'tellHer',
            speaker: 'cfo',
            // The expensive, decent option, and the game does not tell you it
            // was right. It tells you what it costs.
            text: 'Then she will have a claim, and a good one, and a lawyer will find her within a month of the letter going out.\n\nI am not arguing against it. I am telling you the invoice, because that is my job and nobody else in this building will.',
            choices: [
                {
                    text: 'Send the letter.',
                    effects: [
                        { kind: 'flag', flag: 'cfoToldBragaTruth' },
                        { kind: 'flag', flag: 'bragaStopped' },
                        { kind: 'dial', dial: 'cfoTrust', delta: 14 },
                        { kind: 'dial', dial: 'publicReputation', delta: 6 },
                        { kind: 'capital', amount: -2_500_000 },
                        {
                            kind: 'news',
                            headline: 'Hale settles a decades-old patent claim nobody had made. Lawyers call the move "unusual".',
                        },
                    ],
                },
                {
                    text: 'No. Keep paying.',
                    next: 'keepPaying',
                },
            ],
        },
    ],
};

// ============================================================================
//  4. HE LEAVES
// ============================================================================
//  The bottom of the dial. Not a threat and not a scene the player can talk
//  their way out of - by the time it fires it has been earned over many
//  quarters, and letting it be argued away would make every previous refusal
//  free in retrospect.
//
//  The cost is the arc itself: whatever he had not told you yet, he now never
//  will. Nothing on screen says so.
// ============================================================================
export const cfoResignation: Conversation = {
    id: 'cfo-resignation',
    channel: 'mail',
    from: 'cfo',
    subject: 'Notice',
    when: [
        { kind: 'noFlag', flag: 'cfoResigned' },
        { kind: 'flag', flag: 'fatherDead' },
        { kind: 'dialAtMost', dial: 'cfoTrust', band: 'none' },
    ],
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cfo',
            text:
                'I am giving three months\' notice, which is one more than my contract '
                + 'requires, and I will work all of it properly.\n\n'
                + 'This is not a negotiating position and there is nothing you can offer '
                + 'me. I would ask you not to try, because I would like us both to be able '
                + 'to remember this well.',
            choices: [
                { text: 'What did I do?', next: 'whatDidIDo' },
                { text: 'Then work your notice.', next: 'workIt' },
            ],
        },

        {
            id: 'whatDidIDo',
            speaker: 'cfo',
            // Not a list of grievances. One observation, and it is precise.
            text:
                'Nothing I could put in a letter, which is rather the problem.\n\n'
                + 'I brought you eleven things in two years. You acted on two. That is '
                + 'your prerogative entirely — but I am sixty-three, and I have worked out '
                + 'that what I am doing here is producing documents nobody reads, and I '
                + 'would like the last stretch of it to be something else.',
            choices: [
                { text: 'I should have listened.', next: 'shouldHave' },
                { text: 'Then work your notice.', next: 'workIt' },
            ],
        },

        {
            id: 'shouldHave',
            speaker: 'cfo',
            // He does not forgive and he does not gloat. He files it.
            text:
                'Perhaps. I have been wrong often enough that "he should have listened" is '
                + 'not automatically true.\n\n'
                + 'Your father listened to me about a third of the time and I thought that '
                + 'was a poor rate for eleven years. It turns out a third is very high.',
            choices: [
                { text: 'Work your notice.', next: 'workIt' },
            ],
        },

        {
            id: 'workIt',
            speaker: 'cfo',
            // THE COST, stated so precisely that the player can feel the shape
            // of what they will not get, without being told what it was.
            text:
                'I will.\n\n'
                + 'There is a folder in the second drawer of the desk that was his. It is '
                + 'not company property and I am not going to explain it. If you had asked '
                + 'me about it in the last two years I would have told you everything in '
                + 'it, and I would have been glad to.',
            choices: [
                {
                    text: '(accept the notice)',
                    effects: [
                        { kind: 'flag', flag: 'cfoResigned' },
                        { kind: 'dial', dial: 'publicReputation', delta: -5 },
                        {
                            kind: 'news',
                            headline: 'Hale\'s finance director of thirty-one years steps down. The company thanked him for his service.',
                        },
                    ],
                },
            ],
        },
    ],
};
