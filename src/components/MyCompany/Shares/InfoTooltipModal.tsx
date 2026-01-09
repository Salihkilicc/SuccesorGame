import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Modal,
} from 'react-native';
import { theme } from '../../../core/theme';

interface Props {
    visible: boolean;
    term: string;
    onClose: () => void;
}

const TOOLTIP_CONTENT: Record<string, { title: string; description: string }> = {
    IPO: {
        title: 'Initial Public Offering',
        description: 'Selling shares to the public for the first time. Provides significant capital but subjects your company to market volatility and investor pressure. This action is irreversible.',
    },
    Dilution: {
        title: 'Share Dilution',
        description: 'Issuing new shares to raise capital. This reduces your ownership percentage but increases company cash reserves. Use this when you need capital for expansion.',
    },
    Dividend: {
        title: 'Dividend Payment',
        description: 'Distributing profits to shareholders based on their ownership percentage. Your share will be transferred from company capital to your personal wallet.',
    },
    'Stock Split': {
        title: 'Stock Split',
        description: 'Dividing existing shares to lower the price per share. For example, 1 share at $1,000 becomes 10 shares at $100. This makes shares more accessible but doesn\'t change company value.',
    },
};

const InfoTooltipModal = ({ visible, term, onClose }: Props) => {
    const content = TOOLTIP_CONTENT[term] || { title: term, description: 'No information available.' };

    return (
        <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay} pointerEvents="box-none">
                <View style={styles.content}>
                    <Text style={styles.title}>ℹ️ {content.title}</Text>
                    <Text style={styles.description}>{content.description}</Text>
                    <Pressable
                        onPress={onClose}
                        style={({ pressed }) => [
                            styles.btn,
                            pressed && styles.btnPressed,
                        ]}>
                        <Text style={styles.btnText}>Got it</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
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
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        maxWidth: 400,
        alignSelf: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.textPrimary,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        lineHeight: 20,
        textAlign: 'center',
    },
    btn: {
        backgroundColor: theme.colors.accent,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        marginTop: theme.spacing.sm,
    },
    btnPressed: {
        transform: [{ scale: 0.98 }],
    },
    btnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#000',
    },
});

export default InfoTooltipModal;
