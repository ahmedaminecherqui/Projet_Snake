class Snake extends Vehicle {
    constructor(x, y) {
        super(x, y);
        this.segments = [];

        // Create the head as a separate Vehicle but keep Snake extending Vehicle
        let head = new Vehicle(x, y);
        head.maxSpeed = 8; // Faster player
        head.maxForce = 0.8; // Sharper turns
        this.segments.push(head);
        this.isAutonomous = false;

        for (let i = 0; i < 3; i++) { this.addSegment(); } // Reduced starting length

        // Tongue animation state
        this.tongueActive = false;
        this.tongueTimer = 0;

        // Dash Mechanic State
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashCooldown = 0;
        this.ghostHistory = []; // Stores full body snapshots for the trail
        this.damageTimer = 0; // For flashing red on hit
    }

    addSegment() {
        let last = this.segments[this.segments.length - 1];
        let newSeg = new Vehicle(last.position.x, last.position.y);
        newSeg.maxSpeed = 10;
        newSeg.maxForce = 0.6;
        this.segments.push(newSeg);
    }

    update(target, obstacles, toxicSnakes = [], foods = []) {
        if (this.damageTimer > 0) this.damageTimer--;

        // STUN LOGIC: If recently damaged (first 0.5s of 1.5s timer), lose control
        if (this.damageTimer > 60) {
            target = this.segments[0].position.copy(); // Stay put/drift
        }

        let head = this.segments[0];

        if (this.isAutonomous) {
            // Smooth out movement for autonomous mode
            head.maxSpeed = 6; // Slightly faster for hunting
            head.maxForce = 0.5;

            let wanderForce = head.wander();
            let avoidForce = head.avoid(obstacles);

            // 1. Self-Avoidance: Don't eat yourself
            let tailPositions = [];
            for (let i = 8; i < this.segments.length; i++) {
                tailPositions.push(this.segments[i].position);
            }
            let separateForce = head.separate(tailPositions, 60); // Increased radius

            // 2. Enemy Evasion: Avoid toxic snakes
            let evadeForce = createVector(0, 0);
            for (let enemy of toxicSnakes) {
                let d = p5.Vector.dist(head.position, enemy.segments[0].position);
                if (d < 350) { // Increased detection range
                    evadeForce.add(head.evade(enemy.segments[0]));
                }
            }

            // PRIORITY WEIGHTING
            head.applyForce(wanderForce.mult(1.5));      // Restored wander priority
            head.applyForce(avoidForce.mult(6.0));      // Critical priority
            head.applyForce(separateForce.mult(5.0));   // Very High priority
            head.applyForce(evadeForce.mult(4.0));      // High priority
        } else {
            // Restore normal player speeds if they were changed
            head.maxSpeed = 8;
            head.maxForce = 0.8;

            // --- DASH OVERRIDE ---
            if (this.dashTimer > 0) {
                this.isDashing = true;
                head.maxSpeed = 22; // Elite burst speed
                head.maxForce = 1.5;
                this.dashTimer--;

                // Store ghost snapshot every 3 frames for performance
                if (frameCount % 3 === 0) {
                    let snapshot = this.segments.map(s => s.position.copy());
                    this.ghostHistory.push(snapshot);
                    if (this.ghostHistory.length > 5) this.ghostHistory.shift();
                }
            } else {
                this.isDashing = false;
                this.ghostHistory = []; // Clear trail when not dashing
            }

            if (this.dashCooldown > 0) this.dashCooldown--;

            // Normal player-controlled behavior - PURE MANUAL CONTROL
            // No AI steering, player has full direct control
            let arriveForce = head.arrive(target, 100);
            head.applyForce(arriveForce);
        }

        // IMPORTANT: Calculate boundary steering force BEFORE update
        head.boundaries(40);
        head.update();

        // Update tongue timer
        if (gameState === PLAYING) {
            if (this.tongueActive) {
                this.tongueTimer--;
                if (this.tongueTimer <= 0) this.tongueActive = false;
            } else if (random(1) < 0.05) { // MUCH more frequent (5% chance per frame)
                this.tongueActive = true;
                this.tongueTimer = 40 + random(20); // Stays out longer
            }
        }

        for (let i = 1; i < this.segments.length; i++) {
            let segment = this.segments[i];
            let prev = this.segments[i - 1];

            // 1. Physics Movement
            // Reduce stopDistance to 12 to ensure 16px radius segments overlap (8+8=16 > 12)
            let arriveForce = segment.arrive(prev.position, 40, 12);
            segment.applyForce(arriveForce);
            segment.update();

            // 2. HARD CONSTRAINT (Fixes gaps/detaching)
            // If segment is too far, pull it back instantly
            let dist = p5.Vector.dist(segment.position, prev.position);
            const MAX_DIST = 14;
            if (dist > MAX_DIST) {
                let dir = p5.Vector.sub(segment.position, prev.position);
                dir.setMag(MAX_DIST); // Clamp to max distance
                segment.position = p5.Vector.add(prev.position, dir);
                segment.velocity.mult(0.9); // Dampen velocity to prevent snapping oscillation
            }
        }
    }

    dash() {
        if (this.dashCooldown <= 0) {
            this.dashTimer = 45; // Extended duration (0.75s)
            this.dashCooldown = 90; // 1.5s cooldown
            return true;
        }
        return false;
    }

    display(mascotImg) {
        // --- GHOST TRAIL (Full Body Echo) ---
        if (this.isDashing && this.ghostHistory && this.ghostHistory.length > 0) {
            push();
            noStroke();
            // REMOVED: drawingContext.shadowBlur = 20; (Performance Killer)

            for (let i = 0; i < this.ghostHistory.length; i++) {
                let snapshot = this.ghostHistory[i];
                let opacity = map(i, 0, this.ghostHistory.length, 30, 80); // Reduced opacity for cleaner look
                fill(74, 222, 128, opacity); // Neon Green Ghost

                for (let pos of snapshot) {
                    ellipse(pos.x, pos.y, 20);
                }
            }
            pop();
        }

        this.segments[0].drawDebug();
        // Draw tail-to-head so the head sits on top
        for (let i = this.segments.length - 1; i >= 0; i--) {
            let inter = map(i, 0, this.segments.length, 0, 1);
            let c = lerpColor(color(74, 222, 128), color(22, 101, 52), inter);

            // DAMAGE FLASH: If damaged, flicker between actual color and bright red
            let isFlashFrame = false;
            if (this.damageTimer > 0) {
                if (floor(frameCount / 4) % 2 === 0) {
                    c = color(239, 68, 68); // Bright Red
                    isFlashFrame = true;
                }
            }

            // Normalize size if forming word, otherwise use tapering
            let size = (gameState === COMPLETING) ? 1.0 : map(i, 0, this.segments.length, 1.4, 0.6);

            if (i === 0 && mascotImg) {
                // Body "socket" at the head position to ensure seamless connection
                fill(c);
                noStroke();
                ellipse(this.segments[i].position.x, this.segments[i].position.y, 25 * size);

                // Draw Mascot for Head
                push();
                translate(this.segments[i].position.x, this.segments[i].position.y);

                // Get heading, but LOCK it if velocity is zero or very low during completion
                let angle;
                if (gameState === COMPLETING && this.segments[i].velocity.mag() < 0.05) {
                    angle = this.segments[i]._lastHeading || 0;
                } else {
                    angle = this.segments[i].velocity.heading() + PI / 2;
                    this.segments[i]._lastHeading = angle;
                }
                rotate(angle);
                imageMode(CENTER);

                // Offset image so its "neck" is at the pivot (0,0)
                if (isFlashFrame) {
                    tint(255, 0, 0); // Flash Red Head
                } else {
                    noTint();
                }
                image(mascotImg, 0, -20, 60, 60);
                noTint();

                // --- HUMONGOUS TONGUE (FORKED LINE + V) ---
                if (this.tongueActive && gameState !== COMPLETING) {
                    let flicker = map(sin(frameCount * 1.5), -1, 1, 0.7, 1.3);
                    let baseLen = 30; // Humongous
                    let len = baseLen * flicker;

                    push();
                    // --- OPTIMIZED TONGUE GLOW ---
                    strokeWeight(12);
                    stroke(255, 0, 0, 50); // Soft outer glow
                    translate(0, -45);
                    line(0, 0, 0, -len);

                    strokeWeight(5); // Sharp core
                    stroke(255, 0, 0);
                    strokeCap(ROUND);
                    noFill();

                    line(0, 0, 0, -len); // Central line
                    // Huge Forked tips (V)
                    line(0, -len, -10, -len - 10);
                    line(0, -len, 10, -len - 10);
                    pop();
                }
                pop();
            } else {
                // Body segments
                fill(c);
                noStroke();
                ellipse(this.segments[i].position.x, this.segments[i].position.y, 25 * size);
            }
        }
    }

    eat(food) {
        let head = this.segments[0];
        let d = p5.Vector.dist(head.position, food.position);
        if (d < 50) {
            this.addSegment();
            return true;
        }
        return false;
    }

    checkSelfCollision() {
        let head = this.segments[0];
        for (let i = 6; i < this.segments.length; i++) {
            let d = p5.Vector.dist(head.position, this.segments[i].position);
            if (d < 15) return true;
        }
        return false;
    }

    checkObstacleCollision(obstacles) {
        let head = this.segments[0];
        for (let obs of obstacles) {
            let d = p5.Vector.dist(head.position, obs.position);
            // Increased headRadius buffer (16 instead of 12.5) for instant-kill feel
            let headRadius = 16;
            let obsR = obs.r || 30;

            // If oval, increase threshold slightly to match visual width
            let threshold = obsR + headRadius;
            if (obs.shapeType === 2) threshold += obsR * 0.2;

            if (d < threshold) return true;
        }
        return false;
    }

    checkEnemyCollision(toxicSnakes) {
        let head = this.segments[0];
        for (let enemy of toxicSnakes) {
            for (let segment of enemy.segments) {
                let d = p5.Vector.dist(head.position, segment.position);
                // Using 25 as distance threshold for body segments
                if (d < 25) return true;
            }
        }
        return false;
    }
}
