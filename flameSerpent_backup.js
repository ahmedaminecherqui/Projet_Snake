const BossState = {
    WANDERING: 'WANDERING',
    TRACKING: 'TRACKING',
    SEEKING: 'SEEKING',  // For intentional movement
    INHALING: 'INHALING',
    EXHALING: 'EXHALING',
    DASH_PREP: 'DASH_PREP',
    DASHING: 'DASHING',
    STUNNED: 'STUNNED',  // Hit border during dash
    DYING: 'DYING'
};

class Fireball {
    constructor(x, y, angle, speed = 7) {
        this.pos = createVector(x, y);
        this.vel = p5.Vector.fromAngle(angle).mult(speed);
        this.size = 40;
        this.alive = true;
        this.life = 180; // 3 seconds at 60fps
        this.trail = []; // Storage for tail/smoke trail
    }

    update() {
        // Store previous position for trail
        this.trail.push(this.pos.copy());
        if (this.trail.length > 10) this.trail.shift();

        this.pos.add(this.vel);
        this.life--;
        if (this.life <= 0) this.alive = false;
    }

    display() {
        push();
        // 1. Draw Tail/Trail
        noStroke();
        for (let i = 0; i < this.trail.length; i++) {
            let p = this.trail[i];
            let alpha = map(i, 0, this.trail.length, 0, 150);
            let s = map(i, 0, this.trail.length, this.size * 0.2, this.size);
            fill(255, 50, 0, alpha);
            ellipse(p.x, p.y, s);

            // Internal fire flicker
            if (i % 3 === 0) {
                fill(255, 200, 0, alpha * 0.5);
                ellipse(p.x + random(-5, 5), p.y + random(-5, 5), s * 0.5);
            }
        }

        // 2. Draw Core
        translate(this.pos.x, this.pos.y);

        // Outer Glow
        fill(255, 200, 0, 150);
        noStroke();
        ellipse(0, 0, this.size * 1.5);

        // Core
        fill(255, 100, 0);
        ellipse(0, 0, this.size);

        // Sparks/Heat distortion
        for (let i = 0; i < 3; i++) {
            fill(255, 255, 200, 150);
            ellipse(random(-15, 15), random(-15, 15), 5);
        }
        pop();
    }
}

class Thorn {
    constructor(x, y, angle) {
        this.pos = createVector(x, y);
        this.vel = p5.Vector.fromAngle(angle).mult(14); // Faster thorns
        this.size = 25; // Larger thorns
        this.alive = true;
        this.life = 120;
    }

    update() {
        this.pos.add(this.vel);
        this.life--;
        if (this.life <= 0) this.alive = false;
    }

    display() {
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.vel.heading());
        fill(255, 68, 68); // Brighter red
        stroke(255, 200, 0); // Gold stroke
        strokeWeight(2);
        beginShape();
        vertex(this.size, 0);
        vertex(-this.size * 0.5, -this.size * 0.4);
        vertex(-this.size * 0.2, 0);
        vertex(-this.size * 0.5, this.size * 0.4);
        endShape(CLOSE);
        pop();
    }
}

class FallingRock {
    constructor() {
        // Size distribution: 20% small, 60% mid, 20% big
        let r = random();
        if (r < 0.2) {
            this.sizeCategory = 'small';
            this.baseSize = random(30, 45);
            this.damage = 1;
        } else if (r < 0.8) {
            this.sizeCategory = 'mid';
            this.baseSize = random(50, 70);
            this.damage = 2;
        } else {
            this.sizeCategory = 'big';
            this.baseSize = random(75, 100);
            this.damage = 3;
        }

        // 3D position (x, y on screen, z for depth)
        this.x = random(100, width - 100);
        this.targetY = random(height * 0.3, height * 0.8); // Landing position
        this.z = 1.0; // Starts far (small), approaches 0 (large)
        this.y = -50; // Visual y position

        // State
        this.state = 'falling'; // 'falling', 'landed', 'launched'
        this.alive = true;
        this.life = 300;

        // Launch properties
        this.launchVel = createVector(0, 0);
        this.rotation = 0;
        this.rotationSpeed = 0;
    }

    update() {
        this.life--;
        if (this.life <= 0) this.alive = false;

        if (this.state === 'falling') {
            // Simulate 3D fall: z decreases (gets closer)
            this.z -= 0.015;

            // Update visual y position based on depth
            this.y = lerp(-50, this.targetY, 1 - this.z);

            // Land when z reaches 0
            if (this.z <= 0) {
                this.z = 0;
                this.y = this.targetY;
                this.state = 'landed';
                // Landed rocks persist indefinitely
            }
        } else if (this.state === 'launched') {
            // Move in launch direction
            this.x += this.launchVel.x;
            this.y += this.launchVel.y;
            this.rotation += this.rotationSpeed;

            // Friction
            this.launchVel.mult(0.97);

            // Out of bounds check
            if (this.x < -100 || this.x > width + 100 ||
                this.y < -100 || this.y > height + 100) {
                this.alive = false;
            }
        }
    }

    display() {
        push();
        translate(this.x, this.y);

        // Calculate visual size based on depth (z)
        let visualSize = this.baseSize * (1 - this.z * 0.7);

        if (this.state === 'launched') {
            rotate(this.rotation);
        }

        // Shadow (only for falling and landed)
        if (this.state !== 'launched') {
            fill(0, 0, 0, 50);
            noStroke();
            ellipse(0, visualSize * 0.6, visualSize * 0.8, visualSize * 0.3);
        }

        // Rock color based on size
        if (this.sizeCategory === 'small') {
            fill(90, 70, 60);
            stroke(60, 50, 40);
        } else if (this.sizeCategory === 'mid') {
            fill(69, 10, 10);
            stroke(120, 30, 30);
        } else {
            fill(50, 10, 10);
            stroke(100, 20, 20);
        }
        strokeWeight(2);

        // Jagged rock shape
        beginShape();
        for (let a = 0; a < TWO_PI; a += PI / 3) {
            let r = visualSize * 0.5 * random(0.8, 1.2);
            vertex(cos(a) * r, sin(a) * r);
        }
        endShape(CLOSE);

        // Cracks
        stroke(239, 68, 68, 100);
        strokeWeight(1);
        line(-visualSize * 0.2, -visualSize * 0.2, visualSize * 0.1, visualSize * 0.1);

        // Highlight if landed (interactive)
        if (this.state === 'landed') {
            noFill();
            stroke(251, 191, 36, 100 + sin(frameCount * 0.1) * 50);
            strokeWeight(2);
            ellipse(0, 0, visualSize * 1.2);
        }

        pop();
    }

    getVisualSize() {
        return this.baseSize * (1 - this.z * 0.7);
    }

    launch(direction, speed = 20) {
        if (this.state === 'landed') {
            this.state = 'launched';
            this.launchVel = direction.copy().normalize().mult(speed);
            this.rotationSpeed = random(-0.3, 0.3);
            this.life = 180; // 3 seconds flight time
        }
    }

    checkPlayerCollision(playerHead) {
        if (this.state !== 'falling') return false;

        let visualSize = this.getVisualSize();
        let d = dist(playerHead.x, playerHead.y, this.x, this.y);
        return d < (visualSize * 0.4 + 15);
    }

    checkBossCollision(bossHead) {
        if (this.state !== 'launched') return false;

        let visualSize = this.getVisualSize();
        let d = dist(bossHead.x, bossHead.y, this.x, this.y);
        if (d < (visualSize * 0.4 + 50)) {
            this.alive = false;
            return this.damage;
        }
        return 0;
    }

    isNearPlayer(playerHead, dashRange = 80) {
        if (this.state !== 'landed') return false;

        let d = dist(playerHead.x, playerHead.y, this.x, this.y);
        return d < dashRange;
    }
}

class FlameSerpent {
    constructor(x, y, segments = 75) {
        this.segments = [];
        this.segmentSize = 95; // Boss is gargantuan!

        // Stats for the "head" part
        this.maxSpeed = 4; // Slightly faster default
        this.maxForce = 0.2;

        // Initialize segments as Vehicles
        for (let i = 0; i < segments; i++) {
            this.segments.push(new Vehicle(x, y));
        }

        // Color Palette
        this.colorMain = color(239, 68, 68); // Bright Fire Red
        this.colorAccent = color(251, 191, 36); // Gold/Fire
        this.colorDark = color(69, 10, 10); // Dark Blood Red

        // Health
        this.maxHealth = 6;
        this.health = 6;

        // Moveset & State
        this.headRotationOverride = null;
        this.currentState = BossState.TRACKING; // Start by tracking the player
        this.stateTimer = 0;

        // Effect Particles
        this.inhaleParticles = [];
        this.fireballs = [];
        this.thorns = [];
        this.fallingRocks = [];

        // Cycle Logic
        this.comboCount = 0;
        this.maxCombos = floor(random(1, 5));

        // Dash Settings
        this.dashDirection = null;
        this.dashSpeed = 25;
        this.dashDuration = 50; // frames
    }

    setState(newState) {
        if (this.currentState === newState) return;
        this.currentState = newState;
        this.stateTimer = 0;

        // Reset overrides when changing state
        if (newState === BossState.WANDERING) {
            this.headRotationOverride = null;
        }
    }

    /**
     * Spiritually coils the boss into a tight spiral for the intro.
     */
    setCoiledLayout(centerX, centerY, instant = false) {
        for (let i = 0; i < this.segments.length; i++) {
            let seg = this.segments[i];
            let angle = i * 0.35;
            let radius = i * (this.segmentSize * 0.08);

            let targetX = centerX + cos(angle) * radius;
            let targetY = centerY + sin(angle) * radius;

            if (instant) {
                seg.position.x = targetX;
                seg.position.y = targetY;
            } else {
                seg.position.x = lerp(seg.position.x, targetX, 0.15);
                seg.position.y = lerp(seg.position.y, targetY, 0.15);
            }

            let nextAngle = (i + 1) * 0.35;
            seg.velocity = createVector(cos(nextAngle) - cos(angle), sin(nextAngle) - sin(angle));
        }
    }

    update(obstacles = [], target = null) {
        this.stateTimer++;
        let head = this.segments[0];

        switch (this.currentState) {
            case BossState.WANDERING:
                // Normal autonomous movement but can follow player sometimes
                let targetPos = target ? (random() < 0.3 ? target : null) : null;
                let steerForce;
                if (targetPos) {
                    steerForce = head.seek(targetPos);
                    head.maxSpeed = 5; // Faster homing
                } else {
                    steerForce = head.wander();
                    head.maxSpeed = 6; // Fast wandering
                }
                head.applyForce(steerForce);

                // Manual update to bypass boundary constraints in Vehicle class
                head.velocity.add(head.acceleration);
                head.velocity.limit(head.maxSpeed);
                head.position.add(head.velocity);
                head.acceleration.mult(0);

                // Random Attacks while wandering - Increased frequency
                if (this.stateTimer > 40 && frameCount % 60 === 0) {
                    let r = random();
                    if (r < 0.2) { // 20% chance for Big Fireball
                        this.shootBigFireball();
                    } else if (r < 0.45) { // 25% chance for Thorn Burst
                        this.releaseThorns();
                    }
                }

                // Cycle to Dash Prep after wandering for a long time (20-30s)
                if (this.stateTimer > floor(random(1200, 1500))) {
                    this.setState(BossState.DASH_PREP);
                }
                break;

            case BossState.DASH_PREP:
                // Follow player closely to aim
                if (target) {
                    let steer = head.seek(target);
                    head.applyForce(steer.mult(1.5));
                    head.maxSpeed = 7;
                }
                head.update();

                // Lock in direction and dash after 2 seconds
                if (this.stateTimer > 120) {
                    if (target) {
                        this.dashDirection = p5.Vector.sub(target, head.position).normalize();
                    } else {
                        this.dashDirection = head.velocity.copy().normalize();
                    }
                    this.setState(BossState.DASHING);
                }
                break;

            case BossState.DASHING:
                // High speed charge
                head.velocity = this.dashDirection.copy().mult(this.dashSpeed);
                head.position.add(head.velocity);

                // External effects
                if (typeof screenShake !== 'undefined') screenShake = 8;

                if (frameCount % 6 === 0) {
                    this.fallingRocks.push(new FallingRock());
                }

                // Clear landed rocks when new rocks start falling
                if (this.stateTimer === 1) {
                    this.clearLandedRocks();
                }

                if (this.stateTimer > this.dashDuration) {
                    this.setState(BossState.TRACKING);
                    this.comboCount = 0;
                    this.maxCombos = floor(random(1, 5));
                }
                break;

            case BossState.SEEKING:
                // Direct movement to a point without wandering
                if (target) {
                    let steer = head.seek(target);
                    head.applyForce(steer);
                }
                let avoidForceS = head.avoid(obstacles);
                head.applyForce(avoidForceS.mult(2.0));
                head.update();
                break;

            case BossState.TRACKING:
                // BODY IS STATIC. Only head tracks target.
                if (target) {
                    let dx = target.x - head.position.x;
                    let dy = target.y - head.position.y;
                    this.headRotationOverride = atan2(dy, dx);
                }
                // Prepare for inhale
                if (this.stateTimer > 60) {
                    this.setState(BossState.INHALING);
                }
                break;

            case BossState.INHALING:
                // Visual Effect: Spawn particles coming towards mouth in a CONE
                if (frameCount % 2 === 0) {
                    let headAngle = this.headRotationOverride || head.velocity.heading();
                    let coneSpread = PI / 3; // 60-degree cone
                    let spawnAngle = headAngle + random(-coneSpread / 2, coneSpread / 2);
                    let dist = random(400, 700);

                    let pPos = createVector(
                        head.position.x + cos(spawnAngle) * dist,
                        head.position.y + sin(spawnAngle) * dist
                    );
                    this.inhaleParticles.push({
                        pos: pPos,
                        vel: createVector(0, 0),
                        life: 255
                    });
                }
                // Transition to Exhale (Fireballs) after timer
                if (this.stateTimer > 150) {
                    this.setState(BossState.EXHALING);
                    this.shootFireballs();
                }
                // Rotate head to follow target even while inhaling
                if (target) {
                    let dx = target.x - head.position.x;
                    let dy = target.y - head.position.y;
                    this.headRotationOverride = atan2(dy, dx);
                }
                break;

            case BossState.EXHALING:
                // Cooldown after shooting
                if (this.stateTimer > 60) {
                    this.comboCount++;
                    if (this.comboCount >= this.maxCombos) {
                        this.setState(BossState.WANDERING);
                    } else {
                        this.setState(BossState.TRACKING);
                    }
                }
                break;
        }

        // Segment Following Logic (Trailing behavior)
        // Skip this in states where we want a static body
        if (this.currentState !== BossState.TRACKING &&
            this.currentState !== BossState.INHALING &&
            this.currentState !== BossState.EXHALING) {

            for (let i = 1; i < this.segments.length; i++) {
                let prev = this.segments[i - 1].position;
                let current = this.segments[i].position;

                let dx = prev.x - current.x;
                let dy = prev.y - current.y;
                let dist = sqrt(dx * dx + dy * dy);
                let targetDist = this.segmentSize * 0.4;

                if (dist > targetDist) {
                    let desiredMag = dist - targetDist;
                    current.x += (dx / dist) * desiredMag;
                    current.y += (dy / dist) * desiredMag;
                }

                this.segments[i].velocity = createVector(dx, dy);
            }
        }

        // Update Inhale Particles
        for (let i = this.inhaleParticles.length - 1; i >= 0; i--) {
            let p = this.inhaleParticles[i];
            let mouthPos = head.position.copy();
            let dir = p5.Vector.sub(mouthPos, p.pos);
            let d = dir.mag();
            dir.normalize();
            p.vel.add(dir.mult(0.5));
            p.vel.limit(10);
            p.pos.add(p.vel);
            p.life -= 5;
            if (p.life <= 0 || d < 10) {
                this.inhaleParticles.splice(i, 1);
            }
        }

        // Update Fireballs
        for (let i = this.fireballs.length - 1; i >= 0; i--) {
            this.fireballs[i].update();
            if (!this.fireballs[i].alive) {
                this.fireballs.splice(i, 1);
            }
        }

        // Update Thorns
        for (let i = this.thorns.length - 1; i >= 0; i--) {
            this.thorns[i].update();
            if (!this.thorns[i].alive) {
                this.thorns.splice(i, 1);
            }
        }

        // Update Falling Rocks
        for (let i = this.fallingRocks.length - 1; i >= 0; i--) {
            this.fallingRocks[i].update();
            if (!this.fallingRocks[i].alive) {
                this.fallingRocks.splice(i, 1);
            }
        }
    }

    shootBigFireball() {
        let head = this.segments[0];
        let angle = head.velocity.heading();
        let bigFB = new Fireball(head.position.x, head.position.y, angle, 9);
        bigFB.size = 80; // Massive!
        this.fireballs.push(bigFB);
    }

    releaseThorns() {
        // Release thorns from random body segments
        for (let i = 5; i < this.segments.length; i += 10) {
            let seg = this.segments[i];
            let angle = seg.velocity.heading() + PI / 2; // Perpendicular to segment
            this.thorns.push(new Thorn(seg.position.x, seg.position.y, angle));
            this.thorns.push(new Thorn(seg.position.x, seg.position.y, angle + PI));
        }
    }

    shootFireballs() {
        let head = this.segments[0];
        let baseAngle = this.headRotationOverride || head.velocity.heading();

        let count = floor(random(3, 5)); // 3 to 4 fireballs
        let spread = PI / 6; // 30 degree spread

        for (let i = 0; i < count; i++) {
            let angle = baseAngle + map(i, 0, count - 1, -spread / 2, spread / 2);
            this.fireballs.push(new Fireball(head.position.x, head.position.y, angle));
        }
    }

    display() {
        for (let i = this.segments.length - 1; i >= 0; i--) {
            let seg = this.segments[i];
            let pos = seg.position;
            let angle = (i === 0 && this.headRotationOverride !== null) ?
                this.headRotationOverride :
                seg.velocity.heading();

            let isHead = (i === 0);
            let isTailTip = (i === this.segments.length - 1);

            let taper;
            if (isHead) taper = 1.2;
            else if (i < 5) taper = map(i, 0, 5, 1.2, 1.0);
            else taper = map(i, 5, this.segments.length, 1.0, 0.4);

            let currentSize = this.segmentSize * taper;

            push();
            translate(pos.x, pos.y);
            rotate(angle);

            if (isHead) {
                this.drawHead(currentSize);
            } else if (isTailTip) {
                this.drawTailTip(currentSize);
            } else {
                this.drawBodySegment(currentSize, i);
            }
            pop();
        }

        // Draw Inhale Effects
        if (this.currentState === BossState.INHALING) {
            this.displayInhale();
        }

        // Draw Fireballs
        for (let fb of this.fireballs) {
            fb.display();
        }

        // Draw Thorns
        for (let th of this.thorns) {
            th.display();
        }

        // Draw Falling Rocks
        for (let rock of this.fallingRocks) {
            rock.display();
        }
    }

    displayInhale() {
        push();
        noStroke();
        for (let p of this.inhaleParticles) {
            let alpha = map(p.life, 0, 255, 0, 200);
            fill(255, 100, 0, alpha);
            let size = map(p.life, 0, 255, 2, 8);
            ellipse(p.pos.x, p.pos.y, size);

            stroke(255, 200, 0, alpha * 0.5);
            strokeWeight(size * 0.5);
            line(p.pos.x, p.pos.y, p.pos.x - p.vel.x * 2, p.pos.y - p.vel.y * 2);
            noStroke();
        }
        pop();
    }

    drawBodySegment(size, index) {
        noStroke();
        fill(251, 146, 60, 40);
        ellipse(0, 0, size * 1.5, size * 1.1);

        fill(this.colorDark);
        stroke(this.colorMain);
        strokeWeight(1);
        ellipse(0, 0, size, size * 0.85);

        noStroke();
        fill(this.colorMain);
        let scaleSize = size * 0.25;
        ellipse(size * 0.1, size * 0.15, scaleSize);
        ellipse(size * 0.1, -size * 0.15, scaleSize);

        fill(this.colorAccent);
        beginShape();
        vertex(-size * 0.2, -size * 0.4);
        vertex(-size * 0.5, -size * 0.7);
        vertex(-size * 0.1, -size * 0.4);
        endShape(CLOSE);
        beginShape();
        vertex(-size * 0.2, size * 0.4);
        vertex(-size * 0.5, size * 0.7);
        vertex(-size * 0.1, size * 0.4);
        endShape(CLOSE);
    }

    drawHead(size) {
        fill(255, 68, 68, 50);
        ellipse(size * 0.3, 0, size * 2.2, size * 1.8);

        fill(this.colorDark);
        stroke(this.colorMain);
        strokeWeight(2.5);
        beginShape();
        vertex(-size * 0.5, -size * 0.4);
        vertex(size * 0.1, -size * 0.65);
        vertex(size * 1.25, 0);
        vertex(size * 0.1, size * 0.65);
        vertex(-size * 0.5, size * 0.4);
        vertex(-size * 0.75, 0);
        endShape(CLOSE);

        fill(this.colorMain);
        noStroke();
        beginShape();
        vertex(0, -size * 0.2);
        vertex(size * 0.5, 0);
        vertex(0, size * 0.2);
        vertex(-size * 0.2, 0);
        endShape(CLOSE);

        fill(255);
        noStroke();
        triangle(size * 0.9, size * 0.1, size * 1.15, size * 0.35, size * 0.8, size * 0.1);
        triangle(size * 0.9, -size * 0.1, size * 1.15, -size * 0.35, size * 0.8, -size * 0.1);

        fill(this.colorDark);
        stroke(this.colorAccent);
        strokeWeight(2);
        beginShape();
        vertex(-size * 0.4, -size * 0.5);
        vertex(-size * 1.5, -size * 1.0);
        vertex(-size * 0.6, -size * 0.35);
        endShape(CLOSE);
        beginShape();
        vertex(-size * 0.4, size * 0.5);
        vertex(-size * 1.5, size * 1.0);
        vertex(-size * 0.6, size * 0.35);
        endShape(CLOSE);

        let eyeX = size * 0.4;
        let eyeY = size * 0.3;
        fill(255, 230, 0);
        ellipse(eyeX, -eyeY, size * 0.35, size * 0.2);
        ellipse(eyeX, eyeY, size * 0.35, size * 0.2);

        fill(0);
        ellipse(eyeX + size * 0.05, -eyeY, size * 0.1, size * 0.15);
        ellipse(eyeX + size * 0.05, eyeY, size * 0.1, size * 0.15);
    }

    drawTailTip(size) {
        fill(this.colorDark);
        stroke(this.colorAccent);
        strokeWeight(2);
        beginShape();
        vertex(size * 0.5, 0);
        vertex(-size, -size * 0.3);
        vertex(-size * 0.5, 0);
        vertex(-size, size * 0.3);
        endShape(CLOSE);
    }

    checkCollision(playerSnake) {
        if (!playerSnake || playerSnake.segments.length === 0) return null;
        const playerHead = playerSnake.segments[0].position;
        for (let i = 0; i < this.segments.length; i++) {
            const bossSeg = this.segments[i].position;
            const dx = playerHead.x - bossSeg.x;
            const dy = playerHead.y - bossSeg.y;
            const dist = sqrt(dx * dx + dy * dy);
            let taper = i === 0 ? 1.2 : (i < 5 ? map(i, 0, 5, 1.2, 1.0) : map(i, 5, this.segments.length, 1.0, 0.4));
            const bossRadius = (this.segmentSize * taper) * 0.7;
            if (dist < bossRadius + 15) return bossSeg.copy();
        }
        return null;
    }

    checkFireballCollisions(playerSnake) {
        if (!playerSnake || playerSnake.segments.length === 0) return null;
        let playerHead = playerSnake.segments[0].position;

        for (let fb of this.fireballs) {
            let d = dist(playerHead.x, playerHead.y, fb.pos.x, fb.pos.y);
            // Dynamic radius based on fireball size
            if (d < (fb.size * 0.5 + 15)) {
                fb.alive = false;
                return fb.pos.copy();
            }
        }

        for (let th of this.thorns) {
            let d = dist(playerHead.x, playerHead.y, th.pos.x, th.pos.y);
            if (d < (th.size + 15)) {
                th.alive = false;
                return th.pos.copy();
            }
        }

        // Check falling rocks using new collision method
        for (let rock of this.fallingRocks) {
            if (rock.checkPlayerCollision(playerHead)) {
                rock.alive = false;
                return createVector(rock.x, rock.y);
            }
        }
        return null;
    }

    // Check if launched rocks hit the boss
    checkRockDamage() {
        let bossHead = this.segments[0].position;
        let totalDamage = 0;

        for (let rock of this.fallingRocks) {
            let damage = rock.checkBossCollision(bossHead);
            if (damage > 0) {
                totalDamage += damage;
                // Visual feedback
                if (typeof screenShake !== 'undefined') screenShake = 5;
            }
        }

        return totalDamage;
    }

    // Get all landed rocks near the player for dash interaction
    getLandedRocksNearPlayer(playerHead) {
        return this.fallingRocks.filter(rock => rock.isNearPlayer(playerHead));
    }

    // Clear all landed rocks (called when boss takes damage or new dash starts)
    clearLandedRocks() {
        this.fallingRocks = this.fallingRocks.filter(rock => rock.state !== 'landed');
    }
}
