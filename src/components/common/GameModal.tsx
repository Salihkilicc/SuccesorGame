import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { theme } from '../../core/theme';

type GameModalProps = {
    visible: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
    children: React.ReactNode;
};

const GameModal = ({ visible, onClose, title, subtitle, children, fixedBottomContent }: GameModalProps & { fixedBottomContent?: React.ReactNode }) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={styles.backdropLayer} />
                </TouchableWithoutFeedback>

                <View style={styles.contentWrapper}>
                    <View style={styles.container}>
                        {(title || subtitle) && (
                            <View style={styles.header}>
                                {title && <Text style={styles.title}>{title}</Text>}
                                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                            </View>
                        )}
                        {children}
                    </View>
                </View>

                {fixedBottomContent}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        // padding removed to allow full screen absolute positioning
    },
    contentWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.md,
    },
    backdropLayer: {
        ...StyleSheet.absoluteFillObject,
    },
    container: {
        width: '100%',
        maxHeight: '90%',
        backgroundColor: '#31241F', // Default dark theme background
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        shadowColor: '#31241F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    header: {
        marginBottom: theme.spacing.lg,
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: 1,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.48)',
        textAlign: 'center',
        fontStyle: 'italic',
    },
});

export default GameModal;
