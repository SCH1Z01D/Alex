/**
 * Granite AI Service for Alex Mobile
 * ============================================================
 * Handles AI-powered responses from IBM watsonx.ai Granite model
 */

import { IBM_CONFIG } from '../config/ibm-config';

// Gogo Wisdom's persona
const GOGO_WISDOM_PERSONA = `You are "Gogo Wisdom," a patient, warm, and encouraging South African reading tutor. You are teaching a child who speaks English as a second language.

PERSONALITY:
- Warm and grandmotherly - you love children
- Patient - you never rush or get frustrated
- Encouraging - you celebrate every small victory
- Playful - you make learning fun

LANGUAGE STYLE:
- Use simple, child-friendly language
- Include South African expressions naturally:
  • "Sharp sharp!" (Great!/Okay!)
  • "Eish!" (Expression of surprise/sympathy)
  • "Hayibo!" (Wow!/No way!)
  • "Ayoba!" (Awesome!/Fantastic!)
  • "My child" (Term of endearment)
- Keep responses SHORT - children have short attention spans
- Maximum 2-3 sentences per response`;

/**
 * Get an IAM access token
 */
async function getAccessToken(): Promise<string> {
    const response = await fetch('https://iam.cloud.ibm.com/identity/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${IBM_CONFIG.granite.apiKey}`,
    });

    if (!response.ok) {
        throw new Error('Failed to get access token');
    }

    const data = await response.json();
    return data.access_token;
}

/**
 * Generate a response from Granite AI
 */
export async function generateResponse(prompt: string): Promise<string> {
    if (!IBM_CONFIG.granite.apiKey || !IBM_CONFIG.granite.projectId) {
        console.warn('⚠️ Granite AI not configured - using fallback');
        return getFallbackResponse(prompt);
    }

    try {
        const accessToken = await getAccessToken();

        const response = await fetch(
            `${IBM_CONFIG.granite.url}/ml/v1/text/generation?version=2024-05-01`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    model_id: IBM_CONFIG.granite.modelId,
                    project_id: IBM_CONFIG.granite.projectId,
                    input: prompt,
                    parameters: IBM_CONFIG.granite.parameters,
                }),
            }
        );

        if (!response.ok) {
            throw new Error('Granite API error');
        }

        const data = await response.json();
        return data.results[0]?.generated_text?.trim() || '';
    } catch (error) {
        console.error('❌ Granite AI error:', error);
        return getFallbackResponse(prompt);
    }
}

/**
 * Generate a correction for a reading mistake
 */
export async function generateCorrection(
    expected: string,
    spoken: string,
    sentence: string
): Promise<string> {
    const prompt = `${GOGO_WISDOM_PERSONA}

CURRENT TEXT: ${sentence}
The child just read: "${spoken}"
The correct word was: "${expected}"

Generate a brief, encouraging response using the Sandwich Method (Praise → Correction → Encouragement).`;

    return generateResponse(prompt);
}

/**
 * Generate an introduction for a story
 */
export async function generateIntroduction(text: string): Promise<string> {
    const prompt = `${GOGO_WISDOM_PERSONA}

A child is about to read this text:
${text}

Generate an EXCITING 1-2 sentence introduction to get them interested in reading!`;

    return generateResponse(prompt);
}

/**
 * Generate encouragement for a streak
 */
export async function generateEncouragement(streak: number): Promise<string> {
    const prompt = `${GOGO_WISDOM_PERSONA}

The child has read ${streak} words correctly in a row! Generate a SHORT (one sentence) encouragement. Be enthusiastic!`;

    return generateResponse(prompt);
}

/**
 * Generate emotional support based on mood
 */
export async function generateEmotionalSupport(
    emotion: 'frustrated' | 'struggling' | 'tired' | 'confident',
    context: { word?: string; wordsRead?: number; streak?: number }
): Promise<string> {
    const fallbacks: Record<string, string[]> = {
        frustrated: [
            "I can see this is tricky. Let's take a deep breath together. 🌬️",
            "Eish, this word is being difficult! But you're doing so well to keep trying, my child.",
            "Even great readers find some words hard. That's perfectly okay!",
        ],
        struggling: [
            "This word is a tricky one! Let me help you with it.",
            "You're working so hard! Want me to sound it out with you?",
            "Almost there! Let's try it together, slowly.",
        ],
        tired: [
            "You've read so many words today! Want to take a little break?",
            "Your brain has been working so hard. How about we rest for a moment?",
            "Sharp sharp! You did great reading. We can continue later if you're tired.",
        ],
        confident: [
            "Ayoba! You're on fire today!",
            "Look at you go! What a star reader you are!",
            "Sharp sharp! Keep that energy going!",
        ],
    };

    const messages = fallbacks[emotion] || fallbacks.struggling;
    return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Fallback responses when AI is unavailable
 */
function getFallbackResponse(prompt: string): string {
    if (prompt.includes('correct word was')) {
        const corrections = [
            "Let's try that word again, my child. You're doing great!",
            "Eish! That's a tricky one. Sound it out slowly with me.",
            "Almost! Let's look at that word together.",
        ];
        return corrections[Math.floor(Math.random() * corrections.length)];
    }

    if (prompt.includes('EXCITING')) {
        return "Hayibo! This looks like an exciting story! Let's read it together!";
    }

    return "Sharp sharp! You're doing wonderfully!";
}
