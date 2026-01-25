import React, { useMemo } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Pressable,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import { theme } from '../../../../core/theme';
import { VacationSpot, TravelClass } from './data/travelData';
import BottomStatsBar from '../../../../components/common/BottomStatsBar';

type TravelBookingModalProps = {
    visible: boolean;
    spot: VacationSpot | null;
    travelClass: TravelClass;
    bringPartner: boolean;
    onSelectClass: (cls: TravelClass) => void;
    onTogglePartner: (value: boolean) => void;
    onConfirm: () => void;
    onClose: () => void;
    onHomePress: () => void;
};

const TravelBookingModal = ({
    visible,
    spot,
    travelClass,
    bringPartner,
    onSelectClass,
    onTogglePartner,
    onConfirm,
    onClose,
    onHomePress,
}: TravelBookingModalProps) => {
    if (!spot) return null;

    const totalCost = useMemo(() => {
        let multiplier = 1;
        if (travelClass === 'BUSINESS') multiplier = 2;
        if (travelClass === 'PRIVATE') multiplier = 5;

        const partnerMult = bringPartner ? 2 : 1;

        return spot.baseCost * multiplier * partnerMult;
    }, [spot, travelClass, bringPartner]);

    const renderClassOption = (cls: TravelClass, title: string, subtitle: string, multiplier: string) => {
        const isSelected = travelClass === cls;
        return (
            <Pressable
                style={[
                    styles.classOption,
                    isSelected && { borderColor: spot.color, backgroundColor: spot.color + '10' }
                ]}
                onPress={() => onSelectClass(cls)}
            >
                <View style={[styles.radio, isSelected && { borderColor: spot.color }]}>
                    {isSelected && <View style={[styles.radioInner, { backgroundColor: spot.color }]} />}
                </View>
                <View style={styles.classInfo}>
                    <Text style={[styles.classTitle, isSelected && { color: spot.color }]}>{title}</Text>
                    <Text style={styles.classSubtitle}>{subtitle}</Text>
                </View>
                <View style={styles.costBadge}>
                    <Text style={styles.multiplierText}>{multiplier}</Text>
                </View>
            </Pressable>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.backdrop}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={[styles.header, { backgroundColor: spot.color }]}>
                        <View style={styles.headerContent}>
                            <View style={styles.headerTop}>
                                <Text style={styles.airlineText}>AIR SUCCESOR</Text>
                                <Text style={styles.headerIcon}>✈️</Text>
                            </View>
                            <View style={styles.destRow}>
                                <Text style={styles.destCode}>HUB</Text>
                                <View style={styles.flightLine}>
                                    <View style={styles.dot} />
                                    <View style={styles.line} />
                                    <View style={styles.planeIcon}><Text style={{ fontSize: 12 }}>✈</Text></View>
                                    <View style={styles.line} />
                                    <View style={styles.dot} />
                                </View>
                                <Text style={styles.destCode}>{spot.id.substring(0, 3).toUpperCase()}</Text>
                            </View>
                            <Text style={styles.spotName}>{spot.name}</Text>
                        </View>

                        {/* Perforated Edge */}
                        <View style={styles.perforation}>
                            {Array(20).fill(0).map((_, i) => (
                                <View key={i} style={styles.hole} />
                            ))}
                        </View>
                    </View>

                    <ScrollView style={styles.content}>
                        <Text style={styles.sectionTitle}>SELECT CLASS</Text>

                        {renderClassOption('ECONOMY', 'Economy Class', 'Standard seating. Possible delays.', 'x1')}
                        {renderClassOption('BUSINESS', 'Business Class', 'Comfortable. Safe & On time.', 'x2')}
                        {renderClassOption('PRIVATE', 'Private Jet', 'Luxury. Max Enjoyment.', 'x5')}

                        <Text style={styles.sectionTitle}>COMPANION</Text>
                        <Pressable
                            style={[
                                styles.partnerToggle,
                                bringPartner && { borderColor: spot.color, backgroundColor: spot.color + '10' }
                            ]}
                            onPress={() => onTogglePartner(!bringPartner)}
                        >
                            <Text style={[styles.partnerText, bringPartner && { color: spot.color }]}>
                                {bringPartner ? 'Traveling with Partner (x2 Cost)' : 'Traveling Solo'}
                            </Text>
                            <View style={[
                                styles.toggle,
                                bringPartner && { backgroundColor: spot.color }
                            ]}>
                                <View style={[
                                    styles.toggleKnob,
                                    bringPartner && { alignSelf: 'flex-end' }
                                ]} />
                            </View>
                        </Pressable>

                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <View>
                            <Text style={styles.totalLabel}>TOTAL FARE</Text>
                            <Text style={styles.totalCost}>${totalCost.toLocaleString()}</Text>
                        </View>
                        <Pressable
                            style={[styles.bookButton, { backgroundColor: spot.color }]}
                            onPress={onConfirm}
                        >
                            <Text style={styles.bookButtonText}>BOARD NOW</Text>
                        </Pressable>
                    </View>

                    <Pressable style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeText}>CANCEL FLIGHT</Text>
                    </Pressable>
                </View>
                {/* Bottom Stats Bar */}
                <BottomStatsBar onHomePress={onHomePress} />
            </View>
        </Modal>
    );
};

export default TravelBookingModal;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: '#000', // Solid black background instead of transparent
        justifyContent: 'center',
        alignItems: 'center', // Center children
        padding: 20,
        paddingTop: 80, // Added extra top padding to lower the modal
        paddingBottom: 100, // Add space for bottom bar
    },
    container: {
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        overflow: 'hidden',
        maxHeight: '85%',
        width: '100%', // Ensure content fits
    },
    header: {
        padding: 24,
        paddingBottom: 40,
        position: 'relative',
    },
    headerContent: {
        gap: 12,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        opacity: 0.8,
    },
    airlineText: {
        fontWeight: '900',
        color: '#000',
        letterSpacing: 2,
        fontSize: 12,
    },
    headerIcon: {
        fontSize: 20,
    },
    destRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 12,
    },
    destCode: {
        fontSize: 32,
        fontWeight: '900',
        color: '#000',
    },
    flightLine: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    line: {
        flex: 1,
        height: 2,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#000',
    },
    planeIcon: {
        marginHorizontal: 8,
        transform: [{ rotate: '90deg' }]
    },
    spotName: {
        fontSize: 18,
        color: '#000',
        fontWeight: '600',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    perforation: {
        position: 'absolute',
        bottom: -10,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        overflow: 'hidden',
    },
    hole: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#1a1a1a',
        marginBottom: -10,
    },
    content: {
        padding: 24,
    },
    sectionTitle: {
        color: '#666',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 12,
        marginTop: 8,
    },
    classOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#252525',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#666',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    classInfo: {
        flex: 1,
    },
    classTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    classSubtitle: {
        color: '#888',
        fontSize: 12,
    },
    costBadge: {
        backgroundColor: '#333',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    multiplierText: {
        color: '#ccc',
        fontSize: 12,
        fontWeight: 'bold',
    },
    partnerToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#252525',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: 24,
    },
    partnerText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    toggle: {
        width: 48,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#444',
        padding: 2,
        justifyContent: 'center',
    },
    toggleKnob: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#333',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    totalLabel: {
        color: '#666',
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    totalCost: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '900',
    },
    bookButton: {
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 30,
    },
    bookButtonText: {
        color: '#000',
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 1,
    },
    closeButton: {
        alignItems: 'center',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#222',
        backgroundColor: '#151515',
    },
    closeText: {
        color: '#666',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
});
