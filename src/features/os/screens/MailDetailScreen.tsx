import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { theme } from '../../../core/theme';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';
import { useMailStore, type Mail } from '../../../core/store/useMailStore';

const formatMonth = (m: number) => `M${m}`;

const getInitials = (name: string): string =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

// We can still use varied colors for avatars to keep the Gmail feel, 
// but muted slightly to fit the dark theme.
const avatarColors = ['#E27D60', '#E8A87C', '#C38D9E', '#41B3A3', '#85DCB', '#EFC94C', '#3FC9C0', '#A78BFA'];
const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatarColors[Math.abs(hash) % avatarColors.length];
};

const MailDetailScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const mailId = route.params?.mailId;

    const inbox = useMailStore(s => s.inbox);
    const deleteMail = useMailStore(s => s.deleteMail);
    const mail = inbox.find(m => m.id === mailId);

    const insets = useSafeAreaInsets();

    if (!mail) return null;

    return (
        <View style={styles.root}>
            <ScreenHeader
                title={mail.fromName}
                subtitle="Mail"
                onBack={() => navigation.goBack()}
            />

            <ScrollView contentContainerStyle={[styles.detailContent, { paddingBottom: NAV_BAR_CLEARANCE }]}>
                {/* Subject */}
                <View style={styles.subjectRow}>
                    <Text style={styles.detailSubject}>{mail.subject}</Text>
                    <View style={styles.inboxBadge}>
                        <Text style={styles.inboxBadgeText}>Inbox</Text>
                    </View>
                </View>

                {/* Sender Info */}
                <View style={styles.senderSection}>
                    <View style={[styles.avatar, { backgroundColor: getAvatarColor(mail.fromName) }]}>
                        <Text style={styles.avatarText}>{getInitials(mail.fromName)}</Text>
                    </View>
                    <View style={styles.senderInfo}>
                        <View style={styles.senderNameRow}>
                            <Text style={styles.detailFromName}>{mail.fromName}</Text>
                            <Text style={styles.detailTime}>{formatMonth(mail.atMonth)}</Text>
                        </View>
                        <Text style={styles.detailToMe}>to me ▾</Text>
                    </View>
                </View>

                {/* Body */}
                <View style={styles.bodySection}>
                    <Text style={styles.bodyText}>{mail.body}</Text>
                </View>
                
                {/* Reply Actions */}
                <View style={styles.replyActionRow}>
                    <View style={styles.replyBtn}>
                        <MaterialCommunityIcons name="reply" size={20} color={theme.colors.textSecondary} />
                        <Text style={styles.replyBtnText}>Reply</Text>
                    </View>
                    <View style={styles.replyBtn}>
                        <MaterialCommunityIcons name="reply-all" size={20} color={theme.colors.textSecondary} />
                        <Text style={styles.replyBtnText}>Reply all</Text>
                    </View>
                    <View style={styles.replyBtn}>
                        <MaterialCommunityIcons name="share" size={20} color={theme.colors.textSecondary} />
                        <Text style={styles.replyBtnText}>Forward</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

export default MailDetailScreen;

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.colors.background },
    
    detailContent: { padding: theme.spacing.lg },
    
    subjectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    detailSubject: { color: theme.colors.textPrimary, fontSize: 22, flex: 1, marginRight: 16, lineHeight: 28 },
    inboxBadge: { backgroundColor: theme.colors.surface, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    inboxBadgeText: { color: theme.colors.textMuted, fontSize: 10, textTransform: 'uppercase', fontWeight: 'bold' },
    
    senderSection: { flexDirection: 'row', marginBottom: 24 },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
    senderInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
    senderNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    detailFromName: { color: theme.colors.textPrimary, fontSize: 15, fontWeight: '700' },
    detailTime: { color: theme.colors.textMuted, fontSize: 12 },
    detailToMe: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
    
    bodySection: { marginBottom: 32 },
    bodyText: { color: theme.colors.textPrimary, fontSize: 15, lineHeight: 24 },
    
    replyActionRow: { flexDirection: 'row', gap: 12 },
    replyBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: theme.colors.surfaceRaised, 
        paddingHorizontal: 16, 
        paddingVertical: 10, 
        borderRadius: 20, 
        gap: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    replyBtnText: { color: theme.colors.textPrimary, fontSize: 14, fontWeight: '600' }
});
