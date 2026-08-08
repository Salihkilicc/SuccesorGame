// src/components/common/ScreenHost.tsx
//
// ============================================================================
//  MODAL OR SCREEN, ONE COMPONENT
// ============================================================================
//
//  Board Members, Finance, My Empire, Hostile Takeover and the Stock Market
//  are routes now rather than popups. The components themselves did not need
//  rewriting - only their outer shell did, because an RN Modal draws above
//  EVERYTHING in the tree, the app's single nav bar included.
//
//  That is the reason the bar used to disappear on those sections, and why on
//  the ones that drew their own copy inside the modal it was visible but
//  outside the touchable area: present, and doing nothing.
//
//  So: `asScreen` renders a plain full-screen View, and anything else behaves
//  exactly as the Modal did. The same component can still be raised as a
//  modal from somewhere else without a second implementation.
// ============================================================================

import React from 'react';
import { Modal, View, StyleSheet, type ModalProps } from 'react-native';
import { theme } from '../../core/theme';

type Props = ModalProps & {
    asScreen?: boolean;
    children: React.ReactNode;
};

const ScreenHost = ({ asScreen, visible, children, ...modalProps }: Props) => {
    if (asScreen) {
        if (visible === false) return null;
        return <View style={styles.root}>{children}</View>;
    }
    return (
        <Modal visible={visible} {...modalProps}>
            {children}
        </Modal>
    );
};

export default ScreenHost;

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
});
