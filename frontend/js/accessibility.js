// /frontend/js/accessibility.js
document.addEventListener('DOMContentLoaded', () => {
    // === Font Scaling Logic (Accessibility) ===
    const root = document.documentElement;
    const maxScale = 1.25;
    const minScale = 0.85;
    const scaleStep = 0.05;

    // Load existing preference
    let currentScale = localStorage.getItem('brightai_font_scale') ? parseFloat(localStorage.getItem('brightai_font_scale')) : 1;

    const applyScale = (scale) => {
        root.style.fontSize = `${scale * 100}%`;
        localStorage.setItem('brightai_font_scale', scale);
        updateActiveState();
    };

    const increaseBtn = document.getElementById('increaseFontBtn');
    const decreaseBtn = document.getElementById('decreaseFontBtn');
    const resetBtn = document.getElementById('resetFontBtn');

    if (increaseBtn) {
        increaseBtn.addEventListener('click', () => {
            if (currentScale < maxScale) {
                currentScale += scaleStep;
                applyScale(currentScale);
            }
        });
    }

    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', () => {
            if (currentScale > minScale) {
                currentScale -= scaleStep;
                applyScale(currentScale);
            }
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            currentScale = 1;
            applyScale(currentScale);
        });
    }

    function updateActiveState() {
        const activeClass = ['bg-indigo-600', 'text-white'];

        [increaseBtn, decreaseBtn, resetBtn].forEach(btn => {
            if (btn) btn.classList.remove(...activeClass);
        });

        if (currentScale > 1.01 && increaseBtn) {
            increaseBtn.classList.add(...activeClass);
        } else if (currentScale < 0.99 && decreaseBtn) {
            decreaseBtn.classList.add(...activeClass);
        } else if (resetBtn) {
            resetBtn.classList.add(...activeClass);
        }
    }

    // Initialize state
    applyScale(currentScale);

    // === Theme Toggle Logic ===
    const themeToggleBtn = document.getElementById('themeToggleBtn');

    // Check saved theme or system preference
    const savedTheme = localStorage.getItem('brightai_theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        updateThemeIcon('light');
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isLight = document.body.classList.toggle('light-theme');
            const newTheme = isLight ? 'light' : 'dark';
            localStorage.setItem('brightai_theme', newTheme);
            updateThemeIcon(newTheme);
        });
    }

    function updateThemeIcon(theme) {
        if (!themeToggleBtn) return;
        const icon = themeToggleBtn.querySelector('iconify-icon');
        if (icon) {
            if (theme === 'light') {
                icon.setAttribute('icon', 'lucide:sun');
            } else {
                icon.setAttribute('icon', 'lucide:moon');
            }
        }
    }
});
