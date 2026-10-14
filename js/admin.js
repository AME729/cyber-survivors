/**
 * Cyber Survivors: Flippa Admin & Valuation Dashboard
 * Empowers buyers with zero-code management of ads, economy and gameplay testing
 */

class _AdminDashboard {
  constructor() {
    this.isOpen = false;
  }

  toggle() {
    const modal = document.getElementById('admin-modal');
    if (!modal) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.refreshMetrics();
      modal.classList.remove('hidden');
    } else {
      modal.classList.add('hidden');
    }
  }

  refreshMetrics() {
    const metrics = MonetizationManager.getValuationReport();
    const impressionsElem = document.getElementById('admin-impressions');
    const revenueElem = document.getElementById('admin-revenue');
    const ecpmElem = document.getElementById('admin-ecpm');
    const gamesElem = document.getElementById('admin-games-played');
    const creditsElem = document.getElementById('admin-current-credits');

    if (impressionsElem) impressionsElem.textContent = metrics.impressions;
    if (revenueElem) revenueElem.textContent = metrics.simulatedAdRevenue;
    if (ecpmElem) ecpmElem.textContent = metrics.estimatedECPM;
    if (gamesElem) gamesElem.textContent = MetaManager.data.gamesPlayed;
    if (creditsElem) creditsElem.textContent = MetaManager.data.credits;
  }

  showToast(msg) {
    let toast = document.getElementById('admin-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'admin-toast';
      toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(0,255,255,0.95);color:#000;font-weight:800;padding:10px 20px;border-radius:20px;box-shadow:0 0 20px #00ffff;z-index:9999;transition:opacity 0.3s;';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => { if (toast) toast.style.opacity = '0'; }, 2200);
  }

  addCheatCredits(amount = 5000) {
    MetaManager.addCredits(amount);
    this.refreshMetrics();
    if (window.UI) {
      window.UI.updateCreditsDisplay();
      window.UI.renderArmory();
      window.UI.renderCharacterSelect();
    }
    this.showToast(`+${amount} Crédits ajoutés pour tester.`);
  }

  toggleGodMode() {
    GameEngine.godMode = !GameEngine.godMode;
    this.showToast(`Mode Invincible : ${GameEngine.godMode ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
  }

  spawnBossNow() {
    if (!GameEngine.isRunning) {
      this.showToast("Lancez une partie d'abord pour faire apparaître le Boss !");
      return;
    }
    GameEngine.spawnEnemyAtEdge('boss_mech');
    this.showToast("ALERTE : Cyber Titan Boss déployé !");
  }

  triggerLevelUpCheat() {
    if (!GameEngine.isRunning || !GameEngine.player) {
      this.showToast("Lancez une partie d'abord !");
      return;
    }
    GameEngine.triggerLevelUp();
    this.showToast("Level Up déclenché !");
  }

  resetAllData() {
    MetaManager.resetAllProgress();
    this.refreshMetrics();
    if (window.UI) {
      window.UI.updateCreditsDisplay();
      window.UI.renderArmory();
      window.UI.renderCharacterSelect();
    }
    this.showToast("Sauvegarde réinitialisée (remise à zéro).");
  }

  exportSave() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(MetaManager.data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "cyber_survivors_save.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
}

const AdminDashboard = new _AdminDashboard();
window.AdminDashboard = AdminDashboard;
