/**
 * BrightAI Urgency and Scarcity Elements
 * Configurable countdown timer, scarcity indicators, and live notifications
 * 
 * Version: 1.0.0
 * Requirements: 20.1, 20.2, 20.3, 20.4, 20.5
 */

'use strict';

/**
 * Configuration for urgency elements
 * All elements can be enabled/disabled via this config
 */
const UrgencyConfig = {
    // Countdown Timer Configuration
    countdown: {
        enabled: true,
        // Target date for countdown (set to 7 days from now by default)
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        // Custom target date can be set as ISO string: '2026-02-01T00:00:00'
        customTargetDate: null,
        // Offer name in Arabic
        offerName: 'عرض خاص محدود',
        // Show in hero section
        showInHero: true,
        // Container selector (if not in hero)
        containerSelector: null
    },
    
    // Scarcity Indicator Configuration
    scarcity: {
        enabled: true,
        totalSpots: 20,
        remainingSpots: 7,
        // Message template (X will be replaced with remaining count)
        messageTemplate: 'متبقي X مقاعد فقط',
        // Show warning when spots are low
        lowSpotsThreshold: 5,
        // Container selector
        containerSelector: null
    },
    
    // Live Notification Configuration
    notifications: {
        enabled: true,
        // Interval between notifications (ms)
        interval: 8000,
        // Duration each notification is shown (ms)
        displayDuration: 5000,
        // Messages to rotate through
        messages: [
            'أحمد من الرياض طلب استشارة مجانية قبل 3 دقائق',
            'سارة من جدة اشتركت في الباقة الاحترافية',
            'محمد من الدمام بدأ تجربة مجانية',
            'فاطمة من مكة طلبت عرض سعر مخصص',
            'خالد من المدينة حجز موعد استشارة'
        ],
        // Position: 'bottom-left' for RTL (appears on left in RTL)
        position: 'bottom-left'
    }
};

/**
 * Countdown Timer Component
 * Displays days, hours, minutes, seconds with real-time updates
 * Requirements: 20.1, 20.4, 20.5
 */
class CountdownTimer {
    constructor(config = {}) {
        this.config = { ...UrgencyConfig.countdown, ...config };
        this.container = null;
        this.intervalId = null;
        this.elements = {};
        
        // Use custom target date if provided
        if (this.config.customTargetDate) {
            this.targetDate = new Date(this.config.customTargetDate);
        } else {
            this.targetDate = this.config.targetDate;
        }
    }
    
    /**
     * Initialize the countdown timer
     */
    init() {
        if (!this.config.enabled) return;
        
        this.createWidget();
        this.start();
    }
    
    /**
     * Create the countdown widget HTML
     */
    createWidget() {
        this.container = document.createElement('div');
        this.container.className = 'urgency-countdown glass';
        this.container.setAttribute('role', 'timer');
        this.container.setAttribute('aria-label', 'عداد تنازلي للعرض المحدود');
        this.container.setAttribute('aria-live', 'polite');
        
        this.container.innerHTML = `
            <div class="countdown-header">
                <i class="fas fa-clock countdown-icon" aria-hidden="true"></i>
                <span class="countdown-title">${this.config.offerName}</span>
            </div>
            <div class="countdown-timer">
                <div class="countdown-unit">
                    <span class="countdown-value" data-unit="days">00</span>
                    <span class="countdown-label">يوم</span>
                </div>
                <span class="countdown-separator">:</span>
                <div class="countdown-unit">
                    <span class="countdown-value" data-unit="hours">00</span>
                    <span class="countdown-label">ساعة</span>
                </div>
                <span class="countdown-separator">:</span>
                <div class="countdown-unit">
                    <span class="countdown-value" data-unit="minutes">00</span>
                    <span class="countdown-label">دقيقة</span>
                </div>
                <span class="countdown-separator">:</span>
                <div class="countdown-unit">
                    <span class="countdown-value" data-unit="seconds">00</span>
                    <span class="countdown-label">ثانية</span>
                </div>
            </div>
        `;
        
        // Store references to value elements
        this.elements.days = this.container.querySelector('[data-unit="days"]');
        this.elements.hours = this.container.querySelector('[data-unit="hours"]');
        this.elements.minutes = this.container.querySelector('[data-unit="minutes"]');
        this.elements.seconds = this.container.querySelector('[data-unit="seconds"]');
        
        // Insert into DOM
        if (this.config.containerSelector) {
            const targetContainer = document.querySelector(this.config.containerSelector);
            if (targetContainer) {
                targetContainer.appendChild(this.container);
            }
        } else if (this.config.showInHero) {
            const heroContent = document.querySelector('.hero-content');
            if (heroContent) {
                // Insert after trust bar or before stats
                const trustBar = heroContent.querySelector('.trust-bar');
                const statsSection = heroContent.querySelector('.stats-section');
                if (trustBar) {
                    trustBar.insertAdjacentElement('afterend', this.container);
                } else if (statsSection) {
                    statsSection.insertAdjacentElement('beforebegin', this.container);
                } else {
                    heroContent.appendChild(this.container);
                }
            }
        }
    }
    
    /**
     * Start the countdown timer
     */
    start() {
        // Initial update
        this.update();
        
        // Update every second
        this.intervalId = setInterval(() => {
            this.update();
        }, 1000);
    }
    
    /**
     * Stop the countdown timer
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    
    /**
     * Update the countdown display
     */
    update() {
        const timeRemaining = this.formatTime(this.targetDate.getTime() - Date.now());
        
        if (timeRemaining.total <= 0) {
            this.stop();
            this.showExpired();
            return;
        }
        
        // Update display with leading zeros
        this.elements.days.textContent = String(timeRemaining.days).padStart(2, '0');
        this.elements.hours.textContent = String(timeRemaining.hours).padStart(2, '0');
        this.elements.minutes.textContent = String(timeRemaining.minutes).padStart(2, '0');
        this.elements.seconds.textContent = String(timeRemaining.seconds).padStart(2, '0');
        
        // Add urgency class when time is running low (less than 1 day)
        if (timeRemaining.days === 0) {
            this.container.classList.add('countdown-urgent');
        }
    }
    
    /**
     * Format milliseconds into days, hours, minutes, seconds
     * @param {number} ms - Milliseconds remaining
     * @returns {Object} Formatted time object
     */
    formatTime(ms) {
        if (ms < 0) ms = 0;
        
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        
        return { total: ms, days, hours, minutes, seconds };
    }
    
    /**
     * Show expired state
     */
    showExpired() {
        this.container.innerHTML = `
            <div class="countdown-expired">
                <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
                <span>انتهى العرض - تواصل معنا للعروض الجديدة</span>
            </div>
        `;
        this.container.classList.add('countdown-expired-state');
    }
    
    /**
     * Set a new target date
     * @param {Date|string} date - New target date
     */
    setTargetDate(date) {
        this.targetDate = new Date(date);
        this.update();
    }
    
    /**
     * Enable/disable the countdown
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.config.enabled = enabled;
        if (enabled && !this.intervalId) {
            this.start();
        } else if (!enabled) {
            this.stop();
        }
        
        if (this.container) {
            this.container.style.display = enabled ? '' : 'none';
        }
    }
    
    /**
     * Destroy the countdown timer
     */
    destroy() {
        this.stop();
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
        this.elements = {};
    }
}

/**
 * Scarcity Indicator Component
 * Displays remaining spots/seats message
 * Requirements: 20.2
 */
class ScarcityIndicator {
    constructor(config = {}) {
        this.config = { ...UrgencyConfig.scarcity, ...config };
        this.container = null;
        this.remainingSpots = this.config.remainingSpots;
    }
    
    /**
     * Initialize the scarcity indicator
     */
    init() {
        if (!this.config.enabled) return;
        
        this.createWidget();
    }
    
    /**
     * Create the scarcity widget HTML
     */
    createWidget() {
        this.container = document.createElement('div');
        this.container.className = 'scarcity-indicator glass';
        this.container.setAttribute('role', 'status');
        this.container.setAttribute('aria-live', 'polite');
        this.container.setAttribute('aria-label', 'مؤشر المقاعد المتبقية');
        
        this.updateDisplay();
        
        // Insert into DOM
        if (this.config.containerSelector) {
            const targetContainer = document.querySelector(this.config.containerSelector);
            if (targetContainer) {
                targetContainer.appendChild(this.container);
            }
        } else {
            // Insert after countdown timer or in hero
            const countdown = document.querySelector('.urgency-countdown');
            if (countdown) {
                countdown.insertAdjacentElement('afterend', this.container);
            } else {
                const heroContent = document.querySelector('.hero-content');
                if (heroContent) {
                    const statsSection = heroContent.querySelector('.stats-section');
                    if (statsSection) {
                        statsSection.insertAdjacentElement('beforebegin', this.container);
                    } else {
                        heroContent.appendChild(this.container);
                    }
                }
            }
        }
    }
    
    /**
     * Update the display
     */
    updateDisplay() {
        const message = this.config.messageTemplate.replace('X', this.remainingSpots);
        const isLow = this.remainingSpots <= this.config.lowSpotsThreshold;
        
        this.container.innerHTML = `
            <div class="scarcity-content ${isLow ? 'scarcity-low' : ''}">
                <i class="fas fa-fire scarcity-icon ${isLow ? 'pulse-glow' : ''}" aria-hidden="true"></i>
                <span class="scarcity-message">${message}</span>
                <div class="scarcity-progress">
                    <div class="scarcity-progress-bar" style="width: ${(this.remainingSpots / this.config.totalSpots) * 100}%"></div>
                </div>
            </div>
        `;
        
        if (isLow) {
            this.container.classList.add('scarcity-urgent');
        } else {
            this.container.classList.remove('scarcity-urgent');
        }
    }
    
    /**
     * Update remaining spots
     * @param {number} remaining - New remaining count
     */
    update(remaining) {
        this.remainingSpots = Math.max(0, remaining);
        this.updateDisplay();
    }
    
    /**
     * Decrement remaining spots by 1
     */
    decrement() {
        this.update(this.remainingSpots - 1);
    }
    
    /**
     * Enable/disable the indicator
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.config.enabled = enabled;
        if (this.container) {
            this.container.style.display = enabled ? '' : 'none';
        }
    }
    
    /**
     * Destroy the scarcity indicator
     */
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
    }
}

/**
 * Live Notification System
 * Displays rotating popup notifications for recent actions
 * Requirements: 20.3
 */
class LiveNotificationSystem {
    constructor(config = {}) {
        this.config = { ...UrgencyConfig.notifications, ...config };
        this.container = null;
        this.currentIndex = 0;
        this.intervalId = null;
        this.isVisible = false;
    }
    
    /**
     * Initialize the notification system
     */
    init() {
        if (!this.config.enabled) return;
        
        this.createContainer();
        this.startRotation();
    }
    
    /**
     * Create the notification container
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.className = `live-notification glass ${this.config.position}`;
        this.container.setAttribute('role', 'alert');
        this.container.setAttribute('aria-live', 'polite');
        this.container.setAttribute('aria-atomic', 'true');
        
        document.body.appendChild(this.container);
    }
    
    /**
     * Show a notification
     * @param {string} message - Message to display
     */
    show(message) {
        if (!this.container || !this.config.enabled) return;
        
        // Generate random time (1-10 minutes ago)
        const minutesAgo = Math.floor(Math.random() * 10) + 1;
        const timeText = minutesAgo === 1 ? 'منذ دقيقة' : `منذ ${minutesAgo} دقائق`;
        
        this.container.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    <i class="fas fa-bell" aria-hidden="true"></i>
                </div>
                <div class="notification-text">
                    <span class="notification-message">${message}</span>
                    <span class="notification-time">${timeText}</span>
                </div>
                <button class="notification-close" aria-label="إغلاق الإشعار" type="button">
                    <i class="fas fa-times" aria-hidden="true"></i>
                </button>
            </div>
        `;
        
        // Add close button handler
        const closeBtn = this.container.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }
        
        // Animate in
        requestAnimationFrame(() => {
            this.container.classList.add('notification-visible');
            this.isVisible = true;
        });
        
        // Auto-hide after display duration
        setTimeout(() => {
            this.hide();
        }, this.config.displayDuration);
    }
    
    /**
     * Hide the current notification
     */
    hide() {
        if (!this.container) return;
        
        this.container.classList.remove('notification-visible');
        this.isVisible = false;
    }
    
    /**
     * Start rotating through notifications
     */
    startRotation() {
        // Show first notification after a short delay
        setTimeout(() => {
            this.showNext();
        }, 3000);
        
        // Set up rotation interval
        this.intervalId = setInterval(() => {
            this.showNext();
        }, this.config.interval);
    }
    
    /**
     * Show the next notification in rotation
     */
    showNext() {
        if (!this.config.enabled || this.config.messages.length === 0) return;
        
        const message = this.config.messages[this.currentIndex];
        this.show(message);
        
        // Move to next message
        this.currentIndex = (this.currentIndex + 1) % this.config.messages.length;
    }
    
    /**
     * Stop the rotation
     */
    stopRotation() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    
    /**
     * Add a new message to the rotation
     * @param {string} message - Message to add
     */
    addMessage(message) {
        this.config.messages.push(message);
    }
    
    /**
     * Enable/disable notifications
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.config.enabled = enabled;
        if (!enabled) {
            this.hide();
            this.stopRotation();
        } else if (!this.intervalId) {
            this.startRotation();
        }
    }
    
    /**
     * Destroy the notification system
     */
    destroy() {
        this.stopRotation();
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
    }
}

/**
 * Urgency Banner - Combines all urgency elements
 * Main controller for urgency and scarcity features
 */
class UrgencyBanner {
    constructor(config = {}) {
        this.config = {
            countdown: { ...UrgencyConfig.countdown, ...config.countdown },
            scarcity: { ...UrgencyConfig.scarcity, ...config.scarcity },
            notifications: { ...UrgencyConfig.notifications, ...config.notifications }
        };
        
        this.countdown = null;
        this.scarcity = null;
        this.notifications = null;
        this.isInitialized = false;
    }
    
    /**
     * Initialize all urgency elements
     */
    init() {
        if (this.isInitialized) return;
        
        // Initialize countdown timer
        if (this.config.countdown.enabled) {
            this.countdown = new CountdownTimer(this.config.countdown);
            this.countdown.init();
        }
        
        // Initialize scarcity indicator
        if (this.config.scarcity.enabled) {
            this.scarcity = new ScarcityIndicator(this.config.scarcity);
            this.scarcity.init();
        }
        
        // Initialize live notifications
        if (this.config.notifications.enabled) {
            this.notifications = new LiveNotificationSystem(this.config.notifications);
            this.notifications.init();
        }
        
        this.isInitialized = true;
        
        // Dispatch initialization event
        window.dispatchEvent(new CustomEvent('urgency:initialized', {
            detail: {
                countdown: this.config.countdown.enabled,
                scarcity: this.config.scarcity.enabled,
                notifications: this.config.notifications.enabled
            }
        }));
    }
    
    /**
     * Get countdown timer instance
     * @returns {CountdownTimer|null}
     */
    getCountdown() {
        return this.countdown;
    }
    
    /**
     * Get scarcity indicator instance
     * @returns {ScarcityIndicator|null}
     */
    getScarcity() {
        return this.scarcity;
    }
    
    /**
     * Get notifications instance
     * @returns {LiveNotificationSystem|null}
     */
    getNotifications() {
        return this.notifications;
    }
    
    /**
     * Enable/disable all urgency elements
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        if (this.countdown) this.countdown.setEnabled(enabled);
        if (this.scarcity) this.scarcity.setEnabled(enabled);
        if (this.notifications) this.notifications.setEnabled(enabled);
    }
    
    /**
     * Destroy all urgency elements
     */
    destroy() {
        if (this.countdown) {
            this.countdown.destroy();
            this.countdown = null;
        }
        if (this.scarcity) {
            this.scarcity.destroy();
            this.scarcity = null;
        }
        if (this.notifications) {
            this.notifications.destroy();
            this.notifications = null;
        }
        this.isInitialized = false;
    }
}

// Export classes and config
window.UrgencyConfig = UrgencyConfig;
window.CountdownTimer = CountdownTimer;
window.ScarcityIndicator = ScarcityIndicator;
window.LiveNotificationSystem = LiveNotificationSystem;
window.UrgencyBanner = UrgencyBanner;

// Auto-initialize when DOM is ready
let urgencyBanner = null;

function initUrgencyElements() {
    if (urgencyBanner) return urgencyBanner;
    
    urgencyBanner = new UrgencyBanner();
    
    // Initialize after a short delay to ensure DOM is ready
    requestAnimationFrame(() => {
        urgencyBanner.init();
    });
    
    return urgencyBanner;
}

// Initialize on DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUrgencyElements);
} else {
    initUrgencyElements();
}

// Make available globally
window.urgencyBanner = urgencyBanner;
window.initUrgencyElements = initUrgencyElements;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        UrgencyConfig,
        CountdownTimer,
        ScarcityIndicator,
        LiveNotificationSystem,
        UrgencyBanner,
        initUrgencyElements
    };
}
