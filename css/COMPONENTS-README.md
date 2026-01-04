# BrightAI Unified Components

## Overview

This document describes the unified component system created in Phase 3 Batch 3.

## Files Created

- `css/components.css` - Unified component styles for navbar, footer, cards, forms, modals

## Component Patterns

### 1. Navbar Component

**Unified Pattern (Recommended):**
```html
<nav class="navbar" aria-label="القائمة الرئيسية">
    <div class="navbar-container">
        <a href="index.html" class="logo">
            <img src="logo.png" alt="شعار Bright AI" height="55">
        </a>
        <ul class="nav-links" role="menubar">
            <li role="none"><a role="menuitem" href="index.html">الرئيسية</a></li>
            <!-- More links -->
        </ul>
        <button class="hamburger" aria-label="فتح القائمة" aria-expanded="false">
            <i class="fas fa-bars"></i>
        </button>
    </div>
</nav>
<div class="overlay"></div>
```

**Pages Using Unified Pattern:**
- `index.html` ✅
- `ai-bots.html` ✅
- `health-bright.html` ✅
- `consultation.html` ✅
- `ai-agent.html` ✅

**Pages Using Legacy Pattern (Simple `<ul class="navbar">`):**
- `data-analysis.html`
- `smart-automation.html`
- `our-products.html`
- `blog.html`
- `nlp.html`
- `machine.html`
- `about-us.html`
- `article_*.html` files
- Various other secondary pages

### 2. Footer Component

**Unified Pattern:**
```html
<footer class="footer">
    <div class="footer-content">
        <div class="footer-section">
            <h3>Bright AI</h3>
            <p>Description text</p>
        </div>
        <div class="footer-section">
            <h3>روابط سريعة</h3>
            <ul class="footer-links">
                <li><a href="#">Link</a></li>
            </ul>
        </div>
        <div class="footer-section">
            <h3>تواصل معنا</h3>
            <div class="social-links">
                <a href="#"><i class="fab fa-whatsapp"></i></a>
            </div>
        </div>
    </div>
    <div class="footer-bottom">
        <p>© 2025 Bright AI - جميع الحقوق محفوظة</p>
    </div>
</footer>
```

### 3. Card Components

**Glass Card:**
```html
<div class="glass-card">
    <h3>Title</h3>
    <p>Content</p>
</div>
```

**Service Card:**
```html
<div class="service-card">
    <i class="fas fa-icon"></i>
    <h3>Service Title</h3>
    <p>Service description</p>
</div>
```

**Stat Card:**
```html
<div class="stat-card">
    <span class="stat-number">150+</span>
    <span class="stat-label">مشروع ناجح</span>
</div>
```

**Testimonial Card:**
```html
<div class="testimonial-card">
    <p class="testimonial-text">"Quote text"</p>
    <div class="testimonial-author">
        <span class="author-name">Name</span>
        <span class="author-title">Title</span>
    </div>
</div>
```

### 4. Form Components

```html
<div class="form-group">
    <label for="name">الاسم</label>
    <input type="text" id="name" class="form-input" required>
    <span class="form-error">Error message</span>
</div>
```

### 5. CTA Buttons

See `cta-buttons.css` for full documentation.

```html
<a href="#" class="cta-primary cta-lg">Primary CTA</a>
<a href="#" class="cta-secondary">Secondary CTA</a>
<a href="#" class="cta-urgency">Urgency CTA</a>
<a href="#" class="cta-trust">Trust CTA</a>
```

## CSS Import Order

For pages using the unified system:

```html
<link rel="stylesheet" href="css/design-tokens.css">
<link rel="stylesheet" href="css/components.css">
<link rel="stylesheet" href="style.css">
<!-- Page-specific CSS -->
```

Or simply include `style.css` which imports both:

```html
<link rel="stylesheet" href="style.css">
```

## Migration Notes

### Phase 3 Batch 3 Changes

1. Created `css/components.css` with unified component styles
2. Updated `style.css` to import `components.css`
3. No HTML changes made (preserving existing behavior)

### Future Migration (Phase 4+)

Pages with legacy navbar patterns should be migrated to the unified pattern when:
- Content updates are needed
- SEO changes are required
- Accessibility improvements are made

**Important:** Do NOT change `<title>` or `<meta name="description">` during migration.

## Accessibility Features

All components include:
- ARIA labels and roles
- Focus visible states
- Keyboard navigation support
- Touch target minimums (44px)
- Reduced motion support
- Screen reader support

## Theme Support

Components support:
- Dark theme (default)
- Light theme (`[data-theme="light"]`)
- Print styles
- Reduced motion preferences
