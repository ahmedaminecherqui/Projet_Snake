class BossRenderer {
    constructor() {
        this.active = false;
        this.bossType = null;
        this.cols = []; // Columns (joined rocks)
        this.rocks = []; // Separate rocks
        this.fissures = []; // Magma fissures
        this.embers = []; // Floating particles
    }

    init(bossType) {
        this.bossType = bossType;
        this.active = true;
        this.generateTerrain();
    }

    stop() {
        this.active = false;
    }

    generateTerrain() {
        this.active = true;
        this.rocks = [];
        this.cols = [];
        this.fissures = [];

        randomSeed(12345); // Fixed seed for consistent terrain layout

        // 1. Generate Magma Fissures (Recursive & Branching)
        for (let i = 0; i < 4; i++) {
            let x = random(100, width - 100);
            let y = random(100, height - 100);
            let len = random(400, 900);
            let angle = random(TWO_PI);
            let widthMax = random(12, 25);
            this.createRecursiveFissure(x, y, angle, len, widthMax, 2);
        }

        // 2. Generate SHARP Rocks & Columns
        let density = 120;
        for (let x = -50; x < width + 50; x += density) {
            // Chance for a full column
            if (random() < 0.1) {
                let centerW = random(50, 90);
                this.cols.push(this.createSharpColumn(x, centerW));
                x += centerW * 0.5;
            } else {
                // Sharp Stalagmites (Bottom)
                let h = random(100, 300); // Taller, sharper
                let w = random(40, 100);
                this.rocks.push(this.createSharpSpike(x, height, w, -h));

                // Sharp Stalactites (Top)
                let h2 = random(80, 250);
                let w2 = random(40, 100);
                this.rocks.push(this.createSharpSpike(x, 0, w2, h2));
            }
        }
    }

    createRecursiveFissure(x, y, angle, len, wMax, depth) {
        if (depth < 0 || len < 40) return;

        let fissurePoly = [];
        let p1 = [];
        let p2 = [];

        let steps = floor(len / 10);
        let seedOffset = random(1000);

        for (let j = 0; j <= steps; j++) {
            let t = j / steps;
            let wander = (noise(t * 3, seedOffset) - 0.5) * 1.5;
            let curAngle = angle + wander;
            let dx = cos(curAngle) * (len * t);
            let dy = sin(curAngle) * (len * t);
            let curX = x + dx;
            let curY = y + dy;
            let taper = sin(t * PI);
            let thickness = wMax * taper * (0.5 + noise(t * 10, seedOffset) * 0.5);
            if (thickness < 1) thickness = 1;
            let perpX = -sin(curAngle);
            let perpY = cos(curAngle);

            p1.push({ x: curX + perpX * (thickness * 0.5), y: curY + perpY * (thickness * 0.5) });
            p2.push({ x: curX - perpX * (thickness * 0.5), y: curY - perpY * (thickness * 0.5) });

            if (depth > 0 && t > 0.2 && t < 0.8 && random() < 0.05) {
                let branchAngle = curAngle + random(0.5, 1.5) * (random() < 0.5 ? 1 : -1);
                let branchLen = len * random(0.3, 0.6);
                let branchWidth = wMax * 0.4;
                this.createRecursiveFissure(curX, curY, branchAngle, branchLen, branchWidth, depth - 1);
            }
        }
        this.fissures.push([...p1, ...p2.reverse()]);
    }

    // STRICT CONICAL SPIKE GENERATOR
    createSharpSpike(x, startY, w, h) {
        let poly = [];
        let steps = 15;

        // Left side (Base to Tip)
        for (let i = 0; i <= steps; i++) {
            let t = i / steps; // 0 to 1

            // Linear Taper for Sharpness
            let taper = (1 - t);

            // Subtle Surface Roughness (no huge deformities)
            let rough = (noise(x, i * 0.5) - 0.5) * 15 * taper; // Less rough at tip

            let curY = startY + h * t;
            let curX = x + (w * 0.5 * (1 - taper)) + rough; // Left edge

            if (i === 0) curX = x; // Pin base left
            if (i === steps) curX = x + w * 0.5; // Pin tip

            poly.push({ x: curX, y: curY });
        }

        // Right side (Tip to Base)
        for (let i = steps; i >= 0; i--) {
            let t = i / steps;
            let taper = (1 - t);
            let rough = (noise(x + 100, i * 0.5) - 0.5) * 15 * taper;

            let curY = startY + h * t;
            let curX = x + w - (w * 0.5 * (1 - taper)) + rough; // Right edge

            if (i === 0) curX = x + w; // Pin base right
            if (i === steps) curX = x + w * 0.5; // Pin tip

            poly.push({ x: curX, y: curY });
        }
        return poly;
    }

    // STRICT COLUMN GENERATOR
    createSharpColumn(x, w) {
        let poly = [];
        let steps = 20;
        let leftSide = [];
        let rightSide = [];

        for (let i = 0; i <= steps; i++) {
            let t = i / steps;
            let curY = height * t;

            // Subtle waist (Hourglass but minimal)
            let shape = 0.7 + 0.3 * Math.pow(Math.abs(t - 0.5) * 2, 2);
            let curW = w * shape;

            // Subtle Roughness
            let nLeft = (noise(x, i * 0.3) - 0.5) * 20;
            let nRight = (noise(x + 500, i * 0.3) - 0.5) * 20;

            let cx = x + w / 2;
            leftSide.push({ x: cx - curW / 2 + nLeft, y: curY });
            rightSide.push({ x: cx + curW / 2 + nRight, y: curY });
        }
        return [...leftSide, ...rightSide.reverse()];
    }

    drawBackground() {
        if (!this.active) return;
        background(20, 10, 10);
        let pulse = (sin(frameCount * 0.05) + 1) * 0.5;
        let magmaColor = lerpColor(color(200, 50, 0), color(255, 150, 0), pulse);

        // --- OPTIMIZED FISSURE GLOW (Fast pass instead of Native Shadow) ---
        noStroke();
        fill(255, 100, 0, 40 + pulse * 20); // Fast glow pass
        for (let fissure of this.fissures) {
            beginShape();
            for (let p of fissure) vertex(p.x, p.y);
            endShape(CLOSE);
        }

        fill(magmaColor);
        for (let fissure of this.fissures) {
            beginShape();
            for (let p of fissure) vertex(p.x, p.y);
            endShape(CLOSE);
        }
    }

    drawForeground() {
        if (!this.active) return;

        fill(10, 5, 5);
        stroke(60, 30, 30);
        strokeWeight(2);
        strokeJoin(MITER); // Sharp corners for spikes

        for (let rock of this.rocks) {
            beginShape();
            for (let p of rock) vertex(p.x, p.y);
            endShape(CLOSE);
        }

        for (let col of this.cols) {
            beginShape();
            for (let p of col) vertex(p.x, p.y);
            endShape(CLOSE);
        }

        if (frameCount % 5 === 0) {
            this.embers.push({ x: random(width), y: height, vx: random(-0.5, 0.5), vy: random(-1, -3), life: 255 });
        }

        noStroke();
        for (let i = this.embers.length - 1; i >= 0; i--) {
            let e = this.embers[i];
            e.x += e.vx; e.y += e.vy; e.life -= 3;
            if (e.life <= 0) this.embers.splice(i, 1);
            else {
                fill(255, 100, 0, e.life);
                ellipse(e.x, e.y, 4 + random(2));
            }
        }

        let grad = drawingContext.createRadialGradient(width / 2, height / 2, height * 0.3, width / 2, height / 2, height);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.8)');
        drawingContext.fillStyle = grad;
        rect(0, 0, width, height);
    }
}
