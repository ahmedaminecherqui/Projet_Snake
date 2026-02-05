# 🐍 Snake Game BUFFA

A modern, interactive snake game built with **p5.js** featuring a comprehensive progression system, dynamic difficulty levels, and physics-based gameplay mechanics.

## 🎮 Features

### Core Gameplay
- **Vehicle Physics System**: Snake extends a Vehicle class with steering behaviors (seek, arrive, evade, avoid, wander)
- **Smooth Movement**: Mouse-following snake with responsive acceleration and momentum
- **Progressive Growth**: Snake grows with each food collected
- **Dynamic Obstacles**: Random obstacle placement with varying sizes and collision detection
- **Enemy AI**: Toxic snakes with pursuit/evade mechanics that scale with difficulty
- **Particle Effects**: Visual feedback bursts when collecting food

### Level Progression System
- **4 Difficulty Tiers**: Easy → Moderate → Hard → Expert
- **3 Levels per Difficulty**: Each tier has 3 distinct levels with escalating challenges
- **Unlock Mechanics**: Must complete all 3 levels of a difficulty to unlock the next tier
- **Tutorial Level**: Interactive on-screen instructions for Easy Level 1
- **LocalStorage Persistence**: Progress automatically saved to browser storage

### Scoring & Time System
- **Target Score Goals**: Each level has a required food collection target
- **Countdown Timer**: Per-level time limits prevent endless play
- **Immediate Win**: Levels end instantly when target score is reached
- **Time-Out Failure**: Levels end as game-over if timer expires before target

### UI/UX Polish
- **Responsive Design**: Adaptive scaling with clamp() for fonts and layouts
- **Horizontal Level Grid**: Mode-like button layout for level selection
- **Visual States**: Locked (🔒), Unlocked, and Completed (✓) level indicators
- **Game Over Modal**: Score display, next-level progression, restart options
- **Top Score Tracking**: Persists across sessions via localStorage

## 🎯 Level Structure

### Easy Difficulty (3 levels)
| Level | Name | Target Score | Time Limit | Type |
|-------|------|--------------|-----------|------|
| 1 | Tutorial | 5 food | 90s | Interactive instructions |
| 2 | Easy Level 2 | 10 food | 60s | First obstacles & movement |
| 3 | Easy Level 3 | 15 food | 50s | Introduction to enemies |

### Moderate, Hard, Expert
Progressive increases in:
- Target food collection (20→100+ items)
- Time pressure (70s → 40s limits)
- Obstacle count (6 → 15 obstacles)
- Enemy snake count (3 → 8 enemies)
- Pursuit aggression (0.45 → 0.95 scale)

## 🚀 How to Play

### Starting the Game
1. Open `index.html` in a web browser (or run local HTTP server: `python -m http.server 8000`)
2. Click **START** on the main menu
3. Select a level from the available difficulty tier

### Gameplay
- **Move**: Follow your mouse cursor (snake head seeks toward mouse)
- **Collect**: Eat golden food items to grow and increase score
- **Avoid**: Don't hit obstacles (rocks) or enemy snakes
- **Win Condition**: Collect target food amount before time runs out
- **Lose Condition**: Hit obstacle, collide with enemy, eat yourself, or time expires

### Controls
- **Mouse Movement**: Primary control (no keyboard required)
- **Button Clicks**: Level selection, restart, next level navigation

## 🛠️ Technical Architecture

### Core Classes

#### `Vehicle` (vehicle.js)
Base class providing physics-based steering behaviors:
- `seek()` - Direct approach to target
- `arrive()` - Smooth deceleration approach
- `pursue()` - Predictive chasing
- `evade()` - Escape from pursuer
- `wander()` - Autonomous wandering
- `avoid()` - Obstacle avoidance (reduced range to allow collisions)
- `boundaries()` - Screen wrapping behavior

#### `Snake` (snake.js)
Extends Vehicle with:
- Segment-based body system
- Head and trailing segments with smooth pursuit
- Collision detection:
  - `checkSelfCollision()` - Self intersection
  - `checkObstacleCollision()` - Obstacle overlap (actual collision, no bouncing)
  - `checkEnemyCollision()` - Enemy snake contact
- Food consumption and growth

#### `ToxicSnake` (toxicSnake.js)
Enemy snake AI with:
- Difficulty-scaled pursuit behavior
- Seek player snake mechanics
- Dynamic threat level based on player score

#### `Food` (food.js)
Collectible items with:
- Random spawning within bounds
- Visual representation from spritesheet
- Respawning on collection

#### `Obstacle` (obstacle.js)
Static environmental hazards:
- Random placement avoiding spawn area
- Variable sizes (25-40px radius)
- Visual circle with border styling

#### `ParticleSystem` (sketch.js)
Visual effects:
- Burst animations on food collection
- Fade-out trajectory
- Lifespan-based cleanup

### Game State Management

#### Main Game Loop (sketch.js)
```
draw() {
  Background rendering
  ├─ If PLAYING: updateGame()
  │   ├─ Render obstacles, food, enemies (always)
  │   ├─ If tutorial active: return (pause logic)
  │   └─ Update physics, collisions, score
  │   └─ Draw tutorial overlay on top
  ├─ If START: updateMainMenu()
}
```

#### Level Progression
- `levelProgression`: 4×3 grid of level objects with `targetScore`, `timeLimit`, `isTutorial`
- `levelProgress`: localStorage-backed tracking of completed levels and unlock status
- `completeLevel()`: Marks level complete and unlocks next difficulty
- `setupLevelSelection()`: Creates/updates button states (locked/unlocked/completed)

#### Tutorial System
- `drawTutorialOverlay()`: Responsive modal with instructions
- `mousePressed()`: GOT IT button click detection
- Timer starts only after tutorial dismissal
- Game renders static world while overlay active

## 📁 File Structure

```
my_snake_project/
├── index.html              # Main HTML structure
├── style.css              # Base styling (snake, menu, modals)
├── levels.css             # Level selector grid & responsive design
├── sketch.js              # Main game logic & level system (507 lines)
├── snake.js               # Snake class & collision detection
├── vehicle.js             # Base steering behavior class
├── food.js                # Food collectible class
├── obstacle.js            # Obstacle hazard class
├── toxicSnake.js          # Enemy AI snake class
├── particle.js            # Particle system effects
├── tutorial.js            # Tutorial overlay & instructions
├── assets/
│   ├── mascot.png         # Snake head sprite (60×60)
│   ├── food.png           # Food spritesheet (256×64, 4 colors)
│   └── background.png     # Dark gradient background (1920×1080)
└── README.md              # This file
```

## 🎨 Technologies Used

- **p5.js 1.9.0**: Canvas-based graphics and interactive rendering
- **Vanilla JavaScript (ES6+)**: Class-based OOP architecture
- **HTML5 Canvas**: Game rendering engine
- **CSS3**: Flexbox layout, responsive design with clamp()
- **localStorage API**: Persistent player progression
- **PIL (Python)**: Asset generation utility

## 📊 Key Statistics

- **Total Levels**: 12 (4 difficulties × 3 levels)
- **Code Lines**: ~2,000+ lines of JavaScript
- **Collision Types**: 3 (self, obstacle, enemy)
- **Steering Behaviors**: 7 (seek, arrive, pursue, evade, wander, avoid, boundaries)
- **Responsive Breakpoints**: Mobile-first design with adaptive scaling

## 🔧 Setup & Running

### Option 1: Direct Browser
```bash
# Open index.html directly in your browser
# Or use VS Code Live Server extension
```

### Option 2: Local HTTP Server
```bash
cd my_snake_project
python -m http.server 8000
# Visit http://localhost:8000 in your browser
```

### Option 3: Python 3 Built-in Server
```bash
python3 -m http.server 8000
```

## 🎯 Gameplay Tips

1. **Easy Levels**: Learn mechanics without heavy time pressure
2. **Obstacle Strategy**: The avoid() behavior activates late—plan your path
3. **Enemy Evasion**: Maintain distance; enemies scale with your score
4. **Timer Management**: Watch the countdown; collect quickly in hard difficulties
5. **Progressive Unlocking**: Complete Easy fully to access Moderate tier

## 🚧 Implemented Features (v1.0)

✅ Core snake mechanics with vehicle physics
✅ 12-level progression system with unlocks
✅ Tutorial overlay with pause functionality
✅ Responsive UI with adaptive fonts
✅ Multiple difficulty tiers with distinct enemy/obstacle counts
✅ Score-based level completion (not timer-based)
✅ Collision detection (accurate overlap, no bouncing)
✅ Particle effects on food collection
✅ LocalStorage persistence for progress
✅ Horizontal level layout (mode-style grid)
✅ Enemy snake AI with difficulty scaling
✅ Time limits per level with countdown display
✅ Game-over modal with next-level progression

## 🎮 Future Enhancements (Potential)

- 🎵 Sound effects (eat, collision, level-up)
- 🏆 Global leaderboard (multiplayer scores)
- 🎨 Custom snake skins/themes
- ⚡ Power-ups (speed boost, shield, slow-time)
- 📱 Touch controls for mobile
- 🌙 Dark/light theme toggle
- 🔊 Audio settings menu
- 🎬 Recording/replay system
- 🌍 Procedurally generated levels
- 👥 Multiplayer modes

## 📝 License

Created as an educational project for the BUFFA curriculum.

## 👤 Author

**radiaoml**
GitHub: https://github.com/radiaoml/Snake_Game_BUFFA

---

**Last Updated**: February 4, 2026
**Version**: 1.0
**Status**: Complete & Playable
