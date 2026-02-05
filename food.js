class Food {
    constructor() {
        this.position = createVector(0, 0);
        this.size = 20;
        this.type = floor(random(6)); // 6 fruit types
        this.fruits = [
            { emoji: '🍎', color: [220, 38, 38] },
            { emoji: '🍐', color: [132, 204, 22] },
            { emoji: '🍒', color: [239, 68, 68] },
            { emoji: '🍌', color: [250, 204, 21] },
            { emoji: '🍉', color: [34, 197, 94] },
            { emoji: '🍊', color: [249, 115, 22] }
        ];
        this.spawnProgress = 0; // Animation progress
        this.spawn();
    }

    spawn() {
        let margin = 50;
        this.position.x = random(margin, width - margin);
        this.position.y = random(margin, height - margin);
        this.type = floor(random(6));
        this.spawnProgress = 0; // Start spawn animation
    }

    display(spriteSheet) {
        push();

        let fruit = this.fruits[this.type];

        // Handle spawn animation (0 to 1 over ~20 frames)
        if (this.spawnProgress < 1) {
            this.spawnProgress += 0.05;
        }

        // Easing for a nice "pop-in" effect
        let scaleVal = p5.Vector.lerp(createVector(0, 0), createVector(1, 1), this.spawnProgress).x;
        // Add a slight overshoot for juice/bounce feel
        let bounce = sin(this.spawnProgress * PI) * 0.2 * (1 - this.spawnProgress);
        let finalScale = scaleVal + bounce;

        // --- OPTIMIZED GLOW (Fast Alpha Layers instead of Native Shadows) ---
        noStroke();
        for (let r = 2; r > 0; r--) {
            fill(fruit.color[0], fruit.color[1], fruit.color[2], 30 * r * finalScale);
            ellipse(this.position.x, this.position.y, 30 * r * finalScale, 30 * r * finalScale);
        }

        // Pulse logic moved here to use finalScale
        let pulse = sin(frameCount * 0.08) * 3;
        let d = (40 * finalScale) + pulse;

        // Ensure full opacity for emojis
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(d);
        text(fruit.emoji, this.position.x, this.position.y);

        // Add subtle rotating sparkle effect only after fully spawned
        if (this.spawnProgress >= 1) {
            let sparkleAngle = frameCount * 0.05;
            let sparkleRadius = d * 0.6;

            fill(255, 255, 255, 150);
            noStroke();
            for (let i = 0; i < 4; i++) {
                let angle = sparkleAngle + (i * PI / 2);
                let sx = this.position.x + cos(angle) * sparkleRadius;
                let sy = this.position.y + sin(angle) * sparkleRadius;
                ellipse(sx, sy, 4, 4);
            }
        }

        pop();
    }
}
