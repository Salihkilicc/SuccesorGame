import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { theme } from '../../theme';
import GameButton from '../common/GameButton';

type ManagementCardProps = {
    title: string;
    icon: string;
    currentValue: number;
    maxValue: number;
    minValue?: number;
    costPerUnit: number;
    onSave: (delta: number) => void;
};

const ManagementCard = ({
    title,
    icon,
    currentValue,
    maxValue,
    minValue = 0,
    costPerUnit,
    onSave,
}: ManagementCardProps) => {
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

    const formatCost = (value: number) => {
        if (value >= 1_000_000) {
            return `$${(value / 1_000_000).toFixed(1)}M`;
        }
        if (value >= 1_000) {
            return `$${(value / 1_000).toFixed(1)}K`;
        }
        return `$${value}`;
    };

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.iconBox}>
                    <Text style={styles.icon}>{icon}</Text>
                </View>
                <View>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.subtitle}>Current: {currentValue.toLocaleString()}</Text>
                </View>
                {costPerUnit > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{formatCost(costPerUnit)} / unit</Text>
                    </View>
                )}
            </View>

            <View style={styles.sliderContainer}>
                <View style={styles.rowBetween}>
                    <Text style={styles.label}>Target Level</Text>
                    <Text style={[
                        styles.value,
                        isIncrease && styles.valueIncrease,
                        isDecrease && styles.valueDecrease
                    ]}>
                        {targetValue.toLocaleString()} {delta !== 0 && `(${delta > 0 ? '+' : ''}${delta})`}
                    </Text>
                </View>
                <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={minValue}
                    maximumValue={maxValue}
                    step={1}
                    value={targetValue}
                    onValueChange={setTargetValue}
                    minimumTrackTintColor={isDecrease ? theme.colors.success : theme.colors.accent}
                    maximumTrackTintColor={theme.colors.cardSoft}
                    thumbTintColor={isDecrease ? theme.colors.success : theme.colors.accent}
                />
                <View style={styles.rowBetween}>
                    <Text style={styles.limitLabel}>Min: {minValue.toLocaleString()}</Text>
                    <Text style={styles.limitLabel}>Max: {maxValue.toLocaleString()}</Text>
                </View>
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
                    {delta === 0 && (
                        <>
                            <Text style={styles.costLabel}>No Change</Text>
                            <Text style={styles.costValue}>$0</Text>
                        </>
                    )}
                </View>
                <GameButton
                    title={delta !== 0 ? "CONFIRM CHANGES" : "NO CHANGE"}
                    onPress={handleSave}
                    disabled={delta === 0}
                    variant={delta !== 0 ? 'primary' : 'ghost'}
                    style={{ width: 140 }}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
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
        backgroundColor: theme.colors.cardSoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        fontSize: 20,
    },
    title: {
        color: theme.colors.textPrimary,
        fontSize: theme.typography.body,
        fontWeight: '700',
    },
    subtitle: {
        color: theme.colors.textSecondary,
        fontSize: theme.typography.caption,
    },
    badge: {
        marginLeft: 'auto',
        backgroundColor: theme.colors.cardSoft,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.radius.sm,
    },
    badgeText: {
        color: theme.colors.textSecondary,
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
        color: theme.colors.textSecondary,
        fontSize: theme.typography.caption,
    },
    value: {
        color: theme.colors.textPrimary,
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
        color: theme.colors.textMuted,
        fontSize: 10,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
        paddingTop: theme.spacing.sm,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.colors.border,
    },
    costLabel: {
        color: theme.colors.textSecondary,
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
