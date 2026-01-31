/**
 * IBM Watson & Granite AI Configuration for Alex Mobile
 * ============================================================
 */

export const IBM_CONFIG = {
    // Watson Speech-to-Text
    speechToText: {
        apiKey: 'aMIyLqvTxMxWNgBVKmIp2MbuTG0aw8wR6_F-BLjrJao_',
        url: 'https://api.us-south.speech-to-text.watson.cloud.ibm.com/instances/4b7d2486-97e6-4d00-ba74-2a24842254c3',
        model: 'en-US_BroadbandModel',
    },

    // Watson Text-to-Speech
    textToSpeech: {
        apiKey: 'op3oWPR78E2Ybwu84S4YT-VfNSACbL7ZTPOGpMZoxnow',
        url: 'https://api.au-syd.text-to-speech.watson.cloud.ibm.com/instances/a58b311e-c393-486f-bca3-1e24a927eb38',
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
