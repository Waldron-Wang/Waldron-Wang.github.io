const canvas = document.getElementById('hero-canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particlesArray = [];
let mouse = { x: null, y: null };

window.addEventListener('mousemove', (event) => {
    mouse.x = event.x;
    mouse.y = event.y;
});

class Particle {
    constructor(x, y, size, speedX, speedY) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speedX = speedX;
        this.speedY = speedY;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.size > 0.2) this.size -= 0.01;
    }
    draw() {
        ctx.fillStyle = 'rgba(0, 229, 255, 0.5)'; // Accent color
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function handleParticles() {
    if (mouse.x != null && mouse.y != null) {
        particlesArray.push(new Particle(mouse.x, mouse.y, Math.random() * 3 + 1, Math.random() * 2 - 1, Math.random() * 2 - 1));
    }
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
        if (particlesArray[i].size <= 0.2) {
            particlesArray.splice(i, 1);
            i--;
        }
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    handleParticles();
    requestAnimationFrame(animate);
}

animate();

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// --- Card Coverflow Effect ---
const scrollContainer = document.querySelector('.scroll-cards');
const cards = document.querySelectorAll('.card');

function updateCardsFocus() {
    if (!scrollContainer || cards.length === 0) return;

    // Find the exact center X-coordinate of the scroll container
    const containerCenter = scrollContainer.getBoundingClientRect().left + (scrollContainer.offsetWidth / 2);

    cards.forEach(card => {
        // Find the center X-coordinate of the individual card
        const cardCenter = card.getBoundingClientRect().left + (card.offsetWidth / 2);
        
        // Calculate absolute distance from the container's center
        const distance = Math.abs(containerCenter - cardCenter);
        
        // Define the maximum distance before the card is completely faded/shrunk
        // Half the container width is usually a good threshold
        const maxDistance = scrollContainer.offsetWidth / 2;
        
        // Calculate a ratio from 0 to 1 (1 means it is perfectly centered, 0 means it is at the edge)
        let ratio = 1 - (distance / maxDistance);
        if (ratio < 0) ratio = 0; // Clamp the value so it doesn't go negative

        // Interpolate the Scale and Opacity based on the ratio
        // Scale maps from 0.85 (edges) to 1.05 (center)
        const scale = 0.85 + (0.20 * ratio);
        
        // Opacity maps from 0.4 (edges) to 1.0 (center)
        const opacity = 0.4 + (0.6 * ratio);

        // Apply the dynamic styles
        card.style.transform = `scale(${scale})`;
        card.style.opacity = opacity;
        
        // Ensure the middle card is always layered on top
        card.style.zIndex = Math.round(ratio * 10);
    });
}

// Attach the function to scroll and resize events
scrollContainer.addEventListener('scroll', updateCardsFocus);
window.addEventListener('resize', updateCardsFocus);

// Trigger immediately on load to set the initial states
updateCardsFocus();