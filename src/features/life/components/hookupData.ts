/**
 * Hookup System - Data Layer
 * Contains all candidate data, interfaces, and generation logic
 */

export interface HookupCandidate {
    id: string;
    name: string;
    age: number;
    job: string;
    bio: string;
    difficulty: number; // 0-100
    gender: 'male' | 'female';
    imageColor: string;

    // v2 New Fields
    distance: number; // 1-25 miles
    interests: string[]; // 3-10 random interests
}

interface Job {
    title: string;
    incomeLevel: number; // 1-10
    difficulty: number; // Base difficulty 0-50
}

// Female Names Pool
export const NAMES_FEMALE = [
    'Emma', 'Olivia', 'Sophia', 'Isabella', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn', 'Abigail',
    'Emily', 'Luna', 'Aria', 'Scarlett', 'Madison', 'Chloe', 'Zoe', 'Grace', 'Victoria', 'Lily',
    'Hannah', 'Avery', 'Ella', 'Ellie', 'Camila', 'Layla', 'Riley', 'Zoey', 'Nora', 'Leah',
    'Sarah', 'Aubrey', 'Maya', 'Natalie', 'Addison', 'Paisley', 'Brooklyn', 'Bella', 'Claire', 'Skylar'
];

// Male Names Pool
export const NAMES_MALE = [
    'Liam', 'Noah', 'Oliver', 'Elijah', 'James', 'William', 'Benjamin', 'Lucas', 'Henry', 'Alexander',
    'Mason', 'Michael', 'Ethan', 'Daniel', 'Matthew', 'Jackson', 'Sebastian', 'Jack', 'Aiden', 'Owen',
    'Samuel', 'Carter', 'Wyatt', 'Jayden', 'John', 'Luke', 'Dylan', 'Grayson', 'Levi', 'Isaac',
    'Gabriel', 'Julian', 'Mateo', 'Anthony', 'Jaxon', 'Lincoln', 'Joshua', 'Christopher', 'Andrew', 'Theodore'
];

// Job Titles with Income and Difficulty
export const JOBS: Job[] = [
    // Easy (Low Income)
    { title: 'Barista', incomeLevel: 2, difficulty: 10 },
    { title: 'Retail Worker', incomeLevel: 2, difficulty: 12 },
    { title: 'Cashier', incomeLevel: 1, difficulty: 8 },
    { title: 'Waiter', incomeLevel: 2, difficulty: 15 },
    { title: 'Uber Driver', incomeLevel: 3, difficulty: 18 },
    { title: 'Dog Walker', incomeLevel: 2, difficulty: 10 },
    { title: 'Receptionist', incomeLevel: 3, difficulty: 15 },

    // Medium (Mid Income)
    { title: 'Teacher', incomeLevel: 4, difficulty: 25 },
    { title: 'Nurse', incomeLevel: 5, difficulty: 30 },
    { title: 'Graphic Designer', incomeLevel: 5, difficulty: 28 },
    { title: 'Software Developer', incomeLevel: 7, difficulty: 35 },
    { title: 'Accountant', incomeLevel: 6, difficulty: 32 },
    { title: 'Marketing Manager', incomeLevel: 6, difficulty: 33 },
    { title: 'Chef', incomeLevel: 5, difficulty: 30 },
    { title: 'Personal Trainer', incomeLevel: 5, difficulty: 25 },
    { title: 'Real Estate Agent', incomeLevel: 7, difficulty: 38 },

    // Hard (High Income)
    { title: 'Lawyer', incomeLevel: 8, difficulty: 42 },
    { title: 'Investment Banker', incomeLevel: 9, difficulty: 45 },
    { title: 'Model', incomeLevel: 7, difficulty: 48 },
    { title: 'Influencer', incomeLevel: 8, difficulty: 47 },
    { title: 'Surgeon', incomeLevel: 10, difficulty: 50 },
    { title: 'Neurosurgeon', incomeLevel: 10, difficulty: 50 },
    { title: 'CEO', incomeLevel: 10, difficulty: 50 },
    { title: 'Entrepreneur', incomeLevel: 9, difficulty: 46 },
    { title: 'Pilot', incomeLevel: 8, difficulty: 44 },
    { title: 'Architect', incomeLevel: 7, difficulty: 40 },
];

/**
 * Massive pool of 100+ interests for v2
 */
export const INTERESTS = [
    // Hobbies & Activities
    'Anime', 'Trekking', 'Crypto', 'Yoga', 'Gaming', 'Photography', 'Cooking', 'Sci-Fi', 'Horror Movies', 'Tennis',
    'Painting', 'Politics', 'History', 'Meditation', 'Clubbing', 'Wine Tasting', 'Coding', 'Fashion', 'Cars', 'Astrology',
    'Volunteer Work', 'Dancing', 'Singing', 'Poetry', 'Board Games', 'Surfing', 'Skiing', 'Pottery', 'DIY', 'Gardening',

    // Lifestyle
    'Foodie', 'Veganism', 'Coffee', 'Tea', 'Craft Beer', 'Mixology', 'Tattoos', 'Minimalism', 'Van Life', 'Thrifting',
    'Sneakers', 'Streetwear', 'Luxury', 'Interior Design', 'Journaling', 'Podcasts', 'Audiobooks', 'Concerts', 'Festivals', 'Theater',

    // Sports & Fitness
    'Gym', 'Crossfit', 'Running', 'Cycling', 'Swimming', 'Basketball', 'Soccer', 'Football', 'Baseball', 'Golf',
    'Martial Arts', 'Boxing', 'Pilates', 'Zumba', 'Hiking', 'Camping', 'Rock Climbing', 'Skateboarding', 'Snowboarding', 'Surfing',

    // Arts & Culture
    'Museums', 'Galleries', 'Modern Art', 'Classic Literature', 'Indie Movies', 'Documentaries', 'True Crime', 'Writing', 'Sketching', 'Digital Art',
    'Piano', 'Guitar', 'Drums', 'Violin', 'Jazz', 'Classical', 'Hip Hop', 'EDM', 'Rock', 'Pop',

    // Tech & Science
    'Tech', 'Startups', 'AI', 'Space', 'Physics', 'Biology', 'Psychology', 'Philosophy', 'Economics', 'Investing',
    'Real Estate', 'Stocks', 'Blockchain', 'NFTs', 'Gadgets', 'Drones', 'VR/AR', 'Robotics', '3D Printing', 'Cybersecurity',

    // Social & Fun
    'Karaoke', 'Trivia', 'Escape Rooms', 'Bowling', 'Billiards', 'Darts', 'Stand-up Comedy', 'Magic', 'Cosplay', 'Larpm',
    'Travel', 'Languages', 'Road Trips', 'Beach', 'Mountains', 'Forest', 'Desert', 'City Life', 'Country Life', 'Nature'
];

/**
 * Longer, more descriptive Bios for v2
 */
export const BIOS = [
    "I'm a digital nomad looking for someone to share my adventures with. Love spicy food and deep conversations about the universe. 🌍✈️",
    "Coffee addict by day, wine enthusiast by night. Looking for someone who can keep up with my sarcasm and loves dogs as much as I do. ☕🍷🐕",
    "Just a small-town person living in a lonely world. Actually, I live downtown and love it! Let's grab sushi and talk about our dreams. 🍣🌃",
    "Fitness is my passion, but so is pizza. It's all about balance, right? Looking for a gym buddy who also enjoys a good cheat meal. 💪🍕",
    "Introvert at heart but I open up once you get to know me. contain multitudes. Love sci-fi novels, indie bands, and rainy days. 📚☔",
    "Entrepreneur building my empire. Need a partner who is ambitious, driven, and supportive. Power couple vibes only. 💼🚀",
    "Artist and dreamer. I see the world in colors. Looking for a muse or just someone to explore galleries and museums with. 🎨🖌️",
    "Adrenaline junkie! Skydiving, bungee jumping, you name it. If it scares you, I probably want to do it. Need a partner in crime! 🪂🔥",
    "Chef in the making. I promise to cook you the best meal of your life if you promise to do the dishes. Deal? 👨‍🍳🍝",
    "Hopeless romantic looking for my fairytale ending. I believe in love at first sight and holding hands. Swipe right if you're a gentleman/lady. 🌹❤️",
    "Tech nerd and proud of it. I can fix your computer and code you a website. Looking for someone who gets my obscure pop culture references. 💻🤓",
    "Animal lover with 3 cats and a dog. If you're allergic, it probably won't work out. My pets are my family! 🐱🐶",
    "Music is my life. I play guitar and sing. Let's start a band or just jam out in the living room. 🎸🎤",
    " avid traveler. 30 countries and counting. Next stop: You? Let's plan our next getaway together. 🗺️🏖️",
    "Simplistic and mindful. Yoga instructor who loves nature and organic food. Looking for a conscious connection. 🧘‍♀️🌿",
    "Life of the party! I love clubbing, festivals, and meeting new people. looking for someone who can dance the night away with me. 💃🎉",
    "History buff and museum nerd. I can tell you random facts about ancient Rome. Looking for someone intellectually curious. 🏛️📜",
    "Food critic (unofficially). I love trying new restaurants and rating them. Join me on my culinary adventures! 🍴⭐",
    "Spiritual but not religious. I believe in energy and vibes. Looking for a soul connection that transcends the physical. 🔮✨",
    "Just looking for someone real. No games, no drama. Just honest communication and good times. Is that too much to ask? 💯😊",
    "Sarcasm is my second language. If you can't handle a roast, swipe left. Looking for someone with thick skin and a quick wit. 😏🔥"
];

// Profile Background Colors
export const COLORS = [
    '#FF6B6B', // Coral Red
    '#4ECDC4', // Turquoise
    '#45B7D1', // Sky Blue
    '#FFA07A', // Light Salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Soft Yellow
    '#BB8FCE', // Lavender
    '#85C1E2', // Powder Blue
    '#F8B195', // Peach
    '#C06C84', // Mauve
    '#6C5B7B', // Purple
    '#355C7D', // Navy Blue
    '#F67280', // Pink
    '#C8E6C9', // Light Green
    '#FFCCBC', // Light Orange
];

/**
 * Generate a random candidate with all attributes (v2)
 */
export function generateCandidate(): HookupCandidate {
    // Random gender
    const gender: 'male' | 'female' = Math.random() > 0.5 ? 'female' : 'male';

    // Random name based on gender
    const namePool = gender === 'female' ? NAMES_FEMALE : NAMES_MALE;
    const name = namePool[Math.floor(Math.random() * namePool.length)];

    // Random age (21-35)
    const age = Math.floor(Math.random() * 15) + 21;

    // Random job
    const job = JOBS[Math.floor(Math.random() * JOBS.length)];

    // Random bio
    const bio = BIOS[Math.floor(Math.random() * BIOS.length)];

    // Random color
    const imageColor = COLORS[Math.floor(Math.random() * COLORS.length)];

    // Calculate difficulty: Base job difficulty + Random factor (0-50)
    const randomFactor = Math.floor(Math.random() * 51);
    const difficulty = Math.min(100, job.difficulty + randomFactor);

    // Generate unique ID
    const id = `candidate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // v2: Distance (1-25 miles)
    const distance = Math.floor(Math.random() * 25) + 1;

    // v2: Interests (3-10 random unique items)
    const numInterests = Math.floor(Math.random() * 8) + 3;
    const shuffledInterests = [...INTERESTS].sort(() => 0.5 - Math.random());
    const interests = shuffledInterests.slice(0, numInterests);

    return {
        id,
        name,
        age,
        job: job.title,
        bio,
        difficulty,
        gender,
        imageColor,
        distance,
        interests
    };
}
