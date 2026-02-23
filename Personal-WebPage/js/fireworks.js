/**
 * Starter file for 01-23-01.js - the only exercise of page 8 of Workbook 2
 */

// @ts-check

// Find the canvas and start!

/**
 * Additional improvements:
 * 1. air resistance to slow down particles over time
 * 2. add bright white flashes randomly to particles to simulate burning
 * 3. a slider to control firework frequency
 * 4. add a secondary color (gold) to some particles for variety
 */
(() => {

const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById("fireworks-canvas"));
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 600; 
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Run immediately on load

// a list of colors to choose from
const colors = [
    "#FF5733", // Persimmon
    "#33FF57", // Screamin' Green
    "#3357FF", // Ultramarine Blue
    "#FF33A8", // Razzmatazz
    "#A833FF", // Electric Purple
    "#33FFF6", // Aquamarine
    "#FFC300", // Saffron
    "#FF6F33", // Coral
    "#8DFF33", // Lime Green
    "#FF33F6"  // Hot Pink
];

/**
 * Convert hex color (#RRGGBB) to rgba string with given alpha
 * @param {string} hex
 * @param {number} alpha
 */
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Mouse position
let mouseX = -10;
let mouseY = -10;

/** list of fireworks
 * Each firework: x: number, y: number, radius: number, color: string, alpha: number
 * targetX: number, targetY: number, hasExploded: boolean,
 * timeToTarget: number,
 * vx: number, vy: number, tailParticles: Array<{x:number,y:number,vx:number,vy:number,radius:number,color:string}>
 * @param {Array<object>} fireworks
 */
let fireworks = [];

let xmax = 0.4 // firework starting x can be between -canvas.width*xmax and +canvas.width*(1+xmax)

// Gravity constant
const gravity = 0.05;
const airResistance = 0.965; // air resistance factor

/**
 * a function to create a particle for given firework explosion
 * @param {number} x 
 * @param {number} y 
 * @param {string} color 
 * @returns 
 */
function createParticle(x, y, color) {
    let speed = Math.random() * 5 + 1; // between 1 and 6
    let angle = Math.random() * Math.PI * 2; // random direction
    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed;
    let radius = 1 + Math.random() * 1.5; // between 1 and 2.5
    return {
        x: x,
        y: y,
        vx: vx,
        vy: vy,
        radius: radius,
        color: color,
        alpha: 1.0,
        decay: 0.003 + Math.random() * 0.006 // Random fade speed
    };
}

/** 
 * a function to compute the starting position and velocity of a firewor
 * we randomize strating position and time that it takes to reach the click point
 * to make the travel look more natural
 * we need to set limits on the randomization of the time to reach the click point
 * @param {number} mouseX 
 * @param {number} mouseY
 */
function createFirework(mouseX, mouseY) {
    let x = canvas.width * (Math.random() * (1 + 2 * xmax) - xmax); // start between -xmax*width and (1+xmax)*width
    let y = canvas.height + 5; // start just below the canvas

    let targetX = mouseX;
    let targetY = mouseY;

    // 1. Calculate the actual physical distance to the target
    let dx = targetX - x;
    let dy = targetY - y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    // 2. Set a maximum flight speed (pixels per frame) to prevent tail gaps
    // A speed of 4 to 8 keeps the tail particles tightly packed together
    let flightSpeed = 4 + Math.random() * 4; 

    // 3. Time is now mathematically derived from distance and speed
    let timeToTarget = distance / flightSpeed;

    // 4. Clamp the minimum time so it doesn't explode instantly if clicked too close
    if (timeToTarget < 30) timeToTarget = 30;

    // compute velocities needed to reach target in given time
    let vx = (targetX - x) / timeToTarget;
    let vy = (targetY - y) / timeToTarget - 0.5 * gravity * timeToTarget;

    // random color
    let radius = 5;
    let alpha = Math.random() * 0.5 + 0.5; // between 0.5 and 1.0
    let color = colors[Math.floor(Math.random() * colors.length)];

    // Partical list is empty for now
    let particles = [];

    // create particles for explosion
    let numParticles = 50 + Math.floor(Math.random() * 200); // between 50 and 250 particles
    for (let i = 0; i < numParticles; i++) {
        // 10% chance to be White/Gold instead of the main color
        let particleColor = color;
        if (Math.random() < 0.1) {
            particleColor = "#FFD700";
        }
        particles.push(createParticle(targetX, targetY, particleColor));
    }

    fireworks.push({
        x: x,
        y: y,
        radius: radius,
        color: color,
        alpha: alpha,
        vx: vx,
        vy: vy,
        targetX: targetX,
        targetY: targetY,
        timeToTarget: timeToTarget,
        hasExploded: false,
        particles: particles,
        tailParticles: [] // initialize empty tail particles array
    });
}

/**
 * a function to create firework tail particles
 * to make the firework look like it has a tail while flying
 * the tail particles should follow the firework
 * their distance between each other should related to the firework speed
 * that is, when the firework is faster, the tail particles should be more spread out
 * their radius should decrease as they go further from the firework
 * their color should be the same as the firework color but with decreasing alpha
 * solution: mathematically calculate where the firework was in the previous 
 * frames and draw the tail along that actual curved path.
 * @param {object} firework the elements of fireworks array
 * @returns {Array<object>} tail particles
 */
function createFireworkTail(firework) {
    let tailParticles = [];
    const tailLength = 30; // Number of segments in the tail
    
    // We start at the firework's current position/velocity
    let simX = firework.x;
    let simY = firework.y;
    let simVx = firework.vx;
    let simVy = firework.vy;

    for (let i = 0; i < tailLength; i++) {
        // REVERSE PHYSICS: Go back in time
        // Undo Gravity
        simVy -= gravity; 
        // Undo Movement
        simX -= simVx;
        simY -= simVy;

        // Create a particle at this historical position
        tailParticles.push({
            x: simX,
            y: simY,
            // Radius shrinks as we go further back
            radius: firework.radius * (1 - (i / tailLength)), 
            // Alpha fades out
            color: hexToRgba(firework.color, firework.alpha * (1 - (i / tailLength)))
        });
    }
    firework.tailParticles = tailParticles;
}


canvas.onclick = function(event) {
    let box = /** @type {HTMLCanvasElement} */ (event.target).getBoundingClientRect();
    
    // Calculate the scaling ratio between the physical CSS size and the internal JS resolution
    let scaleX = canvas.width / box.width;
    let scaleY = canvas.height / box.height;

    // Apply the scale to the mouse coordinates
    mouseX = (event.clientX - box.left) * scaleX;
    mouseY = (event.clientY - box.top) * scaleY;

    createFirework(mouseX, mouseY);
}

// a parameter to control frequency of fireworks
let fireworkFrequency = 0.00; // probability of creating a firework each frame
let frequencySlider = /** @type {HTMLInputElement} */ (document.getElementById("fw-freq"));

if (frequencySlider) {
    frequencySlider.addEventListener("input", function() {
        fireworkFrequency = parseFloat(frequencySlider.value);
    });
}


let lastTime = 0;
function animate(timestamp) {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set background to black
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // use random to decide whether to create a new firework
    if (Math.random() < fireworkFrequency) {
        let randX = Math.random() * canvas.width;
        let randY = Math.random() * canvas.height * 0.5 + 0.25 * canvas.height; // between 0.25 and 0.75 height
        createFirework(randX, randY);
    }

    // because we initialize time to taeget to create fireworks
    // we can explode them when the fly time reaches time to target
    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    let framesElapsed = deltaTime / (1000 / 120); // assuming 120 fps for timing


    // Update and draw fireworks
    fireworks.forEach(function(firework) {
        if (firework.timeToTarget > 0) {
            firework.timeToTarget -= framesElapsed;
        }
        if (firework.timeToTarget <= 0 && !firework.hasExploded) {
            firework.hasExploded = true;
        }

        createFireworkTail(firework);

        if (!firework.hasExploded) {
            // continue moving towards target
            // Update position
            firework.x += firework.vx * framesElapsed;
            firework.y += firework.vy * framesElapsed;
            // Update velocity
            firework.vy += gravity * framesElapsed;

            // Create and draw tail particles
            let tail = firework.tailParticles;
            tail.forEach(part => {
                ctx.beginPath();
                ctx.arc(part.x, part.y, part.radius, 0, Math.PI * 2);
                ctx.fillStyle = part.color;
                ctx.fill();
            });

            // Draw firework
            ctx.beginPath();
            ctx.arc(firework.x, firework.y, firework.radius, 0, Math.PI * 2);
            ctx.fillStyle = hexToRgba(firework.color, firework.alpha);
            ctx.fill();

        } else {
            // Explode into particles
            firework.particles.forEach(function(particle) {
                // Update position
                particle.x += particle.vx * framesElapsed;
                particle.y += particle.vy * framesElapsed;
                // Update velocity
                particle.vy += gravity * framesElapsed;

                // air resistance
                particle.vx *= airResistance; // Slows down horizontal speed
                particle.vy *= airResistance; // Slows down vertical speed

                // Update alpha for fade out
                particle.alpha -= particle.decay * framesElapsed;

                // Only draw particle if it's still visible and within canvas
                if (particle.y <= canvas.height + 10) {
                    // Draw particle
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                    ctx.fillStyle = hexToRgba(particle.color, Math.max(particle.alpha, 0));

                    // 20% chance to draw pure white (simulates a bright burn)
                    // Otherwise draw the normal color with current alpha
                    if (Math.random() < 0.20) {
                        ctx.fillStyle = `rgba(255, 255, 255, ${particle.alpha})`;
                    } else {
                        ctx.fillStyle = hexToRgba(particle.color, particle.alpha);
                    }
                    ctx.fill();
                }
            });
            
        }
    });
    requestAnimationFrame(animate);
}

animate();

})();


// 2026 Workbook
