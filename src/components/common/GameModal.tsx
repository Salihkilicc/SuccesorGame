import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { theme } from '../../core/theme';

type GameModalProps = {
    visible: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
    children: React.ReactNode;
    /**
     * Render as a plain full-screen view instead of a Modal.
     *
     * Needed because an RN Modal draws above EVERYTHING in the tree - the
     * app's single nav bar included. A section that is a destination rather
     * than a transient decision is now a route, and a route must not put a
     * Modal between itself and the bar.
     */
    asScreen?: boolean;
};

const GameModal = ({ visible, onClose, title, subtitle, children, fixedBottomContent, asScreen }: GameModalProps & { fixedBottomContent?: React.ReactNode }) => {
    if (asScreen) {
        if (!visible) return null;
        return (
            <View style={styles.screenRoot}>
                <View style={styles.screenBody}>
                    {(title || subtitle) && (
                        <View style={styles.header}>
                            {title && <Text style={styles.title}>{title}</Text>}
                            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                        </View>
                    )}
                    {children}
                </View>
                {fixedBottomContent}
            </View>
        );
    }

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
    screenRoot: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    screenBody: {
        flex: 1,
        padding: theme.spacing.md,
        // Clear of the nav bar, which now sits above every screen.
        paddingBottom: 110,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(28,36,44,0.85)',
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
        backgroundColor: '#1C242C', // Default dark theme background
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        shadowColor: '#1C242C',
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
