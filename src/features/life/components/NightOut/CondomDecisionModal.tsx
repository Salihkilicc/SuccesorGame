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

type CondomDecisionModalProps = {
    visible: boolean;
    onDecision: (choice: 'safe' | 'risky') => void;
};

const { width } = Dimensions.get('window');

const CondomDecisionModal = ({ visible, onDecision }: CondomDecisionModalProps) => {
    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={() => { }}>
            <View style={styles.backdrop}>
                <View style={styles.card}>
                    <Text style={styles.title}>In the Heat of the Moment</Text>
                    <Text style={styles.description}>
                        Things are escalating quickly. The passion is intense. You pause for a split second...
                    </Text>

                    <View style={styles.buttonContainer}>
                        <Pressable
                            style={[styles.button, styles.safeButton]}
                            onPress={() => onDecision('safe')}>
                            <Text style={styles.buttonTitle}>Play it safe</Text>
                            <Text style={styles.buttonSub}>Use protection.</Text>
                        </Pressable>

                        <Pressable
                            style={[styles.button, styles.riskyButton]}
                            onPress={() => onDecision('risky')}>
                            <Text style={styles.buttonTitle}>Live in the moment</Text>
                            <Text style={styles.buttonSub}>No protection. High risk.</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default CondomDecisionModal;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(50, 0, 0, 0.9)', // slightly red tint for tension
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    card: {
        width: Math.min(340, width - 32),
        backgroundColor: '#1E1E1E',
        borderRadius: theme.radius.lg,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#444'
    },
    title: {
        color: theme.colors.error, // Red title
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 12,
        textAlign: 'center'
    },
    description: {
        color: '#CCC',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24
    },
    buttonContainer: {
        width: '100%',
        gap: 12
    },
    button: {
        padding: 16,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center'
    },
    safeButton: {
        backgroundColor: '#112',
        borderColor: theme.colors.primary,
    },
    riskyButton: {
        backgroundColor: '#211',
        borderColor: theme.colors.error,
    },
    buttonTitle: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 16,
        marginBottom: 4
    },
    buttonSub: {
        color: '#888',
        fontSize: 12
    }
});
