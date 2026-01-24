/**
 * BrightAI Design System Interactions
 * Handles dynamic effects like mouse tracking glow and component interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    // Glass Card Glow Effect
    const handleGlowEffect = () => {
        // Select all card types that should have the glow effect
        const cards = document.querySelectorAll('.glass-card, .service-card, .feature-card, .stat-card, .card');

        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                // Set custom properties for the gradient position
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            });

            // Optional: Reset or keep the last position on mouse leave
            // card.addEventListener('mouseleave', () => {
            //     card.style.removeProperty('--mouse-x');
            //     card.style.removeProperty('--mouse-y');
            // });
        });
    };

    // Initialize glow effect
    handleGlowEffect();

    // Re-initialize when new content might be added (basic observer)
    // For more complex apps, you might want to call handleGlowEffect() manually after DOM updates
    const observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                shouldUpdate = true;
            }
        });
        if (shouldUpdate) {
            handleGlowEffect();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
});
