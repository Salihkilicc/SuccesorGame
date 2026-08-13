// src/core/store/useMailStore.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '../../storage/persist';

export type MailCategory = 'Primary' | 'Updates' | 'Promotions';

export type Mail = {
    id: string;
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
        subject: 'Parking bay 1 - reallocation',
        body: 'Good morning,\n\nBay 1 has been reassigned to your name with immediate effect. The fob is at reception.\n\nWe have left the old plate in the store room rather than dispose of it. Let us know either way when you have a moment.\n\nFacilities',
        atMonth: 1,
        isRead: false,
        category: 'Updates',
    },
    {
        id: 'seed-2',
        fromName: 'Ashgrove Partners',
        fromEmail: 'coverage@ashgrovepartners.com',
        subject: 'Initiating coverage - HALE',
        body: 'Dear Mr Hale,\n\nWe are initiating coverage of Hale Industries and would welcome an introductory call at your convenience.\n\nOur preliminary note is attached. We would flag that our estimates assume no change to current production policy, which we appreciate may not survive the year.\n\nRegards,\nAshgrove Partners',
        atMonth: 1,
        isRead: false,
        category: 'Primary',
    },
    {
        id: 'seed-3',
        fromName: 'Rolodex',
        fromEmail: 'no-reply@rolodex.com',
        subject: 'You have 5 new connections waiting',
        body: 'Hi there,\n\nYou are getting noticed. Five people have asked to connect with you this week.\n\nSign in to accept them and grow your network.\n\n- The Rolodex Team',
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
                    return {
                        // Newest first
                        inbox: [newMail, ...state.inbox],
                    };
                }),
                
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
