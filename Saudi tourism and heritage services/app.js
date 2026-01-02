const API_KEY = 'GEMINI_KEY_REDACTED'; // قم بتغيير هذا بمفتاح API الخاص بك

class ChatBot {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.userInput = document.getElementById('userInput');
        this.sendButton = document.getElementById('sendButton');
        
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.initialize();
    }

    initialize() {
        const welcomeMessage = `مرحباً بك في المرشد السياحي السعودي الذكي! 🌟
يسعدني مساعدتك في:
• استكشاف الوجهات السياحية في المملكة
• معلومات عن المواقع التراثية والتاريخية
• التعرف على الفعاليات والمواسم السياحية
• اقتراح مسارات سياحية
• معلومات عن العادات والتقاليد السعودية

كيف يمكنني مساعدتك اليوم؟`;
        
        this.addMessage(welcomeMessage, 'bot');
    }

    async sendMessage() {
        const message = this.userInput.value.trim();
        if (!message) return;

        // عرض رسالة المستخدم
        this.addMessage(message, 'user');
        this.userInput.value = '';

        try {
            const response = await this.getGeminiResponse(message);
            this.addMessage(response, 'bot');
        } catch (error) {
            console.error('Error:', error);
            this.addMessage('عذراً، حدث خطأ ما. الرجاء المحاولة مرة أخرى.', 'bot');
        }
    }

    async getGeminiResponse(message) {
        const context = `أنت مرشد سياحي اسمك Bright AI
         متخصص في السياحة السعودية والتراث الوطني. 
        قدم معلومات دقيقة ومحدثة عن السياحة في المملكة العربية السعودية.
        اجعل إجاباتك مختصرة ومفيدة وباللغة العربية.
        ركز على الوجهات السياحية والتراثية والثقافية في المملكة.`;

        const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
        
        const response = await fetch(`${url}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${context}\n\nسؤال المستخدم: ${message}`
                    }]
                }]
            })
        });

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        messageDiv.textContent = text;
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
}

// تهيئة البوت عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    new ChatBot();
});
