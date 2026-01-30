/**
 * Gamification Service for Alex Mobile
 * ============================================================
 * Manages gems, levels, companions, achievements, and adventure map
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key
const STORAGE_KEY = 'alex_gamification';

// Gem rewards configuration
const GEM_REWARDS = {
    correctWord: 1,
    streakBonus5: 5,
    streakBonus10: 15,
    streakBonus20: 30,
    completedPage: 25,
    masteredWord: 10,
    dailyLogin: 5,
};

// Levels configuration
export const LEVELS = [
    { level: 1, name: 'Little Acorn', gemsRequired: 0, icon: '🌰' },
    { level: 2, name: 'Sprouting Seed', gemsRequired: 50, icon: '🌱' },
    { level: 3, name: 'Growing Tree', gemsRequired: 150, icon: '🌿' },
    { level: 4, name: 'Mighty Oak', gemsRequired: 300, icon: '🌳' },
    { level: 5, name: 'Reading Star', gemsRequired: 500, icon: '⭐' },
    { level: 6, name: 'Super Reader', gemsRequired: 800, icon: '🌟' },
    { level: 7, name: 'Reading Champion', gemsRequired: 1200, icon: '🏆' },
    { level: 8, name: 'Word Wizard', gemsRequired: 1800, icon: '🧙' },
    { level: 9, name: 'Story Master', gemsRequired: 2500, icon: '📚' },
    { level: 10, name: 'Legend', gemsRequired: 3500, icon: '👑' },
];

// Companions
export const COMPANIONS = {
    owl: { id: 'owl', name: 'Professor Hoot', emoji: '🦉', unlockedAt: 25 },
    elephant: { id: 'elephant', name: 'Memory', emoji: '🐘', unlockedAt: 75 },
    cheetah: { id: 'cheetah', name: 'Speedy', emoji: '🐆', unlockedAt: 150 },
    butterfly: { id: 'butterfly', name: 'Flutter', emoji: '🦋', unlockedAt: 250 },
    dragon: { id: 'dragon', name: 'Draco', emoji: '🐉', unlockedAt: 500 },
};

// Adventure stages
export const STAGES = [
    { id: 'forest', name: 'The Friendly Forest', wordsToUnlock: 0, icon: '🌲', color: '#10B981' },
    { id: 'river', name: 'The River Crossing', wordsToUnlock: 50, icon: '🏞️', color: '#3B82F6' },
    { id: 'cave', name: 'The Crystal Cave', wordsToUnlock: 150, icon: '💎', color: '#8B5CF6' },
    { id: 'mountain', name: 'The Mountain Climb', wordsToUnlock: 300, icon: '⛰️', color: '#F59E0B' },
    { id: 'castle', name: 'The Story Castle', wordsToUnlock: 500, icon: '🏰', color: '#EC4899' },
];

// State interface
export interface GamificationState {
    gems: number;
    totalWordsRead: number;
    bestStreak: number;
    currentStreak: number;
    pagesCompleted: number;
    unlockedCompanions: string[];
    currentStage: string;
    lastLoginDate: string | null;
}

// Initial state
const initialState: GamificationState = {
    gems: 0,
    totalWordsRead: 0,
    bestStreak: 0,
    currentStreak: 0,
    pagesCompleted: 0,
    unlockedCompanions: [],
    currentStage: 'forest',
    lastLoginDate: null,
};

// Current state (in-memory)
let state = { ...initialState };

/**
 * Load state from AsyncStorage
 */
export async function loadState(): Promise<GamificationState> {
    try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
            state = { ...initialState, ...JSON.parse(saved) };
        }
        return state;
    } catch (error) {
        console.error('Failed to load gamification state:', error);
        return state;
    }
}

/**
 * Save state to AsyncStorage
 */
async function saveState(): Promise<void> {
    try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error('Failed to save gamification state:', error);
    }
}

/**
 * Get current level based on gems
 */
export function getCurrentLevel(): typeof LEVELS[0] {
    let currentLevel = LEVELS[0];
    for (const level of LEVELS) {
        if (state.gems >= level.gemsRequired) {
            currentLevel = level;
        } else {
            break;
        }
    }
    return currentLevel;
}

/**
 * Add gems and check for level up
 */
export async function addGems(amount: number): Promise<{ newTotal: number; levelUp?: typeof LEVELS[0] }> {
    const previousLevel = getCurrentLevel();
    state.gems += amount;

    const newLevel = getCurrentLevel();
    const levelUp = newLevel.level > previousLevel.level ? newLevel : undefined;

    // Check for companion unlocks
    for (const [id, companion] of Object.entries(COMPANIONS)) {
        if (state.gems >= companion.unlockedAt && !state.unlockedCompanions.includes(id)) {
            state.unlockedCompanions.push(id);
        }
    }

    await saveState();
    return { newTotal: state.gems, levelUp };
}

/**
 * Record a correct word
 */
export async function recordCorrectWord(streak: number): Promise<{ gems: number; levelUp?: typeof LEVELS[0] }> {
    state.totalWordsRead++;
    state.currentStreak = streak;
    if (streak > state.bestStreak) {
        state.bestStreak = streak;
    }

    let gemsEarned = GEM_REWARDS.correctWord;

    // Streak bonuses
    if (streak === 5) gemsEarned += GEM_REWARDS.streakBonus5;
    else if (streak === 10) gemsEarned += GEM_REWARDS.streakBonus10;
    else if (streak === 20) gemsEarned += GEM_REWARDS.streakBonus20;

    const result = await addGems(gemsEarned);
    return { gems: gemsEarned, levelUp: result.levelUp };
}

/**
 * Record a mistake (resets streak)
 */
export async function recordMistake(): Promise<void> {
    state.currentStreak = 0;
    await saveState();
}

/**
 * Get current state
 */
export function getState(): GamificationState {
    return { ...state };
}

/**
 * Get summary for display
 */
export function getSummary() {
    const level = getCurrentLevel();
    return {
        gems: state.gems,
        level,
        totalWordsRead: state.totalWordsRead,
        bestStreak: state.bestStreak,
        companionsUnlocked: state.unlockedCompanions.length,
        currentStage: STAGES.find(s => s.id === state.currentStage) || STAGES[0],
    };
}
