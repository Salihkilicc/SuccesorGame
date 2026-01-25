import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    SafeAreaView,
} from 'react-native';
import { VACATION_SPOTS } from './data/travelData';
import BottomStatsBar from '../../../../components/common/BottomStatsBar';

type SouvenirCollectionModalProps = {
    visible: boolean;
    collectedIds: string[];
    onClose: () => void;
    onHomePress: () => void;
};

const SouvenirCollectionModal = ({
    visible,
    collectedIds,
    onClose,
    onHomePress,
}: SouvenirCollectionModalProps) => {
    const allSouvenirs = VACATION_SPOTS.map(spot => ({
        ...spot.souvenir,
        spotName: spot.name,
        spotColor: spot.color,
    }));

    const collectedCount = collectedIds.length;
    const totalCount = allSouvenirs.length;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>CLOSE</Text>
                    </Pressable>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>SOUVENIR COLLECTION</Text>
                        <Text style={styles.headerSubtitle}>
                            {collectedCount} / {totalCount} Collected
                        </Text>
                    </View>
                    <View style={styles.closeButton} />
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressBarBg}>
                        <View
                            style={[
                                styles.progressBarFill,
                                { width: `${(collectedCount / totalCount) * 100}%` }
                            ]}
                        />
                    </View>
                </View>

                {/* Grid */}
                <ScrollView contentContainerStyle={styles.gridContainer}>
                    {allSouvenirs.map((souvenir) => {
                        const isCollected = collectedIds.includes(souvenir.id);
                        return (
                            <View
                                key={souvenir.id}
                                style={[
                                    styles.card,
                                    isCollected && { borderColor: souvenir.spotColor }
                                ]}
                            >
                                <View style={[
                                    styles.emojiContainer,
                                    !isCollected && styles.locked
                                ]}>
                                    <Text style={[
                                        styles.emoji,
                                        !isCollected && styles.lockedEmoji
                                    ]}>
                                        {isCollected ? souvenir.emoji : '🔒'}
                                    </Text>
                                </View>

                                <View style={styles.cardInfo}>
                                    <Text style={[
                                        styles.souvenirName,
                                        !isCollected && styles.lockedText
                                    ]}>
                                        {isCollected ? souvenir.name : '????'}
                                    </Text>
                                    <Text style={styles.spotName}>
                                        {isCollected ? souvenir.spotName : 'Locked'}
                                    </Text>
                                    {isCollected && (
                                        <View style={[
                                            styles.rarityBadge,
                                            souvenir.rarity === 'LEGENDARY' && styles.rarityLegendary,
                                            souvenir.rarity === 'RARE' && styles.rarityRare,
                                            souvenir.rarity === 'COMMON' && styles.rarityCommon,
                                        ]}>
                                            <Text style={styles.rarityText}>{souvenir.rarity}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>


            </SafeAreaView>

            {/* Bottom Stats Bar */}
            {/* Bottom Stats Bar */}
            <BottomStatsBar onHomePress={onHomePress} />
        </Modal >
    );
};

export default SouvenirCollectionModal;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: '#111', // Solid background
        alignItems: 'center', // Center children
    },
    container: {
        flex: 1,
        width: '100%',
        backgroundColor: '#111', // Solid background
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    headerCenter: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 1,
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    closeButton: {
        padding: 8,
        width: 60,
    },
    closeButtonText: {
        color: '#666',
        fontWeight: 'bold',
        fontSize: 12,
    },
    progressContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#333',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#FFD700',
        borderRadius: 4,
    },
    gridContainer: {
        padding: 16,
        gap: 16,
        paddingBottom: 100, // Add padding for bottom bar
    },
    card: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    emojiContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#252525',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    locked: {
        opacity: 0.3,
    },
    emoji: {
        fontSize: 32,
    },
    lockedEmoji: {
        fontSize: 24,
    },
    cardInfo: {
        flex: 1,
    },
    souvenirName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    lockedText: {
        color: '#666',
    },
    spotName: {
        fontSize: 12,
        color: '#888',
        marginBottom: 8,
    },
    rarityBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
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
        fontSize: 10,
        fontWeight: '900',
        color: '#000',
        letterSpacing: 0.5,
    },
});
