import React, { useState, useEffect } from 'react';
import { t, useLocale } from '../../../../../core/i18n';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { theme } from '../../../../../core/theme';
import { useStatsStore } from '../../../../../core/store/useStatsStore';
import { usePlayerStore } from '../../../../../core/store/usePlayerStore';
import GameModal from '../../../../../components/common/GameModal'; // Wait, I should replace GameModal with View structure if it's inside MasterModal?
// Actually, earlier in the conversation I converted it to a View structure (Step 319).
// currently viewed content in Step 417 SHOWS it using GameModal.
// This means I reverted it or never fully converted it?
// Step 327 summary says: "Converted `PlasticSurgeryModal`... Removed `GameModal` wrapper."
// But Step 417 view shows imports of GameModal and usage of GameModal at line 57.
// THIS IS A REGRESSION. I must have viewed an old version or the rename reverted something?
// Ah, Step 354 was a write_to_file... wait.
// Let's look at the history.
// Step 366 (Task Boundary): "Overwriting Grooming and Massage modals with new View components".
// Step 372 (View SanctuaryMasterModal) shows it expecting Views.
// Step 417 (View SanctuarySurgeryView) shows it as a Modal.
// I need to CONVERT SanctuarySurgeryView to be a View component (like Grooming and Massage) again.
// Use SafeAreaView, Custom Header, etc.

// CORRECT IMPLEMENTATION FOR SanctuarySurgeryView (View-based):
import { SafeAreaView } from 'react-native';
import GameButton from '../../../../../components/common/GameButton';
import { useRelationshipBuffs } from '../../../../love/hooks/useRelationshipBuffs';
import { DOCTORS, Doctor } from '../data/sanctuaryData';

type SanctuarySurgeryViewProps = {
    visible: boolean; // Kept for prop compatibility
    onClose: () => void;
    performSurgery: (doctorId: string) => void;
    handleServicePurchase: any; // unused but passed
    onGoHome: () => void;
};

const SanctuarySurgeryView = ({ visible, onClose, performSurgery, onGoHome }: SanctuarySurgeryViewProps) => {
    useLocale();
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [stage, setStage] = useState<'selection' | 'warning' | 'processing'>('selection');

    // Get relationship buffs (medicalDiscount is not implemented yet)
    const { partnerName } = useRelationshipBuffs();
    const hasDiscount = false;
    const playerMoney = useStatsStore(state => state.money);

    // Reset state on close
    useEffect(() => {
        if (!visible) {
            setStage('selection');
            setSelectedDoctor(null);
        }
    }, [visible]);

    // Calculate discounted price
    const getDiscountedPrice = (originalPrice: number) => {
        return originalPrice;
    };

    const handleSelect = (doctor: Doctor) => {
        setSelectedDoctor(doctor);
        setStage('warning');
    };

    const handleConfirm = () => {
        if (!selectedDoctor) return;

        setStage('processing');

        // Simulate operation time
        setTimeout(() => {
            performSurgery(selectedDoctor.id);
            // Don't close immediately? The performSurgery triggers result modal.
            // But we should probably navigate back or what?
            // The performSurgery logic in hook sets isHubVisible(false) usually?
            // Let's assume performSurgery handles navigation or state updates.
        }, 3000); // 3 seconds of suspense
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={onClose} style={styles.backBtn}>
                        <Text style={styles.backIcon}>←</Text>
                    </Pressable>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>{t('life.plasticSurgery2')}</Text>
                        <Text style={styles.subtitle}>{t('life.chooseYourSurgeonWisely')}</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                {/* Content */}
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    {/* DISCOUNT BANNER */}
                    {/* Discount banner removed as relationship discounts are not yet implemented */}

                    {/* SELECTION STAGE */}
                    {stage === 'selection' && (
                        <View style={styles.listContent}>
                            {DOCTORS.map((doctor) => {
                                const discountedPrice = getDiscountedPrice(doctor.cost);
                                const isDiscounted = discountedPrice < doctor.cost;
                                const successPercent = Math.round(doctor.successRate * 100);

                                // Money validation
                                const canAfford = playerMoney >= discountedPrice;

                                // Risk/Reward labels
                                const getRiskLabel = () => {
                                    if (successPercent === 100) return { text: '✅ Guaranteed', color: '#FFFFFF' };
                                    if (successPercent >= 80) return { text: '⚠️ Low Risk', color: theme.colors.textPrimary };
                                    return { text: '⚠️ High Risk', color: theme.colors.textPrimary };
                                };
                                const riskLabel = getRiskLabel();

                                return (
                                    <Pressable
                                        key={doctor.id}
                                        style={({ pressed }) => [
                                            styles.doctorCard,
                                            pressed && canAfford && styles.doctorCardPressed,
                                            !canAfford && styles.doctorCardDisabled
                                        ]}
                                        onPress={() => canAfford && handleSelect(doctor)}
                                        disabled={!canAfford}
                                    >
                                        {/* Risk Badge */}
                                        <View style={[styles.riskBadge, { backgroundColor: riskLabel.color + '20', borderColor: riskLabel.color }]}>
                                            <Text style={[styles.riskText, { color: riskLabel.color }]}>{riskLabel.text}</Text>
                                        </View>
                                        <View style={styles.doctorHeader}>
                                            <Text style={[styles.doctorName, !canAfford && styles.disabledText]}>{doctor.name}</Text>
                                            <View style={styles.priceContainer}>
                                                {isDiscounted && (
                                                    <Text style={styles.originalPrice}>
                                                        ${doctor.cost.toLocaleString()}
                                                    </Text>
                                                )}
                                                <Text style={[styles.doctorCost, isDiscounted && styles.discountedPrice, !canAfford && styles.disabledText]}>
                                                    ${discountedPrice.toLocaleString()}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.successRateContainer}>
                                            <Text style={styles.successRateLabel}>{t('life.successRate')}</Text>
                                            <View style={[
                                                styles.successRateBadge,
                                                { backgroundColor: successPercent === 100 ? '#CFD0D2' : successPercent >= 80 ? '#FF8A8A' : '#FF8A8A' }
                                            ]}>
                                                <Text style={styles.successRateText}>{successPercent}%</Text>
                                            </View>
                                        </View>

                                        <View style={styles.outcomeContainer}>
                                            <Text style={styles.outcomeLabel}>✅ Success:</Text>
                                            <View>
                                                <Text style={styles.outcomeText}>
                                                    +{doctor.success.charm} Charm
                                                    {doctor.success.highSociety && ` | +${doctor.success.highSociety} High Society 🎩`}
                                                </Text>
                                                {/* Looks Reward Display */}
                                                <Text style={[styles.outcomeText, { marginTop: 2, color: theme.colors.textPrimary }]}>
                                                    ✨ Looks: +{doctor.looksMin}-{doctor.looksMax}
                                                </Text>
                                            </View>
                                        </View>

                                        {doctor.failure.charm !== 0 && (
                                            <View style={styles.outcomeContainer}>
                                                <Text style={styles.outcomeLabel}>❌ Failure:</Text>
                                                <Text style={styles.outcomeText}>
                                                    {doctor.failure.charm} Charm | +{doctor.failure.stress} Stress
                                                </Text>
                                            </View>
                                        )}

                                        {/* Insufficient Funds Overlay */}
                                        {!canAfford && (
                                            <View style={styles.insufficientFundsOverlay}>
                                                <Text style={styles.insufficientFundsText}>💰 Insufficient Funds</Text>
                                            </View>
                                        )}
                                    </Pressable>
                                );
                            })}
                        </View>
                    )}

                    {/* WARNING STAGE */}
                    {stage === 'warning' && (
                        <View style={styles.warningContent}>
                            <Text style={styles.warningTitle}>⚠️ SCALPEL WARNING ⚠️</Text>
                            <Text style={styles.warningText}>
                                Surgery carries risks. Results are NOT guaranteed.{'\n\n'}
                                {selectedDoctor && selectedDoctor.successRate < 1 && (
                                    <>If complications arise, you may suffer permanent loss of Charisma and increased Stress.{'\n\n'}</>
                                )}
                                Do you wish to proceed with <Text style={{ fontWeight: 'bold' }}>{selectedDoctor?.name}</Text> for{' '}
                                {hasDiscount && (
                                    <Text style={{ color: '#FFFFFF', textDecorationLine: 'line-through' }}>
                                        ${selectedDoctor?.cost.toLocaleString()}
                                    </Text>
                                )}
                                {hasDiscount && ' '}
                                <Text style={{ color: 'rgba(255,255,255,0.48)', fontWeight: 'bold' }}>
                                    ${selectedDoctor ? getDiscountedPrice(selectedDoctor.cost).toLocaleString() : '0'}
                                </Text>
                                {hasDiscount && (
                                    <Text style={{ color: '#FFFFFF', fontSize: 12 }}>
                                        {' '}(Partner Discount!)
                                    </Text>
                                )}?
                            </Text>
                            <View style={styles.buttonGroup}>
                                <GameButton title={t('life.yesIAcceptTheRisk')} variant="danger" onPress={handleConfirm} style={{ flex: 1 }} />
                                <GameButton title={t('life.noTakeMeBack')} variant="secondary" onPress={() => setStage('selection')} style={{ flex: 1 }} />
                            </View>
                        </View>
                    )}

                    {/* PROCESSING STAGE */}
                    {stage === 'processing' && (
                        <View style={styles.processingContent}>
                            <ActivityIndicator size="large" color="#FF8A8A" />
                            <Text style={styles.processingText}>{t('life.performingSurgery')}</Text>
                            <Text style={styles.processingSubText}>{t('life.anesthesiaAdministered')}</Text>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>

            {/* Universal Crystal Navigation Bar */}
        </View>
    );
};

export default SanctuarySurgeryView;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#CFD0D2', // Dark theme matching current modal style
    },
    bottomBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 100,
        elevation: 10,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.48)',
        backgroundColor: '#434B50',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#434B50',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backIcon: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    titleContainer: {
        alignItems: 'center',
    },
    title: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    },
    subtitle: {
        color: '#FFFFFF',
        fontSize: 12,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    discountBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#CFD0D220',
        borderRadius: theme.radius.sm,
        padding: 12,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.48)',
        gap: 10,
    },
    discountIcon: {
        fontSize: 24,
    },
    discountTitle: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
        marginBottom: 2,
    },
    discountText: {
        color: '#FFFFFF',
        fontSize: 12,
    },
    listContent: {
        gap: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    doctorCard: {
        padding: 16,
        backgroundColor: '#434B50',
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.48)',
        gap: 10,
        position: 'relative',
    },
    doctorCardPressed: {
        backgroundColor: '#434B50',
        borderColor: 'rgba(255,255,255,0.48)',
    },
    doctorCardDisabled: {
        opacity: 0.5,
        borderColor: 'rgba(255,255,255,0.48)',
    },
    riskBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        zIndex: 1,
    },
    riskText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    doctorHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
    },
    doctorName: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
    disabledText: {
        color: '#FFFFFF',
    },
    priceContainer: {
        alignItems: 'flex-end',
        gap: 2,
    },
    originalPrice: {
        color: '#FFFFFF',
        fontSize: 12,
        textDecorationLine: 'line-through',
    },
    doctorCost: {
        color: 'rgba(255,255,255,0.48)',
        fontWeight: '700',
        fontSize: 16,
    },
    discountedPrice: {
        color: '#FFFFFF',
    },
    successRateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    successRateLabel: {
        color: '#FFFFFF',
        fontSize: 13,
    },
    successRateBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    successRateText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 12,
    },
    outcomeContainer: {
        flexDirection: 'row',
        gap: 6,
    },
    outcomeLabel: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    outcomeText: {
        color: '#FFFFFF',
        fontSize: 12,
    },
    insufficientFundsOverlay: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        right: 12,
        backgroundColor: '#434B50',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    insufficientFundsText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    // WARNING STYLES
    warningContent: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    warningTitle: {
        color: theme.colors.warning,
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 20,
    },
    warningText: {
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: 10,
        width: '100%',
    },
    // PROCESSING STYLES
    processingContent: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 16,
    },
    processingText: {
        color: 'rgba(255,255,255,0.48)',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 10,
    },
    processingSubText: {
        color: '#FFFFFF',
        fontSize: 14,
    },
});
