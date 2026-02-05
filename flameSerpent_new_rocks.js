const BossState = {
    WANDERING: 'WANDERING',
    TRACKING: 'TRACKING',
    SEEKING: 'SEEKING',  // For intentional movement
    INHALING: 'INHALING',
    EXHALING: 'EXHALING',
    DASH_PREP: 'DASH_PREP',
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
                this.life = 600; // Rocks stay for 10 seconds
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
