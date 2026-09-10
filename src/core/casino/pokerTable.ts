// src/core/casino/pokerTable.ts
//
// ============================================================================
//  WHO IS SITTING THERE
// ============================================================================
//
//  Asked for as: "the opponents should be the CEOs of the other companies, and
//  you should race them. In the VIP room the table is CEOs; in the cities it
//  is random people, though a CEO can turn up. And the board members too."
//
//  The point of it is that a poker table is the ONE place in this game where
//  the people you spend the rest of your career reading a share price about
//  are sitting across from you with a face and a stack of chips. Beating Pear
//  out of four hundred million at a card table is a different thing from
//  taking four hundred million of their market share, and it should be.
//
//  ---------------------------------------------------------------------------
//  WHAT THIS FILE KNOWS AND WHAT IT REFUSES TO
//  ---------------------------------------------------------------------------
//  It knows the ROSTER - which companies exist and who runs them, which
//  strangers might be in a casino in Athens. It does not know how any of them
//  plays: that is pokerBots.ts, which takes names and hands back players.
//
//  Keeping those apart matters because the two change for different reasons.
//  Adding a rival company should not touch the betting logic, and tuning a
//  personality should not touch the roster.
//
//  PURE. The competitor list is read through a guarded require so this file
//  works in a test with no stores running.
// ============================================================================

export type SeatKind = 'ceo' | 'board' | 'stranger' | 'magnate';

export interface Opponent {
    id: string;
    name: string;
    kind: SeatKind;
    /** The company they run, when they run one. Shown under the name. */
    company?: string;
    /** 0-100 where known. A strong rival plays better. */
    strength?: number;
}

// ============================================================================
//  THE ROSTER
// ============================================================================
//
//  The market data carries COMPANY names, not people. So the chief executives
//  are named here, one per listed rival, keyed by the same stock id the rest
//  of the game uses - which means the same company always sends the same
//  person, and a player who beat Pear's CEO last year meets him again.
//
//  Anonymous rivals would have been easier and would have thrown away the
//  entire point of the request.
// ============================================================================

export const CEO_NAMES: Readonly<Record<string, string>> = {
    // ---- technology ----
    tech_pear: 'Adrian Voss',
    tech_micro: 'Petra Lindqvist',
    tech_face: 'Dmitri Sokolov',
    tech_intel: 'Harold Ng',
    tech_spot: 'Ines Duarte',
    tech_start: 'Kaya Aydin',
    tech_chat: 'Rowan Beck',
    tech_chip: 'Sunil Varma',
    tech_gpt: 'Delphine Roy',
    // ---- industrial ----
    ind_cat: 'Robert Falk',
    ind_edison: 'Lucas Meier',
    ind_gm: 'Deborah Tran',
    ind_lmt: 'Margaret Osei',
    ind_solar: 'Bruno Salgado',
    ind_spacey: 'Idris Kane',
    ind_spce: 'Vera Holm',
    // ---- health ----
    health_bio: 'Dr Amara Diallo',
    health_cure: 'Yuki Tanabe',
    health_jnj: 'Charles Whitlock',
    health_med: 'Nadia Rahman',
    health_pfiz: 'Gustav Lindeberg',
};

/**
 * And which way each of the twenty one was drawn.
 *
 * Keyed on the same stock id as CEO_NAMES, so the two cannot drift into
 * different lengths without the test below noticing. Same reasoning as
 * `Magnate.female` above: the answer belongs in the app, and the Python that
 * draws their faces reads it from here.
 */
export const CEO_FEMALE: Readonly<Record<string, boolean>> = {
    tech_pear: false,
    tech_micro: true,
    tech_face: false,
    tech_intel: false,
    tech_spot: true,
    tech_start: true,
    tech_chat: false,
    tech_chip: false,
    tech_gpt: true,
    ind_cat: false,
    ind_edison: false,
    ind_gm: true,
    ind_lmt: true,
    ind_solar: false,
    ind_spacey: false,
    ind_spce: true,
    health_bio: true,
    health_cure: true,
    health_jnj: false,
    health_med: true,
    health_pfiz: false,
};

/**
 * Which way a named player at the table was drawn, from their seat id.
 *
 * ONE DOOR for the two rosters. A rival chief executive is keyed by their
 * stock id and a magnate by their own, and every caller that needs a gender
 * asks here rather than knowing which of the two tables to look in.
 *
 * `undefined` for a stranger, and that is a real answer rather than a gap:
 * the stranger pool is 153 first names with no sex recorded anywhere, and
 * guessing one is how a man ended up being called Emma. See
 * love/logic/partnerGenerator.ts for that bug and what it cost.
 */
export const seatGender = (id: string): 'male' | 'female' | undefined => {
    if (id in CEO_FEMALE) return CEO_FEMALE[id] ? 'female' : 'male';
    const magnate = MAGNATES.find(m => m.id === id);
    if (magnate) return magnate.female ? 'female' : 'male';
    return undefined;
};

/**
 * The people who are simply in a casino.
 *
 * Deliberately unremarkable and deliberately from everywhere: the cities are
 * supposed to feel like public rooms, and a table of six memorable characters
 * would make the rare CEO stop being an event.
 */
// ============================================================================
//  AND THEY COME FROM EVERYWHERE, WHICH USED TO BE A CLAIM
// ============================================================================
//
//  Asked for as "increase these, put in names from around the world too, from
//  people who are not real, vary them ethnically".
//
//  The old list was eighteen names with a comment saying they were
//  "deliberately from everywhere", and it was not true enough to hold up. Ten
//  of the eighteen were European, and there was nobody from Japan, Korea,
//  Vietnam, Thailand, Indonesia, the Philippines, Iran, Central Asia, East or
//  Southern Africa, the Caribbean, Latin America outside Iberia, or the
//  Pacific. A comment asserting a property nobody can check is how a list
//  stays narrow for a year.
//
//  So it is GROUPED BY REGION rather than being one flat array. Two reasons,
//  and the second is the one that matters:
//
//    1. The spread is legible. You can see a thin region by looking.
//    2. The spread is TESTABLE. `STRANGER_REGIONS` is exported, so a test can
//       assert that every region carries its share and that no region has
//       quietly become half the pool. See pokerTable.test.ts.
//
//  ---------------------------------------------------------------------------
//  EVERY ONE OF THEM IS INVENTED
//  ---------------------------------------------------------------------------
//  Ordinary given names paired with ordinary surnames from the same place.
//  Nobody here is a real person, and that is deliberate: the game already
//  refuses to put words in the mouths of real people, and a casino full of
//  recognisable names would break the fiction in the other direction too - the
//  rare rival chief executive is supposed to be the memorable face at the
//  table, and strangers who are also famous would drown them out.
//
//  They stay deliberately unremarkable for the same reason. Three surnames
//  were changed on a second pass because they are strongly attached to real
//  people even though the full names were invented: a stranger in a casino
//  should not make anybody think of somebody in particular.
// ============================================================================

/**
 * The stranger pool, by region.
 *
 * Fifteen regions. The keys are not shown anywhere - they exist so the
 * balance can be seen and checked.
 */
export const STRANGER_REGIONS: Readonly<Record<string, readonly string[]>> = {
    nordic: [
        'Tomas Berg', 'Hanna Virtanen', 'Sigrid Dahl', 'Mikkel Sorensen',
        'Elin Bjornsson', 'Aleksi Rantanen',
        'Petter Lund', 'Ingrid Halvorsen', 'Joonas Makela',
    ],
    britishIsles: [
        'Bill Hartley', 'Gerald Boone', 'Duncan Reid', 'Niamh Gallagher',
        'Owen Pritchard', 'Fiona Blackwood',
        'Rhys Morgan', 'Sinead Doherty', 'Callum Fraser',
    ],
    westernEurope: [
        'Claire Dubois', 'Stefan Weiss', 'Sofia Marchetti', 'Enzo Ricci',
        'Rosa Iglesias', 'Bram de Vries', 'Mathieu Lefevre', 'Greta Hoffmann',
        'Lena Brandt', 'Pau Serrano', 'Anouk Visser',
    ],
    easternEurope: [
        'Ana Petrescu', 'Jakub Nowak', 'Milena Horvat', 'Vasil Ivanov',
        'Katarzyna Zielinska', 'Andrei Popescu',
        'Tomas Novak', 'Iryna Kovalenko', 'Zsofia Balogh', 'Marek Dvorak',
    ],
    mediterranean: [
        'Yusuf Demir', 'Eleni Stavrou', 'Nuno Carvalho', 'Zeynep Aksoy',
        'Dimitris Fotiadis', 'Beatriz Alves',
        'Selin Korkmaz', 'Nikos Vlachos', 'Ines Cardoso', 'Emre Yildiz',
    ],
    middleEast: [
        'Omar Farouk', 'Leila Haddad', 'Rami Nasser', 'Dalia Mansour',
        'Karim Sabbagh', 'Nadia Khoury',
        'Samir Barakat', 'Yara Kassab', 'Tarek Halabi', 'Mona Sleiman',
    ],
    persianCentralAsia: [
        'Darius Ashrafi', 'Roya Tabrizi', 'Timur Nazarov', 'Aigerim Sultanova',
        'Behnam Kordi', 'Ruslan Karimov',
        'Parisa Golzar', 'Alisher Yusupov', 'Nargiz Aliyeva', 'Farhad Rostami',
    ],
    southAsia: [
        'Priya Nair', 'Arjun Mehta', 'Fatima Siddiqui', 'Ravi Chandran',
        'Ishaan Kapoor', 'Nilanthi Perera', 'Bilal Ahsan',
        'Ananya Bose', 'Imran Qureshi', 'Kavya Rajan', 'Dilshan Fernando',
    ],
    eastAsia: [
        'Mei Chen', 'Haruto Sasaki', 'Ji-woo Han', 'Yuki Morimoto',
        'Liang Zhao', 'Seo-yeon Baek', 'Wen Xiaoling',
        'Sora Nakagawa', 'Min-jun Oh', 'Fang Yuwen', 'Kenji Arakawa',
    ],
    southeastAsia: [
        'Nguyen Thi Lan', 'Somchai Prasert', 'Dewi Kusuma', 'Ramon Mendoza',
        'Chan Sophea', 'Aina Rahim', 'Bayu Santoso',
        'Tran Van Minh', 'Siti Nurhaliza', 'Pornthip Chaiya', 'Iman Hakim',
    ],
    westAfrica: [
        'Kwame Boateng', 'Grace Okonkwo', 'Aminata Diallo', 'Chidi Eze',
        'Ousmane Traore', 'Yaa Mensah',
        'Adaeze Nwosu', 'Kofi Asante', 'Mariam Cisse', 'Emeka Obi',
    ],
    eastAfrica: [
        'Abebe Tesfaye', 'Zawadi Mwangi', 'Hodan Warsame', 'Solomon Girma',
        'Neema Kimani', 'Yonas Bekele',
        'Amani Juma', 'Selamawit Haile', 'Faisal Warsame', 'Rehema Otieno',
    ],
    southernAfrica: [
        'Thabo Ndlovu', 'Lerato Khumalo', 'Sipho Dlamini', 'Anneke Botha',
        'Naledi Moyo', 'Tendai Chirwa',
        'Bongani Nkosi', 'Refilwe Mokoena', 'Tapiwa Muroyi', 'Karabo Sithole',
    ],
    latinAmerica: [
        'Camila Ferreira', 'Mateo Rojas', 'Valentina Cruz', 'Joaquin Silva',
        'Luana Barbosa', 'Diego Alcantara', 'Paola Quispe',
        'Renata Aguilar', 'Nicolas Vergara', 'Yamila Duarte', 'Emilio Pacheco',
    ],
    northAmericaPacific: [
        'Marcus Whitfield', 'Dana Kealoha', 'Colton Reyes', 'Aroha Waitoa',
        'Jesse Lamontagne', 'Tiare Moala',
        'Harper Vandermeer', 'Kaimana Puana', 'Elodie Tremblay', 'Wiremu Ngata',
    ],
};

// ============================================================================
//  AND THE PEOPLE IN THE PRIVATE ROOM
// ============================================================================
//
//  Asked for as "should we increase the number of people in the casino, for
//  the low profile rooms and the high profile one, having a lot of people
//  could work in our favour".
//
//  MEASURED FIRST, and the answer was not symmetric. Over a hundred sittings:
//
//                  BEFORE                      AFTER
//      CITY ROOM   113 faces, 72% repeat       156 faces, 61% repeat
//      VIP ROOM     21 faces, 95% repeat        61 faces, 85% repeat
//
//  The city pool went 96 to 153 strangers, which is the easy half and was
//  asked for. The room that needed it was the other one.
//
//  The city pool is fine. Seeing the same face twice in a public room is not a
//  fault, it is a regular. The VIP room is the one that was starved, and it is
//  starved by CONSTRUCTION rather than by a short list: it fills every seat
//  from `rivalCeos()`, and that returns exactly one person per listed rival
//  company. Twenty one, and it is exhausted inside thirty sittings.
//
//  Adding names to CEO_NAMES cannot fix it. The roster is keyed on stock ids
//  and only yields a person when a company with that id exists, so the ceiling
//  is the number of rival companies in the market. Raising it means inventing
//  companies, which is a market change, not a casino one.
//
//  ---------------------------------------------------------------------------
//  SO THE ROOM GETS A SECOND KIND OF SOMEBODY
//  ---------------------------------------------------------------------------
//  A private room in Monte Carlo is not four technology chief executives. It
//  is old money, a shipping family, somebody who inherited a bank. These are
//  people the player has heard of and does not do business with, which is
//  exactly the gap: they fill the room without diluting the rule that makes a
//  rival CEO worth noticing, because they are a DIFFERENT kind of face.
//
//  The line the file already holds is kept: THERE ARE NO STRANGERS IN THERE.
//  A magnate is not a stranger. The city rooms never see one.
//
//  All invented, for the same reason the strangers are, and each carries the
//  line that shows under their name where a chief executive's company goes.
// ============================================================================

export interface Magnate {
    id: string;
    name: string;
    /** Shown under the name, where a CEO's company sits. */
    of: string;
    /**
     * Which way they were born.
     *
     * ------------------------------------------------------------------
     *  IT WAS ONLY EVER IN THE PYTHON, WHICH IS A SECOND LIST
     * ------------------------------------------------------------------
     *  tools/portrait_prompts.py sexes the roster from a hand written
     *  `FEMALE` set so it can draw the right face. The APP knew nothing, so
     *  the moment anything here needed a gender - a partner card, a pronoun,
     *  a pool face - it would have had to guess or to copy that set.
     *
     *  A copy is the failure this codebase produces most often: one fact in
     *  two places, found one at a time, on the day they disagree. So the
     *  answer lives HERE, in the app's own roster, and the Python reads it
     *  back out - which is what that file already does for the names, and
     *  says so at the top: "the name pools are READ OUT of the app, not
     *  copied".
     *
     *  The values are the ones the tool was already using, so not one drawn
     *  face changes.
     * ------------------------------------------------------------------
     */
    female: boolean;
}

export const MAGNATES: readonly Magnate[] = [
    { id: 'mg_ashworth', name: 'Cornelius Ashworth', of: 'Shipping, fourth generation', female: false },
    { id: 'mg_valmorel', name: 'Sylvie Valmorel', of: 'Private bank, Geneva', female: true },
    { id: 'mg_okonjo', name: 'Adaora Okonjo', of: 'Ports and rail', female: true },
    { id: 'mg_sandoval', name: 'Rafael Sandoval', of: 'Copper and lithium', female: false },
    { id: 'mg_lindqvist', name: 'Britta Lindqvist', of: 'Timber and paper', female: true },
    { id: 'mg_al_najjar', name: 'Hisham al Najjar', of: 'Refining', female: false },
    { id: 'mg_takahara', name: 'Reiko Takahara', of: 'Department stores', female: true },
    { id: 'mg_beaumont', name: 'Hugo Beaumont', of: 'Vineyards and hotels', female: false },
    { id: 'mg_deshmukh', name: 'Vikram Deshmukh', of: 'Cement, half a continent', female: false },
    { id: 'mg_moretti', name: 'Giulia Moretti', of: 'Couture, sold it twice', female: true },
    { id: 'mg_castellan', name: 'Auguste Castellan', of: 'Insurance, inherited', female: false },
    { id: 'mg_park', name: 'Park Seung ho', of: 'Shipbuilding', female: false },
    { id: 'mg_ferreyra', name: 'Marisol Ferreyra', of: 'Cattle and grain', female: true },
    { id: 'mg_vandervelde', name: 'Joost Vandervelde', of: 'Diamonds, wholesale', female: false },
    { id: 'mg_okoye', name: 'Chinedu Okoye', of: 'Telecoms, private', female: false },
    { id: 'mg_st_clair', name: 'Rosalind St Clair', of: 'Racehorses and land', female: true },
    { id: 'mg_haddadi', name: 'Nasrin Haddadi', of: 'Pistachios and pipelines', female: true },
    { id: 'mg_wren', name: 'Marcus Wren', of: 'Hedge fund, closed to new money', female: false },
    { id: 'mg_bergqvist', name: 'Astrid Bergqvist', of: 'Iron ore', female: true },
    { id: 'mg_montoya', name: 'Ignacio Montoya', of: 'Airports', female: false },
    { id: 'mg_kirilenko', name: 'Yelena Kirilenko', of: 'Fertiliser', female: true },
    { id: 'mg_amadou', name: 'Ibrahim Amadou', of: 'Gold concessions', female: false },
    { id: 'mg_whitcombe', name: 'Eleanor Whitcombe', of: 'Publishing, what is left of it', female: true },
    { id: 'mg_serrano', name: 'Tomas Serrano', of: 'Olive oil, absurdly', female: false },
    { id: 'mg_nakamura', name: 'Hideo Nakamura', of: 'Machine tools', female: false },
    { id: 'mg_dubois', name: 'Camille Dubois', of: 'Auction house', female: true },
    { id: 'mg_pillay', name: 'Anand Pillay', of: 'Sugar and logistics', female: false },
    { id: 'mg_thornbury', name: 'Gerald Thornbury', of: 'Never worked a day', female: false },
    { id: 'mg_farsi', name: 'Layla Farsi', of: 'Desalination', female: true },
    { id: 'mg_bjornstad', name: 'Even Bjornstad', of: 'Salmon', female: false },
    { id: 'mg_calderon', name: 'Beatriz Calderon', of: 'Toll roads', female: true },
    { id: 'mg_ruangsri', name: 'Kittipong Ruangsri', of: 'Rubber', female: false },
    { id: 'mg_kowalczyk', name: 'Zofia Kowalczyk', of: 'Cold storage', female: true },
    { id: 'mg_hennessey', name: 'Declan Hennessey', of: 'Distilling', female: false },
    { id: 'mg_oyelaran', name: 'Folake Oyelaran', of: 'Cocoa', female: true },
    { id: 'mg_stavros', name: 'Nikolas Stavros', of: 'Tankers', female: false },
    { id: 'mg_wexley', name: 'Priscilla Wexley', of: 'Trusts, three of them', female: true },
    { id: 'mg_barut', name: 'Cem Barut', of: 'Construction', female: false },
    { id: 'mg_delacroix', name: 'Odile Delacroix', of: 'Perfume houses', female: true },
    { id: 'mg_arriaga', name: 'Salvador Arriaga', of: 'Silver, since 1890', female: false },
];

/** The magnates as seatable opponents. */
export const magnateOpponents = (): Opponent[] =>
    MAGNATES.map(m => ({ id: m.id, name: m.name, kind: 'magnate' as const, company: m.of }));

/**
 * All of them, flattened.
 *
 * Built from the regions rather than typed a second time, so the two can
 * never disagree - which is the failure this codebase produces most often.
 */
export const STRANGERS: readonly string[] =
    Object.values(STRANGER_REGIONS).flat();

/** Every listed rival with a named chief executive, if the markets are loaded. */
export const rivalCeos = (): Opponent[] => {
    try {
        const { PRODUCT_MARKETS } = require('../market/productMarkets');
        const seen = new Set<string>();
        const out: Opponent[] = [];
        for (const market of PRODUCT_MARKETS || []) {
            for (const c of market.competitors || []) {
                if (!c?.stockId || seen.has(c.stockId)) continue;
                seen.add(c.stockId);
                const name = CEO_NAMES[c.stockId];
                if (!name) continue;
                out.push({ id: c.stockId, name, kind: 'ceo', company: c.name, strength: c.strength });
            }
        }
        return out;
    } catch {
        return [];
    }
};

/** Your own directors, if the register is loaded. */
export const boardOpponents = (): Opponent[] => {
    try {
        const { useShareholderStore } = require('../../features/shareholders/stores/useShareholderStore');
        return (useShareholderStore.getState().members || [])
            .map((m: any) => ({ id: m.id, name: m.name, kind: 'board' as const }));
    } catch {
        return [];
    }
};

// ============================================================================
//  SEATING A ROOM
// ============================================================================

/**
 * Seats at the table, the player included.
 *
 * FIVE, NOT SIX, and the difference is measured rather than felt. Asked as
 * "is six too many, should we do four" - so the question was put to a
 * simulation of three thousand hands at each size:
 *
 *      seats   bot actions   YOUR turns   bot wait
 *        3         8.0          4.2        5.2s
 *        4        12.0          4.3        7.8s
 *        5        15.9          4.4       10.4s
 *        6        19.8          4.5       12.8s
 *
 *  The column that matters is the third one. Going from three seats to six
 *  buys the player THREE TENTHS of an extra decision and costs them seven and
 *  a half seconds of watching other people. Extra seats do not add agency;
 *  they add waiting.
 *
 *  Four would be quicker still, but at four a "table" is you and two other
 *  people, which reads as a card game rather than a room. Five is where it
 *  still looks like a table and a third of the waiting has gone.
 */
export const TABLE_SEATS = 5;

/**
 * How often a city table has a rival chief executive at it.
 *
 * ONE IN SIX SEATS, so a five handed table has one about half the time. Rare
 * enough that noticing the name is the moment; common enough that it happens.
 * If every table had one they would stop being rivals and become furniture.
 */
export const CITY_CEO_CHANCE = 1 / 6;

/**
 * And how often one of your OWN directors is sitting there.
 *
 * Rarer than a rival, because it is a stranger thing to walk into. Meeting the
 * man who controls seventeen per cent of your company across a poker table is
 * not a coincidence you want twice a year.
 */
export const CITY_BOARD_CHANCE = 1 / 12;

/**
 * How much of the private room is rival chief executives.
 *
 * Two seats in five, so a four handed table usually has one or two. They are
 * the faces the player has a history with and the room would lose its point if
 * they were rare; it would lose a different point if every seat were one,
 * which is what it was.
 */
export const VIP_RIVAL_CHANCE = 0.4;

const pick = <T,>(list: readonly T[], roll: () => number): T | undefined => {
    if (!list || list.length === 0) return undefined;
    const raw = roll();
    const die = Number.isFinite(raw) ? Math.min(0.999999, Math.max(0, raw)) : 0;
    return list[Math.floor(die * list.length)];
};

/**
 * Who is at this table tonight.
 *
 * `vip` fills every seat with SOMEBODY - a rival chief executive or a
 * magnate - which is the whole character of the Noir room: there are no
 * strangers in there.
 *
 * It used to draw rivals only, and there are twenty one of those, so the room
 * was exhausted inside thirty sittings and showed the same faces for the rest
 * of the run. See the note above MAGNATES for the measurement.
 */
export const seatTable = (
    vip: boolean,
    roll: () => number = Math.random,
    seats: number = TABLE_SEATS - 1,
): Opponent[] => {
    const ceos = rivalCeos();
    const board = boardOpponents();
    const magnates = magnateOpponents();
    const out: Opponent[] = [];
    const taken = new Set<string>();
    const usedNames = new Set<string>();

    /** Everyone from a pool who is not already at this table. */
    const notSeated = (pool: readonly Opponent[]) =>
        pool.filter(o => !taken.has(o.id) && !usedNames.has(o.name));

    const addUnique = (o: Opponent | undefined): boolean => {
        if (!o || taken.has(o.id)) return false;
        taken.add(o.id);
        usedNames.add(o.name);
        out.push(o);
        return true;
    };

    for (let i = 0; i < Math.max(0, seats); i++) {
        if (vip) {
            // ----------------------------------------------------------
            //  EVERY SEAT IS SOMEBODY, AND A RIVAL STILL COMES FIRST
            // ----------------------------------------------------------
            //  Weighted rather than uniform: a rival chief executive is the
            //  face the player has a history with, and the room would lose
            //  its point if they were one in three. So a rival is tried
            //  first at VIP_RIVAL_CHANCE and a magnate fills the rest.
            //
            //  Both are drawn from `notSeated` so a face already at this
            //  table cannot be drawn again, which is what the old retry
            //  loop was for and did badly - twelve tries against a pool of
            //  twenty one still collides.
            // ----------------------------------------------------------
            const wantRival = roll() < VIP_RIVAL_CHANCE;
            const first = wantRival ? ceos : magnates;
            const second = wantRival ? magnates : ceos;

            let placed = addUnique(pick(notSeated(first), roll));
            if (!placed) placed = addUnique(pick(notSeated(second), roll));
            if (!placed) {
                // Only if the game somehow has neither. A hole in the table
                // would be worse than a stranger in the private room.
                const spare = STRANGERS.find(n => !usedNames.has(n)) || 'Guest';
                addUnique({ id: `x${i}`, name: spare, kind: 'stranger' });
            }
            continue;
        }

        const die = roll();
        const d = Number.isFinite(die) ? die : 1;
        let placed = false;
        if (d < CITY_CEO_CHANCE) {
            for (let tries = 0; tries < 6 && !placed; tries++) placed = addUnique(pick(ceos, roll));
        } else if (d < CITY_CEO_CHANCE + CITY_BOARD_CHANCE) {
            for (let tries = 0; tries < 6 && !placed; tries++) placed = addUnique(pick(board, roll));
        }
        if (!placed) {
            // A stranger's id is seat-unique rather than person-unique, because
            // the same face may sit down again next week. But the NAME has to
            // be unique AT THIS TABLE: two Grace Okonkwos in one hand looks
            // like a bug even though it is not one.
            let name = pick(STRANGERS, roll) || 'Guest';
            for (let tries = 0; tries < 12 && usedNames.has(name); tries++) {
                name = pick(STRANGERS, roll) || 'Guest';
            }
            if (usedNames.has(name)) {
                const spare = STRANGERS.find(n => !usedNames.has(n));
                if (spare) name = spare;
            }
            usedNames.add(name);
            out.push({ id: `x${i}`, name, kind: 'stranger' });
            taken.add(`x${i}`);
        }
    }

    return out;
};

// ============================================================================
//  AND WHAT THEY LOOK LIKE
// ============================================================================
//
//  Round avatars, which is what was asked for, and what goes in them until
//  there are photographs: initials on a colour that says what kind of person
//  this is. When the portraits exist they drop into the same circle and one
//  line changes.
// ============================================================================

export const initialsOf = (name: string): string =>
    (name || '?')
        .replace(/['"]/g, '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0]?.toUpperCase() ?? '')
        .join('') || '?';

/** A stable colour per person, so the same face is the same colour every time. */
export const avatarHue = (id: string): number => {
    let h = 0;
    for (let i = 0; i < (id || '').length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
    return h;
};
