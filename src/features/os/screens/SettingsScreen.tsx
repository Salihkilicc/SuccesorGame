import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Pressable,
    StatusBar,
    ScrollView,
    Switch,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSettingsStore } from '../../../core/store/useSettingsStore';
import { startNewGame } from '../../../core/newGame';
import { LOCALES, t, useLocale, useLocaleStore } from '../../../core/i18n';
// START_EMPLOYEES was only read by the confirmation box removed below.
import { theme } from '../../../core/theme';
import ScreenHeader from '../../../components/common/ScreenHeader';

// ─── Settings Row ────────────────────────────────────────────────────────────

type SettingsRowProps = {
    icon: string;
    label: string;
    value?: boolean;
    onToggle?: () => void;
    onPress?: () => void;
    isFirst?: boolean;
    isLast?: boolean;
    color?: string;
};

const SettingsRow = ({
    icon,
    label,
    value,
    onToggle,
    onPress,
    isFirst,
    isLast,
    color = theme.colors.primary,
}: SettingsRowProps) => {
    return (
        <TouchableOpacity
            style={[
                styles.row,
                isFirst && styles.rowFirst,
                isLast && styles.rowLast,
            ]}
            onPress={onPress}
            disabled={!onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            <View style={styles.rowLeft}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name={icon} size={20} color={color} />
                </View>
                <Text style={styles.rowLabel}>{label}</Text>
            </View>

            {onToggle !== undefined ? (
                <Switch
                    value={value}
                    onValueChange={onToggle}
                    trackColor={{ false: '#1C242C', true: '#FF8A8A' }}
                    thumbColor={value ? '#FFFFFF' : 'rgba(255,255,255,0.48)'}
                    ios_backgroundColor="#1C242C"
                />
            ) : (
                <MaterialCommunityIcons name="chevron-right" size={20} color="#666E70" />
            )}
        </TouchableOpacity>
    );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

const SettingsScreen = () => {
    const navigation = useNavigation();
    // Dil degisince bu ekran yeniden cizilsin.
    const locale = useLocale();
    const insets = useSafeAreaInsets();

    const {
        isMusicEnabled,
        isSoundEnabled,
        isNotificationsEnabled,
        isHapticsEnabled,
        toggleMusic,
        toggleSound,
        toggleNotifications,
        toggleHaptics,
    } = useSettingsStore();

    const handleUnavailable = () => {
        Alert.alert('Successor OS', 'This document is currently unavailable.');
    };

    /**
     * Temiz yeni oyun. startNewGame() tum store'lari ve AsyncStorage'i
     * temizleyip initialStatsState, whose figures are the single source (see START_EMPLOYEES).
     */
    const handleNewGame = () => {
        Alert.alert(
            'New Game',
            'All progress will be erased and a fresh run will be set up. Are you sure?',
            [
                { text: t('os.cancel'), style: 'cancel' },
                {
                    text: t('os.reset'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await startNewGame();
                            navigation.goBack();
                            // ------------------------------------------------------
                            //  NO SECOND BOX
                            // ------------------------------------------------------
                            //  There was a confirmation here - "a fresh run has
                            //  been set up, you have N employees" - dismissed
                            //  immediately after the player had already confirmed
                            //  the destructive one. Two taps to be told a thing
                            //  the screen behind the box is already showing.
                            //
                            //  The player is now looking at a company with 22
                            //  people and a cold line, which says it better than
                            //  a modal does.
                            //
                            //  `newgame.freshStartBody` stays in the catalogue; if
                            //  a first-run welcome is ever wanted it belongs on the
                            //  home screen and not on top of it.
                            // ------------------------------------------------------
                        } catch (e) {
                            console.error('[Settings] Yeni oyun baslatilamadi', e);
                            Alert.alert('Error', 'Could not start a new game. Check the console.');
                        }
                    },
                },
            ],
        );
    };

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />
            <View style={styles.safeArea}>
                <ScreenHeader title={t('os.settings')} />

                {/* ── Content ── */}
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ============================================================
                        DİL
                        ============================================================
                        Once HomeScreen icinde `useState<'EN'|'TR'>('EN')` ve bir
                        dugme vardi. Basinca yalnizca o ekrandaki etiket
                        degisiyordu, hicbir metin cevrilmiyordu ve deger ekran
                        kapaninca kayboluyordu. Artik tek kaynak ve kalici.
                       ============================================================ */}
                    <Text style={styles.sectionTitle}>{t('settings.language').toUpperCase()}</Text>
                    <View style={styles.group}>
                        {LOCALES.map((l, i) => (
                            <React.Fragment key={l.code}>
                                {i > 0 && <View style={styles.divider} />}
                                <TouchableOpacity
                                    style={styles.langRow}
                                    onPress={() => useLocaleStore.getState().setLocale(l.code)}
                                    activeOpacity={0.7}
                                >
                                    <MaterialCommunityIcons
                                        name="translate"
                                        size={22}
                                        color={locale === l.code ? '#FF8A8A' : 'rgba(255,255,255,0.48)'}
                                    />
                                    <Text
                                        style={[
                                            styles.langLabel,
                                            locale === l.code && styles.langLabelActive,
                                        ]}
                                    >
                                        {l.native}
                                    </Text>
                                    {locale === l.code && <Text style={styles.langCheck}>✓</Text>}
                                </TouchableOpacity>
                            </React.Fragment>
                        ))}
                    </View>
                    <Text style={styles.langNote}>{t('settings.languageNote')}</Text>

                    {/* Preferences Group */}
                    <Text style={styles.sectionTitle}>{t('os.preferences')}</Text>
                    <View style={styles.group}>
                        <SettingsRow
                            icon="music-note"
                            label={t('os.music')}
                            value={isMusicEnabled}
                            onToggle={toggleMusic}
                            isFirst
                            color="#05A8F6"
                        />
                        <View style={styles.divider} />
                        <SettingsRow
                            icon="volume-high"
                            label={t('os.soundEffects')}
                            value={isSoundEnabled}
                            onToggle={toggleSound}
                            color="#CFD0D2"
                        />
                        <View style={styles.divider} />
                        <SettingsRow
                            icon="bell"
                            label={t('os.notifications')}
                            value={isNotificationsEnabled}
                            onToggle={toggleNotifications}
                            color={theme.colors.primary}
                        />
                        <View style={styles.divider} />
                        <SettingsRow
                            icon="vibrate"
                            label={t('os.haptics')}
                            value={isHapticsEnabled}
                            onToggle={toggleHaptics}
                            isLast
                            color={theme.colors.primary}
                        />
                    </View>

                    {/* Legal & Support Group */}
                    <Text style={styles.sectionTitle}>{t('os.about')}</Text>
                    <View style={styles.group}>
                        <SettingsRow
                            icon="file-document-outline"
                            label={t('os.termsConditions')}
                            onPress={handleUnavailable}
                            isFirst
                        />
                        <View style={styles.divider} />
                        <SettingsRow
                            icon="shield-check-outline"
                            label={t('os.privacyPolicy')}
                            onPress={handleUnavailable}
                        />
                        <View style={styles.divider} />
                        <SettingsRow
                            icon="help-circle-outline"
                            label={t('os.helpSupport')}
                            onPress={handleUnavailable}
                            isLast
                        />
                    </View>

                    {/* Oyun Yonetimi */}
                    <Text style={styles.sectionTitle}>{t('os.game')}</Text>
                    <View style={styles.group}>
                        <SettingsRow
                            icon="restart"
                            label={t('os.newGame')}
                            onPress={handleNewGame}
                            isFirst
                            isLast
                        />
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerVersion}>{t('os.successorOsV100')}</Text>
                        <Text style={styles.footerTagline}>{t('os.designedForBillionaires')}</Text>
                    </View>
                </ScrollView>

                {/* Universal Crystal Navigation Bar */}
            </View>
        </View>
    );
};

export default SettingsScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    langRow: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingVertical: 15, paddingHorizontal: 16,
    },
    langLabel: { flex: 1, fontSize: 15, color: 'rgba(255,255,255,0.48)', fontWeight: '600' },
    langLabelActive: { color: '#FFFFFF' },
    langCheck: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: '800' },
    langNote: { fontSize: 11, color: 'rgba(255,255,255,0.48)', marginTop: 8, marginBottom: 4, paddingHorizontal: 4 },
    root: {
        flex: 1,
        backgroundColor: '#434B50',
    },
    safeArea: {
        flex: 1,
    },

    // ── Header ────────────────────────────────────────────────────────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(5,168,246,0.15)',
        minHeight: 70,
    },
    backBtn: {
        width: 38,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        left: 16,
        bottom: 12,
        zIndex: 10,
        backgroundColor: 'rgba(5,168,246,0.08)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(5,168,246,0.2)',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '300',
        color: '#FFFFFF',
        letterSpacing: 6,
        textTransform: 'uppercase',
    },
    headerAccent: {
        width: 32,
        height: 2,
        backgroundColor: '#434B50',
        marginTop: 6,
        borderRadius: 2,
        shadowColor: '#1C242C',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
        elevation: 4,
    },

    // ── Content ─────────────────────────────────────────────────────────────
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 140,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.48)',
        letterSpacing: 2,
        marginLeft: 16,
        marginBottom: 8,
    },
    group: {
        backgroundColor: '#434B50',
        borderRadius: 16,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: '#434B50',
    },
    rowFirst: {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    rowLast: {
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    iconContainer: {
        width: 30,
        height: 30,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowLabel: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '500',
        letterSpacing: 0.3,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginLeft: 60, // Align with text
    },

    // ── Footer ──────────────────────────────────────────────────────────────
    footer: {
        alignItems: 'center',
        marginTop: 20,
        opacity: 0.6,
    },
    footerVersion: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.48)',
        fontWeight: '600',
        letterSpacing: 1,
        marginBottom: 4,
    },
    footerTagline: {
        fontSize: 11,
        color: '#FFFFFF',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
});
