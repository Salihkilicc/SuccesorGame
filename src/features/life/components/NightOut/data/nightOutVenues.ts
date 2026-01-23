export type RegionCode = 'ASIA' | 'EUROPE' | 'USA' | 'M_EAST' | 'LATAM' | 'AFRICA' | 'LOCAL';

export interface Venue {
    id: string;
    name: string;
    region: RegionCode;
    location: string;
    entryFee: number;
    tier: 1 | 2 | 3 | 4 | 5;
}

export const VENUES: Venue[] = [
    // USA
    { id: 'usa_1', name: 'Omnia', region: 'USA', location: 'Las Vegas', entryFee: 5000, tier: 5 },
    { id: 'usa_2', name: 'LIV', region: 'USA', location: 'Miami', entryFee: 3000, tier: 4 },
    { id: 'usa_3', name: 'The Box', region: 'USA', location: 'New York', entryFee: 4000, tier: 5 },
    { id: 'usa_4', name: '1OAK LA', region: 'USA', location: 'Los Angeles', entryFee: 2500, tier: 4 },

    // EUROPE
    { id: 'eu_1', name: 'Berghain', region: 'EUROPE', location: 'Berlin', entryFee: 2000, tier: 5 },
    { id: 'eu_2', name: 'Ushuaïa', region: 'EUROPE', location: 'Ibiza', entryFee: 6000, tier: 5 },
    { id: 'eu_3', name: 'Fabric', region: 'EUROPE', location: 'London', entryFee: 2500, tier: 4 },
    { id: 'eu_4', name: "L'Arc", region: 'EUROPE', location: 'Paris', entryFee: 3500, tier: 5 },
    { id: 'eu_5', name: 'Altromondo', region: 'EUROPE', location: 'Rimini', entryFee: 1500, tier: 3 },

    // ASIA
    { id: 'asia_1', name: 'Octagon', region: 'ASIA', location: 'Seoul', entryFee: 3000, tier: 4 },
    { id: 'asia_2', name: '1OAK Tokyo', region: 'ASIA', location: 'Tokyo', entryFee: 3500, tier: 5 },
    { id: 'asia_3', name: 'Ce La Vi', region: 'ASIA', location: 'Singapore', entryFee: 4000, tier: 5 },
    { id: 'asia_4', name: 'Onyx', region: 'ASIA', location: 'Bangkok', entryFee: 1500, tier: 3 },

    // MIDDLE EAST
    { id: 'me_1', name: 'White', region: 'M_EAST', location: 'Dubai', entryFee: 5000, tier: 5 },
    { id: 'me_2', name: 'Sky 2.0', region: 'M_EAST', location: 'Dubai', entryFee: 5500, tier: 5 },
    { id: 'me_3', name: 'Soho Garden', region: 'M_EAST', location: 'Dubai', entryFee: 3000, tier: 4 },

    // LATAM
    { id: 'latam_1', name: 'D-Edge', region: 'LATAM', location: 'Sao Paulo', entryFee: 2000, tier: 4 },
    { id: 'latam_2', name: 'Green Valley', region: 'LATAM', location: 'Camboriu', entryFee: 2500, tier: 4 },

    // AFRICA
    { id: 'africa_1', name: 'Taboo', region: 'AFRICA', location: 'Johannesburg', entryFee: 2000, tier: 4 },

    // LOCAL
    { id: 'local_1', name: 'Sortie', region: 'LOCAL', location: 'Istanbul', entryFee: 2000, tier: 4 },
];

export const REGIONAL_NAMES: Record<RegionCode, { male: string[]; female: string[] }> = {
    USA: {
        male: [
            'Michael', 'James', 'David', 'Chris', 'Matthew', 'Daniel', 'Ryan', 'Justin', 'William', 'Robert',
            'John', 'Kevin', 'Brian', 'Jason', 'Andrew', 'Thomas', 'Steven', 'Eric', 'Joshua', 'Brandon'
        ],
        female: [
            'Jessica', 'Ashley', 'Jennifer', 'Amanda', 'Sarah', 'Stephanie', 'Nicole', 'Brittany', 'Heather', 'Megan',
            'Emily', 'Rachel', 'Lauren', 'Melissa', 'Tiffany', 'Elizabeth', 'Christina', 'Amber', 'Laura', 'Danielle'
        ]
    },
    EUROPE: {
        male: [
            'Lucas', 'Matteo', 'Hugo', 'Leo', 'Gabriel', 'Adam', 'Louis', 'Arthur', 'Liam', 'Paul',
            'Maximilian', 'Alexander', 'Jonas', 'Elias', 'Felix', 'Julian', 'Marco', 'Luca', 'Leon', 'Noah'
        ],
        female: [
            'Emma', 'Lea', 'Chloé', 'Sofia', 'Camille', 'Sarah', 'Mila', 'Lina', 'Alice', 'Charlotte',
            'Anna', 'Maria', 'Laura', 'Julia', 'Sophie', 'Marie', 'Lena', 'Hannah', 'Mia', 'Clara'
        ]
    },
    ASIA: {
        male: [
            'Hiroshi', 'Kenji', 'Takahiro', 'Min-ho', 'Ji-hoon', 'Wei', 'Jun', 'Satoshi', 'Takeshi', 'Yuto',
            'Hyun-woo', 'Dong-wook', 'Jian', 'Chen', 'Haruto', 'Ren', 'Riku', 'Sora', 'Kaito', 'Yoshiki'
        ],
        female: [
            'Sakura', 'Hana', 'Yui', 'Akari', 'Mei', 'Ji-soo', 'Min-ji', 'Eun-ji', 'Yuki', 'Rina',
            'Aoi', 'Misaki', 'Nanami', 'Hina', 'Rio', 'Momo', 'Suzu', 'Ai', 'Coco', 'Mai'
        ]
    },
    M_EAST: {
        male: [
            'Mohammed', 'Ahmed', 'Ali', 'Omar', 'Youssef', 'Ibrahim', 'Hassan', 'Hussein', 'Khalid', 'Abdullah',
            'Zaid', 'Hamza', 'Kareem', 'Tarek', 'Mahmoud', 'Amir', 'Nasser', 'Mustafa', 'Bilal', 'Saeed'
        ],
        female: [
            'Layla', 'Nour', 'Fatima', 'Mariam', 'Yasmin', 'Sara', 'Aisha', 'Zainab', 'Salma', 'Rania',
            'Dina', 'Hala', 'Noor', 'Amira', 'Lina', 'Farah', 'Jana', 'Maya', 'Hana', 'Nadia'
        ]
    },
    LATAM: {
        male: [
            'Santiago', 'Mateo', 'Sebastian', 'Alejandro', 'Gabriel', 'Diego', 'Daniel', 'Nicolas', 'Samuel', 'Lucas',
            'Felipe', 'Juan', 'Carlos', 'Eduardo', 'Leonardo', 'Thiago', 'Pedro', 'Rafael', 'Joao', 'Miguel'
        ],
        female: [
            'Sofia', 'Valentina', 'Isabella', 'Camila', 'Mariana', 'Gabriela', 'Martina', 'Lucia', 'Victoria', 'Maria',
            'Ana', 'Carolina', 'Daniela', 'Fernanda', 'Paula', 'Valeria', 'Juliana', 'Andrea', 'Ximena', 'Renata'
        ]
    },
    AFRICA: {
        male: [
            'Kwame', 'Kofi', 'Tunde', 'Emeka', 'Chinedu', 'Malik', 'Jabari', 'Amari', 'Tendai', 'Thabo',
            'Sipho', 'Mandla', 'Bongani', 'Oluwaseun', 'Ade', 'Chi', 'Zola', 'Lekan', 'Femi', 'Juma'
        ],
        female: [
            'Amina', 'Zara', 'Nia', 'Amara', 'Zola', 'Chioma', 'Adanna', 'Fatou', 'Keisha', 'Imani',
            'Ayana', 'Nala', 'Sade', 'Zuri', 'Thandi', 'Nomsa', 'Lerato', 'Bisi', 'Funke', 'Khadija'
        ]
    },
    LOCAL: {
        male: [
            'Emre', 'Can', 'Burak', 'Mehmet', 'Ali', 'Murat', 'Mert', 'Ozan', 'Arda', 'Kerem',
            'Cem', 'Tolga', 'Barış', 'Deniz', 'Efe', 'Kaan', 'Volkan', 'Sinan', 'Hakan', 'Serkan'
        ],
        female: [
            'Ayşe', 'Zeynep', 'Elif', 'Selin', 'Gamze', 'Buse', 'İrem', 'Ece', 'Melis', 'Aslı',
            'Ceren', 'Damla', 'Gizem', 'Pınar', 'Derya', 'Aylin', 'Yasemin', 'Ezgi', 'Beren', 'Defne'
        ]
    }
};
