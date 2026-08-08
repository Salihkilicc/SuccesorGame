import React from 'react';
import { t, useLocale } from '../../../../../core/i18n';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '../../../../../core/theme';

type NightOutFooterViewProps = {
    totalCost: number;
    onConfirm: () => void;
    onClose: () => void;
};

const NightOutFooterView = ({ totalCost, onConfirm, onClose }: NightOutFooterViewProps) => {
    useLocale();
    return (
        <>
            <View style={styles.footer}>
                <View>
                    <Text style={styles.totalLabel}>{t('life.totalCost')}</Text>
                    <Text style={styles.totalValue}>
                        ${totalCost.toLocaleString()}
                    </Text>
                </View>
                <Pressable
                    onPress={onConfirm}
                    style={({ pressed }) => [
                        styles.confirmButton,
                        pressed && styles.confirmButtonPressed,
                    ]}>
                    <Text style={styles.confirmButtonText}>{t('life.goNightOut')}</Text>
                </Pressable>
            </View>

            <Pressable onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>{t('life.cancel')}</Text>
            </Pressable>
        </>
    );
};

const styles = StyleSheet.create({
    footer: {
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
        paddingTop: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        color: '#C8C0EF',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    },
    totalValue: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
    },
    confirmButton: {
        backgroundColor: '#C8C0EF',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    confirmButtonPressed: {
        opacity: 0.8,
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 14,
    },
    closeButton: {
        marginTop: 16,
        alignItems: 'center'
    },
    closeText: {
        color: '#C8C0EF',
        fontSize: 14
    }
});

export default NightOutFooterView;
