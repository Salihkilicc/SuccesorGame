export type ProductCategory = 'Consumer' | 'Robotics' | 'Bio-Tech' | 'Deep Tech';

export interface UnlockableProduct {
    id: string;
    name: string;
    description: string;
    category: ProductCategory;
    unlockRPCost: number;
    unlockCashCost: number;
    baseUnitCost: number;
    baseSellingPrice: number;
    complexity: number;
    stockBoost: number; // Percentage boost to company valuation
    isUnlocked: boolean;
}

export const UNLOCKABLE_PRODUCTS: UnlockableProduct[] = [
    // --- TIER 1: CONSUMER ELECTRONICS (Starter Pack & Early Game) ---
    {
        id: 'smart_phone',
        name: 'Smart Phone',
        description: 'Essential for modern life. High volume.',
        baseSellingPrice: 600,
        baseUnitCost: 250,
        complexity: 50, // BASE DIFFICULTY
        unlockRPCost: 0,
        unlockCashCost: 0,
        category: 'Consumer',
        stockBoost: 1,
        isUnlocked: true // STARTER PRODUCT 1
    },
    {
        id: 'pro_laptop',
        name: 'Pro Laptop',
        description: 'High margin tool for professionals.',
        baseSellingPrice: 1200,
        baseUnitCost: 550,
        complexity: 90, // Slightly easier than math suggests (Reward)
        unlockRPCost: 0,
        unlockCashCost: 0,
        category: 'Consumer',
        stockBoost: 2,
        isUnlocked: true // STARTER PRODUCT 2
    },
    {
        id: 'smart_speaker',
        name: 'Smart Speaker',
        description: 'Voice assistant for every home.',
        baseSellingPrice: 150,
        baseUnitCost: 70,
        complexity: 12,
        unlockRPCost: 100000,
        unlockCashCost: 5000000,
        category: 'Consumer',
        stockBoost: 1.5,
        isUnlocked: false
    },
    {
        id: 'vr_headset',
        name: 'VR Headset',
        description: 'Gateway to the metaverse.',
        baseSellingPrice: 800,
        baseUnitCost: 350,
        complexity: 65,
        unlockRPCost: 300000,
        unlockCashCost: 15000000,
        category: 'Consumer',
        stockBoost: 3,
        isUnlocked: false
    },
    {
        id: 'gaming_console',
        name: 'Game Station X',
        description: 'Next-gen entertainment system.',
        baseSellingPrice: 500,
        baseUnitCost: 280,
        complexity: 40,
        unlockRPCost: 400000,
        unlockCashCost: 20000000,
        category: 'Consumer',
        stockBoost: 2.5,
        isUnlocked: false
    },

    // --- TIER 2: ROBOTICS & DRONES (Mid Game) ---
    {
        id: 'drone_4k',
        name: 'Auto-Drone 4K',
        description: 'Autonomous camera drone.',
        baseSellingPrice: 2500,
        baseUnitCost: 1100,
        complexity: 200,
        unlockRPCost: 600000,
        unlockCashCost: 50000000,
        category: 'Robotics',
        stockBoost: 5,
        isUnlocked: false
    },
    {
        id: 'home_robot',
        name: 'Home Bot v1',
        description: 'Cleans, cooks, and secures.',
        baseSellingPrice: 15000,
        baseUnitCost: 6500,
        complexity: 1100,
        unlockRPCost: 800000,
        unlockCashCost: 75000000,
        category: 'Robotics',
        stockBoost: 8,
        isUnlocked: false
    },
    {
        id: 'delivery_bot',
        name: 'Delivery Rover',
        description: 'Last-mile logistics solution.',
        baseSellingPrice: 8000,
        baseUnitCost: 3500,
        complexity: 600,
        unlockRPCost: 1000000,
        unlockCashCost: 100000000,
        category: 'Robotics',
        stockBoost: 6,
        isUnlocked: false
    },
    {
        id: 'ind_robot_arm',
        name: 'Industrial Arm',
        description: 'Automation for factories.',
        baseSellingPrice: 50000,
        baseUnitCost: 20000,
        complexity: 3500,
        unlockRPCost: 1200000,
        unlockCashCost: 150000000,
        category: 'Robotics',
        stockBoost: 10,
        isUnlocked: false
    },
    {
        id: 'electric_car',
        name: 'Electric Sedan',
        description: 'Long range, zero emission vehicle.',
        baseSellingPrice: 45000,
        baseUnitCost: 25000,
        complexity: 3000,
        unlockRPCost: 1500000,
        unlockCashCost: 300000000,
        category: 'Robotics',
        stockBoost: 12,
        isUnlocked: false
    },

    // --- TIER 3: BIO-TECH & DEEP TECH (Late Game) ---
    {
        id: 'cyber_limb',
        name: 'Cybernetic Limb',
        description: 'Better, faster, stronger than biological.',
        baseSellingPrice: 120000,
        baseUnitCost: 50000,
        complexity: 8000,
        unlockRPCost: 2000000,
        unlockCashCost: 500000000,
        category: 'Bio-Tech',
        stockBoost: 15,
        isUnlocked: false
    },
    {
        id: 'neural_chip',
        name: 'Neural Link',
        description: 'Direct brain-computer interface.',
        baseSellingPrice: 500000,
        baseUnitCost: 150000,
        complexity: 35000,
        unlockRPCost: 3000000,
        unlockCashCost: 1000000000,
        category: 'Bio-Tech',
        stockBoost: 20,
        isUnlocked: false
    },
    {
        id: 'flying_car',
        name: 'eVTOL SkyCar',
        description: 'Traffic is for the ground dwellers.',
        baseSellingPrice: 2500000,
        baseUnitCost: 1200000,
        complexity: 180000,
        unlockRPCost: 4000000,
        unlockCashCost: 2500000000,
        category: 'Deep Tech',
        stockBoost: 25,
        isUnlocked: false
    },
    {
        id: 'quantum_pc',
        name: 'Quantum Computer',
        description: 'Simulating the universe.',
        baseSellingPrice: 10000000,
        baseUnitCost: 4000000,
        complexity: 700000,
        unlockRPCost: 5000000,
        unlockCashCost: 5000000000,
        category: 'Deep Tech',
        stockBoost: 30,
        isUnlocked: false
    },

    // --- TIER 4: GOD TIER (End Game) ---
    {
        id: 'fusion_reactor',
        name: 'Fusion Reactor',
        description: 'Unlimited clean energy for cities.',
        baseSellingPrice: 150000000, // $150M
        baseUnitCost: 60000000,
        complexity: 10000000, // Very hard to build
        unlockRPCost: 6500000,
        unlockCashCost: 15000000000,
        category: 'Deep Tech',
        stockBoost: 40,
        isUnlocked: false
    },
    {
        id: 'immortality',
        name: 'Mind Upload',
        description: 'Digital immortality as a service.',
        baseSellingPrice: 1000000000, // $1 Billion
        baseUnitCost: 100000000,
        complexity: 50000000,
        unlockRPCost: 7200000,
        unlockCashCost: 25000000000,
        category: 'Deep Tech',
        stockBoost: 50,
        isUnlocked: false
    }
];
