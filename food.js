class Food {
    constructor() {
        this.position = createVector(0, 0);
        this.size = 20;
        this.type = floor(random(3)); // 0: Apple, 1: Diamond, 2: Cherry
        this.spawn();
    }

    spawn() {
        let margin = 50;
        this.position.x = random(margin, width - margin);
        this.position.y = random(margin, height - margin);
        this.type = floor(random(3));
    }

    display(spriteSheet) {
        push();
        // Add a vibrant glow to make gems/food "apparent"
        drawingContext.shadowBlur = 15;
        drawingContext.shadowColor = color(251, 191, 36); // Golden glow

        // Pulsing size animation
        let pulse = sin(frameCount * 0.1) * 5;
        let d = 45 + pulse;

        if (!spriteSheet || spriteSheet.width <= 10) {
            // Fallback to high-visibility golden coin/circle
            fill(251, 191, 36);
            stroke(255, 200);
            strokeWeight(2);
            ellipse(this.position.x, this.position.y, d, d);

            // Diamond/Gem interior detail for appearance
            fill(255, 150);
            noStroke();
            rectMode(CENTER);
            push();
            translate(this.position.x, this.position.y);
            rotate(QUARTER_PI);
            rect(0, 0, d * 0.4, d * 0.4);
            pop();
        } else {
            // Draw from sprite sheet
            let sw = spriteSheet.width / 3;
            let sh = spriteSheet.height;
            imageMode(CENTER);
            image(spriteSheet, this.position.x, this.position.y, d, d, this.type * sw, 0, sw, sh);
        }
        pop();
    }
}
