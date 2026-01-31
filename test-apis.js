/**
 * API Test Script for Alex
 * Tests IBM Watson STT, TTS, and Granite AI APIs
 */

const IBM_CONFIG = {
    speechToText: {
        apiKey: 'aMIyLqvTxMxWNgBVKmIp2MbuTG0aw8wR6_F-BLjrJao_',
        url: 'https://api.us-south.speech-to-text.watson.cloud.ibm.com/instances/4b7d2486-97e6-4d00-ba74-2a24842254c3',
        model: 'en-US_BroadbandModel',
    },
    textToSpeech: {
        apiKey: 'op3oWPR78E2Ybwu84S4YT-VfNSACbL7ZTPOGpMZoxnow',
        url: 'https://api.au-syd.text-to-speech.watson.cloud.ibm.com/instances/a58b311e-c393-486f-bca3-1e24a927eb38',
        voice: 'en-US_AllisonV3Voice',
    },
    granite: {
        apiKey: 'ZQvFYjZY6aQxB5mrzHmyU8xmbBup3Vhz8m8Xjzn0sOSk',
        url: 'https://us-south.ml.cloud.ibm.com',
        projectId: '54080552-ad8a-455b-9445-25c480916902',
        modelId: 'ibm/granite-3-8b-instruct',
    },
};

// Test 1: Watson Speech-to-Text API (check if API key is valid)
async function testSpeechToText() {
    console.log('\n📢 TESTING: Watson Speech-to-Text API...');

    try {
        const authHeader = 'Basic ' + Buffer.from('apikey:' + IBM_CONFIG.speechToText.apiKey).toString('base64');

        const response = await fetch(`${IBM_CONFIG.speechToText.url}/v1/models`, {
            method: 'GET',
            headers: {
                'Authorization': authHeader,
            },
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Watson STT API: WORKING');
            console.log(`   Available models: ${data.models?.length || 0}`);
            return { status: 'OK', message: 'API key valid' };
        } else {
            const error = await response.text();
            console.log(`❌ Watson STT API: FAILED (${response.status})`);
            console.log(`   Error: ${error}`);
            return { status: 'FAILED', code: response.status, message: error };
        }
    } catch (error) {
        console.log(`❌ Watson STT API: ERROR`);
        console.log(`   ${error.message}`);
        return { status: 'ERROR', message: error.message };
    }
}

// Test 2: Watson Text-to-Speech API
async function testTextToSpeech() {
    console.log('\n📢 TESTING: Watson Text-to-Speech API...');

    try {
        const authHeader = 'Basic ' + Buffer.from('apikey:' + IBM_CONFIG.textToSpeech.apiKey).toString('base64');

        const response = await fetch(`${IBM_CONFIG.textToSpeech.url}/v1/voices`, {
            method: 'GET',
            headers: {
                'Authorization': authHeader,
            },
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Watson TTS API: WORKING');
            console.log(`   Available voices: ${data.voices?.length || 0}`);
            return { status: 'OK', message: 'API key valid' };
        } else {
            const error = await response.text();
            console.log(`❌ Watson TTS API: FAILED (${response.status})`);
            console.log(`   Error: ${error}`);
            return { status: 'FAILED', code: response.status, message: error };
        }
    } catch (error) {
        console.log(`❌ Watson TTS API: ERROR`);
        console.log(`   ${error.message}`);
        return { status: 'ERROR', message: error.message };
    }
}

// Test 3: IBM IAM Token (for Granite AI)
async function testGraniteToken() {
    console.log('\n📢 TESTING: IBM IAM Token (for Granite AI)...');

    try {
        const response = await fetch('https://iam.cloud.ibm.com/identity/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${IBM_CONFIG.granite.apiKey}`,
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ IBM IAM Token: OBTAINED');
            console.log(`   Token type: ${data.token_type}`);
            console.log(`   Expires in: ${data.expires_in} seconds`);
            return { status: 'OK', token: data.access_token };
        } else {
            const error = await response.text();
            console.log(`❌ IBM IAM Token: FAILED (${response.status})`);
            console.log(`   Error: ${error}`);
            return { status: 'FAILED', code: response.status, message: error };
        }
    } catch (error) {
        console.log(`❌ IBM IAM Token: ERROR`);
        console.log(`   ${error.message}`);
        return { status: 'ERROR', message: error.message };
    }
}

// Test 4: Granite AI Text Generation
async function testGraniteGeneration(accessToken) {
    console.log('\n📢 TESTING: Granite AI Text Generation...');

    if (!accessToken) {
        console.log('⚠️  Skipping - no access token available');
        return { status: 'SKIPPED', message: 'No access token' };
    }

    try {
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
                    input: 'Say hello in 5 words or less.',
                    parameters: {
                        max_new_tokens: 50,
                        temperature: 0.7,
                    },
                }),
            }
        );

        if (response.ok) {
            const data = await response.json();
            const generatedText = data.results?.[0]?.generated_text || '';
            console.log('✅ Granite AI: WORKING');
            console.log(`   Response: "${generatedText.trim()}"`);
            return { status: 'OK', response: generatedText };
        } else {
            const error = await response.text();
            console.log(`❌ Granite AI: FAILED (${response.status})`);
            console.log(`   Error: ${error}`);
            return { status: 'FAILED', code: response.status, message: error };
        }
    } catch (error) {
        console.log(`❌ Granite AI: ERROR`);
        console.log(`   ${error.message}`);
        return { status: 'ERROR', message: error.message };
    }
}

// Run all tests
async function runAllTests() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('           ALEX API DIAGNOSTIC TEST');
    console.log('═══════════════════════════════════════════════════════════════');

    const results = {};

    results.stt = await testSpeechToText();
    results.tts = await testTextToSpeech();
    results.iam = await testGraniteToken();
    results.granite = await testGraniteGeneration(results.iam?.token);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('           SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Watson STT:     ${results.stt.status}`);
    console.log(`Watson TTS:     ${results.tts.status}`);
    console.log(`IBM IAM Token:  ${results.iam.status}`);
    console.log(`Granite AI:     ${results.granite.status}`);
    console.log('═══════════════════════════════════════════════════════════════');

    return results;
}

runAllTests();
