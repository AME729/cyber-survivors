/**
 * Cyber Survivors: Core 2D Canvas Engine & Game Loop
 */

class _GameEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.isRunning = false;
    this.isPaused = false;

    // Time & Waves
    this.gameTime = 0; // in seconds
    this.spawnTimer = 0;
    this.currentWaveIdx = 0;

    // Entities
    this.player = null;
    this.enemies = [];
    this.projectiles = [];
    this.drops = [];
    this.particles = [];
    this.combatTexts = [];
    this.effects = []; // Lightning arcs, shockwaves

    // Camera & Shake
    this.camera = { x: 0, y: 0 };
    this.shakeIntensity = 0;

    // Inputs
    this.input = {
      up: false,
      down: false,
      left: false,
      right: false,
      mouseX: 0,
      mouseY: 0,
      joystickActive: false,
      joystickX: 0,
      joystickY: 0
    };

    // Virtual Joystick Touch Data
    this.touchStartPos = null;

    // Performance Stats
    this.fps = 60;
    this.lastTime = 0;

    // God mode cheat for testing
    this.godMode = false;
  }

  init(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.radarCanvas = document.getElementById('radar-canvas');
    this.radarCtx = this.radarCanvas ? this.radarCanvas.getContext('2d') : null;

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.setupKeyboard();
    this.setupTouchControls();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setupKeyboard() {
    const handleKey = (e, isDown) => {
      const code = e.code || '';
      const key = (e.key || '').toLowerCase();

      let handled = false;
      // UP (W or Z or ArrowUp)
      if (['ArrowUp', 'KeyW', 'KeyZ'].includes(code) || ['z', 'w', 'arrowup'].includes(key)) {
        this.input.up = isDown;
        handled = true;
      }
      // DOWN (S or ArrowDown)
      if (['ArrowDown', 'KeyS'].includes(code) || ['s', 'arrowdown'].includes(key)) {
        this.input.down = isDown;
        handled = true;
      }
      // LEFT (A or Q or ArrowLeft)
      if (['ArrowLeft', 'KeyA', 'KeyQ'].includes(code) || ['q', 'a', 'arrowleft'].includes(key)) {
        this.input.left = isDown;
        handled = true;
      }
      // RIGHT (D or ArrowRight)
      if (['ArrowRight', 'KeyD'].includes(code) || ['d', 'arrowright'].includes(key)) {
        this.input.right = isDown;
        handled = true;
      }

      if (isDown && (code === 'Escape' || key === 'escape') && this.isRunning) {
        window.UI.togglePause();
        handled = true;
      }

      if (handled && e.preventDefault) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', (e) => handleKey(e, true));
    window.addEventListener('keyup', (e) => handleKey(e, false));

    window.addEventListener('mousemove', (e) => {
      this.input.mouseX = e.clientX;
      this.input.mouseY = e.clientY;
    });
  }

  setupTouchControls() {
    const joyContainer = document.getElementById('virtual-joystick');
    const joyKnob = document.getElementById('joystick-knob');
    if (!joyContainer || !joyKnob) return;

    let touchId = null;
    let originX = 0;
    let originY = 0;
    const maxRadius = 45;

    window.addEventListener('touchstart', (e) => {
      if (!this.isRunning || this.isPaused) return;
      const touch = e.touches[0];
      // Only trigger joystick on left side of screen
      if (touch.clientX < window.innerWidth * 0.6) {
        touchId = touch.identifier;
        originX = touch.clientX;
        originY = touch.clientY;
        joyContainer.style.left = `${originX - 60}px`;
        joyContainer.style.top = `${originY - 60}px`;
        joyContainer.classList.remove('hidden');
        joyKnob.style.transform = `translate(0px, 0px)`;
        this.input.joystickActive = true;
        this.input.joystickX = 0;
        this.input.joystickY = 0;
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (!this.input.joystickActive) return;
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        if (touch.identifier === touchId) {
          const dx = touch.clientX - originX;
          const dy = touch.clientY - originY;
          const dist = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx);
          const clampedDist = Math.min(maxRadius, dist);

          const knobX = Math.cos(angle) * clampedDist;
          const knobY = Math.sin(angle) * clampedDist;
          joyKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

          this.input.joystickX = knobX / maxRadius;
          this.input.joystickY = knobY / maxRadius;
          break;
        }
      }
    }, { passive: false });

    const endTouch = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          this.input.joystickActive = false;
          this.input.joystickX = 0;
          this.input.joystickY = 0;
          joyContainer.classList.add('hidden');
          touchId = null;
          break;
        }
      }
    };

    window.addEventListener('touchend', endTouch);
    window.addEventListener('touchcancel', endTouch);
  }

  start(characterId) {
    this.resizeCanvas();
    this.player = new Player(characterId);
    this.enemies = [];
    this.projectiles = [];
    this.drops = [];
    this.particles = [];
    this.combatTexts = [];
    this.effects = [];
    this.gameTime = 0;
    this.spawnTimer = 0;
    this.currentWaveIdx = 0;
    this.isRunning = true;
    this.isPaused = false;
    MonetizationManager.reviveUsedThisRun = false;

    // Reset inputs
    this.input.up = false;
    this.input.down = false;
    this.input.left = false;
    this.input.right = false;

    // Spawn 4 initial enemies near player (320px away) so action starts immediately
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI * 2) / 4 + 0.3;
      const dist = 320;
      const ex = this.player.x + Math.cos(angle) * dist;
      const ey = this.player.y + Math.sin(angle) * dist;
      this.enemies.push(new Enemy('drone', ex, ey));
    }

    SoundSystem.resume();
    SoundSystem.startMusic();

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  loop(timestamp) {
    if (!this.isRunning) return;

    const dt = Math.min(0.08, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    if (!this.isPaused) {
      this.update(dt);
    }
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    this.gameTime += dt;

    // Check God Mode
    if (this.godMode && this.player) {
      this.player.hp = this.player.maxHp;
    }

    // Update Player
    this.player.update(dt, this.input, this);

    // Camera following player
    this.camera.x = this.player.x - this.canvas.width / 2;
    this.camera.y = this.player.y - this.canvas.height / 2;

    // Screen Shake decay
    if (this.shakeIntensity > 0) {
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 15);
    }

    // Wave Spawner
    this.updateSpawns(dt);

    // Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, this.player);
      if (e.hp <= 0) {
        this.enemies.splice(i, 1);
      }
    }

    // Orbital Shield vs Enemies collision
    if (this.player.weapons['orbital_shield']) {
      const lvl = this.player.weapons['orbital_shield'];
      const lvlConf = CONFIG.WEAPONS.orbital_shield.levels[lvl - 1] || {};
      const bladeCount = lvlConf.count || CONFIG.WEAPONS.orbital_shield.baseCount;
      const orbitRad = CONFIG.WEAPONS.orbital_shield.orbitRadius * (lvlConf.radiusMult || 1.0);
      const bladeDamage = Math.floor(CONFIG.WEAPONS.orbital_shield.baseDamage * this.player.damageMult * (lvlConf.damageMult || 1.0));

      for (let b = 0; b < bladeCount; b++) {
        const angle = this.player.orbitAngle + (b * (Math.PI * 2 / bladeCount));
        const bx = this.player.x + Math.cos(angle) * orbitRad;
        const by = this.player.y + Math.sin(angle) * orbitRad;

        this.enemies.forEach(enemy => {
          const dist = Math.hypot(enemy.x - bx, enemy.y - by);
          if (dist < enemy.radius + 12) {
            enemy.takeDamage(bladeDamage * dt * 5, this, this.player.critChance, this.player.critMultiplier);
          }
        });
      }
    }

    // Update Projectiles & Collisions
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt);

      // Hit enemies
      for (let j = 0; j < this.enemies.length; j++) {
        const e = this.enemies[j];
        if (!p.hitEnemies.has(e)) {
          const dist = Math.hypot(e.x - p.x, e.y - p.y);
          if (dist < e.radius + p.radius) {
            p.hitEnemies.add(e);
            e.takeDamage(p.damage, this, p.critChance, p.critMultiplier);
            p.penetration--;
            if (p.penetration <= 0) break;
          }
        }
      }

      if (p.lifetime <= 0 || p.penetration <= 0) {
        this.projectiles.splice(i, 1);
      }
    }

    // Update Drops
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      if (drop.update(dt, this.player)) {
        this.drops.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dt);
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Update Combat Texts
    for (let i = this.combatTexts.length - 1; i >= 0; i--) {
      const txt = this.combatTexts[i];
      txt.update(dt);
      if (txt.life <= 0) this.combatTexts.splice(i, 1);
    }

    // Update Special Effects (lightning, emp rings)
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const eff = this.effects[i];
      eff.life -= dt;
      if (eff.life <= 0) this.effects.splice(i, 1);
    }

    // Check Player Death
    if (this.player.hp <= 0) {
      this.handleGameOver();
    }

    // Check Boss Presence & Update Boss Bar
    const activeBoss = this.enemies.find(e => e.isBoss && !e.isDead);
    const bossContainer = document.getElementById('hud-boss-bar-container');
    if (activeBoss) {
      if (bossContainer) {
        bossContainer.classList.remove('hidden');
        const bossBar = document.getElementById('hud-boss-hp-bar');
        const bossText = document.getElementById('hud-boss-hp-text');
        const ratio = Math.max(0, (activeBoss.hp / activeBoss.maxHp) * 100);
        if (bossBar) bossBar.style.width = `${ratio}%`;
        if (bossText) bossText.textContent = `${Math.ceil(activeBoss.hp)} / ${activeBoss.maxHp} PV`;
      }
    } else if (bossContainer && !bossContainer.classList.contains('hidden')) {
      bossContainer.classList.add('hidden');
    }

    // Sync HUD
    window.UI.updateInGameHud();
  }

  updateSpawns(dt) {
    // Determine active wave
    const schedule = CONFIG.WAVE_SCHEDULE;
    for (let i = schedule.length - 1; i >= 0; i--) {
      if (this.gameTime >= schedule[i].time) {
        this.currentWaveIdx = i;
        break;
      }
    }
    const wave = schedule[this.currentWaveIdx];

    this.spawnTimer += dt;
    if (this.spawnTimer >= wave.spawnRate && this.enemies.length < wave.countCap) {
      this.spawnTimer = 0;
      const type = wave.types[Math.floor(Math.random() * wave.types.length)];
      this.spawnEnemyAtEdge(type);
    }
  }

  spawnEnemyAtEdge(typeKey) {
    const angle = Math.random() * Math.PI * 2;
    const viewDist = Math.max(this.canvas.width || 800, this.canvas.height || 600) * 0.45;
    const spawnDist = Math.max(380, Math.min(560, viewDist));
    const x = Math.max(50, Math.min(CONFIG.WORLD_WIDTH - 50, this.player.x + Math.cos(angle) * spawnDist));
    const y = Math.max(50, Math.min(CONFIG.WORLD_HEIGHT - 50, this.player.y + Math.sin(angle) * spawnDist));
    this.enemies.push(new Enemy(typeKey, x, y));
  }

  getNearestEnemies(x, y, count = 1, maxDist = 600) {
    const valid = this.enemies
      .map(e => ({ enemy: e, dist: Math.hypot(e.x - x, e.y - y) }))
      .filter(item => item.dist <= maxDist)
      .sort((a, b) => a.dist - b.dist);
    return valid.slice(0, count).map(v => v.enemy);
  }

  getEnemiesInRadius(x, y, radius) {
    return this.enemies.filter(e => Math.hypot(e.x - x, e.y - y) <= radius);
  }

  addCombatText(x, y, text, isCrit = false, customColor = null) {
    this.combatTexts.push(new CombatText(x, y, text, isCrit, customColor));
  }

  createExplosionParticles(x, y, color, count = 15) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 50 + Math.random() * 180;
      this.particles.push(new Particle(
        x, y, color,
        Math.cos(angle) * spd,
        Math.sin(angle) * spd,
        0.3 + Math.random() * 0.4
      ));
    }
  }

  createLightningArc(x1, y1, x2, y2) {
    this.effects.push({
      type: 'lightning',
      x1, y1, x2, y2,
      life: 0.15,
      maxLife: 0.15
    });
  }

  createEmpWave(x, y, targetRadius) {
    this.effects.push({
      type: 'emp',
      x, y,
      targetRadius,
      currentRadius: 10,
      life: 0.25,
      maxLife: 0.25
    });
  }

  triggerLevelUp() {
    this.isPaused = true;
    window.UI.showLevelUpModal();
  }

  triggerChestReward() {
    this.isPaused = true;
    window.UI.showChestRewardModal();
  }

  handleGameOver() {
    this.isRunning = false;
    SoundSystem.stopMusic();
    MetaManager.recordGameEnd(
      Math.floor(this.gameTime * 25 + this.player.kills * 10),
      this.player.kills,
      Math.floor(this.gameTime)
    );
    window.UI.showGameOverScreen();
  }

  handleVictory() {
    this.isRunning = false;
    SoundSystem.stopMusic();
    MetaManager.recordGameEnd(
      Math.floor(this.gameTime * 30 + this.player.kills * 15 + 5000),
      this.player.kills,
      Math.floor(this.gameTime)
    );
    window.UI.showVictoryScreen();
  }

  revivePlayer() {
    if (!this.player) return;
    this.player.hp = Math.floor(this.player.maxHp * 0.6);
    this.player.invulnerableTimer = 3.0; // 3 seconds immunity
    // Destroy nearby enemies
    this.createEmpWave(this.player.x, this.player.y, 400);
    this.enemies = this.enemies.filter(e => Math.hypot(e.x - this.player.x, e.y - this.player.y) > 350);

    this.isRunning = true;
    this.isPaused = false;
    SoundSystem.startMusic();
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;

    // Clear Screen
    ctx.fillStyle = '#080a10';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();

    // Camera offset with Screen Shake
    let camX = this.camera.x;
    let camY = this.camera.y;
    if (this.shakeIntensity > 0) {
      camX += (Math.random() - 0.5) * this.shakeIntensity;
      camY += (Math.random() - 0.5) * this.shakeIntensity;
    }
    ctx.translate(-camX, -camY);

    // Draw Cyber Arena Grid
    this.drawGrid(ctx);

    // Draw World Arena Boundaries
    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 4;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff0055';
    ctx.strokeRect(0, 0, CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT);
    ctx.shadowBlur = 0;

    // Draw Drops
    this.drops.forEach(d => d.draw(ctx));

    // Draw Enemies
    this.enemies.forEach(e => e.draw(ctx));

    // Draw Projectiles
    this.projectiles.forEach(p => p.draw(ctx));

    // Draw Player
    if (this.player) this.player.draw(ctx);

    // Draw Particles
    this.particles.forEach(p => p.draw(ctx));

    // Draw Special Effects (Lightning & EMP shockwave)
    this.effects.forEach(eff => {
      if (eff.type === 'lightning') {
        ctx.save();
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff00ff';
        ctx.beginPath();
        ctx.moveTo(eff.x1, eff.y1);
        // Jagged line
        const midX = (eff.x1 + eff.x2) / 2 + (Math.random() * 30 - 15);
        const midY = (eff.y1 + eff.y2) / 2 + (Math.random() * 30 - 15);
        ctx.lineTo(midX, midY);
        ctx.lineTo(eff.x2, eff.y2);
        ctx.stroke();
        ctx.restore();
      } else if (eff.type === 'emp') {
        const progress = 1 - (eff.life / eff.maxLife);
        const rad = eff.targetRadius * progress;
        ctx.save();
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 4 * (1 - progress);
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';
        ctx.beginPath();
        ctx.arc(eff.x, eff.y, rad, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    });

    // Draw Combat Text numbers
    this.combatTexts.forEach(txt => txt.draw(ctx));

    ctx.restore();

    // Render Minimap Radar
    this.renderRadar();
  }

  renderRadar() {
    if (!this.radarCtx || !this.player) return;
    const rCtx = this.radarCtx;
    const size = 130;
    const center = size / 2;
    const radarRadius = center - 4;
    const scale = radarRadius / 800; // 800px world radius on radar

    rCtx.clearRect(0, 0, size, size);

    rCtx.save();
    rCtx.beginPath();
    rCtx.arc(center, center, radarRadius, 0, Math.PI * 2);
    rCtx.clip();

    // Concentric grid rings
    rCtx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
    rCtx.lineWidth = 1;
    [0.35, 0.7, 1.0].forEach(frac => {
      rCtx.beginPath();
      rCtx.arc(center, center, radarRadius * frac, 0, Math.PI * 2);
      rCtx.stroke();
    });

    // Crosshairs
    rCtx.beginPath();
    rCtx.moveTo(center, 4);
    rCtx.lineTo(center, size - 4);
    rCtx.moveTo(4, center);
    rCtx.lineTo(size - 4, center);
    rCtx.stroke();

    // Draw Drops (chests & credits)
    this.drops.forEach(d => {
      const rx = center + (d.x - this.player.x) * scale;
      const ry = center + (d.y - this.player.y) * scale;
      if (Math.hypot(rx - center, ry - center) < radarRadius) {
        rCtx.fillStyle = d.type === 'chest' ? '#ffd700' : '#00ffff';
        rCtx.beginPath();
        rCtx.arc(rx, ry, d.type === 'chest' ? 3.5 : 2, 0, Math.PI * 2);
        rCtx.fill();
      }
    });

    // Draw Enemies on Radar
    this.enemies.forEach(e => {
      if (e.isDead) return;
      const rx = center + (e.x - this.player.x) * scale;
      const ry = center + (e.y - this.player.y) * scale;
      if (Math.hypot(rx - center, ry - center) < radarRadius) {
        if (e.isBoss) {
          rCtx.fillStyle = '#ff0033';
          rCtx.shadowBlur = 6;
          rCtx.shadowColor = '#ff0033';
          rCtx.beginPath();
          rCtx.arc(rx, ry, 5, 0, Math.PI * 2);
          rCtx.fill();
          rCtx.shadowBlur = 0;
        } else {
          rCtx.fillStyle = '#ff2255';
          rCtx.beginPath();
          rCtx.arc(rx, ry, 2, 0, Math.PI * 2);
          rCtx.fill();
        }
      }
    });

    // Player in center (pulsing cyan blip)
    rCtx.fillStyle = '#00ffff';
    rCtx.shadowBlur = 8;
    rCtx.shadowColor = '#00ffff';
    rCtx.beginPath();
    rCtx.arc(center, center, 3.5, 0, Math.PI * 2);
    rCtx.fill();
    rCtx.shadowBlur = 0;

    rCtx.restore();
  }

  drawGrid(ctx) {
    const gridSize = 100;
    const startX = Math.floor(this.camera.x / gridSize) * gridSize;
    const endX = startX + this.canvas.width + gridSize;
    const startY = Math.floor(this.camera.y / gridSize) * gridSize;
    const endY = startY + this.canvas.height + gridSize;

    ctx.strokeStyle = '#121828';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = startX; x <= endX; x += gridSize) {
      if (x >= 0 && x <= CONFIG.WORLD_WIDTH) {
        ctx.moveTo(x, Math.max(0, startY));
        ctx.lineTo(x, Math.min(CONFIG.WORLD_HEIGHT, endY));
      }
    }

    for (let y = startY; y <= endY; y += gridSize) {
      if (y >= 0 && y <= CONFIG.WORLD_HEIGHT) {
        ctx.moveTo(Math.max(0, startX), y);
        ctx.lineTo(Math.min(CONFIG.WORLD_WIDTH, endX), y);
      }
    }
    ctx.stroke();
  }
}

const GameEngine = new _GameEngine();
window.GameEngine = GameEngine;
