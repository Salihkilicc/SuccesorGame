import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Modal,
    ScrollView,
    Alert,
    TouchableOpacity,
} from 'react-native';
import { theme } from '../../../theme';
import { useStatsStore } from '../../../store/useStatsStore';
import InfoTooltipModal from './InfoTooltipModal';

interface Props {
    visible: boolean;
    onClose: () => void;
    onOpenIPO: () => void;
    onOpenDilution: () => void;
    onOpenDividend: () => void;
    onOpenBuyback: () => void;
}

const ActionCardButton = ({
    icon,
    title,
    description,
    onPress,
    tone = 'default',
    disabled = false
}: {
    icon: string;
    title: string;
    description: string;
    onPress: () => void;
    tone?: 'default' | 'success' | 'danger' | 'accent';
    disabled?: boolean;
}) => (
    <TouchableOpacity
        onPress={() => {
            console.log(`[ShareControl] Pressed: ${title}`);
            onPress();
        }}
        disabled={disabled}
        activeOpacity={0.7}
        style={[
            styles.actionCard,
            tone === 'success' && styles.actionCardSuccess,
            tone === 'accent' && styles.actionCardAccent,
            disabled && styles.actionCardDisabled,
        ]}>
        <View style={styles.actionIconContainer}>
            <Text style={styles.actionIcon}>{icon}</Text>
        </View>
        <View style={styles.actionInfo}>
            <Text style={[styles.actionTitle, disabled && styles.textDisabled]}>{title}</Text>
            <Text style={[styles.actionDesc, disabled && styles.textDisabled]}>{description}</Text>
        </View>
        <Text style={[styles.actionArrow, disabled && styles.textDisabled]}>›</Text>
    </TouchableOpacity>
);

const ShareControlHub = ({ visible, onClose, onOpenIPO, onOpenDilution, onOpenDividend, onOpenBuyback }: Props) => {
    const {
        companyValue,
        companySharePrice,
        companyDailyChange,
        companyOwnership,
        isPublic,
        performStockSplit,
    } = useStatsStore();

    const [tooltipTerm, setTooltipTerm] = useState<string | null>(null);

    const handleStockSplit = () => {
        if (companySharePrice <= 1000) {
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

    return (
        <>
            <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
                <View style={styles.overlay} pointerEvents="box-none">
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <Text style={styles.title}>📊 Share Control</Text>
                            <Pressable onPress={onClose} style={styles.closeBtn}>
                                <Text style={styles.closeBtnText}>×</Text>
                            </Pressable>
                        </View>

                        {/* Company Stats Header */}
                        <View style={styles.statsCard}>
                            <View style={styles.statCol}>
                                <Text style={styles.statLabel}>Valuation</Text>
                                <Text style={styles.statValue}>${(companyValue / 1_000_000).toFixed(1)}M</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statCol}>
                                <Text style={styles.statLabel}>Share Price</Text>
                                <Text style={styles.statValue}>${companySharePrice.toFixed(2)}</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statCol}>
                                <Text style={styles.statLabel}>Change</Text>
                                <Text style={[
                                    styles.statValue,
                                    { color: companyDailyChange >= 0 ? theme.colors.success : theme.colors.danger }
                                ]}>
                                    {companyDailyChange >= 0 ? '+' : ''}{companyDailyChange.toFixed(2)}%
                                </Text>
                            </View>
                        </View>

                        <ScrollView contentContainerStyle={styles.actionBody} showsVerticalScrollIndicator={false}>
                            {/* 1. IPO / Stock Split */}
                            {!isPublic ? (
                                <ActionCardButton
                                    icon="🔔"
                                    title="Launch IPO"
                                    description="Go public to maximize valuation and unlock growth."
                                    onPress={() => {
                                        console.log("Launch IPO Pressed");
                                        onOpenIPO();
                                    }}
                                    tone="accent"
                                />
                            ) : (
                                <ActionCardButton
                                    icon="✂️"
                                    title="Stock Split"
                                    description="Split shares (Requires $1,000+ share price)."
                                    onPress={handleStockSplit}
                                    disabled={companySharePrice <= 1000}
                                />
                            )}

                            {/* 2. Dilution */}
                            <ActionCardButton
                                icon="📉"
                                title="Dilution / Raise Capital"
                                description={isPublic ? "Issue new shares to investors." : "Requires IPO first."}
                                onPress={() => onOpenDilution()}
                                disabled={!isPublic}
                            />

                            {/* 3. Buyback */}
                            <ActionCardButton
                                icon="📈"
                                title="Stock Buyback"
                                description={isPublic ? "Buy back shares using company cash." : "Requires IPO first."}
                                onPress={() => onOpenBuyback()}
                                disabled={!isPublic}
                            />

                            {/* 4. Dividend */}
                            <ActionCardButton
                                icon="💰"
                                title="Distribute Dividends"
                                description={isPublic ? "Pay cash to shareholders." : "Requires IPO first."}
                                onPress={() => onOpenDividend()}
                                disabled={!isPublic}
                                tone="success"
                            />
                        </ScrollView>

                    </View>
                </View>
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
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        padding: theme.spacing.lg,
    },
    content: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        maxHeight: '85%',
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.card,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.textPrimary,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.cardSoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeBtnText: {
        fontSize: 24,
        color: theme.colors.textSecondary,
        lineHeight: 24,
    },
    statsCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.cardSoft,
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderColor: theme.colors.border,
    },
    statCol: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    statDivider: {
        width: 1,
        backgroundColor: theme.colors.border,
        height: '100%',
    },
    statLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statValue: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    actionBody: {
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.cardSoft,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: theme.spacing.md,
    },
    actionCardSuccess: {
        borderColor: theme.colors.success + '40',
        backgroundColor: theme.colors.success + '10',
    },
    actionCardAccent: {
        borderColor: theme.colors.accent + '40',
        backgroundColor: theme.colors.accent + '10',
    },
    actionCardPressed: {
        backgroundColor: theme.colors.background,
        transform: [{ scale: 0.98 }],
    },
    actionCardDisabled: {
        opacity: 0.5,
        backgroundColor: theme.colors.background,
    },
    actionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    actionIcon: {
        fontSize: 20,
    },
    actionInfo: {
        flex: 1,
        gap: 2,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.textPrimary,
    },
    actionDesc: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    actionArrow: {
        fontSize: 20,
        color: theme.colors.textSecondary,
        fontWeight: '700',
    },
    textDisabled: {
        color: theme.colors.textMuted,
    },
});

export default ShareControlHub;
