import React, { useState, useEffect, useMemo } from 'react';
import { t, useLocale } from '../../../../core/i18n';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Pressable,
    Dimensions,
    Animated,
} from 'react-native';
import { theme } from '../../../../core/theme';
import { HookupScenario, HookupStrategy } from './data/hookupGameData';
import { Partner } from '../../../love/types';

type HookupGameModalProps = {
    visible: boolean;
    scenario: HookupScenario | null;
    partner: Partner | null;
    onSuccess: () => void;
    onFail: () => void;
};

const { width } = Dimensions.get('window');

type ShuffledOption = {
    strategy: HookupStrategy;
    text: string;
    icon: string;
};

const HookupGameModal = ({
    visible,
    scenario,
    partner,
    onSuccess,
    onFail,
}: HookupGameModalProps) => {
    useLocale();
    const [selectedStrategy, setSelectedStrategy] = useState<HookupStrategy | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const fadeAnim = useState(new Animated.Value(0))[0];

    // Shuffle options on scenario change
    const shuffledOptions = useMemo<ShuffledOption[]>(() => {
        if (!scenario) return [];

        const options: ShuffledOption[] = [
            { strategy: 'CHARISMA', text: scenario.options.charisma, icon: '💬' },
            { strategy: 'MONEY', text: scenario.options.money, icon: '💸' },
            { strategy: 'FAME', text: scenario.options.fame, icon: '⭐' },
        ];

        // Fisher-Yates shuffle
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }

        return options;
    }, [scenario]);

    useEffect(() => {
        if (visible) {
            setSelectedStrategy(null);
            setShowResult(false);
            setIsCorrect(false);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            fadeAnim.setValue(0);
        }
    }, [visible, scenario]);

    const handleChoice = (strategy: HookupStrategy) => {
        if (showResult || !scenario) return;

        setSelectedStrategy(strategy);
        const correct = strategy === scenario.correctStrategy;
        setIsCorrect(correct);
        setShowResult(true);

        // Delay before closing
        setTimeout(() => {
            if (correct) {
                onSuccess();
            } else {
                onFail();
            }
        }, 1500);
    };

    if (!visible || !scenario || !partner) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={() => { }}>
            <View style={styles.backdrop}>
                <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
                    <PartnerHeader partner={partner} />

                    <ClueSection text={scenario.clue} />

                    <View style={styles.choicesSection}>
                        <Text style={styles.choicesLabel}>{t('life.yourMove')}</Text>
                        {shuffledOptions.map((option, index) => (
                            <OptionButton
                                key={index}
                                option={option}
                                isSelected={selectedStrategy === option.strategy}
                                showResult={showResult}
                                isCorrectResult={showResult && option.strategy === scenario.correctStrategy}
                                isCorrectGuess={isCorrect}
                                onPress={() => handleChoice(option.strategy)}
                            />
                        ))}
                    </View>

                    {showResult && <ResultFeedback isCorrect={isCorrect} />}
                </Animated.View>
            </View>
        </Modal>
    );
};

const PartnerHeader = ({ partner }: { partner: Partner }) => (
    <View style={styles.partnerSection}>
        <View style={styles.partnerAvatar}>
            <Text style={styles.avatarEmoji}>
                {partner.gender === 'female' ? '💃' : '🕺'}
            </Text>
        </View>
        <Text style={styles.partnerName}>{partner.name}</Text>
        <Text style={styles.partnerJob}>{partner.job.title}</Text>
    </View>
);

const ClueSection = ({ text }: { text: string }) => (
    <View style={styles.clueSection}>
        <Text style={styles.clueLabel}>{t('life.theSituation')}</Text>
        <View style={styles.clueBox}>
            <Text style={styles.clueText}>{text}</Text>
        </View>
    </View>
);

type OptionButtonProps = {
    option: ShuffledOption;
    isSelected: boolean;
    showResult: boolean;
    isCorrectResult: boolean;
    isCorrectGuess: boolean;
    onPress: () => void;
};

const OptionButton = ({
    option,
    isSelected,
    showResult,
    isCorrectResult,
    isCorrectGuess,
    onPress
}: OptionButtonProps) => {
    const isWrongChoice = showResult && isSelected && !isCorrectGuess;

    return (
        <Pressable
            onPress={onPress}
            disabled={showResult}
            style={({ pressed }) => [
                styles.choiceButton,
                pressed && !showResult && styles.choiceButtonPressed,
                isCorrectResult && styles.choiceButtonCorrect,
                isWrongChoice && styles.choiceButtonWrong,
            ]}>
            <View style={styles.choiceContent}>
                <Text style={styles.choiceText}>{option.text}</Text>
                <View style={styles.choiceTag}>
                    <Text style={styles.choiceTagText}>
                        {option.icon} {option.strategy}
                    </Text>
                </View>
            </View>
        </Pressable>
    );
};

const ResultFeedback = ({ isCorrect }: { isCorrect: boolean }) => (
    <View style={styles.resultSection}>
        <Text style={[styles.resultText, isCorrect ? styles.resultSuccess : styles.resultFail]}>
            {isCorrect ? '✨ Perfect Match!' : '❌ She wasn\'t impressed...'}
        </Text>
    </View>
);

export default HookupGameModal;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: '#31241F',
    },
    card: {
        flex: 1,
        width: '100%',
        backgroundColor: '#31241F',
        padding: 24,
        paddingTop: 48,
        borderTopWidth: 2,
        borderColor: '#5992C6',
    },
    partnerSection: {
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#5992C6',
    },
    partnerAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#31241F',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#5992C6',
        marginBottom: 12,
    },
    avatarEmoji: {
        fontSize: 40,
    },
    partnerName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    partnerJob: {
        fontSize: 14,
        color: '#5992C6',
        fontStyle: 'italic',
    },
    clueSection: {
        marginBottom: 24,
    },
    clueLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#5992C6',
        letterSpacing: 2,
        marginBottom: 8,
    },
    clueBox: {
        backgroundColor: '#31241F',
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#5992C6',
    },
    clueText: {
        fontSize: 16,
        color: '#FFFFFF',
        lineHeight: 24,
        fontStyle: 'italic',
    },
    choicesSection: {
        marginBottom: 16,
    },
    choicesLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#5992C6',
        letterSpacing: 2,
        marginBottom: 12,
    },
    choiceButton: {
        backgroundColor: '#31241F',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#5992C6',
    },
    choiceButtonPressed: {
        backgroundColor: '#31241F',
        transform: [{ scale: 0.98 }],
    },
    choiceButtonCorrect: {
        borderColor: '#5992C6',
        backgroundColor: '#31241F',
    },
    choiceButtonWrong: {
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: '#31241F',
    },
    choiceContent: {
        gap: 8,
    },
    choiceText: {
        fontSize: 15,
        color: '#FFFFFF',
        lineHeight: 22,
    },
    choiceTag: {
        alignSelf: 'flex-start',
        backgroundColor: '#31241F',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    choiceTagText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#5992C6',
        letterSpacing: 1,
    },
    resultSection: {
        marginTop: 8,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    resultText: {
        fontSize: 18,
        fontWeight: '800',
        textAlign: 'center',
    },
    resultSuccess: {
        color: '#5992C6',
    },
    resultFail: {
        color: '#E9B8C9',
    },
});
