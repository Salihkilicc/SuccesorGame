// src/features/os/screens/MailScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    SafeAreaView,
    TextInput
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { theme } from '../../../core/theme';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';
import { useMailStore, type Mail, type MailCategory } from '../../../core/store/useMailStore';

const formatMonth = (m: number) => `M${m}`;

const getInitials = (name: string): string =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

const avatarColors = ['#EA4335', '#FBBC05', '#34A853', '#4285F4', '#8E24AA', '#3949AB', '#039BE5', '#00897B'];
const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatarColors[Math.abs(hash) % avatarColors.length];
};

const MailRow = ({ mail, onPress }: { mail: Mail; onPress: () => void }) => {
    const isUnread = !mail.isRead;
    
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
            
            <View style={styles.avatarWrap}>
                <View style={[styles.avatar, { backgroundColor: getAvatarColor(mail.fromName) }]}>
                    <Text style={styles.avatarText}>{getInitials(mail.fromName)}</Text>
                </View>
            </View>

            <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                    <Text style={[styles.fromName, isUnread && styles.textUnread]} numberOfLines={1}>
                        {mail.fromName}
                    </Text>
                    <Text style={[styles.time, isUnread && styles.textUnreadTime]}>
                        {formatMonth(mail.atMonth)}
                    </Text>
                </View>
                <Text style={[styles.subject, isUnread && styles.textUnread]} numberOfLines={1}>
                    {mail.subject}
                </Text>
                <Text style={styles.preview} numberOfLines={1}>
                    {mail.body.replace(/\n/g, ' ')}
                </Text>
            </View>
        </Pressable>
    );
};

const MailDetail = ({ mail, onBack, onDelete }: { mail: Mail; onBack: () => void, onDelete: () => void }) => {
    return (
        <View style={styles.root}>
            <View style={styles.detailHeader}>
                <Pressable onPress={onBack} style={styles.iconBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textPrimary} />
                </Pressable>
                <View style={styles.detailHeaderActions}>
                    <Pressable onPress={onDelete} style={styles.iconBtn}>
                        <MaterialCommunityIcons name="delete-outline" size={24} color={theme.colors.textPrimary} />
                    </Pressable>
                    <Pressable style={styles.iconBtn}>
                        <MaterialCommunityIcons name="email-outline" size={24} color={theme.colors.textPrimary} />
                    </Pressable>
                    <Pressable style={styles.iconBtn}>
                        <MaterialCommunityIcons name="dots-vertical" size={24} color={theme.colors.textPrimary} />
                    </Pressable>
                </View>
            </View>

            <ScrollView contentContainerStyle={[styles.detailContent, { paddingBottom: NAV_BAR_CLEARANCE }]}>
                <View style={styles.subjectRow}>
                    <Text style={styles.detailSubject}>{mail.subject}</Text>
                    <View style={styles.inboxBadge}>
                        <Text style={styles.inboxBadgeText}>Inbox</Text>
                    </View>
                </View>

                <View style={styles.senderSection}>
                    <View style={[styles.avatar, { backgroundColor: getAvatarColor(mail.fromName), width: 40, height: 40, borderRadius: 20 }]}>
                        <Text style={[styles.avatarText, { fontSize: 16 }]}>{getInitials(mail.fromName)}</Text>
                    </View>
                    <View style={styles.senderInfo}>
                        <View style={styles.senderNameRow}>
                            <Text style={styles.detailFromName}>{mail.fromName}</Text>
                            <Text style={styles.detailTime}>{formatMonth(mail.atMonth)}</Text>
                        </View>
                        <Text style={styles.detailToMe}>to me ▾</Text>
                    </View>
                </View>

                <View style={styles.bodySection}>
                    <Text style={styles.bodyText}>{mail.body}</Text>
                </View>
                
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

const MailScreen = () => {
    const navigation = useNavigation<any>();
    const inbox = useMailStore(s => s.inbox);
    const markRead = useMailStore(s => s.markRead);
    const deleteMail = useMailStore(s => s.deleteMail);
    
    const [openId, setOpenId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const open = inbox.find(m => m.id === openId) || null;

    if (open) {
        return <MailDetail 
            mail={open} 
            onBack={() => setOpenId(null)} 
            onDelete={() => {
                deleteMail(open.id);
                setOpenId(null);
            }} 
        />;
    }

    const filteredInbox = inbox.filter(m => 
        m.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.fromName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={styles.root}>
            <View style={styles.searchHeader}>
                <Pressable onPress={() => navigation.goBack()} style={styles.menuBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textPrimary} />
                </Pressable>
                <View style={styles.searchBar}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search in mail"
                        placeholderTextColor={theme.colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <View style={styles.avatarMini}>
                    <Text style={styles.avatarMiniText}>ME</Text>
                </View>
            </View>

            <Text style={styles.inboxLabel}>PRIMARY</Text>

            <ScrollView contentContainerStyle={{ paddingBottom: NAV_BAR_CLEARANCE }}>
                {filteredInbox.length === 0 ? (
                    <Text style={styles.empty}>Nothing in Primary.</Text>
                ) : (
                    filteredInbox.map(m => (
                        <MailRow
                            key={m.id}
                            mail={m}
                            onPress={() => {
                                markRead(m.id);
                                setOpenId(m.id);
                            }}
                        />
                    ))
                )}
            </ScrollView>
            
            {/* Compose FAB */}
            <Pressable style={styles.fab} onPress={() => {}}>
                <MaterialCommunityIcons name="pencil" size={24} color="#D93025" />
                <Text style={styles.fabText}>Compose</Text>
            </Pressable>
        </View>
    );
};

export default MailScreen;

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#202124' }, // Gmail dark mode background
    
    // Header & Search
    searchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 12,
        backgroundColor: '#202124',
    },
    menuBtn: {
        padding: 8,
    },
    searchBar: {
        flex: 1,
        backgroundColor: '#303134',
        borderRadius: 24,
        height: 48,
        paddingHorizontal: 16,
        justifyContent: 'center',
    },
    searchInput: {
        color: '#E8EAED',
        fontSize: 16,
    },
    avatarMini: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#D93025',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarMiniText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
    
    inboxLabel: {
        color: '#9AA0A6',
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.8,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    
    empty: {
        color: '#9AA0A6',
        fontSize: 15,
        textAlign: 'center',
        paddingVertical: 40,
    },

    // Row styles
    row: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    rowPressed: { backgroundColor: 'rgba(255,255,255,0.05)' },
    avatarWrap: {
        marginRight: 16,
        paddingTop: 2,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { color: '#FFFFFF', fontWeight: '500', fontSize: 18 },

    rowBody: { flex: 1, justifyContent: 'center' },
    rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
    fromName: { color: '#E8EAED', fontSize: 16, flex: 1, marginRight: 8 },
    time: { color: '#9AA0A6', fontSize: 12 },
    subject: { color: '#E8EAED', fontSize: 14, marginBottom: 2 },
    preview: { color: '#9AA0A6', fontSize: 14 },
    
    textUnread: { fontWeight: '700', color: '#FFFFFF' },
    textUnreadTime: { fontWeight: '700', color: '#E8EAED' },
    
    // FAB
    fab: {
        position: 'absolute',
        bottom: NAV_BAR_CLEARANCE + 16,
        right: 16,
        backgroundColor: '#303134',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 28,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    fabText: {
        color: '#E8EAED',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    
    // Detail View
    detailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 8,
        backgroundColor: '#202124',
    },
    detailHeaderActions: { flexDirection: 'row', alignItems: 'center' },
    iconBtn: { padding: 12 },
    
    detailContent: { padding: 16 },
    subjectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    detailSubject: { color: '#E8EAED', fontSize: 22, flex: 1, marginRight: 16, lineHeight: 28 },
    inboxBadge: { backgroundColor: '#303134', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    inboxBadgeText: { color: '#9AA0A6', fontSize: 10 },
    
    senderSection: { flexDirection: 'row', marginBottom: 24 },
    senderInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
    senderNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    detailFromName: { color: '#E8EAED', fontSize: 14, fontWeight: '700' },
    detailTime: { color: '#9AA0A6', fontSize: 12 },
    detailToMe: { color: '#9AA0A6', fontSize: 12, marginTop: 2 },
    
    bodySection: { marginBottom: 32 },
    bodyText: { color: '#E8EAED', fontSize: 15, lineHeight: 22 },
    
    replyActionRow: { flexDirection: 'row', gap: 8 },
    replyBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#303134', 
        paddingHorizontal: 16, 
        paddingVertical: 10, 
        borderRadius: 20, 
        gap: 8
    },
    replyBtnText: { color: '#E8EAED', fontSize: 14, fontWeight: '500' }
});
