import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Pressable,
    Dimensions,
    Image,
} from 'react-native';
import { theme } from '../../theme';
import type { HookupCandidate } from './useHookupSystem';

type HookupModalProps = {
    visible: boolean;
    candidate: HookupCandidate | null;
    onAccept: () => void;
    onReject: () => void;
    onClose: () => void;
};

const { width } = Dimensions.get('window');

const HookupModal = ({
    visible,
    candidate,
    onAccept,
    onReject,
    onClose,
}: HookupModalProps) => {
    if (!candidate) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.card}>
                    {/* Row 1: Header (Avatar + Name) */}
                    <View style={styles.headerRow}>
                        <View style={styles.avatarContainer}>
                            <Text style={styles.avatarPlaceholder}>
                                {candidate.gender === 'Female' ? '👩' : '👨'}
                            </Text>
                        </View>
                        <Text style={styles.nameText}>{candidate.name}</Text>
                    </View>

                    {/* Row 2: Title */}
                    <Text style={styles.titleText}>HOOK UP</Text>

                    {/* Row 3: Scenario */}
                    <Text style={styles.scenarioText}>{candidate.scenario}</Text>

                    {/* Row 4: Stats List */}
                    <View style={styles.statsContainer}>
                        <Text style={styles.statLine}>
                            <Text style={styles.statLabel}>Name: </Text>
                            {candidate.name}
                        </Text>
                        <Text style={styles.statLine}>
                            <Text style={styles.statLabel}>Gender: </Text>
                            {candidate.gender}
                        </Text>
                        <Text style={styles.statLine}>
                            <Text style={styles.statLabel}>Age: </Text>
                            {candidate.age}
                        </Text>
                        <Text style={styles.statLine}>
                            <Text style={styles.statLabel}>Sexuality: </Text>
                            {candidate.sexuality}
                        </Text>
                    </View>

                    {/* Row 5: Action Buttons */}
                    <View style={styles.actions}>
                        <Pressable
                            onPress={onReject}
                            style={({ pressed }) => [
                                styles.button,
                                styles.rejectButton,
                                pressed && styles.buttonPressed,
                            ]}>
                            <Text style={styles.rejectButtonText}>No, I don't want it</Text>
                        </Pressable>
                        <Pressable
                            onPress={onAccept}
                            style={({ pressed }) => [
                                styles.button,
                                styles.acceptButton,
                                pressed && styles.buttonPressed,
                            ]}>
                            <Text style={styles.acceptButtonText}>
                                {candidate.gender === 'Female' ? 'Do Her' : 'Do Him'}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default HookupModal;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    card: {
        width: Math.min(380, width - 32),
        backgroundColor: '#1A1A1A', // Dark premium background
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
        borderWidth: 1,
        borderColor: '#333',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#333',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#444',
    },
    avatarPlaceholder: {
        fontSize: 24,
    },
    nameText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
    },
    titleText: {
        fontSize: 24,
        fontWeight: '900',
        color: theme.colors.primary, // Or a gold/premium color
        textAlign: 'center',
        letterSpacing: 2,
        marginVertical: 4,
    },
    scenarioText: {
        fontSize: 15,
        color: '#CCC',
        textAlign: 'center',
        lineHeight: 22,
        fontStyle: 'italic',
    },
    statsContainer: {
        backgroundColor: '#222',
        padding: 12,
        borderRadius: 8,
        gap: 4,
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.primary,
    },
    statLine: {
        fontSize: 14,
        color: '#EEE',
    },
    statLabel: {
        fontWeight: '700',
        color: '#AAA',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    rejectButton: {
        backgroundColor: '#333',
        borderWidth: 1,
        borderColor: '#444',
    },
    rejectButtonText: {
        color: '#CCC',
        fontWeight: '600',
        fontSize: 13,
    },
    acceptButton: {
        backgroundColor: theme.colors.success, // Or a custom green
    },
    acceptButtonText: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 15,
        textTransform: 'uppercase',
    },
});
