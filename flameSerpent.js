const BossState = {
    WANDERING: 'WANDERING',
    TRACKING: 'TRACKING',
    SEEKING: 'SEEKING',  // For intentional movement
    INHALING: 'INHALING',
    EXHALING: 'EXHALING',
    DASHING: 'DASHING',
    DYING: 'DYING'
};

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
                // We do NOT call head.update() here, so position stays locked.
                break;

            case BossState.INHALING:
            case BossState.EXHALING:
            case BossState.DASHING:
                // Placeholders for next movesets
                break;
        }

        // Segment Following Logic (Trailing behavior)
        // Skip this in TRACKING state to achieve the "Frozen Body" effect
        if (this.currentState !== BossState.TRACKING) {
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

                // Update velocity for heading/rotation
                this.segments[i].velocity = createVector(dx, dy);
            }
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
    }

    drawBodySegment(size, index) {
        noStroke();
        // Inner Heat Glow
        fill(251, 146, 60, 40);
        ellipse(0, 0, size * 1.5, size * 1.1);

        // Core Plates
        fill(this.colorDark);
        stroke(this.colorMain);
        strokeWeight(1);
        ellipse(0, 0, size, size * 0.85);

        // Scales / Heat Details
        noStroke();
        fill(this.colorMain);
        let scaleSize = size * 0.25;
        ellipse(size * 0.1, size * 0.15, scaleSize);
        ellipse(size * 0.1, -size * 0.15, scaleSize);

        // Spike Details
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
        // 1. Heat Halo
        fill(255, 68, 68, 50);
        ellipse(size * 0.3, 0, size * 2.2, size * 1.8);

        // 2. Main Diamond Head (Portrait silhouette)
        fill(this.colorDark);
        stroke(this.colorMain);
        strokeWeight(2.5);
        beginShape();
        vertex(-size * 0.5, -size * 0.4); // Back Top
        vertex(size * 0.1, -size * 0.65); // Peak Top
        vertex(size * 1.25, 0);           // Snout Tip
        vertex(size * 0.1, size * 0.65);  // Peak Bottom
        vertex(-size * 0.5, size * 0.4);  // Back Bottom
        vertex(-size * 0.75, 0);          // Rear
        endShape(CLOSE);

        // 3. Forehead Plate
        fill(this.colorMain);
        noStroke();
        beginShape();
        vertex(0, -size * 0.2);
        vertex(size * 0.5, 0);
        vertex(0, size * 0.2);
        vertex(-size * 0.2, 0);
        endShape(CLOSE);

        // 4. Fangs (Sharp, White)
        fill(255);
        noStroke();
        // Upper Fang
        triangle(size * 0.9, size * 0.1, size * 1.15, size * 0.35, size * 0.8, size * 0.1);
        // Lower Fang
        triangle(size * 0.9, -size * 0.1, size * 1.15, -size * 0.35, size * 0.8, -size * 0.1);

        // 5. Horns (Sharp & Swept Back like portrait)
        fill(this.colorDark);
        stroke(this.colorAccent);
        strokeWeight(2);
        // Top Horn
        beginShape();
        vertex(-size * 0.4, -size * 0.5);
        vertex(-size * 1.5, -size * 1.0);
        vertex(-size * 0.6, -size * 0.35);
        endShape(CLOSE);
        // Bottom Horn
        beginShape();
        vertex(-size * 0.4, size * 0.5);
        vertex(-size * 1.5, size * 1.0);
        vertex(-size * 0.6, size * 0.35);
        endShape(CLOSE);

        // 6. Eyes (Glow Yellow)
        let eyeX = size * 0.4;
        let eyeY = size * 0.3;
        fill(255, 230, 0);
        ellipse(eyeX, -eyeY, size * 0.35, size * 0.2);
        ellipse(eyeX, eyeY, size * 0.35, size * 0.2);

        // Pupil
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
}
