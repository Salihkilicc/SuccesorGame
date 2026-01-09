import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../../../../core/theme';

type GymResultViewProps = {
    lastResult: any;
    onClose: () => void;
};

const GymResultView = ({ lastResult, onClose }: GymResultViewProps) => {
    return (
        <View style={styles.subViewContainer}>
            <Text style={styles.resultTitle}>WORKOUT COMPLETE!</Text>
            {lastResult && (
                <>
                    <Text style={styles.resultMessage}>{lastResult.message || 'Great session!'}</Text>
                    {lastResult.enjoyment !== undefined && (
                        <View style={styles.enjoymentBar}>
                            <Text style={styles.enjoymentLabel}>ENJOYMENT</Text>
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
                <Text style={styles.doneText}>CONTINUE</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    subViewContainer: { flex: 1, paddingHorizontal: 20 },
    resultTitle: { fontSize: 28, fontWeight: '900', color: theme.colors.success, textAlign: 'center', marginTop: 40 },
    resultMessage: { color: '#CCC', textAlign: 'center', marginTop: 10, fontSize: 16 },
    enjoymentBar: { marginTop: 30, alignItems: 'center' },
    enjoymentLabel: { color: '#666', fontSize: 12, marginBottom: 8 },
    barBg: { width: '80%', height: 10, backgroundColor: '#222', borderRadius: 5, overflow: 'hidden' },
    barFill: { height: '100%', backgroundColor: theme.colors.success },
    enjoymentValue: { color: '#FFF', marginTop: 5 },
    promotionBadge: { marginTop: 20, backgroundColor: 'rgba(212, 175, 55, 0.2)', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.primary },
    promotionText: { color: theme.colors.primary, fontWeight: '800', textAlign: 'center' },
    doneBtn: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 40 },
    doneText: { color: '#000', fontWeight: '800', fontSize: 16 },
});

export default GymResultView;
