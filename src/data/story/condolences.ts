// src/data/story/condolences.ts
//
// ============================================================================
//  FOUR REACTIONS TO ONE DEATH, ARRIVING IN ORDER
// ============================================================================
//
//  Everyone who writes this quarter is reacting to the same two facts: the
//  father is dead, and the player did or did not tell Pear to go away in
//  public. Four people, one event, four completely different letters - which
//  is the cheapest and most reliable way to establish a cast, because the
//  reader does the comparing.
//
//  ---------------------------------------------------------------------------
//  THE ORDER IS THE POINT AND IT IS NOT DECORATIVE
//  ---------------------------------------------------------------------------
//  They are scheduled together and the inbox delivers two a quarter in the
//  order they were queued (core/story/inbox.ts). So the wave lands over two
//  quarters, and the sequence is chosen:
//
//      friend   - the only one who wants nothing. Arrives first because
//                 after that, nobody in this game writes to you for free.
//      cfo      - the letter, then the text. The gap between them IS the
//                 character: what he can put in writing, and what he cannot.
//      brother  - warm on the surface, auditing underneath.
//      board    - condolences and a demand in the same document.
//
//  Read in that order it is a slow closing of a door. Reordered, it is four
//  messages.
//
//  ---------------------------------------------------------------------------
//  THEY ALL KNOW WHAT HAPPENED WITH PEAR
//  ---------------------------------------------------------------------------
//  Selling ends the game, so these only exist on the refusal branch. But there
//  are two refusals - quiet, and loud enough to make the news - and every one
//  of these four reads differently depending on which. The gate is one flag,
//  `refusedPearPublicly`, and it is doing real work in all four: the friend is
//  proud, the CFO is frightened, the brother is doing arithmetic on his
//  fifteen percent, and the board wants to know why it read about it.
//
//  Where they do NOT know - the quiet branch - they say something else
//  entirely rather than a hedged version of the same thing. A character who
//  does not know a fact should sound like someone talking about a different
//  subject, because that is what they are doing.
// ============================================================================

import type { Conversation } from '../../core/story/graph';

/**
 * Nobody writes until there is an answer to know about.
 *
 * Selling ends the game, so in practice this means "the player told Pear no".
 * Without it the wave could queue before the offer was opened and four people
 * would be reacting to a decision that had not been made.
 */
// ---------------------------------------------------------------------------
//  THE SEVENTH QUARTER. NOT "ONCE THE PLAYER HAS ANSWERED PEAR".
// ---------------------------------------------------------------------------
//  This was `refusedPear`, and the reasoning read well: four people reacting
//  to a decision should not arrive before the decision.
//
//  It is the wrong reasoning about the wrong thing. THEY ARE NOT REACTING TO
//  THE DECISION - they are reacting to a death, and the death happened
//  whatever the player did about the letter. The friend does not mention the
//  company once. The flag was there to order two events, and a quarter number
//  orders them without making one hostage to the other.
//
//  What it cost: Pear's letter is the only thing that raises that flag, and
//  the letter had four ways to go missing. When it did, four written scenes
//  went with it and nothing anywhere said so. One condition, one act.
//
//  The `-public` variants below keep their flag, and that is a real branch:
//  refusing him in public IS a choice, and what people say about it is a
//  consequence. That is what a flag is for.
// ---------------------------------------------------------------------------
const AFTER_THE_ANSWER = [{ kind: 'quarterAtLeast' as const, quarter: 7 }];

// ============================================================================
//  1. THE FRIEND — bad at this, and the only one who is not after anything
// ============================================================================
//  Three messages where one would do, lower case, and a nickname nobody else
//  uses. He does not mention the company once. That is the whole character and
//  it is why he goes first: it is the last message this quarter with nothing
//  underneath it.
// ============================================================================
export const friendCondolence: Conversation = {
    id: 'condolence-friend',
    when: AFTER_THE_ANSWER,
    channel: 'message',
    from: 'friend',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'friend',
            // ------------------------------------------------------------------
            //  IT WAS A TURKISH PHRASE, AND IT WAS THE WRONG ONE
            // ------------------------------------------------------------------
            //  He said "geçmiş olsun", which is what you say to somebody who
            //  has been ILL. For a death it is "başın sağolsun". So the one
            //  line in the game written in another language was a
            //  mistranslation, in the condolence scene, in the message that
            //  is supposed to be the kindest thing anyone says all year.
            //
            //  It is gone rather than corrected. A single foreign phrase in
            //  an English script is a thing the translator then has to leave
            //  alone in every language, and it was carrying a joke that does
            //  not need it: the beat is a man reaching for a formula he has
            //  half-remembered and cannot check. His father's formula does
            //  that better, because the player would know it and Marco only
            //  ever heard it second-hand.
            //
            //  All three cards still work - "is that right", the wrong-on-
            //  purpose reply, and practising it on his mother for a week.
            // ------------------------------------------------------------------
            text: 'mate\n\ni just heard. i am so sorry. i do not know what you say to this, i typed about four things and deleted them\n\ni keep wanting to say the thing your dad said when anybody died. "he had a good run at it." is that right? you always said it wrong on purpose so i cannot tell any more',
            choices: [
                { text: 'It is right.', next: 'right' },
                { text: 'I said it wrong on purpose because you never noticed.', next: 'wrong' },
            ],
        },

        {
            id: 'wrong',
            speaker: 'friend',
            text: 'i noticed EVERY time\n\ni just thought you were grieving in advance or something. anyway. i noticed',
            choices: [
                { text: 'Thank you for writing.', next: 'coming' },
            ],
        },

        {
            id: 'right',
            speaker: 'friend',
            text: 'good. i have been saying it to my mum for a week to practise which she found alarming',
            choices: [
                { text: 'Thank you for writing.', next: 'coming' },
            ],
        },

        {
            id: 'coming',
            speaker: 'friend',
            // He does not offer to help with the business. He offers to sit
            // in a room, which is the only thing anybody actually wants and
            // the only thing nobody else in this cast will offer.
            text: 'i am coming down on thursday. not to talk about anything. i will bring the bad crisps you like and we can watch something stupid\n\nyou do not have to be ok on thursday either',
            choices: [
                {
                    text: 'Thursday.',
                    effects: [{ kind: 'dial', dial: 'friendLoyalty', delta: 5 }],
                },
                {
                    text: 'I might not be much company.',
                    next: 'notCompany',
                },
            ],
        },

        {
            id: 'notCompany',
            speaker: 'friend',
            text: 'i am not coming for the company\n\nthursday',
            choices: [
                {
                    text: 'Thursday.',
                    effects: [{ kind: 'dial', dial: 'friendLoyalty', delta: 6 }],
                },
            ],
        },

    ],
};

// ============================================================================
//  2a. THE CFO — the letter
// ============================================================================
//  Correct, formal, and slightly too long, because he has written it four
//  times. Everything he is actually thinking is in the next scene, and the
//  distance between the two documents is the man.
// ============================================================================
export const cfoCondolenceMail: Conversation = {
    id: 'condolence-cfo-mail',
    when: AFTER_THE_ANSWER,
    channel: 'mail',
    from: 'cfo',
    subject: 'Gerald',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cfo',
            text:
                'I have started this four times and each one read like a form, so I will '
                + 'stop trying to make it good.\n\n'
                + 'I worked for your father for thirty-one years. He was difficult, he was '
                + 'frequently wrong about people, and he never once asked me to sign '
                + 'something I did not believe. I have worked for four other men and none '
                + 'of them can say the second half of that sentence.\n\n'
                + 'The funeral arrangements are in hand and the company will cover them; '
                + 'this is normal and you do not need to think about it.',
            choices: [
                { text: 'Thirty-one years.', next: 'thirtyOne' },
                { text: 'Thank you. What do you need from me?', next: 'needFromMe' },
            ],
        },

        {
            id: 'thirtyOne',
            speaker: 'cfo',
            text:
                'Since before you were born, which he enjoyed reminding me of on the day '
                + 'you were born.\n\n'
                + 'I am telling you the number because you should know what you have '
                + 'inherited, and part of what you have inherited is me.',
            choices: [
                { text: 'What do you need from me?', next: 'needFromMe' },
            ],
        },

        {
            id: 'needFromMe',
            speaker: 'cfo',
            // The turn. It is buried in a paragraph about paperwork, which is
            // exactly where he would put it.
            text:
                'Nothing this week.\n\n'
                + 'Next week there are things I could not discuss with you while he was '
                + 'alive, because they were his to discuss and he chose not to. Some of '
                + 'them are ordinary. One or two are not, and I would rather not put them '
                + 'in an email that goes through the company server.\n\n'
                + 'I will text you.',
            choices: [
                {
                    text: 'What things?',
                    effects: [
                        {
                            kind: 'schedule',
                            conversation: 'condolence-cfo-message',
                            afterQuarters: 0,
                            urgent: true,
                        },
                    ],
                },
                {
                    text: 'Whenever you are ready.',
                    effects: [
                        { kind: 'dial', dial: 'cfoTrust', delta: 4 },
                        {
                            kind: 'schedule',
                            conversation: 'condolence-cfo-message',
                            afterQuarters: 0,
                            urgent: true,
                        },
                    ],
                },
            ],
        },
    ],
};

// ============================================================================
//  2b. THE CFO — the text, an hour later
// ============================================================================
//  Short, unpunctuated by his standards, and sent from his own phone. He says
//  almost nothing and it is the most alarming message in the wave.
// ============================================================================
export const cfoCondolenceMessage: Conversation = {
    id: 'condolence-cfo-message',
    channel: 'message',
    from: 'cfo',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cfo',
            text: 'This is my own phone. Please use this number for anything that is not company business.\n\nThere are three things. None of them are illegal. Two of them are the reason he was the way he was about the invoices.',
            choices: [
                { text: 'Tell me one of them now.', next: 'oneNow' },
                { text: 'Three things.', next: 'threeThings' },
            ],
        },

        {
            id: 'threeThings',
            speaker: 'cfo',
            text: 'Three that matter. There are perhaps nine that do not and I will bore you with those in a meeting like a normal person.',
            choices: [
                { text: 'Tell me one of them now.', next: 'oneNow' },
                { text: 'Then bore me next week.', next: 'nextWeek' },
            ],
        },

        {
            id: 'oneNow',
            speaker: 'cfo',
            // He gives one, and it is the smallest, and it is enough. A
            // named person and an amount, with no explanation - the shape of
            // a thread rather than the thread.
            text: 'Not on a phone.\n\nAll right. One. For nine years your father paid four thousand a month to a woman in Braga who has never worked for this company. He signed every transfer himself and he coded them to consultancy.\n\nI asked him once. He said "not yet". That was in 2019.',
            choices: [
                { text: 'Who is she?', next: 'whoIsShe' },
                { text: 'Next week.', next: 'nextWeek' },
            ],
        },

        {
            id: 'whoIsShe',
            speaker: 'cfo',
            text: 'I do not know. I have never looked, and I want that on the record before you decide whether I should have.\n\nHe trusted me because I did not look. I am aware that is not the same as being trustworthy.',
            choices: [
                {
                    text: 'Do not look yet.',
                    effects: [{ kind: 'dial', dial: 'cfoTrust', delta: 6 }],
                },
                {
                    text: 'Look.',
                    effects: [
                        { kind: 'dial', dial: 'cfoTrust', delta: -3 },
                        // A door for later, not a payoff now.
                        { kind: 'flag', flag: 'moleUnlocked' },
                    ],
                },
            ],
        },

        {
            id: 'nextWeek',
            speaker: 'cfo',
            text: 'Next week.\n\nAnd — for what it is worth. He was insufferable about you and I do not think he ever told you.',
            choices: [
                {
                    text: 'He never did.',
                    effects: [{ kind: 'dial', dial: 'cfoTrust', delta: 3 }],
                },
            ],
        },

    ],
};

// ============================================================================
//  3. THE BROTHER — the first contact
// ============================================================================
//  Affectionate on the surface, auditing underneath. Compliments that are
//  really questions. Sends at eleven at night.
//
//  ON THE PUBLIC BRANCH HE HAS A REAL GRIEVANCE, and that is what makes him
//  dangerous rather than merely unpleasant: he owns fifteen percent, the offer
//  was forty-eight million, and the player turned down seven point two million
//  of his money without asking him. He is not wrong to be angry. He is only
//  wrong about how he is going to handle it.
// ============================================================================
export const brotherCondolence: Conversation = {
    id: 'condolence-brother',
    when: AFTER_THE_ANSWER,
    channel: 'message',
    from: 'brother',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'brother',
            text: 'Hey. I know we have not spoken properly. I am glad you were the one there at the end, honestly — you were always better in a room than me.\n\nHow are you holding up? And how is the company holding up, because I imagine those are different answers.',
            choices: [
                { text: 'Both are fine.', next: 'bothFine' },
                { text: 'They are the same answer.', next: 'sameAnswer' },
            ],
        },

        {
            id: 'sameAnswer',
            speaker: 'brother',
            text: 'God, that is exactly what he would have said.\n\nI mean that nicely. Mostly nicely.',
            choices: [
                { text: 'What do you want, Julian?', next: 'whatDoYouWant' },
                { text: 'How are you holding up?', next: 'howAreYou' },
            ],
        },

        {
            id: 'bothFine',
            speaker: 'brother',
            // "Just asking" after something that was not a question. It is
            // in his character note and it is the tell.
            text: 'Good. Good.\n\nI only ask because I had a call from someone at Halberd on Tuesday wanting to know if the family was "reviewing its position". Tuesday. He was still warm.\n\nNot accusing you of anything. Just asking.',
            choices: [
                { text: 'You did not ask anything.', next: 'didNotAsk' },
                { text: 'What did you tell them?', next: 'whatDidYouTell' },
            ],
        },

        {
            id: 'didNotAsk',
            speaker: 'brother',
            text: 'No. I suppose I did not.\n\nFine — the question is whether I am going to find out what happens to my fifteen percent from you, or from a newspaper.',
            choices: [
                { text: 'From me.', next: 'fromMe' },
                { text: 'Nothing is happening to your fifteen percent.', next: 'nothing' },
            ],
        },

        {
            id: 'whatDidYouTell',
            speaker: 'brother',
            text: 'That the family does not have a position, because nobody has told me what it is.\n\nWhich was true, and I did not enjoy saying it.',
            choices: [
                { text: 'From now on you hear it from me.', next: 'fromMe' },
                { text: 'The family does not have a position. I do.', next: 'nothing' },
            ],
        },

        {
            id: 'howAreYou',
            speaker: 'brother',
            // The one honest answer he gives, and he ruins it himself within
            // two lines. This is the sympathetic read of him, offered once.
            text: 'Badly, since you ask. Nobody has asked.\n\nHe left me fifteen percent and a note about the boat. Four lines, and two of them were about the boat.',
            choices: [
                { text: 'I did not know about the note.', next: 'note' },
                { text: 'What do you want, Julian?', next: 'whatDoYouWant' },
            ],
        },

        {
            id: 'note',
            speaker: 'brother',
            text: 'You would not. You got the company.\n\nAnyway. I am not doing this tonight.',
            choices: [
                {
                    text: 'We should talk properly.',
                    effects: [{ kind: 'dial', dial: 'brotherTrust', delta: 6 }],
                },
            ],
        },

        {
            id: 'whatDoYouWant',
            speaker: 'brother',
            text: 'To be told things. That is the whole list.\n\nYou can keep the chair, the desk, the name over the door. I would like to stop finding out about my own family from third parties.',
            choices: [
                {
                    text: 'That is fair.',
                    effects: [{ kind: 'dial', dial: 'brotherTrust', delta: 8 }],
                },
                {
                    text: 'Then be somewhere I can tell you.',
                    effects: [{ kind: 'dial', dial: 'brotherTrust', delta: -4 }],
                },
            ],
        },

        {
            id: 'fromMe',
            speaker: 'brother',
            text: 'Good.\n\nI will hold you to that in a way you will find irritating.',
            choices: [
                {
                    text: 'I know you will.',
                    effects: [{ kind: 'dial', dial: 'brotherTrust', delta: 5 }],
                },
            ],
        },

        {
            id: 'nothing',
            speaker: 'brother',
            text: 'Right.\n\nWell. That is one of us who knows.',
            choices: [
                {
                    text: '(leave it)',
                    effects: [{ kind: 'dial', dial: 'brotherTrust', delta: -6 }],
                },
            ],
        },

    ],
};

// ============================================================================
//  4. THE BOARD — condolences and a demand, same document
// ============================================================================
//  Sent by the CFO in his other capacity, as company secretary. That is the
//  quiet cruelty of it: the man who wrote the letter about thirty-one years
//  also has to send this, and he does, because it is the job.
// ============================================================================
export const boardCondolence: Conversation = {
    id: 'condolence-board',
    when: AFTER_THE_ANSWER,
    channel: 'mail',
    from: 'cfo',
    subject: 'Board of Directors — minute 118/4 and matters arising',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cfo',
            text:
                'Circulated on behalf of the Board.\n\n'
                + '1. MINUTE 118/4. The Board records its condolences to the family of '
                + 'Gerald Hale, founder, and notes his service to the company over forty-'
                + 'one years. A minute of silence was observed.\n\n'
                + '2. MATTERS ARISING. The Board notes that the office of Chief Executive '
                + 'is now held by an individual with no prior executive record, and '
                + 'requests a written statement of intent for the coming year at the next '
                + 'ordinary meeting.',
            choices: [
                { text: 'A minute of silence and then item two.', next: 'itemTwo' },
                { text: 'They will get their statement.', next: 'statement' },
            ],
        },

        {
            id: 'itemTwo',
            speaker: 'cfo',
            // He steps out of the secretary voice for exactly one line, and
            // then back into it. That is the whole relationship.
            text: 'I typed both paragraphs. I am aware of how they read next to each other.\n\nFor what it is worth, the silence was real. Two of them cried. And then we moved to item two, because that is what a board is.',
            choices: [
                { text: 'Who asked for item two?', next: 'whoAsked' },
                { text: 'They will get their statement.', next: 'statement' },
            ],
        },

        {
            id: 'whoAsked',
            speaker: 'cfo',
            text: 'It is in the minute as "the Board". It was one person and you will work out which within about two meetings.\n\nI am not going to tell you, and I would like you to notice that I am not going to tell you, because one day you will want to know that I do not do that.',
            choices: [
                { text: 'Noted.', next: 'statement' },
            ],
        },

        {
            id: 'statement',
            speaker: 'cfo',
            text: 'Then I will minute it as agreed.\n\nOne piece of advice, unpaid and unasked for: write it yourself. They will be able to tell, and it is the only thing in that room that cannot be delegated.',
            choices: [
                {
                    text: 'I will write it myself.',
                    effects: [{ kind: 'dial', dial: 'cfoTrust', delta: 4 }],
                },
                {
                    text: 'You write it. You know what they want to hear.',
                    effects: [{ kind: 'dial', dial: 'cfoTrust', delta: -5 }],
                },
            ],
        },

    ],
};

// ============================================================================
//  THE PUBLIC BRANCH — four short follow-ups
// ============================================================================
//
//  These only exist if the refusal made the news. They are separate
//  conversations rather than extra cards inside the four above, and that is a
//  format limitation being handled honestly rather than fought:
//
//      A conversation has ONE entry point. There is no conditional `start`,
//      so a card that should only be reached when a flag is set can only be
//      reached through a gated CHOICE - which makes it something the player
//      opts into, and three of these four are things the player would rather
//      not hear.
//
//  As separate conversations with their own `when`, the inbox simply does not
//  deliver them on the quiet branch. The brother sending a second message an
//  hour after the first is also better characterisation than one long one.
//
//  Adding a conditional entry point to the graph format would be the other
//  answer, and it is probably right eventually - but it changes the shape
//  every scene is written against, and doing that to serve four scenes before
//  the pattern is proven is how a format ends up with features nobody uses.
// ============================================================================

const PUBLIC_ONLY = [{ kind: 'flag' as const, flag: 'refusedPearPublicly' as const }];

/** He is proud in an embarrassing way and it arrives as an afterthought. */
export const friendCondolencePublic: Conversation = {
    id: 'condolence-friend-public',
    channel: 'message',
    from: 'friend',
    when: [...AFTER_THE_ANSWER, ...PUBLIC_ONLY],
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'friend',
            text: 'oh also i saw the pear thing. everyone saw the pear thing\n\nnot for sale. NOT FOR SALE. i read it out to marcus in the car and he did not know who you were and i explained for ten minutes',
            choices: [
                { text: 'It is not a slogan.', next: 'notSlogan' },
                { text: 'Poor Marcus.', next: 'marcus' },
            ],
        },
        {
            id: 'marcus',
            speaker: 'friend',
            text: 'marcus is FINE. marcus asked a follow up question which is more than my own family have managed',
            choices: [
                {
                    text: 'Thursday.',
                    effects: [{ kind: 'dial', dial: 'friendLoyalty', delta: 5 }],
                },
            ],
        },
        {
            id: 'notSlogan',
            speaker: 'friend',
            // He is not being clever. He simply does not think about the
            // company at all, which is exactly why he is the only person in
            // the cast worth being pleased to hear from.
            text: 'it is a bit\n\nsorry. i know it is not a good week to be pleased about something. i was pleased though\n\nthursday',
            choices: [
                {
                    text: 'Thursday.',
                    effects: [{ kind: 'dial', dial: 'friendLoyalty', delta: 4 }],
                },
            ],
        },
    ],
};

/** The one time the CFO of thirty-one years is frightened. */
export const cfoCondolencePublic: Conversation = {
    id: 'condolence-cfo-public',
    channel: 'message',
    from: 'cfo',
    when: [...AFTER_THE_ANSWER, ...PUBLIC_ONLY],
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cfo',
            text: 'One more thing and then I will leave you alone.\n\nI have sat opposite Vogel twice. Both times the company that said no in public was bought inside four years, and both times it went for less than the first offer.',
            choices: [
                { text: 'That is two companies, not a law.', next: 'twoCompanies' },
                { text: 'What did they do wrong?', next: 'wrong' },
            ],
        },
        {
            id: 'twoCompanies',
            speaker: 'cfo',
            text: 'It is two companies. I am aware of what a sample of two is worth.\n\nI have started a file anyway. It costs nothing and I would rather be the man who kept a pointless file.',
            choices: [
                {
                    text: 'Keep the file.',
                    effects: [{ kind: 'dial', dial: 'cfoTrust', delta: 5 }],
                },
                {
                    text: 'We are not being bought.',
                    effects: [{ kind: 'dial', dial: 'cfoTrust', delta: -2 }],
                },
            ],
        },
        {
            id: 'wrong',
            speaker: 'cfo',
            // The answer is the thesis of the next fifty years, and he
            // delivers it as a procedural observation.
            text: 'Nothing, individually. They ran their companies well for three years and had one bad one.\n\nHe does not need you to fail badly. He needs you to fail once, on a quarter when he happens to be liquid.',
            choices: [
                {
                    text: 'Then we do not have a bad one.',
                    effects: [{ kind: 'dial', dial: 'cfoTrust', delta: 3 }],
                },
                {
                    text: 'Keep the file.',
                    effects: [{ kind: 'dial', dial: 'cfoTrust', delta: 6 }],
                },
            ],
        },
    ],
};

/**
 * He has done the arithmetic, he opens with it, and he is still smiling.
 *
 * HE IS NOT WRONG. Fifteen percent of forty-eight million is seven point two,
 * and the player turned it down on the day of the funeral without asking him.
 * That is what makes him dangerous rather than merely unpleasant - a grievance
 * with a number attached does not go away when the quarter improves.
 */
export const brotherCondolencePublic: Conversation = {
    id: 'condolence-brother-public',
    channel: 'message',
    from: 'brother',
    when: [...AFTER_THE_ANSWER, ...PUBLIC_ONLY],
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'brother',
            text: 'Sorry — one more and then I will let you sleep.\n\nSeven point two million. That is my fifteen percent of what you turned down, and I found out the way the man from Halberd found out.\n\nI am not angry. I want to be clear that I am not angry.',
            choices: [
                { text: 'You would have said yes.', next: 'wouldHave' },
                { text: 'You are right. I should have asked.', next: 'shouldHave' },
            ],
        },
        {
            id: 'wouldHave',
            speaker: 'brother',
            // He does not deny it. Denying it would make him a liar; not
            // denying it makes him a problem, and a problem is more use.
            text: 'Yes. I would have.\n\nThat is not the same as being wrong, and you have just told me you knew the difference and decided not to risk the conversation.',
            choices: [
                {
                    text: '(leave it)',
                    effects: [{ kind: 'dial', dial: 'brotherTrust', delta: -10 }],
                },
                {
                    text: 'I did not have time.',
                    next: 'noTime',
                },
            ],
        },
        {
            id: 'noTime',
            speaker: 'brother',
            text: 'It came in the morning and you answered it the same day. You had exactly as much time as you gave yourself.\n\nGoodnight.',
            choices: [
                {
                    text: '(leave it)',
                    effects: [{ kind: 'dial', dial: 'brotherTrust', delta: -14 }],
                },
            ],
        },
        {
            id: 'shouldHave',
            speaker: 'brother',
            text: 'Thank you.\n\nI would still have said yes, and you would still have said no, and we would have had the argument like two people instead of like this.',
            choices: [
                {
                    text: 'Next time we have the argument.',
                    effects: [{ kind: 'dial', dial: 'brotherTrust', delta: 10 }],
                },
            ],
        },
    ],
};

/** A board that finds out from the news is a board that starts counting. */
export const boardCondolencePublic: Conversation = {
    id: 'condolence-board-public',
    channel: 'mail',
    from: 'cfo',
    subject: 'Board of Directors — further matter arising',
    when: [...AFTER_THE_ANSWER, ...PUBLIC_ONLY],
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cfo',
            text:
                '3. FURTHER MATTER. The Board notes press reporting of an approach by '
                + 'Pear Inc. and the response attributed to the Chief Executive. The Board '
                + 'records that it was not consulted, and reminds the Chief Executive that '
                + 'a disposal of the whole undertaking is a matter reserved to the Board.\n\n'
                + '(This paragraph was dictated to me. I have written it exactly as given.)',
            choices: [
                { text: 'I did not dispose of anything.', next: 'didNot' },
                { text: 'Who dictated it?', next: 'whoDictated' },
            ],
        },
        {
            id: 'didNot',
            speaker: 'cfo',
            text: 'No. You declined to. The paragraph is about being told, not about the outcome, and it is correct on that point.\n\nThey will not raise it again. They will remember it.',
            choices: [
                {
                    text: 'Minute that I heard it.',
                    effects: [{ kind: 'dial', dial: 'cfoTrust', delta: 3 }],
                },
            ],
        },
        {
            id: 'whoDictated',
            speaker: 'cfo',
            // Same refusal as in the main board letter, and he says so - the
            // second time the player has seen him decline to be useful in
            // exactly the way that makes him worth having.
            text: 'The same answer as last time, and for the same reason.\n\nYou will know inside two meetings. What you will also know is that I did not tell you, which is worth more to you than the name.',
            choices: [
                {
                    text: 'Minute that I heard it.',
                    effects: [{ kind: 'dial', dial: 'cfoTrust', delta: 5 }],
                },
            ],
        },
    ],
};
