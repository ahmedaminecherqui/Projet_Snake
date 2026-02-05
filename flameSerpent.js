const BossState = {
    WANDERING: 'WANDERING',
    TRACKING: 'TRACKING',
    SEEKING: 'SEEKING',  // For intentional movement
    INHALING: 'INHALING',
    EXHALING: 'EXHALING',
    DASHING: 'DASHING',
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

class FlameSerpent {
    constructor(x, y, segments = 75) {
        this.segments = [];
        this.segmentSize = 95; // Boss is gargantuan!

        // Stats for the "head" part
        this.maxSpeed = 3;
        this.maxForce = 0.15;

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
        this.currentState = BossState.WANDERING;
        this.stateTimer = 0;

        // Effect Particles
        this.inhaleParticles = [];
        this.fireballs = [];
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
                // Normal autonomous movement
                let wanderForce = head.wander();
                let avoidForceW = head.avoid(obstacles);
                head.applyForce(wanderForce);
                head.applyForce(avoidForceW.mult(2.0));
                head.update();
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
                // Stay focused while shooting
                if (this.stateTimer > 60) {
                    this.setState(BossState.TRACKING);
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
            // Fireball radius (~20) + Snake head radius (~15)
            if (d < 35) {
                fb.alive = false; // Destroy fireball on hit
                return fb.pos.copy(); // Return collision point
            }
        }
        return null;
    }
}
