import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../../theme';
import GameButton from '../../../common/GameButton';
import SectionCard from '../../../common/SectionCard';

interface Props {
    allocated: number;
    onAllocChange: (newValue: number) => void;
}

const ProductProductionSection = ({ allocated, onAllocChange }: Props) => {
    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>PRODUCTION CAPACITY</Text>

            <View style={styles.row}>
                <View style={{ flex: 1 }}>
                    <SectionCard
                        title="Allocated Units"
                        rightText={allocated.toLocaleString()}
                    />
                </View>

                <View style={styles.controls}>
                    <GameButton
                        title="-100"
                        variant="secondary"
                        onPress={() => onAllocChange(allocated - 100)}
                        style={styles.controlBtn}
                        textStyle={{ fontSize: 12 }}
                    />
                    <GameButton
                        title="+100"
                        variant="secondary"
                        onPress={() => onAllocChange(allocated + 100)}
                        style={styles.controlBtn}
                        textStyle={{ fontSize: 12 }}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 4,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        color: theme.colors.textMuted,
        letterSpacing: 0.5,
        marginLeft: 4,
        marginBottom: 4,
    },
    row: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    controls: {
        width: 100,
        gap: 4,
        flexDirection: 'row',
    },
    controlBtn: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 0,
        minHeight: 0,
    },
});

export default ProductProductionSection;
