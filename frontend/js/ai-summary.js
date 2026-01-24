/**
 * BrightAI Page Summarizer
 * Frontend component to request page summaries from the backend
 */

'use strict';

class BrightAISummarizer {
    constructor(options = {}) {
        this.config = {
            apiEndpoint: '/api/ai/summary',
            buttonText: 'تلخيص الصفحة',
            ...options
        };

        this.isLoading = false;
        this.init();
    }

    init() {
        this.createButton();
        this.attachEvents();
    }

    createButton() {
        const btn = document.createElement('button');
        btn.id = 'ai-summarize-btn';
        btn.className = 'ai-summary-btn glass-button';
        btn.innerHTML = `<i class="fas fa-magic"></i> ${this.config.buttonText}`;
        btn.setAttribute('aria-label', 'استخدم الذكاء الاصطناعي لتلخيص محتوى هذه الصفحة');

        // Add basic styles if not present in CSS
        btn.style.position = 'fixed';
        btn.style.bottom = '100px';
        btn.style.left = '20px';
        btn.style.zIndex = '900';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.gap = '8px';

        document.body.appendChild(btn);
        this.button = btn;
    }

    attachEvents() {
        this.button.addEventListener('click', () => this.generateSummary());
    }

    async generateSummary() {
        if (this.isLoading) return;

        this.setLoading(true);

        try {
            // Get main content text
            const mainContent = document.querySelector('main')?.innerText || document.body.innerText;

            const response = await fetch(this.config.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: mainContent })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Failed to summarize');

            this.showModal(data.summary);

        } catch (error) {
            console.error('Summary error:', error);
            alert('عذراً، حدث خطأ أثناء التلخيص.');
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(loading) {
        this.isLoading = loading;
        this.button.innerHTML = loading ?
            '<i class="fas fa-spinner fa-spin"></i> جاري التلخيص...' :
            `<i class="fas fa-magic"></i> ${this.config.buttonText}`;
        this.button.disabled = loading;
    }

    showModal(summaryHTML) {
        // Simple modal implementation for the summary
        // In production, reuse existing Modal component from components.css if available
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-header">
                <h2>ملخص الصفحة (AI)</h2>
                <button class="modal-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                ${summaryHTML.replace(/\n/g, '<br>')}
            </div>
        `;

        // Create backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop active';

        document.body.appendChild(backdrop);
        document.body.appendChild(modal);

        const close = () => {
            modal.remove();
            backdrop.remove();
        };

        modal.querySelector('.modal-close').addEventListener('click', close);
        backdrop.addEventListener('click', close);
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    // Only show on content-heavy pages (basic heuristic)
    if (document.body.innerText.length > 1000) {
        new BrightAISummarizer();
    }
});
