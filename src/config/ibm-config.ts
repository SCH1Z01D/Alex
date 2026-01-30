/**
 * IBM Watson & Granite AI Configuration for Alex Mobile
 * ============================================================
 */

export const IBM_CONFIG = {
    // Watson Speech-to-Text
    speechToText: {
        apiKey: 'Wukx6pl6ZsTFkE8agnha4dOj_zT4XvenzlpMckeQnvxu',
        url: 'https://api.us-south.speech-to-text.watson.cloud.ibm.com',
        model: 'en-US_BroadbandModel',
    },

    // Watson Text-to-Speech
    textToSpeech: {
        apiKey: 'iuqrUSC8fq5nrOYixhrvG6TBLSiddy4ayKoao7EW00Jt',
        url: 'https://api.us-south.text-to-speech.watson.cloud.ibm.com',
        voice: 'en-US_AllisonV3Voice',
    },

    // watsonx.ai Granite
    granite: {
        apiKey: 'ZQvFYjZY6aQxB5mrzHmyU8xmbBup3Vhz8m8Xjzn0sOSk',
        url: 'https://us-south.ml.cloud.ibm.com',
        projectId: '54080552-ad8a-455b-9445-25c480916902',
        modelId: 'ibm/granite-3-8b-instruct',
        parameters: {
            max_new_tokens: 300,
            min_new_tokens: 10,
            temperature: 0.7,
            top_p: 0.9,
            top_k: 50,
            repetition_penalty: 1.1,
        },
    },

    // App settings
    app: {
        silenceThresholdSeconds: 5,
        autoHelpEnabled: true,
        celebrationThreshold: 10,
        debugMode: true,
    },
};
