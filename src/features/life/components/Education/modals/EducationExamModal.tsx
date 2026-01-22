import React from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    Dimensions
} from 'react-native';
import { useEducationSystem } from '../store/useEducationSystem';
import { theme } from '../../../../../core/theme';

const { width } = Dimensions.get('window');

export const EducationExamModal: React.FC = () => {
    const { isExamModalVisible, currentExamQuestion, submitExam, activeDegree } = useEducationSystem();

    if (!isExamModalVisible || !currentExamQuestion) {
        return null;
    }

    return (
        <Modal
            visible={isExamModalVisible}
            transparent={true}
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={styles.cardContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerIcon}>🎓</Text>
                        <View>
                            <Text style={styles.headerTitle}>Academic Exam</Text>
                            <Text style={styles.headerSubtitle}>
                                {activeDegree?.id ? `${activeDegree.id} Finals` : 'Final Exam'}
                            </Text>
                        </View>
                    </View>

                    {/* Question Body */}
                    <View style={styles.body}>
                        <Text style={styles.questionText}>
                            {currentExamQuestion.question}
                        </Text>
                    </View>

                    {/* Options */}
                    <View style={styles.optionsContainer}>
                        {currentExamQuestion.options.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.optionButton}
                                onPress={() => submitExam(index)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.optionLetterContainer}>
                                    <Text style={styles.optionLetter}>
                                        {String.fromCharCode(65 + index)}
                                    </Text>
                                </View>
                                <Text style={styles.optionText}>{option}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Footer Warning */}
                    <Text style={styles.footerWarning}>
                        Passing ensures your academic progress and grants stat boosts.
                    </Text>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    cardContainer: {
        width: width * 0.9,
        backgroundColor: '#ffffff',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    header: {
        backgroundColor: theme.colors.primary, // Navy blue typically
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 4,
        borderBottomColor: '#FFD700', // Gold accent
    },
    headerIcon: {
        fontSize: 32,
        marginRight: 15,
    },
    headerTitle: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '500',
    },
    body: {
        padding: 24,
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    questionText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        lineHeight: 28,
        textAlign: 'center',
    },
    optionsContainer: {
        padding: 16,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    optionLetterContainer: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    optionLetter: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    optionText: {
        flex: 1,
        fontSize: 15,
        color: '#334155',
        fontWeight: '500',
    },
    footerWarning: {
        textAlign: 'center',
        fontSize: 11,
        color: '#94a3b8',
        paddingBottom: 16,
        fontStyle: 'italic',
    },
});
