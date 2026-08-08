import React from 'react';
import { t, useLocale } from '../../../../../core/i18n';
import { View, Text, Pressable, StyleSheet } from 'react-native';

type BlackMarketMenuViewProps = {
    onSelectArt: () => void;
    onSelectAntique: () => void;
    onSelectJewel: () => void;
    onSelectWeapons: () => void;
    onSelectSubstances: () => void;
};

const MenuButton = ({ icon, title, subtitle, onPress, danger }: any) => (
    <Pressable
        style={({ pressed }) => [
            styles.menuButton,
            danger && styles.dangerButton,
            pressed && styles.pressed
        ]}
        onPress={onPress}
    >
        <Text style={styles.menuIcon}>{icon}</Text>
        <View>
            <Text style={[styles.menuTitle, danger && styles.dangerText]}>{title}</Text>
            <Text style={styles.menuSubtitle}>{subtitle}</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
    </Pressable>
);

const BlackMarketMenuView = ({
    onSelectArt,
    onSelectAntique,
    onSelectJewel,
    onSelectWeapons,
    onSelectSubstances,
}: BlackMarketMenuViewProps) => {
    useLocale();
    return (
        <View style={styles.menuContainer}>
            <Text style={styles.headerTitle}>{t('life.theUnderground')}</Text>
            <Text style={styles.headerSubtitle}>{t('life.moneyTalksSilencePays')}</Text>

            <View style={styles.buttonsContainer}>
                <MenuButton
                    icon="🎨"
                    title={t('life.artThief')}
                    subtitle={t('life.stolenMasterpieces')}
                    onPress={onSelectArt}
                />
                <MenuButton
                    icon="🏺"
                    title={t('life.antiqueDealer')}
                    subtitle={t('life.historyForSale')}
                    onPress={onSelectAntique}
                />
                <MenuButton
                    icon="💎"
                    title={t('life.jewelDealer')}
                    subtitle={t('life.royalGems')}
                    onPress={onSelectJewel}
                />
                <MenuButton
                    icon="🔫"
                    title={t('life.armsDealer')}
                    subtitle={t('life.lethalHardware')}
                    onPress={onSelectWeapons}
                    danger
                />
                <MenuButton
                    icon="💊"
                    title={t('life.streetDealer')}
                    subtitle={t('life.quickFix')}
                    onPress={onSelectSubstances}
                    danger
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    menuContainer: {
        padding: 20,
        alignItems: 'center',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: 4,
        marginBottom: 8,
    },
    headerSubtitle: {
        color: '#FFFFFF',
        fontSize: 14,
        marginBottom: 50,
        fontStyle: 'italic',
    },
    buttonsContainer: {
        width: '100%',
        gap: 16,
    },
    menuButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#020626',
        padding: 20,
        borderRadius: 4,
        borderLeftWidth: 3,
        borderLeftColor: 'rgba(255,255,255,0.06)',
    },
    dangerButton: {
        borderLeftColor: '#900',
        backgroundColor: '#020626',
    },
    pressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.8,
    },
    menuIcon: {
        fontSize: 24,
        marginRight: 20,
    },
    menuTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    dangerText: {
        color: '#C734CA',
    },
    menuSubtitle: {
        color: '#FFFFFF',
        fontSize: 12,
    },
    arrow: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
        marginLeft: 'auto',
    },
});

export default BlackMarketMenuView;
