/**
 * Groq Integration - Frontend Implementation (Client-Side)
 * Target File: frontend/js/groq-client.js
 * 
 * NOTE: For production, you MUST verify the API Key on a backend/proxy.
 * exposure of API keys in client-side code is risky. 
 * This snippet assumes a backend proxy OR a secured env for the demo.
 */

class GroqStreamManager {
    constructor(config) {
        this.apiKey = config.apiKey; // Load this securely!
        this.sessionHistory = [];
    }

    /**
     * Connects to Groq API using fetch stream
     * @param {string} prompt - The user input or data context
     * @param {function} onChunk - Callback for each token received
     * @param {function} onComplete - Callback when stream finishes
     */
    async streamResponse(prompt, onChunk, onComplete) {
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: [
                        { role: "system", content: "أنت مساعد ذكي سعودي. أجب باختصار واحترافية." },
                        { role: "user", content: prompt }
                    ],
                    model: "llama3-70b-8192",
                    stream: true,
                    temperature: 0.5,
                    max_tokens: 1024
                })
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                // Parse SSE format (data: {...})
                const lines = buffer.split("\n");
                buffer = lines.pop(); // Keep partial line

                for (const line of lines) {
                    const message = line.replace(/^data: /, "").trim();
                    if (message === "[DONE]") {
                        if (onComplete) onComplete();
                        return;
                    }
                    if (message) {
                        try {
                            const parsed = JSON.parse(message);
                            const content = parsed.choices[0].delta.content;
                            if (content) onChunk(content);
                        } catch (e) {
                            // Ignore parse errors for partial chunks
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Groq Stream Error:", error);
            onChunk("\n[حدث خطأ في الاتصال، يرجى المحاولة لاحقاً]");
        }
    }
}

// --- Implementation for /try (The Demo Page) ---

function initTryPageDemo() {
    const fileInput = document.getElementById('file-input');
    const terminalOutput = document.getElementById('ai-insights-list'); // The insights list in dashboard

    if (!fileInput || !terminalOutput) return;

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 1. Show Loading UI
        document.getElementById('upload-section').classList.add('hidden');
        document.getElementById('loading-overlay').classList.remove('hidden');

        // Simulate file reading/processing delay
        setTimeout(() => {
            document.getElementById('loading-overlay').classList.add('hidden');
            document.getElementById('dashboard-section').classList.remove('hidden');

            // 2. Start Streaming Mock Analysis (or Real Groq)
            startStreamingAnalysis(file.name);
        }, 2000);
    });
}

function startStreamingAnalysis(filename) {
    const insightsContainer = document.getElementById('ai-insights-list');
    insightsContainer.innerHTML = ''; // Clear previous

    const groq = new GroqStreamManager({ apiKey: "YOUR_SECURE_KEY_OR_PROXY" });

    const prompt = `لقد قمت برفع ملف اسمه ${filename}. هذا ملف بيانات متوقع أن يحتوي على أرقام مبيعات أو بيانات عملاء. 
    قم بتوليد 3 رؤى تحليلية (Insights) افتراضية ومثيرة للاهتمام باللهجة السعودية، كأنك قمت بقراءة الملف فعلاً.
    اجعلها تبدو حقيقية ومبهرة.`;

    // Create a list item for the stream
    const li = document.createElement('li');
    li.className = "flex gap-3 text-gray-300";
    li.innerHTML = `<i class="fa-solid fa-bolt text-yellow-400 mt-1"></i><div class="content"></div>`;
    insightsContainer.appendChild(li);
    const contentDiv = li.querySelector('.content');

    groq.streamResponse(prompt, (token) => {
        contentDiv.innerHTML += token.replace(/\n/g, "<br>");
        // Auto scroll to bottom
        const scrollContainer = insightsContainer.parentElement;
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initTryPageDemo);
