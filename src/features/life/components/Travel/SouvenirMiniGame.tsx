import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Pressable,
    Animated,
} from 'react-native';
import { Souvenir } from './data/travelData';
import BottomStatsBar from '../../../../components/common/BottomStatsBar';

type SouvenirMiniGameProps = {
    visible: boolean;
    souvenir: Souvenir | null;
    onComplete: (success: boolean) => void;
    onHomePress: () => void;
};

const BOXES = Array.from({ length: 12 }, (_, i) => i);

const SouvenirMiniGame = ({ visible, souvenir, onComplete, onHomePress }: SouvenirMiniGameProps) => {
    const [selectedBox, setSelectedBox] = useState<number | null>(null);
    const [winningBox] = useState(Math.floor(Math.random() * 12));
    const [showResult, setShowResult] = useState(false);
    const [scaleAnims] = useState(BOXES.map(() => new Animated.Value(1)));

    const handleBoxPress = (index: number) => {
        if (selectedBox !== null) return;

        setSelectedBox(index);

        // Animate the selected box
        Animated.sequence([
            Animated.timing(scaleAnims[index], {
                toValue: 1.1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnims[index], {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setShowResult(true);
            setTimeout(() => {
                const success = index === winningBox;
                onComplete(success);
                // Reset for next time
                setSelectedBox(null);
                setShowResult(false);
            }, 2000);
        });
    };

    if (!visible || !souvenir) return null;

    const isWin = selectedBox === winningBox;

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            onRequestClose={() => { }}
        >
            <View style={styles.backdrop}>
                <View style={styles.container}>
                    <Text style={styles.title}>LOCAL MARKET</Text>
                    <Text style={styles.subtitle}>
                        {!showResult
                            ? 'Pick a suitcase. One contains a rare souvenir!'
                            : isWin
                                ? `You found: ${souvenir.emoji} ${souvenir.name}!`
                                : 'Just a tourist magnet... Better luck next time!'
                        }
                    </Text>

                    {!showResult ? (
                        <View style={styles.boxGrid}>
                            {BOXES.map((index) => (
                                <Animated.View
                                    key={index}
                                    style={[
                                        styles.boxWrapper,
                                        { transform: [{ scale: scaleAnims[index] }] }
                                    ]}
                                >
                                    <Pressable
                                        style={[
                                            styles.box,
                                            selectedBox === index && styles.boxSelected
                                        ]}
                                        onPress={() => handleBoxPress(index)}
                                        disabled={selectedBox !== null}
                                    >
                                        <Text style={styles.boxIcon}>💼</Text>
                                    </Pressable>
                                </Animated.View>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.resultContainer}>
                            {isWin ? (
                                <>
                                    <Text style={styles.resultEmoji}>{souvenir.emoji}</Text>
                                    <Text style={styles.resultTitle}>{souvenir.name}</Text>
                                    <Text style={styles.resultDescription}>{souvenir.description}</Text>
                                    <View style={[
                                        styles.rarityBadge,
                                        souvenir.rarity === 'LEGENDARY' && styles.rarityLegendary,
                                        souvenir.rarity === 'RARE' && styles.rarityRare,
                                        souvenir.rarity === 'COMMON' && styles.rarityCommon,
                                    ]}>
                                        <Text style={styles.rarityText}>{souvenir.rarity}</Text>
                                    </View>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.resultEmoji}>🧲</Text>
                                    <Text style={styles.resultTitle}>Tourist Magnet</Text>
                                    <Text style={styles.resultDescription}>Maybe next trip...</Text>
                                </>
                            )}
                        </View>
                    )}
                </View>

                {/* Bottom Stats Bar */}
                <BottomStatsBar onHomePress={onHomePress} />
            </View>
        </Modal>
    );
};

export default SouvenirMiniGame;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: '#000', // Solid black
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 100, // Add padding for bottom bar
    },
    container: {
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        padding: 24, // Reduced padding
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 2,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    boxGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10, // Reduced gap
        width: '100%',
    },
    boxWrapper: {
        width: '30%', // 3 per row (approx)
    },
    box: {
        aspectRatio: 1,
        backgroundColor: '#252525',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    boxSelected: {
        borderColor: '#FFD700',
        backgroundColor: '#2a2a1a',
    },
    boxIcon: {
        fontSize: 24, // Smaller icon
    },
    resultContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    resultEmoji: {
        fontSize: 80,
        marginBottom: 16,
    },
    resultTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    resultDescription: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginBottom: 16,
    },
    rarityBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 8,
    },
    rarityLegendary: {
        backgroundColor: '#FFD700',
    },
    rarityRare: {
        backgroundColor: '#9370DB',
    },
    rarityCommon: {
        backgroundColor: '#708090',
    },
    rarityText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#000',
        letterSpacing: 1,
    },
});
