import { BrightAnimations } from '../animations.js';
import { AIParticleSystem } from '../particle-system.js';

class RecruitmentHero {
    constructor() {
        // Initialize the new particle system on the workflow canvas
        this.particleSystem = new AIParticleSystem('workflow-canvas', {
            particleCount: 80,
            connectionDistance: 120,
            particleColor: 'rgba(99, 102, 241, 0.5)', // Indigo-500
            lineColor: 'rgba(99, 102, 241, 0.15)',
            interactive: true
        });
    }
}

class ComparisonSlider {
    constructor() {
        this.container = document.querySelector('.comparison-slider');
        if (!this.container) return;

        this.handle = this.container.querySelector('.slider-handle');
        this.after = this.container.querySelector('.after-side');
        this.isDragging = false;

        this.init();
    }

    init() {
        this.handle.addEventListener('mousedown', () => this.isDragging = true);
        window.addEventListener('mouseup', () => this.isDragging = false);
        window.addEventListener('mousemove', (e) => this.move(e));

        // Touch events
        this.handle.addEventListener('touchstart', () => this.isDragging = true);
        window.addEventListener('touchend', () => this.isDragging = false);
        window.addEventListener('touchmove', (e) => this.move(e.touches[ 0 ]));
    }

    move(e) {
        if (!this.isDragging) return;

        const rect = this.container.getBoundingClientRect();
        let x = e.clientX - rect.left;

        if (x < 0) x = 0;
        if (x > rect.width) x = rect.width;

        const percent = (x / rect.width) * 100;
        this.handle.style.left = `${percent}%`;
        this.after.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
    }
}

class InteractiveFlowchart {
    constructor() {
        this.steps = document.querySelectorAll('.flow-step');
        this.details = document.getElementById('flow-details');
        if (!this.steps.length) return;

        this.init();
    }

    init() {
        this.steps.forEach((step, index) => {
            step.addEventListener('click', () => this.activateStep(index));
        });

        // Auto-play initially
        // setTimeout(() => this.activateStep(1), 2000);
    }

    activateStep(index) {
        this.steps.forEach(s => s.classList.remove('active', 'ring-2', 'ring-indigo-500'));
        this.steps[ index ].classList.add('active', 'ring-2', 'ring-indigo-500');

        // Animate details change
        if (this.details) {
            gsap.to(this.details, {
                opacity: 0,
                y: 20,
                duration: 0.3,
                onComplete: () => {
                    const content = this.steps[ index ].dataset.details;
                    this.details.innerHTML = content || 'تفاصيل الخطوة...';
                    gsap.to(this.details, {
                        opacity: 1,
                        y: 0,
                        duration: 0.3
                    });
                }
            });
        }
    }
}

class RecruitmentDemo {
    constructor() {
        this.chatContainer = document.getElementById('demo-chat');
        if (!this.chatContainer) return;
        this.startDemo();
    }

    async startDemo() {
        const messages = [
            { type: 'bot', text: 'مرحباً! أنا مساعد التوظيف الذكي. كيف يمكنني مساعدتك اليوم؟' },
            { type: 'user', text: 'ابحث عن مطور واجهات أمامية خبرة 3 سنوات.' },
            { type: 'bot', text: 'جاري البحث في قاعدة البيانات...' },
            { type: 'bot', text: 'وجدت 5 مرشحين يطابقون المواصفات بدقة 95%. هل تود استعراض التفاصيل؟' }
        ];

        for (const msg of messages) {
            await this.addMessage(msg);
            await new Promise(r => setTimeout(r, msg.type === 'user' ? 1000 : 2000));
        }
    }

    addMessage(msg) {
        const div = document.createElement('div');
        div.className = `p-3 rounded-lg mb-2 max-w-[80%] ${msg.type === 'user' ? 'bg-indigo-600 mr-auto text-white' : 'bg-slate-700 ml-auto text-slate-200'}`;
        div.textContent = msg.text;
        div.style.opacity = '0';
        div.style.transform = 'translateY(10px)';

        this.chatContainer.appendChild(div);

        return new Promise(resolve => {
            gsap.to(div, {
                opacity: 1,
                y: 0,
                duration: 0.5,
                onComplete: resolve
            });
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new RecruitmentHero();
    new ComparisonSlider();
    new InteractiveFlowchart();
    new RecruitmentDemo();

    // Animate sections
    document.querySelectorAll('section').forEach(section => {
        BrightAnimations.fadeInUp(section);
    });
});
