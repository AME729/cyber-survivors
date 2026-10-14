/**
 * Cyber Survivors: Monetization Engine
 * Designed for Flippa Buyers: Plug-and-play Ad SDKs & In-App Purchases
 */

class _MonetizationManager {
  constructor() {
    this.adImpressions = 0;
    this.simulatedRevenue = 0.0;
    this.eCPM = 6.50; // $6.50 eCPM average for high-engagement web games
    this.isWatchingAd = false;
    this.activeAdCallback = null;
    this.reviveUsedThisRun = false;
  }

  showRewardedAd(type, callback) {
    if (this.isWatchingAd) return;
    this.isWatchingAd = true;
    this.activeAdCallback = callback;

    // Show simulated High-Tech Cyber Ad modal
    const modal = document.getElementById('ad-modal');
    const timerElem = document.getElementById('ad-timer');
    const titleElem = document.getElementById('ad-title');
    const barElem = document.getElementById('ad-progress-bar');

    if (!modal) {
      // Fallback if modal DOM not loaded
      this.isWatchingAd = false;
      if (callback) callback(true);
      return;
    }

    titleElem.textContent = type === 'revive' ? 'RECHARGE D’URGENCE : RÉANIMATION' : 'MULTI-CRÉDITS X2 : SPONSOR PROTOCOL';
    modal.classList.remove('hidden');

    let secondsLeft = 4;
    timerElem.textContent = `${secondsLeft}s`;
    barElem.style.width = '0%';

    const interval = setInterval(() => {
      secondsLeft--;
      const progress = ((4 - secondsLeft) / 4) * 100;
      barElem.style.width = `${progress}%`;
      timerElem.textContent = `${secondsLeft}s`;

      if (secondsLeft <= 0) {
        clearInterval(interval);
        modal.classList.add('hidden');
        this.isWatchingAd = false;

        // Track stats for Flippa presentation
        this.adImpressions++;
        this.simulatedRevenue += (this.eCPM / 1000);

        if (this.activeAdCallback) {
          this.activeAdCallback(true);
          this.activeAdCallback = null;
        }
      }
    }, 1000);
  }

  triggerRevive(onReviveSuccess) {
    if (this.reviveUsedThisRun) {
      alert("Une seule réanimation par partie est autorisée.");
      return;
    }
    this.showRewardedAd('revive', (success) => {
      if (success) {
        this.reviveUsedThisRun = true;
        if (onReviveSuccess) onReviveSuccess();
      }
    });
  }

  triggerDoubleCredits(earnedCredits, onDoubleSuccess) {
    this.showRewardedAd('double', (success) => {
      if (success) {
        MetaManager.addCredits(earnedCredits);
        if (onDoubleSuccess) onDoubleSuccess(earnedCredits * 2);
      }
    });
  }

  processPurchase(packId) {
    const pack = CONFIG.MONETIZATION.storePacks.find(p => p.id === packId);
    if (!pack) return;

    // Open high-tech checkout modal
    const checkoutModal = document.getElementById('checkout-modal');
    const packNameElem = document.getElementById('checkout-pack-name');
    const packPriceElem = document.getElementById('checkout-pack-price');

    if (packNameElem) packNameElem.textContent = pack.name;
    if (packPriceElem) packPriceElem.textContent = pack.price;
    if (checkoutModal) {
      checkoutModal.classList.remove('hidden');
      window._pendingPurchasePack = pack;
    }
  }

  completeTestPayment() {
    const pack = window._pendingPurchasePack;
    if (!pack) return;

    if (pack.isVip) {
      MetaManager.data.isVip = true;
      // Unlock all characters
      CONFIG.CHARACTERS.forEach(c => {
        if (!MetaManager.data.unlockedCharacters.includes(c.id)) {
          MetaManager.data.unlockedCharacters.push(c.id);
        }
      });
      MetaManager.saveData();
      alert("FÉLICITATIONS ! Statut VIP Néon activé. Tous les héros débloqués et crédits boostés !");
    } else {
      MetaManager.addCredits(pack.credits);
      alert(`ACHAT RÉUSSI ! ${pack.credits} Crédits Cybernétiques crédités à votre compte.`);
    }

    const checkoutModal = document.getElementById('checkout-modal');
    if (checkoutModal) checkoutModal.classList.add('hidden');
    window._pendingPurchasePack = null;

    if (window.UI) {
      window.UI.updateCreditsDisplay();
      window.UI.renderShop();
      window.UI.renderArmory();
      window.UI.renderCharacterSelect();
    }
  }

  getValuationReport() {
    return {
      impressions: this.adImpressions,
      estimatedECPM: `$${this.eCPM.toFixed(2)}`,
      simulatedAdRevenue: `$${this.simulatedRevenue.toFixed(3)}`,
      arpuEstimate: "$0.45 - $1.20 / joueur actif"
    };
  }
}

const MonetizationManager = new _MonetizationManager();
window.MonetizationManager = MonetizationManager;
