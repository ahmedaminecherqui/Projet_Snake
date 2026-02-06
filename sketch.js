console.log("🔥 SKETCH.JS LOADED (v_debug) 🔥");
let snake;
let foods = [];
let particles;
let obstacles = [];
let toxicSnakes = [];
let menuSnake;
let score = 0;
let topScore = 0;
let gameOver = false;
let currentBoss = null; // Track active boss for exclusive mechanics
let bossRenderer; // Handles boss environment visuals
let bossEntity = null; // The actual boss character
let lives = 3;
let invulnerableTimer = 0;
let batFlock; // Foreground bat flock system

// Audio State
let musicVolume = parseFloat(localStorage.getItem('kingSnakeMusicVolume')) || 0.5;
let sfxVolume = parseFloat(localStorage.getItem('kingSnakeSfxVolume')) || 0.7;

// Control State
let controlScheme = localStorage.getItem('kingSnakeControlScheme') || 'mouse';
const defaultKeyMappings = {
    up: 'ARROWUP',
    down: 'ARROWDOWN',
    left: 'ARROWLEFT',
    right: 'ARROWRIGHT',
    dash: ' ',
    pause: 'ESCAPE',
    debug: 'T'
};
let keyMappings = JSON.parse(localStorage.getItem('kingSnakeKeyMappings')) || {};
keyMappings = { ...defaultKeyMappings, ...keyMappings };
let rebindingKey = null; // Track which action we are currently rebinding

// Assets
let mascotImg;
let backgroundImg;
let foodIconsImg;

// Sound Assets
let bossMusic;
let bossHitSound;
let explodeSound;
let fireShotSound;
let hurtSound;
let dieSound;
let menuMusic;

// Game States
const START = 'START';
const PLAYING = 'PLAYING';
const PAUSED = 'PAUSED';
const GAMEOVER = 'GAMEOVER';
const COMPLETING = 'COMPLETING';
const BOSS_INTRO = 'BOSS_INTRO'; // Cinematic state
const PLAYER_DYING = 'PLAYER_DYING'; // Death animation state
let gameState = START;

let cinematicTimer = 0;
let screenShake = 0; // Current intensity
let introDialogue = null; // Decoupled rendering

let completionStartTime = 0;
let showCompleteMenuTime = 1000; // 1 second delay
let deathStartTime = 0;
let deathDuration = 2000; // 2 seconds delay

// Difficulty Settings Level
let currentDifficultyLevel = 'easy';
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
// currentDifficultyLevel is defined above
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
        { level: 1, name: 'The Flame Serpent', targetScore: 50, timeLimit: 0, isTutorial: false, description: 'Survive the Inferno', bossId: 'flame-serpent' },
        { level: 2, name: 'Froggy', targetScore: 100, timeLimit: 45, isTutorial: false, description: '' },
        { level: 3, name: 'Sophia', targetScore: 150, timeLimit: 40, isTutorial: false, description: '' }
    ],
    test: [
        { level: 1, name: 'Test Arena', targetScore: 9999, timeLimit: 0, isTutorial: false, description: 'Autonomous sandbox mode' }
    ],
    test2: [
        { level: 1, name: 'Test Arena 2', targetScore: 10, timeLimit: 0, isTutorial: false, description: 'Manual hunt mode' }
    ],
    test_stun: [
        { level: 1, name: 'Stun Test', targetScore: 9999, timeLimit: 0, isTutorial: false, description: 'Practice Headbutt', bossId: 'flame-serpent' }
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
            easy: { completed: [false, false, false] },
            moderate: { completed: [false, false, false] },
            hard: { completed: [false, false, false] }
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

function isLevelUnlocked(difficulty, levelIdx) {
    if (difficulty === 'easy' && levelIdx === 0) return true;

    if (levelIdx > 0) {
        // Unlock Level N if Level N-1 is completed
        return levelProgress[difficulty] && levelProgress[difficulty].completed[levelIdx - 1];
    } else {
        // First level of a difficulty
        const difficulties = ['easy', 'moderate', 'hard'];
        const currentIdx = difficulties.indexOf(difficulty);
        if (currentIdx > 0) {
            const prevDifficulty = difficulties[currentIdx - 1];
            // Unlock first level of Moderate/Hard if previous difficulty is fully completed
            return levelProgress[prevDifficulty] && levelProgress[prevDifficulty].completed.every(c => c);
        }
    }
    return false;
}

function completeLevel(difficulty, levelNum) {
    if (!levelProgress[difficulty]) levelProgress[difficulty] = { completed: [false, false, false] };
    levelProgress[difficulty].completed[levelNum - 1] = true;
    saveLevelProgress();

    // Refresh UI immediately to show next unlocked level
    setupLevelSelection();
}

function backToMenu() {
    // Reset Game State
    gameState = START;
    currentBoss = null;
    currentLevel = 1;
    currentDifficultyLevel = 'easy'; // Reset difficulty hub
    score = 0;
    lives = 3;

    // Stop all audio
    if (bossMusic) bossMusic.stop();
    if (menuMusic) menuMusic.stop();

    // Reset UI
    document.getElementById('game-ui').classList.add('hidden');
    document.getElementById('game-over-modal').classList.add('hidden');
    document.getElementById('pause-menu').classList.add('hidden');
    document.getElementById('settings-menu').classList.add('hidden');
    document.getElementById('skip-container')?.classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');

    // Refresh UI & Level Selection
    updateUI();
    setupLevelSelection();

    // Ensure game loop is running for menu animation
    loop();
}

/**
 * Resets all level progression and top scores
 */
function resetLevelProgress() {
    if (confirm("⚠️ WARNING: This will delete ALL your progress and top scores. Are you sure?")) {
        localStorage.removeItem('kingSnakeLevelProgress');
        localStorage.removeItem('kingSnakeTopScore');

        // Re-initialize logic
        topScore = 0;
        initLevelProgress();

        // Return to main hub
        backToMenu();

        console.log("Progress wiped successfully.");
    }
}

// Timer Variables
let gameStartTime;
let timeElapsed = 0;
let levelTimeLimit = 0; // seconds allowed to complete current level

function preload() {
    mascotImg = loadImage('assets/mascot.png');
    backgroundImg = loadImage('assets/background.png');
    foodIconsImg = loadImage('assets/food.png');

    // Load Sounds
    bossMusic = loadSound('assets/86. Boss.mp3');
    bossHitSound = loadSound('assets/07. Bosshit.mp3');
    explodeSound = loadSound('assets/25. Explode.mp3');
    fireShotSound = loadSound('assets/32. Fireshot.mp3');
    hurtSound = loadSound('assets/38. Hurt.mp3');
    dieSound = loadSound('assets/91. Die.mp3');
    menuMusic = loadSound('assets/boss_menu_theme.mp3',
        () => {
            console.log("Menu Music Loaded Successfully");
            applyInitialVolumes();
        },
        (err) => console.error("Menu Music Failed to Load", err)
    );
}

function applyInitialVolumes() {
    updateVolumes();

    // Set slider initial values
    const musicSlider = document.getElementById('music-volume');
    const sfxSlider = document.getElementById('sfx-volume');
    if (musicSlider) musicSlider.value = musicVolume;
    if (sfxSlider) sfxSlider.value = sfxVolume;
}

function updateVolumes() {
    // Music
    if (bossMusic) bossMusic.setVolume(musicVolume);
    if (menuMusic) menuMusic.setVolume(musicVolume);

    // SFX
    if (bossHitSound) bossHitSound.setVolume(sfxVolume);
    if (explodeSound) explodeSound.setVolume(sfxVolume);
    if (fireShotSound) fireShotSound.setVolume(sfxVolume);
    if (hurtSound) hurtSound.setVolume(sfxVolume);
    if (dieSound) dieSound.setVolume(sfxVolume);
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
    if (exitBtn) exitBtn.addEventListener('click', backToMenu);

    const resetBtn = document.getElementById('reset-progress-btn');
    if (resetBtn) resetBtn.addEventListener('click', resetLevelProgress);

    const settingsBtn = document.getElementById('settings-btn');
    const settingsMenu = document.getElementById('settings-menu');
    const settingsBackBtn = document.getElementById('settings-back-btn');

    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            document.getElementById('main-menu').classList.add('hidden');
            settingsMenu.classList.remove('hidden');
            updateControlUI();
        });
    }

    if (settingsBackBtn) {
        settingsBackBtn.addEventListener('click', () => {
            settingsMenu.classList.add('hidden');
            document.getElementById('main-menu').classList.remove('hidden');
        });
    }

    // Audio Sliders
    const musicSlider = document.getElementById('music-volume');
    const sfxSlider = document.getElementById('sfx-volume');

    if (musicSlider) {
        musicSlider.addEventListener('input', (e) => {
            musicVolume = parseFloat(e.target.value);
            localStorage.setItem('kingSnakeMusicVolume', musicVolume);
            updateVolumes();
        });
    }

    if (sfxSlider) {
        sfxSlider.addEventListener('input', (e) => {
            sfxVolume = parseFloat(e.target.value);
            localStorage.setItem('kingSnakeSfxVolume', sfxVolume);
            updateVolumes();
        });
    }

    const testBtn = document.getElementById('test-arena-btn');
    if (testBtn) testBtn.addEventListener('click', () => {
        currentDifficultyLevel = 'test';
        currentLevel = 1;
        currentBoss = null; // Reset boss state
        startGame();
    });

    const testStunBtn = document.getElementById('test-arena-3-btn');
    if (testStunBtn) testStunBtn.addEventListener('click', () => {
        currentDifficultyLevel = 'test_stun';
        currentLevel = 1;
        currentBoss = 'flame-serpent';
        startGame();
    });

    const testArena2Btn = document.getElementById('test-arena-2-btn');
    if (testArena2Btn) testArena2Btn.addEventListener('click', () => {
        currentDifficultyLevel = 'test2';
        currentLevel = 1;
        currentBoss = null;
        startGame();
    });

    // --- BOSS ARENA MENU FLOW ---
    const bossArenaBtn = document.getElementById('boss-arena-btn');
    console.log("Setup: Boss Arena Button found?", !!bossArenaBtn);
    const bossMenu = document.getElementById('boss-menu');
    const mainMenu = document.getElementById('main-menu');
    const bossBackBtn = document.getElementById('boss-back-btn');

    if (bossArenaBtn) {
        bossArenaBtn.addEventListener('click', () => {
            userStartAudio(); // Ensure audio context is ready
            mainMenu.classList.add('hidden');
            bossMenu.classList.remove('hidden');

            // Loop Menu Music (formerly Nuclear Flash) from 1:21 (81s)
            if (menuMusic && !menuMusic.isPlaying()) {
                menuMusic.jump(81);
                menuMusic.loop(0, 1, 1, 81);
            }
        });
    }

    if (bossBackBtn) bossBackBtn.addEventListener('click', () => {
        bossMenu.classList.add('hidden');
        mainMenu.classList.remove('hidden');
        if (menuMusic) menuMusic.stop();
    });

    // Boss Selection Cards
    document.querySelectorAll('.boss-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const bossType = card.getAttribute('data-boss');
            console.log("Entering Boss Battle:", bossType);

            // Set difficulty to a special boss mode
            currentDifficultyLevel = 'expert';
            currentLevel = 1;
            currentBoss = bossType; // Activate exclusive boss mechanics

            bossMenu.classList.add('hidden');
            document.getElementById('game-ui').classList.remove('hidden');

            if (menuMusic) menuMusic.stop(); // Stop menu music on game start
            resetGame();
        });
    });

    // Level selection will be initialized when DOM is ready

    topScore = parseInt(localStorage.getItem('kingSnakeTopScore')) || 0;
    updateUI();
    particles = new ParticleSystem();

    menuSnake = new Snake(width / 2, height / 2);
    for (let i = 0; i < 15; i++) menuSnake.addSegment();

    // Initialize Boss Renderer
    bossRenderer = new BossRenderer();

    // Initialize Boss Arena Cards
    setupBossArena();

    // Level selection and other UI
    setupLevelSelection();

    // Pause Menu Event Listeners
    const pauseMenu = document.getElementById('pause-menu');
    const resumeBtn = document.getElementById('resume-btn');
    const pauseRestartBtn = document.getElementById('pause-restart-btn');
    const pauseExitBtn = document.getElementById('pause-exit-btn');

    if (resumeBtn) resumeBtn.addEventListener('click', () => {
        resumeGame();
    });

    if (pauseRestartBtn) pauseRestartBtn.addEventListener('click', () => {
        resumeGame();
        resetGame();
    });

    if (pauseExitBtn) pauseExitBtn.addEventListener('click', () => {
        resumeGame();
        backToMenu();
    });

    // Dynamic Key Handler for Pause
    window.addEventListener('keydown', (e) => {
        const pressedKey = e.key.toUpperCase();
        const pauseKey = keyMappings.pause === 'ESCAPE' ? 'ESCAPE' : keyMappings.pause;

        // p5.js 'key' usually matches e.key.toUpperCase() for alphanumeric
        // but 'Escape' is 'ESCAPE' in p5 and e.key is 'Escape'
        if (pressedKey === pauseKey || (e.key === 'Escape' && keyMappings.pause === 'ESCAPE')) {
            if (gameState === PLAYING) {
                pauseGame();
            } else if (gameState === PAUSED) {
                resumeGame();
            }
        }
    });

    batFlock = new BatFlock();

    // Controls Configuration Listeners
    const controlSchemeSelect = document.getElementById('control-scheme');
    if (controlSchemeSelect) {
        controlSchemeSelect.addEventListener('change', (e) => {
            controlScheme = e.target.value;
            localStorage.setItem('kingSnakeControlScheme', controlScheme);
            updateControlUI();
        });
    }

    const skipBtn = document.getElementById('skip-cutscene-btn');
    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            cinematicTimer = 600; // Skip to the end of the cutscene
            document.getElementById('skip-container')?.classList.add('hidden');
        });
    }

    document.querySelectorAll('.key-bind-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Cancel any existing rebinding
            document.querySelectorAll('.key-bind-btn').forEach(b => b.classList.remove('rebinding'));

            rebindingKey = btn.getAttribute('data-key');
            btn.classList.add('rebinding');
            btn.innerText = 'PRESS ANY KEY...';
        });
    });
}

function startGame() {
    console.log("Starting Game:", currentDifficultyLevel, "Level:", currentLevel);
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');

    // Reset keyboard state when starting
    keys = {};

    resetGame();
}

let keys = {}; // Track multiple keys for smooth steering

function resetGame() {
    score = 0;
    gameOver = false;
    timeElapsed = 0;
    gameStartTime = null; // will be set when tutorial closes or immediately for non-tutorial
    formationTargets = []; // Clear formation targets for completion animation
    if (bossMusic) bossMusic.stop();

    const gameOverModal = document.getElementById('game-over-modal');
    if (gameOverModal) gameOverModal.classList.add('hidden');
    document.getElementById('skip-container')?.classList.add('hidden');

    lives = 3;
    invulnerableTimer = 0;
    updateHealthUI();
    initFoods();
    initObstacles();
    initToxicSnakes();

    // Default HUD visibility
    document.querySelector('.score-container')?.classList.remove('hidden');
    document.querySelector('.top-score-container')?.classList.remove('hidden');
    document.querySelector('.timer-container')?.classList.remove('hidden');
    document.getElementById('health-container')?.classList.add('hidden');

    const levelData = getCurrentLevelData();
    showTutorialOverlay = levelData.isTutorial;
    levelTimeLimit = levelData.timeLimit || 0;

    // Initialize Boss Renderer if active
    if (currentBoss) {
        bossRenderer.init(currentBoss);
        // Correct check — currentBoss is a level object or string ID
        const bossId = typeof currentBoss === 'string' ? currentBoss : currentBoss.bossId;

        if (bossId === 'flame-serpent') {
            if (currentDifficultyLevel === 'test_stun') {
                bossEntity = new FlameSerpent(width * 0.5, height * 0.5);
                bossEntity.setCoiledLayout(width * 0.5, height * 0.5, true);
            } else {
                bossEntity = new FlameSerpent(width * 0.8, -500);
            }
            if (batFlock) batFlock.triggerPulse();
        }

        // Position player snake off-screen left (entry)
        snake = new Snake(-200, height / 2);
        gameState = BOSS_INTRO;
        cinematicTimer = 0;
    } else {
        bossRenderer.stop();
        bossEntity = null;
        snake = new Snake(width / 2, height / 2);
        gameState = PLAYING;
    }

    // In test mode, player snake is autonomous
    if (currentDifficultyLevel === 'test') {
        snake.isAutonomous = true;
    }

    // start timer only if not a tutorial; tutorial will start timer when closed
    if (!showTutorialOverlay && gameState === PLAYING) {
        gameStartTime = millis();
    }
    console.log('Level:', currentLevel, 'Difficulty:', currentDifficultyLevel, 'Tutorial:', showTutorialOverlay);

    loop();
}

function pauseGame() {
    if (gameState !== PLAYING) return;
    gameState = PAUSED;
    document.getElementById('pause-menu').classList.remove('hidden');
}

function resumeGame() {
    if (gameState !== PAUSED) return;
    gameState = PLAYING;
    document.getElementById('pause-menu').classList.add('hidden');
}

function initFoods() {
    foods = [];
    if (currentBoss) return; // NO FOOD IN BOSS BATTLES

    const settings = difficultySettings[currentDifficultyLevel] || difficultySettings['easy'];
    const foodCount = settings.food;
    for (let i = 0; i < foodCount; i++) {
        foods.push(new Food());
    }
}

function initToxicSnakes() {
    toxicSnakes = [];
    // If we are fighting a boss, NO standard toxic snakes should spawn
    if (currentBoss) return;

    const settings = difficultySettings[currentDifficultyLevel];
    for (let i = 0; i < settings.enemies; i++) {
        toxicSnakes.push(new ToxicSnake(random(width), random(height), settings.pursuit));
    }
}

function initObstacles() {
    obstacles = [];
    // If we are fighting a boss, NO standard obstacles either (boss will have its own)
    if (currentBoss) return;

    const settings = difficultySettings[currentDifficultyLevel];
    for (let i = 0; i < settings.obstacles; i++) {
        let obsPos;
        let tooClose;
        let attempts = 0;
        do {
            tooClose = false;
            obsPos = createVector(random(50, width - 50), random(50, height - 50));
            let dx = obsPos.x - width / 2;
            let dy = obsPos.y - height / 2;
            let d = sqrt(dx * dx + dy * dy);
            if (d < 150) tooClose = true;
            attempts++;
        } while (tooClose && attempts < 100);
        obstacles.push(new Obstacle(obsPos.x, obsPos.y, random(25, 40)));
    }
}

function updateControlUI() {
    const schemeSelect = document.getElementById('control-scheme');
    if (schemeSelect) schemeSelect.value = controlScheme;

    const kbConfig = document.getElementById('keyboard-config');
    if (kbConfig) {
        if (controlScheme === 'keyboard') kbConfig.classList.remove('hidden');
        else kbConfig.classList.add('hidden');
    }

    document.querySelectorAll('.key-bind-btn').forEach(btn => {
        const action = btn.getAttribute('data-key');
        let label = keyMappings[action];
        if (label === ' ') label = 'SPACE';
        btn.innerText = label;
        btn.classList.remove('rebinding');
    });
}

function draw() {
    push();
    // 0. GLOBAL SCREEN SHAKE (Applies during boss intro or heavy impacts)
    if (screenShake > 0) {
        translate(random(-screenShake, screenShake), random(-screenShake, screenShake));
        screenShake *= 0.9; // Decay
        if (screenShake < 0.1) screenShake = 0;
    }

    // 1. LAYER: BACKGROUND
    if (currentBoss && (gameState === PLAYING || gameState === PAUSED || gameState === BOSS_INTRO || gameState === PLAYER_DYING)) {
        bossRenderer.drawBackground();
    } else {
        background(15, 23, 42);
        if (currentBoss) {
            bossRenderer.drawBackground();
        }
        if (backgroundImg && backgroundImg.width > 0) {
            image(backgroundImg, 0, 0, width, height);
        }
    }

    // 2. LAYER: GAME ENTITIES & LOGIC
    if (gameState === PLAYING && snake) {
        updateGame();
    } else if (gameState === BOSS_INTRO) {
        updateBossIntro();
    } else if (gameState === PAUSED && snake) {
        // Render static game state when paused
        for (let f of foods) f.display(foodIconsImg);
        for (let o of obstacles) o.display();
        for (let ts of toxicSnakes) ts.display();
        if (snake) snake.display(mascotImg);
        if (bossEntity) bossEntity.display();
    } else if (gameState === COMPLETING) {
        updateCompleting();
    } else if (gameState === PLAYER_DYING) {
        updatePlayerDying();
    } else if (gameState === GAMEOVER) {
        // Continue rendering particles
        if (particles) {
            particles.update();
            particles.display();
        }
    }

    // 3. LAYER: FOREGROUND (Boss Arena Rocks)
    if (currentBoss && (gameState === PLAYING || gameState === PAUSED || gameState === BOSS_INTRO || gameState === PLAYER_DYING)) {
        bossRenderer.drawForeground();
    }

    // 4. LAYER: UI / OVERLAYS
    if (gameState === PLAYING && showTutorialOverlay) {
        drawTutorialOverlay();
    }

    if (gameState === START && menuSnake) {
        updateMainMenu();
    }

    // 5. LAYER: ABSOLUTE FOREGROUND
    const bossIdForBats = currentBoss?.bossId || (typeof currentBoss === 'string' ? currentBoss : null);
    if (batFlock && bossIdForBats === 'flame-serpent') {
        batFlock.update();
        batFlock.display();
    }

    // Boss Health Bar (Skulls)
    if (currentBoss && bossEntity && (gameState === PLAYING || gameState === BOSS_INTRO)) {
        drawBossHealthBar();
    }

    // 6. LAYER: ABSOLUTE OVERLAY (Dialogue)
    if (introDialogue) {
        drawIntroText(
            introDialogue.text,
            introDialogue.col,
            introDialogue.shake,
            introDialogue.age,
            introDialogue.speed
        );
        introDialogue = null; // Clear for next frame
    }

    pop();
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

function updatePlayerDying() {
    // Render world entities but NOT the player
    for (let f of foods) f.display(foodIconsImg);
    for (let o of obstacles) o.display();
    for (let ts of toxicSnakes) ts.display();
    if (bossEntity) bossEntity.display();

    // Update and display particles (the explosion)
    if (particles) {
        particles.update();
        particles.display();
    }

    // Continued intense screen shake
    if (frameCount % 4 === 0) {
        screenShake = max(screenShake, 15);
    }

    // Timer check to finish the transition
    if (millis() - deathStartTime > deathDuration) {
        actualTriggerGameOver();
    }
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

        // Boost physics for the celebration
        v.maxSpeed = 15;
        v.maxForce = 0.8;

        let dx = v.position.x - target.x;
        let dy = v.position.y - target.y;
        let d = sqrt(dx * dx + dy * dy);

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

    // Delay 4 seconds before showing the Level Complete menu
    if (millis() - completionStartTime > 4000) {
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
        // REMOVED shadowBlur for menu snake
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

    if (bossEntity) {
        bossEntity.display();
    }

    // Display particles as they currently are, but don't advance their state while paused.
    if (particles) {
        particles.display();
    }

    push();
    // REMOVED shadowBlur for player snake
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

    let target;
    if (controlScheme === 'keyboard') {
        if (typeof snake.getKeyboardTarget !== 'function') {
            console.error("DEBUG: snake object:", snake);
            console.error("DEBUG: snake prototype:", Object.getPrototypeOf(snake));
            console.error("DEBUG: type of getKeyboardTarget:", typeof snake.getKeyboardTarget);
            // Fallback to mouse to prevent crash
            target = createVector(mouseX, mouseY);
        } else {
            target = snake.getKeyboardTarget();
        }
    } else {
        target = createVector(mouseX, mouseY);
    }

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

    if (snake && snake.segments.length > 0) {
        let head = snake.segments[0];
        // --- PROACTIVE COLLISION CHECK ---
        // Check collisions BEFORE updating position to prevent "bobbing" or penetration
        if (currentDifficultyLevel !== 'test') {
            // In boss mode, disable self-collision to allow more freedom of movement
            let selfCollision = currentBoss ? false : snake.checkSelfCollision();

            let collisionPoint = (bossEntity && bossEntity.checkCollision(snake));
            let fireballPoint = (bossEntity && bossEntity.checkFireballCollisions(snake));

            if (selfCollision ||
                snake.checkObstacleCollision(obstacles) ||
                snake.checkEnemyCollision(toxicSnakes) ||
                collisionPoint ||
                fireballPoint) {

                if (currentBoss) {
                    takeDamage(collisionPoint || fireballPoint);
                } else {
                    triggerGameOver();
                    return; // Stop processing frame immediately
                }
            }
        }

        if (invulnerableTimer > 0) invulnerableTimer--;

        // Time limit enforcement
        if (levelTimeLimit > 0 && gameStartTime && timeElapsed >= levelTimeLimit) {
            triggerGameOver();
            return;
        }

        let avoidForce = head.avoid(obstacles);
        head.applyForce(avoidForce);

        // --- BOSS INHALE SUCTION FORCE ---
        if (bossEntity && bossEntity.currentState === BossState.INHALING) {
            let mouthPos = bossEntity.segments[0].position.copy();
            let toPlayer = p5.Vector.sub(head.position, mouthPos);
            let dist = toPlayer.mag();

            // Only pull if within range
            if (dist < 700) {
                // Directional Check: Is player in the 60-degree scope?
                let headAngle = bossEntity.headRotationOverride || bossEntity.segments[0].velocity.heading();
                let angleToPlayer = toPlayer.heading();
                let diff = abs(headAngle - angleToPlayer);
                if (diff > PI) diff = TWO_PI - diff; // Handle wrap-around

                if (diff < PI / 6) { // 30° each side
                    let suctionDir = p5.Vector.sub(mouthPos, head.position);
                    suctionDir.normalize();
                    // Gentle pull that increases as you get closer
                    let strength = map(dist, 0, 700, 1.8, 0.4);
                    head.applyForce(suctionDir.mult(strength));

                    // Add minor screen shake during inhale
                    screenShake = 1.5;
                }
            }
        }

        for (let ts of toxicSnakes) {
            // update enemy behavior only during normal gameplay
            ts.setDifficulty(score);
            ts.update(obstacles, snake);
            let enemyHead = ts.segments[0];
            if (enemyHead) {
                // Safe manual distance calculation
                let dx = head.position.x - enemyHead.position.x;
                let dy = head.position.y - enemyHead.position.y;
                let d = sqrt(dx * dx + dy * dy);

                if (d < 150) {
                    let evadeForce = head.evade(enemyHead);
                    head.applyForce(evadeForce.mult(0.8));
                }
            }
        }

        snake.update(target, obstacles, toxicSnakes, foods);

        if (bossEntity) {
            bossEntity.update(obstacles, snake.segments[0].position);

            // Check for headbutt damage
            if (snake.checkHeadbuttDamage(bossEntity)) {
                bossEntity.health -= 1;
                console.log(`Boss headbutted! Damage: 1, Health: ${bossEntity.health}/${bossEntity.maxHealth}`);
                if (typeof bossHitSound !== 'undefined') bossHitSound.play();

                // Visual feedback
                particles.burst(bossEntity.segments[0].position.x, bossEntity.segments[0].position.y, color(251, 191, 36), 30);

                if (typeof screenShake !== 'undefined') screenShake = 8;

                if (bossEntity.health <= 0) {
                    bossEntity.setState(BossState.DYING);
                    if (bossMusic) bossMusic.stop();
                }
            }

            // Check for death completion (after animation)
            if (bossEntity.currentState === BossState.DYING && bossEntity.isDead) {
                // Ensure victory score
                const levelData = getCurrentLevelData();
                if (levelData && levelData.bossId) {
                    score = max(score, levelData.targetScore);
                }
                triggerGameOver();
            }

            // --- BOSS STATE LOGIC ---
            // Simple logic for state transitions for now
            if (bossEntity.currentState === BossState.TRACKING && bossEntity.stateTimer > 180) {
                bossEntity.setState(BossState.INHALING);
            } else if (bossEntity.currentState === BossState.INHALING && bossEntity.stateTimer > 150) {
                bossEntity.setState(BossState.TRACKING);
            }
        }
    }

    // Now safely update particle simulation
    if (particles) {
        particles.update();
    }
}

function hideHUD() {
    document.querySelector('.score-container')?.classList.add('hidden');
    document.querySelector('.top-score-container')?.classList.add('hidden');
    document.querySelector('.timer-container')?.classList.add('hidden');
    document.getElementById('health-container')?.classList.remove('hidden');
}

function showHUD() {
    document.querySelector('.score-container')?.classList.remove('hidden');
    document.querySelector('.top-score-container')?.classList.remove('hidden');
    document.querySelector('.timer-container')?.classList.remove('hidden');
    document.getElementById('health-container')?.classList.add('hidden');
}

function updateBossIntro() {
    cinematicTimer++;

    // Show skip button if hidden
    const skipContainer = document.getElementById('skip-container');
    if (skipContainer && skipContainer.classList.contains('hidden')) {
        skipContainer.classList.remove('hidden');
    }

    // 1. PLAYER ENTRY (0-100)
    if (cinematicTimer < 100) {
        let entryTarget = createVector(width / 4, height / 2);
        snake.update(entryTarget, [], [], []);
        hideHUD();
    }
    // Display First (Z-Index Fix)
    if (snake) snake.display(mascotImg);
    if (bossEntity) bossEntity.display();

    // 2. BOSS DESCENT (100-240)
    // Boss comes down naturally. NO COILING.
    if (cinematicTimer >= 100 && cinematicTimer < 240) {
        hideHUD();
        snake.update(snake.segments[0].position.copy(), [], [], []);
        screenShake = map(cinematicTimer, 100, 240, 0, 10);

        if (bossEntity) {
            let bossTarget = createVector(width * 0.5, height / 2);
            bossEntity.setState(BossState.SEEKING);
            bossEntity.update([], bossTarget);
        }
    }
    // 3. TEASE (240-450)
    // Typewriter effect: "You disturb my slumber, little worm?"
    else if (cinematicTimer < 450) {
        hideHUD();
        screenShake = 1;

        if (bossEntity) {
            bossEntity.setState(BossState.TRACKING);
            bossEntity.update([], snake.segments[0].position);
        }
        snake.update(snake.segments[0].position.copy(), [], [], []);

        let textStart = 240;
        introDialogue = {
            text: "       You disturb my slumber...\n              little worm?",
            col: color(255),
            shake: false,
            age: cinematicTimer - textStart,
            speed: 2
        };
    }
    // 4. THREAT (450-600)
    // "NOW... BURN!"
    else if (cinematicTimer < 600) {
        hideHUD();
        screenShake = 5;

        if (bossEntity) {
            bossEntity.setState(BossState.TRACKING);
            bossEntity.update([], snake.segments[0].position);
        }
        snake.update(snake.segments[0].position.copy(), [], [], []);

        let textStart = 450;
        introDialogue = {
            text: "NOW... BURN!",
            col: color(255, 50, 50),
            shake: true,
            age: cinematicTimer - textStart,
            speed: 5
        };
    }
    // START FIGHT
    else {
        gameState = PLAYING;
        gameStartTime = millis();
        screenShake = 0;

        if (bossEntity) {
            // Start with TRACKING (static body, head aims at player, leads to fireballs)
            bossEntity.setState(BossState.TRACKING);

            // If we skipped early (during entry or descent), snap to center
            if (cinematicTimer < 605) { // Check if we just jumped here via skip or reached naturally
                // Only snap if we skipped significantly early
                if (cinematicTimer < 450) {
                    let center = createVector(width / 2, height / 2);
                    bossEntity.segments[0].position.set(center);
                    // Also reset segments to follow roughly
                    for (let i = 1; i < bossEntity.segments.length; i++) {
                        bossEntity.segments[i].position.set(center);
                    }
                }
            }
        }

        // Hide skip button
        document.getElementById('skip-container')?.classList.add('hidden');

        // Start Boss Music Loop
        if (bossMusic && !bossMusic.isPlaying()) {
            bossMusic.loop();
        }
    }
}

function drawBossHealthBar() {
    if (!bossEntity) return;

    let skullSize = 40;
    let barWidth = 340;
    // Fix to Top Right
    let xBase = width - barWidth - 30;
    let y = 60;

    // Background Bar
    fill(0, 150);
    noStroke();
    rectMode(CORNER);
    rect(xBase - 10, y - 35, barWidth, 70, 15);

    // Skulls
    for (let i = 0; i < bossEntity.maxHealth; i++) {
        let isDead = i >= bossEntity.health;
        let skullX = xBase + 25 + i * 50;
        drawSkull(skullX, y, skullSize, isDead);
    }

    // Name
    fill(255);
    textAlign(RIGHT, CENTER);
    textSize(18);
    textStyle(BOLD);
    text("FLAME SERPENT", xBase + barWidth - 25, y - 45);
}

function drawSkull(x, y, size, isDead) {
    push();
    translate(x, y);
    noStroke();

    // Skull Color
    if (isDead) {
        fill(60, 60, 60, 180); // Empty
    } else {
        fill(245, 235, 220); // Bone White
        let pulse = sin(frameCount * 0.15 + x) * 2;
        size += pulse;
    }

    // Top Dome
    ellipse(0, -size * 0.1, size * 0.8, size * 0.75);
    // Cheekbones
    ellipse(-size * 0.2, size * 0.1, size * 0.4, size * 0.3);
    ellipse(size * 0.2, size * 0.1, size * 0.4, size * 0.3);
    // Jaw/Teeth area
    rectMode(CENTER);
    rect(0, size * 0.25, size * 0.45, size * 0.35, 4);

    // Eye Sockets
    fill(isDead ? 30 : 10);
    ellipse(-size * 0.18, 0, size * 0.22, size * 0.25);
    ellipse(size * 0.18, 0, size * 0.22, size * 0.25);

    // Nose hole (upside down heart)
    ellipse(0, size * 0.1, size * 0.1, size * 0.08);

    // Teeth lines
    stroke(isDead ? 50 : 120);
    strokeWeight(1.5);
    for (let i = -1; i <= 1; i++) {
        line(i * size * 0.1, size * 0.15, i * size * 0.1, size * 0.35);
    }
    pop();
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
        startDeathAnimation();
    }
}

function startDeathAnimation() {
    if (gameState === PLAYER_DYING) return; // Prevent double trigger

    if (dieSound) dieSound.play();
    if (bossMusic) bossMusic.stop();

    // Trigger Death Animation State
    gameState = PLAYER_DYING;
    deathStartTime = millis();

    // Burst Effect
    if (particles && snake && snake.segments.length > 0) {
        let headPos = snake.segments[0].position;
        // Thematic green explosion matching snake colors
        particles.burst(headPos.x, headPos.y, color(74, 222, 128), 40); // Neon Green
        particles.burst(headPos.x, headPos.y, color(22, 101, 52), 30);  // Dark Green
        particles.burst(headPos.x, headPos.y, color(255), 20);          // White Highlights
        screenShake = 30; // Massive shake
    }
}

function actualTriggerGameOver() {
    const levelData = getCurrentLevelData();
    let levelWon = score >= levelData.targetScore;

    // Record top score if applicable
    if (score > topScore) {
        topScore = score;
        localStorage.setItem('kingSnakeTopScore', topScore);
    }

    // Progression hub ONLY (Easy/Moderate/Hard)
    const hubDifficulties = ['easy', 'moderate', 'hard'];
    if (levelWon && hubDifficulties.includes(currentDifficultyLevel) && gameState !== GAMEOVER) {
        completeLevel(currentDifficultyLevel, currentLevel);
    }

    // Stop boss music as soon as game ends
    if (bossMusic) bossMusic.stop();

    gameState = GAMEOVER;

    document.getElementById('final-score').innerText = score;
    document.getElementById('final-top-score').innerText = topScore;

    const gameOverModal = document.getElementById('game-over-modal');
    const modalTitle = document.getElementById('modal-title');
    gameOverModal.classList.remove('hidden');

    if (levelWon) {
        if (modalTitle) modalTitle.innerText = "LEVEL COMPLETE";
        document.getElementById('level-complete-msg').style.display = 'block';
        const nextBtn = document.getElementById('next-level-btn');
        if (nextBtn) nextBtn.style.display = 'block';
    } else {
        if (modalTitle) modalTitle.innerText = "GAME OVER";
        document.getElementById('level-complete-msg').style.display = 'none';
        const nextBtn = document.getElementById('next-level-btn');
        if (nextBtn) nextBtn.style.display = 'none';
    }

    // If test mode, allow restart but essentially sandbox
    if (currentDifficultyLevel === 'test') {
        return;
    }

    noLoop();
}

function updateUI() {
    document.getElementById('current-score').innerText = score;
    document.getElementById('top-score-game').innerText = topScore;
    document.getElementById('top-score-menu').innerText = topScore;
    updateHealthUI();
}

function updateHealthUI() {
    const healthContainer = document.getElementById('health-container');
    if (!currentBoss) {
        healthContainer.classList.add('hidden');
        return;
    }

    healthContainer.classList.remove('hidden');
    for (let i = 1; i <= 3; i++) {
        const heart = document.getElementById(`heart-${i}`);
        if (i > lives) {
            if (!heart.classList.contains('lost')) {
                heart.classList.add('lost', 'shake');
            }
        } else {
            heart.classList.remove('lost', 'shake');
        }
    }
}

function takeDamage(hitPoint = null) {
    if (invulnerableTimer > 0) return;

    lives--;
    invulnerableTimer = 90; // ~1.5 seconds of invincibility
    updateHealthUI();

    if (snake) {
        snake.damageTimer = 90; // Trigger red flash and stun in snake.js

        // PUSHBACK/KNOCKBACK LOGIC
        if (hitPoint) {
            // Safe instance-based vector sub
            let pushDir = snake.segments[0].position.copy().sub(hitPoint);
            pushDir.setMag(15); // Powerful impulse
            snake.segments[0].velocity.add(pushDir);
            snake.segments[0].position.add(pushDir); // Instant shift
        }
    }

    if (lives <= 0) {
        startDeathAnimation();
    } else {
        if (hurtSound) hurtSound.play();
    }
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
            // Move toward target position smoothly (Manual stable math)
            let dx = this.targetX - this.pos.x;
            let dy = this.targetY - this.pos.y;
            this.pos.x += dx * this.convergeSpeed;
            this.pos.y += dy * this.convergeSpeed;
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
    const difficulties = ['easy', 'moderate', 'hard'];
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
                const container = document.getElementById(`levels-${difficulty}`);
                if (container) {
                    container.appendChild(btn);
                }
            }

            // Update button state (locked/completed/unlocked)
            const isUnlocked = isLevelUnlocked(difficulty, idx);
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

            // Clear old listeners by overwriting onclick
            btn.onclick = () => {
                if (!btn.classList.contains('locked')) {
                    currentDifficultyLevel = difficulty;
                    currentLevel = level.level;
                    // If level has a bossId, it is a boss level
                    currentBoss = (level.bossId) ? level : null;
                    startGame();
                }
            };
        });
    });
}

/**
     * Handle Expert Boss Selection from the Boss Arena
     */
function setupBossArena() {
    document.querySelectorAll('.boss-card').forEach(card => {
        card.onclick = () => {
            const bossId = card.getAttribute('data-boss');
            currentDifficultyLevel = 'expert';
            const levelIdx = levelProgression.expert.findIndex(l => l.bossId === bossId);
            if (levelIdx !== -1) {
                currentLevel = levelIdx + 1;
                currentBoss = levelProgression.expert[levelIdx];
                document.getElementById('main-menu').classList.add('hidden');
                document.getElementById('game-ui').classList.remove('hidden');
                startGame();
            }
        };
    });
}

function keyPressed() {
    // 1. Handle Key Rebinding in Settings
    if (rebindingKey) {
        const newKey = key.toUpperCase();

        // Allow rebinding to any key

        keyMappings[rebindingKey] = newKey;
        localStorage.setItem('kingSnakeKeyMappings', JSON.stringify(keyMappings));
        rebindingKey = null;
        updateControlUI();
        return false; // Prevent default
    }

    // 2. Track Keys for Movement
    keys[key.toUpperCase()] = true;

    if (key.toUpperCase() === keyMappings.debug) {
        Vehicle.debug = !Vehicle.debug;
        console.log("Debug mode:", Vehicle.debug);
    }

    // 3. Pause Handling (handled by global listener above to catch it anywhere)
    if (key.toUpperCase() === keyMappings.pause) return;

    // 4. Handle Dash
    if (key.toUpperCase() === keyMappings.dash && gameState === PLAYING) {
        if (snake && snake.dash()) {
            // Dash successful
        }
    }
}

function keyReleased() {
    keys[key.toUpperCase()] = false;
}


let draggedObstacle = null;

// Helper for Typewriter Text
function drawIntroText(fullText, col, shake, age, speed) {
    push();
    textAlign(CENTER, CENTER);
    textStyle(BOLD);

    // Calculate visible characters based on age and speed
    // Speed: frames per character (lower is faster)
    let charCount = floor(age / speed);
    let visibleText = fullText.substring(0, charCount);

    let x = width / 2;
    let y = height / 2 + 180; // Moved down to clear boss head

    // Dynamic Main Font Size
    textSize(56);

    if (shake) {
        x += random(-3, 3);
        y += random(-3, 3);
        textSize(72); // Larger for threats
    }

    // Heavy Shadow / Outline for readability against boss
    drawingContext.shadowBlur = 0;
    stroke(0);
    strokeWeight(8);
    fill(col);

    text(visibleText, x, y);

    // Inner fill
    noStroke();
    text(visibleText, x, y);

    pop();
}

function mousePressed() {
    userStartAudio(); // Resume audio context on first click
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
        let dx = mousePos.x - obs.position.x;
        let dy = mousePos.y - obs.position.y;
        let d = sqrt(dx * dx + dy * dy);
        if (d < obs.r) {
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

// DOM Initialization
document.addEventListener('DOMContentLoaded', () => {
    // initialize level buttons once DOM is ready
    setupLevelSelection();
    setupBossArena(); // Connect boss arena functionality

    const nextLevelBtn = document.getElementById('next-level-btn');
    if (nextLevelBtn) {
        nextLevelBtn.addEventListener('click', () => {
            const difficulties = ['easy', 'moderate', 'hard'];
            const currentIdx = difficulties.indexOf(currentDifficultyLevel);

            if (currentLevel < 3) {
                currentLevel++;
            } else if (currentIdx < difficulties.length - 1) {
                currentDifficultyLevel = difficulties[currentIdx + 1];
                currentLevel = 1;
            }

            backToMenu();
        });
    }
});