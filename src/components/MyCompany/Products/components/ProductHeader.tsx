import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../../core/theme';

interface Props {
    name: string;
    type: string;
}

const ProductHeader = ({ name, type }: Props) => {
    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Text style={styles.iconText}>{name.charAt(0)}</Text>
            </View>
            <View>
                <Text style={styles.title}>{name}</Text>
                <Text style={styles.subtitle}>{type}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingBottom: 8,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: theme.colors.cardSoft,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    iconText: {
        fontSize: 24,
        fontWeight: '800',
        color: theme.colors.primary,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.textPrimary,
    },
    subtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
});

export default ProductHeader;
