/**
 * BrightAI Smart Search
 * AI-powered search using server gateway for Gemini API
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 23.3
 */

'use strict';

/**
 * BrightAI Smart Search Class
 * Manages the AI-powered search functionality
 */
class BrightAISmartSearch {
  constructor(options = {}) {
    // Configuration
    this.config = {
      apiEndpoint: options.apiEndpoint || '/api/ai/search',
      debounceDelay: options.debounceDelay || 300, // Requirement 5.1: 300ms debounce
      minQueryLength: options.minQueryLength || 3, // Requirement 5.2: minimum 3 characters
      placeholder: options.placeholder || 'ابحث في موقع BrightAI...',
      noResultsMessage: options.noResultsMessage || 'لم يتم العثور على نتائج',
      errorMessage: options.errorMessage || 'حدث خطأ في البحث. يرجى المحاولة مرة أخرى.',
      ...options
    };

    // State
    this.debounceTimer = null;
    this.isLoading = false;
    this.currentQuery = '';
    this.results = [];
    
    // DOM elements
    this.container = null;
    this.inputField = null;
    this.resultsContainer = null;
    this.loadingIndicator = null;

    // Bind methods
    this.handleInput = this.handleInput.bind(this);
    this.performSearch = this.performSearch.bind(this);
    this.displayResults = this.displayResults.bind(this);
    this.clearResults = this.clearResults.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
  }

  /**
   * Initialize the smart search widget
   * @param {string|HTMLElement} containerSelector - Container element or selector
   */
  init(containerSelector = '#smart-search-container') {
    // Get or create container
    if (typeof containerSelector === 'string') {
      this.container = document.querySelector(containerSelector);
    } else {
      this.container = containerSelector;
    }

    if (!this.container) {
      console.warn('[BrightAI Smart Search] Container not found, creating default');
      this.createDefaultContainer();
    }

    // Create search widget
    this.createWidget();
    
    // Attach event listeners
    this.attachEventListeners();
    
    console.log('[BrightAI Smart Search] Initialized successfully');
  }

  /**
   * Create default container if not found
   */
  createDefaultContainer() {
    this.container = document.createElement('div');
    this.container.id = 'smart-search-container';
    this.container.className = 'smart-search-container';
    
    // Insert after navbar or at top of main content
    const navbar = document.querySelector('.navbar');
    if (navbar && navbar.parentNode) {
      navbar.parentNode.insertBefore(this.container, navbar.nextSibling);
    } else {
      document.body.insertBefore(this.container, document.body.firstChild);
    }
  }

  /**
   * Create the search widget HTML structure
   */
  createWidget() {
    this.container.innerHTML = `
      <div class="smart-search-wrapper glass" role="search" aria-label="البحث الذكي في موقع BrightAI">
        <div class="smart-search-input-wrapper">
          <label for="smart-search-input" class="sr-only">البحث</label>
          <svg class="smart-search-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input 
            type="search" 
            id="smart-search-input"
            class="smart-search-input" 
            placeholder="${this.escapeHtml(this.config.placeholder)}"
            autocomplete="off"
            aria-describedby="smart-search-hint"
            aria-expanded="false"
            aria-controls="smart-search-results"
            role="combobox"
          >
          <span id="smart-search-hint" class="sr-only">اكتب 3 أحرف على الأقل للبحث</span>
          <button 
            type="button" 
            class="smart-search-clear" 
            aria-label="مسح البحث"
            style="display: none;"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        
        <!-- Loading indicator -->
        <div class="smart-search-loading" aria-hidden="true" style="display: none;">
          <div class="smart-search-loading-spinner"></div>
          <span>جاري البحث...</span>
        </div>
        
        <!-- Results container -->
        <div 
          id="smart-search-results"
          class="smart-search-results" 
          role="listbox"
          aria-label="نتائج البحث"
          style="display: none;"
        >
          <!-- Results will be inserted here -->
        </div>
      </div>
    `;

    // Cache DOM references
    this.inputField = this.container.querySelector('.smart-search-input');
    this.resultsContainer = this.container.querySelector('.smart-search-results');
    this.loadingIndicator = this.container.querySelector('.smart-search-loading');
    this.clearButton = this.container.querySelector('.smart-search-clear');
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Input handler with debounce (Requirement 5.1)
    this.inputField.addEventListener('input', this.handleInput);
    
    // Keyboard navigation
    this.inputField.addEventListener('keydown', this.handleKeyDown);
    
    // Clear button
    this.clearButton.addEventListener('click', () => {
      this.inputField.value = '';
      this.clearResults();
      this.clearButton.style.display = 'none';
      this.inputField.focus();
    });
    
    // Click outside to close results
    document.addEventListener('click', this.handleClickOutside);
    
    // Focus handler
    this.inputField.addEventListener('focus', () => {
      if (this.results.length > 0) {
        this.showResults();
      }
    });
  }

  /**
   * Handle input with debounce (Requirement 5.1)
   * @param {Event} e - Input event
   */
  handleInput(e) {
    const query = e.target.value.trim();
    
    // Show/hide clear button
    this.clearButton.style.display = query.length > 0 ? 'flex' : 'none';
    
    // Clear previous timer (Requirement 5.1: clear previous timer on new input)
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    
    // Check minimum query length (Requirement 5.2)
    if (query.length < this.config.minQueryLength) {
      this.clearResults();
      return;
    }
    
    // Set debounce timer (Requirement 5.1: 300ms debounce)
    this.debounceTimer = setTimeout(() => {
      this.performSearch(query);
    }, this.config.debounceDelay);
  }

  /**
   * Handle keyboard navigation
   * @param {KeyboardEvent} e
   */
  handleKeyDown(e) {
    const resultItems = this.resultsContainer.querySelectorAll('.smart-search-result');
    const activeItem = this.resultsContainer.querySelector('.smart-search-result.active');
    let activeIndex = Array.from(resultItems).indexOf(activeItem);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (activeIndex < resultItems.length - 1) {
          if (activeItem) activeItem.classList.remove('active');
          resultItems[activeIndex + 1].classList.add('active');
          resultItems[activeIndex + 1].scrollIntoView({ block: 'nearest' });
        } else if (activeIndex === -1 && resultItems.length > 0) {
          resultItems[0].classList.add('active');
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (activeIndex > 0) {
          if (activeItem) activeItem.classList.remove('active');
          resultItems[activeIndex - 1].classList.add('active');
          resultItems[activeIndex - 1].scrollIntoView({ block: 'nearest' });
        }
        break;
        
      case 'Enter':
        if (activeItem) {
          e.preventDefault();
          const link = activeItem.querySelector('a');
          if (link) link.click();
        }
        break;
        
      case 'Escape':
        this.clearResults();
        this.inputField.blur();
        break;
    }
  }

  /**
   * Handle click outside to close results
   * @param {Event} e
   */
  handleClickOutside(e) {
    if (!this.container.contains(e.target)) {
      this.hideResults();
    }
  }

  /**
   * Perform search via server endpoint (Requirement 5.3, 23.3)
   * @param {string} query - Search query
   */
  async performSearch(query) {
    // Skip if query is too short (Requirement 5.2)
    if (query.length < this.config.minQueryLength) {
      return;
    }
    
    this.currentQuery = query;
    this.setLoading(true);
    
    try {
      // Call server search endpoint (NOT direct Gemini API) - Requirement 23.3
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });

      const data = await response.json();

      // Check if this is still the current query (user might have typed more)
      if (query !== this.currentQuery) {
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || this.config.errorMessage);
      }

      // Store and display results (Requirement 5.4)
      this.results = data.results || [];
      this.displayResults(this.results, query);
      
      // Track search event
      this.trackEvent('smart_search_performed', { 
        query_length: query.length,
        results_count: this.results.length 
      });

    } catch (error) {
      console.error('[BrightAI Smart Search] Error:', error);
      this.showError(error.message || this.config.errorMessage);
      
      // Track error
      this.trackEvent('smart_search_error', { error: error.message });
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Display search results in glass cards (Requirement 5.4, 5.5)
   * @param {Array} results - Search results
   * @param {string} query - Original query for highlighting
   */
  displayResults(results, query) {
    if (!results || results.length === 0) {
      this.resultsContainer.innerHTML = `
        <div class="smart-search-no-results">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <span>${this.escapeHtml(this.config.noResultsMessage)}</span>
        </div>
      `;
      this.showResults();
      return;
    }

    // Render results with glass-card styling (Requirement 5.5)
    const resultsHtml = results.map((result, index) => `
      <div class="smart-search-result glass-card" 
           role="option" 
           aria-selected="false"
           data-index="${index}">
        <a href="${this.escapeHtml(result.url)}" class="smart-search-result-link">
          <h4 class="smart-search-result-title">
            ${this.highlightKeywords(result.title, query)}
          </h4>
          <span class="smart-search-result-url">${this.escapeHtml(result.url)}</span>
          <p class="smart-search-result-description">
            ${this.highlightKeywords(result.description, query)}
          </p>
        </a>
      </div>
    `).join('');

    this.resultsContainer.innerHTML = resultsHtml;
    
    // Add click handlers for result items
    this.resultsContainer.querySelectorAll('.smart-search-result').forEach(item => {
      item.addEventListener('click', () => {
        this.trackEvent('smart_search_result_clicked', {
          result_index: item.dataset.index,
          result_url: item.querySelector('a').href
        });
      });
    });

    this.showResults();
  }

  /**
   * Highlight matching keywords in text (Requirement 5.5)
   * @param {string} text - Text to highlight
   * @param {string} query - Query to highlight
   * @returns {string} - HTML with highlighted keywords
   */
  highlightKeywords(text, query) {
    if (!text || !query) return this.escapeHtml(text || '');
    
    const escapedText = this.escapeHtml(text);
    const words = query.split(/\s+/).filter(w => w.length >= 2);
    
    if (words.length === 0) return escapedText;
    
    // Create regex pattern for all query words
    const pattern = words.map(w => this.escapeRegex(w)).join('|');
    const regex = new RegExp(`(${pattern})`, 'gi');
    
    return escapedText.replace(regex, '<mark class="smart-search-highlight">$1</mark>');
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    this.resultsContainer.innerHTML = `
      <div class="smart-search-error">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        <span>${this.escapeHtml(message)}</span>
      </div>
    `;
    this.showResults();
  }

  /**
   * Show results container
   */
  showResults() {
    this.resultsContainer.style.display = 'block';
    this.inputField.setAttribute('aria-expanded', 'true');
  }

  /**
   * Hide results container
   */
  hideResults() {
    this.resultsContainer.style.display = 'none';
    this.inputField.setAttribute('aria-expanded', 'false');
  }

  /**
   * Clear results
   */
  clearResults() {
    this.results = [];
    this.resultsContainer.innerHTML = '';
    this.hideResults();
  }

  /**
   * Set loading state
   * @param {boolean} loading
   */
  setLoading(loading) {
    this.isLoading = loading;
    this.loadingIndicator.style.display = loading ? 'flex' : 'none';
    this.loadingIndicator.setAttribute('aria-hidden', String(!loading));
    
    if (loading) {
      this.hideResults();
    }
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text
   * @returns {string}
   */
  escapeHtml(text) {
    // Use centralized utility if available
    if (window.BrightAIUtils?.escapeHtml) {
      return window.BrightAIUtils.escapeHtml(text);
    }
    // Fallback implementation
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Escape regex special characters
   * @param {string} string
   * @returns {string}
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Track analytics events
   * @param {string} eventName
   * @param {Object} eventData
   */
  trackEvent(eventName, eventData = {}) {
    if (typeof window.dataLayer !== 'undefined') {
      window.dataLayer.push({
        event: eventName,
        ...eventData
      });
    }
  }

  /**
   * Get current results
   * @returns {Array}
   */
  getResults() {
    return [...this.results];
  }

  /**
   * Destroy the search widget
   */
  destroy() {
    // Clear timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    // Remove event listeners
    document.removeEventListener('click', this.handleClickOutside);
    
    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    this.results = [];
  }
}

// Export for external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BrightAISmartSearch };
}

// Make available globally
window.BrightAISmartSearch = BrightAISmartSearch;
