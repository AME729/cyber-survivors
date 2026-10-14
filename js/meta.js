/**
 * Cyber Survivors: Meta Progression & Persistence
 */

class _MetaManager {
  constructor() {
    this.STORAGE_KEY = 'CYBER_SURVIVORS_SAVE_V1';
    this.data = this.loadData();
  }

  getDefaultData() {
    const upgrades = {};
    Object.keys(CONFIG.ARMORY_UPGRADES).forEach(key => {
      upgrades[key] = 0;
    });

    return {
      credits: 250, // Starting bonus
      lifetimeCredits: 250,
      lifetimeKills: 0,
      bestScore: 0,
      bestTime: 0,
      gamesPlayed: 0,
      unlockedCharacters: ['ninja'],
      selectedCharacter: 'ninja',
      unlockedMaps: ['map_tokyo'],
      selectedMap: 'map_tokyo',
      upgrades: upgrades,
      isVip: false,
      lastDailyReward: 0
    };
  }

  loadData() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Merge with default in case config changed
        const defaults = this.getDefaultData();
        return {
          ...defaults,
          ...parsed,
          unlockedCharacters: parsed.unlockedCharacters || defaults.unlockedCharacters,
          unlockedMaps: parsed.unlockedMaps || defaults.unlockedMaps,
          selectedMap: parsed.selectedMap || defaults.selectedMap,
          upgrades: { ...defaults.upgrades, ...(parsed.upgrades || {}) }
        };
      }
    } catch (e) {
      console.error('Failed to load save data:', e);
    }
    return this.getDefaultData();
  }

  saveData() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save data:', e);
    }
  }

  addCredits(amount) {
    const total = Math.floor(amount * (this.data.isVip ? 1.5 : 1.0));
    this.data.credits += total;
    this.data.lifetimeCredits += total;
    this.saveData();
    return total;
  }

  spendCredits(amount) {
    if (this.data.credits >= amount) {
      this.data.credits -= amount;
      this.saveData();
      return true;
    }
    return false;
  }

  getUpgradeLevel(upgradeId) {
    return this.data.upgrades[upgradeId] || 0;
  }

  getUpgradeCost(upgradeId) {
    const conf = CONFIG.ARMORY_UPGRADES[upgradeId];
    if (!conf) return Infinity;
    const currentLvl = this.getUpgradeLevel(upgradeId);
    if (currentLvl >= conf.maxLevel) return Infinity;
    return Math.floor(conf.baseCost * Math.pow(conf.costMult, currentLvl));
  }

  purchaseUpgrade(upgradeId) {
    const cost = this.getUpgradeCost(upgradeId);
    if (this.spendCredits(cost)) {
      this.data.upgrades[upgradeId] = (this.data.upgrades[upgradeId] || 0) + 1;
      this.saveData();
      return true;
    }
    return false;
  }

  unlockCharacter(charId, cost) {
    if (this.data.unlockedCharacters.includes(charId)) return true;
    if (this.spendCredits(cost)) {
      this.data.unlockedCharacters.push(charId);
      this.saveData();
      return true;
    }
    return false;
  }

  unlockMap(mapId, cost) {
    if (this.data.unlockedMaps.includes(mapId)) return true;
    if (this.spendCredits(cost)) {
      this.data.unlockedMaps.push(mapId);
      this.saveData();
      return true;
    }
    return false;
  }

  selectMap(mapId) {
    if (this.data.unlockedMaps.includes(mapId)) {
      this.data.selectedMap = mapId;
      this.saveData();
      return true;
    }
    return false;
  }

  claimDailyReward() {
    const now = Date.now();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    if (now - this.data.lastDailyReward >= TWENTY_FOUR_HOURS || this.data.lastDailyReward === 0) {
      const reward = CONFIG.MONETIZATION.dailyRewardCredits;
      this.addCredits(reward);
      this.data.lastDailyReward = now;
      this.saveData();
      return { success: true, reward };
    }
    const remainingMs = TWENTY_FOUR_HOURS - (now - this.data.lastDailyReward);
    const hours = Math.ceil(remainingMs / (1000 * 60 * 60));
    return { success: false, remainingHours: hours };
  }

  recordGameEnd(score, kills, timeSeconds) {
    this.data.gamesPlayed++;
    this.data.lifetimeKills += kills;
    if (score > this.data.bestScore) this.data.bestScore = score;
    if (timeSeconds > this.data.bestTime) this.data.bestTime = timeSeconds;
    this.saveData();
  }

  resetAllProgress() {
    this.data = this.getDefaultData();
    this.saveData();
  }
}

const MetaManager = new _MetaManager();
window.MetaManager = MetaManager;
