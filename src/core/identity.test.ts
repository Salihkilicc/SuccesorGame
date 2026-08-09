// src/core/identity.test.ts
//
// A length limit that lives only on a TextInput is not a limit - paste and
// autofill both walk past it. These are the rules the store enforces, so they
// are the ones worth pinning.

import {
    COMPANY_MAX,
    NAME_MAX,
    checkCompany,
    checkName,
    fullName,
    tidy,
} from './identity';

describe('tidy', () => {
    it('collapses runs of whitespace and trims', () => {
        expect(tidy('  John   Smith ')).toBe('John Smith');
    });

    it('leaves an already clean name alone', () => {
        expect(tidy('John Smith')).toBe('John Smith');
    });
});

describe('checkName', () => {
    it('accepts ordinary names', () => {
        expect(checkName('John').ok).toBe(true);
        expect(checkName('Mary Anne').ok).toBe(true);
    });

    it('accepts the punctuation real names have', () => {
        expect(checkName("O'Brien").ok).toBe(true);
        expect(checkName('Jean-Luc').ok).toBe(true);
        expect(checkName('J. Ewing').ok).toBe(true);
    });

    it('accepts non-Latin letters, because the game is played in Turkish', () => {
        expect(checkName('Şükrü').ok).toBe(true);
        expect(checkName('Öztürk').ok).toBe(true);
    });

    it('rejects one character', () => {
        expect(checkName('J').ok).toBe(false);
    });

    it('rejects anything past the limit, whatever route it came in by', () => {
        expect(checkName('x'.repeat(NAME_MAX)).ok).toBe(true);
        expect(checkName('x'.repeat(NAME_MAX + 1)).ok).toBe(false);
    });

    it('rejects digits and symbols in a person name', () => {
        expect(checkName('John3').ok).toBe(false);
        expect(checkName('John<b>').ok).toBe(false);
        expect(checkName('@john').ok).toBe(false);
    });

    it('rejects whitespace pretending to be a name', () => {
        expect(checkName('   ').ok).toBe(false);
        expect(checkName('').ok).toBe(false);
    });

    it('measures the TIDIED value, so padding cannot buy length', () => {
        // Two real characters, eighteen typed.
        expect(checkName('        Jo        ').ok).toBe(true);
        // Twenty real characters with spaces around them is still too long.
        expect(checkName(`  ${'x'.repeat(NAME_MAX + 4)}  `).ok).toBe(false);
    });
});

describe('checkCompany', () => {
    it('allows digits and ampersands, which a person name does not', () => {
        expect(checkCompany('Studio 54').ok).toBe(true);
        expect(checkCompany('Dunder & Co').ok).toBe(true);
    });

    it('holds its own longer limit', () => {
        expect(checkCompany('x'.repeat(COMPANY_MAX)).ok).toBe(true);
        expect(checkCompany('x'.repeat(COMPANY_MAX + 1)).ok).toBe(false);
    });

    it('still refuses empty and junk', () => {
        expect(checkCompany('  ').ok).toBe(false);
        expect(checkCompany('#$%').ok).toBe(false);
    });

    it('gives a reason, because the screen shows it verbatim', () => {
        const r = checkCompany('');
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.reason.length).toBeGreaterThan(10);
    });
});

describe('fullName', () => {
    it('joins without leaving a gap when half of it is missing', () => {
        expect(fullName('John', 'Smith')).toBe('John Smith');
        expect(fullName('John', '')).toBe('John');
        expect(fullName('', '')).toBe('');
    });
});
