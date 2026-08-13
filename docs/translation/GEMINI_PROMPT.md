# The prompt to give Gemini

Paste everything between the two rulers into Gemini, then attach (or paste)
one batch of `build/story-en.json` after it. Send the same prompt again with
each new batch — models drift on voice by line 400 and the cast notes are what
pulls them back.

---

You are translating the dialogue of **Succesor**, a narrative business
simulator, from English into Turkish. The player is the heir to a company. Over
roughly ten in-game years they run it, fight a rival, bury their father, and
decide what kind of person they became on the way.

I will give you JSON. Return JSON. Nothing else — no commentary, no markdown
fence, no explanation of your choices.

## Input and output shape

Input:

```json
{
  "father-q1": {
    "channel": "message",
    "speakerName": "Gerald Hale",
    "lines": [
      { "key": "father-q1/open", "speaker": "father", "kind": "body", "en": "..." },
      { "key": "father-q1/open#0", "speaker": "player", "kind": "choice", "en": "..." }
    ]
  }
}
```

Output — a flat object, key to Turkish string:

```json
{
  "father-q1/open": "...",
  "father-q1/open#0": "..."
}
```

Rules that are not negotiable:

- **Never change a key.** Not a character. Keys are what the game looks up; an
  altered key is a line that silently stays English forever. My importer drops
  unknown keys and tells me how many, so an invented key is wasted work.
- **Return every key I sent**, in the same order, even if your translation is
  identical to the English.
- Keep `\n\n` exactly where it is. Paragraph breaks are pacing — in the phone
  scenes a break is the character stopping to think, and merging two lines into
  one destroys the timing of the scene.
- Keep `$44bn`, `%12`, `Q3`, `18%` and every other number and unit intact.
  Convert the *format* to Turkish convention where it exists (`$1,200,000` →
  `1.200.000 $`), never the value. If you are unsure, leave the digits alone.
  Several scenes are arithmetic the player is meant to check.
- Company and person names stay in English: Hale Industries, Pear, Planora,
  Novidia, Voltmotors, Streamify, Skynet, Biogen, Halberd Partners, Kestrel.
  Turkish suffixes attach with an apostrophe: `Pear'ın`, `Planora'yı`.
- No emoji. There are none in the source and they would be wrong everywhere.

## The single most common mistake, please read this twice

`"kind": "choice"` lines are **things the player says out loud.** They are
dialogue, not stage directions and not menu items.

- `"I am counting on it."` → `"Buna güveniyorum."` — a sentence a person says.
- NOT `"Ona güvendiğinizi belirtin"` — an instruction telling the player what to
  do. This is what most models produce and it destroys the game.

The one exception: a choice wrapped in parentheses, like `(leave it)` or
`(say nothing)`, IS an action rather than a line. Keep the parentheses and
translate it as an action: `(bırak)`, `(hiçbir şey söyleme)`.

Choices are also **short by design** — median 21 characters, longest 59 —
because they are buttons on a phone screen. Turkish runs 10–20% longer than
English.

**Hard limit: 82 characters for any `"kind": "choice"` line.** That is two
lines on the smallest phone the game supports. Where a faithful translation
would run past it, rewrite it shorter — drop the subordinate clause, use the
shorter verb, cut the politeness the English did not need either. Meaning over
literalness, always. A button that reads like a paragraph has stopped being
something a person says.

This is checked automatically and a line over the limit fails the build, so
going long does not save anyone time.

Body lines (`"kind": "body"`) have no limit. They scroll.

## Register: the game says *siz*, the people in it say *sen*

This is the decision that will make or break the translation, so it is worth
being explicit.

- **Menus, buttons, system text**: not your problem — already translated.
- **The player addressing anyone**: `sen`. The player is the boss, the son, the
  friend. They do not use *siz* with their own staff.
- **Arthur Vance addressing the player**: `siz`, and it is a weapon. He is
  courteous the way a much larger man is courteous. The politeness IS the
  threat, and it should feel slightly too formal in Turkish too.
- **Marco Alvarez**: `sen`, always, no exceptions, even about a billion dollars.
- **Gerald Hale (the father)**: `sen`. He is a father, and a demanding one.
- **Julian Hale (the brother)**: `sen`.
- **Dana, Priya, Nathan Vogel (staff)**: `siz` to the player, and the player
  answers `sen`. This asymmetry is the company's hierarchy and should stay.
- **FBI, regulators, Halberd Partners, unknown numbers**: `siz`. Cold, official.

## The cast — voice notes

Roughly 40% of these lines are procedural (letters, notices, memos) and
translate cleanly. The other 60% is voice, and voice needs transcreation: get
the *effect* right, not the words. A line that is technically accurate and
sounds like nobody is a failed line.

**Gerald Hale — the father (43 lines).** Dying, and never says so. Short
sentences. He asks questions he already knows the answer to. Gives instructions
that sound like observations. Never sentimental, never explains himself, never
says he is proud. His warmth arrives only as attention to detail — he noticed
something, which is how he says he cares. Turkish should be clipped and
slightly old-fashioned. Do not soften him. Do not add the affection he is
withholding; the withholding is the character.

**Arthur Vance — Pear's CEO (87 lines, the largest part).** The antagonist, and
never once rude. Complete sentences, perfect grammar, a wide vocabulary used
precisely. He compliments you while taking something from you. He is at his most
dangerous when at his most polite. In Turkish: formal, measured, `siz`, no
contractions of the casual kind, no slang, ever. If a line of his reads as
aggressive in your translation, you have got it wrong — it should read as
*reasonable*, and only feel like a threat a second later.

**Marco Alvarez — the friend (53 lines).** The only warm person in the game. He
types in lowercase, no punctuation at the ends of sentences, run-ons, self-
interrupting. He is funny about serious things and serious about small ones. He
never asks for anything without apologising for asking.

> **Keep the lowercase.** Turkish text messages are written this way too, and
> the contrast with Arthur's flawless prose is the entire characterisation of
> both men. Do not "fix" his punctuation. Do not capitalise the start of his
> sentences. Do add Turkish's own texting texture — `ya`, `abi`, `valla`,
> `yaa` — where an English line has a filler word. He is the one character
> where a loose translation is better than a close one.

**Julian Hale — the brother (46 lines).** Charming and unreliable in the same
breath. Warm openings, and a request in the last sentence. Slightly performative
— he is playing "brother" at you. Turkish should be affectionate and a little
too smooth.

**Priya Raman — the CTO (49 lines).** Precise, technical, impatient with people
who are not. She quotes numbers. She is often right and it does not help her.
Under stress she gets *more* precise, not less. Keep the technical vocabulary
technical; do not domesticate her jargon into everyday Turkish.

**Dana Whitfield — the COO (35 lines).** Runs the factory floor. Blunt, physical,
concrete. Talks about people and machines, never about strategy. She is the only
one who will say a thing is going badly in plain words. Turkish should be direct
and working-class-competent, never crude.

**Nathan Vogel — the CFO (40 lines).** Careful. Hedges. Says "I would note" when
he means "you are about to make a mistake." His whole arc is whether he is being
listened to, so his hedging must survive translation — flattening him into
directness deletes the character.

**Field Office / Consumer Safety Directorate / regulators (36 lines).** Legal
register. Passive voice. No warmth. These should read like a real Turkish
official letter — `tarafınıza tebliğ olunur` territory. This is the one place
where stiff, bureaucratic Turkish is correct.

**Halberd Partners (18 lines), Hal Brennerman, Wen Zhao-Lindqvist, Dr Eleanor
Ratliff, ORACLE, Unknown Number (small parts).** Read the surrounding lines in
the same scene and match. ORACLE is a hacker collective — flat, technical,
faintly amused. Unknown Number is anonymous and clipped.

## Channel matters

- `"channel": "message"` — a phone. Casual, short, lowercase where the character
  is Marco. No greeting, no sign-off.
- `"channel": "mail"` — a letter. It has a `@subject` key, which is a subject
  line: keep it short and noun-heavy, the way Turkish email subjects are. The
  body has a salutation and a closing, and those should be Turkish business
  convention (`Sayın …`, `Saygılarımla`), not a literal translation of the
  English formula.

## Where a literal translation will be wrong

- **Idioms.** "burn the ships", "the writing is on the wall", "cards on the
  table" — find the Turkish that has the same force, not the same image. If none
  exists, say the plain thing plainly. A calqued English idiom is the fastest
  way to make a translation feel machine-made.
- **Corporate euphemism.** "letting people go", "right-sizing", "a difficult
  conversation" — these are deliberately evasive and the evasion must survive.
  Turkish corporate speech has its own euphemisms; use those.
- **Jokes.** Several of Marco's lines are jokes that depend on English rhythm.
  Write a Turkish joke that lands in the same place instead. This is explicitly
  permitted and explicitly wanted.
- **Titles.** CEO, CTO, CFO, COO stay as they are — they are used in Turkish
  business speech. "the board" → `yönetim kurulu`. "shareholders" → `hissedarlar`.
  "quarter" (three months) → `çeyrek`.

## Finally

If a line is genuinely ambiguous and you have to guess, guess in the direction
of **shorter and more spoken.** Every one of these strings appears on a phone
screen, inside a chat bubble or a mail body, and it is read by someone in the
middle of deciding something.

Return only the JSON object.

---

## After Gemini answers

Save its reply as `build/story-tr-01.json` (then `-02`, and so on) and run:

```
node tools/importStoryText.js build/story-tr-*.json
npx jest src/data/i18n
```

The importer merges rather than replaces, so a later batch never deletes an
earlier one. It reports two things worth reading:

- **dropped keys** — the model invented or repaired a key. Those lines were not
  imported and need re-asking.
- **lines identical to the English** — some are correct (names, `ok`). A run of
  them means a batch was skipped.

The test suite then checks the reverse failure: a dictionary key that no longer
exists in the story, which is what happens when a scene gets rewritten after it
was translated.
