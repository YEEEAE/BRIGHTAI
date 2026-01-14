document.addEventListener('DOMContentLoaded', function() {
    // تعريف المتغيرات الأساسية
    const cartIcon = document.querySelector('.cart-icon');
    const cartModal = document.getElementById('cartModal');
    const closeCartModal = document.getElementById('closeCartModal');
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartCount = document.querySelector('.cart-count');
    const cartTotalElement = document.querySelector('.cart-total');
    const paymentModal = document.getElementById('paymentModal');
    const closePaymentModal = document.getElementById('closePaymentModal');
    const copyIbanBtn = document.getElementById('copyIban');
    const paymentTotalElement = document.querySelector('.payment-total');
    const products = document.querySelectorAll('.product');
    const productImagesContainers = document.querySelectorAll('.product-images');
    
    let cart = [];

    function manageBodyScroll(isModalOpen) {
        if (isModalOpen) {
            // Task 16.4: Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`; // Prevent layout shift
        } else {
            // Only restore scroll if no other modals are active
            const anyModalActive = document.querySelector('.cart-modal.active, .payment-modal.active, .product-details-modal.active');
            if (!anyModalActive) {
                document.body.style.overflow = 'auto';
                document.body.style.paddingRight = '0';
            }
        }
    }

    // دالة لتحديث عرض السلة
    function updateCartDisplay() {
        try {
            if (!cartItemsContainer || !cartTotalElement || !cartCount) {
                console.error('Cart display elements not found!');
                return;
            }
            cartItemsContainer.innerHTML = ''; // Clear previous items
            let total = 0;
            let totalQuantity = 0;

            if (cart.length === 0) {
                cartItemsContainer.innerHTML = `<div class="empty-cart" style="text-align: center; padding: 20px; color: var(--text-secondary);">
                    <i class="fas fa-shopping-bag" style="font-size: 3em; color: var(--accent-color); margin-bottom: 15px;" aria-hidden="true"></i>
                    <p style="font-size: 1.1em;">سلة المشتريات فارغة حالياً.</p>
                    <p>تصفح منتجاتنا وأضف ما يعجبك!</p>
                </div>`;
            } else {
                cart.forEach(item => {
                    const priceNumeric = parseFloat(String(item.price).replace(/[^0-9.]/g, ''));
                    if (isNaN(priceNumeric)) {
                        console.error(`Invalid price for item: ${item.name}`, item.price);
                        return; 
                    }
                    total += priceNumeric * item.quantity;
                    totalQuantity += item.quantity;

                    const cartItemElement = document.createElement('div');
                    cartItemElement.classList.add('cart-item');
                    cartItemElement.innerHTML = `
                        <div class="cart-item-details">
                            <h4>${item.name}</h4>
                            <p>السعر: ${item.price}</p>
                            <div class="quantity-controls">
                                <button class="quantity-btn" data-product-id="${item.id}" data-change="-1" aria-label="تقليل الكمية لـ ${item.name}">-</button>
                                <span aria-live="polite">${item.quantity}</span>
                                <button class="quantity-btn" data-product-id="${item.id}" data-change="1" aria-label="زيادة الكمية لـ ${item.name}">+</button>
                            </div>
                        </div>
                        <button class="remove-item" data-product-id="${item.id}" aria-label="إزالة ${item.name} من السلة">×</button>
                    `;
                    cartItemsContainer.appendChild(cartItemElement);
                });
            }

            cartTotalElement.textContent = total.toFixed(2);
            cartCount.textContent = totalQuantity;
            localStorage.setItem('brightAICart', JSON.stringify(cart));
            cartCount.style.display = totalQuantity > 0 ? 'block' : 'none';
        } catch (error) {
            console.error('Error updating cart display:', error);
            showNotification('حدث خطأ أثناء تحديث السلة. يرجى تحديث الصفحة.');
        }
    }
    
    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('click', function(event) {
            try {
                const target = event.target.closest('button'); // Ensure we get the button if icon inside is clicked
                if (!target) return;

                if (target.classList.contains('quantity-btn')) {
                    const productId = target.dataset.productId;
                    const change = parseInt(target.dataset.change);
                    updateQuantity(productId, change);
                } else if (target.classList.contains('remove-item')) {
                    const productId = target.dataset.productId;
                    removeFromCart(productId);
                }
            } catch (error) {
                console.error('Error handling cart item click:', error);
                showNotification('حدث خطأ أثناء تحديث السلة. يرجى المحاولة مرة أخرى.');
            }
        });
    }


    // دالة لإضافة منتج إلى السلة
    function addToCart(productId, productName, productPrice) {
        try {
            const existingItem = cart.find(item => item.id === productId);
            if (existingItem) {
                existingItem.quantity++;
            } else {
                cart.push({
                    id: productId,
                    name: productName,
                    price: productPrice,
                    quantity: 1
                });
            }
            updateCartDisplay();
            showNotification(`تمت إضافة "${productName}" إلى السلة بنجاح!`);
        } catch (error) {
            console.error('Error adding to cart:', error);
            showNotification('حدث خطأ أثناء إضافة المنتج. يرجى المحاولة مرة أخرى.');
        }
    }
    
    // دالة لعرض تنبيه
    function showNotification(message) {
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.setAttribute('role', 'alert');
        notification.innerHTML = `
            <i class="fas fa-check-circle" aria-hidden="true"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        void notification.offsetWidth; 
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 400);
        }, 3000);
    }

    // دالة لتحديث كمية المنتج
    function updateQuantity(productId, change) {
        try {
            const itemIndex = cart.findIndex(item => item.id === productId);
            if (itemIndex > -1) {
                cart[itemIndex].quantity += change;
                if (cart[itemIndex].quantity <= 0) {
                    const itemName = cart[itemIndex].name;
                    cart.splice(itemIndex, 1);
                    showNotification(`تمت إزالة "${itemName}" من السلة.`);
                }
                updateCartDisplay();
            }
        } catch (error) {
            console.error('Error updating quantity:', error);
            showNotification('حدث خطأ أثناء تحديث الكمية. يرجى المحاولة مرة أخرى.');
        }
    }

    // دالة لإزالة منتج من السلة
    function removeFromCart(productId) {
        try {
            const itemIndex = cart.findIndex(item => item.id === productId);
            if (itemIndex > -1) {
                const itemName = cart[itemIndex].name;
                cart.splice(itemIndex, 1);
                updateCartDisplay();
                showNotification(`تمت إزالة "${itemName}" من السلة.`);
            }
        } catch (error) {
            console.error('Error removing from cart:', error);
            showNotification('حدث خطأ أثناء إزالة المنتج. يرجى المحاولة مرة أخرى.');
        }
    }

    if (cartIcon) {
        const openCart = () => {
            try {
                if (cartModal) {
                    cartModal.classList.add('active');
                    manageBodyScroll(true);
                }
            } catch (error) {
                console.error('Error opening cart:', error);
                showNotification('حدث خطأ أثناء فتح السلة. يرجى تحديث الصفحة.');
            }
        };
        
        cartIcon.addEventListener('click', openCart);
        
        // Keyboard support for cart icon
        cartIcon.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openCart();
            }
        });
    }

    if (closeCartModal) {
        const closeCart = () => {
            try {
                if (cartModal) {
                    cartModal.classList.remove('active');
                    manageBodyScroll(false);
                }
            } catch (error) {
                console.error('Error closing cart:', error);
            }
        };
        
        closeCartModal.addEventListener('click', closeCart);
        
        // Keyboard support for close button
        closeCartModal.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                closeCart();
            }
        });
    }

    products.forEach(product => {
        const buyButton = product.querySelector('.buy-button');
        if (buyButton) {
            // Function to handle adding to cart
            const handleAddToCart = function(event) {
                try {
                    event.preventDefault();
                    const productId = product.dataset.productId;
                    const productNameElement = product.querySelector('h3');
                    const productPriceElement = product.querySelector('.price');

                    if (!productId || !productNameElement || !productPriceElement) {
                        console.error('Product missing ID, name, or price element for product:', product);
                        showNotification('عفواً، حدث خطأ ما. يرجى المحاولة لاحقاً.');
                        return;
                    }
                    const productName = productNameElement.textContent.trim();
                    const productPrice = productPriceElement.textContent.trim();
                    
                    this.classList.add('button-click');
                    setTimeout(() => this.classList.remove('button-click'), 200);
                    addToCart(productId, productName, productPrice);
                } catch (error) {
                    console.error('Error handling buy button click:', error);
                    showNotification('حدث خطأ أثناء إضافة المنتج. يرجى المحاولة مرة أخرى.');
                }
            };
            
            // Click event
            buyButton.addEventListener('click', handleAddToCart);
            
            // Keyboard events (Enter and Space)
            buyButton.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault(); // Prevent page scroll on Space
                    handleAddToCart.call(this, e);
                }
            });
        }
    });
    
    document.querySelectorAll('.details-button, .checkout-button, .paypal-checkout-button, .send-receipt-button, .copy-button').forEach(button => {
        button.addEventListener('click', function() {
            // Check if it's a details button to avoid conflict with modal opening
            if (!this.hasAttribute('data-target')) {
                this.classList.add('button-click');
                setTimeout(() => this.classList.remove('button-click'), 200);
            }
        });
    });
    
    const bankCheckoutButton = document.querySelector('.checkout-button');
    if (bankCheckoutButton && paymentModal && cartModal && paymentTotalElement) {
        const handleBankCheckout = () => {
            try {
                if (cart.length > 0) {
                    const total = cart.reduce((sum, item) => {
                        const price = parseFloat(String(item.price).replace(/[^\d.]/g, ''));
                        return sum + (isNaN(price) ? 0 : price * item.quantity);
                    }, 0);
                    paymentTotalElement.textContent = total.toFixed(2);
                    cartModal.classList.remove('active');
                    paymentModal.classList.add('active');
                    manageBodyScroll(true);
                } else {
                    showNotification('سلة المشتريات فارغة. يرجى إضافة منتجات أولاً.');
                }
            } catch (error) {
                console.error('Error processing checkout:', error);
                showNotification('حدث خطأ أثناء معالجة الدفع. يرجى المحاولة مرة أخرى.');
            }
        };
        
        bankCheckoutButton.addEventListener('click', handleBankCheckout);
        
        // Keyboard support
        bankCheckoutButton.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleBankCheckout();
            }
        });
    }

    const paypalCheckoutButton = document.querySelector('.paypal-checkout-button');
    if (paypalCheckoutButton) {
        const handlePaypalCheckout = () => {
            try {
                if (cart.length > 0) {
                    showNotification('جاري تحويلك إلى PayPal لإتمام الدفع...');
                    // This is a placeholder. Real PayPal integration is more complex.
                    // You would typically build a form and submit it, or use PayPal's JS SDK.
                    setTimeout(() => { // Simulate redirect
                         alert('محاكاة التحويل إلى PayPal. في التطبيق الفعلي، سيتم توجيهك إلى صفحة الدفع.');
                    }, 1500);
                } else {
                    showNotification('سلة المشتريات فارغة. يرجى إضافة منتجات أولاً.');
                }
            } catch (error) {
                console.error('Error processing PayPal checkout:', error);
                showNotification('حدث خطأ أثناء معالجة الدفع. يرجى المحاولة مرة أخرى.');
            }
        };
        
        paypalCheckoutButton.addEventListener('click', handlePaypalCheckout);
        
        // Keyboard support
        paypalCheckoutButton.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePaypalCheckout();
            }
        });
    }

    if (copyIbanBtn) {
        const handleCopyIban = () => {
            try {
                const ibanNumberElement = document.getElementById('ibanNumber');
                if (ibanNumberElement) {
                    const ibanNumber = ibanNumberElement.textContent.trim();
                    navigator.clipboard.writeText(ibanNumber).then(() => {
                        const originalContent = copyIbanBtn.innerHTML; // Store original content (icon)
                        copyIbanBtn.textContent = 'تم النسخ!'; // Change text
                        copyIbanBtn.insertBefore(ibanNumberElement.ownerDocument.createElement('i'), copyIbanBtn.firstChild);
                        copyIbanBtn.firstChild.className = 'fas fa-check'; // Add check icon
                        copyIbanBtn.firstChild.style.color = 'var(--accent-color)';
                        setTimeout(() => {
                            copyIbanBtn.innerHTML = originalContent; // Restore original content
                        }, 2500);
                        showNotification('تم نسخ رقم الآيبان بنجاح.');
                    }).catch(err => {
                        console.error('Failed to copy IBAN: ', err);
                        showNotification('فشل نسخ رقم الآيبان. يرجى نسخه يدوياً.');
                    });
                }
            } catch (error) {
                console.error('Error copying IBAN:', error);
                showNotification('حدث خطأ أثناء نسخ رقم الآيبان. يرجى نسخه يدوياً.');
            }
        };
        
        copyIbanBtn.addEventListener('click', handleCopyIban);
        
        // Keyboard support
        copyIbanBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCopyIban();
            }
        });
    }

    if (closePaymentModal && paymentModal) {
        const closePayment = () => {
            try {
                paymentModal.classList.remove('active');
                manageBodyScroll(false);
            } catch (error) {
                console.error('Error closing payment modal:', error);
            }
        };
        
        closePaymentModal.addEventListener('click', closePayment);
        
        // Keyboard support
        closePaymentModal.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                closePayment();
            }
        });
    }

    window.addEventListener('click', (event) => {
        try {
            if (cartModal && event.target === cartModal) {
                cartModal.classList.remove('active');
                manageBodyScroll(false);
            }
            if (paymentModal && event.target === paymentModal) {
                paymentModal.classList.remove('active');
                manageBodyScroll(false);
            }
        } catch (error) {
            console.error('Error handling window click:', error);
        }
    });

    const savedCart = localStorage.getItem('brightAICart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
            if (!Array.isArray(cart)) cart = [];
        } catch (e) {
            console.error("Error parsing saved cart:", e);
            cart = [];
            localStorage.removeItem('brightAICart');
        }
    }
    updateCartDisplay(); // Call this regardless to initialize display
    
    productImagesContainers.forEach(container => {
        const prevButton = container.querySelector('.prev-button');
        const nextButton = container.querySelector('.next-button');
        const imagesScroller = container.querySelector('.images-container');
        
        if (prevButton && nextButton && imagesScroller) {
            const scrollAmount = () => imagesScroller.offsetWidth * 0.9; // Recalculate on click for responsiveness

            const updateSliderButtons = () => {
                try {
                    prevButton.disabled = imagesScroller.scrollLeft < 10;
                    // Check if scrollable (content wider than container)
                    const isScrollable = imagesScroller.scrollWidth > imagesScroller.clientWidth;
                    if (isScrollable) {
                         nextButton.disabled = imagesScroller.scrollWidth - imagesScroller.scrollLeft - imagesScroller.clientWidth < 10;
                    } else {
                        nextButton.disabled = true; // Not scrollable, disable next
                    }
                } catch (error) {
                    console.error('Error updating slider buttons:', error);
                }
            };

            const handleNext = () => {
                try {
                    imagesScroller.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
                } catch (error) {
                    console.error('Error scrolling next:', error);
                }
            };
            
            const handlePrev = () => {
                try {
                    imagesScroller.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
                } catch (error) {
                    console.error('Error scrolling prev:', error);
                }
            };

            nextButton.addEventListener('click', handleNext);
            
            // Keyboard support for next button
            nextButton.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNext();
                }
            });
            
            prevButton.addEventListener('click', handlePrev);
            
            // Keyboard support for prev button
            prevButton.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePrev();
                }
            });

            imagesScroller.addEventListener('scroll', updateSliderButtons, { passive: true });
            window.addEventListener('resize', updateSliderButtons, { passive: true }); // Also on resize
            updateSliderButtons(); // Initial check
        }
    });

    const detailButtons = document.querySelectorAll('.details-button[data-target]');
    detailButtons.forEach(button => {
        // Function to handle modal opening
        const openModal = function(e) {
            try {
                e.preventDefault();
                // Apply click effect
                this.classList.add('button-click');
                setTimeout(() => this.classList.remove('button-click'), 200);
                
                const modalId = this.getAttribute('data-target');
                const modal = document.getElementById(modalId);
                
                console.log(`Attempting to open modal with ID: ${modalId}`);
                if (modal) {
                    console.log(`Modal found:`, modal);
                    // Remove closing class if present
                    modal.classList.remove('closing');
                    modal.classList.add('active');
                    // Update aria-expanded for accessibility
                    this.setAttribute('aria-expanded', 'true');
                    manageBodyScroll(true);
                    // Task 16.4: Activate focus trap
                    trapFocus(modal);
                } else {
                    console.error(`Modal with ID '${modalId}' not found.`);
                    showNotification(`عفواً، تفاصيل هذا المنتج غير متوفرة حالياً.`);
                }
            } catch (error) {
                console.error('Error opening modal:', error);
                showNotification('حدث خطأ أثناء فتح تفاصيل المنتج. يرجى المحاولة مرة أخرى.');
            }
        };
        
        // Click event
        button.addEventListener('click', openModal);
        
        // Keyboard events (Enter and Space)
        button.addEventListener('keydown', function(e) {
            // Enter key (13) or Space key (32)
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault(); // Prevent page scroll on Space
                openModal.call(this, e);
            }
        });
    });

    // Helper function to reset aria-expanded on the trigger button when modal closes
    function resetAriaExpandedForModal(modal) {
        const modalId = modal.id;
        const triggerButton = document.querySelector(`.details-button[data-target="${modalId}"]`);
        if (triggerButton) {
            triggerButton.setAttribute('aria-expanded', 'false');
        }
    }

    // Helper function to close modal with animation
    function closeModalWithAnimation(modal) {
        modal.classList.add('closing');
        setTimeout(() => {
            modal.classList.remove('active', 'closing');
            resetAriaExpandedForModal(modal);
            manageBodyScroll(false);
        }, 300); // Match animation duration
    }

    // Task 16.4: Focus trap helper function
    function trapFocus(modal) {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        // Focus first element when modal opens
        if (firstFocusable) {
            setTimeout(() => firstFocusable.focus(), 100);
        }

        // Trap focus within modal
        modal.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                if (e.shiftKey) { // Shift + Tab
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else { // Tab
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        });
    }

    const productDetailModals = document.querySelectorAll('.product-details-modal');
    productDetailModals.forEach(modal => {
        const closeButton = modal.querySelector('.close-button');
        if (closeButton) {
            const closeModal = function() {
                try {
                    closeModalWithAnimation(modal);
                } catch (error) {
                    console.error('Error closing modal:', error);
                }
            };
            
            closeButton.addEventListener('click', closeModal);
            
            // Keyboard support
            closeButton.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    closeModal();
                }
            });
        }

        modal.addEventListener('click', function(event) {
            try {
                if (event.target === modal) {
                    closeModalWithAnimation(modal);
                }
            } catch (error) {
                console.error('Error handling modal backdrop click:', error);
            }
        });
        
        // Task 16.2: Add swipe-to-close gesture support for mobile
        let touchStartY = 0;
        let touchEndY = 0;
        let isDragging = false;
        const modalContent = modal.querySelector('.modal-content');
        
        if (modalContent) {
            modalContent.addEventListener('touchstart', function(e) {
                touchStartY = e.touches[0].clientY;
                isDragging = true;
            }, { passive: true });
            
            modalContent.addEventListener('touchmove', function(e) {
                if (!isDragging) return;
                touchEndY = e.touches[0].clientY;
                const deltaY = touchEndY - touchStartY;
                
                // Only allow downward swipe and only if scrolled to top
                if (deltaY > 0 && modalContent.scrollTop === 0) {
                    // Apply transform to follow finger
                    modalContent.style.transform = `translateY(${deltaY}px)`;
                    modalContent.style.transition = 'none';
                }
            }, { passive: true });
            
            modalContent.addEventListener('touchend', function(e) {
                if (!isDragging) return;
                isDragging = false;
                
                const deltaY = touchEndY - touchStartY;
                const threshold = 100; // Minimum swipe distance to close
                
                // Reset transition
                modalContent.style.transition = '';
                
                if (deltaY > threshold && modalContent.scrollTop === 0) {
                    // Close modal if swiped down enough
                    closeModalWithAnimation(modal);
                } else {
                    // Reset position if not swiped enough
                    modalContent.style.transform = '';
                }
                
                touchStartY = 0;
                touchEndY = 0;
            }, { passive: true });
        }
    });

    document.addEventListener('keydown', function(event) {
        try {
            if (event.key === 'Escape') {
                let closedAModal = false;
                const activeModals = document.querySelectorAll('.cart-modal.active, .payment-modal.active, .product-details-modal.active');
                activeModals.forEach(modal => {
                    if (modal.classList.contains('product-details-modal')) {
                        closeModalWithAnimation(modal);
                    } else {
                        modal.classList.remove('active');
                    }
                    closedAModal = true;
                });
                if (closedAModal) {
                     manageBodyScroll(false);
                }
            }
        } catch (error) {
            console.error('Error handling Escape key:', error);
        }
    });
});