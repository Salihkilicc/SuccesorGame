import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../../../../storage/persist';
import { usePlayerStore } from '../../../../core/store/usePlayerStore';
import {
    MajorType,
    DegreeType,
    CertificateType,
    MastersType,
    PhDType,
    ClubType,
    MAJOR_DATA,
    DEGREE_DATA,
    CERTIFICATE_DATA,
    MASTERS_DATA,
    PHD_DATA,
    CLUB_DATA
} from './educationData';

// ========================================
// TYPES
// ========================================

export interface ActiveDegree {
    id: MajorType | MastersType | PhDType;
    type: DegreeType;
    progress: number; // Current quarter
    totalDuration: number; // Total quarters needed
}

export interface ActiveCertificate {
    id: CertificateType;
    type: 'Certificate';
    progress: number;
    totalDuration: number;
}

export interface CompletedDegree {
    id: MajorType | CertificateType | MastersType | PhDType;
    type: DegreeType | 'Certificate';
}

export interface StatsFromHistory {
    businessTrust: number;
    highSociety: number;
}

// ========================================
// STATE INTERFACE
// ========================================

interface EducationSystemState {
    // State
    activeDegree: ActiveDegree | null;
    activeCertificate: ActiveCertificate | null;
    completedDegrees: CompletedDegree[];
    activeClub: ClubType | null;
    isVisible: boolean;

    // Getters
    salaryMultiplier: () => number;
    statsFromHistory: () => StatsFromHistory;
    checkExamDue: () => boolean;
    checkPrerequisites: (programKey: string, degreeType: DegreeType | 'Certificate') => { allowed: boolean; reason?: string };

    // Actions
    enroll: (id: MajorType | CertificateType | MastersType | PhDType, type: DegreeType | 'Certificate') => void;
    progressQuarter: () => void;
    graduate: () => void;
    studyLibrary: () => void;
    joinClub: (club: ClubType) => void;
    leaveClub: () => void;
    openEducation: () => void;
    closeEducation: () => void;

    // Utility
    reset: () => void;
}

// ========================================
// INITIAL STATE
// ========================================

const initialState = {
    activeDegree: null,
    activeCertificate: null,
    completedDegrees: [],
    activeClub: null,
    isVisible: false,
};

// ========================================
// STORE CREATION
// ========================================

export const useEducationSystem = create<EducationSystemState>()(
    persist(
        (set, get) => ({
            ...initialState,

            // ========================================
            // GETTERS
            // ========================================

            salaryMultiplier: () => {
                const { completedDegrees } = get();
                let multiplier = 1.0;

                const hasUndergrad = completedDegrees.some(d => d.type === 'Undergraduate');
                const hasMaster = completedDegrees.some(d => d.type === 'Master');
                const phdCount = completedDegrees.filter(d => d.type === 'PhD').length;

                if (hasUndergrad) multiplier *= 2;
                if (hasMaster) multiplier *= 2;
                // Each PhD adds 1.5x multiplier
                for (let i = 0; i < phdCount; i++) {
                    multiplier *= 1.5;
                }

                return multiplier;
            },

            statsFromHistory: () => {
                const { completedDegrees } = get();
                let businessTrust = 0;
                let highSociety = 0;

                completedDegrees.forEach(degree => {
                    // Only Undergrad, Master, PhD add permanent prestige
                    if (degree.type === 'Undergraduate' || degree.type === 'Master' || degree.type === 'PhD') {
                        businessTrust += 0.5;
                        highSociety += 0.2;
                    }
                });

                return { businessTrust, highSociety };
            },

            checkExamDue: () => {
                const { activeDegree } = get();

                if (!activeDegree) return false;

                const { type, progress } = activeDegree; // Only degrees have exams

                // Exam is due if progress > 0 and divisible by 4 (yearly)
                return progress > 0 && progress % 4 === 0;
            },

            checkPrerequisites: (programKey: string, degreeType: DegreeType | 'Certificate') => {
                const { completedDegrees } = get();

                if (degreeType === 'PhD') {
                    const program = PHD_DATA[programKey as PhDType];
                    if (!program) return { allowed: true };

                    const parentMajor = program.parentMajor;
                    const hasMaster = completedDegrees.some(
                        degree => degree.type === 'Master' && degree.id === parentMajor
                    );

                    if (hasMaster) {
                        return { allowed: true };
                    } else {
                        const majorLabel = MAJOR_DATA[parentMajor].label;
                        return {
                            allowed: false,
                            reason: `Requires Master's Degree in ${majorLabel}`
                        };
                    }
                }

                if (degreeType === 'Master') {
                    const program = MASTERS_DATA[programKey as MastersType];
                    if (!program) return { allowed: true };

                    const parentMajor = program.parentMajor;
                    const hasUndergrad = completedDegrees.some(
                        degree => degree.type === 'Undergraduate' && degree.id === parentMajor
                    );

                    if (hasUndergrad) {
                        return { allowed: true };
                    } else {
                        const majorLabel = MAJOR_DATA[parentMajor].label;
                        return {
                            allowed: false,
                            reason: `Requires Bachelor's Degree in ${majorLabel}`
                        };
                    }
                }
                return { allowed: true };
            },

            // ========================================
            // ACTIONS
            // ========================================

            enroll: (id: MajorType | CertificateType | MastersType | PhDType, type: DegreeType | 'Certificate') => {
                // Check prerequisites
                const { allowed, reason } = get().checkPrerequisites(id, type);
                if (!allowed) {
                    throw new Error(reason || 'Prerequisites not met');
                }

                let durationQuarters = 0;

                if (type === 'Certificate') {
                    // Convert "X Months" to quarters (approx 3 months = 1 quarter)
                    const certInfo = CERTIFICATE_DATA[id as CertificateType];
                    // Simple parsing logic: '3 Months' -> 1, '4 Months' -> 2, '6 Months' -> 2
                    if (certInfo.duration.includes('3 Months')) durationQuarters = 1;
                    else if (certInfo.duration.includes('4 Months')) durationQuarters = 2;
                    else if (certInfo.duration.includes('6 Months')) durationQuarters = 2;
                    else durationQuarters = 1; // Default

                    set({
                        activeCertificate: {
                            id: id as CertificateType,
                            type: 'Certificate',
                            progress: 0,
                            totalDuration: durationQuarters
                        }
                    });
                } else {
                    // Degree Logic
                    if (type === 'PhD') {
                        // PhD programs
                        if (id in PHD_DATA) {
                            durationQuarters = PHD_DATA[id as PhDType].duration;
                        } else {
                            durationQuarters = DEGREE_DATA[type].durationQuarters;
                        }
                    } else if (type === 'Master') {
                        // Check if it's a specific Master's program
                        if (id in MASTERS_DATA) {
                            durationQuarters = DEGREE_DATA[type].durationQuarters;
                        } else {
                            // Generic Master's (fallback)
                            durationQuarters = DEGREE_DATA[type].durationQuarters;
                        }
                    } else {
                        durationQuarters = DEGREE_DATA[type].durationQuarters;
                    }

                    set({
                        activeDegree: {
                            id: id as MajorType | MastersType | PhDType,
                            type: type as DegreeType,
                            progress: 0,
                            totalDuration: durationQuarters
                        }
                    });
                }
            },

            progressQuarter: () => {
                const { activeDegree, activeCertificate, activeClub } = get();
                const playerStore = usePlayerStore.getState();

                // ========================================
                // 1. RESET QUARTERLY FLAGS
                // ========================================
                playerStore.resetQuarterlyActions();

                // ========================================
                // 2. APPLY PASSIVE CLUB BUFFS
                // ========================================
                if (activeClub) {
                    const clubInfo = CLUB_DATA[activeClub];
                    const buffStat = clubInfo.buffStat;
                    const buffAmount = clubInfo.buffAmount;

                    if (['intellect', 'charm', 'strength', 'looks', 'health'].includes(buffStat)) {
                        const current = playerStore.attributes[buffStat as keyof typeof playerStore.attributes] || 0;
                        playerStore.updateAttribute(buffStat as any, current + buffAmount);
                    } else if (buffStat === 'happiness') {
                        playerStore.updateCore('happiness', playerStore.core.happiness + buffAmount);
                    } else if (buffStat === 'businessTrust') {
                        playerStore.updateReputation('business', playerStore.reputation.business + buffAmount);
                    } else if (buffStat === 'highSociety') {
                        playerStore.updateReputation('social', playerStore.reputation.social + buffAmount);
                    } else if (buffStat === 'morality') {
                        playerStore.updatePersonality('morality', playerStore.personality.morality + buffAmount);
                    }
                }

                // ========================================
                // 3. ADVANCE CERTIFICATE PROGRESS
                // ========================================
                if (activeCertificate) {
                    const newProgress = activeCertificate.progress + 1;

                    if (newProgress >= activeCertificate.totalDuration) {
                        // CERTIFICATE COMPLETED
                        const certInfo = CERTIFICATE_DATA[activeCertificate.id];

                        // Move to history
                        set((state) => ({
                            completedDegrees: [...state.completedDegrees, {
                                id: activeCertificate.id,
                                type: 'Certificate'
                            }],
                            activeCertificate: null
                        }));

                        // Apply stat bonus (+5)
                        const relatedStat = certInfo.relatedStat;
                        if (['intellect', 'charm', 'strength', 'health'].includes(relatedStat)) {
                            const current = playerStore.attributes[relatedStat as keyof typeof playerStore.attributes];
                            playerStore.updateAttribute(relatedStat as any, current + 5);
                        } else if (relatedStat === 'happiness') {
                            playerStore.updateCore('happiness', playerStore.core.happiness + 5);
                        } else if (relatedStat === 'businessTrust') {
                            playerStore.updateReputation('business', playerStore.reputation.business + 5);
                        } else if (relatedStat === 'highSociety') {
                            playerStore.updateReputation('social', playerStore.reputation.social + 5);
                        } else if (relatedStat === 'morality') {
                            playerStore.updatePersonality('morality', playerStore.personality.morality + 5);
                        }

                        // Permanent Prestige Bonuses
                        playerStore.updateReputation('social', playerStore.reputation.social + 0.2);
                        playerStore.updateReputation('business', playerStore.reputation.business + 0.2);

                        // Show completion notification
                        const { Alert } = require('react-native');
                        Alert.alert(
                            '🎉 Certificate Earned!',
                            `Congratulations! You completed: ${certInfo.label}\n\n+5 ${relatedStat.charAt(0).toUpperCase() + relatedStat.slice(1)}\n+0.2 High Society\n+0.2 Business Trust`,
                            [{ text: 'Continue' }]
                        );
                    } else {
                        // Just advance progress
                        set((state) => ({
                            activeCertificate: { ...state.activeCertificate!, progress: newProgress }
                        }));
                    }
                }

                // ========================================
                // 4. ADVANCE DEGREE PROGRESS
                // ========================================
                if (activeDegree) {
                    const { id, type, progress, totalDuration } = activeDegree;
                    const newProgress = progress + 1;

                    // Check for GRADUATION
                    if (newProgress >= totalDuration) {
                        // DEGREE COMPLETED - AUTO GRADUATE
                        let relatedStat = 'intellect';
                        if (type === 'PhD' && id in PHD_DATA) {
                            relatedStat = MAJOR_DATA[PHD_DATA[id as PhDType].parentMajor].relatedStat;
                        } else if (type === 'Master' && id in MASTERS_DATA) {
                            relatedStat = MAJOR_DATA[MASTERS_DATA[id as MastersType].parentMajor].relatedStat;
                        } else {
                            // Undergraduate
                            relatedStat = MAJOR_DATA[id as MajorType].relatedStat;
                        }

                        // Graduation stat bonus
                        const statBonus = type === 'PhD' ? 20 : (type === 'Master' ? 15 : 10);

                        if (['intellect', 'charm', 'strength', 'health'].includes(relatedStat)) {
                            const val = playerStore.attributes[relatedStat as keyof typeof playerStore.attributes];
                            playerStore.updateAttribute(relatedStat as any, val + statBonus);
                        } else if (relatedStat === 'happiness') {
                            playerStore.updateCore('happiness', playerStore.core.happiness + statBonus);
                        } else if (relatedStat === 'businessTrust') {
                            playerStore.updateReputation('business', playerStore.reputation.business + statBonus);
                        } else if (relatedStat === 'highSociety') {
                            playerStore.updateReputation('social', playerStore.reputation.social + statBonus);
                        } else if (relatedStat === 'morality') {
                            playerStore.updatePersonality('morality', playerStore.personality.morality + statBonus);
                        }

                        // Prestige bonuses
                        playerStore.updateReputation('business', playerStore.reputation.business + 0.5);
                        playerStore.updateReputation('social', playerStore.reputation.social + 0.2);

                        // Move to history
                        set((state) => ({
                            completedDegrees: [...state.completedDegrees, { id, type }],
                            activeDegree: null
                        }));

                        // Get degree label for notification
                        let degreeLabel = '';
                        if (type === 'PhD' && id in PHD_DATA) {
                            degreeLabel = PHD_DATA[id as PhDType].label;
                        } else if (type === 'Master' && id in MASTERS_DATA) {
                            degreeLabel = MASTERS_DATA[id as MastersType].label;
                        } else {
                            degreeLabel = MAJOR_DATA[id as MajorType].label;
                        }

                        // Show graduation notification
                        const { Alert } = require('react-native');
                        Alert.alert(
                            '🎓 Congratulations!',
                            `You graduated from ${degreeLabel} (${type})!\n\n+${statBonus} ${relatedStat.charAt(0).toUpperCase() + relatedStat.slice(1)}\n+0.5 Business Trust\n+0.2 High Society`,
                            [{ text: 'Celebrate!' }]
                        );
                    } else {
                        // Not graduating yet - check for yearly boost
                        const degreeInfo = DEGREE_DATA[type];
                        if (degreeInfo.hasYearlyExams && newProgress % 4 === 0) {
                            // Apply +5 yearly boost
                            let relatedStat = 'intellect';
                            if (type === 'Master' && id in MASTERS_DATA) {
                                const masterInfo = MASTERS_DATA[id as MastersType];
                                relatedStat = MAJOR_DATA[masterInfo.parentMajor].relatedStat;
                            } else {
                                const majorInfo = MAJOR_DATA[id as MajorType];
                                relatedStat = majorInfo.relatedStat;
                            }

                            if (['intellect', 'charm', 'strength', 'health'].includes(relatedStat)) {
                                const val = playerStore.attributes[relatedStat as keyof typeof playerStore.attributes];
                                playerStore.updateAttribute(relatedStat as any, val + 5);
                            } else if (relatedStat === 'happiness') {
                                playerStore.updateCore('happiness', playerStore.core.happiness + 5);
                            } else if (relatedStat === 'businessTrust') {
                                playerStore.updateReputation('business', playerStore.reputation.business + 5);
                            } else if (relatedStat === 'highSociety') {
                                playerStore.updateReputation('social', playerStore.reputation.social + 5);
                            } else if (relatedStat === 'morality') {
                                playerStore.updatePersonality('morality', playerStore.personality.morality + 5);
                            }
                        }

                        // Just advance progress
                        set((state) => ({
                            activeDegree: { ...state.activeDegree!, progress: newProgress }
                        }));
                    }
                }
            },

            graduate: () => {
                const { activeDegree } = get();
                if (!activeDegree) return;

                const { id, type, progress, totalDuration } = activeDegree;
                if (progress < totalDuration) return;

                const playerStore = usePlayerStore.getState();

                let relatedStat = 'intellect';
                if (type === 'Master' && id in MASTERS_DATA) {
                    relatedStat = MAJOR_DATA[MASTERS_DATA[id as MastersType].parentMajor].relatedStat;
                } else {
                    relatedStat = MAJOR_DATA[id as MajorType].relatedStat;
                }

                const statBonus = (type === 'Master' || type === 'PhD') ? 15 : 10;

                if (['intellect', 'charm', 'strength', 'health'].includes(relatedStat)) {
                    const val = playerStore.attributes[relatedStat as keyof typeof playerStore.attributes];
                    playerStore.updateAttribute(relatedStat as any, val + statBonus);
                } else if (relatedStat === 'happiness') {
                    playerStore.updateCore('happiness', playerStore.core.happiness + statBonus);
                } else if (relatedStat === 'businessTrust') {
                    playerStore.updateReputation('business', playerStore.reputation.business + statBonus);
                } else if (relatedStat === 'highSociety') {
                    playerStore.updateReputation('social', playerStore.reputation.social + statBonus);
                } else if (relatedStat === 'morality') {
                    playerStore.updatePersonality('morality', playerStore.personality.morality + statBonus);
                }

                playerStore.updateReputation('business', playerStore.reputation.business + 0.5);
                playerStore.updateReputation('social', playerStore.reputation.social + 0.2);

                set((state) => ({
                    completedDegrees: [...state.completedDegrees, { id, type }],
                    activeDegree: null
                }));
            },

            studyLibrary: () => {
                const playerStore = usePlayerStore.getState();

                // Check if already studied this quarter
                if (playerStore.quarterlyActions.hasStudied) {
                    return; // Already studied this quarter
                }

                // Apply +3 Intellect
                const currentIntellect = playerStore.attributes.intellect;
                playerStore.updateAttribute('intellect', currentIntellect + 3);

                // Mark as studied
                playerStore.performAction('hasStudied');
            },

            joinClub: (club: ClubType) => {
                set({ activeClub: club });
            },

            leaveClub: () => {
                set({ activeClub: null });
            },

            openEducation: () => {
                set({ isVisible: true });
            },

            closeEducation: () => {
                set({ isVisible: false });
            },

            // ========================================
            // UTILITY
            // ========================================

            reset: () => set({ ...initialState }),
        }),
        {
            name: 'succesor_education_system_v1',
            storage: createJSONStorage(() => zustandStorage),
            partialize: (state) => ({
                activeDegree: state.activeDegree,
                activeCertificate: state.activeCertificate,
                completedDegrees: state.completedDegrees,
                activeClub: state.activeClub,
                isVisible: state.isVisible,
            }),
        }
    )
);
