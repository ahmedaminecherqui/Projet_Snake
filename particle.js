// Minimal placeholder to avoid 404 if the project doesn't include a separate particle.js
// It only defines simple Particle and ParticleSystem classes if they aren't already present.
if (typeof Particle === 'undefined') {
    class Particle {
        constructor(x, y, c) {
            this.pos = createVector(x, y);
            this.vel = p5.Vector.random2D().mult(random(2, 5));
            this.acc = createVector(0, 0);
            this.lifespan = 255;
            this.c = c || color(255);
        }
        update() {
            this.vel.add(this.acc);
            this.pos.add(this.vel);
            this.lifespan -= 10;
        }
        display() {
            push();
            noStroke();
            if (this.c && this.c.levels) {
                fill(this.c.levels[0], this.c.levels[1], this.c.levels[2], this.lifespan);
            } else {
                fill(255, this.lifespan);
            }
            ellipse(this.pos.x, this.pos.y, 4, 4);
            pop();
        }
        isDead() { return this.lifespan < 0; }
    }
}

if (typeof ParticleSystem === 'undefined') {
    class ParticleSystem {
        constructor() { this.particles = []; }
        burst(x, y, c, n) {
            for (let i = 0; i < n; i++) this.particles.push(new Particle(x, y, c));
        }
        update() {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                this.particles[i].update();
                if (this.particles[i].isDead()) this.particles.splice(i, 1);
            }
        }
        display() { for (let p of this.particles) p.display(); }
    }
}
