import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '../../../../../core/theme';

type NightOutFooterViewProps = {
    totalCost: number;
    onConfirm: () => void;
    onClose: () => void;
};

const NightOutFooterView = ({ totalCost, onConfirm, onClose }: NightOutFooterViewProps) => {
    return (
        <>
            <View style={styles.footer}>
                <View>
                    <Text style={styles.totalLabel}>TOTAL COST</Text>
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
                    <Text style={styles.confirmButtonText}>GO NIGHT OUT</Text>
                </Pressable>
            </View>

            <Pressable onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>Cancel</Text>
            </Pressable>
        </>
    );
};

const styles = StyleSheet.create({
    footer: {
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#C8B6FF',
        paddingTop: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        color: '#4CC9F0',
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
        backgroundColor: '#C8B6FF',
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
        color: '#4CC9F0',
        fontSize: 14
    }
});

export default NightOutFooterView;
