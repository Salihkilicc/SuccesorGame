import React, { useState } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, Pressable, StatusBar, ScrollView, TextInput } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { theme } from '../../../core/theme';
import { NAME_MAX, type Gender } from '../../../core/identity';
import { useIdentityStore } from '../../../core/store/useIdentityStore';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';

const ProfileScreen = () => {
    useLocale();
    const stored = useIdentityStore();
    const [firstName, setFirstName] = useState(stored.firstName);
    const [lastName, setLastName] = useState(stored.lastName);
    const [gender, setGender] = useState<Gender>(stored.gender);
    const [message, setMessage] = useState('');
    const [saved, setSaved] = useState(true);

    const dirty =
        firstName !== stored.firstName ||
        lastName !== stored.lastName ||
        gender !== stored.gender;

    const save = () => {
        // The store validates. The screen does not repeat the rules - it
        // reports what the store said, so there is one copy of them.
        const res = stored.setIdentity({ firstName, lastName, gender });
        setSaved(res.ok);
        setMessage(res.ok ? 'Saved.' : res.reason);
    };

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />

            <LinearGradient
                colors={['#1C242C', '#1C242C', '#1C242C']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <View style={[styles.safeArea]}>
                {/* The back arrow here was painted #FF8A8A - the LOSS red,
                    on a navigation control. Exactly the leak the colour rule
                    exists to stop, and it survived because it was a JSX
                    `color=` prop rather than a style, which the audit was
                    only reading in styles. Both are checked now. */}
                <ScreenHeader title={t('ui.profile')} />

                {/* ------------------------------------------------------
                    WHERE THE NAME IS CHANGED

                    Onboarding asks once, on the first launch, and never
                    again - that was the player's call, on the grounds that
                    this screen would carry the edit. So it has to, or the
                    name is a decision you make once in your life with no
                    way back.

                    The company name is NOT here. It belongs to the run and
                    is asked at the start of each one; putting it on a
                    screen that outlives the run would invite renaming a
                    company mid-quarter, and every report already filed
                    would silently be from a company that no longer exists.
                   ------------------------------------------------------ */}
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.groupTitle}>You</Text>

                    <View style={styles.field}>
                        <View style={styles.fieldHead}>
                            <Text style={styles.fieldLabel}>First name</Text>
                            <Text style={styles.counter}>{firstName.length}/{NAME_MAX}</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            value={firstName}
                            onChangeText={setFirstName}
                            maxLength={NAME_MAX}
                            autoCorrect={false}
                            selectionColor={theme.colors.primary}
                        />
                    </View>

                    <View style={styles.field}>
                        <View style={styles.fieldHead}>
                            <Text style={styles.fieldLabel}>Last name</Text>
                            <Text style={styles.counter}>{lastName.length}/{NAME_MAX}</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            value={lastName}
                            onChangeText={setLastName}
                            maxLength={NAME_MAX}
                            autoCorrect={false}
                            selectionColor={theme.colors.primary}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Gender</Text>
                        <View style={styles.genderRow}>
                            {(['male', 'female'] as const).map(g => (
                                <Pressable
                                    key={g}
                                    onPress={() => setGender(g)}
                                    style={({ pressed }) => [
                                        styles.gender,
                                        gender === g && styles.genderOn,
                                        pressed && styles.genderPressed,
                                    ]}>
                                    <Text style={[styles.genderText, gender === g && styles.genderTextOn]}>
                                        {g === 'male' ? 'Man' : 'Woman'}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {!!message && (
                        <Text style={[styles.message, !saved && styles.messageBad]}>{message}</Text>
                    )}

                    <Pressable
                        onPress={save}
                        disabled={!dirty}
                        style={({ pressed }) => [
                            styles.save,
                            !dirty && styles.saveOff,
                            pressed && dirty && styles.savePressed,
                        ]}>
                        <Text style={styles.saveText}>{dirty ? 'Save' : 'Saved'}</Text>
                    </Pressable>
                </ScrollView>

                {/* Universal Crystal Navigation Bar */}
                {/* hideDots=true disables the pagination dots completely, as requested */}
                {/* Assuming Profile tab acts kind of like 'Home' or 'Life' for activeTab highlighting. 
                    Since 'activeTab' in CrystalNavBar takes 'Life' | 'Home' | 'Company' | 'Love', 
                    and there is no 'Profile', let's just pass 'Life' or '' but since it must be one of them,
                    let's pass 'Home' to avoid typescript error or just ignore it if it's relaxed.
                    The navbar component expects: activeTab: 'Life' | 'Home' | 'Company' | 'Love';
                    I'll use 'Home' but visually activeTab highlights the specific icon.
                    Actually, let's just use 'Life' as it's a fallback.
                */}
            </View>
        </View>
    );
};

export default ProfileScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#434B50',
    },
    safeArea: {
        flex: 1,
    },
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
    content: {
        padding: theme.spacing.lg,
        paddingBottom: NAV_BAR_CLEARANCE,
    },
    groupTitle: {
        color: theme.colors.brandMuted,
        fontSize: theme.typography.caption,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: theme.spacing.md,
    },
    field: { marginBottom: theme.spacing.lg },
    fieldHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    fieldLabel: {
        color: theme.colors.textMuted,
        fontSize: theme.typography.caption,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    counter: { color: theme.colors.textMuted, fontSize: theme.typography.micro, marginBottom: 6 },
    input: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.borderStrong,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 13,
        color: theme.colors.textPrimary,
        fontSize: theme.typography.subtitle,
    },
    genderRow: { flexDirection: 'row', gap: theme.spacing.sm },
    gender: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.borderStrong,
    },
    genderPressed: { backgroundColor: theme.colors.surfaceHigh },
    genderOn: { backgroundColor: theme.colors.highlight, borderColor: theme.colors.highlight },
    genderText: { color: theme.colors.textPrimary, fontWeight: '700', fontSize: theme.typography.body + 1 },
    genderTextOn: { color: theme.colors.highlightText },
    message: { color: theme.colors.up, fontSize: theme.typography.caption + 1, marginBottom: theme.spacing.sm },
    messageBad: { color: theme.colors.negative },
    save: {
        paddingVertical: 15,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
    },
    savePressed: { backgroundColor: theme.colors.highlight },
    /** Light on purpose - the label stays black either way. Theme rule 1. */
    saveOff: { backgroundColor: theme.colors.disabled },
    saveText: { color: theme.colors.primaryText, fontWeight: '800', fontSize: theme.typography.body + 2 },
});
