import React from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, Pressable, TextInput, Modal, StyleSheet } from 'react-native';

interface Props {
    visible: boolean;
    pendingChildGender: 'Male' | 'Female';
    childName: string;
    onChangeName: (name: string) => void;
    onConfirm: () => void;
    onSkip: () => void;
}

const BabyNamingModal: React.FC<Props> = ({
    visible,
    pendingChildGender,
    childName,
    onChangeName,
    onConfirm,
    onSkip,
}) => {
    useLocale();
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onSkip}
        >
            <View style={styles.namingOverlay}>
                <View style={styles.namingCard}>
                    {/* Header */}
                    <Text style={styles.namingHeadEmoji}>👶</Text>
                    <Text style={styles.namingTitle}>{t('love.aNewLife')}</Text>
                    <Text style={styles.namingSubtitle}>
                        {'Congratulations! You just had a ' + (pendingChildGender === 'Female' ? 'baby girl' : 'baby boy') + '.\nWhat will you name them?'}
                    </Text>

                    {/* Input */}
                    <TextInput
                        style={styles.namingInput}
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        placeholder={t('love.enterAName')}
                        value={childName}
                        onChangeText={onChangeName}
                        autoFocus
                        maxLength={20}
                    />

                    {/* Confirm */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.namingConfirm,
                            (!childName.trim()) && styles.namingConfirmDisabled,
                            pressed && { opacity: 0.8 },
                        ]}
                        onPress={onConfirm}
                        disabled={!childName.trim()}
                    >
                        <Text style={styles.namingConfirmText}>{t('love.confirmName')}</Text>
                    </Pressable>

                    {/* Dismiss (skip naming) */}
                    <Pressable style={styles.namingSkip} onPress={onSkip}>
                        <Text style={styles.namingSkipText}>{t('love.skip')}</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

export default BabyNamingModal;

const styles = StyleSheet.create({
    namingOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    namingCard: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: '#000000',
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        gap: 16,
        borderWidth: 1,
        borderColor: 'rgba(250,204,21,0.3)',
        shadowColor: '#E3A857',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 20,
    },
    namingHeadEmoji: {
        fontSize: 52,
    },
    namingTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    namingSubtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    namingInput: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(250,204,21,0.35)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    namingConfirm: {
        width: '100%',
        backgroundColor: '#E3A857',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    namingConfirmDisabled: {
        opacity: 0.35,
    },
    namingConfirmText: {
        color: '#000000',
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    namingSkip: {
        paddingVertical: 10,
    },
    namingSkipText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 13,
        fontWeight: '500',
    },
});
