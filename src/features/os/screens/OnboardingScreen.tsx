// src/features/os/screens/OnboardingScreen.tsx
//
// ============================================================================
//  WHO ARE YOU, AND WHAT IS THE COMPANY CALLED
// ============================================================================
//
//  The game used to open as "John Rich", male, running something the screens
//  called "My Company" - three defaults nobody chose, in a game whose whole
//  subject is a company you build.
//
//  TWO MOMENTS, NOT ONE, and the split is the player's:
//
//    FIRST LAUNCH  -> name, surname, gender, company name.
//    EVERY NEW GAME -> company name only.
//
//  You are the same person starting another company, so the identity survives
//  the wipe (see useIdentityStore) and is edited from Profile afterwards
//  rather than by sending anyone back through onboarding. The company name is
//  part of the run and is asked again each time, because that is what a run
//  is.
//
//  ONE SCREEN FOR BOTH. The alternative - two screens sharing a form - means
//  the field rules exist twice and drift, which is how the company name would
//  end up with a different length limit depending on which door you came in
//  by. `mode` decides what is shown; everything else is identical.
// ============================================================================

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Pressable,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '../../../core/theme';
import {
    COMPANY_MAX,
    NAME_MAX,
    checkCompany,
    checkName,
    tidy,
    type Gender,
} from '../../../core/identity';
import { useIdentityStore } from '../../../core/store/useIdentityStore';
import { useStatsStore } from '../../../core/store/useStatsStore';

type Props = {
    /**
     * `full` on a first launch, `company` when an existing player starts
     * another run.
     */
    mode: 'full' | 'company';
    /** Called once everything is valid and written. */
    onDone: () => void;
};

const Field = ({
    label,
    value,
    onChangeText,
    placeholder,
    maxLength,
    error,
    autoFocus,
}: {
    label: string;
    value: string;
    onChangeText: (v: string) => void;
    placeholder: string;
    maxLength: number;
    error?: string;
    autoFocus?: boolean;
}) => (
    <View style={styles.field}>
        <View style={styles.fieldHead}>
            <Text style={styles.fieldLabel}>{label}</Text>
            {/* The count is always visible rather than appearing at the limit.
                A counter that shows up only once you are in trouble reads as
                an error; one that was there all along reads as a budget. */}
            <Text style={[styles.counter, value.length >= maxLength && styles.counterFull]}>
                {value.length}/{maxLength}
            </Text>
        </View>
        <TextInput
            style={[styles.input, !!error && styles.inputError]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textMuted}
            maxLength={maxLength}
            autoFocus={autoFocus}
            autoCorrect={false}
            selectionColor={theme.colors.primary}
            returnKeyType="next"
        />
        {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
);

const OnboardingScreen = ({ mode, onDone }: Props) => {
    const insets = useSafeAreaInsets();
    const setIdentity = useIdentityStore(s => s.setIdentity);
    const existingFirst = useIdentityStore(s => s.firstName);
    const existingLast = useIdentityStore(s => s.lastName);
    const update = useStatsStore(s => s.update);

    const [firstName, setFirstName] = useState(existingFirst);
    const [lastName, setLastName] = useState(existingLast);
    const [gender, setGender] = useState<Gender>(useIdentityStore.getState().gender);
    const [company, setCompany] = useState('');
    /** Only shown after a failed submit - see the note on `submit`. */
    const [errors, setErrors] = useState<Record<string, string>>({});

    const wantsIdentity = mode === 'full';

    const submit = () => {
        // ------------------------------------------------------------------
        //  ERRORS APPEAR ON SUBMIT, NOT ON EVERY KEYSTROKE
        // ------------------------------------------------------------------
        //  Validating as you type means the first letter of a two-character
        //  minimum is always an error: you are told you are wrong before you
        //  have had a chance to be right. The button says whether you can go;
        //  the reasons appear when you try.
        // ------------------------------------------------------------------
        const next: Record<string, string> = {};

        if (wantsIdentity) {
            const f = checkName(firstName, 'A first name');
            if (!f.ok) next.firstName = f.reason;
            const l = checkName(lastName, 'A last name');
            if (!l.ok) next.lastName = l.reason;
        }
        const c = checkCompany(company);
        if (!c.ok) next.company = c.reason;

        setErrors(next);
        if (Object.keys(next).length > 0) return;

        if (wantsIdentity) {
            // The store validates again. If it somehow refuses, say so rather
            // than continuing into a game with no name.
            const written = setIdentity({ firstName, lastName, gender });
            if (!written.ok) {
                setErrors({ firstName: written.reason });
                return;
            }
        }

        update({ companyName: tidy(company) });
        onDone();
    };

    return (
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    { paddingTop: Math.max(insets.top, 12) + 28, paddingBottom: insets.bottom + 32 },
                ]}
                keyboardShouldPersistTaps="handled">

                <Text style={styles.kicker}>
                    {wantsIdentity ? 'Before we start' : 'A new company'}
                </Text>
                <Text style={styles.title}>
                    {wantsIdentity ? 'Who are you?' : 'What will you call it?'}
                </Text>
                <Text style={styles.lede}>
                    {wantsIdentity
                        ? 'You can change your name later from Profile. The company name is asked again every time you start over.'
                        : 'You keep your name. This is the company you are building this time.'}
                </Text>

                {wantsIdentity && (
                    <>
                        <Field
                            label="First name"
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="John"
                            maxLength={NAME_MAX}
                            error={errors.firstName}
                            autoFocus
                        />
                        <Field
                            label="Last name"
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="Rich"
                            maxLength={NAME_MAX}
                            error={errors.lastName}
                        />

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
                                        ]}
                                        accessibilityRole="button"
                                        accessibilityState={{ selected: gender === g }}>
                                        <Text style={[styles.genderText, gender === g && styles.genderTextOn]}>
                                            {g === 'male' ? 'Man' : 'Woman'}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    </>
                )}

                <Field
                    label="Company name"
                    value={company}
                    onChangeText={setCompany}
                    placeholder="Northwind Industries"
                    maxLength={COMPANY_MAX}
                    error={errors.company}
                    autoFocus={!wantsIdentity}
                />

                <Pressable
                    onPress={submit}
                    style={({ pressed }) => [styles.start, pressed && styles.startPressed]}>
                    <Text style={styles.startText}>Start</Text>
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.colors.background },
    content: { paddingHorizontal: theme.spacing.xl },

    kicker: {
        color: theme.colors.brandMuted,
        fontSize: theme.typography.caption,
        fontWeight: '800',
        letterSpacing: 1.6,
        textTransform: 'uppercase',
    },
    title: {
        color: theme.colors.textPrimary,
        fontSize: theme.typography.title,
        fontWeight: '300',
        letterSpacing: 1,
        marginTop: 6,
    },
    lede: {
        color: theme.colors.textSecondary,
        fontSize: theme.typography.body,
        lineHeight: 20,
        marginTop: 10,
        marginBottom: theme.spacing.xl,
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
    /** At the ceiling, in the colour that means you have hit one. */
    counterFull: { color: theme.colors.negative },
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
    /**
     * A BORDER, so it cannot be the signal token - the audit caught me
     * reaching for `negative` here and it is right: red as an outline is
     * decoration, and the ban on that is what keeps red meaning something.
     * `borderStrong` plus the message below carries it; the message is the
     * part that says what is wrong anyway.
     */
    inputError: { borderColor: theme.colors.borderStrong, borderWidth: 1.5 },
    error: { color: theme.colors.negative, fontSize: theme.typography.caption, marginTop: 6, lineHeight: 16 },

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
    /** Selected is the light highlight, so its label is black. Theme rule 1. */
    genderOn: { backgroundColor: theme.colors.highlight, borderColor: theme.colors.highlight },
    genderText: { color: theme.colors.textPrimary, fontWeight: '700', fontSize: theme.typography.body + 1 },
    genderTextOn: { color: theme.colors.highlightText },

    start: {
        marginTop: theme.spacing.sm,
        paddingVertical: 16,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
    },
    startPressed: { backgroundColor: theme.colors.highlight },
    startText: {
        color: theme.colors.primaryText,
        fontWeight: '800',
        fontSize: theme.typography.subtitle,
        letterSpacing: 1,
    },
});
