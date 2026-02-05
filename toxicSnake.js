class ToxicSnake {
    constructor(x, y, initialPursueWeight = 0.45) {
        this.segments = [];
        this.baseMaxSpeed = random(4.5, 5.5); // Faster enemies
        this.baseMaxForce = random(0.15, 0.25);
        this.pursueWeight = initialPursueWeight;

        let head = new Vehicle(x, y);
        head.maxSpeed = this.baseMaxSpeed;
        head.maxForce = this.baseMaxForce;
        this.segments.push(head);

        for (let i = 0; i < 10; i++) {
            this.addSegment();
        }
    }

    addSegment() {
        let last = this.segments[this.segments.length - 1];
        let newSeg = new Vehicle(last.position.x, last.position.y);
        newSeg.maxSpeed = 7; // Faster body to keep up with head
        newSeg.maxForce = 0.5; // Stronger force to prevent detachment
        this.segments.push(newSeg);
    }

    update(obstacles, playerSnake) {
        let head = this.segments[0];

        // NPC Behavior combination
        let wanderForce = head.wander();
        let avoidForce = head.avoid(obstacles);

        // Pursue player head at variable weight
        let pursueForce = head.pursue(playerSnake.segments[0]);

        head.applyForce(wanderForce.mult(1 - this.pursueWeight));
        head.applyForce(pursueForce.mult(this.pursueWeight));
        head.applyForce(avoidForce.mult(1.5)); // Avoidance has higher weight

        // IMPORTANT: Calculate boundary steering force BEFORE update
        head.boundaries(40);
        head.update();

        for (let i = 1; i < this.segments.length; i++) {
            let segment = this.segments[i];
            let prev = this.segments[i - 1];
            // Tighter overlap (dist 10) to ensure cohesion during sharp turns
            let arriveForce = segment.arrive(prev.position, 40, 10);
            segment.applyForce(arriveForce);
            segment.update();
        }
    }

    display() {
        this.segments[0].drawDebug();
        // Draw tail-to-head so the head sits on top
        for (let i = this.segments.length - 1; i >= 0; i--) {
            let inter = map(i, 0, this.segments.length, 0, 1);
            let c = lerpColor(color(34, 197, 94), color(88, 28, 135), inter);

            // Normalize size if forming word
            let size = (gameState === COMPLETING) ? 1.0 : map(i, 0, this.segments.length, 1.2, 0.5);

            if (i === 0) {
                // Body "socket" joint
                fill(c);
                noStroke();
                ellipse(this.segments[i].position.x, this.segments[i].position.y, 22 * size);

                // Glowy sharp head
                push();
                translate(this.segments[i].position.x, this.segments[i].position.y);

                // Match the anti-twitch logic from the player snake
                let angle;
                if (gameState === COMPLETING && this.segments[i].velocity.mag() < 0.05) {
                    angle = this.segments[i]._lastHeading || 0;
                } else {
                    angle = this.segments[i].velocity.heading() + PI / 2;
                    this.segments[i]._lastHeading = angle;
                }
                rotate(angle);
                drawingContext.shadowBlur = 15;
                drawingContext.shadowColor = color(34, 197, 94);
                fill(c);
                noStroke();
                // Draw triangle with BASE at pivot (0,0) so it doesn't disconnect when turning
                triangle(-12, 5, 12, 5, 0, -25);
                // Eyes
                fill(255);
                ellipse(-5, -5, 5, 5);
                ellipse(5, -5, 5, 5);
                pop();
            } else {
                // Overlapping body circles
                fill(c);
                noStroke();
                ellipse(this.segments[i].position.x, this.segments[i].position.y, 22 * size);
            }
        }
    }

    setDifficulty(score) {
        let scale = 1 + score * 0.05;
        let head = this.segments[0];
        head.maxSpeed = constrain(this.baseMaxSpeed * scale, 0, 8);
        head.maxForce = constrain(this.baseMaxForce * scale, 0, 0.4);
    }
}
