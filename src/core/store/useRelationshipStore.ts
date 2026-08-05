import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NPC } from '../../features/love/types';

// ─────────────────────────────────────────────
//  Yardımcı: Rastgele aralık üreteci
// ─────────────────────────────────────────────
const randInt = (min: number, max: number): number =>
    Math.floor(Math.random() * (max - min + 1)) + min;

// ─────────────────────────────────────────────
//  Basit isim havuzları (Aşama 1 için yeterli)
// ─────────────────────────────────────────────
const FEMALE_NAMES = [
    'Emma', 'Sophia', 'Olivia', 'Ava', 'Isabella',
    'Mia', 'Amelia', 'Harper', 'Evelyn', 'Charlotte',
];

const MALE_NAMES = [
    'Liam', 'Noah', 'William', 'James', 'Oliver',
    'Benjamin', 'Elijah', 'Lucas', 'Mason', 'Logan',
];

const randomFemaleName = (): string =>
    FEMALE_NAMES[randInt(0, FEMALE_NAMES.length - 1)];

const randomMaleName = (): string =>
    MALE_NAMES[randInt(0, MALE_NAMES.length - 1)];

// ─────────────────────────────────────────────
//  Store Tipleri
// ─────────────────────────────────────────────
type RelationshipState = {
    _hasHydrated: boolean;
    contacts: NPC[];
};

type RelationshipActions = {
    setHasHydrated: (state: boolean) => void;
    addContact: (npc: NPC) => void;
    updateContact: (id: string, updates: Partial<NPC>) => void;
    removeContact: (id: string) => void;
    /**
     * Oyun başında çağrılır. Ebeveynleri rastgele oluşturup contacts'a ekler.
     * Zaten ebeveyn varsa tekrar oluşturmaz.
     */
    generateParents: () => void;
    /**
     * Her Quarter atlandığında çalışır.
     * Hayatta olan tüm NPC'lerin madeLoveThisQuarter bayrağını false yapar.
     */
    advanceQuarterForNPCs: () => void;
    /**
     * Her Yıl atlandığında (4. çeyrekten 1. çeyreğe geçerken) çalışır.
     * Hayatta olan tüm NPC'lerin yaşını 1 artırır.
     */
    ageUpNPCs: () => void;
};

type RelationshipStore = RelationshipState & RelationshipActions;

// ─────────────────────────────────────────────
//  İlk Değer
// ─────────────────────────────────────────────
const initialState: RelationshipState = {
    _hasHydrated: false,
    contacts: [],
};

// ─────────────────────────────────────────────
//  Store
// ─────────────────────────────────────────────
export const useRelationshipStore = create<RelationshipStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            setHasHydrated: (state) => set({ _hasHydrated: state }),

            addContact: (npc) =>
                set((prev) => ({ contacts: [...prev.contacts, npc] })),

            updateContact: (id, updates) =>
                set((prev) => ({
                    contacts: prev.contacts.map((c) =>
                        c.id === id ? { ...c, ...updates } : c,
                    ),
                })),

            removeContact: (id) =>
                set((prev) => ({
                    contacts: prev.contacts.filter((c) => c.id !== id),
                })),

            generateParents: () => {
                const { contacts, addContact } = get();

                const hasParents = contacts.some(
                    (c) => c.type === 'Mother' || c.type === 'Father',
                );
                if (hasParents) return; // Tekrar oluşturma

                const mother: NPC = {
                    id: `npc_mother_${Date.now()}`,
                    name: randomFemaleName(),
                    type: 'Mother',
                    age: randInt(18, 40),
                    gender: 'Female',
                    relationship: randInt(80, 100),
                    looks: randInt(30, 80),
                    smarts: randInt(30, 80),
                    isDeceased: false,
                };

                const father: NPC = {
                    id: `npc_father_${Date.now() + 1}`,
                    name: randomMaleName(),
                    type: 'Father',
                    age: randInt(18, 40),
                    gender: 'Male',
                    relationship: randInt(80, 100),
                    looks: randInt(30, 80),
                    smarts: randInt(30, 80),
                    isDeceased: false,
                };

                addContact(mother);
                addContact(father);
            },

            advanceQuarterForNPCs: () =>
                set((prev) => ({
                    contacts: prev.contacts.map((c) =>
                        c.isDeceased ? c : { ...c, madeLoveThisQuarter: false },
                    ),
                })),

            ageUpNPCs: () =>
                set((prev) => ({
                    contacts: prev.contacts.map((c) =>
                        c.isDeceased ? c : { ...c, age: c.age + 1 },
                    ),
                })),
        }),
        {
            name: 'relationship-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                contacts: state.contacts,
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.setHasHydrated(true);
                }
            },
        },
    ),
);

/** Yeni oyunda bellegi sifirlamak icin disa acildi (bkz. core/newGame.ts). */
export { initialState as initialRelationshipState };
