import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TouchableOpacity } from 'react-native';
import GameModal from '../../common/GameModal';
import { useShareholderStore, type BoardMember } from '../../../features/shareholders/stores/useShareholderStore';
import ShareholderProfileModal from './ShareholderProfileModal';

interface Props {
    visible: boolean;
    onClose: () => void;
}

const BoardMembersModal = ({ visible, onClose }: Props) => {
    const { members, playerShareCount, totalShares, boardMood } = useShareholderStore();

    // Profile modal state
    const [selectedMember, setSelectedMember] = useState<BoardMember | null>(null);
    const [isProfileVisible, setProfileVisible] = useState(false);

    // Calculate total opposition shares
    const oppositionSharesCount = members.reduce((sum, member) => sum + member.shareCount, 0);
    const oppositionSharesPercent = (oppositionSharesCount / totalShares) * 100;
    const playerSharesPercent = (playerShareCount / totalShares) * 100;

    // Get mood icon and label
    const getMoodDisplay = () => {
        switch (boardMood) {
            case 'Aggressive':
            case 'Shark':
                return { icon: '🔥', label: 'HOSTILE', color: '#FF3B30' };
            case 'Conservative':
                return { icon: '🛡️', label: 'CAUTIOUS', color: '#FFA500' };
            case 'Visionary':
                return { icon: '💡', label: 'AMBITIOUS', color: '#FFD700' };
            case 'Loyalist':
                return { icon: '🤝', label: 'SUPPORTIVE', color: '#90EE90' };
            case 'Snake':
                return { icon: '🐍', label: 'DECEPTIVE', color: '#8B008B' };
            default:
                return { icon: '⚖️', label: 'NEUTRAL', color: '#8A9BA8' };
        }
    };

    const mood = getMoodDisplay();

    // Get trust color
    const getTrustColor = (trust: number) => {
        if (trust >= 70) return '#90EE90';
        if (trust >= 30) return '#FFA500';
        return '#FF3B30';
    };

    // Get trait icon
    const getTraitIcon = (trait: string) => {
        switch (trait) {
            case 'Shark': return '🦈';
            case 'Conservative': return '🛡️';
            case 'Aggressive': return '⚔️';
            case 'Visionary': return '💡';
            case 'Loyalist': return '🤝';
            case 'Snake': return '🐍';
            default: return '👤';
        }
    };

    return (
        <GameModal visible={visible} onClose={onClose}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>BOARD CONTROL</Text>
                <Text style={styles.headerSubtitle}>Power Dynamics</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 20 }}>
                {/* Power Dynamics Bar */}
                <View style={styles.powerSection}>
                    <View style={styles.powerLabels}>
                        <Text style={styles.powerLabelYou}>YOU</Text>
                        <Text style={styles.powerLabelOpposition}>OPPOSITION</Text>
                    </View>
                    <View style={styles.powerBar}>
                        <View
                            style={[
                                styles.powerBarYou,
                                {
                                    width: `${playerSharesPercent}%`,
                                    backgroundColor: playerSharesPercent >= 50 ? '#FFD700' : '#90EE90',
                                }
                            ]}
                        />
                        <View
                            style={[
                                styles.powerBarOpposition,
                                {
                                    width: `${oppositionSharesPercent}%`,
                                    backgroundColor: oppositionSharesPercent >= 50 ? '#FF3B30' : '#8A9BA8',
                                }
                            ]}
                        />
                    </View>
                    <View style={styles.powerValues}>
                        <Text style={styles.powerValueYou}>{playerSharesPercent.toFixed(1)}%</Text>
                        <Text style={styles.powerValueOpposition}>{oppositionSharesPercent.toFixed(1)}%</Text>
                    </View>

                    {/* Mood Indicator */}
                    <View style={[styles.moodBadge, { borderColor: mood.color }]}>
                        <Text style={styles.moodIcon}>{mood.icon}</Text>
                        <Text style={[styles.moodText, { color: mood.color }]}>
                            MOOD: {mood.label}
                        </Text>
                    </View>
                </View>

                {/* Members Grid */}
                <View style={styles.membersSection}>
                    <Text style={styles.sectionTitle}>THE TABLE</Text>
                    <View style={styles.membersGrid}>
                        {members.map((member) => (
                            <TouchableOpacity
                                key={member.id}
                                style={styles.memberCard}
                                activeOpacity={0.7}
                                onPress={() => {
                                    setSelectedMember(member);
                                    setProfileVisible(true);
                                }}
                            >
                                {/* Header */}
                                <View style={styles.memberHeader}>
                                    <View style={styles.memberAvatar}>
                                        <Text style={styles.memberAvatarText}>
                                            {member.name.charAt(0)}
                                        </Text>
                                    </View>
                                    <View style={styles.memberInfo}>
                                        <Text style={styles.memberName} numberOfLines={1}>
                                            {member.name}
                                        </Text>
                                        <Text style={styles.memberShares}>
                                            {((member.shareCount / totalShares) * 100).toFixed(1)}%
                                        </Text>
                                    </View>
                                    {member.isHostile && (
                                        <Text style={styles.hostileIcon}>⚠️</Text>
                                    )}
                                </View>

                                {/* Trait Badge */}
                                <View style={styles.traitBadge}>
                                    <Text style={styles.traitIcon}>{getTraitIcon(member.trait)}</Text>
                                    <Text style={styles.traitText}>{member.trait}</Text>
                                </View>

                                {/* Trust Meter */}
                                <View style={styles.trustContainer}>
                                    <Text style={styles.trustLabel}>Trust</Text>
                                    <View style={styles.trustBarBg}>
                                        <View
                                            style={[
                                                styles.trustBarFill,
                                                {
                                                    width: `${member.trust}%`,
                                                    backgroundColor: getTrustColor(member.trust),
                                                }
                                            ]}
                                        />
                                    </View>
                                    <Text style={[styles.trustValue, { color: getTrustColor(member.trust) }]}>
                                        {member.trust}
                                    </Text>
                                </View>

                                {/* Origin Badge */}
                                <View style={styles.originBadge}>
                                    <Text style={styles.originText}>{member.origin}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Action Footer */}
                <View style={styles.actionFooter}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.actionButton,
                            styles.voteButton,
                            pressed && styles.actionButtonPressed
                        ]}
                        onPress={() => {
                            // TODO: Implement voting modal
                            console.log('Call Emergency Vote');
                        }}
                    >
                        <Text style={styles.actionButtonText}>⚖️ CALL EMERGENCY VOTE</Text>
                    </Pressable>


                </View>
            </ScrollView>

            {/* Shareholder Profile Modal */}
            <ShareholderProfileModal
                visible={isProfileVisible}
                member={selectedMember}
                onClose={() => setProfileVisible(false)}
            />
        </GameModal>
    );
};

export default BoardMembersModal;

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 2,
        borderBottomColor: '#2A2D35',
        position: 'relative', // Enable absolute positioning for children
    },
    closeButton: {
        position: 'absolute',
        left: 0,
        top: 4, // Align with title
        zIndex: 10,
        padding: 4,
    },
    closeButtonText: {
        fontSize: 20,
        color: '#8A9BA8',
        fontWeight: '700',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 2,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#8A9BA8',
        fontStyle: 'italic',
    },
    powerSection: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#2A2D35',
        gap: 12,
    },
    powerLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    powerLabelYou: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FFD700',
        letterSpacing: 1,
    },
    powerLabelOpposition: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FF6B6B',
        letterSpacing: 1,
    },
    powerBar: {
        flexDirection: 'row',
        height: 24,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#0A0A0A',
    },
    powerBarYou: {
        height: '100%',
    },
    powerBarOpposition: {
        height: '100%',
    },
    powerValues: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    powerValueYou: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFD700',
    },
    powerValueOpposition: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FF6B6B',
    },
    moodBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 2,
        backgroundColor: '#0A0A0A',
    },
    moodIcon: {
        fontSize: 20,
    },
    moodText: {
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    membersSection: {
        gap: 12,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#8A9BA8',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    membersGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    memberCard: {
        width: '48%',
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#2A2D35',
        gap: 10,
    },
    memberHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    memberAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFD700',
        alignItems: 'center',
        justifyContent: 'center',
    },
    memberAvatarText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#000',
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    memberShares: {
        fontSize: 12,
        fontWeight: '800',
        color: '#FFD700',
    },
    hostileIcon: {
        fontSize: 18,
    },
    traitBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#2A2D35',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    traitIcon: {
        fontSize: 14,
    },
    traitText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    trustContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    trustLabel: {
        fontSize: 9,
        color: '#8A9BA8',
        width: 32,
    },
    trustBarBg: {
        flex: 1,
        height: 6,
        backgroundColor: '#0A0A0A',
        borderRadius: 3,
        overflow: 'hidden',
    },
    trustBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    trustValue: {
        fontSize: 11,
        fontWeight: '800',
        width: 24,
        textAlign: 'right',
    },
    originBadge: {
        backgroundColor: '#0A0A0A',
        paddingVertical: 3,
        paddingHorizontal: 6,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    originText: {
        fontSize: 8,
        fontWeight: '700',
        color: '#8A9BA8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    actionFooter: {
        gap: 12,
        marginTop: 8,
    },
    actionButton: {
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
    },
    actionButtonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    voteButton: {
        backgroundColor: '#2A2D35',
        borderColor: '#FFD700',
    },
    directiveButton: {
        backgroundColor: '#1C1C1E',
        borderColor: '#8A9BA8',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
});
