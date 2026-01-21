import React, { useState } from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { EducationHubView } from './EducationHubView';
import { EducationClubView } from './EducationClubView';
import { EducationEnrollmentView } from './EducationEnrollmentView';
import { EducationTranscriptView } from './EducationTranscriptView';
import { EducationQuizModal } from './EducationQuizModal';
import { useEducationSystem } from './useEducationSystem';
import { usePlayerStore } from '../../../../core/store/usePlayerStore';
import { Alert } from 'react-native';

// ========================================
// TYPES
// ========================================

type EducationView = 'HUB' | 'CLUBS' | 'PROGRAMS' | 'TRANSCRIPT';

// ========================================
// COMPONENT
// ========================================

export const EducationMasterModal: React.FC = () => {
    const [activeView, setActiveView] = useState<EducationView>('HUB');
    const [enrollmentTab, setEnrollmentTab] = useState<'Certificate' | undefined>(undefined);
    const [quizVisible, setQuizVisible] = useState(false);

    const { isVisible, studyLibrary, checkExamDue, closeEducation } = useEducationSystem();
    const playerStore = usePlayerStore();

    const handleNavigate = (view: EducationView, params?: { tab?: 'Certificate' }) => {
        if (view === 'PROGRAMS' && params?.tab) {
            setEnrollmentTab(params.tab);
        } else {
            setEnrollmentTab(undefined);
        }
        setActiveView(view);
    };

    const handleBack = () => {
        setActiveView('HUB');
        setEnrollmentTab(undefined);
    };

    const handleStudy = () => {
        if (playerStore.quarterlyActions.hasStudied) {
            Alert.alert('Already Studied', 'You have already studied in the library this quarter.');
            return;
        }

        studyLibrary();
        Alert.alert('Library Study', '+3 Intellect gained from studying!');
    };

    const handleQuizComplete = (success: boolean) => {
        setQuizVisible(false);
        // Additional logic can be added here if needed
    };

    const renderView = () => {
        switch (activeView) {
            case 'HUB':
                return (
                    <EducationHubView
                        onNavigate={handleNavigate}
                        onStudy={handleStudy}
                    />
                );
            case 'CLUBS':
                return <EducationClubView onBack={handleBack} />;
            case 'PROGRAMS':
                return <EducationEnrollmentView onBack={handleBack} initialTab={enrollmentTab} />;
            case 'TRANSCRIPT':
                return <EducationTranscriptView onBack={handleBack} />;
            default:
                return null;
        }
    };

    return (
        <>
            <Modal
                visible={isVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={closeEducation}
            >
                <View style={styles.container}>
                    {renderView()}
                </View>
            </Modal>

            {/* Quiz Modal (Higher Z-Index) */}
            <EducationQuizModal
                visible={quizVisible}
                onComplete={handleQuizComplete}
            />
        </>
    );
};

// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
});
