import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { zustandStorage } from '../../storage/persist';

export type Note = {
    id: string;
    title: string;
    content: string;
    date: string; // ISO date string e.g. '2026-03-08'
};

type NotesState = {
    _hasHydrated: boolean;
    notes: Note[];
};

type NotesStore = NotesState & {
    setHasHydrated: (value: boolean) => void;
    addNote: (note: Note) => void;
    updateNote: (id: string, title: string, content: string) => void;
    deleteNote: (id: string) => void;
};

const initialState: NotesState = {
    _hasHydrated: false,
    notes: [],
};

export const useNotesStore = create<NotesStore>()(
    persist(
        (set) => ({
            ...initialState,
            setHasHydrated: (value) => set({ _hasHydrated: value }),
            addNote: (note) =>
                set((state) => ({ notes: [note, ...state.notes] })),
            updateNote: (id, title, content) =>
                set((state) => ({
                    notes: state.notes.map((n) =>
                        n.id === id
                            ? { ...n, title, content, date: new Date().toISOString().split('T')[0] }
                            : n,
                    ),
                })),
            deleteNote: (id) =>
                set((state) => ({
                    notes: state.notes.filter((n) => n.id !== id),
                })),
        }),
        {
            name: 'succesor_notes_v1',
            storage: createJSONStorage(() => zustandStorage),
            partialize: (state) => ({ notes: state.notes }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.setHasHydrated(true);
                }
            },
        },
    ),
);

/** Yeni oyunda bellegi sifirlamak icin disa acildi (bkz. core/newGame.ts). */
export { initialState as initialNotesState };
