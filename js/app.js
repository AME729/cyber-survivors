/**
 * Cyber Survivors: UI State Machine & App Orchestrator
 */

class _AppUI {
  constructor() {
    this.currentScreen = 'menu';
    this.selectedCharId = 'ninja';
  }

  init() {
    this.updateCreditsDisplay();
    this.setupNavigation();
    this.renderCharacterSelect();
    this.renderMaps();
    this.renderArmory();
    this.renderShop();
    this.loadLeaderboard();
    this.updateMenuSelectionSummary();

    // Check Daily reward notification silently
    const dailyStatus = MetaManager.claimDailyReward();
    if (dailyStatus.success) {
      this.updateCreditsDisplay();
      this.renderArmory();
    }
  }

  switchScreen(screenName) {
    const screens = ['screen-menu', 'screen-chars', 'screen-maps', 'screen-armory', 'screen-shop', 'screen-leaderboard', 'screen-game'];
    screens.forEach(s => {
      const el = document.getElementById(s);
      if (el) el.classList.add('hidden');
    });

    const target = document.getElementById(`screen-${screenName}`);
    if (target) target.classList.remove('hidden');

    // Hide top navigation and mobile bottom nav during active game
    const topNav = document.querySelector('.top-nav');
    if (topNav) {
      topNav.style.display = (screenName === 'game') ? 'none' : 'flex';
    }

    const mobNav = document.getElementById('mobile-bottom-nav');
    if (mobNav) {
      mobNav.style.display = (screenName === 'game') ? 'none' : 'flex';
    }

    // Update active state on mobile nav buttons
    document.querySelectorAll('.mob-nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-screen') === screenName);
    });

    this.currentScreen = screenName;
    this.updateCreditsDisplay();
    this.updateMenuSelectionSummary();
  }

  setupNavigation() {
    // Mobile Bottom Nav Buttons
    document.querySelectorAll('.mob-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetScreen = btn.getAttribute('data-screen');
        if (targetScreen === 'chars') this.renderCharacterSelect();
        if (targetScreen === 'maps') this.renderMaps();
        if (targetScreen === 'armory') this.renderArmory();
        if (targetScreen === 'shop') this.renderShop();
        if (targetScreen === 'leaderboard') this.loadLeaderboard();
        this.switchScreen(targetScreen);
      });
    });

    // Top Bar Buttons
    document.getElementById('btn-nav-menu')?.addEventListener('click', () => this.switchScreen('menu'));
    document.getElementById('btn-nav-chars')?.addEventListener('click', () => {
      this.renderCharacterSelect();
      this.switchScreen('chars');
    });
    document.getElementById('btn-nav-maps')?.addEventListener('click', () => {
      this.renderMaps();
      this.switchScreen('maps');
    });
    document.getElementById('btn-nav-armory')?.addEventListener('click', () => {
      this.renderArmory();
      this.switchScreen('armory');
    });
    document.getElementById('btn-nav-shop')?.addEventListener('click', () => {
      this.renderShop();
      this.switchScreen('shop');
    });
    document.getElementById('btn-nav-leaderboard')?.addEventListener('click', () => {
      this.loadLeaderboard();
      this.switchScreen('leaderboard');
    });

    // Menu Hero & Map Selection Quick Pills
    document.getElementById('menu-selected-hero-pill')?.addEventListener('click', () => {
      this.renderCharacterSelect();
      this.switchScreen('chars');
    });
    document.getElementById('menu-selected-map-pill')?.addEventListener('click', () => {
      this.renderMaps();
      this.switchScreen('maps');
    });

    // HUD Zoom Toggle Button
    document.getElementById('btn-hud-zoom')?.addEventListener('click', () => {
      GameEngine.cycleZoom();
    });

    // Start Game from Menu
    document.getElementById('btn-play-game')?.addEventListener('click', () => {
      this.startGame();
    });

    // Audio Mute Button
    document.getElementById('btn-toggle-sound')?.addEventListener('click', () => {
      const muted = SoundSystem.toggleMute();
      const btn = document.getElementById('btn-toggle-sound');
      if (btn) btn.textContent = muted ? '🔇 MUET' : '🔊 SON';
    });

    // Admin Panel Button
    document.getElementById('btn-open-admin')?.addEventListener('click', () => {
      AdminDashboard.toggle();
    });
    document.getElementById('btn-close-admin')?.addEventListener('click', () => {
      AdminDashboard.toggle();
    });

    // HUD Pause Button
    document.getElementById('btn-hud-pause')?.addEventListener('click', () => {
      this.togglePause();
    });

    // Pause & Resume Modals
    document.getElementById('btn-resume-game')?.addEventListener('click', () => {
      this.togglePause();
    });
    document.getElementById('btn-quit-to-menu')?.addEventListener('click', () => {
      GameEngine.isRunning = false;
      GameEngine.isPaused = false;
      SoundSystem.stopMusic();
      document.getElementById('modal-pause')?.classList.add('hidden');
      this.switchScreen('menu');
    });

    // Rewarded Ad Buttons in Game Over
    document.getElementById('btn-ad-revive')?.addEventListener('click', () => {
      MonetizationManager.triggerRevive(() => {
        document.getElementById('modal-gameover')?.classList.add('hidden');
        GameEngine.revivePlayer();
      });
    });

    document.getElementById('btn-ad-double')?.addEventListener('click', () => {
      const earned = GameEngine.player ? GameEngine.player.creditsEarned : 0;
      MonetizationManager.triggerDoubleCredits(earned, (total) => {
        const doubleBtn = document.getElementById('btn-ad-double');
        if (doubleBtn) {
          doubleBtn.disabled = true;
          doubleBtn.textContent = `CRÉDITS DOUBLÉS (+${total} ¢) !`;
        }
        this.updateCreditsDisplay();
      });
    });

    // Submit High Score
    document.getElementById('btn-submit-score')?.addEventListener('click', () => {
      this.submitCurrentScore();
    });

    document.getElementById('btn-restart-game')?.addEventListener('click', () => {
      document.getElementById('modal-gameover')?.classList.add('hidden');
      document.getElementById('modal-victory')?.classList.add('hidden');
      this.startGame();
    });

    document.getElementById('btn-gameover-menu')?.addEventListener('click', () => {
      document.getElementById('modal-gameover')?.classList.add('hidden');
      document.getElementById('modal-victory')?.classList.add('hidden');
      this.switchScreen('menu');
    });

    document.getElementById('btn-victory-menu')?.addEventListener('click', () => {
      document.getElementById('modal-victory')?.classList.add('hidden');
      this.switchScreen('menu');
    });

    // Test Checkout modal close
    document.getElementById('btn-cancel-checkout')?.addEventListener('click', () => {
      document.getElementById('checkout-modal')?.classList.add('hidden');
    });
    document.getElementById('btn-confirm-checkout')?.addEventListener('click', () => {
      MonetizationManager.completeTestPayment();
    });
  }

  updateCreditsDisplay() {
    const credElements = document.querySelectorAll('.cyber-credits-val');
    credElements.forEach(el => {
      el.textContent = `${MetaManager.data.credits.toLocaleString()} ¢`;
    });
  }

  renderCharacterSelect() {
    const container = document.getElementById('char-grid-container');
    if (!container) return;
    container.innerHTML = '';

    CONFIG.CHARACTERS.forEach(char => {
      const isUnlocked = MetaManager.data.unlockedCharacters.includes(char.id);
      const isSelected = this.selectedCharId === char.id;
      const startWpn = CONFIG.WEAPONS[char.startingWeapon] || {};

      // Calculate relative stat bars
      const speedPct = Math.min(100, (char.bonus.speed || 1.0) * 80);
      const hpPct = Math.min(100, ((char.bonus.maxHp || 100) / 160) * 100);
      const dmgPct = Math.min(100, (char.bonus.damageMult || 1.0) * 85);
      const critPct = Math.min(100, ((char.bonus.critChance || 0.05) / 0.15) * 100);

      const card = document.createElement('div');
      card.className = `char-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;
      card.innerHTML = `
        <div class="char-icon" style="border-color:${char.color}">${char.icon}</div>
        <div class="char-title">${char.name}</div>
        <div class="char-subtitle">${char.title}</div>
        <div class="char-weapon-badge">${startWpn.icon || '🔫'} Arme : <b>${startWpn.name || 'Arme de base'}</b></div>
        
        <div style="width: 100%; margin: 8px 0 14px 0;">
          <div class="char-stat-row">
            <span class="char-stat-label">Vitesse</span>
            <div class="char-stat-bar-box"><div class="char-stat-bar-fill" style="width:${speedPct}%;"></div></div>
          </div>
          <div class="char-stat-row">
            <span class="char-stat-label">Points de Vie</span>
            <div class="char-stat-bar-box"><div class="char-stat-bar-fill" style="width:${hpPct}%; background:#ff0055;"></div></div>
          </div>
          <div class="char-stat-row">
            <span class="char-stat-label">Puissance</span>
            <div class="char-stat-bar-box"><div class="char-stat-bar-fill" style="width:${dmgPct}%; background:#ffd700;"></div></div>
          </div>
          <div class="char-stat-row">
            <span class="char-stat-label">Critique</span>
            <div class="char-stat-bar-box"><div class="char-stat-bar-fill" style="width:${critPct}%; background:#00ffaa;"></div></div>
          </div>
        </div>

        <div class="char-desc">${char.description}</div>
        <div class="char-action-box">
          ${isUnlocked
            ? `<button class="btn btn-primary btn-select-char" data-id="${char.id}">${isSelected ? 'SÉLECTIONNÉ ✓' : 'CHOISIR'}</button>`
            : `<button class="btn btn-gold btn-unlock-char" data-id="${char.id}" data-cost="${char.price}">DÉBLOQUER (${char.price} ¢)</button>`
          }
        </div>
      `;

      card.querySelector('.btn-select-char')?.addEventListener('click', () => {
        this.selectedCharId = char.id;
        MetaManager.data.selectedCharacter = char.id;
        MetaManager.saveData();
        this.renderCharacterSelect();
        this.updateMenuSelectionSummary();
        showToast(`Héros sélectionné : ${char.name}`, 'info');
      });

      card.querySelector('.btn-unlock-char')?.addEventListener('click', () => {
        if (MetaManager.unlockCharacter(char.id, char.price)) {
          this.selectedCharId = char.id;
          MetaManager.data.selectedCharacter = char.id;
          MetaManager.saveData();
          this.updateCreditsDisplay();
          this.renderCharacterSelect();
          this.updateMenuSelectionSummary();
          showToast(`Héros ${char.name} débloqué avec succès !`, 'success');
        } else {
          showToast(`Crédits insuffisants. Il vous manque ${(char.price - MetaManager.data.credits).toLocaleString()} ¢.`, 'error');
        }
      });

      container.appendChild(card);
    });
  }

  updateMenuSelectionSummary() {
    const curHeroId = MetaManager.data.selectedCharacter || 'ninja';
    const curHero = CONFIG.CHARACTERS.find(c => c.id === curHeroId) || CONFIG.CHARACTERS[0];
    const heroEl = document.getElementById('summary-hero-name');
    if (heroEl) heroEl.textContent = `${curHero.name} ${curHero.icon}`;

    const curMapId = MetaManager.data.selectedMap || 'map_tokyo';
    const curMap = CONFIG.MAPS.find(m => m.id === curMapId) || CONFIG.MAPS[0];
    const mapEl = document.getElementById('summary-map-name');
    if (mapEl) mapEl.textContent = `${curMap.name} ${curMap.icon}`;
  }

  renderMaps() {
    const container = document.getElementById('maps-grid-container');
    if (!container) return;
    container.innerHTML = '';

    const selectedMapId = MetaManager.data.selectedMap || 'map_tokyo';

    CONFIG.MAPS.forEach(map => {
      const isUnlocked = (MetaManager.data.unlockedMaps || []).includes(map.id) || map.price === 0;
      const isSelected = selectedMapId === map.id;

      const card = document.createElement('div');
      card.className = `map-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;
      card.style.borderColor = isSelected ? (map.borderColor || 'var(--primary)') : 'var(--bg-card-border)';

      card.innerHTML = `
        <div class="map-header-banner" style="background: linear-gradient(135deg, ${map.bgColor}, #121828); border-bottom: 2px solid ${map.borderColor};">
          <div class="map-icon">${map.icon}</div>
          <div class="map-badge" style="border-color:${map.borderColor}; color:${map.borderColor};">${map.subtitle}</div>
        </div>
        <div class="map-body">
          <div class="map-title" style="color:${map.borderColor}">${map.name}</div>
          <div class="map-boss-row">
            <span class="boss-label">☠️ Boss Titan :</span>
            <span class="boss-name" style="color:${map.bossColor || '#ff0055'}">${map.bossName}</span>
          </div>
          <div class="map-desc">${map.description}</div>
          
          <div class="map-action-box">
            ${isUnlocked
              ? `<button class="btn btn-primary btn-select-map" data-id="${map.id}" style="${isSelected ? `background:${map.borderColor}; border-color:${map.borderColor}; color:#000; font-weight:800;` : ''}">${isSelected ? 'SÉLECTIONNÉ ✓' : 'SÉLECTIONNER'}</button>`
              : `<button class="btn btn-gold btn-unlock-map" data-id="${map.id}" data-cost="${map.price}">DÉBLOQUER (${map.price.toLocaleString()} ¢)</button>`
            }
          </div>
        </div>
      `;

      card.querySelector('.btn-select-map')?.addEventListener('click', () => {
        MetaManager.selectMap(map.id);
        this.renderMaps();
        this.updateMenuSelectionSummary();
        showToast(`Secteur activé : ${map.name}`, 'info');
      });

      card.querySelector('.btn-unlock-map')?.addEventListener('click', () => {
        if (MetaManager.unlockMap(map.id, map.price)) {
          MetaManager.selectMap(map.id);
          this.renderMaps();
          this.updateCreditsDisplay();
          this.updateMenuSelectionSummary();
          showToast(`Carte ${map.name} débloquée avec succès !`, 'success');
        } else {
          showToast(`Crédits insuffisants. Il vous manque ${(map.price - MetaManager.data.credits).toLocaleString()} ¢.`, 'error');
        }
      });

      container.appendChild(card);
    });
  }

  renderArmory() {
    const container = document.getElementById('armory-grid-container');
    if (!container) return;
    container.innerHTML = '';

    Object.keys(CONFIG.ARMORY_UPGRADES).forEach(uId => {
      const conf = CONFIG.ARMORY_UPGRADES[uId];
      const curLvl = MetaManager.getUpgradeLevel(uId);
      const cost = MetaManager.getUpgradeCost(uId);
      const isMax = curLvl >= conf.maxLevel;

      const item = document.createElement('div');
      item.className = 'armory-item-card';
      item.innerHTML = `
        <div class="armory-header">
          <span class="armory-icon">${conf.icon}</span>
          <div>
            <div class="armory-name">${conf.name}</div>
            <div class="armory-desc">${conf.desc}</div>
          </div>
        </div>
        <div class="armory-level-bar">
          Niveau : ${curLvl} / ${conf.maxLevel}
        </div>
        <div class="armory-action">
          ${isMax
            ? `<button class="btn btn-disabled" disabled>NIVEAU MAX</button>`
            : `<button class="btn btn-primary btn-buy-upgrade" data-id="${uId}">AMÉLIORER (${cost.toLocaleString()} ¢)</button>`
          }
        </div>
      `;

      item.querySelector('.btn-buy-upgrade')?.addEventListener('click', () => {
        if (MetaManager.purchaseUpgrade(uId)) {
          SoundSystem.playCoin();
          this.updateCreditsDisplay();
          this.renderArmory();
        } else {
          alert("Crédits insuffisants pour cette amélioration.");
        }
      });

      container.appendChild(item);
    });
  }

  renderShop() {
    const container = document.getElementById('shop-grid-container');
    if (!container) return;
    container.innerHTML = '';

    CONFIG.MONETIZATION.storePacks.forEach(pack => {
      const card = document.createElement('div');
      card.className = `shop-card ${pack.popular ? 'popular' : ''} ${pack.isVip ? 'vip-pack' : ''}`;
      card.innerHTML = `
        ${pack.popular ? '<div class="badge-popular">LE PLUS POPULAIRE</div>' : ''}
        ${pack.isVip ? '<div class="badge-vip">OFFRE EXCLUSIVE VIP</div>' : ''}
        <div class="shop-pack-icon">${pack.isVip ? '👑' : '💎'}</div>
        <div class="shop-pack-name">${pack.name}</div>
        <div class="shop-pack-value">${pack.credits > 0 ? `+${pack.credits.toLocaleString()} Crédits` : 'Déblocage Total + x2 XP'}</div>
        <div class="shop-pack-price">${pack.price}</div>
        <button class="btn btn-gold btn-purchase-pack" data-id="${pack.id}">ACHETER MAINTENANT</button>
      `;

      card.querySelector('.btn-purchase-pack').addEventListener('click', () => {
        MonetizationManager.processPurchase(pack.id);
      });

      container.appendChild(card);
    });
  }

  async loadLeaderboard() {
    const listElem = document.getElementById('leaderboard-list');
    if (!listElem) return;
    listElem.innerHTML = '<div style="text-align:center; padding: 20px;">Chargement des scores mondiaux...</div>';

    let data = [];
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const json = await res.json();
        data = json.leaderboard;
      }
    } catch (e) {
      console.warn("Backend API offline, displaying fallback scores:", e);
    }

    if (!data || data.length === 0) {
      data = [
        { name: 'Kael_99', score: 48500, kills: 1420, timeSurvived: '15:00', character: 'Cyber Ninja' },
        { name: 'NovaViper', score: 39200, kills: 1150, timeSurvived: '13:42', character: 'Netrunner' },
        { name: 'TitanX', score: 32100, kills: 980, timeSurvived: '11:15', character: 'Heavy Mech' }
      ];
    }

    listElem.innerHTML = '';
    data.forEach((entry, idx) => {
      const row = document.createElement('div');
      row.className = `leaderboard-row ${idx === 0 ? 'rank-gold' : idx === 1 ? 'rank-silver' : idx === 2 ? 'rank-bronze' : ''}`;
      row.innerHTML = `
        <div class="lb-rank">#${idx + 1}</div>
        <div class="lb-name">${entry.name} <span class="lb-char">(${entry.character || 'Héros'})</span></div>
        <div class="lb-kills">${entry.kills} Frags</div>
        <div class="lb-time">${entry.timeSurvived}</div>
        <div class="lb-score">${entry.score.toLocaleString()} pts</div>
      `;
      listElem.appendChild(row);
    });
  }

  async submitCurrentScore() {
    const nameInput = document.getElementById('player-name-input');
    const name = (nameInput?.value.trim()) || 'CyberRunner';
    const score = Math.floor(GameEngine.gameTime * 25 + (GameEngine.player?.kills || 0) * 10);
    const kills = GameEngine.player?.kills || 0;
    const timeFormatted = this.formatTime(GameEngine.gameTime);
    const character = GameEngine.player?.charConf.name || 'Cyber Ninja';

    try {
      await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, score, kills, timeSurvived: timeFormatted, character })
      });
      showToast("Score publié avec succès dans le classement mondial !", "success");
      const submitBtn = document.getElementById('btn-submit-score');
      if (submitBtn) submitBtn.disabled = true;
    } catch (e) {
      showToast("Score enregistré localement !", "info");
    }
  }

  startGame() {
    this.selectedCharId = MetaManager.data.selectedCharacter || this.selectedCharId || 'ninja';
    this.switchScreen('game');
    GameEngine.start(this.selectedCharId);
  }

  togglePause() {
    if (!GameEngine.isRunning) return;
    GameEngine.isPaused = !GameEngine.isPaused;
    const pauseModal = document.getElementById('modal-pause');
    if (GameEngine.isPaused) {
      pauseModal?.classList.remove('hidden');
    } else {
      pauseModal?.classList.add('hidden');
    }
  }

  updateInGameHud() {
    if (!GameEngine.player) return;
    const p = GameEngine.player;

    // HP Bar
    const hpRatio = Math.max(0, p.hp / p.maxHp) * 100;
    const hpBar = document.getElementById('hud-hp-bar');
    const hpText = document.getElementById('hud-hp-text');
    if (hpBar) hpBar.style.width = `${hpRatio}%`;
    if (hpText) hpText.textContent = `${Math.ceil(p.hp)} / ${Math.ceil(p.maxHp)} PV`;

    // XP Bar
    const xpRatio = Math.min(100, (p.xp / p.xpNext) * 100);
    const xpBar = document.getElementById('hud-xp-bar');
    const lvlText = document.getElementById('hud-level-text');
    if (xpBar) xpBar.style.width = `${xpRatio}%`;
    if (lvlText) lvlText.textContent = `NIV ${p.level}`;

    // Timer & Kills
    const timerElem = document.getElementById('hud-timer');
    const killsElem = document.getElementById('hud-kills');
    const creditsElem = document.getElementById('hud-credits');
    if (timerElem) timerElem.textContent = this.formatTime(GameEngine.gameTime);
    if (killsElem) killsElem.textContent = `${p.kills} ☠️`;
    if (creditsElem) creditsElem.textContent = `${p.creditsEarned} ¢`;

    // Weapons Icons list
    const weaponsList = document.getElementById('hud-weapons-list');
    if (weaponsList) {
      weaponsList.innerHTML = '';
      Object.keys(p.weapons).forEach(wId => {
        const conf = CONFIG.WEAPONS[wId];
        const lvl = p.weapons[wId];
        const badge = document.createElement('div');
        badge.className = 'hud-item-badge';
        badge.title = `${conf.name} (Niv ${lvl})`;
        badge.innerHTML = `${conf.icon} <span class="badge-lvl">${lvl}</span>`;
        weaponsList.appendChild(badge);
      });
      Object.keys(p.passives).forEach(passId => {
        const conf = CONFIG.PASSIVES[passId];
        const lvl = p.passives[passId];
        const badge = document.createElement('div');
        badge.className = 'hud-item-badge passive';
        badge.title = `${conf.name} (Niv ${lvl})`;
        badge.innerHTML = `${conf.icon} <span class="badge-lvl">${lvl}</span>`;
        weaponsList.appendChild(badge);
      });
    }
  }

  showLevelUpModal() {
    const modal = document.getElementById('modal-levelup');
    const container = document.getElementById('levelup-cards-container');
    if (!modal || !container) return;

    container.innerHTML = '';
    const choices = this.generateUpgradeChoices();

    choices.forEach(choice => {
      // Calculate card rarity based on upgrade tier
      const rarity = choice.nextLevel >= 5 ? 'epic' : choice.nextLevel >= 3 ? 'rare' : 'common';
      const rarityLabel = rarity === 'epic' ? 'ÉPIQUE' : rarity === 'rare' ? 'RARE' : 'COMMUN';

      const card = document.createElement('div');
      card.className = `upgrade-card rarity-${rarity}`;
      card.innerHTML = `
        <div class="upgrade-icon" style="color:${choice.color}">${choice.icon}</div>
        <div style="flex-grow:1;">
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <div class="upgrade-name">${choice.name}</div>
            <span class="rarity-tag ${rarity}">${rarityLabel}</span>
          </div>
          <div class="upgrade-type">${choice.isWeapon ? 'ARME CYBERNÉTIQUE' : 'MODULE PASSIF'} • NIVEAU ${choice.nextLevel}</div>
          <div class="upgrade-desc">${choice.description}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        if (choice.isWeapon) {
          GameEngine.player.addWeapon(choice.id);
        } else {
          GameEngine.player.addPassive(choice.id);
        }
        modal.classList.add('hidden');
        GameEngine.isPaused = false;
      });

      container.appendChild(card);
    });

    modal.classList.remove('hidden');
  }

  generateUpgradeChoices() {
    const player = GameEngine.player;
    const candidates = [];

    // Weapons
    Object.keys(CONFIG.WEAPONS).forEach(wId => {
      const conf = CONFIG.WEAPONS[wId];
      const curLvl = player.weapons[wId] || 0;
      if (curLvl < conf.maxLevel) {
        const nextLvl = curLvl + 1;
        const lvlInfo = conf.levels[nextLvl - 1];
        candidates.push({
          id: wId,
          name: conf.name,
          icon: conf.icon,
          color: conf.color,
          isWeapon: true,
          nextLevel: nextLvl,
          description: lvlInfo.desc || conf.description
        });
      }
    });

    // Passives
    Object.keys(CONFIG.PASSIVES).forEach(passId => {
      const conf = CONFIG.PASSIVES[passId];
      const curLvl = player.passives[passId] || 0;
      if (curLvl < conf.maxLevel) {
        candidates.push({
          id: passId,
          name: conf.name,
          icon: conf.icon,
          color: conf.color,
          isWeapon: false,
          nextLevel: curLvl + 1,
          description: conf.description
        });
      }
    });

    // Shuffle and pick 3
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    return candidates.slice(0, 3);
  }

  showChestRewardModal() {
    const modal = document.getElementById('modal-chest');
    if (!modal) return;
    const creditsWon = 50 + Math.floor(Math.random() * 100);
    MetaManager.addCredits(creditsWon);
    if (GameEngine.player) GameEngine.player.heal(30);

    const descElem = document.getElementById('chest-reward-desc');
    if (descElem) {
      descElem.textContent = `Vous avez obtenu +${creditsWon} Crédits Cybernétiques et +30 PV !`;
    }

    modal.classList.remove('hidden');
    document.getElementById('btn-close-chest')?.addEventListener('click', () => {
      modal.classList.add('hidden');
      GameEngine.isPaused = false;
    }, { once: true });
  }

  showGameOverScreen() {
    const modal = document.getElementById('modal-gameover');
    if (!modal) return;

    const p = GameEngine.player;
    const timeFormatted = this.formatTime(GameEngine.gameTime);
    const score = Math.floor(GameEngine.gameTime * 25 + (p ? p.kills : 0) * 10);

    document.getElementById('go-time').textContent = timeFormatted;
    document.getElementById('go-kills').textContent = p ? p.kills : 0;
    document.getElementById('go-credits').textContent = p ? p.creditsEarned : 0;
    document.getElementById('go-score').textContent = score.toLocaleString();

    const reviveBtn = document.getElementById('btn-ad-revive');
    if (reviveBtn) {
      reviveBtn.disabled = MonetizationManager.reviveUsedThisRun;
      reviveBtn.textContent = MonetizationManager.reviveUsedThisRun
        ? 'RÉANIMATION DÉJÀ UTILISÉE'
        : '⚡ RÉANIMER LE JOUEUR (REGARDER PUB)';
    }

    const doubleBtn = document.getElementById('btn-ad-double');
    if (doubleBtn) {
      doubleBtn.disabled = false;
      doubleBtn.textContent = '💰 DOUBLER MES CRÉDITS (PUB)';
    }

    const submitBtn = document.getElementById('btn-submit-score');
    if (submitBtn) submitBtn.disabled = false;

    modal.classList.remove('hidden');
  }

  showVictoryScreen() {
    const modal = document.getElementById('modal-victory');
    if (!modal) return;
    const p = GameEngine.player;
    const score = Math.floor(GameEngine.gameTime * 30 + (p ? p.kills : 0) * 15 + 5000);

    document.getElementById('vic-kills').textContent = p ? p.kills : 0;
    document.getElementById('vic-credits').textContent = p ? p.creditsEarned : 0;
    document.getElementById('vic-score').textContent = score.toLocaleString();

    modal.classList.remove('hidden');
  }

  formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
}

const UI = new _AppUI();
window.UI = UI;
window.addEventListener('DOMContentLoaded', () => {
  GameEngine.init('game-canvas');
  window.UI.init();
});
