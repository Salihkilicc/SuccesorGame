import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useCorporateFinanceStore, Subsidiary } from '../../../features/finance/stores/useCorporateFinanceStore';
import { SubsidiaryDetailModal } from './SubsidiaryDetailModal';

type Props = {
    visible: boolean;
    onClose: () => void;
};

const ExistingCompaniesModal = ({ visible, onClose }: Props) => {
    const { subsidiaries } = useCorporateFinanceStore();
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

    const formatMoney = (value: number) => {
        if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
        if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
        return `$${value.toLocaleString()}`;
    };

    const renderItem = ({ item }: { item: Subsidiary }) => {
        const isPositive = item.lastChangePercent >= 0;
        const emoji = isPositive ? (item.lastChangePercent > 10 ? '🚀' : '📈') : item.lastChangePercent < -10 ? '📉' : '🔻';
        const color = isPositive ? '#30D158' : '#FF453A';

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.iconBox}>
                        <Text style={styles.icon}>🏢</Text>
                    </View>
                    <View style={styles.cardInfo}>
                        <Text style={styles.companyName}>{item.name}</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{item.sector}</Text>
                        </View>
                    </View>
                </View>

                {/* Performance Badge */}
                <View style={[styles.perfBadge, { backgroundColor: isPositive ? 'rgba(48, 209, 88, 0.1)' : 'rgba(255, 69, 58, 0.1)' }]}>
                    <Text style={[styles.perfText, { color }]}>
                        Last Q: {isPositive ? '+' : ''}{item.lastChangePercent.toFixed(1)}% {emoji}
                    </Text>
                </View>

                <View style={styles.cardFooter}>
                    <View>
                        <Text style={styles.label}>VALUATION</Text>
                        <Text style={styles.valuation}>{formatMoney(item.valuation)}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.manageBtn}
                        onPress={() => setSelectedCompanyId(item.id)}
                    >
                        <Text style={styles.manageBtnText}>MANAGE</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>My Empire</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Text style={styles.closeText}>Close</Text>
                    </TouchableOpacity>
                </View>

                {/* List */}
                <FlatList
                    data={subsidiaries}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyEmoji}>📉</Text>
                            <Text style={styles.emptyText}>You own no companies.</Text>
                            <Text style={styles.emptySubText}>Go to Acquisitions to buy a subsidiary.</Text>
                        </View>
                    }
                />

                {/* Detail Modal */}
                <SubsidiaryDetailModal
                    visible={!!selectedCompanyId}
                    companyId={selectedCompanyId}
                    onClose={() => setSelectedCompanyId(null)}
                />
            </View>
        </Modal>
    );
};

export default ExistingCompaniesModal;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212', // Dark background
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    closeBtn: {
        padding: 8,
    },
    closeText: {
        color: '#0A84FF',
        fontSize: 16,
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
        gap: 16,
    },
    card: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 16,
        gap: 16,
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    cardHeader: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#2C2C2E',
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        fontSize: 24,
    },
    cardInfo: {
        gap: 4,
    },
    companyName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    badge: {
        backgroundColor: '#3A3A3C',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    badgeText: {
        fontSize: 11,
        color: '#AEAEB2',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    perfBadge: {
        borderRadius: 8,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    perfText: {
        fontSize: 14,
        fontWeight: '700',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#2C2C2E',
    },
    label: {
        fontSize: 10,
        color: '#8E8E93',
        fontWeight: '700',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    valuation: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFF',
    },
    manageBtn: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
    manageBtnText: {
        color: '#000000',
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    emptyEmoji: {
        fontSize: 48,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    emptySubText: {
        fontSize: 14,
        color: '#8E8E93',
    },
});
