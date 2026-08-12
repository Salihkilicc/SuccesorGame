// src/data/story/cast.ts
//
// ============================================================================
//  THE CAST
// ============================================================================
//
//  Eleven people. Each one is a name, a role, the channel they are allowed to
//  reach you on, and a note on how they talk.
//
//  The tone lines are for whoever writes the next scene, and they are the most
//  useful thing in this file. A character with no stated voice gets written as
//  whoever the author felt like that morning, and by the third scene he is
//  four different men.
//
//  ---------------------------------------------------------------------------
//  READ THE CHANNELS AS CHARACTER, NOT AS PLUMBING
//  ---------------------------------------------------------------------------
//  Mail is distance. It is written to be forwarded, it has a subject line, and
//  somebody's assistant probably typed it. Everyone who uses only mail is
//  someone who does not consider you a peer: Pear, the vulture fund, the FBI.
//
//  Messages are proximity. Your brother has your number and always has. Your
//  friend from the bad years texts in fragments. The mole texts from a number
//  with no name on it, which is its own kind of intimacy.
//
//  The two who use BOTH are the two who are inside your company and above a
//  certain rank: the CFO and your two C-levels. They file the report and then
//  they text you what the report could not say. That gap is where most of the
//  good scenes live.
// ============================================================================

import type { Cast } from '../../core/story/cast';

export const CAST: Cast = {
    // ------------------------------------------------------------------
    //  FAMILY
    // ------------------------------------------------------------------
    father: {
        id: 'father',
        name: 'Gerald Hale',
        role: 'Founder',
        // Both: he sends the formal thing and then explains it badly.
        channels: 'both',
        email: 'g.hale@hale.co',
        tone: 'Certain of everything, wrong about a third of it, and never in doubt about which third. Instructs rather than explains. Blames the market, Pear, the banks - never a decision he made. Warmth arrives sideways, in the middle of an instruction, and is gone before you can answer it.',
    },

    brother: {
        id: 'brother',
        name: 'Julian Hale',
        role: 'Shareholder · 15%',
        // Message only. He has your number and has never respected it.
        channels: 'message',
        tone: 'Affectionate on the surface, auditing underneath. Compliments that are really questions. Says "just asking" after things that were not questions. Sends at eleven at night. When he is genuinely hurt he gets shorter, not longer - that is the tell.',
    },

    // ------------------------------------------------------------------
    //  YOUR OWN PEOPLE
    // ------------------------------------------------------------------
    cfo: {
        id: 'cfo',
        name: 'Arthur Vance',
        role: 'Chief Financial Officer',
        channels: 'both',
        email: 'a.vance@hale.co',
        tone: 'Has outlived four CEOs and expects to outlive you. Gives the board position first and his own second, in that order, always. Dry to the point of seeming unbothered; the one time he is not dry, believe him. Knows what your father hid and will tell you when he decides you can hold it.',
    },

    coo: {
        id: 'coo',
        name: 'Dana Whitfield',
        role: 'Chief Operating Officer',
        channels: 'both',
        email: 'd.whitfield@hale.co',
        tone: 'Speaks for the floor and does not soften it. Short sentences, concrete nouns, numbers with units. Angry on behalf of other people rather than herself. Will tell you the line cannot do what you promised before she tells you good morning.',
    },

    cto: {
        id: 'cto',
        name: 'Priya Raman',
        role: 'Chief Technology Officer',
        channels: 'both',
        email: 'p.raman@hale.co',
        tone: 'Talks in what is possible in eighteen months, which is both her value and her blind spot. Impatient with money questions and slightly embarrassed about that. Excited in a way she tries to keep out of writing and never quite does.',
    },

    // ------------------------------------------------------------------
    //  OUTSIDE
    // ------------------------------------------------------------------
    friend: {
        id: 'friend',
        name: 'Marco Alvarez',
        role: 'CEO, Planora',
        // Message only. You came up together; letters would be an insult.
        channels: 'message',
        tone: 'Fragments, lower case, three messages where one would do. Generous with information and bad at asking for help - when he finally asks it is because it is already serious. Calls you by a nickname nobody else uses.',
    },

    pear: {
        id: 'pear',
        name: 'Nathan Vogel',
        role: 'CEO, Pear',
        // MAIL ONLY, and this is the character. He does not have your number
        // and has never wanted it. If he ever texts you, something has broken
        // in him - which is a scene worth saving for.
        channels: 'mail',
        email: 'office.vogel@pear.com',
        tone: 'Corporate to the point of contempt. Never insults you directly; the insult is the format - a template, a reference number, an assistant\'s sign-off. Uses "we" for Pear and "you" for a person. Reasonable in a way designed to make objecting look emotional.',
    },

    vulture: {
        id: 'vulture',
        name: 'Halberd Partners',
        role: 'Special Situations Fund',
        channels: 'mail',
        email: 'origination@halberd.partners',
        tone: 'Cheerful about your disaster. Frames the worst offer you will ever receive as a favour, with genuine warmth, because to them it is simply Tuesday. Never threatens - just describes your position accurately, which is worse.',
    },

    // ------------------------------------------------------------------
    //  THE ONES WHO WERE THERE FIRST
    // ------------------------------------------------------------------
    //  The largest company in each of the three markets you can walk INTO.
    //  Consumer's incumbent is Pear, who is already above - the player has
    //  been in his market since the first quarter, so his version of this
    //  letter is about share rather than entry.
    //
    //  ALL THREE ARE MAIL ONLY, and by the rule this file already states:
    //  mail is distance, and everyone who uses only mail is somebody who does
    //  not consider you a peer. That is exactly what an incumbent writing to
    //  a new entrant is. None of them should ever text you, and if the game
    //  ever wants one of them to, it will cost a `channelBreak` and a
    //  sentence explaining itself - the same as it cost Vogel.
    // ------------------------------------------------------------------
    edison: {
        id: 'edison',
        name: 'Hal Brennerman',
        role: 'Chief Executive, Edison Motors',
        channels: 'mail',
        email: 'h.brennerman@edisonmotors.com',
        tone: 'Thirty-one years in a business of dealers and service bays, and he talks like it: parts, counties, contract terms, people who answer phones at two in the morning. Never threatens - describes an arrangement that already exists and lets you work out that you are outside it. Agrees with your accusations, which is worse than denying them.',
    },

    // The Deep Tech incumbent, and she is at OpenAI-ish rather than Novidia
    // because the giant of a market is whoever holds the most of it and the
    // data says 29 against 26. A first draft had this letter coming from the
    // chip company and threatening allocation, which read well and was about
    // the wrong company - caught by the test that checks the four letters
    // against PRODUCT_MARKETS rather than against the author's memory.
    openai: {
        id: 'openai',
        name: 'Wen Zhao-Lindqvist',
        role: 'Head of Research Operations, OpenAI-ish',
        channels: 'mail',
        email: 'research-ops@openaiish.com',
        tone: 'Writes an HR email about an existential threat and does not appear to notice the difference. Short paragraphs, scheduling language, no adjectives. Sincere congratulations followed immediately by terms. Never says the word "poach" and never needs to.',
    },

    swanson: {
        id: 'swanson',
        name: 'Dr. Eleanor Ratliff',
        role: 'Chair, Category Standards Committee',
        channels: 'mail',
        email: 'chair@devicestandards.org',
        tone: 'Never threatens anything, because she does not have to - she describes a process, and every sentence of it is true, procedural and entirely outside your control. Scrupulously fair and aware of how that reads. The only antagonist in the game with nobody in her to argue with.',
    },

    // ------------------------------------------------------------------
    //  THE ONES YOU DO NOT WANT
    // ------------------------------------------------------------------
    unknown: {
        id: 'unknown',
        name: 'Unknown Number',
        role: 'No name attached',
        // Message only. A letter has a return address; that is the point.
        channels: 'message',
        tone: 'Knows more about you than the message admits. No greeting, no sign-off. Short. Every message is a door left slightly open, and never quite a threat you could report.',
    },

    hacker: {
        id: 'hacker',
        name: 'ORACLE',
        role: 'Unverified sender',
        channels: 'message',
        tone: 'Bored professionalism, like a courier reading out a delivery slot. Deadlines stated as facts. Occasional flashes of something almost friendly, which is the most frightening part.',
    },

    regulator: {
        id: 'regulator',
        name: 'Consumer Safety Directorate',
        role: 'Compliance Division',
        // Mail only, and for the same reason as the FBI: everything they send
        // is written to be read aloud somewhere else later.
        channels: 'mail',
        email: 'notices@csd.gov',
        tone: 'Neither hostile nor sympathetic - a process with letterhead. Cites the section before the finding. Deadlines are stated as dates, never as warnings, and the absence of any threat is the most alarming thing about it. Never uses the word "you" where "the undertaking" will do.',
    },

    fbi: {
        id: 'fbi',
        name: 'Field Office',
        role: 'Federal Bureau of Investigation',
        // Mail only. Everything they send is designed to be read aloud in a
        // courtroom later.
        channels: 'mail',
        email: 'no-reply@ic.fbi.gov',
        tone: 'Flat, procedural, every sentence built to be quoted back at you. Never accuses; requests, notes, and reminds. The threat is entirely in what is not written.',
    },
};

export const castMember = (id: string) => CAST[id];
