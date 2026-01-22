import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../../../../../storage/persist';
import { usePlayerStore } from '../../../../../core/store/usePlayerStore';
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
    CLUB_DATA,
    EXAM_DATA,
    ExamQuestion,
    PROGRAM_DETAILS
} from '../data/educationData';

// ========================================
// TYPES
// ========================================

export interface ActiveDegree {
    id: MajorType | MastersType | PhDType;
    type: DegreeType;
    progress: number;
    totalDuration: number;
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

    // Exam State
    isExamModalVisible: boolean;
    currentExamQuestion: ExamQuestion | null;

    // Getters
    salaryMultiplier: () => number;
    statsFromHistory: () => StatsFromHistory;
    checkExamDue: () => boolean;
    checkPrerequisites: (programKey: string, degreeType: DegreeType | 'Certificate') => { allowed: boolean; reason?: string };
    getCurrentQuarterlyCost: () => number;

    // Actions
    enroll: (id: MajorType | CertificateType | MastersType | PhDType, type: DegreeType | 'Certificate') => void;
    dropProgram: (type: 'degree' | 'certificate') => void;
    progressQuarter: () => void;
    graduate: () => void;
    resolveExam: (success: boolean) => void;
    studyLibrary: () => void;
    joinClub: (club: ClubType) => void;
    leaveClub: () => void;
    openEducation: () => void;
    closeEducation: () => void;

    // Exam Actions
    triggerExam: () => void;
    submitExam: (answerIndex: number) => void;
    closeExamModal: () => void;

    // Utility
    reset: () => void;
}

// ========================================
// HELPER FUNCTION - ROBUST STAT UPDATER
// ========================================

/**
 * Applies stat changes to the player store with fail-safe brute force updates.
 * Ensures DNA/Stats screen reflects changes immediately.
 */
const applyPlayerStat = (key: string, amount: number) => {
    const store = usePlayerStore.getState();
    console.log('[Education] Force Updating:', key, amount);

    // 1. REPUTATION LOGIC ("High Society" / "Business Trust")
    if (key === 'highSociety' || key === 'businessTrust') {
        const repoKey = key === 'highSociety' ? 'social' : 'business';
        const currentRep = store.reputation || {};
        const currentValue = currentRep[repoKey] || 0;
        const newValue = currentValue + amount;

        console.log(`[Education] Updating Reputation (${key} -> ${repoKey}): ${currentValue} -> ${newValue}`);

        // Strategy A: Dedicated Updater (Preferred)
        if (store.updateReputation) {
            store.updateReputation(repoKey, newValue);
        }
        // Strategy B: Fallback - Manual State Patch via setAll (if available)
        else if (store.setAll) {
            store.setAll({
                reputation: { ...currentRep, [repoKey]: newValue }
            });
        }
        else {
            console.warn('[Education] No method found to update reputation!');
        }
        return;
    }

    // 2. CORE ATTRIBUTES (Intellect, Charm, Strength, Looks / Health)
    if (['intellect', 'charm', 'strength', 'looks', 'health'].includes(key)) {
        if (key === 'health') {
            store.updateCore('health', (store.core.health || 0) + amount);
        } else {
            const currentVal = store.attributes[key as keyof typeof store.attributes] || 0;
            store.updateAttribute(key as any, currentVal + amount);
        }
        return;
    }

    // 3. HAPPINESS
    if (key === 'happiness') {
        store.updateCore('happiness', (store.core.happiness || 0) + amount);
        return;
    }

    // 4. MORALITY
    if (key === 'morality') {
        store.updatePersonality('morality', (store.personality.morality || 0) + amount);
        return;
    }

    // 5. DIGITAL SHIELD (Security.digital)
    if (key === 'digital') {
        const currentVal = store.security.digital || 0;
        store.updateSecurity('digital', currentVal + amount);
        console.log('[Education] Updated digital shield:', currentVal, '->', currentVal + amount);
        return;
    }

    // 6. UNKNOWN FALLBACK
    console.warn('[Education] Unknown stat type:', key);
};

// ========================================
// UTILS
// ========================================

const getMajorForProgram = (id: string, type: string): MajorType => {
    if (type === 'PhD' && id in PHD_DATA) {
        return PHD_DATA[id as PhDType].parentMajor;
    } else if (type === 'Master' && id in MASTERS_DATA) {
        return MASTERS_DATA[id as MastersType].parentMajor;
    } else {
        return id as MajorType;
    }
};

// ========================================
// INITIAL STATE
// ========================================

const initialState = {
    activeDegree: null,
    activeCertificate: null,
    completedDegrees: [],
    activeClub: null,
    isVisible: false,
    isExamModalVisible: false,
    currentExamQuestion: null,
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

                // Check for ANY degree of each type (One-time bonus per type)
                const hasUndergrad = completedDegrees.some(d => d.type === 'Undergraduate');
                const hasMaster = completedDegrees.some(d => d.type === 'Master');
                const hasPhD = completedDegrees.some(d => d.type === 'PhD');

                if (hasUndergrad) multiplier *= 2;
                if (hasMaster) multiplier *= 2;
                if (hasPhD) multiplier *= 1.5;

                return multiplier;
            },

            statsFromHistory: () => {
                const { completedDegrees } = get();
                let businessTrust = 0;
                let highSociety = 0;

                completedDegrees.forEach(degree => {
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
                const { type, progress } = activeDegree;

                // Only for degrees with yearly exams (Undergrad, Med, Law - controlled by DEGREE_DATA)
                // PhD/Masters might not have exams in config, but let's assume they might if configured.
                // However, based on DEGREE_DATA, some have hasYearlyExams: true
                const degreeInfo = DEGREE_DATA[type];
                return degreeInfo.hasYearlyExams && progress > 0 && progress % 4 === 0;
            },

            checkPrerequisites: (programKey: string, degreeType: DegreeType | 'Certificate') => {
                const { completedDegrees, activeDegree, activeCertificate } = get();

                // 1. Check Currently Active
                if (degreeType === 'Certificate') {
                    if (activeCertificate?.id === programKey) {
                        return { allowed: false, reason: "Currently Enrolled" };
                    }
                } else {
                    if (activeDegree?.id === programKey && activeDegree?.type === degreeType) {
                        return { allowed: false, reason: "Currently Enrolled" };
                    }
                }

                // 2. Check Already Completed
                const isCompleted = completedDegrees.some(d => d.id === programKey && d.type === degreeType);
                if (isCompleted) {
                    return { allowed: false, reason: "Already Completed" };
                }

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

            getCurrentQuarterlyCost: () => {
                const { activeDegree, activeCertificate } = get();
                let totalCost = 0;

                // Calculate Degree Cost per Quarter
                if (activeDegree) {
                    const { id, type, totalDuration } = activeDegree;
                    let programCost = 0;

                    if (type === 'PhD' && id in PHD_DATA) {
                        // PhD has specific cost in PHD_DATA
                        programCost = PHD_DATA[id as PhDType].cost;
                    } else if (type === 'Master' && id in MASTERS_DATA) {
                        // Master's has specific cost in MASTERS_DATA
                        programCost = MASTERS_DATA[id as MastersType].cost;
                    } else {
                        // Undergraduate uses PROGRAM_DETAILS
                        programCost = PROGRAM_DETAILS[type].cost;
                    }

                    // Divide by total quarters to get per-quarter cost
                    totalCost += programCost / totalDuration;
                }

                // Calculate Certificate Cost per Quarter
                if (activeCertificate) {
                    const { id, totalDuration } = activeCertificate;
                    const certInfo = CERTIFICATE_DATA[id];
                    const certCost = certInfo.cost;

                    // Divide by total quarters to get per-quarter cost
                    totalCost += certCost / totalDuration;
                }

                return Math.round(totalCost);
            },

            // ========================================
            // ACTIONS
            // ========================================

            enroll: (id: MajorType | CertificateType | MastersType | PhDType, type: DegreeType | 'Certificate') => {
                const { checkPrerequisites } = get();
                const { allowed, reason } = checkPrerequisites(id, type);

                if (!allowed) {
                    throw new Error(reason || 'Prerequisites not met');
                }

                let durationQuarters = 0;

                if (type === 'Certificate') {
                    const certInfo = CERTIFICATE_DATA[id as CertificateType];
                    const monthsMatch = certInfo.duration.match(/(\d+)\s+Months?/);
                    if (monthsMatch) {
                        const months = parseInt(monthsMatch[1], 10);
                        durationQuarters = Math.ceil(months / 3);
                    } else {
                        durationQuarters = 2; // default
                    }

                    set({
                        activeCertificate: {
                            id: id as CertificateType, type: 'Certificate', progress: 0, totalDuration: durationQuarters
                        }
                    });
                } else {
                    // Degree Logic
                    if (type === 'PhD') {
                        if (id in PHD_DATA) {
                            durationQuarters = PHD_DATA[id as PhDType].duration;
                        } else {
                            durationQuarters = DEGREE_DATA[type].durationQuarters;
                        }
                    } else if (type === 'Master') {
                        if (id in MASTERS_DATA) {
                            durationQuarters = DEGREE_DATA[type].durationQuarters;
                        } else {
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

            dropProgram: (type: 'degree' | 'certificate') => {
                const { Alert } = require('react-native');

                if (type === 'degree') {
                    const { activeDegree } = get();
                    if (!activeDegree) return;

                    Alert.alert(
                        '⚠️ Drop Program?',
                        'Are you sure you want to drop out? All progress will be lost and this cannot be undone.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            {
                                text: 'Drop Out',
                                style: 'destructive',
                                onPress: () => {
                                    set({ activeDegree: null });
                                    Alert.alert('Program Dropped', 'You have dropped out of your degree program.', [{ text: 'OK' }]);
                                }
                            }
                        ]
                    );
                } else {
                    const { activeCertificate } = get();
                    if (!activeCertificate) return;

                    Alert.alert(
                        '⚠️ Drop Certificate?',
                        'Are you sure you want to drop this certificate program? All progress will be lost.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            {
                                text: 'Drop',
                                style: 'destructive',
                                onPress: () => {
                                    set({ activeCertificate: null });
                                    Alert.alert('Certificate Dropped', 'You have dropped your certificate program.', [{ text: 'OK' }]);
                                }
                            }
                        ]
                    );
                }
            },

            progressQuarter: () => {
                const { activeDegree, activeCertificate, activeClub, triggerExam } = get();
                const playerStore = usePlayerStore.getState();

                console.log('[Education] progressQuarter called');
                playerStore.resetQuarterlyActions();

                // Club Buffs
                if (activeClub) {
                    const clubInfo = CLUB_DATA[activeClub];
                    applyPlayerStat(clubInfo.buffStat, clubInfo.buffAmount);
                }

                // Certificate Progress
                if (activeCertificate) {
                    const newProgress = activeCertificate.progress + 1;
                    if (newProgress >= activeCertificate.totalDuration) {
                        // Complete
                        const certInfo = CERTIFICATE_DATA[activeCertificate.id];
                        set((state) => ({
                            completedDegrees: [...state.completedDegrees, { id: activeCertificate.id, type: 'Certificate' }],
                            activeCertificate: null
                        }));
                        applyPlayerStat(certInfo.relatedStat, 5);
                        applyPlayerStat('highSociety', 0.2);
                        applyPlayerStat('businessTrust', 0.2);

                        const { Alert } = require('react-native');
                        Alert.alert('🎉 Certificate Earned!', `Congratulations! You completed: ${certInfo.label}\n\n+5 ${certInfo.relatedStat}\n+0.2 Reputation`, [{ text: 'Continue' }]);
                    } else {
                        set((state) => ({ activeCertificate: { ...state.activeCertificate!, progress: newProgress } }));
                    }
                }

                // Degree Progress
                if (activeDegree) {
                    const { id, type, progress, totalDuration } = activeDegree;
                    const newProgress = progress + 1;
                    const degreeInfo = DEGREE_DATA[type];

                    // Check for Exams (Every 4 quarters, unless graduating)
                    if (degreeInfo.hasYearlyExams && newProgress % 4 === 0 && newProgress < totalDuration) {
                        // Triggers the exam modal; stats are applied on resolveExam in success/fail
                        console.log('[Education] Yearly exam triggered');
                        triggerExam();
                        set((state) => ({ activeDegree: { ...state.activeDegree!, progress: newProgress } }));
                        return;
                    }

                    console.log('[Education] Degree progress:', type, id, newProgress, '/', totalDuration);

                    if (newProgress >= totalDuration) {
                        // Graduation
                        const majorType = getMajorForProgram(id, type);
                        const majorInfo = MAJOR_DATA[majorType];
                        const relatedStat = majorInfo.relatedStat;

                        const statBonus = type === 'PhD' ? 20 : (type === 'Master' ? 15 : 10);
                        applyPlayerStat(relatedStat, statBonus);
                        applyPlayerStat('businessTrust', 0.5);
                        applyPlayerStat('highSociety', 0.2);

                        set((state) => ({
                            completedDegrees: [...state.completedDegrees, { id, type }],
                            activeDegree: null
                        }));

                        const { Alert } = require('react-native');
                        Alert.alert(
                            '🎓 Congratulations!',
                            `You graduated!\n\n+${statBonus} ${relatedStat}\n+0.5 Business Trust\n+0.2 High Society`,
                            [{ text: 'Celebrate!' }]
                        );
                    } else {
                        set((state) => ({ activeDegree: { ...state.activeDegree!, progress: newProgress } }));
                    }
                }
            },

            triggerExam: () => {
                const { activeDegree } = get();
                if (!activeDegree) return;

                const majorType = getMajorForProgram(activeDegree.id, activeDegree.type);
                const questions = EXAM_DATA[majorType];

                if (questions && questions.length > 0) {
                    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
                    set({ isExamModalVisible: true, currentExamQuestion: randomQuestion });
                } else {
                    console.warn('[Education] No exam questions for major:', majorType);
                }
            },

            submitExam: (answerIndex: number) => {
                const { currentExamQuestion, resolveExam } = get();
                if (!currentExamQuestion) return;

                const isCorrect = answerIndex === currentExamQuestion.correctIndex;
                resolveExam(isCorrect);

                // Modal closing handled via resolveExam call side-effects or here?
                // Logic says: resolveExam applies stats. User says: "Alert result... Set isExamModalVisible = false".
                // I will do it here.

                set({ isExamModalVisible: false, currentExamQuestion: null });

                const { Alert } = require('react-native');
                if (isCorrect) {
                    Alert.alert('✅ Correct!', 'You aced the exam!\n\n+10 Intellect\n+3 Major Stat');
                } else {
                    Alert.alert('❌ Incorrect', 'You failed the exam.\n\n-3 Intellect');
                }
            },

            closeExamModal: () => {
                set({ isExamModalVisible: false, currentExamQuestion: null });
            },

            resolveExam: (success: boolean) => {
                const { activeDegree } = get();
                if (!activeDegree) return;

                const majorType = getMajorForProgram(activeDegree.id, activeDegree.type);
                const majorInfo = MAJOR_DATA[majorType];
                const relatedStat = majorInfo.relatedStat;

                if (success) {
                    console.log('[Education] Exam passed! +10 intellect, +3', relatedStat);
                    applyPlayerStat('intellect', 10);
                    applyPlayerStat(relatedStat, 3);
                } else {
                    console.log('[Education] Exam failed! -3 intellect');
                    applyPlayerStat('intellect', -3);
                }
            },

            graduate: () => {
                console.log('[Education] Graduate called - handled by progressQuarter');
            },

            studyLibrary: () => {
                const playerStore = usePlayerStore.getState();
                if (playerStore.quarterlyActions.hasStudied) {
                    const { Alert } = require('react-native');
                    Alert.alert('Already Studied', 'Come back next quarter!', [{ text: 'OK' }]);
                    return;
                }
                applyPlayerStat('intellect', 3);
                playerStore.performAction('hasStudied');
                const { Alert } = require('react-native');
                Alert.alert('📚 Study Session', '+3 Intellect', [{ text: 'Continue' }]);
            },

            joinClub: (club: ClubType) => { set({ activeClub: club }); },
            leaveClub: () => { set({ activeClub: null }); },
            openEducation: () => { set({ isVisible: true }); },
            closeEducation: () => { set({ isVisible: false }); },

            // ========================================
            // UTILITY
            // ========================================

            reset: () => set({ ...initialState }),
        }),
        {
            name: 'succesor_education_system_v2',
            storage: createJSONStorage(() => zustandStorage),
            partialize: (state) => ({
                activeDegree: state.activeDegree,
                activeCertificate: state.activeCertificate,
                completedDegrees: state.completedDegrees,
                activeClub: state.activeClub,
                isVisible: state.isVisible,
                // Do not persist exam question state usually, but ok if we do. Let's act like session state.
                // Keeping it ephemeral is safer for app updates/crashes.
            }),
        }
    )
);
