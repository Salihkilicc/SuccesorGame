import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Modal,
    ScrollView,
    Alert,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../../core/theme';
import { useStatsStore } from '../../../core/store/useStatsStore';
import { useEquityStore } from '../../../features/finance/stores/useEquityStore';
import InfoTooltipModal from './InfoTooltipModal';
import BottomStatsBar from '../../common/BottomStatsBar';

interface Props {
    visible: boolean;
    onClose: () => void;
    onOpenIPO: () => void;
    onOpenDilution: () => void;
    onOpenDividend: () => void;
    onOpenBuyback: () => void;
}

const ShareControlHub = ({ visible, onClose, onOpenIPO, onOpenDilution, onOpenDividend, onOpenBuyback }: Props) => {
    const navigation = useNavigation<any>();
    const {
        companyValue,
        companyDailyChange,
        performStockSplit,
    } = useStatsStore();

    // Equity Store Integration
    const stockPrice = useEquityStore((state) => state.stockPrice);
    const playerShares = useEquityStore((state) => state.playerShares);
    const totalShares = useEquityStore((state) => state.totalShares);
    const publicShares = useEquityStore((state) => state.publicShares);
    const getPlayerOwnership = useEquityStore((state) => state.getPlayerOwnership);
    const syncStockPrice = useEquityStore((state) => state.syncStockPrice);
    const isPublic = useEquityStore((state) => state.isPublic);

    const [tooltipTerm, setTooltipTerm] = useState<string | null>(null);

    // Sync stock price when valuation changes
    useEffect(() => {
        if (companyValue > 0) {
            syncStockPrice(companyValue);
        }
    }, [companyValue, syncStockPrice]);

    const handleStockSplit = () => {
        if (stockPrice <= 1000) {
            Alert.alert('Not Available', 'Stock split is only available when share price exceeds $1,000.');
            return;
        }

        Alert.alert(
            'Stock Split',
            'This will divide your share price by 10 and multiply share count by 10. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Split',
                    onPress: () => {
                        performStockSplit();
                        Alert.alert('Success', 'Stock split completed successfully!');
                    },
                },
            ]
        );
    };

    const handleHomePress = () => {
        onClose();
        navigation.navigate('Home');
    };

    const marketCap = stockPrice * totalShares;
    const playerOwnership = getPlayerOwnership();

    return (
        <>
            <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false}>
                <SafeAreaView style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.backButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 20 }}
                        >
                            <Text style={styles.backButtonText}>← Close</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Equity Management</Text>
                        <View style={styles.headerSpacer} />
                    </View>

                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
                        {/* Stock Price Hero Card */}
                        <View style={styles.heroCard}>
                            <Text style={styles.heroLabel}>Current Stock Price</Text>
                            <View style={styles.heroRow}>
                                <Text style={styles.heroPrice}>${stockPrice.toFixed(2)}</Text>
                                <View style={[
                                    styles.changeBadge,
                                    { backgroundColor: companyDailyChange >= 0 ? '#30D15820' : '#FF453A20' }
                                ]}>
                                    <Text style={[
                                        styles.changeBadgeText,
                                        { color: companyDailyChange >= 0 ? '#30D158' : '#FF453A' }
                                    ]}>
                                        {companyDailyChange >= 0 ? '↑' : '↓'} {Math.abs(companyDailyChange).toFixed(2)}%
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Stats Grid */}
                        <View style={styles.statsGrid}>
                            <View style={styles.statCard}>
                                <Text style={styles.statIcon}>📊</Text>
                                <Text style={styles.statLabel}>Total Shares</Text>
                                <Text style={styles.statValue}>{(totalShares / 1_000_000).toFixed(2)}M</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statIcon}>💎</Text>
                                <Text style={styles.statLabel}>Market Cap</Text>
                                <Text style={styles.statValue}>${(marketCap / 1_000_000).toFixed(1)}M</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statIcon}>🌐</Text>
                                <Text style={styles.statLabel}>Public Float</Text>
                                <Text style={styles.statValue}>{((publicShares / totalShares) * 100).toFixed(1)}%</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statIcon}>👤</Text>
                                <Text style={styles.statLabel}>My Ownership</Text>
                                <Text style={styles.statValue}>{playerOwnership.toFixed(1)}%</Text>
                            </View>
                        </View>

                        {/* Actions Section */}
                        <Text style={styles.sectionTitle}>Market Actions</Text>

                        {/* IPO / Stock Split */}
                        {!isPublic ? (
                            <TouchableOpacity
                                style={styles.actionRow}
                                onPress={onOpenIPO}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.actionIconBox, { backgroundColor: '#0A84FF20' }]}>
                                    <Text style={styles.actionIcon}>🔔</Text>
                                </View>
                                <View style={styles.actionContent}>
                                    <Text style={styles.actionTitle}>Launch IPO</Text>
                                    <Text style={styles.actionDescription}>Go public to maximize valuation</Text>
                                </View>
                                <Text style={styles.actionArrow}>›</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.actionRow, stockPrice <= 1000 && styles.actionRowDisabled]}
                                onPress={handleStockSplit}
                                disabled={stockPrice <= 1000}
                                activeOpacity={0.7}
                            >
                                <View style={styles.actionIconBox}>
                                    <Text style={styles.actionIcon}>✂️</Text>
                                </View>
                                <View style={styles.actionContent}>
                                    <Text style={[styles.actionTitle, stockPrice <= 1000 && styles.textDisabled]}>
                                        Stock Split
                                    </Text>
                                    <Text style={[styles.actionDescription, stockPrice <= 1000 && styles.textDisabled]}>
                                        Requires $1,000+ share price
                                    </Text>
                                </View>
                                <Text style={[styles.actionArrow, stockPrice <= 1000 && styles.textDisabled]}>›</Text>
                            </TouchableOpacity>
                        )}

                        {/* Buyback */}
                        <TouchableOpacity
                            style={[styles.actionRow, !isPublic && styles.actionRowDisabled]}
                            onPress={onOpenBuyback}
                            disabled={!isPublic}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIconBox, { backgroundColor: '#0A84FF20' }]}>
                                <Text style={styles.actionIcon}>📈</Text>
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={[styles.actionTitle, !isPublic && styles.textDisabled]}>
                                    Stock Buyback
                                </Text>
                                <Text style={[styles.actionDescription, !isPublic && styles.textDisabled]}>
                                    {isPublic ? 'Buy back shares using company cash' : 'Requires IPO first'}
                                </Text>
                            </View>
                            <Text style={[styles.actionArrow, !isPublic && styles.textDisabled]}>›</Text>
                        </TouchableOpacity>

                        {/* Dilution */}
                        <TouchableOpacity
                            style={[styles.actionRow, !isPublic && styles.actionRowDisabled]}
                            onPress={onOpenDilution}
                            disabled={!isPublic}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIconBox, { backgroundColor: '#FF9F0A20' }]}>
                                <Text style={styles.actionIcon}>📉</Text>
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={[styles.actionTitle, !isPublic && styles.textDisabled]}>
                                    Issue Shares
                                </Text>
                                <Text style={[styles.actionDescription, !isPublic && styles.textDisabled]}>
                                    {isPublic ? 'Raise capital by diluting ownership' : 'Requires IPO first'}
                                </Text>
                            </View>
                            <Text style={[styles.actionArrow, !isPublic && styles.textDisabled]}>›</Text>
                        </TouchableOpacity>

                        {/* Dividend */}
                        <TouchableOpacity
                            style={[styles.actionRow, !isPublic && styles.actionRowDisabled]}
                            onPress={onOpenDividend}
                            disabled={!isPublic}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.actionIconBox, { backgroundColor: '#30D15820' }]}>
                                <Text style={styles.actionIcon}>💰</Text>
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={[styles.actionTitle, !isPublic && styles.textDisabled]}>
                                    Distribute Dividends
                                </Text>
                                <Text style={[styles.actionDescription, !isPublic && styles.textDisabled]}>
                                    {isPublic ? 'Pay cash to shareholders' : 'Requires IPO first'}
                                </Text>
                            </View>
                            <Text style={[styles.actionArrow, !isPublic && styles.textDisabled]}>›</Text>
                        </TouchableOpacity>

                        <View style={{ height: 40 }} />
                    </ScrollView>

                    {/* Persistent Bottom Bar */}
                    <BottomStatsBar onHomePress={handleHomePress} />
                </SafeAreaView>
            </Modal>

            <InfoTooltipModal
                visible={!!tooltipTerm}
                term={tooltipTerm || ''}
                onClose={() => setTooltipTerm(null)}
            />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    backButton: {
        paddingVertical: 8,
        zIndex: 10, // Ensure it sits above the absolute title
    },
    backButtonText: {
        fontSize: 17,
        color: '#0A84FF',
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF',
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
    },
    headerSpacer: {
        width: 60,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    heroCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 24,
        marginTop: 20,
    },
    heroLabel: {
        fontSize: 14,
        color: '#8E8E93',
        fontWeight: '500',
        marginBottom: 8,
    },
    heroRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    heroPrice: {
        fontSize: 48,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: -1,
    },
    changeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    changeBadgeText: {
        fontSize: 16,
        fontWeight: '600',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 16,
    },
    statCard: {
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 16,
        width: '48%',
    },
    statIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#8E8E93',
        fontWeight: '500',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginTop: 32,
        marginBottom: 16,
    },
    actionRow: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionRowDisabled: {
        opacity: 0.4,
    },
    actionIconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#2C2C2E',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    actionIcon: {
        fontSize: 24,
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    actionDescription: {
        fontSize: 14,
        color: '#8E8E93',
    },
    actionArrow: {
        fontSize: 28,
        color: '#3A3A3C',
        fontWeight: '300',
    },
    textDisabled: {
        color: '#3A3A3C',
    },
});

export default ShareControlHub;
