import React from 'react';
import { t, useLocale } from '../../../../core/i18n';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Pressable,
    Dimensions,
} from 'react-native';
import { theme } from '../../../../core/theme';

type PregnancyRevealModalProps = {
    visible: boolean;
    onClose: () => void;
};

const { width } = Dimensions.get('window');

const PregnancyRevealModal = ({ visible, onClose }: PregnancyRevealModalProps) => {
    useLocale();
    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={() => { }}>
            <View style={styles.backdrop}>
                <View style={styles.card}>
                    <View style={styles.iconContainer}>
                        <Text style={styles.icon}>⏸️</Text>
                    </View>

                    <Text style={styles.title}>{t('life.unexpectedNews')}</Text>

                    <Text style={styles.description}>{t('life.yourWildNightHasLeft')}</Text>

                    <Text style={styles.subtext}>{t('life.aFewWeeksLaterYou')}</Text>

                    <Pressable onPress={onClose} style={styles.button}>
                        <Text style={styles.buttonText}>{t('life.processThis')}</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

export default PregnancyRevealModal;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: '#000000',
    },
    card: {
        flex: 1,
        width: '100%',
        backgroundColor: '#1A1A2E',
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#1A1A2E',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#C8B6FF'
    },
    icon: {
        fontSize: 40
    },
    title: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center'
    },
    description: {
        color: theme.colors.textSecondary,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 22
    },
    subtext: {
        color: '#4CC9F0',
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 32,
        fontStyle: 'italic'
    },
    button: {
        backgroundColor: '#C8B6FF',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center'
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16
    }
});
