// src/core/story/mailSender.test.ts
//
// ============================================================================
//  A LETTER REMEMBERS WHO SENT IT
// ============================================================================
//
//  `fromName` is a LABEL - "Nathan Vogel, CEO, Pear" - built that way on
//  purpose, because a bare name at the top of an inbox is unrecognisable. It
//  is therefore useless as a key, and measured: looking every cast member up
//  by name found zero portraits.
//
//  So `fromId` was added and the three senders that had it stopped throwing
//  it away. This is the test that the throwing away does not come back.
//
//  Written because the probe demanded it: deleting `fromId: from.id` from
//  deliver.ts left all 514 tests in core/story and features/os green. The
//  mail screen was correct and the field feeding it was unguarded - the same
//  gap that had just been found in the succession, one file along.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { deliver } from './deliver';
import { useStoryStore, initialStoryState } from '../store/useStoryStore';
import { useMailStore } from '../store/useMailStore';
import { useGameStore } from '../store/useGameStore';
import { portraitFor } from '../portraits';

const SCENE = 'event-cfo-treasury-yield';

beforeEach(() => {
    useStoryStore.setState({ ...initialStoryState });
    useMailStore.setState({ inbox: [], _hasHydrated: true } as never);
    useGameStore.setState({ currentMonth: 40 } as never);
});

describe('a delivered letter carries its sender id', () => {
    it('and the id resolves to a face', () => {
        deliver(SCENE);
        const mail = useMailStore.getState().inbox[0];
        expect(mail).toBeDefined();
        expect(mail.fromId).toBe('cfo');
        expect(portraitFor(mail.fromId)).not.toBeNull();
    });

    it('while the label stays the long readable one', () => {
        // The two do different jobs and neither should be made to do the
        // other's. The label may gain or lose a company name without any
        // consequence for the picture.
        deliver(SCENE);
        const mail = useMailStore.getState().inbox[0];
        expect(mail.fromName.length).toBeGreaterThan(mail.fromId!.length);
        expect(portraitFor(mail.fromName)).toBeNull();
    });
});

describe('every door into the inbox that has a person behind it', () => {
    // ------------------------------------------------------------------
    //  "EVERY CALLER" WAS THE WRONG RULE, AND THE TEST SAID SO
    // ------------------------------------------------------------------
    //  Written first as "every receiveMail call sets fromId", which failed
    //  and was right to: four of the seven senders are not people at all.
    //  A shop's promotion, a sponsor's offer, a negotiating counterparty and
    //  the executors of the estate have no cast id and should not pretend to.
    //  They keep the tinted circle, which is what it is for.
    //
    //  My own earlier survey missed those four entirely, because I filtered
    //  the grep on 'useMailStore' - and every one of them calls
    //  useMailStore.getState().receiveMail. The filter hid exactly what it
    //  was looking for.
    //
    //  The line between the two kinds turns out to be already drawn in the
    //  code: a sender who is a member of the cast gets their address from
    //  emailOf(), and an organisation writes its own. So that is the marker,
    //  rather than a list of file names that would go stale.
    // ------------------------------------------------------------------
    const SRC = path.resolve(__dirname, '..', '..');

    const mailCallers = (): { rel: string; src: string }[] => {
        const out: { rel: string; src: string }[] = [];
        const walk = (dir: string) => {
            for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
                const p = path.join(dir, e.name);
                if (e.isDirectory()) { walk(p); continue; }
                if (!/\.tsx?$/.test(e.name) || /\.test\./.test(e.name)) continue;
                if (p.endsWith(path.join('store', 'useMailStore.ts'))) continue;
                const src = fs.readFileSync(p, 'utf8');
                if (/receiveMail\(\{/.test(src)) out.push({ rel: path.relative(SRC, p), src });
            }
        };
        walk(SRC);
        return out;
    };

    it('there are senders of both kinds, so neither check is vacuous', () => {
        const all = mailCallers();
        const people = all.filter(c => /emailOf\(/.test(c.src));
        expect(people.length).toBeGreaterThanOrEqual(3);
        expect(all.length - people.length).toBeGreaterThanOrEqual(3);
    });

    it('and every sender who is a cast member passes their id', () => {
        const without = mailCallers()
            .filter(c => /emailOf\(/.test(c.src))
            .filter(c => [...c.src.matchAll(/receiveMail\(\{([\s\S]*?)\n\s*\}\)/g)]
                .some(m => !/fromId:/.test(m[1])))
            .map(c => c.rel);
        expect(without).toEqual([]);
    });
});
