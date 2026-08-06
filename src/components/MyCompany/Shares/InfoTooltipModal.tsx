import React from 'react';
import { t, useLocale } from '../../../core/i18n';
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
        get title() { return t('equity.initialPublicOffering'); },
        get description() { return t('equity.sellingSharesToThePublic'); },
    },
    Dilution: {
        get title() { return t('equity.shareDilution'); },
        get description() { return t('equity.issuingNewSharesToRaise'); },
    },
    Dividend: {
        get title() { return t('equity.dividendPayment'); },
        get description() { return t('equity.distributingProfitsToShareholdersBased'); },
    },
    'Stock Split': {
        get title() { return t('equity.stockSplit'); },
        get description() { return t('equity.dividingExistingSharesToLower'); },
    },
};

const InfoTooltipModal = ({ visible, term, onClose }: Props) => {
    useLocale();
    const content = TOOLTIP_CONTENT[term] || { title: term, description: t('equity.noInformationAvailable') };

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
                        <Text style={styles.btnText}>{t('equity.gotIt')}</Text>
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
