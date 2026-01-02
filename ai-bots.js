document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 100, // Adjusted for potential fixed header
                    behavior: 'smooth'
                });
            }
        });
    });

    // Simple testimonial slider functionality
    const testimonials = document.querySelectorAll('.testimonial');
    let currentTestimonial = 0;
    let testimonialInterval;
    
    function showTestimonial(index) {
        testimonials.forEach((testimonial, i) => {
            testimonial.style.display = (i === index) ? 'block' : 'none';
        });
    }

    function nextTestimonial() {
        currentTestimonial = (currentTestimonial + 1) % testimonials.length;
        showTestimonial(currentTestimonial);
    }

    function initSlider() {
        if (window.innerWidth <= 768 && testimonials.length > 1) {
            showTestimonial(currentTestimonial); // Show the first one initially
            if (testimonialInterval) clearInterval(testimonialInterval); // Clear existing interval
            testimonialInterval = setInterval(nextTestimonial, 5000);
        } else {
            // If not mobile or not enough testimonials, show all and clear interval
            testimonials.forEach(testimonial => {
                testimonial.style.display = 'block';
            });
            if (testimonialInterval) clearInterval(testimonialInterval);
        }
    }
    
    // Initialize slider on load if needed
    if (testimonials.length > 0) { // Only run if testimonials exist
      initSlider();
    }
        
    // Reinitialize on window resize
    window.addEventListener('resize', () => {
      if (testimonials.length > 0) {
        initSlider();
      }
    });
    
    // Add animation to bot cards when they come into view
    const botCards = document.querySelectorAll('.bot-card');
    const advantageCards = document.querySelectorAll('.advantage-card');
    
    // Simple function to check if element is in viewport
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.bottom >= 0 &&
            rect.left <= (window.innerWidth || document.documentElement.clientWidth) &&
            rect.right >= 0
        );
    }
    
    // Function to add animation class when element is in viewport
    function animateOnScroll() {
        // Animate bot cards
        botCards.forEach(card => {
            if (isInViewport(card)) {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }
        });
        
        // Animate advantage cards
        advantageCards.forEach(card => {
            if (isInViewport(card)) {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }
        });
    }
    
    // Set initial styles for animation
    [...botCards, ...advantageCards].forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });
    
    // Add staggered delay to cards for better visual effect
    botCards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.1}s`;
    });
    
    advantageCards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.1}s`;
    });
    
    // Run animation check on load and scroll
    window.addEventListener('load', animateOnScroll);
    window.addEventListener('scroll', animateOnScroll);
    // Initial check in case elements are already in view
    animateOnScroll(); 
});