import React, { useState, useRef, useCallback } from 'react';
import { t, useLocale } from '../../../core/i18n';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Pressable,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNotesStore, Note } from '../../../core/store/useNotesStore';
import { theme } from '../../../core/theme';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateId = () =>
    `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const formatDate = (isoDate: string): string => {
    const [year, month, day] = isoDate.split('-');
    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}`;
};

const todayISO = () => new Date().toISOString().split('T')[0];

// ─── Note Card ────────────────────────────────────────────────────────────────

type NoteCardProps = {
    note: Note;
    onPress: (note: Note) => void;
    onDelete: (id: string) => void;
};

const NoteCard = ({ note, onPress, onDelete }: NoteCardProps) => {
    useLocale();
    const preview = note.content.trim().replace(/\n/g, ' ').slice(0, 90);

    const handleDelete = () => {
        Alert.alert(
            'Delete Note',
            'Are you sure you want to delete this note?',
            [
                { text: t('os.cancel'), style: 'cancel' },
                {
                    text: t('os.delete'),
                    style: 'destructive',
                    onPress: () => onDelete(note.id),
                },
            ],
        );
    };

    return (
        <Pressable
            style={({ pressed }) => [styles.noteCard, pressed && styles.noteCardPressed]}
            onPress={() => onPress(note)}
        >
            {/* Gold left accent bar */}
            <LinearGradient
                colors={['#FF8A8A', '#FF8A8A']}
                style={styles.noteAccentBar}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            />

            <View style={styles.noteCardBody}>
                <View style={styles.noteCardTop}>
                    <Text style={styles.noteTitle} numberOfLines={1}>
                        {note.title || 'Untitled'}
                    </Text>
                    <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={handleDelete}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <MaterialCommunityIcons
                            name="trash-can-outline"
                            size={18}
                            color="#535B5F"
                        />
                    </TouchableOpacity>
                </View>

                {preview.length > 0 && (
                    <Text style={styles.notePreview} numberOfLines={2}>
                        {preview}
                    </Text>
                )}

                <View style={styles.noteFooter}>
                    <MaterialCommunityIcons
                        name="clock-outline"
                        size={11}
                        color="#666E70"
                    />
                    <Text style={styles.noteDate}>{formatDate(note.date)}</Text>
                </View>
            </View>
        </Pressable>
    );
};

// ─── Editor View ──────────────────────────────────────────────────────────────

type EditorViewProps = {
    note: Note | null; // null = new note
    onSave: (title: string, content: string) => void;
    onCancel: () => void;
};

const EditorView = ({ note, onSave, onCancel }: EditorViewProps) => {
    const [title, setTitle] = useState(note?.title ?? '');
    const [content, setContent] = useState(note?.content ?? '');
    const contentRef = useRef<TextInput>(null);

    const handleSave = () => {
        if (!title.trim() && !content.trim()) {
            onCancel();
            return;
        }
        onSave(title.trim(), content.trim());
    };

    return (
        <KeyboardAvoidingView
            style={styles.editorContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Editor Header */}
            <View style={styles.editorHeader}>
                <Pressable
                    onPress={onCancel}
                    style={({ pressed }) => [styles.editorHeaderBtn, pressed && { opacity: 0.6 }]}
                >
                    <MaterialCommunityIcons name="arrow-left" size={22} color="#FF8A8A" />
                    <Text style={styles.editorHeaderBtnText}>{t('os.notes')}</Text>
                </Pressable>

                <Pressable
                    onPress={handleSave}
                    style={({ pressed }) => [
                        styles.editorSaveBtn,
                        pressed && styles.editorSaveBtnPressed,
                    ]}
                >
                    <LinearGradient
                        colors={['#FF8A8A', '#FF8A8A']}
                        style={StyleSheet.absoluteFillObject}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                    <Text style={styles.editorSaveBtnText}>{t('os.save')}</Text>
                </Pressable>
            </View>

            {/* Gold rule */}
            <View style={styles.editorRule} />

            {/* Title */}
            <TextInput
                style={styles.editorTitleInput}
                value={title}
                onChangeText={setTitle}
                placeholder={t('os.title')}
                placeholderTextColor="#535B5F"
                returnKeyType="next"
                onSubmitEditing={() => contentRef.current?.focus()}
                autoFocus={!note}
                maxLength={120}
                selectionColor="#FF8A8A"
            />

            {/* Divider */}
            <View style={styles.editorTitleDivider} />

            {/* Content */}
            <TextInput
                ref={contentRef}
                style={styles.editorContentInput}
                value={content}
                onChangeText={setContent}
                placeholder={t('os.startWritingYourNote')}
                placeholderTextColor="#323A40"
                multiline
                textAlignVertical="top"
                selectionColor="#FF8A8A"
            />
        </KeyboardAvoidingView>
    );
};

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = ({ onNew }: { onNew: () => void }) => (
    <View style={styles.emptyState}>
        <LinearGradient
            colors={['rgba(5,168,246,0.12)', 'rgba(5,168,246,0.04)']}
            style={styles.emptyIconCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <MaterialCommunityIcons name="note-text-outline" size={44} color="#FF8A8A" />
        </LinearGradient>
        <Text style={styles.emptyTitle}>{t('os.noNotesYet')}</Text>
        <Text style={styles.emptySubtitle}>
            Tap the + button to create{'\n'}your first note.
        </Text>
        <Pressable
            style={({ pressed }) => [styles.emptyAction, pressed && { opacity: 0.7 }]}
            onPress={onNew}
        >
            <Text style={styles.emptyActionText}>{t('os.newNote')}</Text>
        </Pressable>
    </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

type ViewMode = 'list' | 'editor';

const NotesScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { notes, addNote, updateNote, deleteNote } = useNotesStore();

    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [editingNote, setEditingNote] = useState<Note | null>(null);

    // Open editor for a new note (null = new)
    const handleNewNote = useCallback(() => {
        setEditingNote(null);
        setViewMode('editor');
    }, []);

    // Open editor for an existing note
    const handleEditNote = useCallback((note: Note) => {
        setEditingNote(note);
        setViewMode('editor');
    }, []);

    const handleSave = useCallback(
        (title: string, content: string) => {
            if (editingNote) {
                updateNote(editingNote.id, title, content);
            } else {
                addNote({
                    id: generateId(),
                    title,
                    content,
                    date: todayISO(),
                });
            }
            setViewMode('list');
            setEditingNote(null);
        },
        [editingNote, addNote, updateNote],
    );

    const handleCancel = useCallback(() => {
        setViewMode('list');
        setEditingNote(null);
    }, []);

    // ── Editor View ──────────────────────────────────────────────────────────

    if (viewMode === 'editor') {
        return (
            <View style={styles.root}>
                <StatusBar barStyle="light-content" />
                <LinearGradient
                    colors={['#1C242C', '#1C242C', '#1C242C']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
                <View style={[styles.safeArea, { paddingTop: insets.top }]}>
                    <EditorView
                        note={editingNote}
                        onSave={handleSave}
                        onCancel={handleCancel}
                    />
                </View>
            </View>
        );
    }

    // ── List View ────────────────────────────────────────────────────────────

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
                {/* ── Header ── */}
                <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                    <Pressable
                        onPress={() => navigation.goBack()}
                        style={({ pressed }) => [
                            styles.backBtn,
                            pressed && { opacity: 0.6, transform: [{ scale: 0.95 }] },
                        ]}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#FF8A8A" />
                    </Pressable>

                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>{t('os.notes2')}</Text>
                        <View style={styles.headerAccent} />
                    </View>

                    <Pressable
                        onPress={handleNewNote}
                        style={({ pressed }) => [
                            styles.addBtn,
                            pressed && { opacity: 0.6, transform: [{ scale: 0.92 }] },
                        ]}
                    >
                        <LinearGradient
                            colors={['#FF8A8A', '#FF8A8A']}
                            style={StyleSheet.absoluteFillObject}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        />
                        <MaterialCommunityIcons name="plus" size={22} color="#FFFFFF" />
                    </Pressable>
                </View>

                {/* ── Notes count badge ── */}
                {notes.length > 0 && (
                    <View style={styles.countBadgeRow}>
                        <Text style={styles.countBadge}>
                            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
                        </Text>
                    </View>
                )}

                {/* ── List ── */}
                {notes.length === 0 ? (
                    <EmptyState onNew={handleNewNote} />
                ) : (
                    <FlatList
                        data={notes}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <NoteCard
                                note={item}
                                onPress={handleEditNote}
                                onDelete={deleteNote}
                            />
                        )}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                )}

                {/* Universal Crystal Navigation Bar */}
            </View>
        </View>
    );
};

export default NotesScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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
    addBtn: {
        width: 38,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        right: 16,
        bottom: 12,
        zIndex: 10,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#1C242C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 6,
    },

    // ── Count badge ───────────────────────────────────────────────────────────
    countBadgeRow: {
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    countBadge: {
        fontSize: 11,
        color: '#FFFFFF',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        fontWeight: '600',
    },

    // ── Note List ─────────────────────────────────────────────────────────────
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 140,
    },
    separator: {
        height: 10,
    },
    noteCard: {
        backgroundColor: '#434B50',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        flexDirection: 'row',
        overflow: 'hidden',
        shadowColor: '#1C242C',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
    },
    noteCardPressed: {
        opacity: 0.75,
        transform: [{ scale: 0.985 }],
    },
    noteAccentBar: {
        width: 3,
        borderRadius: 0,
    },
    noteCardBody: {
        flex: 1,
        padding: 14,
        gap: 5,
    },
    noteCardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    noteTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.2,
        marginRight: 8,
    },
    deleteBtn: {
        padding: 4,
        borderRadius: 8,
        backgroundColor: 'rgba(5,168,246,0.06)',
    },
    notePreview: {
        fontSize: 13,
        color: '#FFFFFF',
        lineHeight: 18,
    },
    noteFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    noteDate: {
        fontSize: 10,
        color: '#FFFFFF',
        letterSpacing: 0.5,
        fontWeight: '500',
    },

    // ── Empty State ───────────────────────────────────────────────────────────
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        gap: 14,
        marginTop: -60,
    },
    emptyIconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(5,168,246,0.2)',
        marginBottom: 8,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 21,
    },
    emptyAction: {
        marginTop: 8,
        backgroundColor: 'rgba(5,168,246,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(5,168,246,0.3)',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 32,
    },
    emptyActionText: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.textPrimary,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },

    // ── Editor ────────────────────────────────────────────────────────────────
    editorContainer: {
        flex: 1,
    },
    editorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    editorHeaderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingRight: 12,
    },
    editorHeaderBtnText: {
        fontSize: 16,
        color: theme.colors.textPrimary,
        fontWeight: '600',
    },
    editorSaveBtn: {
        borderRadius: 10,
        overflow: 'hidden',
        paddingVertical: 9,
        paddingHorizontal: 20,
        shadowColor: '#1C242C',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 5,
    },
    editorSaveBtnPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.96 }],
    },
    editorSaveBtnText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 2,
    },
    editorRule: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(5,168,246,0.15)',
        marginHorizontal: 16,
        marginBottom: 12,
    },
    editorTitleInput: {
        fontSize: 26,
        fontWeight: '700',
        color: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 8,
        letterSpacing: 0.2,
    },
    editorTitleDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(255,255,255,0.07)',
        marginHorizontal: 20,
        marginVertical: 8,
    },
    editorContentInput: {
        flex: 1,
        fontSize: 15,
        color: 'rgba(255,255,255,0.48)',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 20,
        lineHeight: 24,
    },
});
