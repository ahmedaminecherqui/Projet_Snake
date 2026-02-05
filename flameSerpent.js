class FlameSerpent extends Vehicle {
    constructor(x, y) {
        super(x, y);
        this.segments = [];
        this.numSegments = 45; // Boss is long!
        this.segmentSize = 65; // Boss is big!

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
    }

    update(obstacles = []) {
        let head = this.segments[0];

        // 1. Autonomous Wandering
        let wanderForce = head.wander();
        let avoidForce = head.avoid(obstacles);
        let boundsForce = head.boundaries(100); // Keep away from edges

        head.applyForce(wanderForce);
        head.applyForce(avoidForce.mult(2.0));

        head.update();

        // 2. Segment Following Logic
        for (let i = 1; i < this.segments.length; i++) {
            let prev = this.segments[i - 1].position;
            let current = this.segments[i].position;

            // Arrive at a point behind the previous segment
            let desired = p5.Vector.sub(prev, current);
            let dist = desired.mag();
            let targetDist = this.segmentSize * 0.4; // Tight overlap for scaly look

            if (dist > targetDist) {
                desired.setMag(dist - targetDist);
                current.add(desired);
            }

            // Smoothing rotation
            let angle = p5.Vector.sub(prev, current).heading();
            this.segments[i].velocity = p5.Vector.fromAngle(angle);
        }
    }

    display() {
        // Draw tail-to-head
        for (let i = this.segments.length - 1; i >= 0; i--) {
            let seg = this.segments[i];
            let pos = seg.position;
            let angle = seg.velocity.heading();
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

        // 4. Thorns (Left and Right)
        fill(this.colorAccent);
        noStroke();
        // Thorn L
        beginShape();
        vertex(0, -size * 0.35);
        vertex(-size * 0.4, -size * 0.7);
        vertex(size * 0.2, -size * 0.35);
        endShape(CLOSE);
        // Thorn R
        beginShape();
        vertex(0, size * 0.35);
        vertex(-size * 0.4, size * 0.7);
        vertex(size * 0.2, size * 0.35);
        endShape(CLOSE);
    }

    drawHead(size) {
        // 1. Large Glowing Aura
        fill(251, 191, 36, 50);
        ellipse(0, 0, size * 2.2);

        // 2. Head Shape
        fill(this.colorDark);
        beginShape();
        vertex(-size * 0.5, -size * 0.4);
        vertex(size * 0.7, -size * 0.3);
        vertex(size, 0);
        vertex(size * 0.7, size * 0.3);
        vertex(-size * 0.5, size * 0.4);
        endShape(CLOSE);

        // 3. Evil Flaming Eyes
        let eyeX = size * 0.4;
        let eyeY = size * 0.2;

        // Outer Glow
        fill(255, 100, 0);
        ellipse(eyeX, eyeY, size * 0.3);
        ellipse(eyeX, -eyeY, size * 0.3);

        // Inner Slit (Evil)
        fill(255, 255, 0);
        ellipse(eyeX + size * 0.05, eyeY, size * 0.15, size * 0.25);
        ellipse(eyeX + size * 0.05, -eyeY, size * 0.15, size * 0.25);

        fill(0); // Pupil
        ellipse(eyeX + size * 0.08, eyeY, size * 0.02, size * 0.15);
        ellipse(eyeX + size * 0.08, -eyeY, size * 0.02, size * 0.15);

        // 4. Flaming "Eyebrows"/Horns
        stroke(this.colorAccent);
        strokeWeight(3);
        noFill();
        line(eyeX - 5, -eyeY - 5, eyeX + 10, -eyeY - 15);
        line(eyeX - 5, eyeY + 5, eyeX + 10, eyeY + 15);
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
            const dist = p5.Vector.dist(playerHead, bossSeg);

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
