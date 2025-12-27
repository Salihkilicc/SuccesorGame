import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { theme } from '../../../theme'; // Adjust path
import { AcquisitionTarget } from '../../../data/AcquisitionData';

type Props = {
    visible: boolean;
    onClose: () => void;
    company: AcquisitionTarget | null;
    onAcquire: (company: AcquisitionTarget) => void;
};

const formatMoney = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (absValue >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    return `$${value.toLocaleString()}`;
};

const CompanyAnalysisModal = ({ visible, onClose, company, onAcquire }: Props) => {
    if (!company) return null;

    const isProfitable = company.profit > 0;
    const sentimentColor =
        company.boardSentiment === 'Supportive' ? theme.colors.success :
            company.boardSentiment === 'Hostile' ? theme.colors.danger :
                company.boardSentiment === 'Skeptical' ? '#FFD700' :
                    company.boardSentiment === 'Cautious' ? '#FFA500' : '#8A9BA8';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.titleRow}>
                            <Text style={styles.logo}>{company.logo}</Text>
                            <Text style={styles.name}>{company.name}</Text>
                        </View>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>×</Text>
                        </Pressable>
                    </View>

                    <View style={styles.sectorBadge}>
                        <Text style={styles.sectorText}>{company.category}</Text>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 24, paddingBottom: 100 }}>
                        <Text style={styles.description}>{company.description}</Text>

                        {/* Financial Grid */}
                        <View style={styles.gridContainer}>
                            <Text style={styles.sectionTitle}>FINANCIALS (ANNUAL)</Text>
                            <View style={styles.grid}>
                                <View style={styles.gridItem}>
                                    <Text style={styles.gridLabel}>VALUATION</Text>
                                    <Text style={styles.gridValue}>{formatMoney(company.marketCap)}</Text>
                                </View>
                                <View style={styles.gridItem}>
                                    <Text style={styles.gridLabel}>NET PROFIT</Text>
                                    <Text style={[styles.gridValue, { color: isProfitable ? theme.colors.success : theme.colors.danger }]}>
                                        {formatMoney(company.profit)}
                                    </Text>
                                </View>
                                <View style={styles.gridItem}>
                                    <Text style={styles.gridLabel}>GROWTH</Text>
                                    <Text style={styles.gridValue}>+{company.growthRate}%</Text>
                                </View>
                            </View>
                        </View>

                        {/* Strategic Fit */}
                        <View style={styles.fitContainer}>
                            <Text style={styles.sectionTitle}>DUE DILIGENCE</Text>

                            {/* Synergy Score */}
                            <View style={styles.fitRow}>
                                <View style={styles.fitHeader}>
                                    <Text style={styles.fitLabel}>Synergy Score</Text>
                                    <Text style={styles.fitValue}>{company.synergyScore}/100</Text>
                                </View>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, { width: `${company.synergyScore}%` }]} />
                                </View>
                                <Text style={styles.fitDesc}>
                                    {company.synergyDescription || (company.synergyScore > 80 ? 'High Synergy. Will significantly boost operations.' : 'Low Synergy.')}
                                </Text>
                            </View>

                            <View style={styles.divider} />

                            {/* Board Sentiment */}
                            <View style={styles.fitRow}>
                                <Text style={styles.fitLabel}>Board Sentiment</Text>
                                <View style={[styles.sentimentBadge, { backgroundColor: sentimentColor + '20' }]}>
                                    <Text style={[styles.sentimentText, { color: sentimentColor }]}>
                                        {company.boardSentiment.toUpperCase()}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Bottom Action */}
                    <View style={styles.footer}>
                        <View style={styles.priceContainer}>
                            <Text style={styles.priceLabel}>ASKING PRICE</Text>
                            <Text style={styles.priceValue}>{formatMoney(company.marketCap * company.acquisitionPremium)}</Text>
                        </View>
                        <Pressable
                            style={({ pressed }) => [styles.buyButton, pressed && styles.buyButtonPressed]}
                            onPress={() => onAcquire(company)}
                        >
                            <Text style={styles.buyButtonText}>START NEGOTIATIONS</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default CompanyAnalysisModal;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'flex-end',
    },
    container: {
        height: '92%',
        backgroundColor: '#15171E',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: '#333',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    logo: {
        fontSize: 32,
    },
    name: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFF',
    },
    sectorBadge: {
        backgroundColor: '#2A2D35',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    sectorText: {
        color: '#8A9BA8',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    closeButton: {
        padding: 8,
        backgroundColor: '#2A2D35',
        borderRadius: 20,
    },
    closeButtonText: {
        fontSize: 20,
        color: '#FFF',
        fontWeight: 'bold',
        marginTop: -2,
    },
    description: {
        fontSize: 15,
        color: '#B0B0B0',
        lineHeight: 22,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#555',
        letterSpacing: 1,
        marginBottom: 12,
    },
    gridContainer: {
        backgroundColor: '#1E222B',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#2E3540',
    },
    grid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    gridItem: {
        alignItems: 'center',
        flex: 1,
    },
    gridLabel: {
        fontSize: 10,
        color: '#8A9BA8',
        fontWeight: '700',
        marginBottom: 4,
    },
    gridValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    fitContainer: {
        backgroundColor: '#1E222B',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#2E3540',
    },
    fitRow: {
        gap: 8,
    },
    fitHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    fitLabel: {
        fontSize: 14,
        color: '#FFF',
        fontWeight: '600',
    },
    fitValue: {
        fontSize: 14,
        color: theme.colors.success,
        fontWeight: '700',
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#333',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: theme.colors.success,
    },
    fitDesc: {
        fontSize: 12,
        color: '#8A9BA8',
        fontStyle: 'italic',
    },
    divider: {
        height: 1,
        backgroundColor: '#333',
        marginVertical: 16,
    },
    sentimentBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    sentimentText: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: '#232730',
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#333',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    priceContainer: {
        gap: 2,
    },
    priceLabel: {
        fontSize: 10,
        color: '#8A9BA8',
        fontWeight: '700',
    },
    priceValue: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFF',
    },
    buyButton: {
        backgroundColor: theme.colors.success,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
    },
    buyButtonPressed: {
        opacity: 0.8,
    },
    buyButtonText: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 14,
    },
});
