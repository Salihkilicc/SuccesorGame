// src/components/story/NewGameQuestion.tsx
//
// ============================================================================
//  PLAY THE FIRST YEAR AGAIN, OR START PAST IT
// ============================================================================
//
//  The only question this game asks between runs, and it used to arrive as an
//  `Alert.alert` - a white iOS sheet dropped into a dark game, with the two
//  answers rendered as system buttons. That is the exact complaint ConfirmPanel
//  was written to answer.
//
//  ---------------------------------------------------------------------------
//  WHY IT IS MOUNTED ONCE, AT THE ROOT
//  ---------------------------------------------------------------------------
//  Two screens start a new game - Settings and the game over card on Home - and
//  BOTH of them are going away the moment the answer is given, because a new
//  game tears down every store behind them. A dialog owned by either screen
//  would be unmounting itself while it waited for its own promise.
//
//  So it lives above the navigator, next to the nav bar and the tutorial layer,
//  and the question is held in a store rather than in props. The two callers
//  ask the same question by construction rather than by both remembering to.
//
//  It renders nothing at all until somebody asks. See core/newGamePrompt.ts.
// ============================================================================

import React from 'react';
import ConfirmPanel from '../common/ConfirmPanel';
import { t } from '../../core/i18n';
import { useNewGameQuestion } from '../../core/newGamePrompt';

const NewGameQuestion = () => {
    const asking = useNewGameQuestion(s => s.asking);
    const mode = useNewGameQuestion(s => s.mode);
    const answer = useNewGameQuestion(s => s.answer);

    if (!asking || !answer) return null;

    // ------------------------------------------------------------------
    //  STEP ONE: MAY THIS RUN BE THROWN AWAY
    // ------------------------------------------------------------------
    //  Settings used to raise its own `Alert.alert` for this and only then
    //  reach the themed question below - so the first thing the player saw
    //  was a white iOS sheet, which is why the panel still read as a warning
    //  after it had been themed. One flow, one dialog, both steps here.
    // ------------------------------------------------------------------
    // ------------------------------------------------------------------
    //  STEP ZERO, ON ONE ROUTE ONLY: ARE YOU SURE YOU WANT TO BE SOMEBODY ELSE
    // ------------------------------------------------------------------
    //  Its own panel rather than the erase copy with a different title. The
    //  erase warning is about a save; this one is about a save AND about
    //  being sent back through the form that asks your name, your gender and
    //  what the company is called. Telling a player only the first half and
    //  then showing them the second is how a warning stops being one.
    // ------------------------------------------------------------------
    if (mode === 'newCharacter') {
        return (
            <ConfirmPanel
                visible
                title={t('newGame.characterTitle')}
                summary={t('newGame.characterSummary')}
                note={t('newGame.characterNote')}
                tone="danger"
                confirmLabel={t('newGame.characterConfirm')}
                cancelLabel={t('newGame.characterCancel')}
                onConfirm={() => answer('erase')}
                onCancel={() => answer('cancel')}
            />
        );
    }

    if (mode === 'erase') {
        return (
            <ConfirmPanel
                visible
                title={t('newGame.eraseTitle')}
                summary={t('newGame.eraseSummary')}
                note={t('newGame.eraseNote')}
                tone="danger"
                confirmLabel={t('newGame.eraseConfirm')}
                cancelLabel={t('newGame.eraseCancel')}
                onConfirm={() => answer('erase')}
                onCancel={() => answer('cancel')}
            />
        );
    }

    return (
        <ConfirmPanel
            visible
            title={t('newGame.title')}
            summary={t('newGame.summary')}
            choices={[
                {
                    label: t('newGame.play'),
                    description: t('newGame.playWhy'),
                    icon: 'book-open-page-variant-outline',
                    tone: 'brand',
                    onPress: () => answer('play'),
                },
                {
                    label: t('newGame.skip'),
                    description: t('newGame.skipWhy'),
                    icon: 'fast-forward-outline',
                    tone: 'primary',
                    onPress: () => answer('skip'),
                },
            ]}
            // ----------------------------------------------------------------
            //  NO WAY OUT, AND THAT IS DELIBERATE
            // ----------------------------------------------------------------
            //  Both callers have already confirmed the destructive step by the
            //  time this appears; the old Alert said `cancelable: false` for
            //  the same reason. Dismissing here would leave the player looking
            //  at a save that has been half taken apart.
            //
            //  ConfirmPanel's backdrop calls `onCancel`, so answering `play`
            //  from it is what "tapping outside" does. It is the choice a
            //  player who has not decided anything would want.
            // ----------------------------------------------------------------
            confirmLabel={t('ui.close')}
            onCancel={() => answer('play')}
        />
    );
};

export default NewGameQuestion;
