// Generate Stars with variety
function createStars() {
    const starsContainer = document.getElementById('stars');
    if (!starsContainer) return;
    const starCount = 150;
    
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        const size = Math.random() * 3 + 1;
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        star.style.animationDelay = Math.random() * 3 + 's';
        star.style.animationDuration = (Math.random() * 2 + 2) + 's';
        
        // Random colors for some stars
        const colors = ['#ffffff', '#00ff88', '#00d4ff', '#8b5cf6'];
        star.style.background = colors[Math.floor(Math.random() * colors.length)];
        
        starsContainer.appendChild(star);
    }
}

// Generate Particles with different sizes and colors
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    const particleCount = 40;
    const colors = ['#00ff88', '#00d4ff', '#8b5cf6', '#ffffff'];
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 12 + 's';
        particle.style.animationDuration = (Math.random() * 8 + 8) + 's';
        
        const size = Math.random() * 4 + 2;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.boxShadow = `0 0 ${size * 2}px ${particle.style.background}`;
        
        particlesContainer.appendChild(particle);
    }
}

// Typewriter Effect with better timing
function typeWriter() {
    const text = "نحول التحديات إلى فرص نمو عبر حلول ذكية تعيد صياغة مفاهيم الكفاءة والابتكار. نحن شريكك الاستراتيجي لصناعة مستقبل مستدام.";
    const element = document.getElementById('typewriter');
    if (!element) return;
    let i = 0;
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, 40);
        }
    }
    
    setTimeout(type, 1500);
}

// Generate Hexagon Network
function createHexNetwork() {
    const svg = document.getElementById('hexNetwork');
    if (!svg) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    
    // Create connection points
    const points = [];
    const numPoints = 30;
    
    for (let i = 0; i < numPoints; i++) {
        points.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5
        });
    }
    
    // Draw lines between nearby points
    function drawLines() {
        svg.innerHTML = '';
        
        points.forEach((point, i) => {
            // Update position
            point.x += point.vx;
            point.y += point.vy;
            
            // Bounce off edges
            if (point.x < 0 || point.x > width) point.vx *= -1;
            if (point.y < 0 || point.y > height) point.vy *= -1;
            
            // Draw connections
            points.forEach((other, j) => {
                if (i < j) {
                    const dist = Math.hypot(point.x - other.x, point.y - other.y);
                    if (dist < 200) {
                        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                        line.setAttribute('x1', point.x);
                        line.setAttribute('y1', point.y);
                        line.setAttribute('x2', other.x);
                        line.setAttribute('y2', other.y);
                        line.setAttribute('stroke', `rgba(0, 255, 136, ${0.15 * (1 - dist/200)})`);
                        line.setAttribute('stroke-width', '1');
                        svg.appendChild(line);
                    }
                }
            });
            
            // Draw point
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', point.x);
            circle.setAttribute('cy', point.y);
            circle.setAttribute('r', '2');
            circle.setAttribute('fill', 'rgba(0, 255, 136, 0.3)');
            svg.appendChild(circle);
        });
        
        requestAnimationFrame(drawLines);
    }
    
    drawLines();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    createStars();
    createParticles();
    typeWriter();
    createHexNetwork();
});

// Mouse Parallax Effect for Brain
let mouseX = 0, mouseY = 0;
let currentX = 0, currentY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 30;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 30;
});

function animateBrain() {
    currentX += (mouseX - currentX) * 0.05;
    currentY += (mouseY - currentY) * 0.05;
    
    const brain = document.querySelector('.brain-wrapper');
    if (brain) {
        brain.style.transform = `translateY(${-15 + currentY * 0.5}px) rotateX(${currentY * 0.3}deg) rotateY(${currentX * 0.3}deg)`;
    }
    
    requestAnimationFrame(animateBrain);
}

animateBrain();

// Resize handler for hex network
window.addEventListener('resize', () => {
    createHexNetwork();
});
