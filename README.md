# 🐍 Snake Game BUFFA

A modern, interactive snake game built with **p5.js** featuring a comprehensive progression system, dynamic difficulty levels, physics-based steering, and epic boss battles.

## 🎮 Features

### 🔥 Core Gameplay & Mechanics
- **Vehicle Physics System**: Snake extends a `Vehicle` class with steering behaviors (seek, arrive, evade, avoid, wander).
- **Spacebar Dash**: Trigger a high-speed burst with a neon ghost trail effect (rebindable).
- **Smooth Movement**: Fluid acceleration and momentum-based mouse following.
- **Progressive Growth**: Snake grows with each food collected, following a smooth pursuit chain.
- **Dynamic Obstacles**: Random obstacle placement with varying sizes and collision detection.
- **Enemy AI**: Toxic snakes with pursuit/evade mechanics that scale with difficulty.
- **Cinematic Death**: A dramatic 2-second disintegration sequence with custom-colored green particles and screen shake.

### 🏹 Boss Battles (The Gauntlet)
- **Boss Selection Menu**: Choose your challenge from the dedicated boss menu.
- **Flame Serpent (Ignis)**: A gargantuan, multicomponent boss with unique AI states:
  - **Inhale/Exhale**: Sucks in energy to blast spread-shot fireballs.
  - **Dashing**: High-speed charges that trigger screen shakes and falling debris.
  - **Stun Mechanic**: Bait the boss into walls to stun it for massive damage.
- **Cinematic Introductions**: Each boss features a dialogue-driven intro with custom camera work.

### 🗺️ Progression System
- **4 Difficulty Tiers**: Easy → Moderate → Hard → Expert.
- **3 Levels per Tier**: Escalating challenges with distinct environments.
- **Sequential Unlocking**: Levels and tiers unlock as you complete challenges.
- **Tutorial Level**: Interactive on-screen instructions for newcomers.
- **Persistence**: Scores and progression are saved automatically to `localStorage`.

### ⚙️ Settings & Customization
- **Audio Control**: Dedicated sliders for Music and SFX volume.
- **Controls Remapping**: Fully rebindable keys for Steering, Dashing, Pausing, and Debugging.
- **Control Schemes**: Switch between Mouse following and pure Keyboard steering.

## 🎯 Level Structure

### Easy Difficulty (3 levels)
| Level | Name | Target Score | Time Limit | Type |
|-------|------|--------------|-----------|------|
| 1 | Tutorial | 5 food | 90s | Interactive instructions |
| 2 | Easy Level 2 | 10 food | 60s | First obstacles & movement |
| 3 | Easy Level 3 | 15 food | 50s | Introduction to enemies |

### Moderate, Hard, Expert
Progressive increases in:
- Target food collection (20→100+ items).
- Time pressure (70s → 40s limits).
- Obstacle count (6 → 15 obstacles).
- Enemy snake count (3 → 8 enemies).
- Pursuit aggression (0.45 → 0.95 scale).

## 🚀 How to Play

### Starting the Game
1. Open `index.html` in a web browser (Best ran via local server: `python -m http.server 8000`).
2. Click **START** on the main menu for progression or **BOSSES** for the Gauntlet.

### Controls
- **Mouse**: Snake follows cursor (default).
- **Spacebar**: Dash burst (rebindable).
- **ESC**: Pause / Settings.
- **Arrows/WASD**: Steering (if enabled in settings).

## 🛠️ Technical Architecture

### Core Classes
- **`Vehicle` (vehicle.js)**: Physics backbone providing steering behaviors like `seek()`, `arrive()`, and `avoid()`.
- **`Snake` (snake.js)**: Extends Vehicle with segment-chain logic, ghost trails, and collision systems.
- **`FlameSerpent` (flameSerpent.js)**: State-machine AI for the multicomponent boss.
- **`BossRenderer` (bossRenderer.js)**: Procedural arena generation including magma fissures and sharp rocks.
- **`ToxicSnake` (toxicSnake.js)**: Enemy AI with difficulty-scaled hunting behavior.

### Game State Management
The `draw()` loop in `sketch.js` handles the complex orchestration:
```
draw() {
  Background Layer (Arena or Static)
  ├─ If BOSS_INTRO: updateBossIntro() (Cinematic camera)
  ├─ If PLAYING: updateGame() (Physics & Logic)
  │   └─ Update snake, boss, enemies, food
  ├─ If PLAYER_DYING: updatePlayerDying() (Cinematic Explosion)
  ├─ If COMPLETING: updateCompleting() (Victory word formation)
  └─ UI Overlay Layer (Settings, HUD, Dialogue)
```

## 📊 Key Statistics & Tech
- **Total Levels**: 12 Main Levels + The Gauntlet (Bosses).
- **Codebase**: ~3,000+ lines of ES6+ JavaScript.
- **Engine**: p5.js 1.9.0 (Canvas Rendering).
- **Audio**: Web Audio API with volume persistence.
- **Persistence**: Advanced `localStorage` state management for all progress and settings.

## 📁 File Structure
```
my_snake_project/
├── index.html              # UI & Game Container
├── sketch.js              # State Controller & Main Loop
├── flameSerpent.js        # Boss AI & States
├── bossRenderer.js        # Procedural Arena Graphics
├── batFlock.js            # Ambient Bat Swarm System
├── snake.js               # Physics-based Player Logic
├── style.css              # Premium Glassmorphism UI
└── assets/                # Audio, Sprites, and Backgrounds
```

## 🎯 Gameplay Tips
1. **Wall Stun**: When fighting Ignis, dash away at the last second to crash him into walls.
2. **Dash Cooldown**: Use your dash sparingly; it has a 1-second recharge but is vital for survival.
3. **Timer Strategy**: In Expert levels, prioritize food over perfect safety—the clock is your worst enemy.
4. **Volume Control**: Use the Settings menu (ESC) to balance the epic boss music with SFX.
5. **Key Remapping**: If you prefer keyboard, bind your keys in the Settings for a classic feel.

## 🎮 Future Enhancements
- 🏆 Global Leaderboard system.
- 🎨 Unlockable Snake Skins (earned via Boss defeats).
- ⚡ Multiple Power-up types (Shields, Slow-Mo).
- 📱 Comprehensive Touch Controls.
- 🌍 Procedural Endless Mode.

## 👤 Authors
- **radiaoml** - [GitHub](https://github.com/radiaoml/)
- **ahmedaminecherqui** - [GitHub](https://github.com/ahmedaminecherqui)

---
**Version**: 1.2 "The Boss Update"
**Status**: Feature Complete & Professionally Documented
**Last Updated**: February 6, 2026
