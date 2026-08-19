import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NPC } from '../../features/love/types';
import { zustandStorage } from '../../storage/persist';
import { useStoryStore } from './useStoryStore';

// ─────────────────────────────────────────────
//  Yardımcı: Rastgele aralık üreteci
// ─────────────────────────────────────────────
const randInt = (min: number, max: number): number =>
    Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * How much older a parent is than the player.
 *
 * Twenty-eight, jittered by two. It used to be `randInt(18, 40)` for the
 * parent's ABSOLUTE age, which gave a twenty-five year old player an eighteen
 * year old mother about one time in twenty.
 */
export const PARENT_AGE_GAP = 28;

/** The player's age, from the store that owns it. */
const usePlayerAge = (): number => {
    try {
        return require('./useGameStore').useGameStore.getState().age ?? 25;
    } catch {
        return 25;
    }
};

// ============================================================================
//  SHELVED: THE NAME POOLS
// ============================================================================
//
//  @orphan-ok-symbol FEMALE_NAMES
//  @orphan-ok-symbol MALE_NAMES
//
//  `generateParents` used these to invent a mother called Emma and a father
//  called Liam. The player's father is GERALD HALE. He explains the company in
//  the first quarter, he dies in the sixth, and the whole opening act is his.
//
//  So the game was inventing a second father, alive, aged somewhere between
//  eighteen and forty, while the real one was in the messages app. It is the
//  Tom-the-brother bug again and it ran at the quarterly tick of every game.
//
//  The mother is written too. She came into the plant on Saturdays and talked
//  to the machines out loud (fatherQ1), and in the fourth quarter he says she
//  "would have asked twice" - past tense, which is the script telling you she
//  is dead without stopping to say so.
//
//  The family a player has is decided by the script. This store's job is to
//  hold it, not to make it up.
//
// const FEMALE_NAMES = [ ... ];
// const MALE_NAMES = [ ... ];
// ============================================================================

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
    /** Take the father's death from the story rather than deciding it here. */
    syncFromStory: () => void;
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

            // ------------------------------------------------------------------
            //  THE FAMILY IS IN THE SCRIPT, NOT IN A NAME POOL
            // ------------------------------------------------------------------
            //  This used to roll two strangers - see the shelved pools above.
            //  Now it reads the cast, because the cast is where the answer has
            //  been all along:
            //
            //    THE FATHER is Gerald Hale, and whether he is alive is a
            //    question the story store already answers. `fatherDead` is the
            //    flag; this store does not get a second opinion about it.
            //
            //    THE MOTHER is dead before the game starts. fatherQ4: "your
            //    mother WOULD HAVE asked twice." She is not named anywhere in
            //    the script and this is not the place to name her - the phone
            //    calls the father "Your Father" for the same reason. Nobody
            //    saves a parent under their full legal name.
            //
            //    THE BROTHER is Julian Hale and owns fifteen percent of the
            //    company, which is a relationship the game already models.
            //
            //  AGES ARE DERIVED from the player's. It used to be
            //  `randInt(18, 40)` for both parents, so a twenty-five year old
            //  could have an eighteen year old mother.
            // ------------------------------------------------------------------
            generateParents: () => {
                const { contacts, addContact } = get();
                if (contacts.some(c => c.type === 'Mother' || c.type === 'Father')) return;

                const playerAge = usePlayerAge();
                const { CAST } = require('../../data/story/cast');
                const fatherDead = !!useStoryStore.getState().flags.fatherDead;

                addContact({
                    id: 'npc_mother',
                    name: 'Your Mother',
                    type: 'Mother',
                    age: playerAge + PARENT_AGE_GAP + randInt(-2, 2),
                    gender: 'Female',
                    relationship: 100,
                    looks: randInt(40, 80),
                    smarts: randInt(50, 90),
                    // The script decided this before the game opens.
                    isDeceased: true,
                });

                addContact({
                    id: 'npc_father',
                    name: CAST.father?.name ?? 'Your Father',
                    type: 'Father',
                    age: playerAge + PARENT_AGE_GAP + randInt(-2, 2),
                    gender: 'Male',
                    relationship: 100,
                    looks: randInt(40, 80),
                    smarts: randInt(60, 95),
                    isDeceased: fatherDead,
                });

                addContact({
                    id: 'npc_brother',
                    name: CAST.brother?.name ?? 'Julian Hale',
                    type: 'Sibling',
                    age: playerAge + randInt(2, 6),
                    gender: 'Male',
                    relationship: 60,
                    looks: randInt(40, 80),
                    smarts: randInt(50, 90),
                    isDeceased: false,
                });
            },

            /**
             * The father dies once, in the script, and the family tree hears.
             *
             * Called from the same tick that runs the story. Without it this
             * store would go on listing him as alive for the rest of the game,
             * which is the sort of quiet disagreement between two stores that
             * this whole migration has been about.
             */
            syncFromStory: () =>
                set(prev => {
                    const fatherDead = !!useStoryStore.getState().flags.fatherDead;
                    if (!fatherDead) return prev;
                    return {
                        contacts: prev.contacts.map(c =>
                            c.type === 'Father' && !c.isDeceased
                                ? { ...c, isDeceased: true } : c),
                    };
                }),

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
            storage: createJSONStorage(() => zustandStorage),
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
