# Design Document: Buttons & Navigation Optimization

## Overview

هذا التصميم يحدد كيفية تحسين الأزرار والتنقل في موقع BrightAI لضمان:
- استخدام HTML الدلالي الصحيح (Semantic HTML)
- قابلية الوصول الكاملة (WCAG 2.1 AA)
- تحسين محركات البحث (SEO)
- تجربة مستخدم متسقة عبر جميع الصفحات

## Architecture

### Button Classification

```
┌─────────────────────────────────────────────────────────────┐
│                    Button Types                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │ Navigation      │    │ Action          │                 │
│  │ Buttons         │    │ Buttons         │                 │
│  │                 │    │                 │                 │
│  │ <a href="...">  │    │ <button>        │                 │
│  │                 │    │                 │                 │
│  │ • CTA Links     │    │ • Buy Buttons   │                 │
│  │ • Menu Links    │    │ • Modal Triggers│                 │
│  │ • Footer Links  │    │ • Form Submits  │                 │
│  └─────────────────┘    └─────────────────┘                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Decision Tree for Button Type

```
┌─────────────────────────────────────────┐
│ Does the button navigate to a new page? │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
       YES                      NO
        │                       │
        ▼                       ▼
┌───────────────┐      ┌───────────────────────┐
│ Use <a> tag   │      │ Does it submit a form?│
│ with href     │      └───────────────────────┘
└───────────────┘               │
                    ┌───────────┴───────────┐
                    │                       │
                   YES                      NO
                    │                       │
                    ▼                       ▼
           ┌───────────────┐      ┌───────────────┐
           │ Use <button   │      │ Use <button   │
           │ type="submit">│      │ type="button">│
           └───────────────┘      └───────────────┘
```

## Components and Interfaces

### 1. Navigation Button Component

```html
<!-- ✅ Correct: Navigation CTA -->
<a href="our-products.html" 
   class="cta-secondary cta-lg" 
   aria-label="اكتشف حلول مُشرقة AI المبتكرة">
    <span>اكتشف حلول الذكاء الاصطناعي</span>
    <i class="fas fa-arrow-left" aria-hidden="true"></i>
</a>

<!-- ❌ Wrong: Using button for navigation -->
<button onclick="window.location='our-products.html'">
    اكتشف حلول الذكاء الاصطناعي
</button>
```

### 2. Action Button Component

```html
<!-- ✅ Correct: Action Button -->
<button type="button" 
        class="buy-button" 
        aria-label="شراء خدمة تحليل البيانات"
        data-product-id="data-1">
    <i class="fas fa-shopping-cart" aria-hidden="true"></i>
    شراء الآن
</button>

<!-- ✅ Correct: Modal Trigger -->
<button type="button" 
        class="details-button" 
        aria-haspopup="dialog"
        aria-expanded="false"
        aria-controls="details-modal-1"
        data-target="details-data-1">
    <i class="fas fa-info-circle" aria-hidden="true"></i>
    تفاصيل المنتج
</button>
```

### 3. WhatsApp CTA Component

```html
<!-- ✅ Correct: WhatsApp Link -->
<a href="https://wa.me/966538229013" 
   class="cta-primary cta-lg"
   target="_blank"
   rel="noopener noreferrer"
   aria-label="تواصل معنا عبر واتساب للحصول على استشارة مجانية">
    <i class="fab fa-whatsapp" aria-hidden="true"></i>
    <span>احصل على استشارة مجانية</span>
</a>
```

## Data Models

### Button State Model

```javascript
// Button states for CSS classes
const ButtonStates = {
    DEFAULT: '',
    HOVER: ':hover',
    FOCUS: ':focus-visible',
    ACTIVE: ':active',
    DISABLED: ':disabled',
    LOADING: '.is-loading'
};

// Required attributes by button type
const RequiredAttributes = {
    navigation: ['href', 'aria-label'],
    action: ['type', 'aria-label'],
    modal: ['type', 'aria-haspopup', 'aria-expanded', 'aria-controls'],
    icon_only: ['aria-label']
};
```

### CSS Variables for Buttons

```css
:root {
    /* Touch Target */
    --button-min-size: 44px;
    --button-spacing: 8px;
    
    /* Focus Indicator */
    --focus-outline-width: 3px;
    --focus-outline-color: #64FFDA;
    --focus-outline-offset: 2px;
    
    /* Transitions */
    --button-transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Navigation Uses Semantic Anchors

*For any* element that navigates to another page, it SHALL be an `<a>` element with a valid `href` attribute, not a `<button>` with JavaScript navigation.

**Validates: Requirements 1.1, 1.2, 1.3, 6.1**

### Property 2: Action Buttons Use Button Elements

*For any* element that performs an action (not navigation), it SHALL be a `<button>` element with `type="button"` attribute.

**Validates: Requirements 2.1, 2.2**

### Property 3: Buttons Have Accessible Text

*For any* button element, it SHALL have either visible text content OR an `aria-label` attribute with descriptive text.

**Validates: Requirements 2.4, 2.5**

### Property 4: Icons Are Hidden from Screen Readers

*For any* icon element (`<i>` or `<svg>`) inside a button, it SHALL have `aria-hidden="true"` attribute.

**Validates: Requirements 5.2**

### Property 5: Touch Targets Meet Minimum Size

*For any* interactive button on mobile viewport, it SHALL have minimum dimensions of 44x44 pixels.

**Validates: Requirements 4.1, 4.2**

### Property 6: No Generic Anchor Text

*For any* navigation link, the anchor text SHALL NOT be generic phrases like "اضغط هنا", "المزيد", "هنا", or "click here".

**Validates: Requirements 6.2**

### Property 7: WhatsApp Links Use Correct Format

*For any* link to WhatsApp, the `href` SHALL match the pattern `https://wa.me/[phone-number]`.

**Validates: Requirements 6.3**

### Property 8: No Duplicate Button IDs

*For any* button element with an `id` attribute, that ID SHALL be unique across the entire page.

**Validates: Requirements 9.3**

### Property 9: Modal Buttons Have ARIA Attributes

*For any* button that opens a modal, it SHALL have `aria-haspopup="dialog"` and `aria-expanded` attributes.

**Validates: Requirements 2.3, 5.3**

### Property 10: Buttons Are Keyboard Focusable

*For any* visible interactive button, it SHALL NOT have `tabindex="-1"` and SHALL be reachable via Tab key.

**Validates: Requirements 3.1, 3.6**

## Error Handling

### Missing Attributes

```javascript
// Validation function for button attributes
function validateButton(button) {
    const errors = [];
    
    // Check for accessible name
    const hasText = button.textContent.trim().length > 0;
    const hasAriaLabel = button.hasAttribute('aria-label');
    
    if (!hasText && !hasAriaLabel) {
        errors.push('Button missing accessible name');
    }
    
    // Check for type attribute on <button>
    if (button.tagName === 'BUTTON' && !button.hasAttribute('type')) {
        errors.push('Button missing type attribute');
    }
    
    return errors;
}
```

### Fallback for JavaScript-Disabled Users

```html
<!-- Progressive enhancement: works without JS -->
<a href="consultation.html" class="cta-primary">
    احصل على استشارة مجانية
</a>

<!-- Enhanced with JS for tracking -->
<script>
document.querySelector('.cta-primary').addEventListener('click', (e) => {
    // Track click event
    gtag('event', 'cta_click', { button_text: e.target.textContent });
});
</script>
```

## Testing Strategy

### Unit Tests

Unit tests verify specific examples and edge cases:

1. **Button Attribute Tests**
   - Test that navigation buttons have `href`
   - Test that action buttons have `type="button"`
   - Test that icon-only buttons have `aria-label`

2. **Accessibility Tests**
   - Test focus indicator visibility
   - Test keyboard navigation order
   - Test screen reader announcements

### Property-Based Tests

Property tests verify universal properties across all inputs using **fast-check** library:

1. **Property 1 Test**: Scan all elements with navigation behavior, verify they use `<a>` tags
2. **Property 3 Test**: Scan all buttons, verify accessible text exists
3. **Property 6 Test**: Scan all anchor texts, verify no generic phrases
4. **Property 8 Test**: Collect all button IDs, verify uniqueness

### Test Configuration

```javascript
// vitest.config.js
export default {
    test: {
        // Minimum 100 iterations for property tests
        iterations: 100,
        // Tag format for traceability
        reporters: ['default'],
    }
};
```

### Test Annotation Format

```javascript
/**
 * Feature: buttons-navigation-optimization
 * Property 1: Navigation Uses Semantic Anchors
 * Validates: Requirements 1.1, 1.2, 1.3, 6.1
 */
test.prop([fc.array(fc.string())], 'navigation elements use anchor tags', (elements) => {
    // Property test implementation
});
```

## Files to Modify

| File | Changes |
|------|---------|
| `our-products.html` | Add `type="button"` to product buttons, verify aria-labels |
| `index.html` | Verify CTA buttons use correct semantic elements |
| `cta-buttons.css` | Ensure focus states and touch targets |
| `our-products.js` | Update event handlers for accessibility |
| `style.css` | Add/verify focus indicator styles |

## Implementation Notes

1. **لا تغيير في التصميم**: جميع التغييرات تقنية فقط، لا تؤثر على المظهر
2. **لا مكتبات خارجية**: استخدام HTML/CSS/JS الأصلي فقط
3. **التوافق مع المتصفحات**: دعم Chrome, Safari, Firefox, Edge
4. **الأداء**: لا تأثير على Core Web Vitals
