import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    TextInput
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { theme, avatarTintFor } from '../../../core/theme';
import ScreenHeader from '../../../components/common/ScreenHeader';
import { NAV_BAR_CLEARANCE } from '../../../navigation/components/CrystalNavBar';
import { useMailStore, type Mail } from '../../../core/store/useMailStore';

const formatMonth = (m: number) => `M${m}`;

const getInitials = (name: string): string =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

// The palette and the hash moved to core/theme.ts. MailDetailScreen carried a
// SECOND copy of both, so the same sender could be drawn in one colour in the
// list and another in the detail view. One of the eight, '#85DCB', was five
// digits - not a colour - so one sender in eight got whatever React Native
// does with a malformed hex.

const MailRow = ({ mail, onPress }: { mail: Mail; onPress: () => void }) => {
    const isUnread = !mail.isRead;
    
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
            
            <View style={styles.avatarWrap}>
                <View style={[styles.avatar, { backgroundColor: avatarTintFor(mail.fromName) }]}>
                    <Text style={styles.avatarText}>{getInitials(mail.fromName)}</Text>
                </View>
                {isUnread && (
                    <View style={styles.unreadIndicatorRow}>
                        <Text style={styles.unreadIndicatorRowText}>!</Text>
                    </View>
                )}
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

const MailScreen = () => {
    const navigation = useNavigation<any>();
    const inbox = useMailStore(s => s.inbox);
    const markRead = useMailStore(s => s.markRead);
    
    const [searchQuery, setSearchQuery] = useState('');

    const filteredInbox = inbox.filter(m => 
        m.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.fromName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={styles.root}>
            <ScreenHeader title="Mail" onBack={() => navigation.goBack()} />

            <View style={styles.searchHeader}>
                <View style={styles.searchBar}>
                    <MaterialCommunityIcons name="magnify" size={22} color={theme.colors.textMuted} style={{ marginRight: 8 }} />
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
                                navigation.navigate('MailDetail', { mailId: m.id });
                            }}
                        />
                    ))
                )}
            </ScrollView>
            
            {/* Compose FAB (Grey background with Orange icon to match user request) */}
            <Pressable style={styles.fab} onPress={() => {}}>
                <View style={styles.fabIconWrap}>
                    <MaterialCommunityIcons name="pencil" size={22} color={theme.colors.brand} />
                </View>
                <Text style={styles.fabText}>Compose</Text>
            </Pressable>
        </View>
    );
};

export default MailScreen;

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.colors.background },
    
    // Header & Search
    searchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.md,
        gap: 12,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 24,
        height: 44,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    searchInput: {
        flex: 1,
        color: theme.colors.textPrimary,
        fontSize: 16,
    },
    avatarMini: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: theme.colors.surfaceRaised,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    avatarMiniText: { color: theme.colors.brand, fontSize: 10, fontWeight: '800' },
    
    inboxLabel: {
        color: theme.colors.brandMuted,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
    },
    
    empty: {
        color: theme.colors.textMuted,
        fontSize: 15,
        textAlign: 'center',
        paddingVertical: 40,
    },

    // Row styles
    row: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 12,
        backgroundColor: theme.colors.background,
    },
    rowPressed: { backgroundColor: theme.colors.surface },
    avatarWrap: {
        marginRight: 16,
        paddingTop: 2,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Black. Every avatar tint is a light fill and prefers it by at
    // least 10:1; white on them measured 1.45 to 2.03 - the whole avatar
    // column was below the floor and nothing reported it, because the fill
    // comes out of a function and the audit can only read tokens.
    avatarText: { color: theme.colors.onLight, fontWeight: '600', fontSize: 16 },
    
    // The same badge as MessagesScreen, and it had the same fault: `brand` as
    // a fill with white on it, 1.90. `notification` is the one red the palette
    // allows as a background, and an unread dot is what it is for.
    unreadIndicatorRow: {
        position: 'absolute',
        top: 0,
        right: -2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: theme.colors.notification,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: theme.colors.background,
    },
    unreadIndicatorRowText: {
        color: theme.colors.notificationText,
        fontSize: 10,
        fontWeight: '900',
    },

    rowBody: { flex: 1, justifyContent: 'center' },
    rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
    fromName: { color: theme.colors.textSecondary, fontSize: 16, flex: 1, marginRight: 8 },
    time: { color: theme.colors.textMuted, fontSize: 12 },
    subject: { color: theme.colors.textSecondary, fontSize: 14, marginBottom: 2 },
    preview: { color: theme.colors.textMuted, fontSize: 14 },
    
    textUnread: { fontWeight: '700', color: theme.colors.textPrimary },
    textUnreadTime: { fontWeight: '700', color: theme.colors.brand },
    
    // FAB
    fab: {
        position: 'absolute',
        bottom: NAV_BAR_CLEARANCE + 16,
        right: 16,
        backgroundColor: theme.colors.surfaceRaised,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 28,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    fabIconWrap: {
        marginRight: 8,
    },
    fabText: {
        color: theme.colors.textPrimary,
        fontSize: 15,
        fontWeight: '600',
    },
});
