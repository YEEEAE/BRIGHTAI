/**
 * AIParticleSystem - Reusable Canvas Particle System
 * Supports neural network style connections and mouse interaction
 */

export class AIParticleSystem {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.warn(`Canvas element with ID '${canvasId}' not found.`);
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.width = 0;
        this.height = 0;
        this.mouse = { x: null, y: null };
        this.animationId = null;

        // Configuration
        this.config = {
            particleCount: options.particleCount || 100,
            connectionDistance: options.connectionDistance || 150,
            particleColor: options.particleColor || 'rgba(99, 102, 241, 0.5)',
            lineColor: options.lineColor || 'rgba(99, 102, 241, 0.1)',
            speed: options.speed || 0.5,
            interactive: options.interactive !== false // Default true
        };

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        if (this.config.interactive) {
            this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
        }

        this.createParticles();
        this.animate();
    }

    resize() {
        const parent = this.canvas.parentElement;
        this.width = this.canvas.width = parent.clientWidth;
        this.height = this.canvas.height = parent.clientHeight;
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
    }

    handleMouseLeave() {
        this.mouse.x = null;
        this.mouse.y = null;
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.config.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * this.config.speed,
                vy: (Math.random() - 0.5) * this.config.speed,
                size: Math.random() * 2 + 1
            });
        }
    }

    update() {
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            // Bounce off edges
            if (p.x < 0 || p.x > this.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.height) p.vy *= -1;

            // Mouse interaction
            if (this.mouse.x !== null) {
                const dx = this.mouse.x - p.x;
                const dy = this.mouse.y - p.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 200) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (200 - distance) / 200;

                    // Gentle push/pull
                    p.vx += forceDirectionX * force * 0.05;
                    p.vy += forceDirectionY * force * 0.05;
                }
            }
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw connections
        this.ctx.strokeStyle = this.config.lineColor;
        this.ctx.lineWidth = 1;

        for (let i = 0; i < this.particles.length; i++) {
            const p1 = this.particles[ i ];

            // Draw particle
            this.ctx.fillStyle = this.config.particleColor;
            this.ctx.beginPath();
            this.ctx.arc(p1.x, p1.y, p1.size, 0, Math.PI * 2);
            this.ctx.fill();

            // Connect to nearby particles
            for (let j = i + 1; j < this.particles.length; j++) {
                const p2 = this.particles[ j ];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < this.config.connectionDistance) {
                    this.ctx.globalAlpha = 1 - (dist / this.config.connectionDistance);
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                    this.ctx.globalAlpha = 1;
                }
            }
        }
    }

    animate() {
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        window.removeEventListener('resize', () => this.resize());
    }
}
