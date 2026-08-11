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
