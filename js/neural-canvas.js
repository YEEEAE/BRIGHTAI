/**
 * Bright AI - Neural Canvas Animation
 * ========================================
 * Animated particle network background
 */

(function() {
  const canvas = document.getElementById('neural-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  const particleCount = 60;
  const connectionDistance = 150;
  const mouse = { x: null, y: null };

  // Resize canvas to fill window
  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  // Particle class
  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.size = Math.random() * 1.5 + 0.5;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Bounce off edges
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;

      // Mouse interaction
      if (mouse.x != null) {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx*dx + dy*dy);
        
        if (distance < 200) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const force = (200 - distance) / 200;
          
          this.vx += forceDirectionX * force * 0.02;
          this.vy += forceDirectionY * force * 0.02;
        }
      }
    }

    draw() {
      ctx.fillStyle = 'rgba(99, 102, 241, 0.5)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Initialize particles
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  // Animation loop
  function animateCanvas() {
    ctx.clearRect(0, 0, width, height);

    // Update and draw particles first
    particles.forEach(p => {
      p.update();
      p.draw();
    });

    // Draw connections - Optimized loop O(N^2)/2
    for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            let dx = p1.x - p2.x;
            let dy = p1.y - p2.y;
            let dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < connectionDistance) {
                ctx.strokeStyle = `rgba(99, 102, 241, ${0.1 * (1 - dist/connectionDistance)})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    }

    requestAnimationFrame(animateCanvas);
  }

  // Start animation
  animateCanvas();

  // Track mouse position
  window.addEventListener('mousemove', e => {
    mouse.x = e.x;
    mouse.y = e.y;
  });

  // Reset mouse position when leaving window
  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });
})();
