/**
 * BrightAI Button Issues Diagnostic Script
 * Run this in browser console to diagnose button click issues
 * 
 * Usage: Copy and paste this entire script into browser console
 */

(function() {
    console.log('=== BrightAI Button Diagnostic Tool ===\n');
    
    // 1. Check for overlays covering the page
    console.log('1. Checking for active overlays...');
    const overlays = document.querySelectorAll('.overlay, .nav-overlay, .modal-backdrop');
    overlays.forEach((overlay, i) => {
        const isActive = overlay.classList.contains('active');
        const style = window.getComputedStyle(overlay);
        const pointerEvents = style.pointerEvents;
        const visibility = style.visibility;
        const opacity = style.opacity;
        const zIndex = style.zIndex;
        
        console.log(`  Overlay ${i + 1}: ${overlay.className}`);
        console.log(`    - Active: ${isActive}`);
        console.log(`    - Visibility: ${visibility}`);
        console.log(`    - Opacity: ${opacity}`);
        console.log(`    - Pointer-events: ${pointerEvents}`);
        console.log(`    - Z-index: ${zIndex}`);
        
        if (isActive || (visibility !== 'hidden' && opacity !== '0' && pointerEvents !== 'none')) {
            console.warn(`    ⚠️ This overlay might be blocking clicks!`);
        }
    });
    
    // 2. Check CTA buttons
    console.log('\n2. Checking CTA buttons...');
    const ctaButtons = document.querySelectorAll('.cta-primary, .cta-secondary, .cta-button, .cta-button-accent');
    ctaButtons.forEach((btn, i) => {
        const href = btn.getAttribute('href');
        const style = window.getComputedStyle(btn);
        const pointerEvents = style.pointerEvents;
        const position = style.position;
        const zIndex = style.zIndex;
        
        console.log(`  Button ${i + 1}: "${btn.textContent.trim().substring(0, 30)}..."`);
        console.log(`    - Href: ${href}`);
        console.log(`    - Pointer-events: ${pointerEvents}`);
        console.log(`    - Position: ${position}`);
        console.log(`    - Z-index: ${zIndex}`);
        
        // Check ::before pseudo-element
        const beforeStyle = window.getComputedStyle(btn, '::before');
        const beforePointerEvents = beforeStyle.pointerEvents;
        console.log(`    - ::before pointer-events: ${beforePointerEvents}`);
        
        if (pointerEvents === 'none') {
            console.error(`    ❌ Button has pointer-events: none!`);
        }
        
        // Check if button is covered by another element
        const rect = btn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const elementAtPoint = document.elementFromPoint(centerX, centerY);
        
        if (elementAtPoint !== btn && !btn.contains(elementAtPoint)) {
            console.warn(`    ⚠️ Button might be covered by: ${elementAtPoint?.tagName} .${elementAtPoint?.className}`);
        }
    });
    
    // 3. Check for JavaScript errors
    console.log('\n3. Checking for JavaScript errors...');
    if (window.BrightAIUtils) {
        console.log('  ✓ BrightAIUtils loaded successfully');
    } else {
        console.error('  ❌ BrightAIUtils not loaded - this may cause errors!');
    }
    
    // 4. Check event listeners on buttons
    console.log('\n4. Testing button click behavior...');
    const testButton = document.querySelector('.cta-secondary[href="our-products.html"]');
    if (testButton) {
        console.log(`  Found test button: "${testButton.textContent.trim()}"`);
        console.log(`  Href: ${testButton.href}`);
        
        // Check if click is being prevented
        const originalPreventDefault = Event.prototype.preventDefault;
        let preventDefaultCalled = false;
        
        Event.prototype.preventDefault = function() {
            preventDefaultCalled = true;
            console.warn('  ⚠️ preventDefault() was called on this event!');
            return originalPreventDefault.apply(this, arguments);
        };
        
        // Simulate click
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        
        testButton.dispatchEvent(clickEvent);
        
        Event.prototype.preventDefault = originalPreventDefault;
        
        if (!preventDefaultCalled) {
            console.log('  ✓ No preventDefault called - button should work');
        }
    } else {
        console.log('  Test button not found on this page');
    }
    
    // 5. Summary
    console.log('\n=== Diagnostic Complete ===');
    console.log('If buttons still don\'t work, check:');
    console.log('1. Browser console for JavaScript errors');
    console.log('2. Network tab for failed resource loads');
    console.log('3. Clear browser cache and try again');
    
})();
