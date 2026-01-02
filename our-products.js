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
            document.body.style.overflow = 'hidden';
        } else {
            // Only restore scroll if no other modals are active
            const anyModalActive = document.querySelector('.cart-modal.active, .payment-modal.active, .product-details-modal.active');
            if (!anyModalActive) {
                document.body.style.overflow = 'auto';
            }
        }
    }

    // دالة لتحديث عرض السلة
    function updateCartDisplay() {
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
    }
    
    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('click', function(event) {
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
        });
    }


    // دالة لإضافة منتج إلى السلة
    function addToCart(productId, productName, productPrice) {
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
    }

    // دالة لإزالة منتج من السلة
    function removeFromCart(productId) {
        const itemIndex = cart.findIndex(item => item.id === productId);
        if (itemIndex > -1) {
            const itemName = cart[itemIndex].name;
            cart.splice(itemIndex, 1);
            updateCartDisplay();
            showNotification(`تمت إزالة "${itemName}" من السلة.`);
        }
    }

    if (cartIcon) {
        cartIcon.addEventListener('click', () => {
            if (cartModal) {
                cartModal.classList.add('active');
                manageBodyScroll(true);
            }
        });
    }

    if (closeCartModal) {
        closeCartModal.addEventListener('click', () => {
            if (cartModal) {
                cartModal.classList.remove('active');
                manageBodyScroll(false);
            }
        });
    }

    products.forEach(product => {
        const buyButton = product.querySelector('.buy-button');
        if (buyButton) {
            buyButton.addEventListener('click', function(event) {
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
        bankCheckoutButton.addEventListener('click', () => {
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
        });
    }

    const paypalCheckoutButton = document.querySelector('.paypal-checkout-button');
    if (paypalCheckoutButton) {
        paypalCheckoutButton.addEventListener('click', () => {
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
        });
    }

    if (copyIbanBtn) {
        copyIbanBtn.addEventListener('click', () => {
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
        });
    }

    if (closePaymentModal && paymentModal) {
        closePaymentModal.addEventListener('click', () => {
            paymentModal.classList.remove('active');
            manageBodyScroll(false);
        });
    }

    window.addEventListener('click', (event) => {
        if (cartModal && event.target === cartModal) {
            cartModal.classList.remove('active');
            manageBodyScroll(false);
        }
        if (paymentModal && event.target === paymentModal) {
            paymentModal.classList.remove('active');
            manageBodyScroll(false);
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
                prevButton.disabled = imagesScroller.scrollLeft < 10;
                // Check if scrollable (content wider than container)
                const isScrollable = imagesScroller.scrollWidth > imagesScroller.clientWidth;
                if (isScrollable) {
                     nextButton.disabled = imagesScroller.scrollWidth - imagesScroller.scrollLeft - imagesScroller.clientWidth < 10;
                } else {
                    nextButton.disabled = true; // Not scrollable, disable next
                }
            };

            nextButton.addEventListener('click', () => {
                imagesScroller.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
            });
            
            prevButton.addEventListener('click', () => {
                imagesScroller.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
            });

            imagesScroller.addEventListener('scroll', updateSliderButtons, { passive: true });
            window.addEventListener('resize', updateSliderButtons, { passive: true }); // Also on resize
            updateSliderButtons(); // Initial check
        }
    });

    const detailButtons = document.querySelectorAll('.details-button[data-target]');
    detailButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            // Apply click effect
            this.classList.add('button-click');
            setTimeout(() => this.classList.remove('button-click'), 200);
            
            const modalId = this.getAttribute('data-target');
            const modal = document.getElementById(modalId);
            
            console.log(`Attempting to open modal with ID: ${modalId}`); // Debug log
            if (modal) {
                console.log(`Modal found:`, modal); // Debug log
                modal.classList.add('active');
                manageBodyScroll(true);
            } else {
                console.error(`Modal with ID '${modalId}' not found.`);
                showNotification(`عفواً، تفاصيل هذا المنتج غير متوفرة حالياً.`);
            }
        });
    });

    const productDetailModals = document.querySelectorAll('.product-details-modal');
    productDetailModals.forEach(modal => {
        const closeButton = modal.querySelector('.close-button'); // Simpler selector if only one close button
        if (closeButton) {
            closeButton.addEventListener('click', function() {
                modal.classList.remove('active');
                manageBodyScroll(false);
            });
        }

        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.classList.remove('active');
                manageBodyScroll(false);
            }
        });
    });

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            let closedAModal = false;
            const activeModals = document.querySelectorAll('.cart-modal.active, .payment-modal.active, .product-details-modal.active');
            activeModals.forEach(modal => {
                modal.classList.remove('active');
                closedAModal = true;
            });
            if (closedAModal) {
                 manageBodyScroll(false);
            }
        }
    });
});