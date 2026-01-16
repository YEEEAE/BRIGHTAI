/**
 * Bright AI - Enterprise Hero Canvas Animation
 * خلفية Neural Network المتحركة للـ Hero Section
 * 
 * Features:
 * - Subtle neural network visualization
 * - Smooth, professional animation
 * - Performance optimized with requestAnimationFrame
 * - Supports prefers-reduced-motion
 * - Responsive canvas sizing
 * - Automatic cleanup on page unload
 */

class EnterpriseHeroCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.warn(`Canvas element with id "${canvasId}" not found`);
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.animationId = null;
        this.isRunning = false;
        this.prefersReducedMotion = false;
        
        // Configuration - Enterprise subtle style
        this.config = {
            nodeCount: 60,
            connectionDistance: 150,
            nodeSpeed: 0.3,
            nodeMinRadius: 1.5,
            nodeMaxRadius: 3,
            // Colors matching enterprise design tokens
            nodeColor: 'rgba(212, 175, 55, 0.4)',      // Gold subtle
            nodeGlowColor: 'rgba(212, 175, 55, 0.2)', // Gold glow
            lineColor: 'rgba(148, 163, 184, 0.08)',   // Slate subtle
            lineWidth: 0.5
        };
        
        this.init();
    }
    
    /**
     * Initialize the canvas animation
     */
    init() {
        // Check for reduced motion preference
        this.checkReducedMotion();
        
        // Set up canvas size
        this.resize();
        
        // Create initial nodes
        this.createNodes();
        
        // Start animation
        this.start();
        
        // Event listeners
        this.bindEvents();
    }
    
    /**
     * Check if user prefers reduced motion
     */
    checkReducedMotion() {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.prefersReducedMotion = mediaQuery.matches;
        
        // Listen for changes
        mediaQuery.addEventListener('change', (e) => {
            this.prefersReducedMotion = e.matches;
            if (this.prefersReducedMotion) {
                this.config.nodeSpeed = 0;
            } else {
                this.config.nodeSpeed = 0.3;
            }
        });
        
        // Set initial speed based on preference
        if (this.prefersReducedMotion) {
            this.config.nodeSpeed = 0;
        }
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Resize handler with debounce
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.resize(), 100);
        });
        
        // Visibility change - pause when tab is hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stop();
            } else {
                this.start();
            }
        });
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => this.destroy());
    }
    
    /**
     * Resize canvas to match container
     */
    resize() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // Set display size
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // Set actual size in memory (scaled for retina)
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        // Scale context to match
        this.ctx.scale(dpr, dpr);
        
        // Store dimensions for calculations
        this.width = rect.width;
        this.height = rect.height;
        
        // Recreate nodes for new dimensions
        if (this.nodes.length > 0) {
            this.createNodes();
        }
    }
    
    /**
     * Create network nodes
     */
    createNodes() {
        this.nodes = [];
        
        // Adjust node count based on screen size
        const area = this.width * this.height;
        const baseArea = 1920 * 1080;
        const adjustedCount = Math.floor(this.config.nodeCount * (area / baseArea));
        const nodeCount = Math.max(20, Math.min(adjustedCount, 80));
        
        for (let i = 0; i < nodeCount; i++) {
            this.nodes.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * this.config.nodeSpeed,
                vy: (Math.random() - 0.5) * this.config.nodeSpeed,
                radius: this.config.nodeMinRadius + 
                        Math.random() * (this.config.nodeMaxRadius - this.config.nodeMinRadius)
            });
        }
    }
    
    /**
     * Start the animation loop
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate();
    }
    
    /**
     * Stop the animation loop
     */
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    /**
     * Main animation loop
     */
    animate() {
        if (!this.isRunning) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw connections first (behind nodes)
        this.drawConnections();
        
        // Update and draw nodes
        this.updateNodes();
        this.drawNodes();
        
        // Continue animation
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    /**
     * Draw connections between nearby nodes
     */
    drawConnections() {
        const { connectionDistance, lineColor, lineWidth } = this.config;
        
        for (let i = 0; i < this.nodes.length; i++) {
            const nodeA = this.nodes[i];
            
            for (let j = i + 1; j < this.nodes.length; j++) {
                const nodeB = this.nodes[j];
                
                const dx = nodeA.x - nodeB.x;
                const dy = nodeA.y - nodeB.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < connectionDistance) {
                    // Calculate opacity based on distance
                    const opacity = (1 - distance / connectionDistance) * 0.15;
                    
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(148, 163, 184, ${opacity})`;
                    this.ctx.lineWidth = lineWidth;
                    this.ctx.moveTo(nodeA.x, nodeA.y);
                    this.ctx.lineTo(nodeB.x, nodeB.y);
                    this.ctx.stroke();
                }
            }
        }
    }
    
    /**
     * Update node positions
     */
    updateNodes() {
        for (const node of this.nodes) {
            // Update position
            node.x += node.vx;
            node.y += node.vy;
            
            // Bounce off edges with padding
            const padding = 10;
            
            if (node.x < padding || node.x > this.width - padding) {
                node.vx *= -1;
                node.x = Math.max(padding, Math.min(this.width - padding, node.x));
            }
            
            if (node.y < padding || node.y > this.height - padding) {
                node.vy *= -1;
                node.y = Math.max(padding, Math.min(this.height - padding, node.y));
            }
        }
    }
    
    /**
     * Draw all nodes
     */
    drawNodes() {
        const { nodeColor, nodeGlowColor } = this.config;
        
        for (const node of this.nodes) {
            // Draw glow
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.radius * 2, 0, Math.PI * 2);
            this.ctx.fillStyle = nodeGlowColor;
            this.ctx.fill();
            
            // Draw node
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = nodeColor;
            this.ctx.fill();
        }
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        this.stop();
        this.nodes = [];
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.width, this.height);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if canvas exists
    const canvas = document.getElementById('hero-canvas');
    if (canvas) {
        window.enterpriseHeroCanvas = new EnterpriseHeroCanvas('hero-canvas');
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnterpriseHeroCanvas;
}
