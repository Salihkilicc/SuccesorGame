// src/features/profile/components/CeoStatusHeader.tsx
//
// ============================================================================
//  CEO IDENTITY HEADER CARD
// ============================================================================
//
//  Clean, solid executive navy/blue card showing CEO avatar monogram,
//  full name, and corporate role using the game's signature electric blue tone.
//
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../core/theme';
import Portrait from '../../../components/common/Portrait';
import { faceFor } from '../../../core/portraits/faces';
import { portraitFor } from '../../../core/portraits';
import { t } from '../../../core/i18n';

interface CeoStatusHeaderProps {
    ceoFullName: string;
    companyName: string;
    /** Which way the player was drawn. Chooses between the two player faces. */
    gender?: 'male' | 'female';
    /**
     * The heir in the chair, once it is not the founder any more.
     *
     * Undefined for the founder and for every save older than the field.
     */
    ceoId?: string;
    /** Their age, so an heir gets a face from their own band. */
    ceoAge?: number;
}

export const CeoStatusHeader: React.FC<CeoStatusHeaderProps> = ({
    ceoFullName,
    companyName,
    gender,
    ceoId,
    ceoAge,
}) => {
    // ------------------------------------------------------------------
    //  THE PERSON IN THE CHAIR, WHICH IS NOT ALWAYS THE PLAYER
    // ------------------------------------------------------------------
    //  The founder has a portrait drawn for them: player_male and
    //  player_female, one each, chosen by the answer given at the start. Not
    //  a pool draw - these two are of the player specifically.
    //
    //  After a succession the chair holds a child, and they should keep the
    //  face they had in the family list rather than inheriting the founder's
    //  photograph, which belongs to a different person. `ceoId` is what makes
    //  that possible; it was being computed and thrown away until now.
    //
    //  Both paths can come back null - an unrecognised gender, a save with no
    //  ceoId, an heir with no age on record - and the card falls back to the
    //  monogram it has always drawn.
    // ------------------------------------------------------------------
    const face = ceoId
        ? faceFor({
            id: ceoId,
            name: ceoFullName,
            female: gender === undefined ? undefined : gender === 'female',
            age: ceoAge,
        })
        : portraitFor(gender === 'female' ? 'player_female' : gender === 'male' ? 'player_male' : null);

    return (
        <View style={styles.card}>
            <View style={styles.topRow}>
                <Portrait
                    id={ceoId || (gender === 'female' ? 'player_female' : 'player_male')}
                    name={ceoFullName}
                    size={48}
                    borderWidth={0}
                    fill="#0D2335"
                    source={face as number | null}
                    style={styles.avatar}
                />
                <View style={styles.nameBlock}>
                    <Text style={styles.ceoName} numberOfLines={1}>
                        {ceoFullName}
                    </Text>
                    <Text style={styles.subtitle}>
                        {t('profile.ceoRole')} • <Text style={styles.companyHighlight}>{companyName}</Text>
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#183852', // Solid rich executive navy blue fill, NO border
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    /** Only the row spacing. Portrait owns the circle, through props. */
    avatar: {
        marginRight: 14,
    },
    // SHELVED, not deleted: the circle this header drew before it could hold
    // a face. Identical through Portrait - 48 across, radius half of it, the
    // same #0D2335 - and 48 * 0.36 rounds to the same 17 point monogram.
    //
    // The old code ended with `|| 'CEO'` for an empty name. That branch was
    // unreachable: ceoFullName is built as `${first} Hale` with first
    // defaulting to 'Salih', so it is never empty.
    //
    // avatar: {
    //     width: 48,
    //     height: 48,
    //     borderRadius: 24,
    //     backgroundColor: '#0D2335',
    //     alignItems: 'center',
    //     justifyContent: 'center',
    //     marginRight: 14,
    // },
    // avatarText: {
    //     color: '#FFFFFF',
    //     fontSize: 17,
    //     fontWeight: '800',
    //     letterSpacing: 0.5,
    // },
    nameBlock: {
        flex: 1,
        justifyContent: 'center',
    },
    ceoName: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 3,
    },
    subtitle: {
        color: '#7DD3FC',
        fontSize: 13,
        fontWeight: '500',
    },
    companyHighlight: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
});

export default CeoStatusHeader;
