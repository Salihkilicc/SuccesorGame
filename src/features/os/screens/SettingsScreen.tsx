// src/features/os/screens/SettingsScreen.tsx
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
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { theme } from '../../../core/theme';
import { t } from '../../../core/i18n';
import { useSettingsLogic } from '../logic/useSettingsLogic';
import { FEATURES } from '../../../core/featureFlags';

// ─── Settings Row Component ──────────────────────────────────────────────────

interface SettingsRowProps {
    icon: string;
    label: string;
    description?: string;
    value?: boolean;
    onToggle?: () => void;
    onPress?: () => void;
    isFirst?: boolean;
    isLast?: boolean;
    iconColor?: string;
    isDestructive?: boolean;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
    icon,
    label,
    description,
    value,
    onToggle,
    onPress,
    isFirst,
    isLast,
    iconColor = theme.colors.primary,
    isDestructive = false,
}) => {
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
                <View
                    style={[
                        styles.iconContainer,
                        {
                            backgroundColor: isDestructive
                                ? 'rgba(255,138,138,0.12)'
                                : 'rgba(255,255,255,0.06)',
                        },
                    ]}
                >
                    <MaterialCommunityIcons
                        name={icon}
                        size={20}
                        color={isDestructive ? theme.colors.negative : iconColor}
                    />
                </View>
                <View style={styles.labelWrapper}>
                    <Text
                        style={[
                            styles.rowLabel,
                            isDestructive && styles.destructiveLabel,
                        ]}
                    >
                        {label}
                    </Text>
                    {description ? (
                        <Text style={styles.rowDescription} numberOfLines={1}>
                            {description}
                        </Text>
                    ) : null}
                </View>
            </View>

            {onToggle !== undefined ? (
                <Switch
                    value={value}
                    onValueChange={onToggle}
                    trackColor={{
                        false: theme.colors.surfaceRaised,
                        true: theme.colors.primary,
                    }}
                    thumbColor={value ? '#FFFFFF' : 'rgba(255,255,255,0.6)'}
                    ios_backgroundColor={theme.colors.surfaceRaised}
                />
            ) : (
                <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={isDestructive ? theme.colors.negative : theme.colors.borderStrong}
                />
            )}
        </TouchableOpacity>
    );
};

// ─── Main Settings Screen ─────────────────────────────────────────────────────

const SettingsScreen: React.FC = () => {
    const { state, actions } = useSettingsLogic();
    const {
        locale,
        locales,
        isLanguageExpanded,
        isMusicEnabled,
        isSoundEnabled,
        isNotificationsEnabled,
        isHapticsEnabled,
    } = state;

    const currentLocaleObj = locales.find((l) => l.code === locale) || locales[0];

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />

            <View style={styles.safeArea}>
                <ScreenHeader title={t('os.settings')} />

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Section: Language (Collapsible Compact Row) ── */}
                    <Text style={styles.sectionTitle}>{t('settings.language').toUpperCase()}</Text>
                    <View style={styles.group}>
                        <TouchableOpacity
                            style={[
                                styles.row,
                                styles.rowFirst,
                                !isLanguageExpanded && styles.rowLast,
                            ]}
                            onPress={actions.toggleLanguageExpanded}
                            activeOpacity={0.7}
                        >
                            <View style={styles.rowLeft}>
                                <View style={[styles.iconContainer, { backgroundColor: 'rgba(5,168,246,0.12)' }]}>
                                    <MaterialCommunityIcons
                                        name="translate"
                                        size={20}
                                        color={theme.colors.primary}
                                    />
                                </View>
                                <View style={styles.labelWrapper}>
                                    <Text style={styles.rowLabel}>{t('settings.language')}</Text>
                                </View>
                            </View>

                            <View style={styles.langSelectorBadge}>
                                <Text style={styles.langBadgeText}>
                                    {/* A language picker names each language in
                                        ITS OWN language. Translating 'English'
                                        into Turkish would hide the option from
                                        the person looking for it.
                                        @english-ok a language name, see above */}
                                    {currentLocaleObj.code === 'tr' ? '🇹🇷 Türkçe' : '🇬🇧 English'}
                                </Text>
                                <MaterialCommunityIcons
                                    name="chevron-down"
                                    size={18}
                                    color={theme.colors.primary}
                                    style={{
                                        transform: [{ rotate: isLanguageExpanded ? '180deg' : '0deg' }],
                                    }}
                                />
                            </View>
                        </TouchableOpacity>

                        {/* Collapsible language options list */}
                        {isLanguageExpanded && (
                            <View style={styles.langDropdownContent}>
                                {locales.map((l, index) => {
                                    const isSelected = locale === l.code;
                                    const flag = l.code === 'tr' ? '🇹🇷' : '🇬🇧';
                                    const isLastItem = index === locales.length - 1;

                                    return (
                                        <React.Fragment key={l.code}>
                                            <View style={styles.divider} />
                                            <TouchableOpacity
                                                style={[
                                                    styles.langOptionRow,
                                                    isSelected && styles.langOptionRowSelected,
                                                    isLastItem && styles.rowLast,
                                                ]}
                                                onPress={() => actions.setLocale(l.code)}
                                                activeOpacity={0.7}
                                            >
                                                <View style={styles.langOptionLeft}>
                                                    <Text style={styles.langFlagText}>{flag}</Text>
                                                    <Text
                                                        style={[
                                                            styles.langOptionLabel,
                                                            isSelected && styles.langOptionLabelActive,
                                                        ]}
                                                    >
                                                        {l.native}
                                                    </Text>
                                                    <Text style={styles.langCodeBadge}>
                                                        ({l.code.toUpperCase()})
                                                    </Text>
                                                </View>
                                                {isSelected && (
                                                    <MaterialCommunityIcons
                                                        name="check-circle"
                                                        size={18}
                                                        color={theme.colors.primary}
                                                    />
                                                )}
                                            </TouchableOpacity>
                                        </React.Fragment>
                                    );
                                })}
                            </View>
                        )}
                    </View>

                    {/* ── Section: Preferences ── */}
                    <Text style={styles.sectionTitle}>{t('os.preferences').toUpperCase()}</Text>
                    <View style={styles.group}>
                        <SettingsRow
                            icon="music-note"
                            label={t('os.music')}
                            value={isMusicEnabled}
                            onToggle={actions.toggleMusic}
                            isFirst
                            iconColor={theme.colors.primary}
                        />
                        <View style={styles.divider} />
                        <SettingsRow
                            icon="volume-high"
                            label={t('os.soundEffects')}
                            value={isSoundEnabled}
                            onToggle={actions.toggleSound}
                            iconColor={theme.colors.rp}
                        />
                        <View style={styles.divider} />
                        <SettingsRow
                            icon="bell"
                            label={t('os.notifications')}
                            value={isNotificationsEnabled}
                            onToggle={actions.toggleNotifications}
                            iconColor={theme.colors.brand}
                        />
                        <View style={styles.divider} />
                        <SettingsRow
                            icon="vibrate"
                            label={t('os.haptics')}
                            value={isHapticsEnabled}
                            onToggle={actions.toggleHaptics}
                            isLast
                            iconColor={theme.colors.positive}
                        />
                    </View>

                    {/* ── Section: About / Legal ── */}
                    <Text style={styles.sectionTitle}>{t('os.about').toUpperCase()}</Text>
                    <View style={styles.group}>
                        <SettingsRow
                            icon="file-document-outline"
                            label={t('os.termsConditions')}
                            onPress={() => actions.handleUnavailable(t('os.termsConditions'))}
                            isFirst
                            iconColor={theme.categories.products}
                        />
                        <View style={styles.divider} />
                        <SettingsRow
                            icon="shield-check-outline"
                            label={t('os.privacyPolicy')}
                            onPress={() => actions.handleUnavailable(t('os.privacyPolicy'))}
                            iconColor={theme.categories.market}
                        />
                        <View style={styles.divider} />
                        <SettingsRow
                            icon="help-circle-outline"
                            label={t('os.helpSupport')}
                            onPress={() => actions.handleUnavailable(t('os.helpSupport'))}
                            isLast
                            iconColor={theme.categories.finance}
                        />
                    </View>

                    {/* ── Section: Game Reset ── */}
                    <Text style={styles.sectionTitle}>{t('os.game').toUpperCase()}</Text>
                    <View style={styles.group}>
                        <SettingsRow
                            icon="restart"
                            label={t('os.newGame')}
                            onPress={actions.handleNewGame}
                            isFirst
                            isDestructive
                        />
                        {/* ──────────────────────────────────────────────────
                            Under New Game, and second on purpose. It does
                            everything New Game does and one thing more, so it
                            reads as the larger version of the row above it
                            rather than as a different feature.

                            The description carries the whole warning in one
                            line: the panel that follows says it again, and a
                            player should not need to open a dialog to find
                            out what a button is for.
                           ────────────────────────────────────────────────── */}
                        <SettingsRow
                            icon="account-convert-outline"
                            label={t('os.changeCharacter')}
                            description={t('os.changeCharacterSub')}
                            onPress={actions.handleChangeCharacter}
                            isLast
                            isDestructive
                        />
                    </View>

                    {/* ──────────────────────────────────────────────────────
                        ADMIN

                        There has been a GodModeModal in this codebase for a
                        long time and NOTHING COULD REACH IT: its only door is
                        the Underworld screen, and `underworld` has been false
                        in featureFlags the whole time. A cheat nobody can
                        press is not a cheat, it is dead weight.

                        Here instead, because Settings is the one screen that
                        is always reachable and is where a player looks for a
                        switch.

                        BEHIND `FEATURES.godMode`, which is `__DEV__`. The
                        section does not exist in a release build - not
                        disabled, not hidden: not rendered. See
                        core/featureFlags.ts.
                       ────────────────────────────────────────────────────── */}
                    {(FEATURES.godMode || state.isAdminUnlocked) && (
                        <>
                            <Text style={styles.sectionTitle}>{t('os.admin').toUpperCase()}</Text>
                            <View style={styles.group}>
                                <SettingsRow
                                    icon="flash"
                                    label={t('os.adminUnlock')}
                                    description={t('os.adminUnlockSub')}
                                    onPress={actions.handleAdminUnlock}
                                    isFirst
                                    isLast
                                    iconColor={theme.colors.warning}
                                />
                            </View>
                        </>
                    )}

                    {/* ──────────────────────────────────────────────────────
                        THE FOOTER IS THE DOOR

                        Seven taps on the version line open the admin section
                        above. The rule is in core/adminGesture.ts; this is
                        only the surface it is pressed on.

                        No label, no hint until three from the end, and no
                        accessibility role: a control nobody can find by
                        accident is the entire point, and announcing it would
                        undo that. It stays a plain line of text that happens
                        to be pressable.
                       ────────────────────────────────────────────────────── */}
                    <View style={styles.footer}>
                        <Pressable onPress={actions.tapVersion} hitSlop={12}>
                            <Text style={styles.footerVersion}>{t('os.successorOsV100')}</Text>
                        </Pressable>
                        {state.adminTapsLeft !== null && (
                            <Text style={styles.footerVersion}>
                                {t('os.adminTapsLeft', { n: String(state.adminTapsLeft) })}
                            </Text>
                        )}
                        <Text style={styles.footerTagline}>{t('os.designedForBillionaires')}</Text>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
};

export default SettingsScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 120,
    },

    // ── Section Title ─────────────────────────────────────────────────────────
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.brandMuted,
        letterSpacing: 1.8,
        marginLeft: 12,
        marginBottom: 8,
    },

    // ── Group Card ────────────────────────────────────────────────────────────
    group: {
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
    },

    // ── Row ───────────────────────────────────────────────────────────────────
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 13,
        paddingHorizontal: 14,
        backgroundColor: theme.colors.surface,
    },
    rowFirst: {
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14,
    },
    rowLast: {
        borderBottomLeftRadius: 14,
        borderBottomRightRadius: 14,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    iconContainer: {
        width: 34,
        height: 34,
        borderRadius: 9,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    labelWrapper: {
        flex: 1,
    },
    rowLabel: {
        fontSize: 15,
        color: theme.colors.textPrimary,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    destructiveLabel: {
        color: theme.colors.negative,
        fontWeight: '600',
    },
    rowDescription: {
        fontSize: 12,
        color: theme.colors.textMuted,
        marginTop: 2,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: theme.colors.border,
        marginLeft: 60,
    },

    // ── Language Selector Compact & Collapsible ───────────────────────────────
    langSelectorBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(5,168,246,0.12)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(5,168,246,0.25)',
    },
    langBadgeText: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.highlight,
    },
    langDropdownContent: {
        backgroundColor: theme.colors.surfaceRaised,
    },
    langOptionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    langOptionRowSelected: {
        backgroundColor: 'rgba(5,168,246,0.08)',
    },
    langOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    langFlagText: {
        fontSize: 16,
    },
    langOptionLabel: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    langOptionLabelActive: {
        color: theme.colors.textPrimary,
        fontWeight: '700',
    },
    langCodeBadge: {
        fontSize: 11,
        color: theme.colors.textMuted,
        fontWeight: '600',
    },

    // ── Footer ────────────────────────────────────────────────────────────────
    footer: {
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 16,
        opacity: 0.6,
    },
    footerVersion: {
        fontSize: 12,
        color: theme.colors.textMuted,
        fontWeight: '600',
        letterSpacing: 1,
        marginBottom: 4,
    },
    footerTagline: {
        fontSize: 10,
        color: theme.colors.textMuted,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
});
