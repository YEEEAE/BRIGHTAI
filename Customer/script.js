class CustomerServiceChat {
    constructor() {
        this.isOpen = false;
        this.isTextMode = true;
        this.isRecording = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.apiKey = 'YOUR_GEMINI_API_KEY'; // ضع مفتاح API الخاص بك هنا
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeSpeechRecognition();
        this.setWelcomeTime();
    }

    initializeElements() {
        this.chatWidget = document.getElementById('chatWidget');
        this.chatPopup = document.getElementById('chatPopup');
        this.closeBtn = document.getElementById('closeChat');
        this.textModeBtn = document.getElementById('textMode');
        this.voiceModeBtn = document.getElementById('voiceMode');
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.textInput = document.getElementById('textInput');
        this.voiceControls = document.getElementById('voiceControls');
        this.recordBtn = document.getElementById('recordBtn');
        this.voiceStatus = document.getElementById('voiceStatus');
        this.typingIndicator = document.getElementById('typingIndicator');
    }

    setupEventListeners() {
        this.chatWidget.addEventListener('click', () => this.toggleChat());
        this.closeBtn.addEventListener('click', () => this.closeChat());
        this.textModeBtn.addEventListener('click', () => this.switchToTextMode());
        this.voiceModeBtn.addEventListener('click', () => this.switchToVoiceMode());
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        this.recordBtn.addEventListener('click', () => this.toggleRecording());
    }

    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'ar-SA';
            this.recognition.continuous = false;
            this.recognition.interimResults = false;

            this.recognition.onstart = () => {
                this.voiceStatus.textContent = 'أستمع إليك...';
                this.recordBtn.classList.add('recording');
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.handleVoiceMessage(transcript);
            };

            this.recognition.onerror = () => {
                this.voiceStatus.textContent = 'حدث خطأ، حاول مرة أخرى';
                this.resetRecording();
            };

            this.recognition.onend = () => {
                this.resetRecording();
            };
        }
    }

    setWelcomeTime() {
        const now = new Date();
        document.getElementById('welcomeTime').textContent = now.toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    openChat() {
        this.chatPopup.style.display = 'flex';
        this.isOpen = true;
        this.chatWidget.innerHTML = '<i class="fas fa-times"></i>';
        this.scrollToBottom();
    }

    closeChat() {
        this.chatPopup.style.display = 'none';
        this.isOpen = false;
        this.chatWidget.innerHTML = '<i class="fas fa-comments"></i>';
    }

    switchToTextMode() {
        this.isTextMode = true;
        this.textModeBtn.classList.add('active');
        this.voiceModeBtn.classList.remove('active');
        this.textInput.style.display = 'block';
        this.voiceControls.classList.remove('active');
        this.messageInput.focus();
    }

    switchToVoiceMode() {
        this.isTextMode = false;
        this.voiceModeBtn.classList.add('active');
        this.textModeBtn.classList.remove('active');
        this.textInput.style.display = 'none';
        this.voiceControls.classList.add('active');
        this.voiceStatus.textContent = 'اضغط للتحدث';
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.showTypingIndicator();

        try {
            const response = await this.callGeminiAPI(message);
            this.hideTypingIndicator();
            this.addMessage(response, 'bot');
            
            if (!this.isTextMode) {
                this.speakText(response);
            }
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.', 'bot');
        }
    }

    async handleVoiceMessage(transcript) {
        this.addMessage(transcript, 'user');
        this.showTypingIndicator();

        try {
            const response = await this.callGeminiAPI(transcript);
            this.hideTypingIndicator();
            this.addMessage(response, 'bot');
            this.speakText(response);
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.', 'bot');
        }
    }

    async callGeminiAPI(message) {
        // هنا يتم استدعاء Gemini API
        // ملاحظة: ستحتاج إلى إعداد خادم وسيط أو استخدام Firebase Functions
        // لتجنب مشاكل CORS وحماية مفتاح API
        
        const prompt = `أنت مساعد خدمة عملاء ذكي ومفيد. أجب على السؤال التالي بطريقة ودية ومهنية: ${message}`;
        
        try {
            // مثال لاستدعاء API (ستحتاج لتعديل هذا حسب إعدادك)
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': this.apiKey
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error('API call failed');
            }

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            return this.getFallbackResponse(message);
        }
    }

    getFallbackResponse(message) {
        const responses = [
            'شكراً لتواصلك معنا. سيقوم أحد ممثلي خدمة العملاء بالرد عليك قريباً.',
            'نقدر استفسارك. يمكنك التواصل معنا على الرقم: 123-456-7890',
            'أعتذر، لم أتمكن من فهم طلبك بشكل كامل. هل يمكنك إعادة صياغته؟',
            'نحن هنا لمساعدتك! يرجى تقديم المزيد من التفاصيل حول استفسارك.'
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const time = new Date().toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageDiv.innerHTML = `
            <div class="message-content">
                ${text}
                <div class="message-time">${time}</div>
            </div>
        `;

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        this.typingIndicator.classList.add('show');
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.typingIndicator.classList.remove('show');
    }

    toggleRecording() {
        if (!this.recognition) {
            this.voiceStatus.textContent = 'المتصفح لا يدعم التعرف على الصوت';
            return;
        }

        if (this.isRecording) {
            this.recognition.stop();
        } else {
            this.recognition.start();
            this.isRecording = true;
        }
    }

    resetRecording() {
        this.isRecording = false;
        this.recordBtn.classList.remove('recording');
        this.voiceStatus.textContent = 'اضغط للتحدث';
    }

    speakText(text) {
        if (this.synthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ar-SA';
            utterance.rate = 0.9;
            utterance.pitch = 1;
            this.synthesis.speak(utterance);
        }
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }
}

// تشغيل التطبيق
document.addEventListener('DOMContentLoaded', () => {
    new CustomerServiceChat();
});