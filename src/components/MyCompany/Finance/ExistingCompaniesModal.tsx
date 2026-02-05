import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import GameModal from '../../common/GameModal';
import { useCorporateFinanceStore } from '../../../features/finance/stores/useCorporateFinanceStore';
import SubsidiaryDetailModal from './SubsidiaryDetailModal';

type Props = {
    visible: boolean;
    onClose: () => void;
};

const ExistingCompaniesModal = ({ visible, onClose }: Props) => {
    const { subsidiaries } = useCorporateFinanceStore();
    const [selectedSubsidiaryId, setSelectedSubsidiaryId] = useState<string | null>(null);

    const handleSelect = (id: string) => {
        setSelectedSubsidiaryId(id);
    };

    const handleDetailClose = () => {
        setSelectedSubsidiaryId(null);
    };

    return (
        <GameModal visible={visible} onClose={onClose}>
            {/* List Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>MY EMPIRE</Text>
                <Text style={styles.headerSubtitle}>Subsidiary Portfolio</Text>
            </View>

            {subsidiaries.length === 0 ? (
                // Empty State
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>🏢</Text>
                    <Text style={styles.emptyTitle}>No Acquisitions Yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Your portfolio is empty. Go to the Stock Market to acquire companies.
                    </Text>
                </View>
            ) : (
                // Subsidiaries List
                <FlatList
                    data={subsidiaries}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => handleSelect(item.id)}
                        >
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardName}>{item.name}</Text>
                                <View style={styles.sectorBadge}>
                                    <Text style={styles.sectorText}>{item.sector}</Text>
                                </View>
                            </View>

                            <View style={styles.cardMetrics}>
                                <View>
                                    <Text style={styles.metricLabel}>VALUATION</Text>
                                    <Text style={styles.metricValue}>
                                        ${(item.valuation / 1_000_000).toFixed(2)}M
                                    </Text>
                                </View>
                                <View>
                                    <Text style={styles.metricLabel}>PERFORMANCE</Text>
                                    <View style={styles.strategyPreview}>
                                        <Text style={styles.strategyDots}>
                                            {'●'.repeat(Math.min(5, item.history.length > 0 ? 5 : 1))}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <Text style={styles.arrow}>→</Text>
                        </TouchableOpacity>
                    )}
                />
            )}

            {/* Nested Manager Modal */}
            {selectedSubsidiaryId && (
                <SubsidiaryDetailModal
                    visible={!!selectedSubsidiaryId}
                    onClose={handleDetailClose}
                    subsidiaryId={selectedSubsidiaryId}
                />
            )}
        </GameModal>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 24,
        paddingVertical: 12,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#F0F0F0',
        letterSpacing: 2,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#8A9BA8',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    listContent: {
        paddingBottom: 24,
        gap: 16,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        backgroundColor: '#1C1C1E',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#2A2D35',
        marginTop: 20,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
        opacity: 0.5,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#E0E0E0',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#8A9BA8',
        textAlign: 'center',
        lineHeight: 20,
    },
    card: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#2A2D35',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        position: 'relative',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    sectorBadge: {
        backgroundColor: '#2C2C2E',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3A3A3C',
    },
    sectorText: {
        fontSize: 10,
        color: '#FFD700',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    cardMetrics: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    metricLabel: {
        fontSize: 10,
        color: '#8A9BA8',
        fontWeight: '700',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    metricValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#30D158',
    },
    strategyPreview: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    strategyDots: {
        fontSize: 12,
        color: '#8A9BA8',
    },
    arrow: {
        position: 'absolute',
        right: 16,
        bottom: 20,
        fontSize: 20,
        color: '#4ADE80',
        fontWeight: '700',
    }
});

export default ExistingCompaniesModal;
