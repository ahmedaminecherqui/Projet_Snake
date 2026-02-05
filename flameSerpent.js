class FlameSerpent extends Vehicle {
    constructor(x, y) {
        super(x, y);
        this.segments = [];
        this.numSegments = 75; // Boss is gargantuan!
        this.segmentSize = 95; // Boss is wide!

        // Stats
        this.maxSpeed = 3; // Slow but majestic
        this.maxForce = 0.15;

        // Initialize segments
        for (let i = 0; i < this.numSegments; i++) {
            this.segments.push(new Vehicle(x, y));
        }

        // Color Palette
        this.colorMain = color(220, 38, 38); // Red
        this.colorAccent = color(251, 191, 36); // Gold/Fire
        this.colorDark = color(69, 10, 10); // Dark Blood Red

        // Health
        this.maxHealth = 6;
        this.health = 6;

        // Cinematic Overrides
        this.headRotationOverride = null;
    }

    /**
     * Spiritually coils the boss into a tight spiral for the intro.
     * @param {number} centerX
     * @param {number} centerY
     * @param {boolean} instant If true, snaps instead of lerping
     */
    setCoiledLayout(centerX, centerY, instant = false) {
        for (let i = 0; i < this.segments.length; i++) {
            let seg = this.segments[i];

            // TIGHT SPIRAL: Spacing based on segment size
            // i=0 is head (center), i=N is tail (outer)
            let angle = i * 0.35;
            let radius = i * (this.segmentSize * 0.08); // Ultra-tight spacing (0.08)

            let targetX = centerX + cos(angle) * radius;
            let targetY = centerY + sin(angle) * radius;

            if (instant) {
                seg.position.x = targetX;
                seg.position.y = targetY;
            } else {
                seg.position.x = lerp(seg.position.x, targetX, 0.15);
                seg.position.y = lerp(seg.position.y, targetY, 0.15);
            }

            // Set velocity/heading to match the spiral curve
            let nextAngle = (i + 1) * 0.35;
            let dir = createVector(cos(nextAngle) - cos(angle), sin(nextAngle) - sin(angle));
            seg.velocity = dir;
        }
    }

    update(obstacles = [], skipWander = false) {
        let head = this.segments[0];

        if (!skipWander) {
            // 1. Autonomous Wandering
            let wanderForce = head.wander();
            let avoidForce = head.avoid(obstacles);
            head.applyForce(wanderForce);
            head.applyForce(avoidForce.mult(2.0));
        }

        head.update();

        // 2. Segment Following Logic
        for (let i = 1; i < this.segments.length; i++) {
            let prev = this.segments[i - 1].position;
            let current = this.segments[i].position;

            // Arrive at a point behind the previous segment
            // Safe manual subtraction
            let dx = prev.x - current.x;
            let dy = prev.y - current.y;
            let dist = sqrt(dx * dx + dy * dy);
            let targetDist = this.segmentSize * 0.4; // Tight overlap for scaly look

            if (dist > targetDist) {
                let desiredMag = dist - targetDist;
                let desiredX = (dx / dist) * desiredMag;
                let desiredY = (dy / dist) * desiredMag;
                current.add(desiredX, desiredY);
            }

            // Smoothing rotation using manual atan2
            let angle = atan2(dy, dx);
            this.segments[i].velocity = p5.Vector.fromAngle(angle);
        }
    }

    display() {
        // Draw tail-to-head
        for (let i = this.segments.length - 1; i >= 0; i--) {
            let seg = this.segments[i];
            let pos = seg.position;
            let angle = (i === 0 && this.headRotationOverride !== null) ?
                this.headRotationOverride :
                seg.velocity.heading();

            let isHead = (i === 0);
            let isTailTip = (i === this.segments.length - 1);

            // Calculate size tapering
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
        // 1. Flaming Glow
        noStroke();
        fill(251, 146, 60, 30); // Orange glow
        ellipse(0, 0, size * 1.8, size * 1.3);

        // 2. Main Body (Darker)
        fill(this.colorDark);
        ellipse(0, 0, size, size * 0.8);

        // 3. Scales (Procedural details)
        fill(this.colorMain);
        let scaleSize = size * 0.3;
        // Draw 3 scales on top for texture
        ellipse(size * 0.1, size * 0.1, scaleSize);
        ellipse(size * 0.1, -size * 0.1, scaleSize);
        ellipse(-size * 0.1, 0, scaleSize);

        // 4. Thorns (Left and Right - Sharper & Layered)
        fill(this.colorAccent);
        noStroke();
        // Thorn L (Outer)
        beginShape();
        vertex(0, -size * 0.35);
        vertex(-size * 0.6, -size * 0.8);
        vertex(size * 0.2, -size * 0.35);
        endShape(CLOSE);
        // Thorn L (Inner detailing)
        fill(255, 150, 0, 150);
        triangle(size * 0.1, -size * 0.35, -size * 0.2, -size * 0.55, -size * 0.1, -size * 0.35);

        fill(this.colorAccent);
        // Thorn R (Outer)
        beginShape();
        vertex(0, size * 0.35);
        vertex(-size * 0.6, size * 0.8);
        vertex(size * 0.2, size * 0.35);
        endShape(CLOSE);
        // Thorn R (Inner detailing)
        fill(255, 150, 0, 150);
        triangle(size * 0.1, size * 0.35, -size * 0.2, size * 0.55, -size * 0.1, size * 0.35);
    }

    drawHead(size) {
        // 1. Massive Glowing Aura
        fill(251, 191, 36, 40);
        ellipse(0, 0, size * 2.5);
        fill(255, 100, 0, 20);
        ellipse(0, 0, size * 3.5);

        // 2. Main Head Structure
        fill(this.colorDark);
        beginShape();
        vertex(-size * 0.5, -size * 0.5); // Back Top
        vertex(size * 0.2, -size * 0.6);  // Brow peak
        vertex(size * 0.8, -size * 0.4);  // Upper nose
        vertex(size * 1.2, 0);            // Snout tip
        vertex(size * 0.8, size * 0.4);   // Lower nose
        vertex(size * 0.5, size * 0.6);   // Jaw curve
        vertex(-size * 0.5, size * 0.5);  // Back Bottom
        endShape(CLOSE);

        // 3. Helm Scales (Armored Crown)
        fill(20, 5, 5); // Near black
        for (let i = 0; i < 3; i++) {
            let offset = i * size * 0.25;
            push();
            translate(-size * 0.3 + offset, -size * 0.3);
            rotate(-0.2);
            beginShape(); // Sharp plate
            vertex(0, 0);
            vertex(size * 0.3, -size * 0.1);
            vertex(size * 0.4, size * 0.1);
            vertex(0, size * 0.2);
            endShape(CLOSE);
            pop();
        }

        // 4. Sharp Fangs (Visible from jaw)
        fill(255, 250, 240); // Bone white
        triangle(size * 0.8, size * 0.2, size * 1.0, size * 0.5, size * 0.6, size * 0.3);
        triangle(size * 0.8, -size * 0.2, size * 1.0, -size * 0.5, size * 0.6, -size * 0.3);

        // 5. Lateral Fins (Jaw Wings)
        fill(this.colorMain);
        noStroke();
        // Left Fin
        beginShape();
        vertex(-size * 0.2, -size * 0.4);
        bezierVertex(-size * 0.8, -size * 1.2, -size * 0.1, -size * 1.5, 0, -size * 0.5);
        endShape(CLOSE);
        // Right Fin
        beginShape();
        vertex(-size * 0.2, size * 0.4);
        bezierVertex(-size * 0.8, size * 1.2, -size * 0.1, size * 1.5, 0, size * 0.5);
        endShape(CLOSE);

        // 6. Evil Flaming Eyes (Intense Version)
        let eyeX = size * 0.45;
        let eyeY = size * 0.25;

        // Eye Socket Shadow
        fill(0, 150);
        ellipse(eyeX, eyeY, size * 0.4, size * 0.45);
        ellipse(eyeX, -eyeY, size * 0.4, size * 0.45);

        // Intense Glow
        fill(255, 150, 0);
        ellipse(eyeX + 5, eyeY, size * 0.3);
        ellipse(eyeX + 5, -eyeY, size * 0.3);

        // Inner Slit (Evil yellow)
        fill(255, 255, 0);
        ellipse(eyeX + size * 0.08, eyeY, size * 0.15, size * 0.25);
        ellipse(eyeX + size * 0.08, -eyeY, size * 0.15, size * 0.25);

        // Sharp Vertical Pupil
        fill(0);
        rectMode(CENTER);
        rect(eyeX + size * 0.1, eyeY, size * 0.03, size * 0.2, 5);
        rect(eyeX + size * 0.1, -eyeY, size * 0.03, size * 0.2, 5);

        // 7. Flaming Horns (Extended)
        stroke(this.colorAccent);
        strokeWeight(4);
        noFill();
        line(eyeX - 10, -eyeY - 10, eyeX + 25, -eyeY - 35);
        line(eyeX - 10, eyeY + 10, eyeX + 25, eyeY + 35);
        noStroke();
    }

    drawTailTip(size) {
        // Pointy "Blade" Tail
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

    /**
     * Checks if the player snake's head collides with any part of the boss.
     * @param {Snake} playerSnake 
     * @returns {p5.Vector|null}
     */
    checkCollision(playerSnake) {
        if (!playerSnake || playerSnake.segments.length === 0) return null;

        const playerHead = playerSnake.segments[0].position;

        // We only check the player's head against the boss's segments
        for (let i = 0; i < this.segments.length; i++) {
            const bossSeg = this.segments[i].position;
            // Safe manual distance calculation to avoid potential p5.Vector internal errors
            const dx = playerHead.x - bossSeg.x;
            const dy = playerHead.y - bossSeg.y;
            const dist = sqrt(dx * dx + dy * dy);

            // Tapered collision radius
            let taper;
            if (i === 0) taper = 1.2;
            else if (i < 5) taper = map(i, 0, 5, 1.2, 1.0);
            else taper = map(i, 5, this.segments.length, 1.0, 0.4);

            const bossRadius = (this.segmentSize * taper) * 0.7; // Thorns add reach

            if (dist < bossRadius + 15) { // 15 is a small buffer for player head
                return bossSeg.copy();
            }
        }
        return null;
    }
}
