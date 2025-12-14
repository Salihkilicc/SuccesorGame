import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { theme } from '../../theme';

export type InteractionModalProps = {
    visible: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
};

const InteractionModal = ({ visible, onClose, title, children }: InteractionModalProps) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}>
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.content} onPress={e => e.stopPropagation()}>
                    {title && <Text style={styles.title}>{title}</Text>}
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.body}>
                            {children}
                        </View>
                    </ScrollView>
                    <Pressable
                        onPress={onClose}
                        style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}>
                        <Text style={styles.closeText}>Close</Text>
                    </Pressable>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    content: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: 'rgba(30, 34, 48, 0.95)', // Glassy dark background
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
        gap: 20,
        maxHeight: '80%',
    },
    title: {
        color: theme.colors.textPrimary,
        fontSize: 18,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    body: {
        gap: 12,
    },
    closeButton: {
        alignSelf: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginTop: 8,
    },
    closeButtonPressed: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    closeText: {
        color: theme.colors.textMuted,
        fontSize: 14,
        fontWeight: '600',
    },
});

export default InteractionModal;
