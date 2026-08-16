// src/features/profile/components/CeoStatusHeader.tsx
//
// ============================================================================
//  CEO IDENTITY HEADER CARD
// ============================================================================
//
//  Clean, solid executive navy/blue card showing CEO avatar monogram,
//  full name, and corporate role using the game's signature electric blue tone.
//
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../core/theme';

interface CeoStatusHeaderProps {
    ceoFullName: string;
    companyName: string;
}

export const CeoStatusHeader: React.FC<CeoStatusHeaderProps> = ({
    ceoFullName,
    companyName,
}) => {
    const initials = ceoFullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() || 'CEO';

    return (
        <View style={styles.card}>
            <View style={styles.topRow}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={styles.nameBlock}>
                    <Text style={styles.ceoName} numberOfLines={1}>
                        {ceoFullName}
                    </Text>
                    <Text style={styles.subtitle}>
                        Chief Executive Officer • <Text style={styles.companyHighlight}>{companyName}</Text>
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#183852', // Solid rich executive navy blue fill, NO border
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#0D2335',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    nameBlock: {
        flex: 1,
        justifyContent: 'center',
    },
    ceoName: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 3,
    },
    subtitle: {
        color: '#7DD3FC',
        fontSize: 13,
        fontWeight: '500',
    },
    companyHighlight: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
});

export default CeoStatusHeader;
