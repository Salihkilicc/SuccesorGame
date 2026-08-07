import React from 'react';
import { t, useLocale } from '../../../../../core/i18n';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../../../../core/theme';

type GymResultViewProps = {
    lastResult: any;
    onClose: () => void;
};

const GymResultView = ({ lastResult, onClose }: GymResultViewProps) => {
    useLocale();
    return (
        <View style={styles.subViewContainer}>
            <Text style={styles.resultTitle}>{t('life.workoutComplete2')}</Text>
            {lastResult && (
                <>
                    <Text style={styles.resultMessage}>{lastResult.message || 'Great session!'}</Text>
                    {lastResult.enjoyment !== undefined && (
                        <View style={styles.enjoymentBar}>
                            <Text style={styles.enjoymentLabel}>{t('life.enjoyment')}</Text>
                            <View style={styles.barBg}>
                                <View style={[styles.barFill, { width: `${lastResult.enjoyment}%` }]} />
                            </View>
                            <Text style={styles.enjoymentValue}>{lastResult.enjoyment}%</Text>
                        </View>
                    )}
                    {lastResult.promoted && (
                        <View style={styles.promotionBadge}>
                            <Text style={styles.promotionText}>🎉 PROMOTED TO {lastResult.newBelt?.toUpperCase()}!</Text>
                        </View>
                    )}
                </>
            )}
            <TouchableOpacity
                onPress={onClose}
                style={styles.doneBtn}
                activeOpacity={0.7}>
                <Text style={styles.doneText}>{t('life.continue')}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    subViewContainer: { flex: 1, paddingHorizontal: 20 },
    resultTitle: { fontSize: 28, fontWeight: '900', color: '#E3A857', textAlign: 'center', marginTop: 40 },
    resultMessage: { color: '#E9B8C9', textAlign: 'center', marginTop: 10, fontSize: 16 },
    enjoymentBar: { marginTop: 30, alignItems: 'center' },
    enjoymentLabel: { color: '#E9B8C9', fontSize: 12, marginBottom: 8 },
    barBg: { width: '80%', height: 10, backgroundColor: '#000000', borderRadius: 5, overflow: 'hidden' },
    barFill: { height: '100%', backgroundColor: '#E3A857' },
    enjoymentValue: { color: '#FFFFFF', marginTop: 5 },
    promotionBadge: { marginTop: 20, backgroundColor: '#000000', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#E3A857' },
    promotionText: { color: '#E3A857', fontWeight: '800', textAlign: 'center' },
    doneBtn: { backgroundColor: '#E3A857', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 40 },
    doneText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
});

export default GymResultView;
