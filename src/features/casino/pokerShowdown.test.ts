// src/features/casino/pokerShowdown.test.ts
//
// ============================================================================
//  NOBODY EVER SHOWED THEIR CARDS
// ============================================================================
//
//  Asked for as "let us see the winners' hands at the end in poker".
//
//  Until now the opponents' cards were never shown at all. The hand ended, a
//  line of status text said something like "Two Pair takes it", and that was
//  the whole of it - the player could not check it, could not see who had been
//  bluffing, and could not learn anything about how the five of them play.
//
//  Which is most of why the table felt like it was RESOLVING rather than being
//  played. Poker is a game of reading people; there was nothing to read. The
//  bluff discount in pokerBots.ts, the four personalities, the judgement
//  spread - all of that machinery was invisible from the player's chair,
//  because the only evidence of it ever produced was thrown away at the
//  showdown.
//
//  ---------------------------------------------------------------------------
//  AND THE ENGINE ALREADY KNEW WHO HAS TO SHOW
//  ---------------------------------------------------------------------------
//  `reveal` is set only in the branch of `finish` where two or more players
//  are still in - the branch where somebody paid to see it. When everybody
//  else folds it is left EMPTY, which is the real rule: a pot nobody called is
//  a pot nobody shows their cards for. So the screen needs no rule of its own;
//  it renders what is there. That is the difference between a fix and a
//  feature bolted beside the model.
//
//  This is the classic failure of this codebase in reverse. Usually it is
//  correct data that nothing reads. Here it is correct data that nothing read
//  for weeks - `reveal` has been populated and discarded this whole time.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { CARD_SHOW_MS } from './components/AnimatedCard';
import { SHOWN_CARD_W } from './components/PokerSeat';
import { SHOWDOWN_MS, STREET_BEAT_MS } from './logic/useSixHandedPoker';
import { advanceToHuman, applyAction, finish, startRound } from '../../core/casino/pokerRound';
import { seatBots } from '../../core/casino/pokerBots';

const read = (...p: string[]) => fs.readFileSync(path.join(__dirname, ...p), 'utf8');
const seat = () => read('components', 'PokerSeat.tsx');
const screen = () => read('screens', 'PokerGameScreen.tsx');

/** A table of five, dealt from a fixed die so the hand is the same every run. */
const table = (seed = 1) => {
    let n = seed;
    const roll = () => {
        n = (n * 1103515245 + 12345) % 2147483648;
        return n / 2147483648;
    };
    const bots = seatBots(['A', 'B', 'C', 'D'], false, roll);
    return {
        round: startRound([
            { id: 'you', name: 'You', bot: null, stack: 20_000 },
            ...bots.map((b, i) => ({ id: `s${i}`, name: b.name, bot: b, stack: 20_000 })),
        ], 100, roll),
        roll,
    };
};

describe('the engine says who has to show, and it always did', () => {
    it('everybody still in at the showdown is revealed', () => {
        const { round, roll } = table(7);
        let s = round;
        // Everyone checks it down to the river.
        for (let i = 0; i < 60 && !s.done; i++) {
            s = s.players[s.turn].bot ? advanceToHuman(s, () => 0.5) : applyAction(s, 'call', 0);
        }
        if (s.reveal.length > 0) {
            const live = s.players.filter(p => !p.folded);
            expect(s.reveal.length).toBe(live.length);
            for (const r of s.reveal) {
                expect(live.some(p => p.id === r.id)).toBe(true);
                expect(typeof r.rank.name).toBe('string');
                expect(r.rank.name.length).toBeGreaterThan(0);
            }
        }
        expect(roll).toBeDefined();
    });

    it('and nobody shows when everybody else folded', () => {
        // THE REAL RULE, and the engine has always had it: `reveal` is only
        // set in the branch where two or more players are still in.
        const { round } = table(3);
        let s = { ...round, players: round.players.map((p, i) => ({ ...p, folded: i !== 0 })) };
        s = finish(s);
        expect(s.winners).toEqual(['you']);
        expect(s.reveal).toEqual([]);
    });

    it('and a split pot reveals every winner, not just the first', () => {
        const { round } = table(11);
        const s = finish(round);
        for (const w of s.winners) {
            expect(s.reveal.some(r => r.id === w)).toBe(true);
        }
    });
});

describe('and the seat draws the hand it was given', () => {
    it('it takes the cards, what they made, and whether they won', () => {
        const src = seat();
        expect(src).toMatch(/hole\?: Card\[\];/);
        expect(src).toMatch(/handName\?: string;/);
        expect(src).toMatch(/winner\?: boolean;/);
    });

    it('and draws them with the same card everything else uses', () => {
        // NOT A SECOND MINI CARD COMPONENT. One that had to be taught the
        // flip, the deal and the backface again would drift from the real one
        // the first time either changed.
        const src = seat();
        expect(src).toMatch(/import AnimatedCard from '\.\/AnimatedCard'/);
        expect(src).toMatch(/width=\{SHOWN_CARD_W\}/);
        expect(src).not.toMatch(/MiniCard|SmallCard/);
    });

    it('and two of them fit inside a seat', () => {
        // Or the hand is clipped and showing it achieves nothing.
        const wrap = seat().slice(seat().indexOf('wrap: {'));
        const seatWidth = Number((wrap.match(/width: (\d+)/) || [])[1]);
        expect(seatWidth).toBeGreaterThan(0);
        expect(SHOWN_CARD_W * 2 + 3).toBeLessThan(seatWidth);
    });

    it('and the cards replace the action bubble rather than crowd it', () => {
        // "CALL 8M" is history once the cards are up.
        // The block grew when the room's card back was threaded through, so
        // this counts the structure rather than a character budget.
        expect(seat()).toMatch(/\{showing \? \([\s\S]*?\) : !!lastAction && \(/);
    });

    it('and the winner is marked without green', () => {
        // The house rule: green and red are profit and loss and nothing else.
        // The room's tint carries it, and only as TEXT and a ring.
        const src = seat();
        expect(src).toMatch(/borderColor: active \|\| winner \? tint : ring/);
        expect(src).toMatch(/winner && \{ color: tint \}/);
        expect(src).not.toMatch(/backgroundColor: *['"]#([0-9A-Fa-f]{0,2})(4A|22|00)[0-9A-Fa-f]*['"].*win/i);
    });
});

describe('and the screen joins the reveal to the seats', () => {
    it('by id, rather than by position', () => {
        // Seat order and reveal order are not the same list: `reveal` only
        // holds the players who were still in.
        expect(screen()).toMatch(/round\?\.reveal\?\.find\(r => r\.id === o\.id\)/);
    });

    it('and only hands that are being shown go face up', () => {
        expect(screen()).toMatch(/hole=\{shown \? p\?\.hole : undefined\}/);
        expect(screen()).toMatch(/handName=\{shown\?\.rank\.name\}/);
        expect(screen()).toMatch(/winner=\{!!round\?\.winners\?\.includes\(o\.id\)\}/);
    });

    it('and your own hand is named too', () => {
        // The more useful half. Being shown the flush that beat you teaches
        // nothing unless you can also see that you had two pair.
        const src = screen();
        expect(src).toMatch(/const yourHand = round\?\.reveal\?\.find\(r => r\.id === yourId\)\?\.rank\.name/);
        expect(src).toMatch(/\{yourHand\.toUpperCase\(\)\}/);
    });

    it('and the seat the player sits in is not spelled out twice', () => {
        // `'you'` written here and HUMAN_SEAT written in the engine is two
        // definitions of the same fact.
        const src = screen();
        expect(src).toMatch(/import \{ HUMAN_SEAT \} from '\.\.\/\.\.\/\.\.\/core\/casino\/pokerRound'/);
        expect(src).toMatch(/round\?\.players\?\.\[HUMAN_SEAT\]\?\.id/);
    });
});

describe('and the table waits while you look at it', () => {
    it('the pause covers the turn and the reading, not just the turn', () => {
        expect(SHOWDOWN_MS).toBeGreaterThan(CARD_SHOW_MS + STREET_BEAT_MS);
    });

    it('and it grew when the thing it waits for grew', () => {
        // It was 900 when there was nothing to look at but the last board
        // card. Five hands turning over is a different amount of watching.
        expect(SHOWDOWN_MS).toBeGreaterThan(900);
    });

    it('and the pot is still awarded only after it', () => {
        expect(read('logic', 'useSixHandedPoker.ts'))
            .toMatch(/setTimeout\(\(\) => settle\(from\), SHOWDOWN_MS\)/);
    });
});

describe('and a mini card is a smaller card, not a squashed one', () => {
    it('everything on it scales off one factor', () => {
        const src = read('components', 'AnimatedCard.tsx');
        expect(src).toMatch(/const k = width \/ CARD_W;/);
        expect(src).toMatch(/const height = CARD_H \* k;/);
    });

    it('and the redundant second corner is dropped when it cannot be read', () => {
        // Four pieces of type on a 27 point card is none of them legible.
        // The bottom corner exists so a fanned hand reads from either end,
        // which nothing here does.
        expect(read('components', 'AnimatedCard.tsx')).toMatch(/\{k > 0\.7 && \(/);
    });

    it('and the full size card is unchanged, so the tables are untouched', () => {
        const src = read('components', 'AnimatedCard.tsx');
        expect(src).toMatch(/width = CARD_W,/);
        expect(src).toMatch(/export const CARD_W = 62;/);
        expect(src).toMatch(/export const CARD_H = 88;/);
    });
});
