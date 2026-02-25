import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../../../../core/theme';

type SupplementsViewProps = {
    onBack: () => void;
};

const SupplementsView = ({ onBack }: SupplementsViewProps) => {
    return (
        <View style={styles.subViewContainer}>
            <Text style={styles.subTitle}>LOCKER ROOM</Text>
            <Text style={styles.subSubtitle}>Supplements & Boosters</Text>
            <View style={styles.list}>
                {[
                    { name: 'Protein Shake', effect: '+5% Muscle Gains', icon: '🥛' },
                    { name: 'Creatine', effect: '+10% Strength', icon: '💊' },
                    { name: 'Pre-Workout', effect: '+15% Energy', icon: '⚡' },
                ].map(item => (
                    <TouchableOpacity key={item.name} style={styles.supplementCard} activeOpacity={0.7}>
                        <Text style={styles.supplementIcon}>{item.icon}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.supplementName}>{item.name}</Text>
                            <Text style={styles.supplementEffect}>{item.effect}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
            <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
                <Text style={styles.backText}>← Back to Gym</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    subViewContainer: { flex: 1, paddingHorizontal: 20 },
    subTitle: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', marginBottom: 10 },
    subSubtitle: { color: '#C0C0C0', textAlign: 'center', marginBottom: 20 },
    list: { gap: 12 },
    supplementCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#000000', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#C0C0C0' },
    supplementIcon: { fontSize: 24, marginRight: 12 },
    supplementName: { color: '#FFFFFF', fontWeight: '700' },
    supplementEffect: { color: '#FF6F00', fontSize: 12 },
    backBtn: { marginTop: 30, alignItems: 'center', padding: 10 },
    backText: { color: '#C0C0C0', fontSize: 14 },
});

export default SupplementsView;
