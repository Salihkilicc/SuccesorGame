// src/features/love/data/nameData.ts
//
// ============================================================================
//  HALF THE DATING POOL WAS A MAN CALLED PHILIPPA
// ============================================================================
//
//  `generatePartner` rolled a gender with a coin and then took a first name
//  from `first`, and `first` held two hundred and sixty names of which
//  RECOGNISABLY MALE: ZERO. Measured over four hundred candidates: 208 men,
//  every one of them named Emma, Aaliyah, Anastasia or Philippa.
//
//  It did not show while everybody was a monogram. The portraits made it
//  loud: a man's photograph over a woman's name, on the card the player is
//  asked to say yes to.
//
//  `first` KEEPS ITS NAME AND ITS CONTENTS - it is the female list and always
//  was, and every one of those names is still drawn. `firstMale` is the half
//  that was missing. Read them through `namesFor`, which is also where the
//  Slavic surname gets its ending fixed: Anastasia Vinogradova and Dmitri
//  Vinogradov are the same family, and the list was written entirely in the
//  feminine.
// ============================================================================

import { Ethnicity } from '../../../data/relationshipTypes';

type NameSet = {
    /** The female given names. Named `first` since before there were two. */
    first: string[];
    /** The male given names. Same count, same twenty per ethnicity. */
    firstMale: string[];
    last: string[];
};

export const NAME_DATABASE: Record<Ethnicity, NameSet> = {
    Caucasian: {
        first: [
            'Emma', 'Olivia', 'Ava', 'Isabella', 'Charlotte', 'Mia', 'Amelia', 'Harper', 'Evelyn',
            'Abigail', 'Emily', 'Elizabeth', 'Sofia', 'Madison', 'Avery', 'Ella', 'Scarlett',
            'Grace', 'Chloe', 'Victoria'
        ],
        firstMale: [
            'Liam', 'Noah', 'Oliver', 'Elijah', 'James', 'William', 'Benjamin',
            'Lucas', 'Henry', 'Theodore', 'Jack', 'Levi', 'Alexander', 'Owen',
            'Daniel', 'Samuel', 'Joseph', 'Julian', 'Nathan', 'Charles'
        ],
        last: [
            'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez',
            'Wilson', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson',
            'Thompson', 'White'
        ]
    },
    Latina: {
        first: [
            'Sofia', 'Isabella', 'Camila', 'Valentina', 'Valeria', 'Mariana', 'Gabriela',
            'Daniela', 'Maria', 'Victoria', 'Martina', 'Luciana', 'Ximena', 'Sara',
            'Lucia', 'Catalina', 'Elena', 'Emilia', 'Mia', 'Fernanda'
        ],
        firstMale: [
            'Santiago', 'Mateo', 'Sebastian', 'Diego', 'Alejandro', 'Nicolas', 'Emiliano',
            'Tomas', 'Joaquin', 'Rafael', 'Andres', 'Gabriel', 'Ignacio', 'Javier',
            'Lorenzo', 'Martin', 'Pablo', 'Ricardo', 'Salvador', 'Esteban'
        ],
        last: [
            'Garcia', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Perez',
            'Sanchez', 'Ramirez', 'Torres', 'Flores', 'Rivera', 'Gomez', 'Diaz', 'Cruz',
            'Reyes', 'Morales', 'Gutierrez', 'Ortiz', 'Ramos'
        ]
    },
    EastAsian: {
        first: [
            'Yuki', 'Sakura', 'Hana', 'Mei', 'Rina', 'Kaori', 'Yui', 'Akira', 'Aoi',
            'Ji-woo', 'Seo-yeon', 'Min-ji', 'Ha-eun', 'Soo-jin',
            'Li', 'Wei', 'Yan', 'Fang', 'Jing', 'Xue'
        ],
        firstMale: [
            'Haruto', 'Ren', 'Sota', 'Yuto', 'Kenji', 'Takumi', 'Hiroshi',
            'Daiki', 'Min-jun', 'Ji-hoo', 'Seo-jun', 'Do-yun', 'Hyun-woo', 'Jae-won',
            'Cheng', 'Jian', 'Hao', 'Feng', 'Zhen', 'Riku'
        ],
        last: [
            'Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura',
            'Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Jo', 'Yoon',
            'Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao'
        ]
    },
    SouthAsian: {
        first: [
            'Aaradhya', 'Diya', 'Saanvi', 'Ananya', 'Pari', 'Myra', 'Anya', 'Riya', 'Aditi',
            'Kiara', 'Ishita', 'Pooja', 'Neha', 'Priya', 'Sneha', 'Anjali', 'Kavita',
            'Zara', 'Fatima', 'Ayesha'
        ],
        firstMale: [
            'Aarav', 'Vihaan', 'Arjun', 'Rohan', 'Aditya', 'Kabir', 'Vivaan',
            'Ishaan', 'Rahul', 'Karan', 'Sanjay', 'Devendra', 'Nikhil', 'Aryan',
            'Imran', 'Bilal', 'Faisal', 'Tariq', 'Zain', 'Rizwan'
        ],
        last: [
            'Patel', 'Singh', 'Sharma', 'Kumar', 'Gupta', 'Verma', 'Mishra', 'Reddy',
            'Nair', 'Khan', 'Ahmed', 'Ali', 'Hussain', 'Malik', 'Qureshi', 'Shah',
            'Rao', 'Desai', 'Mehta', 'Iyer'
        ]
    },
    MiddleEastern: {
        first: [
            'Layla', 'Yasmin', 'Zara', 'Fatima', 'Ayesha', 'Noor', 'Maryam', 'Hana', 'Amira',
            'Leila', 'Salma', 'Nadia', 'Rania', 'Farah', 'Dina', 'Lina', 'Samira',
            'Zeinab', 'Mona', 'Reem'
        ],
        firstMale: [
            'Karim', 'Tarek', 'Sami', 'Youssef', 'Hakim', 'Rashid', 'Nabil',
            'Faris', 'Ziad', 'Amir', 'Bassam', 'Jamal', 'Adel', 'Marwan',
            'Waleed', 'Idris', 'Mustafa', 'Selim', 'Hisham', 'Anwar'
        ],
        last: [
            'Al-Fayed', 'Hadid', 'Nasser', 'Khoury', 'Mansour', 'Salameh', 'Abdallah',
            'Hassan', 'Ibrahim', 'Mahmoud', 'Omar', 'Ali', 'Khalil', 'Said', 'Taha',
            'Hamdan', 'Othman', 'Suleiman', 'Jabbar', 'Amer'
        ]
    },
    Slavic: {
        first: [
            'Anastasia', 'Irina', 'Katya', 'Tatiana', 'Olga', 'Natalia', 'Elena', 'Svetlana',
            'Maria', 'Daria', 'Polina', 'Ksenia', 'Yulia', 'Marina', 'Anna', 'Viktoria',
            'Alina', 'Ekaterina', 'Veronika', 'Sofia'
        ],
        firstMale: [
            'Dmitri', 'Ivan', 'Nikolai', 'Alexei', 'Sergei', 'Mikhail', 'Andrei',
            'Viktor', 'Pavel', 'Yuri', 'Boris', 'Igor', 'Maksim', 'Roman',
            'Vladimir', 'Anton', 'Grigori', 'Stepan', 'Timur', 'Fyodor'
        ],
        last: [
            'Ivanova', 'Smirnov', 'Kuznetsova', 'Popova', 'Sokolova', 'Lebedeva', 'Kozlova',
            'Novikova', 'Morozova', 'Petrova', 'Volkova', 'Solovyova', 'Vasilyeva',
            'Zaytseva', 'Pavlova', 'Semenova', 'Golubeva', 'Vinogradova', 'Bogdanova', 'Vorobyova'
        ]
    },
    Scandinavian: {
        first: [
            'Astrid', 'Freja', 'Ingrid', 'Sigrid', 'Elin', 'Ida', 'Maja', 'Sofie', 'Emma',
            'Anna', 'Elsa', 'Klara', 'Alma', 'Ebba', 'Wilma', 'Saga', 'Linnea',
            'Nora', 'Emilie', 'Thea'
        ],
        firstMale: [
            'Erik', 'Lars', 'Magnus', 'Bjorn', 'Anders', 'Henrik', 'Nils',
            'Gustav', 'Sven', 'Oskar', 'Emil', 'Axel', 'Viggo', 'Soren',
            'Rasmus', 'Jonas', 'Mikkel', 'Tobias', 'Halvor', 'Einar'
        ],
        last: [
            'Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsson', 'Olsson',
            'Persson', 'Svensson', 'Gustafsson', 'Pettersson', 'Jonsson', 'Jansson',
            'Hansen', 'Jensen', 'Nielsen', 'Kristensen', 'Larsen', 'Andersen', 'Pedersen'
        ]
    },
    Mediterranean: {
        first: [
            'Giulia', 'Sofia', 'Aurora', 'Alice', 'Ginevra', 'Emma', 'Giorgia', 'Greta',
            'Beatrice', 'Anna', 'Chiara', 'Ludovica', 'Vittoria', 'Matilde', 'Noemi',
            'Maria', 'Elena', 'Lucia', 'Francesca', 'Alessia'
        ],
        firstMale: [
            'Lorenzo', 'Matteo', 'Alessandro', 'Francesco', 'Leonardo', 'Giovanni', 'Riccardo',
            'Davide', 'Stefano', 'Marco', 'Pietro', 'Luca', 'Gabriele', 'Tommaso',
            'Nicola', 'Emanuele', 'Vittorio', 'Sandro', 'Salvatore', 'Cosimo'
        ],
        last: [
            'Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo',
            'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca',
            'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti'
        ]
    },
    AfricanAmerican: {
        first: [
            'Aaliyah', 'Gabrielle', 'Jasmine', 'Tiana', 'Kiara', 'Raven', 'Imani', 'Ebony',
            'Nia', 'Jada', 'Destiny', 'Diamond', 'Precious', 'Alexis', 'Brianna',
            'Ciara', 'Dominique', 'Khadijah', 'Shanice', 'Tanisha'
        ],
        firstMale: [
            'Jamal', 'Malik', 'Darius', 'Terrence', 'Andre', 'Marcus', 'Xavier',
            'Isaiah', 'Elijah', 'Jerome', 'Deshawn', 'Tyrese', 'Kendrick', 'Rashad',
            'Devonte', 'Amari', 'Lamar', 'Cornell', 'Jalen', 'Trevon'
        ],
        last: [
            'Williams', 'Johnson', 'Smith', 'Jones', 'Brown', 'Davis', 'Jackson', 'Robinson',
            'Harris', 'Thomas', 'Moore', 'Martin', 'Thompson', 'White', 'Lee',
            'Walker', 'Young', 'Allen', 'King', 'Wright'
        ]
    },
    Caribbean: {
        first: [
            'Rihanna', 'Nia', 'Gabrielle', 'Beyonce', 'Zoe', 'Chanel', 'Jasmine',
            'Dominique', 'Aisha', 'Keisha', 'Tia', 'Mia', 'Chloe', 'Ava',
            'Nevaeh', 'Serenity', 'Destiny', 'Angel', 'Faith', 'Hope'
        ],
        firstMale: [
            'Andre', 'Damian', 'Kemar', 'Shaquille', 'Devon', 'Rohan', 'Omari',
            'Tyrone', 'Winston', 'Delroy', 'Nigel', 'Ricardo', 'Junior', 'Everton',
            'Marlon', 'Clive', 'Dwayne', 'Leroy', 'Garfield', 'Neville'
        ],
        last: [
            'Campbell', 'Clarke', 'Williams', 'Brown', 'Davis', 'Edwards', 'Francis',
            'Grant', 'Gordon', 'Graham', 'Harris', 'Henry', 'James', 'Johnson',
            'Jones', 'King', 'Lewis', 'Martin', 'Miller', 'Morgan'
        ]
    },
    RoyalEuropean: {
        first: [
            'Victoria', 'Elizabeth', 'Charlotte', 'Diana', 'Catherine', 'Anne', 'Margaret',
            'Mary', 'Alexandra', 'Louise', 'Alice', 'Beatrice', 'Eugenie', 'Sophia',
            'Caroline', 'Eleanor', 'Matilda', 'Isabella', 'Philippa', 'Adelaide'
        ],
        firstMale: [
            'Edward', 'Philip', 'Charles', 'Frederick', 'Albert', 'Leopold', 'Rupert',
            'Alexander', 'Henry', 'Ferdinand', 'Maximilian', 'Nicholas', 'Otto', 'Ludwig',
            'Constantine', 'Sebastian', 'Augustus', 'Wilhelm', 'Gustav', 'Christian'
        ],
        last: [
            'Windsor', 'Grimaldi', 'Bourbon', 'Habsburg', 'Romanov', 'Savoy', 'Orleans',
            'Hanover', 'Saxe-Coburg', 'Bernadotte', 'Glucksburg', 'Orange-Nassau',
            'Liechtenstein', 'Luxembourg', 'Belgium', 'Spain', 'Stuart', 'Tudor', 'Plantagenet', 'York'
        ]
    },
    PacificIslander: {
        first: [
            'Moana', 'Leilani', 'Kailani', 'Nani', 'Oliana', 'Talia', 'Sina', 'Mele',
            'Alana', 'Kalena', 'Lani', 'Noelani', 'Iolana', 'Luana', 'Ululani',
            'Haukea', 'Keandra', 'Malunga', 'Waimarie', 'Aroha'
        ],
        firstMale: [
            'Maleko', 'Keanu', 'Koa', 'Makoa', 'Kaimana', 'Ikaika', 'Nainoa',
            'Manu', 'Tane', 'Sione', 'Tavita', 'Malosi', 'Ratu', 'Aleki',
            'Hone', 'Rangi', 'Tama', 'Kalani', 'Nikau', 'Anaru'
        ],
        last: [
            'Kealoha', 'Kahananui', 'Kauhane', 'Kalama', 'Kamealoha', 'Kamakawiwo\'ole',
            'Mahelona', 'Mahi', 'Pahinui', 'Palakiko', 'Akana', 'Apana', 'Ho',
            'Kekoa', 'Lee', 'Wong', 'Reyes', 'Santos', 'Garcia', 'Fernandez'
        ]
    },
    Mixed: {
        first: [
            'Maya', 'Kai', 'Nina', 'Lola', 'Zoe', 'Luna', 'Mila', 'Sienna', 'Zara',
            'Layla', 'Elena', 'Nora', 'Eva', 'Naomi', 'Ariana', 'Jasmine',
            'Kira', 'Lia', 'Romy', 'Tessa'
        ],
        firstMale: [
            'Zayn', 'Ezra', 'Nico', 'Elias', 'Theo', 'Milo', 'Rafael',
            'Andre', 'Sami', 'Devin', 'Noel', 'Jude', 'Arlo', 'Roman',
            'Emre', 'Tariq', 'Lucian', 'Dax', 'Rowan', 'Kian'
        ],
        last: [
            'Lee-Jones', 'Smith-Garcia', 'Johnson-Kim', 'Williams-Chen', 'Brown-Patel',
            'Davis-Nguyen', 'Miller-Singh', 'Wilson-Wong', 'Moore-Rodriguez', 'Taylor-Ali'
        ]
    }
};

// ============================================================================
//  AND THE SURNAME HAS A GENDER TOO, IN ONE OF THE THIRTEEN
// ============================================================================
//
//  Every Slavic surname on the list above is written in the feminine except
//  Smirnov: Ivanova, Kuznetsova, Vinogradova. That was right while everybody
//  was a woman and is wrong the moment they are not. Dmitri Vinogradova is
//  not a name.
//
//  The rule is the real one and it is small: the feminine of a Russian family
//  name is the masculine plus -a, for the -ov, -ev and -in endings that all
//  twenty of these have. So strip it for a man and add it for a woman, and
//  Smirnov stops being the one man on the list by accident.
//
//  Only Slavic. Nothing else here inflects, and applying it anywhere else
//  would turn Costa into Cost.
// ============================================================================

/** The masculine stem of a Slavic family name: Vinogradova to Vinogradov. */
const slavicStem = (surname: string): string =>
    /(ov|ev|in)a$/i.test(surname) ? surname.slice(0, -1) : surname;

/**
 * The two lists to draw a name from, for one ethnicity and one gender.
 *
 * The single door onto NAME_DATABASE. `partnerGenerator` is the only caller
 * and it stays that way: a second place that reaches for `.first` directly is
 * a second place that can forget the men again.
 */
export const namesFor = (
    ethnicity: Ethnicity,
    gender: 'male' | 'female',
): { first: string[]; last: string[] } => {
    const set = NAME_DATABASE[ethnicity];
    const male = gender === 'male';
    const first = male ? set.firstMale : set.first;
    const last =
        ethnicity === 'Slavic'
            ? set.last.map(s => (male ? slavicStem(s) : `${slavicStem(s)}a`))
            : set.last;
    return { first, last };
};
