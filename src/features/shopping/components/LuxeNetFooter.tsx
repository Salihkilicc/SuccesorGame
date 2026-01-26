import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../../core/theme';

interface LuxeNetFooterProps {
    style?: any;
}

const LuxeNetFooter: React.FC<LuxeNetFooterProps> = ({ style }) => {
    return (
        <View style={[styles.container, style]}>
            {/* Divider Line */}
            <View style={styles.divider} />

            {/* Slogan */}
            <Text style={styles.slogan}>"Redefining Luxury since 2024"</Text>

            {/* Links Row */}
            <View style={styles.linksRow}>
                <Pressable><Text style={styles.linkText}>Privacy Policy</Text></Pressable>
                <Text style={styles.separator}>|</Text>
                <Pressable><Text style={styles.linkText}>Terms of Service</Text></Pressable>
                <Text style={styles.separator}>|</Text>
                <Pressable><Text style={styles.linkText}>Careers</Text></Pressable>
            </View>

            {/* Copyright */}
            <Text style={styles.copyright}>© 2026 LuxeNet Enterprises. All rights reserved.</Text>

            <Text style={styles.version}>v2.4.0-stable</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1a1a1a',
        paddingVertical: 30,
        paddingHorizontal: 20,
        alignItems: 'center',
        marginTop: 40,
        borderTopWidth: 1,
        borderTopColor: '#3A3A3A',
    },
    divider: {
        height: 1,
        backgroundColor: '#444',
        width: '60%',
        marginBottom: 20,
    },
    slogan: {
        color: '#BDC3C7',
        fontStyle: 'italic',
        fontSize: 14,
        marginBottom: 20,
        opacity: 0.8,
    },
    linksRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        gap: 10,
    },
    linkText: {
        color: '#95A5A6',
        fontSize: 12,
        fontWeight: '500',
    },
    separator: {
        color: '#555',
        fontSize: 12,
        marginHorizontal: 5,
    },
    copyright: {
        color: '#7F8C8D',
        fontSize: 10,
        textAlign: 'center',
        marginBottom: 5,
    },
    version: {
        color: '#555',
        fontSize: 9,
    },
});

export default LuxeNetFooter;
