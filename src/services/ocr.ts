/**
 * OCR Service using Google Cloud Vision API
 * ============================================================
 * Extracts text from book page images
 */

import * as FileSystem from 'expo-file-system';
import { IBM_CONFIG } from '../config/ibm-config';

// Google Cloud Vision API key (you can replace with your own)
const GOOGLE_VISION_API_KEY = 'AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'; // TODO: Replace with actual key

/**
 * Extract text from an image using Google Cloud Vision OCR
 */
export async function extractText(imageUri: string): Promise<string> {
    try {
        // Read image as base64
        const base64Image = await FileSystem.readAsStringAsync(imageUri, {
            encoding: 'base64',
        });

        // Call Google Cloud Vision API
        const response = await fetch(
            `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requests: [
                        {
                            image: {
                                content: base64Image,
                            },
                            features: [
                                {
                                    type: 'TEXT_DETECTION',
                                    maxResults: 1,
                                },
                            ],
                        },
                    ],
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Vision API error: ${response.status}`);
        }

        const data = await response.json();
        const textAnnotations = data.responses?.[0]?.textAnnotations;

        if (textAnnotations && textAnnotations.length > 0) {
            // First annotation contains the full text
            const fullText = textAnnotations[0].description;
            console.log('📖 OCR extracted:', fullText.substring(0, 100) + '...');
            return fullText;
        }

        throw new Error('No text found in image');

    } catch (error) {
        console.error('❌ OCR error:', error);
        // Return empty string on failure so app can handle gracefully
        return '';
    }
}

/**
 * Alternative: Use free OCR.space API (no API key required for limited use)
 */
export async function extractTextFree(imageUri: string): Promise<string> {
    try {
        // Read image as base64
        const base64Image = await FileSystem.readAsStringAsync(imageUri, {
            encoding: 'base64',
        });

        // Create form data
        const formData = new FormData();
        formData.append('base64Image', `data:image/jpeg;base64,${base64Image}`);
        formData.append('language', 'eng');
        formData.append('isOverlayRequired', 'false');

        // Call OCR.space free API
        const response = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            headers: {
                'apikey': 'helloworld', // Free tier API key
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`OCR.space error: ${response.status}`);
        }

        const data = await response.json();

        if (data.ParsedResults && data.ParsedResults.length > 0) {
            const text = data.ParsedResults[0].ParsedText;
            console.log('📖 OCR extracted:', text.substring(0, 100) + '...');
            return text;
        }

        throw new Error('No text found');

    } catch (error) {
        console.error('❌ OCR error:', error);
        return '';
    }
}
