/**
 * Cyber Survivors: Entities & Combat Systems
 */

class Player {
  constructor(charId) {
    const charConf = CONFIG.CHARACTERS.find(c => c.id === charId) || CONFIG.CHARACTERS[0];
    this.charConf = charConf;
    this.id = charId;

    // Position in world center
    this.x = CONFIG.WORLD_WIDTH / 2;
    this.y = CONFIG.WORLD_HEIGHT / 2;
    this.radius = 18;
    this.angle = 0;

    // Movement vector
    this.vx = 0;
    this.vy = 0;

    // Load Permanent Upgrades from MetaManager
    const meta = MetaManager.data.upgrades;
    const bonusHp = (meta.max_hp || 0) * CONFIG.ARMORY_UPGRADES.max_hp.valPerLevel;
    const bonusDmg = (meta.damage || 0) * CONFIG.ARMORY_UPGRADES.damage.valPerLevel;
    const bonusSpd = (meta.speed || 0) * CONFIG.ARMORY_UPGRADES.speed.valPerLevel;
    const bonusMag = (meta.magnet || 0) * CONFIG.ARMORY_UPGRADES.magnet.valPerLevel;
    const bonusLck = (meta.luck || 0) * CONFIG.ARMORY_UPGRADES.luck.valPerLevel;

    // Effective Stats
    const base = CONFIG.BASE_PLAYER;
    const charBonus = charConf.bonus || {};

    this.maxHp = (charBonus.maxHp || base.maxHp) + bonusHp;
    this.hp = this.maxHp;
    this.baseSpeed = (base.speed * (charBonus.speed || 1.0)) * (1 + bonusSpd);
    this.speed = this.baseSpeed;
    this.pickupRadius = (base.pickupRadius * (charBonus.pickupRadius || 1.0)) * (1 + bonusMag);
    this.damageMult = (base.damageMult * (charBonus.damageMult || 1.0)) + bonusDmg;
    this.cooldownReduction = (charBonus.cooldownReduction || 0);
    this.critChance = (charBonus.critChance || base.critChance) + bonusLck;
    this.critMultiplier = base.critMultiplier;
    this.armor = charBonus.armor || base.armor;
    this.regenRate = base.regenRate;

    // Multipliers from passive items in-game
    this.bonusSpeed = 1.0;
    this.bonusDamage = 1.0;
    this.bonusPickupRadius = 1.0;
    this.bonusCooldown = 1.0;

    // Inventory
    this.weapons = {}; // { weaponId: level }
    this.passives = {}; // { passiveId: level }
    this.weaponTimers = {}; // { weaponId: timeRemaining }
    this.orbitAngle = 0; // For orbital shields

    // Progression in current run
    this.level = 1;
    this.xp = 0;
    this.xpNext = 12;
    this.kills = 0;
    this.creditsEarned = 0;
    this.invulnerableTimer = 0;

    // Equip starting weapon
    this.addWeapon(charConf.startingWeapon);
  }

  addWeapon(weaponId) {
    if (!this.weapons[weaponId]) {
      this.weapons[weaponId] = 1;
      this.weaponTimers[weaponId] = 0;
    } else if (this.weapons[weaponId] < CONFIG.WEAPONS[weaponId].maxLevel) {
      this.weapons[weaponId]++;
    }
  }

  addPassive(passiveId) {
    if (!this.passives[passiveId]) {
      this.passives[passiveId] = 1;
    } else if (this.passives[passiveId] < CONFIG.PASSIVES[passiveId].maxLevel) {
      this.passives[passiveId]++;
    }
    // Apply effect
    if (CONFIG.PASSIVES[passiveId].effect) {
      CONFIG.PASSIVES[passiveId].effect(this, this.passives[passiveId]);
    }
  }

  takeDamage(amount) {
    if (this.invulnerableTimer > 0) return 0;
    const effectiveDamage = Math.max(1, amount - this.armor);
    this.hp -= effectiveDamage;
    this.invulnerableTimer = 0.35; // 350ms iframes
    SoundSystem.playHit();
    if (this.hp <= 0) {
      this.hp = 0;
    }
    return effectiveDamage;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  addXp(amount) {
    this.xp += amount;
    SoundSystem.playXp();
    if (this.xp >= this.xpNext) {
      this.levelUp();
    }
  }

  levelUp() {
    this.level++;
    this.xp -= this.xpNext;
    this.xpNext = Math.floor(this.xpNext * 1.35) + 8;
    SoundSystem.playLevelUp();
    window.GameEngine.triggerLevelUp();
  }

  update(dt, input, engine) {
    // Iframes
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    // Health Regeneration
    if (this.regenRate > 0 && this.hp < this.maxHp) {
      this.heal(this.regenRate * dt);
    }

    // Movement calculation
    let dx = 0;
    let dy = 0;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;

    // Virtual Joystick support
    if (input.joystickActive) {
      dx = input.joystickX;
      dy = input.joystickY;
    }

    const len = Math.hypot(dx, dy);
    if (len > 0) {
      const currentSpeed = this.baseSpeed * this.bonusSpeed;
      const normalizedX = dx / len;
      const normalizedY = dy / len;
      this.x += normalizedX * currentSpeed * dt;
      this.y += normalizedY * currentSpeed * dt;
      this.angle = Math.atan2(normalizedY, normalizedX);
    }

    // World bounds clamping
    const margin = 25;
    this.x = Math.max(margin, Math.min(CONFIG.WORLD_WIDTH - margin, this.x));
    this.y = Math.max(margin, Math.min(CONFIG.WORLD_HEIGHT - margin, this.y));

    // Update Orbital Shields angle
    this.orbitAngle += dt * 3.5;

    // Fire Weapons
    this.updateWeapons(dt, engine);
  }

  updateWeapons(dt, engine) {
    Object.keys(this.weapons).forEach(wId => {
      const lvl = this.weapons[wId];
      const wConf = CONFIG.WEAPONS[wId];
      if (!wConf) return;

      const lvlConf = wConf.levels[lvl - 1] || {};
      const cooldownMult = (lvlConf.cooldownMult || 1.0) * this.bonusCooldown * (1 - this.cooldownReduction);
      const effectiveCooldown = Math.max(0.2, wConf.baseCooldown * cooldownMult);

      this.weaponTimers[wId] = (this.weaponTimers[wId] || 0) - dt;
      if (this.weaponTimers[wId] <= 0) {
        this.fireWeapon(wId, lvl, engine);
        this.weaponTimers[wId] = effectiveCooldown;
      }
    });
  }

  fireWeapon(wId, level, engine) {
    const wConf = CONFIG.WEAPONS[wId];
    const lvlConf = wConf.levels[level - 1] || {};
    const dmgMult = this.damageMult * this.bonusDamage * (lvlConf.damageMult || 1.0);
    const damage = Math.floor(wConf.baseDamage * dmgMult);

    if (wId === 'plasma_blaster') {
      const count = lvlConf.count || wConf.baseCount;
      const nearest = engine.getNearestEnemies(this.x, this.y, count, 650);
      if (nearest.length > 0) {
        nearest.forEach((enemy, idx) => {
          setTimeout(() => {
            const angle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
            engine.projectiles.push(new Projectile({
              type: 'plasma_blaster',
              x: this.x,
              y: this.y,
              angle: angle,
              speed: wConf.baseSpeed,
              damage: damage,
              penetration: lvlConf.penetration || wConf.penetration,
              radius: 6,
              color: wConf.color,
              critChance: this.critChance,
              critMultiplier: this.critMultiplier
            }));
            SoundSystem.playLaser();
          }, idx * 60);
        });
      }
    } else if (wId === 'chain_lightning') {
      const chainCount = lvlConf.chainCount || wConf.baseChainCount;
      const targets = engine.getNearestEnemies(this.x, this.y, chainCount, 550);
      if (targets.length > 0) {
        SoundSystem.playLightning();
        let prev = { x: this.x, y: this.y };
        targets.forEach((target, i) => {
          // Shockwave line
          engine.createLightningArc(prev.x, prev.y, target.x, target.y);
          target.takeDamage(damage, engine, this.critChance, this.critMultiplier);
          prev = target;
        });
      }
    } else if (wId === 'emp_aura') {
      const radius = wConf.baseRadius * (lvlConf.radiusMult || 1.0);
      engine.createEmpWave(this.x, this.y, radius);
      SoundSystem.playExplosion(false);
      const targets = engine.getEnemiesInRadius(this.x, this.y, radius);
      targets.forEach(e => {
        e.takeDamage(damage, engine, this.critChance, this.critMultiplier);
      });
    } else if (wId === 'drone_turret') {
      const targets = engine.getNearestEnemies(this.x, this.y, 1, 700);
      if (targets.length > 0) {
        const t = targets[0];
        const angle = Math.atan2(t.y - this.y, t.x - this.x);
        engine.projectiles.push(new Projectile({
          type: 'drone_laser',
          x: this.x + Math.cos(this.orbitAngle) * 35,
          y: this.y + Math.sin(this.orbitAngle) * 35,
          angle: angle,
          speed: 600,
          damage: damage,
          penetration: 2,
          radius: 5,
          color: '#ff3366',
          critChance: this.critChance,
          critMultiplier: this.critMultiplier
        }));
        SoundSystem.playLaser();
      }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Iframes flashing
    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Outer Neon Glow Ring
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.charConf.color;
    ctx.strokeStyle = this.charConf.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Body Fill
    ctx.fillStyle = '#0a0d18';
    ctx.fill();

    // Direction Cannon
    ctx.rotate(this.angle);
    ctx.fillStyle = this.charConf.color;
    ctx.fillRect(8, -4, 14, 8);

    // Core Icon / Symbol
    ctx.rotate(-this.angle);
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.charConf.icon, 0, 0);

    ctx.restore();

    // Draw Orbiting Shields if equipped
    if (this.weapons['orbital_shield']) {
      const lvl = this.weapons['orbital_shield'];
      const lvlConf = CONFIG.WEAPONS.orbital_shield.levels[lvl - 1] || {};
      const bladeCount = lvlConf.count || CONFIG.WEAPONS.orbital_shield.baseCount;
      const orbitRad = CONFIG.WEAPONS.orbital_shield.orbitRadius * (lvlConf.radiusMult || 1.0);

      for (let i = 0; i < bladeCount; i++) {
        const bladeAngle = this.orbitAngle + (i * (Math.PI * 2 / bladeCount));
        const bx = this.x + Math.cos(bladeAngle) * orbitRad;
        const by = this.y + Math.sin(bladeAngle) * orbitRad;

        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#00ff66';
        ctx.fillStyle = '#00ff66';
        ctx.beginPath();
        ctx.arc(bx, by, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }
}

class Enemy {
  constructor(typeKey, x, y) {
    const conf = CONFIG.ENEMIES[typeKey] || CONFIG.ENEMIES.drone;
    this.conf = conf;
    this.typeKey = typeKey;
    this.x = x;
    this.y = y;
    this.radius = conf.radius;
    this.hp = conf.hp;
    this.maxHp = conf.hp;
    this.speed = conf.speed;
    this.damage = conf.damage;
    this.xpValue = conf.xp;
    this.color = conf.color;
    this.isBoss = conf.isBoss || false;
    this.flashTimer = 0;
    this.isDead = false;
  }

  takeDamage(amount, engine, critChance = 0, critMult = 1.5) {
    if (this.isDead) return false;
    let finalDamage = amount;
    let isCrit = false;
    if (Math.random() < critChance) {
      finalDamage = Math.floor(amount * critMult);
      isCrit = true;
    }

    this.hp -= finalDamage;
    this.flashTimer = 0.12;

    // Floating text
    engine.addCombatText(this.x, this.y, finalDamage, isCrit);

    if (this.hp <= 0) {
      this.isDead = true;
      this.die(engine);
      return true;
    }
    return false;
  }

  die(engine) {
    engine.player.kills++;
    SoundSystem.playExplosion(this.isBoss);

    // Particle explosion
    engine.createExplosionParticles(this.x, this.y, this.color, this.isBoss ? 45 : 12);

    // Spawn Drops
    if (this.isBoss) {
      engine.drops.push(new DropItem('chest', this.x, this.y));
      engine.drops.push(new DropItem('heal', this.x + 20, this.y));
      engine.drops.push(new DropItem('credit', this.x - 20, this.y, 50));
    } else {
      // XP Gem
      engine.drops.push(new DropItem('xp', this.x, this.y, this.xpValue));

      // 10% Chance Cyber Credit
      const greedMultiplier = 1 + ((MetaManager.data.upgrades.greed || 0) * 0.1);
      if (Math.random() < 0.12) {
        engine.drops.push(new DropItem('credit', this.x + (Math.random() * 10 - 5), this.y + (Math.random() * 10 - 5), Math.ceil(2 * greedMultiplier)));
      }
      // 3% Chance Health Pack
      if (Math.random() < 0.03) {
        engine.drops.push(new DropItem('heal', this.x, this.y, 25));
      }
    }
  }

  update(dt, player) {
    if (this.flashTimer > 0) this.flashTimer -= dt;

    // Move toward player
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 2) {
      this.x += (dx / dist) * this.speed * dt;
      this.y += (dy / dist) * this.speed * dt;
    }

    // Touch damage to player
    if (dist < this.radius + player.radius) {
      player.takeDamage(this.damage);
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.flashTimer > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ffffff';
    } else {
      ctx.fillStyle = this.color;
      ctx.shadowBlur = this.isBoss ? 20 : 8;
      ctx.shadowColor = this.color;
    }

    ctx.beginPath();
    if (this.conf.shape === 'triangle') {
      ctx.moveTo(0, -this.radius);
      ctx.lineTo(this.radius, this.radius);
      ctx.lineTo(-this.radius, this.radius);
    } else if (this.conf.shape === 'diamond') {
      ctx.moveTo(0, -this.radius);
      ctx.lineTo(this.radius, 0);
      ctx.lineTo(0, this.radius);
      ctx.lineTo(-this.radius, 0);
    } else if (this.conf.shape === 'octagon' || this.isBoss) {
      const sides = 8;
      for (let i = 0; i < sides; i++) {
        const a = (i * Math.PI * 2) / sides;
        const px = Math.cos(a) * this.radius;
        const py = Math.sin(a) * this.radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
    } else {
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    }
    ctx.closePath();
    ctx.fill();

    // Health bar for Boss or tough enemies
    if (this.isBoss || this.hp < this.maxHp) {
      const barW = this.radius * 2.2;
      const barH = 5;
      const hpRatio = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = '#222';
      ctx.fillRect(-barW / 2, -this.radius - 12, barW, barH);
      ctx.fillStyle = this.isBoss ? '#ff0033' : '#00ff88';
      ctx.fillRect(-barW / 2, -this.radius - 12, barW * hpRatio, barH);
    }

    ctx.restore();
  }
}

class Projectile {
  constructor(opts) {
    this.type = opts.type;
    this.x = opts.x;
    this.y = opts.y;
    this.angle = opts.angle;
    this.speed = opts.speed;
    this.damage = opts.damage;
    this.penetration = opts.penetration || 1;
    this.radius = opts.radius || 6;
    this.color = opts.color || '#00ffff';
    this.critChance = opts.critChance || 0;
    this.critMultiplier = opts.critMultiplier || 1.5;
    this.lifetime = 2.0; // 2 seconds
    this.hitEnemies = new Set();
  }

  update(dt) {
    this.x += Math.cos(this.angle) * this.speed * dt;
    this.y += Math.sin(this.angle) * this.speed * dt;
    this.lifetime -= dt;
  }

  draw(ctx) {
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class DropItem {
  constructor(type, x, y, value = 1) {
    this.type = type; // 'xp', 'credit', 'heal', 'chest'
    this.x = x;
    this.y = y;
    this.value = value;
    this.radius = type === 'chest' ? 14 : 7;
    this.attracted = false;
    this.attractSpeed = 180;
  }

  update(dt, player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    // Magnetic pull
    const effectivePickup = player.pickupRadius * player.bonusPickupRadius;
    if (dist < effectivePickup || this.attracted) {
      this.attracted = true;
      this.attractSpeed += dt * 400; // accelerates towards player
      this.x += (dx / dist) * this.attractSpeed * dt;
      this.y += (dy / dist) * this.attractSpeed * dt;
    }

    // Collection collision
    if (dist < player.radius + this.radius) {
      this.collect(player);
      return true;
    }
    return false;
  }

  collect(player) {
    if (this.type === 'xp') {
      player.addXp(this.value);
    } else if (this.type === 'credit') {
      SoundSystem.playCoin();
      player.creditsEarned += this.value;
      MetaManager.addCredits(this.value);
      window.GameEngine.addCombatText(this.x, this.y, `+${this.value} ¢`, false, '#ffcc00');
    } else if (this.type === 'heal') {
      SoundSystem.playCoin();
      player.heal(this.value);
      window.GameEngine.addCombatText(this.x, this.y, `+${this.value} PV`, false, '#00ff66');
    } else if (this.type === 'chest') {
      SoundSystem.playChestOpen();
      window.GameEngine.triggerChestReward();
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.type === 'xp') {
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#00ffff';
      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'credit') {
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ffd700';
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('¢', 0, 0);
    } else if (this.type === 'heal') {
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00ff88';
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(-6, -6, 12, 12);
      ctx.fillStyle = '#000';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+', 0, 0);
    } else if (this.type === 'chest') {
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#ffaa00';
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(-12, -10, 24, 20);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-12, -10, 24, 20);
      ctx.fillStyle = '#fff';
      ctx.fillText('⭐', 0, 0);
    }

    ctx.restore();
  }
}

class Particle {
  constructor(x, y, color, vx, vy, life) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class CombatText {
  constructor(x, y, text, isCrit = false, customColor = null) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.isCrit = isCrit;
    this.color = customColor || (isCrit ? '#ff0055' : '#ffffff');
    this.life = 0.8;
    this.maxLife = 0.8;
  }

  update(dt) {
    this.y -= 35 * dt;
    this.life -= dt;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = this.isCrit ? 'bold 16px sans-serif' : '12px sans-serif';
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 6;
    ctx.shadowColor = this.color;
    ctx.textAlign = 'center';
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

window.Player = Player;
window.Enemy = Enemy;
window.Projectile = Projectile;
window.DropItem = DropItem;
window.Particle = Particle;
window.CombatText = CombatText;
