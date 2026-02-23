// somewhere in your program you'll want a line
// that looks like:
const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById("quadcopter-canvas"));
const context = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 600; 
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Run immediately on load

let text = "Use WASD to control the drone, press Space to fire.";
const infoDiv = document.createElement("div");
infoDiv.style.position = "absolute";
infoDiv.style.top = "10px";
infoDiv.style.left = "10px";
infoDiv.style.padding = "8px 12px";
infoDiv.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
infoDiv.style.borderRadius = "4px";
infoDiv.style.fontFamily = "Arial, sans-serif";
infoDiv.style.fontSize = "14px";
infoDiv.style.color = "#333";
infoDiv.textContent = text;
document.body.appendChild(infoDiv);

// use array to store quadcopter pbjects
let quadcopters = [];
const flightPatterns = [flyInCycle, flyInFigureEight, flyInBankedWeave, flyWithWASD];
const controlledDroneAnchor = { x: canvas.width * 0.5, y: canvas.height * 0.5 };
const projectileSpeed = 420;
let projectiles = [];
const keyState = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false
};

window.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
        event.preventDefault();
        if (!event.repeat) launchProjectile();
        return;
    }
    const key = event.key.toLowerCase();
    if (key in keyState) {
        keyState[key] = true;
    }
});

window.addEventListener("keyup", (event) => {
    const key = event.key.toLowerCase();
    if (key in keyState) {
        keyState[key] = false;
    }
});

let lastTime = 0;
let elapsedTime = 0;
// and you will want to make an animation loop with something like:
/**
 * the animation loop gets a timestamp from requestAnimationFrame
 * 
 * @param {DOMHighResTimeStamp} timestamp 
 */
function loop(timestamp) {
    const deltaTime = timestamp - lastTime; 
    const deltaSeconds = deltaTime / 1000;
    lastTime = timestamp; 
    elapsedTime += deltaSeconds; 

    context.clearRect(0, 0, canvas.width, canvas.height); 
    drawBackground(context); 
    drawControlTower(context, elapsedTime);
    updateProjectiles(deltaSeconds);

    // draw first quadcopter (e.g., top-right area)
    context.save();
        // Spawns at 70% of the width, 30% of the height
        context.translate(canvas.width * 0.7, canvas.height * 0.3); 
        if (!quadcopters[0]) 
            generateQuadcopters(60, 0.5, 50);
        let montionFunc = flightPatterns[quadcopters[0].motionIndex];
        montionFunc(context, elapsedTime, quadcopters[0], deltaSeconds); 
    context.restore();

    // draw second quadcopter (e.g., top-left area)
    context.save();
        // Spawns at 15% of the width, 25% of the height
        context.translate(canvas.width * 0.30, canvas.height * 0.4); 
        if (!quadcopters[1]) 
            generateQuadcopters(50, 0.3, 125);
        montionFunc = flightPatterns[quadcopters[1].motionIndex];
        montionFunc(context, elapsedTime, quadcopters[1], deltaSeconds); 
    context.restore();

    // draw third quadcopter (e.g., bottom-center area)
    context.save();
        // Spawns at 50% of the width, 85% of the height
        context.translate(canvas.width * 0.6, canvas.height * 0.7); 
        if (!quadcopters[2])
            generateQuadcopters(70, 0.7, 180);
        montionFunc = flightPatterns[quadcopters[2].motionIndex];
        montionFunc(context, elapsedTime, quadcopters[2], deltaSeconds); 
    context.restore();

    // draw fourth quadcopter, which is controlled by WASD keys
    context.save();
        // This relies on controlledDroneAnchor. Make sure when you initialize
        // controlledDroneAnchor (outside of this loop), you also set it to 
        // something like: controlledDroneAnchor = { x: canvas.width * 0.5, y: canvas.height * 0.5 }
        context.translate(controlledDroneAnchor.x, controlledDroneAnchor.y); 
        if (!quadcopters[3])
            generateQuadcopters(50, 0.5, 70);
        montionFunc = flightPatterns[quadcopters[3].motionIndex];
        montionFunc(context, elapsedTime, quadcopters[3], deltaSeconds); 
    context.restore();

    drawProjectiles(context);

    window.requestAnimationFrame(loop);
};

// and then you would start the loop with:
window.requestAnimationFrame(loop);

function launchProjectile() {
    const quadcopter = quadcopters[3];
    if (!quadcopter) return;

    const angle = quadcopter.controlAngle ?? quadcopter.phase ?? 0;
    const centerX = controlledDroneAnchor.x + (quadcopter.controlX || 0);
    const centerY = controlledDroneAnchor.y + (quadcopter.controlY || 0);
    const noseOffset = quadcopter.size * 0.45;
    const directionX = Math.cos(angle);
    const directionY = Math.sin(angle);

    projectiles.push({
        x: centerX + directionX * noseOffset,
        y: centerY + directionY * noseOffset,
        vx: directionX * projectileSpeed,
        vy: directionY * projectileSpeed,
        life: 1.8
    });
}

function updateProjectiles(deltaSeconds) {
    for (const projectile of projectiles) {
        projectile.x += projectile.vx * deltaSeconds;
        projectile.y += projectile.vy * deltaSeconds;
        projectile.life -= deltaSeconds;
    }

    projectiles = projectiles.filter((projectile) =>
        projectile.life > 0 &&
        projectile.x > -20 &&
        projectile.x < canvas.width + 20 &&
        projectile.y > -20 &&
        projectile.y < canvas.height + 20
    );
}

function drawProjectiles(ctx) {
    for (const projectile of projectiles) {
        const alpha = Math.max(0, Math.min(1, projectile.life / 1.8));
        const glow = ctx.createRadialGradient(projectile.x, projectile.y, 0, projectile.x, projectile.y, 8);
        glow.addColorStop(0, `rgba(255, 245, 170, ${0.95 * alpha})`);
        glow.addColorStop(1, "rgba(255, 150, 60, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 235, 140, ${0.95 * alpha})`;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawControlTower(ctx, time) {
    ctx.save();
    ctx.translate(80, 600);

    // Base platform
    ctx.fillStyle = "#4f5a61";
    ctx.fillRect(-44, -12, 88, 12);

    // Tower
    ctx.fillStyle = "#6d7a84";
    ctx.fillRect(-12, -80, 24, 68);
    ctx.fillStyle = "#97a8b3";
    ctx.fillRect(-16, -86, 32, 8);

    // Articulated antenna (base + tip joints)
    ctx.save();
    ctx.translate(0, -86);
    const baseAngle = Math.sin(time * 0.9) * 0.35;
    ctx.rotate(baseAngle);
    drawAntennaSegment(ctx, 24);
    ctx.translate(0, -24);
    const tipAngle = Math.cos(time * 1.5 + 0.6) * 0.3;
    ctx.rotate(tipAngle);
    drawAntennaSegment(ctx, 18);

    // Radar dish at the tip
    ctx.translate(0, -18);
    ctx.rotate(Math.sin(time * 0.8) * 0.2);
    ctx.fillStyle = "#d8e1e6";
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 8, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#7d8b94";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Blinking beacon
    const pulse = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * 5));
    ctx.fillStyle = `rgba(255, 90, 90, ${pulse})`;
    ctx.beginPath();
    ctx.arc(0, -90, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawAntennaSegment(ctx, length) {
    ctx.strokeStyle = "#b8c4cb";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -length);
    ctx.stroke();

    ctx.fillStyle = "#2c3439";
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
}

function drawBackground(ctx) {
    // Sky gradient (This part was already perfect!)
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, "#7fc9ff");
    sky.addColorStop(1, "#dff4ff");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sun
    ctx.fillStyle = "rgba(255, 227, 130, 0.9)";
    ctx.beginPath();
    // Places the sun at roughly 15% width and 18% height, keeping the radius at 45
    ctx.arc(canvas.width * 0.15, canvas.height * 0.18, 45, 0, Math.PI * 2);
    ctx.fill();

    // Clouds
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    
    // Cloud 1: Was 210, 110 -> Now 35% width, 22% height
    drawCloud(ctx, canvas.width * 0.35, canvas.height * 0.22, 1);
    
    // Cloud 2: Was 470, 140 -> Now 78% width, 28% height
    drawCloud(ctx, canvas.width * 0.78, canvas.height * 0.28, 0.8);
    
    // Cloud 3: Was 350, 380 -> Now 58% width, 76% height
    drawCloud(ctx, canvas.width * 0.58, canvas.height * 0.76, 1.2);
    
    // Cloud 4: Was 150, 500 -> Now 25% width, 95% height (kept slightly off bottom)
    drawCloud(ctx, canvas.width * 0.25, canvas.height * 0.95, 0.9);
}

function drawCloud(ctx, x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.arc(-22, 0, 18, 0, Math.PI * 2);
    ctx.arc(0, -8, 22, 0, Math.PI * 2);
    ctx.arc(26, 2, 16, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

/**
 * 
 * @param {*} ctx 
 * @param {*} time time parameter for animation
 * @param {*} rate seconds per full rotation
 * @param {*} radius radius of the circular flight path
 */
function flyInCycle(ctx, time, quadcopter) {
    ctx.save();
    let angle = time * quadcopter.rate * 2 * Math.PI + quadcopter.phase; // Angle for circular motion
    let x = Math.cos(angle) * quadcopter.radius;
    let y = Math.sin(angle) * quadcopter.radius;
    ctx.translate(x, y); // Move the drone on a circular path
    ctx.rotate(angle + Math.PI / 2); // Keep it roughly tangent to the path
    drawBody(ctx, quadcopter.size, time, quadcopter.speed1, quadcopter.speed2, quadcopter.speed3, quadcopter.speed4); // Draw the drone body with arms and propellers
    
    ctx.restore();
}

/**
 * Figure-8 flight path with tangent heading.
 * @param {*} ctx
 * @param {number} time
 * @param {*} quadcopter
 */
function flyInFigureEight(ctx, time, quadcopter) {
    ctx.save();
    const t = time * quadcopter.rate * 2 * Math.PI + quadcopter.phase;
    const x = quadcopter.radius * Math.sin(t);
    const y = quadcopter.radius * 0.6 * Math.sin(2 * t);
    const dx = quadcopter.radius * Math.cos(t);
    const dy = quadcopter.radius * 1.2 * Math.cos(2 * t);
    const heading = Math.atan2(dy, dx);

    ctx.translate(x, y);
    ctx.rotate(heading);
    drawBody(ctx, quadcopter.size, time, quadcopter.speed1, quadcopter.speed2, quadcopter.speed3, quadcopter.speed4);
    ctx.restore();
}

/**
 * Orbit + radial pulse + vertical wobble for a more "agile drone" look.
 * @param {*} ctx
 * @param {number} time
 * @param {*} quadcopter
 */
function flyInBankedWeave(ctx, time, quadcopter) {
    ctx.save();
    const t = time * quadcopter.rate * 2 * Math.PI + quadcopter.phase;
    const r = quadcopter.radius;
    const pulse = r * (0.75 + 0.25 * Math.sin(0.5 * t));
    const pulseD = r * 0.125 * Math.cos(0.5 * t);
    const x = Math.cos(t) * pulse;
    const y = Math.sin(t) * pulse * 0.6 + Math.sin(3 * t) * r * 0.18;
    const dx = -Math.sin(t) * pulse + Math.cos(t) * pulseD;
    const dy = Math.cos(t) * pulse * 0.6 + Math.sin(t) * pulseD * 0.6 + Math.cos(3 * t) * r * 0.54;
    const heading = Math.atan2(dy, dx) + 0.2 * Math.sin(4 * t);

    ctx.translate(x, y);
    ctx.rotate(heading);
    drawBody(ctx, quadcopter.size, time, quadcopter.speed1, quadcopter.speed2, quadcopter.speed3, quadcopter.speed4);
    ctx.restore();
}

/**
 * Keyboard controlled flight pattern using WASD.
 * W/S move forward/backward, A/D rotate left/right.
 * @param {*} ctx
 * @param {number} time
 * @param {*} quadcopter
 * @param {number} deltaSeconds
 */
function flyWithWASD(ctx, time, quadcopter, deltaSeconds = 0) {
    if (quadcopter.controlX === undefined) {
        quadcopter.controlX = 0;
        quadcopter.controlY = 0;
        quadcopter.controlAngle = quadcopter.phase || 0;
    }

    const moveSpeed = quadcopter.radius * 1.5;
    const turnSpeed = 2.6;
    if (keyState.a) quadcopter.controlAngle -= turnSpeed * deltaSeconds;
    if (keyState.d) quadcopter.controlAngle += turnSpeed * deltaSeconds;

    let forward = 0;
    if (keyState.w) forward += 1;
    if (keyState.s) forward -= 1;
    const distance = forward * moveSpeed * deltaSeconds;
    quadcopter.controlX += Math.cos(quadcopter.controlAngle) * distance;
    quadcopter.controlY += Math.sin(quadcopter.controlAngle) * distance;

    // set limits to prevent flying off screen 
    const limit = canvas.width / 2 - quadcopter.size;
    quadcopter.controlX = Math.max(-limit, Math.min(limit, quadcopter.controlX));
    quadcopter.controlY = Math.max(-limit, Math.min(limit, quadcopter.controlY));

    ctx.save();
    ctx.translate(quadcopter.controlX, quadcopter.controlY);
    ctx.rotate(quadcopter.controlAngle);
    drawBody(ctx, quadcopter.size, time, quadcopter.speed1, quadcopter.speed2, quadcopter.speed3, quadcopter.speed4);
    ctx.restore();
}

/**
 * generate quadcopter objects with different parameters for size, rotation speed, flight radius, and propeller speeds
 * @param {number} size size of the quadcopter
 * @param {number} rate flying speed in seconds per full rotation
 * @param {number} radius radius of the circular flight path
 */
function generateQuadcopters(size, rate, radius) {
    let speed1 = Math.random() * 20 + 5; // Random speed between 5 and 25
    let speed2 = Math.random() * 20 + 5;
    let speed3 = Math.random() * 20 + 5;
    let speed4 = Math.random() * 20 + 5;
    let motionIndex = quadcopters.length % flightPatterns.length;
    let phase = Math.random() * Math.PI * 2;
    quadcopters.push({ size, rate, radius, speed1, speed2, speed3, speed4, motionIndex, phase });
}

// draw the body of the drone
function drawBody(ctx, size = 100, time, speed1, speed2, speed3, speed4) {
    ctx.save();
    ctx.scale(size/100, size/100);

    // Colored underbody lighting (animated tech glow below the chassis)
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const glowPulse = 0.7 + 0.3 * Math.sin(time * 3);
    const glow = ctx.createRadialGradient(0, 14, 2, 0, 14, 36);
    glow.addColorStop(0, `rgba(77, 184, 255, ${0.45 * glowPulse})`);
    glow.addColorStop(0.5, `rgba(179, 102, 255, ${0.28 * glowPulse})`);
    glow.addColorStop(1, "rgba(255, 90, 90, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(0, 14, 38, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // A subtle yellow technical light at the back
    ctx.fillStyle = 'rgba(235, 219, 52, 0.4)'; 
    ctx.beginPath();
    ctx.arc(-35, 0, 16, Math.PI / 2, Math.PI * 1.5); // Semicircle pointing left
    ctx.fill();
    // Tail Section Block
    ctx.fillStyle = '#555759'; // Darker grey
    ctx.fillRect(-38, -10, 18, 20); 
    // The widest block where the arms connect
    ctx.fillStyle = '#65686b'; // Medium tech grey
    ctx.fillRect(-20, -16, 40, 32);
    // Stepped Nose Section (Moving towards the front)
    ctx.fillStyle = '#787b80'; // Lighter grey
    ctx.fillRect(20, -12, 15, 24); 
    // Front Tip
    ctx.fillStyle = '#8a8d91'; // Lightest grey
    ctx.fillRect(35, -8, 10, 16); 
    // Vents and Data Panels
    ctx.fillStyle = '#3a3c3f'; // Very dark grey/black
    // Central processor block
    ctx.fillRect(-10, -6, 20, 12); 
    // Tiny structural vents on the sides
    ctx.fillRect(-5, -14, 10, 2); 
    ctx.fillRect(-5, 12, 10, 2);
    ctx.fillRect(25, -6, 4, 12); 
    // A bright cyan lens array right at the nose to clearly show direction
    ctx.fillStyle = '#4db8ff'; 
    ctx.fillRect(43, -4, 4, 8); 

    ctx.restore();

    drawArms(ctx, size, time, speed1, speed2, speed3, speed4); // Draw the arms around the propeller
}

// draw the arms
function drawArms(ctx, size = 100, time, speed1, speed2, speed3, speed4) {
    ctx.save();
    ctx.scale(size/100, size/100);
    // Rotate 45 degrees to set up the "X" configuration
    ctx.rotate(Math.PI / 4); 

    for (let i = 0; i < 4; i++) {
        ctx.save();
        
        // Main Tapered Arm
        ctx.fillStyle = '#555759'; 
        
        ctx.beginPath();
        // Wide at the central chassis, narrowing down at the motor
        ctx.moveTo(3, -4)
        ctx.lineTo(15, -6); 
        ctx.lineTo(85, -2);
        ctx.lineTo(85, 2);
        ctx.lineTo(15, 6);
        ctx.lineTo(3, 4);
        ctx.closePath();
        ctx.fill();
        // Adds a technical blueprint detail using a thin, lighter grey polygon
        ctx.fillStyle = '#787b80';
        ctx.beginPath();
        ctx.moveTo(15, -1);
        ctx.lineTo(80, -0.5);
        ctx.lineTo(80, 0.5);
        ctx.lineTo(15, 1);
        ctx.closePath();
        ctx.fill();
        // Using stacked squares/rectangles
        ctx.fillStyle = '#3a3c3f'; // Dark grey base
        ctx.fillRect(82, -5, 10, 10); 
        // Inner silver rotor hub
        ctx.fillStyle = '#9aa0a6'; 
        ctx.fillRect(84, -3, 6, 6);
        // Dark center pin
        ctx.fillStyle = '#111111';
        ctx.fillRect(86, -1, 2, 2);

        // draw the propeller at the end of the arm
        ctx.translate(90, 0); // Move to the end of the arm
        let speed = 7 + i * 6;
        if (i === 0) speed = speed1;
        if (i === 1) speed = speed2;
        if (i === 2) speed = speed3;
        if (i === 3) speed = speed4;
        drawPropeller(ctx, time, speed); // Draw a smaller propeller at the end of the arm

        // Navigation light on each arm with alternating blink phases
        const blink = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * 6 + i * Math.PI * 0.65));
        const lightColors = [
            [255, 72, 72],   // red
            [80, 255, 130],  // green
            [90, 180, 255],  // blue
            [255, 210, 90]   // amber
        ];
        const [r, g, b] = lightColors[i % lightColors.length];
        const navGlow = ctx.createRadialGradient(0, 0, 1, 0, 0, 9);
        navGlow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.85 * blink})`);
        navGlow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = navGlow;
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        
        // Rotate 90 degrees for the next arm
        ctx.rotate(Math.PI / 2);
    }
    
    ctx.restore();
}

/**
 * 
 * @param {*} ctx canvas context
 * @param {number} time time parameter for animation
 * @param {number} speed speed of rotation
 */
function drawPropeller(ctx, time, speed) {
    ctx.save();
    ctx.rotate(time * speed); // Rotate based on elapsed time

    // the Blades (Sharp, metallic design)
    ctx.fillStyle = '#3a3c3f';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    
    ctx.beginPath();
    ctx.save();
        ctx.moveTo(0, -4);
        ctx.lineTo(35, -8);
        ctx.lineTo(40, 0);
        ctx.lineTo(10, 4);

        ctx.rotate(Math.PI); // Rotate 180 degrees for the opposite blade
        ctx.moveTo(0, -4);
        ctx.lineTo(35, -8);
        ctx.lineTo(40, 0);
        ctx.lineTo(10, 4); 
    ctx.restore();
    ctx.closePath();
    ctx.fill();
    // Draw the Outer Hub 
    ctx.fillStyle = '#1a1a1a'; 
    ctx.shadowBlur = 0; // Turn off shadow for the hub to keep it looking attached
    ctx.shadowOffsetY = 0;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    // Crimson core
    ctx.fillStyle = '#8b0000'; // Deep crimson to make the center stand out
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}
    
// 2026 Workbook
