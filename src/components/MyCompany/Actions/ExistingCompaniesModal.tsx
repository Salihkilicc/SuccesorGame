import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { theme } from '../../../theme';
import { useStatsStore } from '../../../store';
import SubsidiaryDetailModal from './SubsidiaryDetailModal';

type Props = {
    visible: boolean;
    onClose: () => void;
};

const ExistingCompaniesModal = ({ visible, onClose }: Props) => {
    const { subsidiaryStates } = useStatsStore();
    const [selectedSubsidiary, setSelectedSubsidiary] = useState<any>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const subsidiaries = Object.values(subsidiaryStates);

    const handleOpenDetail = (subsidiary: any) => {
        setSelectedSubsidiary(subsidiary);
        setIsDetailModalOpen(true);
    };

    const handleCloseDetail = () => {
        setIsDetailModalOpen(false);
        setSelectedSubsidiary(null);
    };

    return (
        <>
            <Modal
                visible={visible && !isDetailModalOpen}
                animationType="fade"
                presentationStyle="pageSheet"
                onRequestClose={onClose}
            >
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Existing Companies</Text>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <Text style={styles.closeText}>Done</Text>
                        </Pressable>
                    </View>

                    {/* Content */}
                    <ScrollView contentContainerStyle={styles.content}>
                        {subsidiaries.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyIcon}>🏢</Text>
                                <Text style={styles.emptyTitle}>No companies owned yet</Text>
                                <Text style={styles.emptyDesc}>
                                    Go to 'Acquire Company' to expand your empire.
                                </Text>
                            </View>
                        ) : (
                            subsidiaries.map(sub => {
                                const isHealthy = !sub.isLossMaking;
                                const monthlyImpact = sub.currentProfit / 12;

                                return (
                                    <Pressable
                                        key={sub.id}
                                        onPress={() => handleOpenDetail(sub)}
                                        style={({ pressed }) => [
                                            styles.card,
                                            pressed && styles.cardPressed,
                                            !isHealthy && styles.cardCritical,
                                        ]}
                                    >
                                        <View style={styles.cardLeft}>
                                            <View style={[styles.logoBox, !isHealthy && { borderColor: theme.colors.danger }]}>
                                                <Text style={styles.logo}>🏢</Text>
                                            </View>
                                            <View>
                                                <Text style={styles.companyName}>{sub.name}</Text>
                                                <Text style={styles.companySector}>
                                                    {isHealthy ? '🟢 Healthy' : '🔻 CRITICAL LOSS'}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.cardRight}>
                                            <Text style={styles.impactLabel}>Monthly Impact</Text>
                                            <Text
                                                style={[
                                                    styles.impactValue,
                                                    { color: isHealthy ? theme.colors.success : theme.colors.danger },
                                                ]}
                                            >
                                                {isHealthy ? '+' : ''}${(Math.abs(monthlyImpact) / 1e6).toFixed(1)}M
                                            </Text>
                                        </View>
                                    </Pressable>
                                );
                            })
                        )}
                    </ScrollView>
                </View>
            </Modal>

            {/* Detail Modal */}
            <SubsidiaryDetailModal
                visible={isDetailModalOpen}
                onClose={handleCloseDetail}
                subsidiary={selectedSubsidiary}
            />
        </>
    );
};

export default ExistingCompaniesModal;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#05060A',
    },
    header: {
        padding: 20,
        paddingTop: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: theme.colors.textPrimary,
    },
    closeBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    closeText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    content: {
        padding: 16,
        gap: 12,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
        gap: 16,
    },
    emptyIcon: {
        fontSize: 80,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.textPrimary,
    },
    emptyDesc: {
        fontSize: 15,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        maxWidth: 280,
        lineHeight: 22,
    },
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    cardPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
    cardCritical: {
        borderColor: theme.colors.danger,
        backgroundColor: theme.colors.danger + '08',
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    logoBox: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: theme.colors.cardSoft,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: theme.colors.border,
    },
    logo: {
        fontSize: 28,
    },
    companyName: {
        fontSize: 16,
        fontWeight: '800',
        color: theme.colors.textPrimary,
    },
    companySector: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        fontWeight: '600',
        marginTop: 2,
    },
    cardRight: {
        alignItems: 'flex-end',
    },
    impactLabel: {
        fontSize: 11,
        color: theme.colors.textMuted,
        fontWeight: '600',
        marginBottom: 4,
    },
    impactValue: {
        fontSize: 18,
        fontWeight: '900',
    },
});
