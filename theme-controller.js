/**
 * ThemeController - Manages light/dark theme switching for BrightAI website
 * Version: 1.0.0
 * 
 * Requirements:
 * - 7.1: Persist theme preference in localStorage
 * - 7.2: Apply theme via data-theme attribute on document element
 * - 7.3: Switch between light and dark on toggle click
 * - 7.4: Load saved preference on page load
 */
'use strict';

class ThemeController {
    /**
     * Creates a new ThemeController instance
     * @param {Object} options - Configuration options
     * @param {string} options.storageKey - localStorage key for theme preference
     * @param {string} options.defaultTheme - Default theme if none saved ('light' or 'dark')
     */
    constructor(options = {}) {
        this.storageKey = options.storageKey || 'brightai-theme';
        this.defaultTheme = options.defaultTheme || 'dark';
        this.currentTheme = this.defaultTheme;
        this.toggleButton = null;
        
        // Initialize on construction
        this.init();
    }

    /**
     * Initializes the theme controller
     * Loads saved theme from localStorage and applies it
     * Requirements: 7.1, 7.4
     */
    init() {
        // Load saved theme from localStorage
        this.loadSavedTheme();
        
        // Apply the theme to the document
        this.applyTheme(this.currentTheme);
        
        // Set up toggle button if it exists
        this.setupToggleButton();
        
        console.log('[ThemeController] Initialized with theme:', this.currentTheme);
    }

    /**
     * Loads the saved theme preference from localStorage
     * Requirements: 7.1, 7.4
     * @returns {string} The loaded theme ('light' or 'dark')
     */
    loadSavedTheme() {
        try {
            const savedTheme = localStorage.getItem(this.storageKey);
            if (savedTheme === 'light' || savedTheme === 'dark') {
                this.currentTheme = savedTheme;
            } else {
                // Check system preference if no saved theme
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
                    this.currentTheme = 'light';
                } else {
                    this.currentTheme = this.defaultTheme;
                }
            }
        } catch (error) {
            console.warn('[ThemeController] localStorage not available:', error);
            this.currentTheme = this.defaultTheme;
        }
        return this.currentTheme;
    }

    /**
     * Applies the specified theme to the document
     * Requirements: 7.2
     * @param {string} theme - The theme to apply ('light' or 'dark')
     */
    applyTheme(theme) {
        if (theme !== 'light' && theme !== 'dark') {
            console.warn('[ThemeController] Invalid theme:', theme);
            return;
        }
        
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update toggle button icon if it exists
        this.updateToggleIcon();
        
        // Dispatch custom event for other components to react
        window.dispatchEvent(new CustomEvent('themechange', { 
            detail: { theme: this.currentTheme } 
        }));
    }

    /**
     * Saves the current theme preference to localStorage
     * Requirements: 7.1
     */
    saveTheme() {
        try {
            localStorage.setItem(this.storageKey, this.currentTheme);
        } catch (error) {
            console.warn('[ThemeController] Could not save theme to localStorage:', error);
        }
    }

    /**
     * Toggles between light and dark themes
     * Requirements: 7.2, 7.3
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        this.saveTheme();
        
        // Track theme change for analytics
        if (window.dataLayer) {
            window.dataLayer.push({
                event: 'theme_change',
                theme_selected: newTheme
            });
        }
        
        console.log('[ThemeController] Theme toggled to:', newTheme);
    }

    /**
     * Sets up the toggle button event listener
     * Requirements: 7.3
     */
    setupToggleButton() {
        this.toggleButton = document.getElementById('theme-toggle-btn');
        
        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', () => this.toggleTheme());
            this.updateToggleIcon();
        }
    }

    /**
     * Updates the toggle button icon based on current theme
     */
    updateToggleIcon() {
        if (!this.toggleButton) return;
        
        const icon = this.toggleButton.querySelector('i');
        if (icon) {
            // Show sun icon in dark mode (to switch to light)
            // Show moon icon in light mode (to switch to dark)
            if (this.currentTheme === 'dark') {
                icon.className = 'fas fa-sun';
                this.toggleButton.setAttribute('aria-label', 'تبديل إلى الوضع النهاري');
            } else {
                icon.className = 'fas fa-moon';
                this.toggleButton.setAttribute('aria-label', 'تبديل إلى الوضع الليلي');
            }
        }
    }

    /**
     * Gets the current theme
     * @returns {string} Current theme ('light' or 'dark')
     */
    getTheme() {
        return this.currentTheme;
    }

    /**
     * Sets a specific theme
     * @param {string} theme - Theme to set ('light' or 'dark')
     */
    setTheme(theme) {
        this.applyTheme(theme);
        this.saveTheme();
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ThemeController };
}

// Auto-initialize when DOM is ready
let themeController = null;

document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if not already done
    if (!themeController) {
        themeController = new ThemeController();
    }
});

// Make available globally
window.ThemeController = ThemeController;
window.themeController = null;

// Initialize early if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeController = new ThemeController();
    });
} else {
    window.themeController = new ThemeController();
}
