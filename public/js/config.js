/**
 * Cyber Survivors: Neon Protocol
 * Game & Monetization Configuration
 */

const CONFIG = {
  // World & Arena
  WORLD_WIDTH: 3200,
  WORLD_HEIGHT: 3200,
  GRID_CELL_SIZE: 150,

  // Base Player Defaults
  BASE_PLAYER: {
    speed: 210,
    maxHp: 100,
    pickupRadius: 90,
    damageMult: 1.0,
    cooldownReduction: 0,
    critChance: 0.05,
    critMultiplier: 1.5,
    armor: 0,
    regenRate: 0.2 // hp/sec
  },

  // Playable Characters
  CHARACTERS: [
    {
      id: 'ninja',
      name: 'Cyber Ninja (Kael)',
      title: 'Fast, Agile & Lethal',
      icon: '⚡',
      color: '#00ffff',
      unlocked: true,
      price: 0,
      startingWeapon: 'plasma_blaster',
      bonus: { speed: 1.15, critChance: 0.10, maxHp: 90 },
      description: 'Déplacement rapide avec haute chance de coup critique. Arme de départ : Plasma Blaster.'
    },
    {
      id: 'mech',
      name: 'Heavy Mech (Titan-04)',
      title: 'Heavy Armor & Orbital Defense',
      icon: '🛡️',
      color: '#ff9900',
      unlocked: false,
      price: 1500,
      startingWeapon: 'orbital_shield',
      bonus: { maxHp: 160, armor: 3, speed: 0.85, pickupRadius: 1.2 },
      description: 'Résistance colossale et blindage renforcé. Arme de départ : Bouclier Orbital.'
    },
    {
      id: 'netrunner',
      name: 'Netrunner (Nyx)',
      title: 'Hacking & Chain Lightning',
      icon: '🔮',
      color: '#ff00ff',
      unlocked: false,
      price: 3000,
      startingWeapon: 'chain_lightning',
      bonus: { cooldownReduction: 0.15, damageMult: 1.1, pickupRadius: 1.3 },
      description: 'Spécialiste de la surcharge électrique et temps de recharge réduit. Arme de départ : Foudre en Chaîne.'
    }
  ],

  // Weapons Catalog
  WEAPONS: {
    plasma_blaster: {
      id: 'plasma_blaster',
      name: 'Plasma Blaster',
      type: 'projectile',
      icon: '🔫',
      color: '#00ffff',
      description: 'Tire des salves de plasma rapides sur les cibles les plus proches.',
      baseDamage: 22,
      baseCooldown: 0.7,
      baseSpeed: 520,
      baseCount: 1,
      penetration: 1,
      maxLevel: 5,
      levels: [
        { desc: 'Niv 1 : Active le Plasma Blaster' },
        { desc: 'Niv 2 : +1 Projectile supplémentaire', count: 2 },
        { desc: 'Niv 3 : Dégâts augmentés de +30%', damageMult: 1.3 },
        { desc: 'Niv 4 : +1 Projectile & Pénétration +1', count: 3, penetration: 2 },
        { desc: 'Niv 5 : Vitesse de tir ultra-rapide (-35% cooldown)', cooldownMult: 0.65, damageMult: 1.5 }
      ]
    },
    orbital_shield: {
      id: 'orbital_shield',
      name: 'Bouclier Orbital',
      type: 'orbit',
      icon: '🛡️',
      color: '#00ff66',
      description: 'Lames d’énergie qui orbitent autour du joueur et déchiquètent les ennemis.',
      baseDamage: 18,
      baseCooldown: 2.5,
      baseCount: 2,
      orbitRadius: 90,
      maxLevel: 5,
      levels: [
        { desc: 'Niv 1 : 2 Lames orbitales protectrices' },
        { desc: 'Niv 2 : +1 Lame orbitale (3 au total)', count: 3 },
        { desc: 'Niv 3 : Dégâts et rayon d’action augmentés', damageMult: 1.35, radiusMult: 1.2 },
        { desc: 'Niv 4 : +1 Lame orbitale (4 au total)', count: 4 },
        { desc: 'Niv 5 : Hyper-rotation constante et dégâts doublés', count: 5, damageMult: 2.0, speedMult: 1.6 }
      ]
    },
    chain_lightning: {
      id: 'chain_lightning',
      name: 'Foudre en Chaîne',
      type: 'aoe_chain',
      icon: '⚡',
      color: '#ff00ff',
      description: 'Foudroie instantanément plusieurs ennemis en créant un arc électrique.',
      baseDamage: 35,
      baseCooldown: 1.6,
      baseChainCount: 3,
      maxLevel: 5,
      levels: [
        { desc: 'Niv 1 : Électrocute jusqu’à 3 ennemis proches' },
        { desc: 'Niv 2 : Frappe 2 cibles de plus (5 cibles)', chainCount: 5 },
        { desc: 'Niv 3 : Dégâts +40%', damageMult: 1.4 },
        { desc: 'Niv 4 : Cooldown réduit de 25% et 7 cibles', chainCount: 7, cooldownMult: 0.75 },
        { desc: 'Niv 5 : Tempête cybernétique (10 cibles & critique garanti)', chainCount: 10, damageMult: 1.8 }
      ]
    },
    emp_aura: {
      id: 'emp_aura',
      name: 'Aura IEM',
      type: 'aura',
      icon: '💥',
      color: '#ffff00',
      description: 'Émet périodiquement une onde de choc IEM blessant tous les monstres autour de vous.',
      baseDamage: 25,
      baseCooldown: 2.0,
      baseRadius: 130,
      maxLevel: 5,
      levels: [
        { desc: 'Niv 1 : Décharge IEM toutes les 2 secondes' },
        { desc: 'Niv 2 : Rayon d’onde de choc +35%', radiusMult: 1.35 },
        { desc: 'Niv 3 : Dégâts +50%', damageMult: 1.5 },
        { desc: 'Niv 4 : Cooldown réduit à 1.2s', cooldownMult: 0.6 },
        { desc: 'Niv 5 : Explosion apocalyptique et repousse les ennemis', radiusMult: 1.7, damageMult: 2.2 }
      ]
    },
    drone_turret: {
      id: 'drone_turret',
      name: 'Drone d’Assaut',
      type: 'drone',
      icon: '🤖',
      color: '#ff3366',
      description: 'Un mini drone autonome qui traque et tire au laser lourd.',
      baseDamage: 40,
      baseCooldown: 1.2,
      maxLevel: 5,
      levels: [
        { desc: 'Niv 1 : Déploie 1 drone d’assaut autonome' },
        { desc: 'Niv 2 : Cadence de tir du drone +30%' },
        { desc: 'Niv 3 : Dégâts laser +50%' },
        { desc: 'Niv 4 : Déploie un 2ème drone d’assaut' },
        { desc: 'Niv 5 : Drones en mode Overclock permanent' }
      ]
    }
  },

  // Passive Items Catalog
  PASSIVES: {
    nanite_armor: {
      id: 'nanite_armor',
      name: 'Blindage Nanite',
      icon: '🦾',
      color: '#33ccff',
      description: 'Réduit les dégâts subis de 2 points par niveau.',
      maxLevel: 5,
      effect: (player, lvl) => { player.armor = (lvl * 2); }
    },
    overclock_thruster: {
      id: 'overclock_thruster',
      name: 'Propulseurs Overclockés',
      icon: '👟',
      color: '#00ffcc',
      description: 'Augmente la vitesse de course de +8% par niveau.',
      maxLevel: 5,
      effect: (player, lvl) => { player.bonusSpeed = 1 + (lvl * 0.08); }
    },
    energy_core: {
      id: 'energy_core',
      name: 'Noyau Énergétique',
      icon: '🔋',
      color: '#ffcc00',
      description: 'Augmente les dégâts de toutes les armes de +12% par niveau.',
      maxLevel: 5,
      effect: (player, lvl) => { player.bonusDamage = 1 + (lvl * 0.12); }
    },
    magnetic_field: {
      id: 'magnetic_field',
      name: 'Champ Magnétique',
      icon: '🧲',
      color: '#ff00aa',
      description: 'Augmente le rayon d’aspiration des orbes d’XP et crédits de +25% par niveau.',
      maxLevel: 5,
      effect: (player, lvl) => { player.bonusPickupRadius = 1 + (lvl * 0.25); }
    },
    neural_chip: {
      id: 'neural_chip',
      name: 'Puce Neuronale',
      icon: '🧠',
      color: '#9933ff',
      description: 'Réduit le temps de recharge de toutes les armes de -6% par niveau.',
      maxLevel: 5,
      effect: (player, lvl) => { player.bonusCooldown = 1 - (lvl * 0.06); }
    },
    biomembrane: {
      id: 'biomembrane',
      name: 'Bio-Membrane Régénératrice',
      icon: '❤️',
      color: '#ff3366',
      description: 'Régénère +1.0 PV par seconde par niveau.',
      maxLevel: 5,
      effect: (player, lvl) => { player.regenRate = 0.2 + (lvl * 1.0); }
    }
  },

  // Permanent Armory Upgrades (Purchased with Cyber Credits)
  ARMORY_UPGRADES: {
    max_hp: {
      id: 'max_hp',
      name: 'Structure Renforcée',
      icon: '❤️',
      desc: '+10 PV Max par niveau',
      baseCost: 200,
      costMult: 1.5,
      maxLevel: 10,
      valPerLevel: 10
    },
    damage: {
      id: 'damage',
      name: 'Puissance Brute',
      icon: '⚔️',
      desc: '+5% Dégâts globaux par niveau',
      baseCost: 250,
      costMult: 1.6,
      maxLevel: 10,
      valPerLevel: 0.05
    },
    speed: {
      id: 'speed',
      name: 'Câblage Moteur',
      icon: '⚡',
      desc: '+4% Vitesse de déplacement',
      baseCost: 150,
      costMult: 1.5,
      maxLevel: 10,
      valPerLevel: 0.04
    },
    magnet: {
      id: 'magnet',
      name: 'Aimant Subatomique',
      icon: '🧲',
      desc: '+15% Rayon d’aspiration',
      baseCost: 180,
      costMult: 1.4,
      maxLevel: 8,
      valPerLevel: 0.15
    },
    greed: {
      id: 'greed',
      name: 'Extraction de Données',
      icon: '💰',
      desc: '+10% Crédits cybernétiques gagnés',
      baseCost: 300,
      costMult: 1.6,
      maxLevel: 8,
      valPerLevel: 0.10
    },
    luck: {
      id: 'luck',
      name: 'Algorithme de Chance',
      icon: '🎲',
      desc: '+3% Chance de coup critique & coffres rares',
      baseCost: 350,
      costMult: 1.7,
      maxLevel: 5,
      valPerLevel: 0.03
    }
  },

  // Enemy Types
  ENEMIES: {
    drone: {
      id: 'drone',
      name: 'Neon Scout Drone',
      radius: 14,
      hp: 20,
      speed: 120,
      damage: 10,
      xp: 1,
      color: '#ff0055',
      shape: 'triangle'
    },
    swarmer: {
      id: 'swarmer',
      name: 'Cyber Swarmer',
      radius: 11,
      hp: 12,
      speed: 165,
      damage: 7,
      xp: 1,
      color: '#ff3300',
      shape: 'diamond'
    },
    brute: {
      id: 'brute',
      name: 'Cyborg Enforcer',
      radius: 24,
      hp: 110,
      speed: 75,
      damage: 22,
      xp: 8,
      color: '#9900ff',
      shape: 'hexagon'
    },
    stalker: {
      id: 'stalker',
      name: 'Laser Stalker',
      radius: 18,
      hp: 65,
      speed: 130,
      damage: 16,
      xp: 5,
      color: '#00ffaa',
      shape: 'pentagon'
    },
    boss_mech: {
      id: 'boss_mech',
      name: 'CYBER TITAN OVERLORD (BOSS)',
      radius: 46,
      hp: 1400,
      speed: 65,
      damage: 35,
      xp: 50,
      color: '#ff0033',
      shape: 'octagon',
      isBoss: true
    }
  },

  // Waves Timeline (seconds -> enemy spawn settings)
  WAVE_SCHEDULE: [
    { time: 0, types: ['drone'], spawnRate: 1.2, countCap: 30 },
    { time: 30, types: ['drone', 'swarmer'], spawnRate: 0.9, countCap: 50 },
    { time: 60, types: ['drone', 'swarmer'], spawnRate: 0.7, countCap: 75 },
    { time: 120, types: ['drone', 'swarmer', 'brute'], spawnRate: 0.55, countCap: 110 },
    { time: 180, types: ['swarmer', 'brute', 'stalker'], spawnRate: 0.45, countCap: 140 },
    { time: 300, types: ['boss_mech'], spawnRate: 0.4, countCap: 160, bossAlert: true },
    { time: 420, types: ['drone', 'stalker', 'brute'], spawnRate: 0.35, countCap: 180 },
    { time: 600, types: ['boss_mech', 'brute', 'stalker'], spawnRate: 0.3, countCap: 220, bossAlert: true }
  ],

  // Monetization Settings (Ready for Flippa Buyer Configuration)
  MONETIZATION: {
    gameDistributionAppId: 'GD_PREMIUM_CYBERSURVIVORS',
    adSensePublisherId: 'pub-XXXXXXXXXXXXX',
    reviveAdEnabled: true,
    doubleRewardsAdEnabled: true,
    dailyRewardCredits: 250,
    storePacks: [
      { id: 'pack_starter', name: 'Starter Chip Pack', credits: 1000, price: '$1.99', popular: false },
      { id: 'pack_pro', name: 'Pro Netrunner Vault', credits: 5000, price: '$4.99', popular: true },
      { id: 'pack_titan', name: 'Cyber Overlord Vault', credits: 15000, price: '$9.99', popular: false },
      { id: 'pass_vip', name: 'VIP Neon Pass (All Unlocked + Permanent 2x XP)', credits: 0, price: '$14.99', isVip: true }
    ]
  }
};

window.CONFIG = CONFIG;
