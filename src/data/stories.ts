/**
 * Stories Library for Alex Reading Tutor
 * ============================================================
 * Graded reading passages for children learning to read
 */

export interface Story {
    id: string;
    title: string;
    level: 1 | 2 | 3;
    levelName: 'Easy' | 'Medium' | 'Hard';
    coverEmoji: string;
    text: string;
    wordCount: number;
}

export const STORIES: Story[] = [
    // ============================================================
    // LEVEL 1 - EASY (15-25 words, simple vocabulary)
    // ============================================================
    {
        id: 'lion-sun',
        title: 'The Lion and the Sun',
        level: 1,
        levelName: 'Easy',
        coverEmoji: '🦁',
        text: 'The big lion sat in the sun. He was hot. He went to the river to drink water. The water was cool and nice.',
        wordCount: 24,
    },
    {
        id: 'red-ball',
        title: 'The Red Ball',
        level: 1,
        levelName: 'Easy',
        coverEmoji: '🔴',
        text: 'I have a red ball. It is big and round. I like to kick it. My dog likes to run after it.',
        wordCount: 22,
    },
    {
        id: 'my-cat',
        title: 'My Cat Mimi',
        level: 1,
        levelName: 'Easy',
        coverEmoji: '🐱',
        text: 'My cat is Mimi. She is soft and white. She likes to sleep on my bed. I love my cat.',
        wordCount: 20,
    },

    // ============================================================
    // LEVEL 2 - MEDIUM (30-50 words)
    // ============================================================
    {
        id: 'market-day',
        title: 'Market Day',
        level: 2,
        levelName: 'Medium',
        coverEmoji: '🍎',
        text: 'Today is market day. Gogo takes me to buy fruit. We see red apples and yellow bananas. The oranges smell sweet. I help Gogo carry the bags home. She gives me an apple to eat. It is so good!',
        wordCount: 42,
    },
    {
        id: 'rain-dance',
        title: 'The Rain Dance',
        level: 2,
        levelName: 'Medium',
        coverEmoji: '🌧️',
        text: 'The sky is dark with clouds. Soon the rain will come. We run outside to feel the drops on our faces. We dance and laugh in the rain. Mama calls us inside for warm tea. What a fun day!',
        wordCount: 41,
    },
    {
        id: 'soccer-game',
        title: 'The Big Game',
        level: 2,
        levelName: 'Medium',
        coverEmoji: '⚽',
        text: 'Today is the big soccer game. My team wears green. We run fast and kick the ball. I score a goal! My friends cheer for me. After the game, we drink cold water. We all feel happy.',
        wordCount: 40,
    },
    {
        id: 'bird-nest',
        title: 'The Bird Nest',
        level: 2,
        levelName: 'Medium',
        coverEmoji: '🐦',
        text: 'I see a bird in the tree. She is making a nest with sticks and grass. Soon there will be eggs in the nest. I will wait and watch. One day I will see baby birds!',
        wordCount: 38,
    },

    // ============================================================
    // LEVEL 3 - HARD (50-80 words)
    // ============================================================
    {
        id: 'elephant-memory',
        title: 'The Elephant Who Never Forgot',
        level: 3,
        levelName: 'Hard',
        coverEmoji: '🐘',
        text: 'In the heart of Africa, there lived a wise old elephant named Themba. Themba remembered every river and every tree in the land. When the young elephants got lost, they would ask Themba for help. He always knew the way home. The other animals said that Themba had the best memory in all of Africa.',
        wordCount: 58,
    },
    {
        id: 'rainbow-bridge',
        title: 'The Rainbow Bridge',
        level: 3,
        levelName: 'Hard',
        coverEmoji: '🌈',
        text: 'After the storm, a beautiful rainbow appeared in the sky. Little Sipho wondered where it ended. His grandmother told him a story about a magical bridge made of colors. She said that if you believe in magic, you can walk across the rainbow to a land of dreams. Sipho closed his eyes and imagined walking on the rainbow.',
        wordCount: 62,
    },
    {
        id: 'night-stars',
        title: 'Counting the Stars',
        level: 3,
        levelName: 'Hard',
        coverEmoji: '⭐',
        text: 'Every night, Nomvula sits outside with her grandfather. They look up at the dark sky full of bright stars. Grandfather knows the names of many stars. He teaches Nomvula about the Southern Cross and how it helps travelers find their way. Nomvula dreams of one day flying up to touch the stars. Grandfather smiles and says anything is possible.',
        wordCount: 64,
    },
];

// Helper functions
export function getStoriesByLevel(level: 1 | 2 | 3): Story[] {
    return STORIES.filter(story => story.level === level);
}

export function getStoryById(id: string): Story | undefined {
    return STORIES.find(story => story.id === id);
}

export const LEVEL_INFO = {
    1: { name: 'Easy', emoji: '🌱', color: '#10B981' },
    2: { name: 'Medium', emoji: '🌿', color: '#F59E0B' },
    3: { name: 'Hard', emoji: '🌳', color: '#EF4444' },
};
