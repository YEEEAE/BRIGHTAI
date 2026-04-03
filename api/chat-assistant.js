const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle CORS preflight
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
        const { messages, criticalData } = JSON.parse(event.body || '{}');

        if (!messages || !Array.isArray(messages)) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Messages array is required.' }) };
        }

        const contextStr = `
        أنت مستشار جودة متقدم عبر الذكاء الاصطناعي مهندس بيانات (Senior Manufacturing Quality Engineer AI Agent).
        مهمتك هي الإجابة بمهنية تامة وباللغة العربية الفصحى على استفسارات مدير المصنع فيما يخص الجودة ونسب الرفض (Reject Rates).
        
        بيانات الماكينات التي تواجه مشاكل حديثة (نسبة رفضها أعلى من 5٪): 
        ${JSON.stringify(criticalData || [])}
        
        إرشادات:
        1. اعتمد بشكل كلي على البيانات التي تم تزويدك بها.
        2. استخدم أسلوباً احترافياً وتحدث بصفتك موظفاً كبيراً في قسم الجودة، مع تقديم حلول وتوصيات جذرية.
        3. راعي أن تكون إجاباتك مدعومة بالأرقام وتفصيلية لكن بدون ملل.
        4. إذا سئلت عن شيء غير موجود في البيانات، وضح برقي أن البيانات الحالية تركز على حالات الرفض الحرجة.
        `;

        const systemMessage = { role: 'system', content: contextStr };
        const apiMessages = [systemMessage, ...messages];

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama3-70b-8192',
                messages: apiMessages,
                temperature: 0.3
            })
        });

        if (!response.ok) throw new Error(`Groq API Error: ${response.status}`);
        const data = await response.json();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ content: data.choices[0].message.content })
        };
    } catch (error) {
        console.error('Groq Execution Error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};
