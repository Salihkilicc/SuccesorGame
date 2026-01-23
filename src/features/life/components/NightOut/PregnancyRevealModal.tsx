import React from 'react';
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

                    <Text style={styles.title}>Unexpected News...</Text>

                    <Text style={styles.description}>
                        Your wild night has left a permanent mark. You are going to be a parent.
                    </Text>

                    <Text style={styles.subtext}>
                        A few weeks later, you receive a message that changes everything.
                    </Text>

                    <Pressable onPress={onClose} style={styles.button}>
                        <Text style={styles.buttonText}>Process this...</Text>
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
        backgroundColor: 'rgba(0,0,0,0.95)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    card: {
        width: Math.min(320, width - 32),
        backgroundColor: '#1E1E1E',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#2A2A2A',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#444'
    },
    icon: {
        fontSize: 40
    },
    title: {
        color: '#FFF',
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
        color: '#666',
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 32,
        fontStyle: 'italic'
    },
    button: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center'
    },
    buttonText: {
        color: '#000',
        fontWeight: '700',
        fontSize: 16
    }
});
