/**
 * BrightAI UI Utilities Module
 * ========================================
 * Collections of UI components (Cursor, Toast, Loader)
 * 
 * @version 1.0.0
 */

'use strict';

// ==========================================
// Custom Cursor
// ==========================================
class CustomCursor {
    constructor() {
        this.cursor = null;
        this.cursorDot = null;
        this.init();
    }

    init() {
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;
        this.createElements();
        this.attachEvents();
    }

    createElements() {
        this.cursor = document.createElement('div');
        this.cursor.className = 'custom-cursor';
        this.cursorDot = document.createElement('div');
        this.cursorDot.className = 'custom-cursor-dot';
        document.body.appendChild(this.cursor);
        document.body.appendChild(this.cursorDot);
    }

    attachEvents() {
        document.addEventListener('mousemove', (e) => this.move(e));
        document.querySelectorAll('a, button, input, textarea, .clickable').forEach(el => {
            el.addEventListener('mouseenter', () => this.cursor?.classList.add('hover'));
            el.addEventListener('mouseleave', () => this.cursor?.classList.remove('hover'));
        });
    }

    move(e) {
        requestAnimationFrame(() => {
            if (this.cursor) {
                this.cursor.style.left = `${e.clientX}px`;
                this.cursor.style.top = `${e.clientY}px`;
            }
            if (this.cursorDot) {
                this.cursorDot.style.left = `${e.clientX}px`;
                this.cursorDot.style.top = `${e.clientY}px`;
            }
        });
    }
}

// ==========================================
// Toast Notifications
// ==========================================
class Toast {
    static container = null;

    static init() {
        if (!Toast.container) {
            Toast.container = document.createElement('div');
            Toast.container.className = 'toast-container';
            document.body.appendChild(Toast.container);
        }
    }

    static show(message, type = 'info', duration = 3000) {
        Toast.init();
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const iconMap = {
            info: 'lucide:info',
            success: 'lucide:check-circle',
            warning: 'lucide:alert-triangle',
            error: 'lucide:x-circle'
        };

        toast.innerHTML = `
            <iconify-icon icon="${iconMap[type] || iconMap.info}" width="20"></iconify-icon>
            <span class="toast-message">${message}</span>
            <button class="toast-close"><iconify-icon icon="lucide:x" width="16"></iconify-icon></button>
        `;

        toast.querySelector('.toast-close')?.addEventListener('click', () => Toast.hide(toast));
        Toast.container.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('toast-show'));
        if (duration > 0) setTimeout(() => Toast.hide(toast), duration);
        return toast;
    }

    static hide(toast) {
        if (!toast) return;
        toast.classList.remove('toast-show');
        toast.classList.add('toast-hide');
        toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }
}

// ==========================================
// Loader
// ==========================================
class Loader {
    constructor(options = {}) {
        this.container = options.container || document.body;
        this.overlayElement = null;
        this.isVisible = false;
        this.createElements();
    }

    createElements() {
        this.overlayElement = document.createElement('div');
        this.overlayElement.className = 'loader-overlay';
        this.overlayElement.innerHTML = `
            <div class="loader">
                <div class="loader-spinner">
                    <div class="loader-ring"></div><div class="loader-ring"></div><div class="loader-ring"></div>
                </div>
                <span class="loader-text">جارٍ التحميل...</span>
            </div>
        `;
    }

    show(message = 'جارٍ التحميل...') {
        if (this.isVisible) return;
        this.overlayElement.querySelector('.loader-text').textContent = message;
        this.container.appendChild(this.overlayElement);
        requestAnimationFrame(() => this.overlayElement.classList.add('loader-visible'));
        this.isVisible = true;
    }

    hide() {
        if (!this.isVisible) return;
        this.overlayElement.classList.remove('loader-visible');
        this.overlayElement.addEventListener('transitionend', () => {
            if (!this.isVisible) this.overlayElement.remove();
        }, { once: true });
        this.isVisible = false;
    }
}

// Global Exports
const BrightUI = {
    Cursor: new CustomCursor(),
    Toast: Toast,
    Loader: new Loader()
};

window.BrightUI = BrightUI;
const { showToast = Toast.show, showLoader = (msg) => BrightUI.Loader.show(msg), hideLoader = () => BrightUI.Loader.hide() } = {};
