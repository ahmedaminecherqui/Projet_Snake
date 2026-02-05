class Vehicle {
    constructor(x, y) {
        this.position = createVector(x, y);
        this.velocity = createVector(0, 0);
        this.acceleration = createVector(0, 0);
        this.maxSpeed = 5;
        this.maxForce = 0.25;
        this.wanderTheta = random(TWO_PI);
        this.r = 12; // Radius for collision/avoidance
    }

    applyForce(force) {
        this.acceleration.add(force);
    }

    update() {
        this.velocity.add(this.acceleration);
        this.velocity.limit(this.maxSpeed);
        this.position.add(this.velocity);

        // Physical wall: hard constraint to screen dimensions
        this.position.x = constrain(this.position.x, 5, width - 5);
        this.position.y = constrain(this.position.y, 5, height - 5);

        this.acceleration.mult(0);
    }

    seek(target) {
        let desired = p5.Vector.sub(target, this.position);
        desired.setMag(this.maxSpeed);
        let steer = p5.Vector.sub(desired, this.velocity);
        steer.limit(this.maxForce);
        return steer;
    }

    arrive(target, range = 100, stopDistance = 0) {
        let desired = p5.Vector.sub(target, this.position);
        let d = desired.mag();
        if (d < stopDistance) {
            this.velocity.mult(0);
            return createVector(0, 0);
        }
        if (d < range) {
            let m = map(d, stopDistance, range, 0, this.maxSpeed);
            desired.setMag(m);
        } else {
            desired.setMag(this.maxSpeed);
        }
        let steer = p5.Vector.sub(desired, this.velocity);
        steer.limit(this.maxForce);
        return steer;
    }

    pursue(vehicle) {
        let target = vehicle.position.copy();
        let prediction = vehicle.velocity.copy();
        prediction.mult(10);
        target.add(prediction);
        return this.seek(target);
    }

    evade(vehicle) {
        let pursuit = this.pursue(vehicle);
        pursuit.mult(-1);
        return pursuit;
    }

    wander() {
        let wanderPoint = this.velocity.copy();
        wanderPoint.setMag(100);
        wanderPoint.add(this.position);

        let wanderRadius = 50;
        let theta = this.wanderTheta + this.velocity.heading();
        let x = wanderRadius * cos(theta);
        let y = wanderRadius * sin(theta);
        wanderPoint.add(x, y);

        let steer = this.seek(wanderPoint);
        this.wanderTheta += random(-0.5, 0.5);
        return steer;
    }

    getObstacleLePlusProche(obstacles) {
        if (!obstacles || !Array.isArray(obstacles)) return undefined;
        let plusPetiteDistance = Infinity;
        let obstacleLePlusProche = undefined;

        obstacles.forEach(o => {
            const distance = this.position.dist(o.position);
            if (distance < plusPetiteDistance) {
                plusPetiteDistance = distance;
                obstacleLePlusProche = o;
            }
        });

        return obstacleLePlusProche;
    }

    avoid(obstacles) {
        // Implementation based on Reynolds/M2 course
        let ahead = this.velocity.copy();
        ahead.mult(30); // Look ahead 30 frames
        let ahead2 = ahead.copy();
        ahead2.mult(0.5);

        let pointAuBoutDeAhead = p5.Vector.add(this.position, ahead);
        let pointAuBoutDeAhead2 = p5.Vector.add(this.position, ahead2);

        let obstacleLePlusProche = this.getObstacleLePlusProche(obstacles);

        if (!obstacleLePlusProche) {
            return createVector(0, 0);
        }

        let distance1 = pointAuBoutDeAhead.dist(obstacleLePlusProche.position);
        let distance2 = pointAuBoutDeAhead2.dist(obstacleLePlusProche.position);
        let distance = min(distance1, distance2);

        // Check if collision is likely
        let avoidanceZone = 20; // Margin around obstacle
        if (distance < (obstacleLePlusProche.r || 30) + avoidanceZone) {
            let force;
            if (distance1 < distance2) {
                force = p5.Vector.sub(pointAuBoutDeAhead, obstacleLePlusProche.position);
            } else {
                force = p5.Vector.sub(pointAuBoutDeAhead2, obstacleLePlusProche.position);
            }

            force.setMag(this.maxSpeed);
            force.sub(this.velocity);
            force.limit(this.maxForce);
            return force;
        }
        return createVector(0, 0);
    }

    separate(targets, radius = 50) {
        let steer = createVector(0, 0);
        let count = 0;
        for (let target of targets) {
            let d = p5.Vector.dist(this.position, target);
            if (d > 0 && d < radius) {
                let diff = p5.Vector.sub(this.position, target);
                diff.normalize();
                diff.div(d); // Weight by distance
                steer.add(diff);
                count++;
            }
        }
        if (count > 0) {
            steer.div(count);
            steer.setMag(this.maxSpeed);
            steer.sub(this.velocity);
            steer.limit(this.maxForce);
        }
        return steer;
    }

    boundaries(d) {
        let desired = null;
        if (this.position.x < d) {
            desired = createVector(this.maxSpeed, this.velocity.y);
        } else if (this.position.x > width - d) {
            desired = createVector(-this.maxSpeed, this.velocity.y);
        }

        if (this.position.y < d) {
            desired = createVector(this.velocity.x, this.maxSpeed);
        } else if (this.position.y > height - d) {
            desired = createVector(this.velocity.x, -this.maxSpeed);
        }

        if (desired !== null) {
            desired.setMag(this.maxSpeed);
            let steer = p5.Vector.sub(desired, this.velocity);
            steer.limit(this.maxForce * 2.5); // Stronger reinforcement
            this.applyForce(steer);
        }
    }

    drawDebug() {
        if (!Vehicle.debug) return;

        // Draw Look-Ahead Vectors (for avoid)
        let ahead = this.velocity.copy();
        ahead.mult(30);
        let ahead2 = ahead.copy().mult(0.5);

        push();
        stroke(255, 255, 0, 150); // Yellow for ahead
        strokeWeight(2);
        line(this.position.x, this.position.y, this.position.x + ahead.x, this.position.y + ahead.y);

        stroke(255, 150, 0, 150); // Orange for ahead2
        line(this.position.x, this.position.y, this.position.x + ahead2.x, this.position.y + ahead2.y);

        // Target points
        fill(255, 0, 0);
        noStroke();
        ellipse(this.position.x + ahead.x, this.position.y + ahead.y, 8, 8);
        fill(0, 0, 255);
        ellipse(this.position.x + ahead2.x, this.position.y + ahead2.y, 8, 8);
        pop();
    }
}
Vehicle.debug = false;
