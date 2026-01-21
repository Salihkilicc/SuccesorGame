import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Dimensions,
    SafeAreaView,
    Alert
} from 'react-native';
import { useEducationSystem } from './useEducationSystem';
import { usePlayerStore } from '../../../../core/store/usePlayerStore';
import { EXAM_QUESTIONS, MAJOR_DATA, MajorType } from './educationData';

// ========================================
// TYPES
// ========================================

interface EducationQuizModalProps {
    visible: boolean;
    onComplete: (success: boolean) => void;
}

// ========================================
// COMPONENT
// ========================================

export const EducationQuizModal: React.FC<EducationQuizModalProps> = ({ visible, onComplete }) => {
    const { activeDegree } = useEducationSystem();
    const playerStore = usePlayerStore();

    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<{
        question: string;
        options: string[];
        correctIndex: number;
    } | null>(null);

    // Pick a random question when modal opens
    useEffect(() => {
        if (visible && activeDegree) {
            const majorId = activeDegree.id as MajorType;
            const questions = EXAM_QUESTIONS[majorId];

            if (questions && questions.length > 0) {
                const randomIndex = Math.floor(Math.random() * questions.length);
                setCurrentQuestion(questions[randomIndex]);
                setSelectedOption(null);
                setHasAnswered(false);
            }
        }
    }, [visible, activeDegree]);

    if (!activeDegree || !currentQuestion) return null;

    const majorInfo = MAJOR_DATA[activeDegree.id as MajorType];

    const handleSubmit = () => {
        if (selectedOption === null || hasAnswered) return;

        setHasAnswered(true);

        const isCorrect = selectedOption === currentQuestion.correctIndex;

        if (isCorrect) {
            // Correct Answer: +10 Intellect, +3 Major Stat
            const currentIntellect = playerStore.attributes.intellect;
            playerStore.updateAttribute('intellect', currentIntellect + 10);

            const relatedStat = majorInfo.relatedStat;

            // Apply +3 to major stat
            if (['intellect', 'charm', 'strength'].includes(relatedStat)) {
                const currentValue = playerStore.attributes[relatedStat as keyof typeof playerStore.attributes];
                playerStore.updateAttribute(
                    relatedStat as keyof typeof playerStore.attributes,
                    currentValue + 3
                );
            } else if (relatedStat === 'happiness') {
                const currentValue = playerStore.core.happiness;
                playerStore.updateCore('happiness', currentValue + 3);
            } else if (relatedStat === 'businessTrust') {
                const currentValue = playerStore.reputation.business;
                playerStore.updateReputation('business', currentValue + 3);
            } else if (relatedStat === 'morality') {
                const currentValue = playerStore.personality.morality;
                playerStore.updatePersonality('morality', currentValue + 3);
            }

            Alert.alert(
                '🎓 Passed!',
                `Excellent work! You earned:\n+10 Intellect\n+3 ${relatedStat.charAt(0).toUpperCase() + relatedStat.slice(1)}`,
                [{ text: 'Continue', onPress: () => onComplete(true) }]
            );
        } else {
            // Wrong Answer: -3 Intellect
            const currentIntellect = playerStore.attributes.intellect;
            playerStore.updateAttribute('intellect', Math.max(0, currentIntellect - 3));

            Alert.alert(
                '❌ Failed!',
                'You didn\'t pass the exam.\n-3 Intellect',
                [{ text: 'Try Again Next Year', onPress: () => onComplete(false) }]
            );
        }
    };

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <SafeAreaView style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>📚 ANNUAL EXAM</Text>
                        <Text style={styles.subtitle}>{activeDegree.id}</Text>
                        <Text style={styles.yearText}>Year {Math.ceil(activeDegree.progress / 4)}</Text>
                    </View>

                    {/* Question */}
                    <View style={styles.questionContainer}>
                        <Text style={styles.questionText}>{currentQuestion.question}</Text>
                    </View>

                    {/* Options */}
                    <View style={styles.optionsContainer}>
                        {currentQuestion.options.map((option, index) => {
                            const isSelected = selectedOption === index;
                            const isCorrect = index === currentQuestion.correctIndex;
                            const showResult = hasAnswered;

                            const optionStyle = [
                                styles.optionButton,
                                isSelected && !showResult && styles.optionButtonSelected,
                                showResult && isCorrect && styles.optionButtonCorrect,
                                showResult && isSelected && !isCorrect && styles.optionButtonWrong,
                            ].filter(Boolean);

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={optionStyle}
                                    onPress={() => !hasAnswered && setSelectedOption(index)}
                                    disabled={hasAnswered}
                                >
                                    <Text style={styles.optionLetter}>{String.fromCharCode(65 + index)}.</Text>
                                    <Text style={styles.optionText}>{option}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Submit Button */}
                    {!hasAnswered && (
                        <TouchableOpacity
                            style={[styles.submitButton, selectedOption === null && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={selectedOption === null}
                        >
                            <Text style={styles.submitText}>Submit Answer</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </SafeAreaView>
        </Modal>
    );
};

// ========================================
// STYLES
// ========================================

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: width * 0.9,
        backgroundColor: '#f8f9fa',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
        borderWidth: 3,
        borderColor: '#1e3a8a',
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 2,
        borderBottomColor: '#d4af37',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        color: '#374151',
        fontWeight: '600',
        marginBottom: 4,
        textAlign: 'center',
    },
    yearText: {
        fontSize: 14,
        color: '#6b7280',
        fontStyle: 'italic',
    },
    questionContainer: {
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#d4af37',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    questionText: {
        fontSize: 18,
        color: '#1f2937',
        fontWeight: '500',
        lineHeight: 26,
        textAlign: 'center',
    },
    optionsContainer: {
        marginBottom: 20,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    optionButtonSelected: {
        borderColor: '#1e3a8a',
        backgroundColor: '#eff6ff',
    },
    optionButtonCorrect: {
        borderColor: '#10b981',
        backgroundColor: '#d1fae5',
    },
    optionButtonWrong: {
        borderColor: '#ef4444',
        backgroundColor: '#fee2e2',
    },
    optionLetter: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginRight: 12,
        width: 24,
    },
    optionText: {
        fontSize: 16,
        color: '#374151',
        flex: 1,
        lineHeight: 22,
    },
    submitButton: {
        backgroundColor: '#1e3a8a',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#d4af37',
    },
    submitButtonDisabled: {
        backgroundColor: '#9ca3af',
        borderColor: '#6b7280',
        opacity: 0.5,
    },
    submitText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
});
