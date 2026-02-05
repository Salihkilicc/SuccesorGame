import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import GameModal from '../../common/GameModal';
import { useShareholderStore, type BoardMember } from '../../../features/shareholders/stores/useShareholderStore';
import { useStatsStore } from '../../../core/store';
import { useGameStore } from '../../../core/store/useGameStore';

type Props = {
    visible: boolean;
    onClose: () => void;
    sharkMember: BoardMember;
};

const SharkDealModal = ({ visible, onClose, sharkMember }: Props) => {
    const { takeSharkLoan } = useShareholderStore();
    const { update } = useStatsStore();
    const { currentMonth } = useGameStore();

    const LOAN_AMOUNT = 10_000_000;
    const DEADLINE_MONTHS = 6;
    const deadlineTurn = currentMonth + DEADLINE_MONTHS;

    const handleSignAgreement = () => {
        const result = takeSharkLoan(
            sharkMember.id,
            LOAN_AMOUNT,
            deadlineTurn,
            (amount) => {
                // Add cash to company capital
                const { companyCapital } = useStatsStore.getState();
                update({ companyCapital: companyCapital + amount });
            }
        );

        if (result.success) {
            Alert.alert('Deal Signed', `✅ ${result.message}\n\n⚠️ WARNING: Failure to repay by turn ${deadlineTurn} will result in equity seizure!`);
            onClose();
        } else {
            Alert.alert('Deal Failed', `❌ ${result.message}`);
        }
    };

    return (
        <GameModal visible={visible} onClose={onClose}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.headerTitle}>OFFER TERMS</Text>
                <Text style={styles.headerSubtitle}>Private Equity Agreement</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 20 }}>
                {/* Lender Info */}
                <View style={styles.lenderCard}>
                    <View style={styles.lenderAvatar}>
                        <Text style={styles.lenderAvatarText}>{sharkMember.name.charAt(0)}</Text>
                    </View>
                    <View>
                        <Text style={styles.lenderName}>{sharkMember.name}</Text>
                        <Text style={styles.lenderRole}>Private Equity Investor</Text>
                    </View>
                </View>

                {/* The Deal */}
                <View style={styles.dealSection}>
                    <Text style={styles.sectionTitle}>THE DEAL</Text>

                    <View style={styles.dealRow}>
                        <Text style={styles.dealLabel}>Amount:</Text>
                        <Text style={styles.dealAmount}>${(LOAN_AMOUNT / 1_000_000).toFixed(1)}M</Text>
                    </View>

                    <View style={styles.dealRow}>
                        <Text style={styles.dealLabel}>Interest Rate:</Text>
                        <Text style={styles.dealInterest}>0%</Text>
                    </View>

                    <View style={styles.dealRow}>
                        <Text style={styles.dealLabel}>Deadline:</Text>
                        <Text style={styles.dealDeadline}>{DEADLINE_MONTHS} Months</Text>
                    </View>

                    <View style={styles.dealRow}>
                        <Text style={styles.dealLabel}>Due By:</Text>
                        <Text style={styles.dealDeadline}>Turn {deadlineTurn}</Text>
                    </View>
                </View>

                {/* The Fine Print - CRITICAL */}
                <View style={styles.warningBox}>
                    <View style={styles.warningHeader}>
                        <Text style={styles.warningHeaderIcon}>⚠️</Text>
                        <Text style={styles.warningHeaderText}>COLLATERAL CLAUSE</Text>
                    </View>
                    <Text style={styles.warningText}>
                        Failure to repay by the deadline will result in the{' '}
                        <Text style={styles.warningTextBold}>immediate seizure</Text> of your personal shares
                        equivalent to the debt value{' '}
                        <Text style={styles.warningTextBold}>+ 50% penalty</Text>.
                    </Text>
                    <Text style={styles.warningSubtext}>
                        This may result in permanent loss of majority ownership.
                    </Text>
                </View>

                {/* Additional Warnings */}
                <View style={styles.riskBox}>
                    <Text style={styles.riskTitle}>⚡ RISK FACTORS</Text>
                    <Text style={styles.riskItem}>• No grace period or extensions</Text>
                    <Text style={styles.riskItem}>• Seizure is automatic and irreversible</Text>
                    <Text style={styles.riskItem}>• Stock price fluctuations affect seizure amount</Text>
                    <Text style={styles.riskItem}>• May trigger hostile takeover scenarios</Text>
                </View>

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.rejectButton,
                            pressed && styles.rejectButtonPressed
                        ]}
                        onPress={onClose}
                    >
                        <Text style={styles.rejectButtonText}>Reject Offer</Text>
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [
                            styles.signButton,
                            pressed && styles.signButtonPressed
                        ]}
                        onPress={handleSignAgreement}
                    >
                        <Text style={styles.signButtonText}>⚠️ SIGN AGREEMENT</Text>
                    </Pressable>
                </View>

                {/* Legal Disclaimer */}
                <Text style={styles.disclaimer}>
                    By signing, you acknowledge understanding of all terms and accept full responsibility
                    for consequences of default.
                </Text>
            </ScrollView>
        </GameModal>
    );
};

export default SharkDealModal;

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#FF3B30',
    },
    warningIcon: {
        fontSize: 48,
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 2,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#FF6B6B',
        fontStyle: 'italic',
    },
    lenderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#2A2D35',
    },
    lenderAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FF3B30',
        alignItems: 'center',
        justifyContent: 'center',
    },
    lenderAvatarText: {
        fontSize: 28,
        fontWeight: '900',
        color: '#000',
    },
    lenderName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    lenderRole: {
        fontSize: 12,
        color: '#8A9BA8',
    },
    dealSection: {
        backgroundColor: '#000000',
        borderRadius: 16,
        padding: 20,
        borderWidth: 2,
        borderColor: '#2A2D35',
        gap: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#8A9BA8',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    dealRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dealLabel: {
        fontSize: 14,
        color: '#8A9BA8',
        fontWeight: '600',
    },
    dealAmount: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -1,
    },
    dealInterest: {
        fontSize: 24,
        fontWeight: '800',
        color: '#90EE90',
    },
    dealDeadline: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FF3B30',
    },
    warningBox: {
        backgroundColor: '#1A0000',
        borderRadius: 12,
        padding: 20,
        borderWidth: 2,
        borderColor: '#FF3B30',
        gap: 12,
    },
    warningHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    warningHeaderIcon: {
        fontSize: 20,
    },
    warningHeaderText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FF3B30',
        letterSpacing: 1,
    },
    warningText: {
        fontSize: 14,
        color: '#FFFFFF',
        lineHeight: 22,
    },
    warningTextBold: {
        fontWeight: '900',
        color: '#FF3B30',
    },
    warningSubtext: {
        fontSize: 12,
        color: '#FF6B6B',
        fontStyle: 'italic',
        marginTop: 8,
    },
    riskBox: {
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#FF3B30',
        gap: 8,
    },
    riskTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#FF3B30',
        letterSpacing: 1,
        marginBottom: 8,
    },
    riskItem: {
        fontSize: 13,
        color: '#FF6B6B',
        lineHeight: 20,
    },
    buttonContainer: {
        gap: 12,
        marginTop: 8,
    },
    rejectButton: {
        backgroundColor: '#2A2D35',
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#8A9BA8',
    },
    rejectButtonPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
    rejectButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#8A9BA8',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    signButton: {
        backgroundColor: '#FF3B30',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#FF3B30',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 12,
    },
    signButtonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    signButtonText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#000000',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    disclaimer: {
        fontSize: 10,
        color: '#666',
        fontStyle: 'italic',
        textAlign: 'center',
        lineHeight: 16,
        marginTop: 8,
    },
});
