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

const seedMail = (): Mail[] => [
    {
        id: 'seed-1',
        fromName: 'Google Workspace Team',
        fromEmail: 'workspace-noreply@google.com',
        subject: 'Welcome to your new professional inbox',
        body: 'Hello,\n\nWelcome to your new email account. You can use this inbox to communicate with your board, partners, and employees.\n\nKeep an eye out for important updates!\n\nBest,\nThe Team',
        atMonth: 1,
        isRead: false,
        category: 'Updates',
    },
    {
        id: 'seed-2',
        fromName: 'Vanguard Capital',
        fromEmail: 'investments@vanguard.com',
        subject: 'Q1 Investment Opportunities',
        body: 'Dear CEO,\n\nWe have identified several emerging markets that align with your company\'s growth strategy. Please find the attached preliminary analysis for the upcoming quarter.\n\nLet us schedule a call to discuss this further.\n\nRegards,\nVanguard Capital',
        atMonth: 1,
        isRead: false,
        category: 'Primary',
    },
    {
        id: 'seed-3',
        fromName: 'LinkedIn',
        fromEmail: 'messages-noreply@linkedin.com',
        subject: 'You have 5 new connections waiting',
        body: 'Hi there,\n\nYou are getting noticed! 5 people have requested to connect with you recently. Log in to your account to accept these requests and expand your network.\n\n- LinkedIn Team',
        atMonth: 1,
        isRead: true,
        category: 'Promotions',
    }
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
