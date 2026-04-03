const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'GROQ_API_KEY is missing' }) };
    }

    try {
        const { payload } = JSON.parse(event.body || '{}');
        if (!payload || payload.length === 0) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'No critical data provided.' }) };
        }

        const dataStr = JSON.stringify(payload, null, 2);
        const prompt = `Act as a Senior Manufacturing Quality Engineer. Analyze this aggregated critical rejection data (>5% reject rate):

${dataStr}

Write a concise 3-bullet-point Executive Summary. Focus on:
1. Root Cause Analysis — link specific machines to problematic item codes
2. Quantified impact — mention the highest avg reject % figures
3. Actionable recommendations for management

Format your response as exactly 3 bullet points, each starting with a bold label like **Root Cause:**, **Impact:**, **Recommendation:**. Keep each bullet to 2-3 sentences.`;

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama3-70b-8192',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 512,
                temperature: 0.4
            })
        });

        if (!response.ok) throw new Error(`Groq API Error: ${response.status}`);
        const data = await response.json();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ summary: data.choices[0].message.content })
        };
    } catch (error) {
        console.error('Groq Execution Error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};
