export type MajorType = 'ComputerScience' | 'Business' | 'Psychology' | 'Law' | 'Medicine' | 'Engineering' | 'PoliticalScience' | 'History' | 'Architecture' | 'Economics' | 'Philosophy' | 'Marketing';

export type DegreeType = 'Undergraduate' | 'Master' | 'PhD';

export type CertificateType =
    | 'AIPromptEngineering'
    | 'FullStackBootcamp'
    | 'CybersecurityBasics'
    | 'BlockchainFundamentals'
    | 'DataScience101'
    | 'GourmetCooking'
    | 'SommelierLevel1'
    | 'YogaInstructor'
    | 'PersonalTrainer'
    | 'MixologyMaster'
    | 'DigitalPhotography'
    | 'InteriorDesign'
    | 'CreativeWriting'
    | 'MusicProduction'
    | 'VideoEditing'
    | 'GraphicDesign'
    | 'ProjectManagement'
    | 'DigitalMarketing'
    | 'PublicSpeaking'
    | 'NegotiationTactics'
    | 'RealEstateLicense'
    | 'FirstAidCPR'
    | 'SurvivalTraining'
    | 'AdvancedDriving'
    | 'ScubaDiving'
    | 'WealthManagement'
    | 'SocialMediaInfluencer'
    | 'PotteryCeramics'
    | 'UrbanGardening'
    | 'ForeignLanguage'
    | 'EventPlanning'
    | 'FashionStyling';

export type ClubType =
    | 'The Elites'
    | 'Brainiacs'
    | 'The Artists'
    | 'Fit Club'
    | 'Debaters'
    | 'Charisma Corps'
    | 'Tech Wizards'
    | 'Volunteers'
    | 'Future Leaders'
    | 'The Creatives';

export interface MajorInfo {
    label: string;
    relatedStat: 'intellect' | 'businessTrust' | 'charm' | 'happiness' | 'strength' | 'morality' | 'highSociety' | 'health' | 'digital';
}

export const MAJOR_DATA: Record<MajorType, MajorInfo> = {
    'ComputerScience': { label: 'Computer Science', relatedStat: 'digital' },
    'Business': { label: 'Business', relatedStat: 'businessTrust' },
    'Psychology': { label: 'Psychology', relatedStat: 'charm' },
    'Law': { label: 'Law', relatedStat: 'intellect' },
    'Medicine': { label: 'Medicine', relatedStat: 'health' },
    'Engineering': { label: 'Engineering', relatedStat: 'intellect' },
    'PoliticalScience': { label: 'Political Science', relatedStat: 'highSociety' },
    'History': { label: 'History', relatedStat: 'intellect' },
    'Architecture': { label: 'Architecture', relatedStat: 'highSociety' },
    'Economics': { label: 'Economics', relatedStat: 'businessTrust' },
    'Philosophy': { label: 'Philosophy', relatedStat: 'morality' },
    'Marketing': { label: 'Marketing', relatedStat: 'charm' },
};

export interface DegreeInfo {
    durationQuarters: number;
    hasYearlyExams: boolean;
}

export const DEGREE_DATA: Record<DegreeType, DegreeInfo> = {
    'Undergraduate': { durationQuarters: 16, hasYearlyExams: true },
    'Master': { durationQuarters: 8, hasYearlyExams: true },
    'PhD': { durationQuarters: 16, hasYearlyExams: true },
};

export const PROGRAM_DETAILS: Record<DegreeType, { duration: string; cost: number; label: string }> = {
    'Undergraduate': { duration: '4 Years', cost: 200000, label: "Bachelor's Degree" },
    'Master': { duration: '2 Years', cost: 150000, label: "Master's Degree" },
    'PhD': { duration: '4 Years', cost: 100000, label: "PhD" },
};

export interface CertificateInfo {
    label: string;
    relatedStat: 'intellect' | 'businessTrust' | 'charm' | 'happiness' | 'strength' | 'morality' | 'highSociety' | 'health';
    duration: string;
    cost: number;
}

export const CERTIFICATE_DATA: Record<CertificateType, CertificateInfo> = {
    // Tech
    'AIPromptEngineering': { label: 'AI Prompt Engineering', relatedStat: 'intellect', duration: '8 Months', cost: 2500 },
    'FullStackBootcamp': { label: 'Full Stack Bootcamp', relatedStat: 'intellect', duration: '12 Months', cost: 12000 },
    'CybersecurityBasics': { label: 'Cybersecurity Basics', relatedStat: 'intellect', duration: '9 Months', cost: 4500 },
    'BlockchainFundamentals': { label: 'Blockchain Fundamentals', relatedStat: 'intellect', duration: '7 Months', cost: 3000 },
    'DataScience101': { label: 'Data Science 101', relatedStat: 'intellect', duration: '11 Months', cost: 8500 },

    // Lifestyle & Hobbies
    'GourmetCooking': { label: 'Gourmet Cooking', relatedStat: 'happiness', duration: '9 Months', cost: 3500 },
    'SommelierLevel1': { label: 'Sommelier Level 1', relatedStat: 'highSociety', duration: '6 Months', cost: 2000 },
    'YogaInstructor': { label: 'Yoga Instructor', relatedStat: 'health', duration: '7 Months', cost: 2500 },
    'PersonalTrainer': { label: 'Personal Trainer', relatedStat: 'strength', duration: '10 Months', cost: 3000 },
    'MixologyMaster': { label: 'Mixology Master', relatedStat: 'highSociety', duration: '6 Months', cost: 1500 },
    'DigitalPhotography': { label: 'Digital Photography', relatedStat: 'happiness', duration: '8 Months', cost: 2200 },

    // Creative
    'InteriorDesign': { label: 'Interior Design', relatedStat: 'highSociety', duration: '12 Months', cost: 5500 },
    'CreativeWriting': { label: 'Creative Writing', relatedStat: 'intellect', duration: '7 Months', cost: 1200 },
    'MusicProduction': { label: 'Music Production', relatedStat: 'happiness', duration: '11 Months', cost: 6500 },
    'VideoEditing': { label: 'Video Editing', relatedStat: 'happiness', duration: '9 Months', cost: 3500 },
    'GraphicDesign': { label: 'Graphic Design', relatedStat: 'happiness', duration: '10 Months', cost: 4000 },

    // Business
    'ProjectManagement': { label: 'Project Management (PMP)', relatedStat: 'businessTrust', duration: '12 Months', cost: 5000 },
    'DigitalMarketing': { label: 'Digital Marketing', relatedStat: 'businessTrust', duration: '8 Months', cost: 3500 },
    'PublicSpeaking': { label: 'Public Speaking', relatedStat: 'charm', duration: '6 Months', cost: 2500 },
    'NegotiationTactics': { label: 'Negotiation Tactics', relatedStat: 'businessTrust', duration: '7 Months', cost: 3000 },
    'RealEstateLicense': { label: 'Real Estate License', relatedStat: 'businessTrust', duration: '11 Months', cost: 4500 },

    // Life Skills
    'FirstAidCPR': { label: 'First Aid & CPR', relatedStat: 'health', duration: '6 Months', cost: 500 },
    'SurvivalTraining': { label: 'Survival Training', relatedStat: 'strength', duration: '8 Months', cost: 1500 },
    'AdvancedDriving': { label: 'Advanced Driving', relatedStat: 'intellect', duration: '7 Months', cost: 1200 },
    'ScubaDiving': { label: 'Scuba Diving (PADI)', relatedStat: 'health', duration: '9 Months', cost: 1800 },

    // Additional
    'WealthManagement': { label: 'Wealth Management', relatedStat: 'businessTrust', duration: '10 Months', cost: 4000 },
    'SocialMediaInfluencer': { label: 'Social Media Mastery', relatedStat: 'charm', duration: '8 Months', cost: 2000 },
    'PotteryCeramics': { label: 'Pottery & Ceramics', relatedStat: 'happiness', duration: '9 Months', cost: 1800 },
    'UrbanGardening': { label: 'Urban Gardening', relatedStat: 'happiness', duration: '6 Months', cost: 800 },
    'ForeignLanguage': { label: 'Language Mastery', relatedStat: 'intellect', duration: '12 Months', cost: 2500 },
    'EventPlanning': { label: 'Event Planning', relatedStat: 'charm', duration: '10 Months', cost: 3000 },
    'FashionStyling': { label: 'Fashion Styling', relatedStat: 'highSociety', duration: '8 Months', cost: 3500 },
};

export interface MastersInfo {
    label: string;
    parentMajor: MajorType;
    duration: string;
    cost: number;
}

export type MastersType =
    // Computer Science (2)
    | 'MSArtificialIntelligence'
    | 'MSCybersecurity'
    // Business (2)
    | 'MBAFinance'
    | 'MBAEntrepreneurship'
    // Psychology (2)
    | 'MSClinicalPsychology'
    | 'MSOrganizationalBehavior'
    // Law (2)
    | 'LLMCorporateLaw'
    | 'LLMHumanRights'
    // Medicine (2)
    | 'MPH'
    | 'MSNeuroscience'
    // Engineering (2)
    | 'MSRobotics'
    | 'MSCivilInfrastructure'
    // Political Science (2)
    | 'MAInternationalRelations'
    | 'MPPPublicPolicy'
    // History (2)
    | 'MAModernHistory'
    | 'MAArcheology'
    // Architecture (2)
    | 'MArchUrbanDesign'
    | 'MArchSustainableArchitecture'
    // Economics (2)
    | 'MSAppliedEconomics'
    | 'MSEconometrics'
    // Philosophy (2)
    | 'MAEthicsLogic'
    | 'MAHistoryOfPhilosophy'
    // Marketing (2)
    | 'MSDigitalBrandManagement'
    | 'MSConsumerBehavior';

export const MASTERS_DATA: Record<MastersType, MastersInfo> = {
    // Computer Science (2)
    'MSArtificialIntelligence': {
        label: 'M.S. Artificial Intelligence',
        parentMajor: 'ComputerScience',
        duration: '2 Years',
        cost: 180000
    },
    'MSCybersecurity': {
        label: 'M.S. Cybersecurity',
        parentMajor: 'ComputerScience',
        duration: '2 Years',
        cost: 175000
    },

    // Business (2)
    'MBAFinance': {
        label: 'MBA Finance',
        parentMajor: 'Business',
        duration: '2 Years',
        cost: 180000
    },
    'MBAEntrepreneurship': {
        label: 'MBA Entrepreneurship',
        parentMajor: 'Business',
        duration: '2 Years',
        cost: 170000
    },

    // Psychology (2)
    'MSClinicalPsychology': {
        label: 'M.S. Clinical Psychology',
        parentMajor: 'Psychology',
        duration: '2 Years',
        cost: 140000
    },
    'MSOrganizationalBehavior': {
        label: 'M.S. Organizational Behavior',
        parentMajor: 'Psychology',
        duration: '2 Years',
        cost: 135000
    },

    // Law (2)
    'LLMCorporateLaw': {
        label: 'LL.M. Corporate Law',
        parentMajor: 'Law',
        duration: '2 Years',
        cost: 175000
    },
    'LLMHumanRights': {
        label: 'LL.M. Human Rights',
        parentMajor: 'Law',
        duration: '2 Years',
        cost: 150000
    },

    // Medicine (2)
    'MPH': {
        label: 'Master of Public Health',
        parentMajor: 'Medicine',
        duration: '2 Years',
        cost: 165000
    },
    'MSNeuroscience': {
        label: 'M.S. Neuroscience',
        parentMajor: 'Medicine',
        duration: '2 Years',
        cost: 170000
    },

    // Engineering (2)
    'MSRobotics': {
        label: 'M.S. Robotics',
        parentMajor: 'Engineering',
        duration: '2 Years',
        cost: 180000
    },
    'MSCivilInfrastructure': {
        label: 'M.S. Civil Infrastructure',
        parentMajor: 'Engineering',
        duration: '2 Years',
        cost: 160000
    },

    // Political Science (2)
    'MAInternationalRelations': {
        label: 'M.A. International Relations',
        parentMajor: 'PoliticalScience',
        duration: '2 Years',
        cost: 145000
    },
    'MPPPublicPolicy': {
        label: 'M.P.P. Public Policy',
        parentMajor: 'PoliticalScience',
        duration: '2 Years',
        cost: 150000
    },

    // History (2)
    'MAModernHistory': {
        label: 'M.A. Modern History',
        parentMajor: 'History',
        duration: '2 Years',
        cost: 120000
    },
    'MAArcheology': {
        label: 'M.A. Archeology',
        parentMajor: 'History',
        duration: '2 Years',
        cost: 125000
    },

    // Architecture (2)
    'MArchUrbanDesign': {
        label: 'M.Arch. Urban Design',
        parentMajor: 'Architecture',
        duration: '2 Years',
        cost: 165000
    },
    'MArchSustainableArchitecture': {
        label: 'M.Arch. Sustainable Architecture',
        parentMajor: 'Architecture',
        duration: '2 Years',
        cost: 160000
    },

    // Economics (2)
    'MSAppliedEconomics': {
        label: 'M.S. Applied Economics',
        parentMajor: 'Economics',
        duration: '2 Years',
        cost: 155000
    },
    'MSEconometrics': {
        label: 'M.S. Econometrics',
        parentMajor: 'Economics',
        duration: '2 Years',
        cost: 160000
    },

    // Philosophy (2)
    'MAEthicsLogic': {
        label: 'M.A. Ethics & Logic',
        parentMajor: 'Philosophy',
        duration: '2 Years',
        cost: 125000
    },
    'MAHistoryOfPhilosophy': {
        label: 'M.A. History of Philosophy',
        parentMajor: 'Philosophy',
        duration: '2 Years',
        cost: 120000
    },

    // Marketing (2)
    'MSDigitalBrandManagement': {
        label: 'M.S. Digital Brand Management',
        parentMajor: 'Marketing',
        duration: '2 Years',
        cost: 155000
    },
    'MSConsumerBehavior': {
        label: 'M.S. Consumer Behavior',
        parentMajor: 'Marketing',
        duration: '2 Years',
        cost: 150000
    },
};

// ========================================
// PHD PROGRAMS (Elite Doctoral Programs)
// ========================================

export type PhDType =
    | 'PHD_CS'
    | 'PHD_BUS'
    | 'PHD_MED'
    | 'PHD_LAW'
    | 'PHD_ENG'
    | 'PHD_PSY';

export interface PhDInfo {
    label: string;
    parentMajor: MajorType;
    duration: number; // in quarters
    cost: number;
}

export const PHD_DATA: Record<PhDType, PhDInfo> = {
    'PHD_CS': {
        label: 'PhD in Artificial General Intelligence',
        parentMajor: 'ComputerScience',
        duration: 16,
        cost: 0
    },
    'PHD_BUS': {
        label: 'PhD in Global Economics',
        parentMajor: 'Business',
        duration: 16,
        cost: 100000
    },
    'PHD_MED': {
        label: 'MD-PhD in Neurosurgery',
        parentMajor: 'Medicine',
        duration: 20,
        cost: 150000
    },
    'PHD_LAW': {
        label: 'Doctor of Juridical Science (SJD)',
        parentMajor: 'Law',
        duration: 12,
        cost: 120000
    },
    'PHD_ENG': {
        label: 'PhD in Quantum Computing',
        parentMajor: 'Engineering',
        duration: 16,
        cost: 100000
    },
    'PHD_PSY': {
        label: 'PhD in Cognitive Neuroscience',
        parentMajor: 'Psychology',
        duration: 16,
        cost: 100000
    },
};

// ========================================
// CLUBS
// ========================================

export interface ClubInfo {
    name: string;
    description: string;
    buffStat: 'intellect' | 'businessTrust' | 'charm' | 'happiness' | 'strength' | 'morality' | 'highSociety' | 'health';
    buffAmount: number;
}

export const CLUB_DATA: Record<ClubType, ClubInfo> = {
    'The Elites': {
        name: 'The Elites',
        description: 'A society for high-achievers destined for greatness.',
        buffStat: 'businessTrust',
        buffAmount: 0.25,
    },
    'Brainiacs': {
        name: 'Brainiacs',
        description: 'Where pure intellect satisfies curiosity.',
        buffStat: 'intellect',
        buffAmount: 0.25,
    },
    'The Artists': {
        name: 'The Artists',
        description: 'Expression through every medium possible.',
        buffStat: 'happiness',
        buffAmount: 0.25,
    },
    'Fit Club': {
        name: 'Fit Club',
        description: 'Dedicated to physical excellence and health.',
        buffStat: 'strength',
        buffAmount: 0.25,
    },
    'Debaters': {
        name: 'Debaters',
        description: 'Sharpening minds through rigorous discourse.',
        buffStat: 'intellect',
        buffAmount: 0.25,
    },
    'Charisma Corps': {
        name: 'Charisma Corps',
        description: 'Mastering the art of social dynamics.',
        buffStat: 'charm',
        buffAmount: 0.25,
    },
    'Tech Wizards': {
        name: 'Tech Wizards',
        description: 'Innovating the future, one line of code at a time.',
        buffStat: 'intellect',
        buffAmount: 0.25,
    },
    'Volunteers': {
        name: 'Volunteers',
        description: 'Giving back to the community selflessly.',
        buffStat: 'morality',
        buffAmount: 0.25,
    },
    'Future Leaders': {
        name: 'Future Leaders',
        description: 'Networking for the corporate titans of tomorrow.',
        buffStat: 'businessTrust',
        buffAmount: 0.25,
    },
    'The Creatives': {
        name: 'The Creatives',
        description: 'Finding beauty in the mundane.',
        buffStat: 'happiness',
        buffAmount: 0.25,
    },
};

export interface ExamQuestion {
    question: string;
    options: string[];
    correctIndex: number;
}

export const EXAM_QUESTIONS: Record<MajorType, ExamQuestion[]> = {
    'ComputerScience': [
        {
            question: 'Which data structure follows the LIFO principle?',
            options: ['Queue', 'Stack', 'Linked List', 'Tree'],
            correctIndex: 1,
        },
        {
            question: 'What is the time complexity of binary search?',
            options: ['O(n)', 'O(n^2)', 'O(log n)', 'O(1)'],
            correctIndex: 2,
        },
        {
            question: 'What does CPU stand for?',
            options: ['Central Process Unit', 'Central Processing Unit', 'Computer Personal Unit', 'Central Processor Utility'],
            correctIndex: 1,
        },
    ],
    'Business': [
        {
            question: 'What does ROI stand for?',
            options: ['Rate of Investment', 'Return on Investment', 'Risk of Inflation', 'Real Organised Income'],
            correctIndex: 1,
        },
        {
            question: 'Which of these is a liability?',
            options: ['Cash', 'Inventory', 'Accounts Payable', 'Equipment'],
            correctIndex: 2,
        },
        {
            question: 'What is the 4 Ps of marketing?',
            options: ['Product, Price, Place, Promotion', 'People, Process, Power, Plan', 'Profit, Product, Price, Plan', 'Plan, Push, Pull, Print'],
            correctIndex: 0,
        },
    ],
    'Psychology': [
        {
            question: 'Who is considered the father of psychoanalysis?',
            options: ['Carl Jung', 'B.F. Skinner', 'Sigmund Freud', 'Jean Piaget'],
            correctIndex: 2,
        },
        {
            question: 'What part of the brain is responsible for memory?',
            options: ['Cerebellum', 'Hippocampus', 'Occipital Lobe', 'Brainstem'],
            correctIndex: 1,
        },
        {
            question: 'Which creates a conditioned response?',
            options: ['Operant Conditioning', 'Classical Conditioning', 'Observational Learning', 'Cognitive Map'],
            correctIndex: 1,
        },
    ],
    'Law': [
        {
            question: 'What is "Habeas Corpus"?',
            options: ['Right to Remain Silent', 'Right to a Fair Trial', 'Protection against unlawful detention', 'Freedom of Speech'],
            correctIndex: 2,
        },
        {
            question: 'A contract requires offer, acceptance, and...?',
            options: ['Signature', 'Consideration', 'Witness', 'Notary'],
            correctIndex: 1,
        },
        {
            question: 'What is a Tort?',
            options: ['A type of cake', 'A criminal offense', 'A civil wrong', 'A contract breach'],
            correctIndex: 2,
        },
    ],
    'Medicine': [
        {
            question: 'What is the largest organ in the human body?',
            options: ['Liver', 'Heart', 'Skin', 'Brain'],
            correctIndex: 2,
        },
        {
            question: 'What is the normal human body temperature in Celsius?',
            options: ['35°C', '37°C', '39°C', '40°C'],
            correctIndex: 1,
        },
        {
            question: 'Which blood type is the universal donor?',
            options: ['A+', 'B-', 'AB+', 'O-'],
            correctIndex: 3,
        },
    ],
    'Engineering': [
        {
            question: 'What is Ohms Law?',
            options: ['V=IR', 'F=ma', 'E=mc^2', 'P=IV'],
            correctIndex: 0,
        },
        {
            question: 'What is the SI unit of force?',
            options: ['Joule', 'Newton', 'Watt', 'Pascal'],
            correctIndex: 1,
        },
        {
            question: 'What does CAD stand for in engineering?',
            options: ['Computer Aided Design', 'Central Analysis Data', 'Calculated Area Diagram', 'Core Application Development'],
            correctIndex: 0,
        },
    ],
    'PoliticalScience': [
        {
            question: 'What is a democracy?',
            options: ['Rule by one', 'Rule by few', 'Rule by people', 'Rule by military'],
            correctIndex: 2,
        },
        {
            question: 'What are the three branches of US government?',
            options: ['Executive, Legislative, Judicial', 'President, Senate, Court', 'Federal, State, Local', 'Military, Police, FBI'],
            correctIndex: 0,
        },
        {
            question: 'What is federalism?',
            options: ['One central government', 'Power divided between national and state', 'Rule by states only', 'International cooperation'],
            correctIndex: 1,
        },
    ],
    'History': [
        {
            question: 'When did WWII end?',
            options: ['1940', '1945', '1950', '1939'],
            correctIndex: 1,
        },
        {
            question: 'Who was the first President of the United States?',
            options: ['Thomas Jefferson', 'George Washington', 'John Adams', 'Benjamin Franklin'],
            correctIndex: 1,
        },
        {
            question: 'In which year did the Berlin Wall fall?',
            options: ['1987', '1989', '1991', '1985'],
            correctIndex: 1,
        },
    ],
    'Architecture': [
        {
            question: 'Who designed the Guggenheim Museum in Bilbao?',
            options: ['Frank Lloyd Wright', 'Frank Gehry', 'Zaha Hadid', 'Le Corbusier'],
            correctIndex: 1,
        },
        {
            question: 'What architectural style is characterized by pointed arches?',
            options: ['Baroque', 'Gothic', 'Renaissance', 'Modernist'],
            correctIndex: 1,
        },
        {
            question: 'What does the Golden Ratio approximately equal?',
            options: ['1.414', '1.618', '2.718', '3.142'],
            correctIndex: 1,
        },
    ],
    'Economics': [
        {
            question: 'What is inflation?',
            options: ['Falling prices', 'Rising prices', 'Stable prices', 'No prices'],
            correctIndex: 1,
        },
        {
            question: 'What does GDP stand for?',
            options: ['Gross Domestic Product', 'General Development Plan', 'Global Distribution Process', 'Government Debt Payment'],
            correctIndex: 0,
        },
        {
            question: 'What is supply and demand?',
            options: ['Government control', 'Market forces determining price', 'Fixed pricing', 'Random pricing'],
            correctIndex: 1,
        },
    ],
    'Philosophy': [
        {
            question: 'Who wrote "The Republic"?',
            options: ['Socrates', 'Plato', 'Aristotle', 'Descartes'],
            correctIndex: 1,
        },
        {
            question: 'What is the study of knowledge called?',
            options: ['Ontology', 'Epistemology', 'Ethics', 'Logic'],
            correctIndex: 1,
        },
        {
            question: 'Who said "I think, therefore I am"?',
            options: ['Kant', 'Nietzsche', 'Descartes', 'Hume'],
            correctIndex: 2,
        },
    ],
    'Marketing': [
        {
            question: 'What does SEO stand for?',
            options: ['Search Engine Optimization', 'Sales Executive Officer', 'Senior Executive Officer', 'Site Extraction Option'],
            correctIndex: 0,
        },
        {
            question: 'What is a target market?',
            options: ['All customers', 'Specific group of potential customers', 'Competitors', 'Suppliers'],
            correctIndex: 1,
        },
        {
            question: 'What does B2B stand for?',
            options: ['Business to Business', 'Back to Basics', 'Brand to Brand', 'Buyer to Buyer'],
            correctIndex: 0,
        },
    ],
};

// Export alias for backward compatibility
export const EXAM_DATA = EXAM_QUESTIONS;
