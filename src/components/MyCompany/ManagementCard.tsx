import React, { useState, useEffect } from 'react';
import { t, useLocale } from '../../core/i18n';
import { View, Text, StyleSheet } from 'react-native';
// Removed Slider import
import { theme } from '../../core/theme';
import GameButton from '../common/GameButton';
import { PercentageSelector } from '../atoms/PercentageSelector';
import { formatNumber, formatMoney } from '../../core/utils';

type ManagementCardProps = {
    title: string;
    icon: string;
    currentValue: number;
    maxValue: number;
    minValue?: number;
    costPerUnit: number;
    headerRight?: React.ReactNode;
    onSave: (delta: number) => void;
};

const ManagementCard = ({
    title,
    icon,
    currentValue,
    maxValue,
    minValue = 0,
    costPerUnit,
    headerRight,
    onSave,
}: ManagementCardProps) => {
    useLocale();
    const [targetValue, setTargetValue] = useState(currentValue);

    // Reset slider when currentValue changes
    useEffect(() => {
        setTargetValue(currentValue);
    }, [currentValue]);

    const delta = targetValue - currentValue;
    const totalCost = Math.abs(delta) * costPerUnit;
    const isIncrease = delta > 0;
    const isDecrease = delta < 0;

    const handleSave = () => {
        if (delta !== 0) {
            onSave(delta);
            setTargetValue(currentValue);
        }
    };

    // Paylasilan bicimlendiriciye devrediyor (core/utils).
    // Eskiden her dosyada ayri kademe zinciri vardi; esikleri farkli oldugu icin
    // ayni deger farkli ekranlarda farkli gorunuyordu.
    const formatCost = (value: number) => formatMoney(value);

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.iconBox}>
                    <Text style={styles.icon}>{icon}</Text>
                </View>
                <View>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.subtitle}>{t('company.currentV1', { v1: formatNumber(currentValue) })}</Text>
                </View>
                {headerRight}
                {!headerRight && costPerUnit > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{formatCost(costPerUnit)} / unit</Text>
                    </View>
                )}
            </View>

            <View style={styles.sliderContainer}>
                <PercentageSelector
                    label={t('ui.targetLevel')}
                    value={targetValue}
                    min={minValue}
                    max={maxValue}
                    onChange={setTargetValue}
                />
            </View>

            <View style={styles.footer}>
                <View>
                    {delta !== 0 && (
                        <>
                            <Text style={styles.costLabel}>
                                {isIncrease ? 'Cost' : 'Refund'}
                            </Text>
                            <Text style={[
                                styles.costValue,
                                isIncrease && styles.costValueRed,
                                isDecrease && styles.costValueGreen
                            ]}>
                                {isIncrease ? '-' : '+'}{formatCost(totalCost)}
                            </Text>
                        </>
                    )}
                </View>

                {/* Only show button if there is a change */}
                {delta !== 0 && (
                    <GameButton
                        title={t('ui.confirm')}
                        onPress={handleSave}
                        variant='primary'
                        style={{ height: 36, paddingHorizontal: 16, paddingVertical: 0, minWidth: 80 }}
                        textStyle={{ fontSize: 12, fontWeight: '800' }}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#0B0635', // Dark Gray
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        gap: theme.spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.md,
        backgroundColor: '#0B0635', // Light Gray for icon box
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        fontSize: 20,
    },
    title: {
        color: '#FFFFFF', // White
        fontSize: theme.typography.body,
        fontWeight: '700',
    },
    subtitle: {
        color: 'rgba(255,255,255,0.48)', // Text Secondary
        fontSize: theme.typography.caption,
    },
    badge: {
        marginLeft: 'auto',
        backgroundColor: '#0B0635',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.radius.sm,
    },
    badgeText: {
        color: 'rgba(255,255,255,0.48)',
        fontSize: theme.typography.caption,
        fontWeight: '600',
    },
    sliderContainer: {
        gap: 4,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        color: 'rgba(255,255,255,0.48)',
        fontSize: theme.typography.caption,
    },
    value: {
        color: '#C8C0EF', // Apple Blue for stat values
        fontSize: theme.typography.body,
        fontWeight: '700',
    },
    valueIncrease: {
        color: theme.colors.accent,
    },
    valueDecrease: {
        color: theme.colors.success,
    },
    limitLabel: {
        color: 'rgba(255,255,255,0.48)',
        fontSize: 10,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 0,
        paddingTop: 6,
        minHeight: 36,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
    },
    costLabel: {
        color: 'rgba(255,255,255,0.48)',
        fontSize: theme.typography.caption,
    },
    costValue: {
        fontSize: theme.typography.body,
        fontWeight: '700',
    },
    costValueRed: {
        color: theme.colors.error,
    },
    costValueGreen: {
        color: theme.colors.success,
    },
});

export default ManagementCard;
