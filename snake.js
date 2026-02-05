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
    }

    addSegment() {
        let last = this.segments[this.segments.length - 1];
        let newSeg = new Vehicle(last.position.x, last.position.y);
        newSeg.maxSpeed = 10;
        newSeg.maxForce = 0.6;
        this.segments.push(newSeg);
    }

    update(target, obstacles, toxicSnakes = [], foods = []) {
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

            // Normal player-controlled behavior
            let arriveForce = head.arrive(target, 100);
            let avoidForce = head.avoid(obstacles);
            head.applyForce(arriveForce);
            head.applyForce(avoidForce.mult(2.0));
        }

        // IMPORTANT: Calculate boundary steering force BEFORE update
        head.boundaries(40);
        head.update();

        for (let i = 1; i < this.segments.length; i++) {
            let segment = this.segments[i];
            let prev = this.segments[i - 1];
            // Reduce stopDistance to 12 to ensure 16px radius segments overlap (8+8=16 > 12)
            let arriveForce = segment.arrive(prev.position, 40, 12);
            segment.applyForce(arriveForce);
            segment.update();
        }
    }

    display(mascotImg) {
        this.segments[0].drawDebug();
        // Draw tail-to-head so the head sits on top
        for (let i = this.segments.length - 1; i >= 0; i--) {
            let inter = map(i, 0, this.segments.length, 0, 1);
            let c = lerpColor(color(74, 222, 128), color(22, 101, 52), inter);

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

                // Draw a simple aura/glow behind the mascot
                drawingContext.shadowBlur = 15;
                drawingContext.shadowColor = color(74, 222, 128);

                // Offset image so its "neck" is at the pivot (0,0)
                image(mascotImg, 0, -20, 60, 60);
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
