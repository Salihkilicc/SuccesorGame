import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Dimensions,
    SafeAreaView
} from 'react-native';
import { theme } from '../../../../core/theme';
import { VacationSpot } from './data/travelData';
import BottomStatsBar from '../../../../components/common/BottomStatsBar';

type TravelHubModalProps = {
    visible: boolean;
    vacationSpots: VacationSpot[];
    onSelectSpot: (spot: VacationSpot) => void;
    onClose: () => void;
    onOpenCollection: () => void;
    onHomePress: () => void;
};

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const SPACING = 16;
const ITEM_WIDTH = (width - (SPACING * (COLUMN_COUNT + 1))) / COLUMN_COUNT;

const TravelHubModal = ({
    visible,
    vacationSpots,
    onSelectSpot,
    onClose,
    onOpenCollection,
    onHomePress
}: TravelHubModalProps) => {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
        >
            {/* Opaque Full Screen Background */}
            <View style={styles.backdrop}>
                <SafeAreaView style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable onPress={onClose} style={styles.headerButton}>
                            <Text style={styles.headerButtonText}>CLOSE</Text>
                        </Pressable>
                        <Text style={styles.headerTitle}>WORLD TRAVEL</Text>
                        <Pressable onPress={onOpenCollection} style={styles.headerButton}>
                            <Text style={styles.headerIcon}>🎒</Text>
                        </Pressable>
                    </View>

                    {/* Grid */}
                    <ScrollView contentContainerStyle={styles.gridContainer}>
                        {vacationSpots.map((spot) => (
                            <Pressable
                                key={spot.id}
                                style={[styles.card, { backgroundColor: spot.color + '20', borderColor: spot.color }]}
                                onPress={() => onSelectSpot(spot)}
                            >
                                <View style={[styles.emojiContainer, { backgroundColor: spot.color + '30' }]}>
                                    <Text style={styles.emoji}>{spot.emoji}</Text>
                                </View>

                                <View style={styles.cardFooter}>
                                    <Text style={[styles.spotName, { color: spot.color }]}>{spot.name}</Text>
                                    <Text style={styles.spotCost}>From ${spot.baseCost.toLocaleString()}</Text>
                                </View>

                                {/* Type Badge */}
                                <View style={styles.typeBadge}>
                                    <Text style={styles.typeText}>{spot.type}</Text>
                                </View>
                            </Pressable>
                        ))}
                    </ScrollView>

                    {/* Bottom Stats Bar */}
                    {/* Bottom Stats Bar */}
                    <BottomStatsBar onHomePress={onHomePress} />
                </SafeAreaView>
            </View>
        </Modal>
    );
};

export default TravelHubModal;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: '#111',
        alignItems: 'center', // Center children horizontally
    },
    container: {
        flex: 1,
        width: '100%', // Ensure safe area takes full width
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
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 2,
    },
    headerButton: {
        padding: 8,
    },
    headerButtonText: {
        color: '#666',
        fontWeight: 'bold',
        fontSize: 12,
    },
    headerIcon: {
        fontSize: 24,
    },
    gridContainer: {
        padding: SPACING,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING,
        paddingBottom: 100, // Add padding for bottom bar
    },
    card: {
        width: ITEM_WIDTH,
        height: ITEM_WIDTH * 1.1,
        borderRadius: 20,
        borderWidth: 1,
        padding: 12,
        justifyContent: 'space-between',
        overflow: 'hidden',
    },
    emojiContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        marginBottom: 8,
    },
    emoji: {
        fontSize: 48,
    },
    cardFooter: {
        // alignItems: 'center',
    },
    spotName: {
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 4,
    },
    spotCost: {
        fontSize: 12,
        color: '#999',
        fontWeight: '600',
    },
    typeBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    typeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
});
