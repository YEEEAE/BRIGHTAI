/**
 * BrightAI Particle System
 * An animated background system displaying connected floating particles
 * with AI brand colors (purple, pink, blue gradients)
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7, 25.11
 */

// AI Brand Color Palette (purple, pink, blue gradients)
const AI_BRAND_COLORS = [
    '#667eea', // Purple
    '#764ba2', // Deep Purple
    '#f093fb', // Pink
    '#f5576c', // Coral Pink
    '#4facfe', // Light Blue
    '#00f2fe', // Cyan
    '#64FFDA'  // Teal (BrightAI primary)
];

/**
 * Particle class representing a single particle in the system
 */
class Particle {
    /**
     * @param {number} canvasWidth - Width of the canvas
     * @param {number} canvasHeight - Height of the canvas
     */
    constructor(canvasWidth, canvasHeight) {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.size = Math.random() * 3 + 1; // Size between 1-4px
        this.speedX = (Math.random() - 0.5) * 0.5; // Velocity X
        this.speedY = (Math.random() - 0.5) * 0.5; // Velocity Y
        this.color = AI_BRAND_COLORS[Math.floor(Math.random() * AI_BRAND_COLORS.length)];
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
    }

    /**
     * Update particle position
     */
    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Bounce off edges
        if (this.x < 0 || this.x > this.canvasWidth) {
            this.speedX *= -1;
        }
        if (this.y < 0 || this.y > this.canvasHeight) {
            this.speedY *= -1;
        }

        // Keep within bounds
        this.x = Math.max(0, Math.min(this.canvasWidth, this.x));
        this.y = Math.max(0, Math.min(this.canvasHeight, this.y));
    }

    /**
     * Draw particle on canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
     */
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

/**
 * ParticleSystem class managing all particles and their connections
 */
class ParticleSystem {
    /**
     * @param {string} canvasId - ID of the canvas element
     * @param {Object} options - Configuration options
     */
    constructor(canvasId, options = {}) {
        this.canvasId = canvasId;
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animationId = null;
        this.isRunning = false;
        this.isInitialized = false;
        
        // Configuration with defaults
        this.connectionDistance = options.connectionDistance || 120;
        this.desktopParticleCount = options.desktopParticleCount || 80;
        this.mobileParticleCount = options.mobileParticleCount || 30;
        this.mobileBreakpoint = options.mobileBreakpoint || 768;
        
        // Bind methods
        this.animate = this.animate.bind(this);
        this.handleResize = this.handleResize.bind(this);
    }

    /**
     * Check if reduced motion is preferred
     * @returns {boolean}
     */
    static prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /**
     * Check if viewport is mobile
     * @returns {boolean}
     */
    isMobile() {
        return window.innerWidth < this.mobileBreakpoint;
    }

    /**
     * Get particle count based on viewport
     * @returns {number}
     */
    getParticleCount() {
        return this.isMobile() ? this.mobileParticleCount : this.desktopParticleCount;
    }

    /**
     * Initialize the particle system
     * @returns {boolean} - Whether initialization was successful
     */
    init() {
        // Check for reduced motion preference
        if (ParticleSystem.prefersReducedMotion()) {
            console.log('ParticleSystem: Reduced motion preferred, skipping animation');
            return false;
        }

        this.canvas = document.getElementById(this.canvasId);
        if (!this.canvas || !(this.canvas instanceof HTMLCanvasElement)) {
            console.warn('ParticleSystem: Canvas element not found:', this.canvasId);
            return false;
        }

        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.warn('ParticleSystem: 2D context not supported');
            return false;
        }

        // Set canvas dimensions
        this.updateCanvasDimensions();

        // Initialize particles
        this.initParticles();

        // Add resize listener
        window.addEventListener('resize', this.handleResize);

        this.isInitialized = true;
        return true;
    }

    /**
     * Update canvas dimensions to match container
     */
    updateCanvasDimensions() {
        if (!this.canvas) return;
        
        const container = this.canvas.parentElement;
        if (container) {
            this.canvas.width = container.offsetWidth || window.innerWidth;
            this.canvas.height = container.offsetHeight || window.innerHeight;
        } else {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
    }

    /**
     * Initialize particles array
     */
    initParticles() {
        this.particles = [];
        const count = this.getParticleCount();
        
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(this.canvas.width, this.canvas.height));
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        if (!this.canvas) return;
        
        this.updateCanvasDimensions();
        
        // Update particle bounds and reinitialize if count changed
        const newCount = this.getParticleCount();
        if (this.particles.length !== newCount) {
            this.initParticles();
        } else {
            // Update existing particles' bounds
            this.particles.forEach(particle => {
                particle.canvasWidth = this.canvas.width;
                particle.canvasHeight = this.canvas.height;
                // Keep particles within new bounds
                particle.x = Math.min(particle.x, this.canvas.width);
                particle.y = Math.min(particle.y, this.canvas.height);
            });
        }
    }

    /**
     * Connect nearby particles with lines
     */
    connectParticles() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.connectionDistance) {
                    // Calculate opacity based on distance (closer = more opaque)
                    const opacity = 1 - (distance / this.connectionDistance);
                    
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(100, 255, 218, ${opacity * 0.3})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                }
            }
        }
    }

    /**
     * Animation loop
     */
    animate() {
        if (!this.isRunning || !this.ctx) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and draw particles
        this.particles.forEach(particle => {
            particle.update();
            particle.draw(this.ctx);
        });

        // Connect particles
        this.connectParticles();

        // Continue animation
        this.animationId = requestAnimationFrame(this.animate);
    }

    /**
     * Start the animation
     */
    start() {
        if (ParticleSystem.prefersReducedMotion()) {
            console.log('ParticleSystem: Reduced motion preferred, not starting animation');
            return;
        }

        if (!this.isInitialized) {
            if (!this.init()) {
                return;
            }
        }

        this.isRunning = true;
        this.animate();
    }

    /**
     * Stop the animation
     */
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Destroy the particle system and clean up
     */
    destroy() {
        this.stop();
        window.removeEventListener('resize', this.handleResize);
        this.particles = [];
        this.isInitialized = false;
    }
}


/**
 * Lazy initialization helper using IntersectionObserver
 * Starts particle animation only when hero section is visible
 * 
 * @param {string} canvasId - ID of the canvas element
 * @param {string} heroSectionId - ID of the hero section to observe
 * @param {Object} options - ParticleSystem options
 * @returns {ParticleSystem|null}
 */
function initParticleSystemLazy(canvasId, heroSectionId, options = {}) {
    // Check for reduced motion preference first
    if (ParticleSystem.prefersReducedMotion()) {
        console.log('ParticleSystem: Reduced motion preferred, skipping lazy init');
        return null;
    }

    let particleSystem = null;
    const heroSection = document.getElementById(heroSectionId);
    
    if (!heroSection) {
        console.warn('ParticleSystem: Hero section not found:', heroSectionId);
        return null;
    }

    // Create IntersectionObserver for lazy initialization
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Initialize and start particle system when hero is visible
                if (!particleSystem) {
                    particleSystem = new ParticleSystem(canvasId, options);
                    particleSystem.start();
                } else if (!particleSystem.isRunning) {
                    particleSystem.start();
                }
            } else {
                // Stop animation when hero is not visible (performance optimization)
                if (particleSystem && particleSystem.isRunning) {
                    particleSystem.stop();
                }
            }
        });
    }, {
        threshold: 0.1 // Trigger when 10% of hero is visible
    });

    observer.observe(heroSection);

    // Return a proxy object that provides access to the particle system
    return {
        getParticleSystem: () => particleSystem,
        destroy: () => {
            observer.disconnect();
            if (particleSystem) {
                particleSystem.destroy();
            }
        }
    };
}

/**
 * Initialize particle system after first paint
 * Uses requestIdleCallback or setTimeout fallback
 * 
 * @param {string} canvasId - ID of the canvas element
 * @param {string} heroSectionId - ID of the hero section
 * @param {Object} options - ParticleSystem options
 */
function initParticleSystemAfterPaint(canvasId, heroSectionId, options = {}) {
    // Check for reduced motion preference
    if (ParticleSystem.prefersReducedMotion()) {
        console.log('ParticleSystem: Reduced motion preferred, skipping init');
        return null;
    }

    const init = () => {
        return initParticleSystemLazy(canvasId, heroSectionId, options);
    };

    // Use requestIdleCallback if available, otherwise use setTimeout
    if ('requestIdleCallback' in window) {
        requestIdleCallback(init, { timeout: 2000 });
    } else {
        // Fallback: wait for first paint then initialize
        requestAnimationFrame(() => {
            setTimeout(init, 0);
        });
    }
}

// Export for module usage (if using ES modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Particle,
        ParticleSystem,
        AI_BRAND_COLORS,
        initParticleSystemLazy,
        initParticleSystemAfterPaint
    };
}

// Auto-initialize when DOM is ready (optional - can be disabled)
document.addEventListener('DOMContentLoaded', function() {
    // Check if particle canvas exists
    const particleCanvas = document.getElementById('particle-canvas');
    if (particleCanvas) {
        initParticleSystemAfterPaint('particle-canvas', 'home', {
            connectionDistance: 120,
            desktopParticleCount: 80,
            mobileParticleCount: 30,
            mobileBreakpoint: 768
        });
    }
});
