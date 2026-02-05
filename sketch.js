let snake;
let foods = [];
let particles;
let obstacles = [];
let toxicSnakes = [];
let menuSnake;
let score = 0;
let topScore = 0;
let gameOver = false;

// Assets
let mascotImg;
let backgroundImg;
let foodIconsImg;

// Game States
const START = 'START';
const PLAYING = 'PLAYING';
const GAMEOVER = 'GAMEOVER';
const COMPLETING = 'COMPLETING';
let gameState = START;

let completionStartTime = 0;
let showCompleteMenuTime = 1000; // 1 second delay

// Difficulty Settings Level
let currentDifficulty = 'moderate';
const difficultySettings = {
    easy: { obstacles: 3, enemies: 1, pursuit: 0.30, food: 5 },
    moderate: { obstacles: 6, enemies: 3, pursuit: 0.45, food: 7 },
    hard: { obstacles: 10, enemies: 5, pursuit: 0.70, food: 10 },
    expert: { obstacles: 15, enemies: 8, pursuit: 0.95, food: 12 },
    test: { obstacles: 5, enemies: 1, pursuit: 0.50, food: 7 },
    test2: { obstacles: 0, enemies: 1, pursuit: 0.60, food: 7 }
};

// Level Progression System
let currentLevel = 1;
let currentDifficultyLevel = 'easy';
const levelProgression = {
    easy: [
        { level: 1, name: 'Tutorial', targetScore: 5, timeLimit: 90, isTutorial: true, description: 'Learn the basics' },
        { level: 2, name: 'Easy Level 2', targetScore: 10, timeLimit: 60, isTutorial: false, description: 'Collect food & avoid obstacles' },
        { level: 3, name: 'Easy Level 3', targetScore: 15, timeLimit: 50, isTutorial: false, description: 'Face your first enemies' }
    ],
    moderate: [
        { level: 1, name: 'Moderate 1', targetScore: 20, timeLimit: 70, isTutorial: false, description: '' },
        { level: 2, name: 'Moderate 2', targetScore: 30, timeLimit: 65, isTutorial: false, description: '' },
        { level: 3, name: 'Moderate 3', targetScore: 40, timeLimit: 60, isTutorial: false, description: '' }
    ],
    hard: [
        { level: 1, name: 'Hard 1', targetScore: 40, timeLimit: 55, isTutorial: false, description: '' },
        { level: 2, name: 'Hard 2', targetScore: 60, timeLimit: 50, isTutorial: false, description: '' },
        { level: 3, name: 'Hard 3', targetScore: 80, timeLimit: 45, isTutorial: false, description: '' }
    ],
    expert: [
        { level: 1, name: 'Expert 1', targetScore: 60, timeLimit: 50, isTutorial: false, description: '' },
        { level: 2, name: 'Expert 2', targetScore: 100, timeLimit: 45, isTutorial: false, description: '' },
        { level: 3, name: 'Expert 3', targetScore: 150, timeLimit: 40, isTutorial: false, description: '' }
    ],
    test: [
        { level: 1, name: 'Test Arena', targetScore: 9999, timeLimit: 0, isTutorial: false, description: 'Autonomous sandbox mode' }
    ],
    test2: [
        { level: 1, name: 'Test Arena 2', targetScore: 10, timeLimit: 0, isTutorial: false, description: 'Manual hunt mode' }
    ]
};

let levelProgress = {};
let showTutorialOverlay = false;

function initLevelProgress() {
    const saved = localStorage.getItem('kingSnakeLevelProgress');
    if (saved) {
        levelProgress = JSON.parse(saved);
    } else {
        levelProgress = {
            easy: { completed: [false, false, false], unlockedDifficulty: 'easy' },
            moderate: { completed: [false, false, false], unlockedDifficulty: false },
            hard: { completed: [false, false, false], unlockedDifficulty: false },
            expert: { completed: [false, false, false], unlockedDifficulty: false }
        };
        saveLevelProgress();
    }
}

function saveLevelProgress() {
    localStorage.setItem('kingSnakeLevelProgress', JSON.stringify(levelProgress));
}

function getCurrentLevelData() {
    return levelProgression[currentDifficultyLevel][currentLevel - 1];
}

function isLevelUnlocked(difficulty) {
    return levelProgress[difficulty] && levelProgress[difficulty].unlockedDifficulty;
}

function completeLevel(difficulty, levelNum) {
    if (!levelProgress[difficulty]) levelProgress[difficulty] = { completed: [false, false, false] };
    levelProgress[difficulty].completed[levelNum - 1] = true;

    // Check if all levels in this difficulty are complete, unlock next
    if (levelProgress[difficulty].completed.every(c => c)) {
        const difficulties = ['easy', 'moderate', 'hard', 'expert'];
        const currentIdx = difficulties.indexOf(difficulty);
        if (currentIdx < difficulties.length - 1) {
            levelProgress[difficulties[currentIdx + 1]].unlockedDifficulty = true;
        }
    }
    saveLevelProgress();
}

// Timer Variables
let gameStartTime;
let timeElapsed = 0;
let levelTimeLimit = 0; // seconds allowed to complete current level

function preload() {
    mascotImg = loadImage('assets/mascot.png', () => console.log("Mascot loaded"), () => console.warn("Mascot load failed"));
    backgroundImg = loadImage('assets/background.png', () => console.log("Background loaded"), () => console.warn("Background load failed"));
    foodIconsImg = loadImage('assets/food.png', () => console.log("Food loaded"), () => console.warn("Food load failed"));
}

function setup() {
    createCanvas(windowWidth, windowHeight);

    // Initialize level progress
    initLevelProgress();

    // UI Connections
    const startBtn = document.getElementById('start-btn');
    if (startBtn) startBtn.addEventListener('click', startGame);

    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) restartBtn.addEventListener('click', resetGame);

    const exitBtn = document.getElementById('exit-btn');
    if (exitBtn) exitBtn.addEventListener('click', () => {
        location.reload();
    });

    const testBtn = document.getElementById('test-arena-btn');
    if (testBtn) testBtn.addEventListener('click', () => {
        currentDifficultyLevel = 'test';
        currentLevel = 1;
        startGame();
    });

    // --- BOSS ARENA MENU FLOW ---
    const bossArenaBtn = document.getElementById('boss-arena-btn');
    const bossMenu = document.getElementById('boss-menu');
    const mainMenu = document.getElementById('main-menu');
    const bossBackBtn = document.getElementById('boss-back-btn');

    if (bossArenaBtn) bossArenaBtn.addEventListener('click', () => {
        mainMenu.classList.add('hidden');
        bossMenu.classList.remove('hidden');
    });

    if (bossBackBtn) bossBackBtn.addEventListener('click', () => {
        bossMenu.classList.add('hidden');
        mainMenu.classList.remove('hidden');
    });

    // Boss Selection Cards
    document.querySelectorAll('.boss-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const bossType = card.getAttribute('data-boss');
            console.log("Entering Boss Battle:", bossType);

            // Set difficulty to a special boss mode
            currentDifficultyLevel = 'expert';
            currentLevel = 1;

            bossMenu.classList.add('hidden');
            document.getElementById('game-ui').classList.remove('hidden');
            resetGame();
        });
    });

    // Level selection will be initialized when DOM is ready

    topScore = parseInt(localStorage.getItem('kingSnakeTopScore')) || 0;
    updateUI();
    particles = new ParticleSystem();

    menuSnake = new Snake(width / 2, height / 2);
    for (let i = 0; i < 15; i++) menuSnake.addSegment();
}

function startGame() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');
    resetGame();
}

function resetGame() {
    score = 0;
    gameOver = false;
    timeElapsed = 0;
    gameStartTime = null; // will be set when tutorial closes or immediately for non-tutorial
    formationTargets = []; // Clear formation targets for completion animation

    const gameOverModal = document.getElementById('game-over-modal');
    if (gameOverModal) gameOverModal.classList.add('hidden');

    snake = new Snake(width / 2, height / 2);
    initFoods();
    initObstacles();
    initToxicSnakes();

    const levelData = getCurrentLevelData();
    showTutorialOverlay = levelData.isTutorial;
    levelTimeLimit = levelData.timeLimit || 0;

    // In test mode, player snake is autonomous
    if (currentDifficultyLevel === 'test') {
        snake.isAutonomous = true;
    }

    // start timer only if not a tutorial; tutorial will start timer when closed
    if (!showTutorialOverlay) {
        gameStartTime = millis();
    }
    console.log('Level:', currentLevel, 'Difficulty:', currentDifficultyLevel, 'Tutorial:', showTutorialOverlay);

    gameState = PLAYING;
    loop();
}

function initFoods() {
    foods = [];
    const settings = difficultySettings[currentDifficultyLevel];
    const foodCount = settings ? settings.food : 5;
    for (let i = 0; i < foodCount; i++) {
        foods.push(new Food());
    }
}

function initToxicSnakes() {
    toxicSnakes = [];
    const settings = difficultySettings[currentDifficultyLevel];
    for (let i = 0; i < settings.enemies; i++) {
        toxicSnakes.push(new ToxicSnake(random(width), random(height), settings.pursuit));
    }
}

function initObstacles() {
    obstacles = [];
    const settings = difficultySettings[currentDifficultyLevel];
    for (let i = 0; i < settings.obstacles; i++) {
        let obsPos;
        let tooClose;
        let attempts = 0;
        do {
            tooClose = false;
            obsPos = createVector(random(50, width - 50), random(50, height - 50));
            if (p5.Vector.dist(obsPos, createVector(width / 2, height / 2)) < 150) tooClose = true;
            attempts++;
        } while (tooClose && attempts < 100);
        obstacles.push(new Obstacle(obsPos.x, obsPos.y, random(25, 40)));
    }
}

function draw() {
    background(15, 23, 42);
    if (backgroundImg && backgroundImg.width > 0) {
        image(backgroundImg, 0, 0, width, height);
    }

    if (gameState === PLAYING && snake) {
        updateGame();

        // Draw tutorial overlay on top after game updates
        if (showTutorialOverlay) {
            drawTutorialOverlay();
        }

    } else if (gameState === COMPLETING) {
        updateCompleting();
    } else if (gameState === GAMEOVER) {
        // Continue rendering particles during game-over for celebration effect
        if (particles) {
            particles.update();
            particles.display();
        }
    } else if (gameState === START && menuSnake) {
        updateMainMenu();
    }
}

let formationTargets = [];

function getWordTargets(word, snakeCounts) {
    let allPoints = [];
    const totalSegments = snakeCounts.reduce((a, b) => a + b, 0);

    // 1. Precise Vertex Definitions
    const letterLines = {
        'C': [[[1, 0], [0, 0], [0, 2], [1, 2]]],
        'O': [[[0.05, 0], [1.15, 0], [1.2, 0.15], [1.2, 1.85], [1.15, 2], [0.05, 2], [0, 1.85], [0, 0.15], [0.05, 0]]],
        'M': [[[0, 2], [0, 0], [0.5, 1], [1, 0], [1, 2]]],
        'P': [[[0, 2], [0, 0], [1, 0], [1, 1], [0, 1]]],
        'L': [[[0, 0], [0, 2], [1, 2]]],
        'E': [[[1, 0], [0, 0]], [[0, 1], [0.8, 1]], [[0, 2], [1, 2]], [[0, 0], [0, 2]]],
        'T': [[[0, 0], [1, 0]], [[0.5, 0], [0.5, 2]]],
        'K': [
            [[0, 0], [0, 2]],      // Vertical
            [[0, 1], [0.9, 0.1]],  // Balanced Upper Arm
            [[0, 1], [0.9, 1.9]]   // Balanced Lower Arm
        ],
    };

    const targetWord = word.toUpperCase();

    // 2. Assign Letters to Snakes
    // If we have 2 snakes and "OK", Snake 0 gets 'O', Snake 1 gets 'K'
    let snakeAssignments = [];
    if (snakeCounts.length >= targetWord.length) {
        // Each letter gets its own snake (or more)
        for (let i = 0; i < targetWord.length; i++) snakeAssignments.push([i]);
    } else {
        // Snakes share letters
        let charsPerSnake = targetWord.length / snakeCounts.length;
        for (let s = 0; s < snakeCounts.length; s++) {
            let chunk = [];
            let start = floor(s * charsPerSnake);
            let end = (s === snakeCounts.length - 1) ? targetWord.length : floor((s + 1) * charsPerSnake);
            for (let i = start; i < end; i++) chunk.push(i);
            snakeAssignments.push(chunk);
        }
    }

    // 3. Distribution per Snake
    const SEGMENT_SPACING = 42;
    const centerX = width / 2;
    const centerY = height / 2;
    const letterSpacing = 2.2;

    // Calculate global scale first based on the whole word to keep it consistent
    let wordLenUnits = 0;
    for (let char of targetWord) {
        let paths = letterLines[char] || [];
        for (let p of paths) {
            for (let j = 0; j < p.length - 1; j++) {
                wordLenUnits += dist(p[j][0], p[j][1], p[j + 1][0], p[j + 1][1]);
            }
        }
    }
    let idealScale = (totalSegments * SEGMENT_SPACING) / (wordLenUnits + (targetWord.length * 0.5));
    const scale = max(idealScale, 65);
    const startX = centerX - (targetWord.length * letterSpacing * scale) / 2 + (scale * 0.5);

    for (let s = 0; s < snakeCounts.length; s++) {
        let assignedChars = snakeAssignments[s] || [];
        let segmentsForThisSnake = snakeCounts[s];

        // Calculate total path length for this snake's assigned letters
        let snakePathData = [];
        let snakeTotalLen = 0;
        for (let charIdx of assignedChars) {
            let char = targetWord[charIdx];
            let xOffset = startX + charIdx * letterSpacing * scale;
            let paths = letterLines[char] || [];
            for (let path of paths) {
                let pathLen = 0;
                for (let j = 0; j < path.length - 1; j++) {
                    pathLen += dist(path[j][0], path[j][1], path[j + 1][0], path[j + 1][1]);
                }
                snakePathData.push({ coords: path, len: pathLen, xOffset: xOffset });
                snakeTotalLen += pathLen;
            }
        }

        // Distribute this snake's segments among its assigned paths
        let assignedToSnake = 0;
        for (let pIdx = 0; pIdx < snakePathData.length; pIdx++) {
            let pData = snakePathData[pIdx];
            let pathSegments = round((pData.len / snakeTotalLen) * segmentsForThisSnake);
            if (pIdx === snakePathData.length - 1) pathSegments = segmentsForThisSnake - assignedToSnake;
            if (pathSegments === 0 && pData.len > 0) pathSegments = 1;

            for (let i = 0; i < pathSegments; i++) {
                let t = pathSegments > 1 ? i / (pathSegments - 1) : 0.5;
                let targetDist = t * pData.len;
                let travelled = 0;
                for (let j = 0; j < pData.coords.length - 1; j++) {
                    let p1 = pData.coords[j];
                    let p2 = pData.coords[j + 1];
                    let d = dist(p1[0], p1[1], p2[0], p2[1]);
                    if (travelled + d >= targetDist || j === pData.coords.length - 2) {
                        let ratio = d > 0 ? (targetDist - travelled) / d : 0;
                        let x = (p1[0] + (p2[0] - p1[0]) * ratio) * scale + pData.xOffset;
                        let y = (p1[1] + (p2[1] - p1[1]) * ratio) * scale + (centerY - scale);
                        allPoints.push(createVector(x, y));
                        break;
                    }
                    travelled += d;
                }
            }
            assignedToSnake += pathSegments;
        }
        // Patch up if distribution missed some segments
        while (assignedToSnake < segmentsForThisSnake) {
            allPoints.push(allPoints[allPoints.length - 1].copy());
            assignedToSnake++;
        }
    }

    return allPoints;
}

function updateCompleting() {
    // Keep rendering background elements
    for (let f of foods) f.display(foodIconsImg);
    for (let o of obstacles) o.display();

    // Collect ALL vehicles and record snake boundaries
    let allVehicles = [];
    let snakeCounts = [];
    if (snake) {
        allVehicles.push(...snake.segments);
        snakeCounts.push(snake.segments.length);
    }
    for (let ts of toxicSnakes) {
        allVehicles.push(...ts.segments);
        snakeCounts.push(ts.segments.length);
    }

    // Initialize targets once
    if (formationTargets.length === 0) {
        let word = "OK"; // Only "OK" now
        formationTargets = getWordTargets(word, snakeCounts);
        completionStartTime = millis();
    }

    // Move each vehicle 1:1 to its assigned target
    for (let i = 0; i < allVehicles.length; i++) {
        let v = allVehicles[i];
        let target = formationTargets[i];

        let d = p5.Vector.dist(v.position, target);

        if (d < 1.5) {
            // SNAP & LOCK
            v.position.set(target.x, target.y);
            v.velocity.set(0, 0);
        } else {
            let steer = v.arrive(target, 45); // Softer arrival for stability
            v.applyForce(steer);

            // Stronger damping as it gets close
            if (d < 12) {
                v.velocity.mult(0.7);
            }
        }

        v.update();
    }

    // Display
    if (snake) snake.display(mascotImg);
    for (let ts of toxicSnakes) ts.display();
    if (particles) {
        particles.update();
        particles.display();
    }

    // Delay 3 seconds before showing the Level Complete menu
    if (millis() - completionStartTime > 3000) {
        if (currentDifficultyLevel === 'test2') {
            // No menu for test2, just stay in formation
            return;
        }
        actualTriggerGameOver();
    }
}

function updateMainMenu() {
    if (menuSnake) {
        let head = menuSnake.segments[0];
        let wanderForce = head.wander();
        head.applyForce(wanderForce.mult(1.5));
        head.boundaries(100);
        menuSnake.update(head.position.copy().add(head.velocity.copy().mult(10)), []);

        push();
        drawingContext.shadowBlur = 30;
        drawingContext.shadowColor = color(74, 222, 128);
        menuSnake.display(mascotImg);
        pop();
    }
}

function updateGame() {
    // Render game elements so player can see the world during the tutorial,
    // but DO NOT run any update/physics logic while the tutorial overlay is open.
    for (let i = foods.length - 1; i >= 0; i--) {
        let f = foods[i];
        f.display(foodIconsImg);
    }

    for (let obs of obstacles) {
        obs.display();
    }

    // Only display enemy snakes while paused; don't call their update() so they remain static.
    for (let ts of toxicSnakes) {
        ts.display();
    }

    // Display particles as they currently are, but don't advance their state while paused.
    if (particles) {
        particles.display();
    }

    push();
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = color(251, 191, 36, 150);
    let head = snake.segments[0];
    if (head) {
        snake.display(mascotImg);
    }
    pop();

    // If tutorial overlay is showing, stop here (no updates, no movement, just visuals).
    if (showTutorialOverlay) {
        return;
    }

    // --- Normal game updates (resume once tutorial is closed) ---
    if (gameStartTime) {
        timeElapsed = floor((millis() - gameStartTime) / 1000);
    } else {
        timeElapsed = 0;
    }
    updateTimerUI();

    let target = createVector(mouseX, mouseY);

    for (let i = foods.length - 1; i >= 0; i--) {
        let f = foods[i];
        if (snake.eat(f)) {
            particles.burst(f.position.x, f.position.y, color(251, 191, 36), 20);
            score++;
            f.spawn();
            updateUI();

            // Check if target score reached — end level immediately
            const levelData = getCurrentLevelData();
            if (score >= levelData.targetScore) {
                triggerGameOver();
                return;
            }
        }
    }

    if (head) {
        // --- PROACTIVE COLLISION CHECK ---
        // Check collisions BEFORE updating position to prevent "bobbing" or penetration
        if (currentDifficultyLevel !== 'test') {
            if (snake.checkSelfCollision() ||
                snake.checkObstacleCollision(obstacles) ||
                snake.checkEnemyCollision(toxicSnakes)) {
                triggerGameOver();
                return; // Stop processing frame immediately
            }
        }

        // Time limit enforcement
        if (levelTimeLimit > 0 && gameStartTime && timeElapsed >= levelTimeLimit) {
            triggerGameOver();
            return;
        }

        let avoidForce = head.avoid(obstacles);
        head.applyForce(avoidForce);

        for (let ts of toxicSnakes) {
            // update enemy behavior only during normal gameplay
            ts.setDifficulty(score);
            ts.update(obstacles, snake);
            let enemyHead = ts.segments[0];
            if (enemyHead) {
                let d = p5.Vector.dist(head.position, enemyHead.position);
                if (d < 150) {
                    let evadeForce = head.evade(enemyHead);
                    head.applyForce(evadeForce.mult(0.8));
                }
            }
        }

        snake.update(target, obstacles, toxicSnakes, foods);
    }

    // Now safely update particle simulation
    if (particles) {
        particles.update();
    }
}

function triggerGameOver() {
    const levelData = getCurrentLevelData();

    // If we've reached the target score, show the 'OK' animation
    if (score >= levelData.targetScore) {
        gameState = COMPLETING;
        completionStartTime = millis();

        // Trigger particle celebration
        if (particles) {
            particles.convergeStar(width / 2, height / 3, color(251, 191, 36), 100);
            particles.convergeText("OK", width / 2, height / 2 + 100, color(100, 200, 255));
        }
    } else {
        // Otherwise, it's a normal game over (or test mode)
        actualTriggerGameOver();
    }
}

function actualTriggerGameOver() {
    gameState = GAMEOVER;
    if (score > topScore) {
        topScore = score;
        localStorage.setItem('kingSnakeTopScore', topScore);
    }

    const levelData = getCurrentLevelData();
    let levelCompleted = score >= levelData.targetScore;

    if (levelCompleted && currentDifficultyLevel !== 'test') {
        completeLevel(currentDifficultyLevel, currentLevel);
    }

    document.getElementById('final-score').innerText = score;
    document.getElementById('final-top-score').innerText = topScore;

    const gameOverModal = document.getElementById('game-over-modal');
    gameOverModal.classList.remove('hidden');

    if (levelCompleted) {
        document.getElementById('level-complete-msg').style.display = 'block';
        const nextBtn = document.getElementById('next-level-btn');
        if (nextBtn) nextBtn.style.display = 'block';
    } else {
        document.getElementById('level-complete-msg').style.display = 'none';
        const nextBtn = document.getElementById('next-level-btn');
        if (nextBtn) nextBtn.style.display = 'none';
    }

    // If test mode, don't actually end the game modal-wise if needed, 
    // but here we let it show to allow restart.
    if (currentDifficultyLevel === 'test') {
        // Just show a message or do nothing, keeping sandbox active
        return;
    }

    noLoop();
}

function updateUI() {
    document.getElementById('current-score').innerText = score;
    document.getElementById('top-score-game').innerText = topScore;
    document.getElementById('top-score-menu').innerText = topScore;
}

function updateTimerUI() {
    const timerElem = document.getElementById('game-timer');
    if (timerElem) {
        if (levelTimeLimit > 0) {
            let remaining = max(0, levelTimeLimit - timeElapsed);
            let mins = floor(remaining / 60);
            let secs = remaining % 60;
            timerElem.innerText = `${nf(mins, 2)}:${nf(secs, 2)}`;
        } else {
            let mins = floor(timeElapsed / 60);
            let secs = timeElapsed % 60;
            timerElem.innerText = `${nf(mins, 2)}:${nf(secs, 2)}`;
        }
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    burst(x, y, c, n) {
        for (let i = 0; i < n; i++) {
            this.particles.push(new Particle(x, y, c));
        }
    }

    // Create convergence particles that form text/shapes
    convergeText(text, targetX, targetY, color) {
        const particleSize = 8;
        const spacing = particleSize * 1.5;
        let startY = targetY - (text.length * spacing) / 2;

        // Create particles for each character
        for (let charIdx = 0; charIdx < text.length; charIdx++) {
            const char = text[charIdx];
            const charY = startY + charIdx * spacing;

            // Spawn ~20 particles per character from random screen positions
            for (let i = 0; i < 20; i++) {
                const startX = random(width);
                const startY = random(height);
                let p = new Particle(startX, startY, color);
                p.targetX = targetX + (charIdx * 15);
                p.targetY = charY;
                p.isConverging = true;
                p.convergeSpeed = random(0.02, 0.08);
                this.particles.push(p);
            }
        }
    }

    // Create particles that form a star shape
    convergeStar(centerX, centerY, color, numParticles = 80) {
        for (let i = 0; i < numParticles; i++) {
            // Random position on screen to start from
            const startX = random(width);
            const startY = random(height);
            let p = new Particle(startX, startY, color);

            // Calculate star point positions (5-pointed star)
            const angle = (i / numParticles) * TWO_PI;
            const distance = (i % 16 < 8) ? 80 : 50; // Alternate points for star shape
            p.targetX = centerX + cos(angle) * distance;
            p.targetY = centerY + sin(angle) * distance;
            p.isConverging = true;
            p.convergeSpeed = random(0.02, 0.08);
            this.particles.push(p);
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].isDead()) this.particles.splice(i, 1);
        }
    }
    display() {
        for (let p of this.particles) p.display();
    }
}

class Particle {
    constructor(x, y, c) {
        this.pos = createVector(x, y);
        this.vel = p5.Vector.random2D().mult(random(2, 5));
        this.acc = createVector(0, 0);
        this.lifespan = 255;
        this.c = c;

        // Convergence properties
        this.isConverging = false;
        this.targetX = 0;
        this.targetY = 0;
        this.convergeSpeed = 0.05;
    }
    update() {
        if (this.isConverging && this.lifespan > 100) {
            // Move toward target position smoothly
            let targetPos = createVector(this.targetX, this.targetY);
            let direction = p5.Vector.sub(targetPos, this.pos);
            direction.mult(this.convergeSpeed);
            this.pos.add(direction);
        } else {
            // Normal particle behavior (slight drift after convergence)
            this.vel.add(this.acc);
            this.pos.add(this.vel);
        }

        // Fade out at the end
        if (this.isConverging && this.lifespan < 100) {
            // Hold position while fading
            this.lifespan -= 5;
        } else {
            this.lifespan -= 3;
        }
    }
    display() {
        noStroke();
        fill(this.c.levels[0], this.c.levels[1], this.c.levels[2], this.lifespan);
        ellipse(this.pos.x, this.pos.y, 6, 6);
    }
    isDead() { return this.lifespan < 0; }
}
// Level selection setup
function setupLevelSelection() {
    const difficulties = ['easy', 'moderate', 'hard', 'expert'];
    difficulties.forEach(difficulty => {
        const levelData = levelProgression[difficulty];
        levelData.forEach((level, idx) => {
            const btnId = `level-${difficulty}-${idx + 1}`;
            let btn = document.getElementById(btnId);

            // Create button if it doesn't exist
            if (!btn) {
                btn = document.createElement('button');
                btn.id = btnId;
                btn.className = 'level-btn';
                btn.innerHTML = `<div class="level-number">${level.level}</div><div class="level-name">${level.name}</div>`;

                btn.addEventListener('click', () => {
                    if (!btn.classList.contains('locked')) {
                        currentDifficultyLevel = difficulty;
                        currentLevel = level.level;
                        startGame();
                    }
                });

                const container = document.getElementById(`levels-${difficulty}`);
                if (container) {
                    container.appendChild(btn);
                }
            }

            // Update button state (locked/completed/unlocked)
            const isUnlocked = difficulty === 'easy' || (levelProgress[difficulty] && levelProgress[difficulty].unlockedDifficulty);
            const isCompleted = levelProgress[difficulty] && levelProgress[difficulty].completed[idx];

            btn.classList.remove('locked', 'completed');
            if (isCompleted) {
                btn.classList.add('completed');
                btn.disabled = false;
            } else if (!isUnlocked) {
                btn.classList.add('locked');
                btn.disabled = true;
            } else {
                btn.disabled = false;
            }
        });
    });

    const testArenaBtn = document.getElementById('test-arena-btn');
    if (testArenaBtn) {
        testArenaBtn.onclick = () => {
            currentDifficultyLevel = 'test';
            currentLevel = 1;
            document.getElementById('main-menu').classList.add('hidden');
            document.getElementById('game-ui').classList.remove('hidden');
            startGame();
        };
    }

    const testArena2Btn = document.getElementById('test-arena-2-btn');
    if (testArena2Btn) {
        testArena2Btn.onclick = () => {
            currentDifficultyLevel = 'test2';
            currentLevel = 1;
            document.getElementById('main-menu').classList.add('hidden');
            document.getElementById('game-ui').classList.remove('hidden');
            startGame();
        };
    }
}

function keyPressed() {
    if (key === 't' || key === 'T') {
        Vehicle.debug = !Vehicle.debug;
        console.log("Debug mode:", Vehicle.debug);
    }
}

let draggedObstacle = null;

function mousePressed() {
    // 1. Handle Tutorial Dismissal
    if (showTutorialOverlay) {
        console.log("Mouse Clicked at:", mouseX, mouseY);
        console.log("Button Bounds:", window.tutorialBtnX, window.tutorialBtnY, window.tutorialBtnW, window.tutorialBtnH);

        if (window.tutorialBtnX !== undefined) {
            if (mouseX > window.tutorialBtnX && mouseX < window.tutorialBtnX + window.tutorialBtnW &&
                mouseY > window.tutorialBtnY && mouseY < window.tutorialBtnY + window.tutorialBtnH) {
                console.log("Tutorial Dismissed!");
                showTutorialOverlay = false;
                gameStartTime = millis();
                timeElapsed = 0;
                return false;
            }
        }
        return;
    }

    // 2. Existing Game Logic
    if (currentDifficultyLevel !== 'test' || gameState !== PLAYING) return;

    // Try to find an obstacle to drag
    let mousePos = createVector(mouseX, mouseY);
    for (let obs of obstacles) {
        if (p5.Vector.dist(mousePos, obs.position) < obs.r) {
            draggedObstacle = obs;
            return;
        }
    }

    // If not dragging, spawn a new one
    obstacles.push(new Obstacle(mouseX, mouseY, random(25, 40)));
}

function mouseDragged() {
    if (showTutorialOverlay) return; // Prevent dragging during tutorial
    if (draggedObstacle) {
        draggedObstacle.position.set(mouseX, mouseY);
    }
}

function mouseReleased() {
    draggedObstacle = null;
}

function drawTestArenaInstructions() {
    push();
    textAlign(CENTER, CENTER);
    rectMode(CENTER);

    // Gradient dark bar
    noStroke();
    fill(0, 150);
    rect(width / 2, height - 40, 500, 40, 10);

    fill(255);
    textSize(16);
    textStyle(BOLD);
    text("🧪 ARENA: Click to SPAWN rock | Drag to MOVE rocks | 'T' Debug Mode", width / 2, height - 40);
    pop();
}

// Add next level button handler
document.addEventListener('DOMContentLoaded', () => {
    // initialize level buttons once DOM is ready
    setupLevelSelection();
    const nextLevelBtn = document.getElementById('next-level-btn');
    if (nextLevelBtn) {
        nextLevelBtn.addEventListener('click', () => {
            // Move to next level or difficulty
            const difficulties = ['easy', 'moderate', 'hard', 'expert'];
            const currentIdx = difficulties.indexOf(currentDifficultyLevel);

            if (currentLevel < 3) {
                currentLevel++;
            } else if (currentIdx < difficulties.length - 1) {
                currentDifficultyLevel = difficulties[currentIdx + 1];
                currentLevel = 1;
            } else {
                // All levels complete!
                location.reload();
                return;
            }

            document.getElementById('game-over-modal').classList.add('hidden');
            document.getElementById('game-ui').classList.add('hidden');
            document.getElementById('main-menu').classList.remove('hidden');

            // Refresh level button states to show newly unlocked levels
            setupLevelSelection();

            gameState = START;
            loop();
        });
    }
});