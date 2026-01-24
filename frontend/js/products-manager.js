/**
 * Products Manager - Bright AI
 * نظام إدارة المنتجات المتقدم
 */

class ProductsManager {
    constructor() {
        this.products = [];
        this.categories = [];
        this.filteredProducts = [];
        this.filters = {
            category: 'all',
            priceRange: 'all',
            searchTerm: '',
            sortBy: 'popular'
        };
        this.cart = [];
        this.comparison = [];
        this.maxComparison = 3;
    }

    /**
     * تهيئة النظام
     */
    async init() {
        try {
            await this.loadData();
            this.loadCart();
            this.setupEventListeners();
            this.render();
            this.updateCartDisplay();
        } catch (error) {
            console.error('Error initializing products manager:', error);
            this.showError('حدث خطأ في تحميل المنتجات');
        }
    }

    /**
     * تحميل البيانات من JSON
     */
    async loadData() {
        try {
            const response = await fetch('data/products-data.json');
            if (!response.ok) throw new Error('Failed to load products data');

            const data = await response.json();
            this.products = data.products;
            this.categories = data.categories;
            this.filteredProducts = [...this.products];

            // Products data loaded successfully
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    /**
     * إعداد مستمعي الأحداث
     */
    setupEventListeners() {
        // Category tabs
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.filters.category = tab.dataset.category;
                this.updateActiveTab(tab);
                this.applyFilters();
            });
        });

        // Search
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.filters.searchTerm = e.target.value;
                this.applyFilters();
            }, 300));
        }

        // Price filter
        const priceFilter = document.getElementById('price-filter');
        if (priceFilter) {
            priceFilter.addEventListener('change', (e) => {
                this.filters.priceRange = e.target.value;
                this.applyFilters();
            });
        }

        // Sort
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.filters.sortBy = e.target.value;
                this.applyFilters();
            });
        }

        // Comparison bar
        const compareBtn = document.getElementById('compare-btn');
        if (compareBtn) {
            compareBtn.addEventListener('click', () => this.showComparison());
        }

        const clearCompareBtn = document.getElementById('clear-compare');
        if (clearCompareBtn) {
            clearCompareBtn.addEventListener('click', () => this.clearComparison());
        }
    }

    /**
     * تطبيق الفلاتر
     */
    applyFilters() {
        let filtered = [...this.products];

        // Filter by category
        if (this.filters.category !== 'all') {
            filtered = filtered.filter(p => p.category === this.filters.category);
        }

        // Filter by price
        if (this.filters.priceRange !== 'all') {
            filtered = filtered.filter(p => {
                const price = p.pricing.current;
                switch (this.filters.priceRange) {
                    case 'low': return price < 500;
                    case 'medium': return price >= 500 && price <= 2000;
                    case 'high': return price > 2000;
                    default: return true;
                }
            });
        }

        // Filter by search term
        if (this.filters.searchTerm) {
            const term = this.filters.searchTerm.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(term) ||
                p.shortDescription.toLowerCase().includes(term) ||
                p.features.some(f => f.toLowerCase().includes(term))
            );
        }

        // Sort
        filtered = this.sortProducts(filtered, this.filters.sortBy);

        this.filteredProducts = filtered;
        this.render();
        this.updateResultsCount();
    }

    /**
     * ترتيب المنتجات
     */
    sortProducts(products, sortBy) {
        const sorted = [...products];

        switch (sortBy) {
            case 'price-low':
                return sorted.sort((a, b) => a.pricing.current - b.pricing.current);
            case 'price-high':
                return sorted.sort((a, b) => b.pricing.current - a.pricing.current);
            case 'rating':
                return sorted.sort((a, b) => b.rating - a.rating);
            case 'popular':
                return sorted.sort((a, b) => b.reviews - a.reviews);
            case 'name':
                return sorted.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
            default:
                return sorted;
        }
    }

    /**
     * عرض المنتجات
     */
    render() {
        const container = document.getElementById('products-grid');
        if (!container) return;

        if (this.filteredProducts.length === 0) {
            container.innerHTML = this.renderEmptyState();
            return;
        }

        container.innerHTML = this.filteredProducts
            .map(product => this.renderProductCard(product))
            .join('');

        this.animateCards();
        this.attachProductEvents();
    }

    /**
     * عرض بطاقة منتج
     */
    renderProductCard(product) {
        const category = this.categories.find(c => c.id === product.category);
        const discount = product.pricing.discount;
        const isInComparison = this.comparison.includes(product.id);

        return `
            <div class="product-card glass-card" data-id="${product.id}" data-category="${product.category}">
                ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
                ${discount ? `<div class="product-discount">-${discount}%</div>` : ''}
                
                <div class="product-icon" style="background: ${category.color}20">
                    <iconify-icon icon="${category.icon}" style="color: ${category.color}" width="32"></iconify-icon>
                </div>

                <div class="product-content">
                    <h3>${product.name}</h3>
                    <p class="product-description">${product.shortDescription}</p>
                    
                    <ul class="product-features">
                        ${product.features.slice(0, 3).map(f => `
                            <li>
                                <iconify-icon icon="lucide:check" width="16"></iconify-icon>
                                ${f}
                            </li>
                        `).join('')}
                    </ul>
                </div>

                <div class="product-pricing">
                    <div class="price-main">
                        <span class="price-current">${product.pricing.current} ${product.pricing.currency}</span>
                        ${product.pricing.original ? `
                            <span class="price-original">${product.pricing.original} ${product.pricing.currency}</span>
                        ` : ''}
                    </div>
                </div>

                <div class="product-meta">
                    <span class="meta-item">
                        <iconify-icon icon="lucide:clock" width="16"></iconify-icon>
                        ${product.deliveryTime}
                    </span>
                    <span class="meta-item">
                        <iconify-icon icon="lucide:star" width="16"></iconify-icon>
                        ${product.rating} (${product.reviews})
                    </span>
                </div>

                <div class="product-actions">
                    <button class="btn-primary buy-btn" data-id="${product.id}">
                        <iconify-icon icon="lucide:shopping-cart" width="18"></iconify-icon>
                        شراء الآن
                    </button>
                    <button class="btn-secondary details-btn" data-id="${product.id}">
                        <iconify-icon icon="lucide:info" width="18"></iconify-icon>
                        التفاصيل
                    </button>
                    <button class="btn-icon btn-compare ${isInComparison ? 'active' : ''}" 
                            data-id="${product.id}" 
                            title="إضافة للمقارنة">
                        <iconify-icon icon="lucide:git-compare" width="18"></iconify-icon>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * عرض حالة فارغة
     */
    renderEmptyState() {
        return `
            <div class="empty-state">
                <iconify-icon icon="lucide:search-x" width="64"></iconify-icon>
                <h3>لم نجد نتائج</h3>
                <p>جرب تغيير معايير البحث أو الفلاتر</p>
                <button class="btn-primary" onclick="productsManager.resetFilters()">
                    إعادة تعيين الفلاتر
                </button>
            </div>
        `;
    }

    /**
     * تحريك البطاقات
     */
    animateCards() {
        const cards = document.querySelectorAll('.product-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'all 0.4s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 50);
        });
    }

    /**
     * ربط أحداث المنتجات
     */
    attachProductEvents() {
        // Buy buttons
        document.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = btn.dataset.id;
                this.addToCart(productId);
            });
        });

        // Details buttons
        document.querySelectorAll('.details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = btn.dataset.id;
                this.showProductDetails(productId);
            });
        });

        // Compare buttons
        document.querySelectorAll('.btn-compare').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = btn.dataset.id;
                this.toggleComparison(productId);
            });
        });
    }

    /**
     * إضافة منتج للسلة
     */
    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const existingItem = this.cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            this.cart.push({
                id: productId,
                name: product.name,
                price: `${product.pricing.current} ${product.pricing.currency}`,
                quantity: 1
            });
        }

        this.saveCart();
        this.updateCartDisplay();
        this.showNotification(`تمت إضافة "${product.name}" إلى السلة`);
    }

    /**
     * عرض تفاصيل المنتج
     */
    showProductDetails(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const modal = document.getElementById('product-details-modal');
        if (!modal) return;

        const category = this.categories.find(c => c.id === product.category);

        modal.querySelector('.modal-body').innerHTML = `
            <div class="product-details-header">
                <div class="product-icon-large" style="background: ${category.color}20">
                    <iconify-icon icon="${category.icon}" style="color: ${category.color}" width="48"></iconify-icon>
                </div>
                <h2>${product.name}</h2>
                <p class="category-badge" style="background: ${category.color}20; color: ${category.color}">
                    ${category.name}
                </p>
            </div>

            <div class="product-details-content">
                <p class="full-description">${product.fullDescription}</p>

                <h3>المميزات الرئيسية</h3>
                <ul class="features-list">
                    ${product.features.map(f => `
                        <li>
                            <iconify-icon icon="lucide:check-circle" width="20"></iconify-icon>
                            ${f}
                        </li>
                    `).join('')}
                </ul>

                <div class="product-details-pricing">
                    <div class="price-section">
                        <span class="label">السعر:</span>
                        <span class="price-large">${product.pricing.current} ${product.pricing.currency}</span>
                        ${product.pricing.original ? `
                            <span class="price-original-large">${product.pricing.original} ${product.pricing.currency}</span>
                        ` : ''}
                    </div>
                    <div class="delivery-section">
                        <iconify-icon icon="lucide:truck" width="20"></iconify-icon>
                        <span>مدة التسليم: ${product.deliveryTime}</span>
                    </div>
                    <div class="rating-section">
                        <iconify-icon icon="lucide:star" width="20"></iconify-icon>
                        <span>${product.rating} من 5 (${product.reviews} تقييم)</span>
                    </div>
                </div>

                <div class="product-details-actions">
                    <button class="btn-primary btn-large" onclick="productsManager.addToCart('${product.id}')">
                        <iconify-icon icon="lucide:shopping-cart" width="20"></iconify-icon>
                        إضافة إلى السلة
                    </button>
                    <button class="btn-secondary btn-large" onclick="productsManager.toggleComparison('${product.id}')">
                        <iconify-icon icon="lucide:git-compare" width="20"></iconify-icon>
                        إضافة للمقارنة
                    </button>
                </div>
            </div>
        `;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    /**
     * إدارة المقارنة
     */
    toggleComparison(productId) {
        const index = this.comparison.indexOf(productId);

        if (index > -1) {
            this.comparison.splice(index, 1);
            this.updateCompareButton(productId, false);
        } else {
            if (this.comparison.length >= this.maxComparison) {
                this.showNotification(`يمكنك مقارنة ${this.maxComparison} منتجات كحد أقصى`, 'warning');
                return;
            }
            this.comparison.push(productId);
            this.updateCompareButton(productId, true);
        }

        this.updateComparisonBar();
    }

    updateCompareButton(productId, active) {
        const btn = document.querySelector(`.btn-compare[data-id="${productId}"]`);
        if (btn) {
            btn.classList.toggle('active', active);
        }
    }

    updateComparisonBar() {
        const bar = document.getElementById('comparison-bar');
        if (!bar) return;

        if (this.comparison.length === 0) {
            bar.classList.remove('active');
            return;
        }

        bar.classList.add('active');
        bar.querySelector('.comparison-count').textContent = this.comparison.length;

        const itemsContainer = bar.querySelector('.comparison-items');
        itemsContainer.innerHTML = this.comparison.map(id => {
            const product = this.products.find(p => p.id === id);
            return `
                <div class="comparison-item">
                    <span>${product.name}</span>
                    <button onclick="productsManager.toggleComparison('${id}')">
                        <iconify-icon icon="lucide:x" width="16"></iconify-icon>
                    </button>
                </div>
            `;
        }).join('');
    }

    showComparison() {
        if (this.comparison.length < 2) {
            this.showNotification('اختر منتجين على الأقل للمقارنة', 'warning');
            return;
        }

        // سيتم تنفيذ هذا لاحقاً
        // Show comparison modal - TODO: implement modal
    }

    clearComparison() {
        this.comparison = [];
        document.querySelectorAll('.btn-compare.active').forEach(btn => {
            btn.classList.remove('active');
        });
        this.updateComparisonBar();
    }

    /**
     * إدارة السلة
     */
    loadCart() {
        const saved = localStorage.getItem('brightAICart');
        if (saved) {
            try {
                this.cart = JSON.parse(saved);
            } catch (e) {
                console.error('Error loading cart:', e);
                this.cart = [];
            }
        }
    }

    saveCart() {
        localStorage.setItem('brightAICart', JSON.stringify(this.cart));
    }

    updateCartDisplay() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const total = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = total;
            cartCount.style.display = total > 0 ? 'block' : 'none';
        }
    }

    /**
     * وظائف مساعدة
     */
    updateActiveTab(activeTab) {
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        activeTab.classList.add('active');
    }

    updateResultsCount() {
        const counter = document.getElementById('results-count');
        if (counter) {
            counter.textContent = `عرض ${this.filteredProducts.length} من ${this.products.length} منتج`;
        }
    }

    resetFilters() {
        this.filters = {
            category: 'all',
            priceRange: 'all',
            searchTerm: '',
            sortBy: 'popular'
        };

        // Reset UI
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.value = '';

        const priceFilter = document.getElementById('price-filter');
        if (priceFilter) priceFilter.value = 'all';

        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) sortSelect.value = 'popular';

        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.category === 'all') {
                tab.classList.add('active');
            }
        });

        this.applyFilters();
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <iconify-icon icon="lucide:${type === 'success' ? 'check-circle' : 'alert-circle'}" width="20"></iconify-icon>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showError(message) {
        const container = document.getElementById('products-grid');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <iconify-icon icon="lucide:alert-triangle" width="64"></iconify-icon>
                    <h3>حدث خطأ</h3>
                    <p>${message}</p>
                    <button class="btn-primary" onclick="location.reload()">
                        إعادة المحاولة
                    </button>
                </div>
            `;
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize
const productsManager = new ProductsManager();

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => productsManager.init());
} else {
    productsManager.init();
}
