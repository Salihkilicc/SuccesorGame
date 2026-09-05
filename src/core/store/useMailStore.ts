// src/core/store/useMailStore.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { honorific } from '../identity';
import { useIdentityStore } from './useIdentityStore';
import { zustandStorage } from '../../storage/persist';

export type MailCategory = 'Primary' | 'Updates' | 'Promotions';

export type Mail = {
    id: string;
    /**
     * WHO SENT IT, as opposed to what the sender line says.
     *
     * `fromName` is a LABEL and deliberately so - deliver.ts builds it as
     * "Nathan Vogel, CEO, Pear" because a bare name at the top of an inbox is
     * unrecognisable. That makes it useless as a key: measured, looking every
     * cast member up by their name found ZERO, because the portraits are
     * filed under cast ids ('cfo', 'coo') and the names never matched.
     *
     * So the id is carried too. Both senders already had it and both threw it
     * away, exactly as the succession did with the heir's.
     *
     * OPTIONAL: the three seeded letters come from Facilities, a bank and a
     * contacts service rather than from a person, and no save written before
     * this field has one. Absent means "not a member of the cast", which is
     * the true answer for all of them.
     */
    fromId?: string;
    fromName: string;
    fromEmail: string;
    subject: string;
    body: string;
    atMonth: number;
    isRead: boolean;
    category: MailCategory;
    /** A branching conversation instead of a plain letter. See Thread. */
    conversationId?: string;
    /**
     * A live negotiation waiting on an answer.
     *
     * Separate from `conversationId` rather than reusing it, because they are
     * answered by different machines: a conversation is static graph data the
     * audit can walk, and a negotiation is a generated letter whose two options
     * come from a store. Folding them together would mean the mail detail
     * screen guessing which kind it had.
     */
    negotiationId?: string;
    /**
     * A sponsorship offer waiting to be signed or declined.
     *
     * A third kind rather than reusing either of the other two, and for the
     * same reason they are separate from each other: they are answered by
     * different machines and the detail screen would otherwise be guessing.
     */
    sponsorOfferId?: string;
};

export type MailState = {
    inbox: Mail[];
    _hasHydrated: boolean;
};

type MailStore = MailState & {
    setHasHydrated: (v: boolean) => void;
    markRead: (mailId: string) => void;
    markAllRead: () => void;
    receiveMail: (mail: Omit<Mail, 'id' | 'isRead'>) => void;
    deleteMail: (mailId: string) => void;
    /**
     * The letter has been answered. Turn it into a record of the exchange.
     *
     * ---------------------------------------------------------------------
     *  THE BUG THIS EXISTS FOR
     * ---------------------------------------------------------------------
     *  The messages screen has done this since it was written: on finishing,
     *  it appends the transcript to the thread and detaches the conversation,
     *  so the thread reads afterwards as the conversation you had. The mail
     *  screen did neither. It called `navigation.goBack()` and left the row
     *  carrying the same `conversationId` with `sceneProgress` still holding
     *  a finished scene.
     *
     *  Two consequences, and the player reported both as one sentence -
     *  "bitmis mailler tekrar geliyor ve sadece son kismi kaliyor":
     *
     *    RE-OPENING AN ANSWERED LETTER showed the runner resuming at a null
     *    node, which renders the last exchange and a Close button. The letter
     *    you answered turns into a stub of itself.
     *
     *    AND SO DID THE NEXT COPY. Events with a `cooldown` fire again, and a
     *    second delivery of the same scene reads the same saved progress - so
     *    a letter that arrives fresh eight quarters later opens on its own
     *    ending.
     */
    closeConversation: (
        mailId: string,
        lines: { from: 'them' | 'player'; text: string }[],
    ) => void;
    reset: () => void;
};

const getInitials = (name: string): string =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

// ============================================================================
//  WHAT IS ALREADY IN THE INBOX ON DAY ONE
// ============================================================================
//
//  NO REAL COMPANIES. There were three: a Google Workspace welcome, a letter
//  from Vanguard Capital and a LinkedIn notification - all trademarks of firms
//  that exist, two of them financial, put in a game about running a company
//  badly. That is a risk nobody needs to carry for set dressing.
//
//  The replacements are invented and say the same things. The welcome is gone
//  entirely rather than renamed: a mail app explaining what a mail app is for
//  is the most skippable letter that could possibly open this game, and its
//  slot is better spent on something that says the player has a job.
// ============================================================================
const seedMail = (): Mail[] => [
    {
        id: 'seed-1',
        // The building. It is the first letter because it is the first thing
        // that treats the player as the person who now answers for the place.
        fromName: 'Facilities',
        fromEmail: 'facilities@hale.co',
        subject: 'Parking bay 1, reallocation',
        body: 'Good morning,\n\nBay 1 has been reassigned to your name with immediate effect. The fob is at reception.\n\nWe have left the old plate in the store room rather than dispose of it. Let us know either way when you have a moment.\n\nFacilities',
        atMonth: 1,
        isRead: false,
        category: 'Updates',
    },
    {
        id: 'seed-2',
        fromName: 'Ashgrove Partners',
        fromEmail: 'coverage@ashgrovepartners.com',
        subject: 'Initiating coverage, HALE',
        body: `Dear ${honorific(useIdentityStore.getState().gender)} Hale,\n\nWe are initiating coverage of Hale Industries and would welcome an introductory call at your convenience.\n\nOur preliminary note is attached. We would flag that our estimates assume no change to current production policy, which we appreciate may not survive the year.\n\nRegards,\nAshgrove Partners`,
        atMonth: 1,
        isRead: false,
        category: 'Primary',
    },
    {
        id: 'seed-3',
        fromName: 'Rolodex',
        fromEmail: 'no-reply@rolodex.com',
        subject: 'You have 5 new connections waiting',
        body: 'Hi there,\n\nYou are getting noticed. Five people have asked to connect with you this week.\n\nSign in to accept them and grow your network.\n\nThe Rolodex Team',
        atMonth: 1,
        isRead: true,
        category: 'Promotions',
    },
];

export const initialMailState: MailState = {
    inbox: seedMail(),
    _hasHydrated: false,
};

export const useMailStore = create<MailStore>()(
    persist(
        (set) => ({
            ...initialMailState,
            setHasHydrated: (v) => set({ _hasHydrated: v }),

            markRead: (mailId) =>
                set(state => ({
                    inbox: state.inbox.map(m =>
                        m.id === mailId ? { ...m, isRead: true } : m),
                })),
                
            markAllRead: () =>
                set(state => ({
                    inbox: state.inbox.map(m => ({ ...m, isRead: true })),
                })),

            receiveMail: (mailData) =>
                set(state => {
                    const newMail: Mail = {
                        ...mailData,
                        id: `mail-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        isRead: false,
                    };
                    const nextInbox = [newMail, ...state.inbox];
                    return {
                        // Newest first, capped at 80 to prevent unbounded storage bloat
                        inbox: nextInbox.length > 80 ? nextInbox.slice(0, 80) : nextInbox,
                    };
                }),
                
            // ------------------------------------------------------------------
            //  WHAT AN ANSWERED LETTER LOOKS LIKE AFTERWARDS
            // ------------------------------------------------------------------
            //  The exchange is written into the BODY, which is the only field
            //  the plain letter view renders, so an answered letter reads as
            //  the correspondence it became. The opening is already the body,
            //  so it is skipped rather than printed twice - the same reasoning
            //  useMessageStore.appendTranscript gives for skipping the first
            //  card.
            //
            //  And `conversationId` goes. It is what makes the row playable,
            //  and a letter that has been answered is not.
            // ------------------------------------------------------------------
            closeConversation: (mailId, lines) =>
                set(state => ({
                    inbox: state.inbox.map(m => {
                        if (m.id !== mailId) return m;
                        const said = lines
                            .slice(1)
                            .map(l => (l.from === 'player' ? `> ${l.text}` : l.text))
                            .join('\n\n');
                        return {
                            ...m,
                            conversationId: undefined,
                            isRead: true,
                            body: said ? `${m.body}\n\n---\n\n${said}` : m.body,
                        };
                    }),
                })),

            deleteMail: (mailId) => 
                set(state => ({
                    inbox: state.inbox.filter(m => m.id !== mailId)
                })),

            reset: () => set({ ...initialMailState, _hasHydrated: true }),
        }),
        {
            name: 'succesor_mail_v1',
            storage: createJSONStorage(() => zustandStorage),
            partialize: state => ({ inbox: state.inbox }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        },
    ),
);

/** Total unread across all mail. */
export const unreadMailCount = (inbox: Mail[]): number =>
    inbox.reduce((n, m) => n + (m.isRead ? 0 : 1), 0);
