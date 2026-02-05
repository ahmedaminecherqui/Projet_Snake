class Obstacle {
    constructor(x, y, r = 30) {
        this.position = createVector(x, y);
        this.r = r;
        this.shapeType = floor(random(3)); // 0: Circle, 1: Triangle, 2: Oval
        this.rotation = random(TWO_PI);
    }

    display() {
        push();
        translate(this.position.x, this.position.y);
        rotate(this.rotation);

        // Toxic Glow
        drawingContext.shadowBlur = 20;
        let c = color(220, 38, 38); 
        drawingContext.shadowColor = c;

        fill(c);
        noStroke();

        if (this.shapeType === 0) {
            ellipse(0, 0, this.r * 2);
        } else if (this.shapeType === 1) {
            beginShape();
            vertex(0, -this.r);
            vertex(this.r * 1.0, this.r * 0.8);
            vertex(-this.r * 1.0, this.r * 0.8);
            endShape(CLOSE);
        } else {
            ellipse(0, 0, this.r * 2.5, this.r * 1.5);
        }
        pop();
    }
}
