import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../core/theme';
import type { HookupCandidate } from './useHookupSystem';
import GameModal from '../common/GameModal';
import GameButton from '../common/GameButton';

type HookupModalProps = {
    visible: boolean;
    candidate: HookupCandidate | null;
    onAccept: () => void;
    onReject: () => void;
    onClose: () => void;
};

const HookupModal = ({
    visible,
    candidate,
    onAccept,
    onReject,
    onClose,
}: HookupModalProps) => {
    if (!candidate) return null;

    return (
        <GameModal
            visible={visible}
            onClose={onClose}
            title="HOOK UP"
            subtitle={candidate.scenario}
        >
            <View style={styles.content}>
                {/* Header (Avatar + Name) */}
                <View style={styles.headerRow}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarPlaceholder}>
                            {candidate.gender === 'Female' ? '👩' : '👨'}
                        </Text>
                    </View>
                    <Text style={styles.nameText}>{candidate.name}</Text>
                </View>

                {/* Stats List */}
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

                {/* Action Buttons */}
                <View style={styles.actions}>
                    <GameButton
                        title="No, I don't want it"
                        onPress={onReject}
                        variant="secondary"
                        style={styles.button}
                    />
                    <GameButton
                        title={candidate.gender === 'Female' ? 'Do Her' : 'Do Him'}
                        onPress={onAccept}
                        variant="primary"
                        style={styles.button}
                    />
                </View>
            </View>
        </GameModal>
    );
};

export default HookupModal;

const styles = StyleSheet.create({
    content: {
        gap: theme.spacing.md,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
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
    statsContainer: {
        backgroundColor: '#222',
        padding: 12,
        borderRadius: 8,
        gap: 4,
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.primary,
        marginBottom: 8,
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
    },
});
