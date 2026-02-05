class Bat extends Vehicle {
    constructor(x, y, vx, vy) {
        super(x, y);
        this.velocity = createVector(vx, vy);

        this.maxSpeed = random(3, 5);
        this.maxForce = 0.2;
        this.r = random(20, 35); // Large enough to be visible in foreground

        this.flapAngle = random(TWO_PI);
        this.flapSpeed = random(0.15, 0.25);

        // Aesthetic setup - Lightened for visibility against dark cave
        this.bodyColor = color(60, 60, 80);
        this.wingColor = color(40, 20, 60);
        this.eyeColor = color(255, 50, 50); // Brighter eyes
    }

    flock(bats) {
        // Core Boids behaviors from base Vehicle class
        let sep = this.separate(bats, 50);
        let ali = this.align(bats, 100);
        let coh = this.cohesion(bats, 100);

        // Adjust weights for the "flock" feel
        sep.mult(1.5);
        ali.mult(1.0);
        coh.mult(1.0);

        this.applyForce(sep);
        this.applyForce(ali);
        this.applyForce(coh);
    }

    update() {
        // Base vehicle physics
        this.velocity.add(this.acceleration);
        this.velocity.limit(this.maxSpeed);
        this.position.add(this.velocity);
        this.acceleration.mult(0);

        // Animation update
        this.flapAngle += this.flapSpeed;
    }

    display() {
        let angle = this.velocity.heading();
        // Adjust flap intensity for the new organic shape
        let flap = sin(this.flapAngle);
        let wingSpan = map(flap, -1, 1, this.r * 0.15, this.r * 1.5);
        let foldOffset = map(flap, -1, 1, this.r * 0.25, 0); // Scallops "fold" more when wings are up

        push();
        translate(this.position.x, this.position.y);
        rotate(angle);

        // --- WINGS ---
        fill(this.wingColor);
        stroke(20, 10, 30, 150); // Subtle dark outline
        strokeWeight(1);

        // Draw Left Wing
        this.drawRealisticWing(-1, wingSpan, foldOffset);
        // Draw Right Wing
        this.drawRealisticWing(1, wingSpan, foldOffset);

        // --- BODY ---
        noStroke();
        fill(this.bodyColor);
        // Main body
        ellipse(0, 0, this.r * 0.8, this.r * 0.4);

        // Head
        ellipse(this.r * 0.3, 0, this.r * 0.4, this.r * 0.4);

        // Pointy Ears
        push();
        translate(this.r * 0.35, 0);
        rotate(-0.3);
        triangle(0, -this.r * 0.05, 0, -this.r * 0.2, this.r * 0.1, -this.r * 0.05);
        rotate(0.6);
        triangle(0, this.r * 0.05, 0, this.r * 0.2, this.r * 0.1, this.r * 0.05);
        pop();

        // Tiny Glowing Red Eyes
        fill(this.eyeColor);
        ellipse(this.r * 0.4, -this.r * 0.08, 2, 2);
        ellipse(this.r * 0.4, this.r * 0.08, 2, 2);

        pop();
    }

    /**
     * Helper to draw a realistic scalloped bat wing
     */
    drawRealisticWing(side, span, fold) {
        // side: -1 for left (up), 1 for right (down) - scaling mirrors it
        push();
        scale(1, side);

        beginShape();
        vertex(0, 0); // Start at body joint

        // 1. Upper Edge (Shoulder to Tip)
        bezierVertex(
            -this.r * 0.2, -span * 0.3, // Curve "out" from shoulder
            this.r * 0.1, -span * 0.8,  // Arch upward
            -this.r * 0.4, -span        // Wing Tip
        );

        // 2. Scalloped Bottom Edge (Membrane curves)
        // Scallop 1 (Finger Tip to Mid-Finger)
        bezierVertex(
            -this.r * 0.2, -span * 0.7 + fold,
            -this.r * 0.1, -span * 0.6 + fold,
            this.r * 0.05, -span * 0.5
        );
        // Scallop 2 (Mid-Finger to Inner Finger)
        bezierVertex(
            this.r * 0.1, -span * 0.4 + fold,
            this.r * 0.15, -span * 0.3 + fold,
            this.r * 0.2, -span * 0.2
        );
        // Scallop 3 (Inner Finger to Body)
        bezierVertex(
            this.r * 0.25, -span * 0.1 + fold,
            this.r * 0.28, -span * 0.05 + fold,
            this.r * 0.3, 0
        );

        endShape(CLOSE);

        // 3. Wing "Bones" (Structural ribs for detail)
        stroke(this.bodyColor);
        strokeWeight(1);
        noFill();
        // Rib 1 (Finger to Wing Tip) - Implicit in top edge
        // Rib 2 (Finger 2)
        line(0, 0, this.r * 0.05, -span * 0.5);
        // Rib 3 (Finger 3)
        line(0, 0, this.r * 0.2, -span * 0.2);

        pop();
    }

    isOffScreen() {
        const margin = 200; // Large margin to ensure they fly completely across
        return (this.position.x < -margin || this.position.x > width + margin ||
            this.position.y < -margin || this.position.y > height + margin);
    }
}

class BatFlock {
    constructor() {
        this.bats = [];
        this.nextPulseTime = 0;
    }

    triggerPulse() {
        // Randomize spawn direction for variety
        let pulseType = floor(random(4)); // 0: L-R, 1: R-L, 2: T-B, 3: B-T
        let count = floor(random(15, 25)); // Randomized amount as requested

        let startX, startY, vx, vy;

        for (let i = 0; i < count; i++) {
            let spread = 200;
            switch (pulseType) {
                case 0: // Left to Right
                    startX = -100 - random(spread);
                    startY = random(height);
                    vx = random(5, 8);
                    vy = random(-1, 1);
                    break;
                case 1: // Right to Left
                    startX = width + 100 + random(spread);
                    startY = random(height);
                    vx = random(-8, -5);
                    vy = random(-1, 1);
                    break;
                case 2: // Top to Bottom
                    startX = random(width);
                    startY = -100 - random(spread);
                    vx = random(-1, 1);
                    vy = random(5, 8);
                    break;
                case 3: // Bottom to Top
                    startX = random(width);
                    startY = height + 100 + random(spread);
                    vx = random(-1, 1);
                    vy = random(-8, -5);
                    break;
            }
            this.bats.push(new Bat(startX, startY, vx, vy));
        }
    }

    update() {
        // Auto-trigger
        if (millis() > this.nextPulseTime) {
            this.triggerPulse();
            this.nextPulseTime = millis() + random(6000, 12000); // Pulse every 6-12s
        }

        for (let i = this.bats.length - 1; i >= 0; i--) {
            let b = this.bats[i];
            b.flock(this.bats);
            b.update();
            if (b.isOffScreen()) {
                this.bats.splice(i, 1);
            }
        }
    }

    display() {
        for (let b of this.bats) {
            b.display();
        }
    }
}
