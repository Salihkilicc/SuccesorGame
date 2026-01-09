import { Ethnicity } from '../../../data/relationshipTypes';

type NameSet = {
    first: string[];
    last: string[];
};

export const NAME_DATABASE: Record<Ethnicity, NameSet> = {
    Caucasian: {
        first: [
            'Emma', 'Olivia', 'Ava', 'Isabella', 'Charlotte', 'Mia', 'Amelia', 'Harper', 'Evelyn',
            'Abigail', 'Emily', 'Elizabeth', 'Sofia', 'Madison', 'Avery', 'Ella', 'Scarlett',
            'Grace', 'Chloe', 'Victoria'
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
        last: [
            'Lee-Jones', 'Smith-Garcia', 'Johnson-Kim', 'Williams-Chen', 'Brown-Patel',
            'Davis-Nguyen', 'Miller-Singh', 'Wilson-Wong', 'Moore-Rodriguez', 'Taylor-Ali'
        ]
    }
};
