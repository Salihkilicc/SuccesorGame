import React from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../../core/theme';

interface LuxeNetFooterProps {
    style?: any;
}

const LuxeNetFooter: React.FC<LuxeNetFooterProps> = ({ style }) => {
    useLocale();
    return (
        <View style={[styles.container, style]}>
            {/* Divider Line */}
            <View style={styles.divider} />

            {/* Slogan */}
            <Text style={styles.slogan}>"Redefining Luxury since 2024"</Text>

            {/* Links Row */}
            <View style={styles.linksRow}>
                <Pressable><Text style={styles.linkText}>{t('ui.privacyPolicy')}</Text></Pressable>
                <Text style={styles.separator}>|</Text>
                <Pressable><Text style={styles.linkText}>{t('ui.termsOfService')}</Text></Pressable>
                <Text style={styles.separator}>|</Text>
                <Pressable><Text style={styles.linkText}>{t('ui.careers')}</Text></Pressable>
            </View>

            {/* Copyright */}
            <Text style={styles.copyright}>© 2026 LuxeNet Enterprises. All rights reserved.</Text>

            <Text style={styles.version}>v2.4.0-stable</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1C242C',
        paddingVertical: 30,
        paddingHorizontal: 20,
        alignItems: 'center',
        marginTop: 40,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
    },
    divider: {
        height: 1,
        backgroundColor: '#323A40',
        width: '60%',
        marginBottom: 20,
    },
    slogan: {
        color: '#FFFFFF',
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
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '500',
    },
    separator: {
        color: '#FFFFFF',
        fontSize: 12,
        marginHorizontal: 5,
    },
    copyright: {
        color: '#FFFFFF',
        fontSize: 10,
        textAlign: 'center',
        marginBottom: 5,
    },
    version: {
        color: '#FFFFFF',
        fontSize: 9,
    },
});

export default LuxeNetFooter;
