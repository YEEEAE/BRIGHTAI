// GSAP Animations System
// Ensure GSAP and ScrollTrigger are loaded before this script

document.addEventListener('DOMContentLoaded', () => {
    if (typeof gsap !== 'undefined') {
        // Initialize ScrollTrigger if available
        if (typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }

        console.log('GSAP Animations System initialized');

        // Export common animation functions to window for global use
        window.BrightAnimations = {
            fadeInUp: (element, delay = 0) => {
                gsap.from(element, {
                    y: 30,
                    opacity: 0,
                    duration: 0.8,
                    delay: delay,
                    ease: "power3.out"
                });
            },

            staggerChildren: (parent, childSelector, delay = 0.1) => {
                const children = parent.querySelectorAll(childSelector);
                gsap.from(children, {
                    y: 20,
                    opacity: 0,
                    duration: 0.6,
                    stagger: delay,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: parent,
                        start: "top 80%"
                    }
                });
            }
        };
    } else {
        console.warn('GSAP not loaded');
    }
});
