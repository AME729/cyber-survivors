# ⚡ Cyber Survivors: Neon Protocol
> **Commercial HTML5 / 2D Roguelite Web Game**  
> Turnkey browser game package built for high retention, ad monetization, and resale on Flippa.

🎮 **Jouer en ligne (Live Demo)** : [https://ame729.github.io/cyber-survivors/](https://ame729.github.io/cyber-survivors/)  
📁 **Dépôt GitHub** : [https://github.com/AME729/cyber-survivors](https://github.com/AME729/cyber-survivors)

---

## 🎮 Aperçu du Jeu (Game Overview)

**Cyber Survivors: Neon Protocol** est un jeu d'action roguelite 2D cyberpunk inspiré par le phénomène mondial *Vampire Survivors*. Le joueur incarne un runner cybernétique qui doit survivre à des vagues d'ennemis robotiques pendant 15 minutes intenses dans une arène néon.

### Caractéristiques Principales
- **Zero-Dependency Sound Synth** : Synthétiseur procédural Web Audio API (lasers, explosions, foudre, fanfare de niveau et ligne de basse rétro-synthwave dynamique) sans aucun fichier audio externe manquant !
- **Moteur Canvas 2D 60 FPS** : Gestion de centaines d'ennemis simultanés, système de particules, tremblement d'écran, arcs de foudre et textes de combat flottants (dégâts, critiques, soins).
- **3 Personnages Jouables Uniques** :
  - *Cyber Ninja (Kael)* : Rapide, agile et coups critiques élevés.
  - *Heavy Mech (Titan-04)* : Résistance colossale, blindage passif et bouclier orbital.
  - *Netrunner (Nyx)* : Foudre en chaîne et réduction du temps de recharge.
- **Arsenal & Améliorations** : 5 armes évolutives (Plasma Blaster, Bouclier Orbital, Foudre en Chaîne, Aura IEM, Drone d'Assaut) et 6 objets passifs combinables.
- **Métaprogression Permanente (Armurerie)** : Puces de crédits à ramasser pour acheter des améliorations définitives (PV, Dégâts, Vitesse, Aimant, Chance, Extraction).
- **Multiplateforme Mobile & Desktop** : Compatible clavier (ZQSD / Flèches) et écran tactile avec joystick virtuel automatique.
- **Classement Mondial Persistant** : Sauvegarde des meilleurs scores et stats (kills, temps, pseudo) avec API REST Express.

---

## 💰 Architecture de Monétisation Intégrée (Flippa Ready)

Le projet intègre une infrastructure complète pour maximiser les revenus :

1. **Publicités Récompensées (Rewarded Video Ads)** :
   - *Réanimation d'urgence* : Permet au joueur de ressusciter une fois par partie contre une vidéo.
   - *Multiplicateur x2 de crédits* : Double les crédits gagnés à la fin d'une partie.
   - Prêt à brancher sur Google AdSense for Games, CrazyGames SDK, AdinPlay ou Poki.
2. **Boutique d'Achats Intégrés (IAP)** :
   - Packs de crédits cybernétiques ($1.99, $4.99, $9.99).
   - Pass VIP Néon ($14.99) : Débloque tous les héros + bonus permanent de crédits.
   - Simulateur de passerelle sécurisée (prêt pour Stripe / PayPal).
3. **Tableau de Bord Propriétaire Flippa (`⚙️ FLIPPA ADMIN`)** :
   - Vue directe sur le nombre de parties, impressions de pubs, revenus estimés et eCPM.
   - Outils de triche et de démonstration : ajout de crédits, God Mode, apparition instantanée du Boss Titan.

---

## 🚀 Installation & Lancement Rapide

### Option A : Lancement direct sans serveur (Static HTML)
Vous pouvez simplement ouvrir `public/index.html` dans n'importe quel navigateur moderne (Chrome, Firefox, Safari, Edge).

### Option B : Lancement avec le Serveur Node.js (Recommandé)
```bash
# 1. Installer les dépendances
npm install

# 2. Démarrer le serveur
npm start

# 3. Ouvrir votre navigateur sur :
# http://localhost:3000
```

### Option C : Déploiement Cloud en 1 clic
- **Vercel / Netlify / Render** : Déployez directement le dossier du projet.
- **Docker** :
  ```bash
  docker build -t cyber-survivors .
  docker run -p 3000:3000 cyber-survivors
  ```

---

## 📁 Structure du Projet

```text
cyber-survivors/
├── Dockerfile                  # Configuration conteneur Docker
├── package.json                # Dépendances Node.js & Express
├── server.js                   # Serveur API REST & Leaderboard JSON
├── leaderboard.json            # Base de données persistante des scores
├── README.md                   # Documentation technique
├── FLIPPA_LISTING_TEMPLATE.md  # Modèle d'annonce prêt à copier pour Flippa
└── public/
    ├── index.html              # Interface utilisateur & arène Canvas
    ├── css/
    │   └── style.css           # Thème cyberpunk glassmorphism
    └── js/
        ├── config.js           # Équilibrage des armes, ennemis & boutique
        ├── audio.js            # Synthétiseur sonore procédural Web Audio
        ├── meta.js             # Persistance localStorage & armurerie
        ├── monetization.js     # Gestionnaire des pubs & achats
        ├── entities.js         # Classes Joueur, Ennemis, Tirs, Particules
        ├── engine.js           # Moteur Canvas 2D & boucle de jeu 60 FPS
        ├── admin.js            # Panneau propriétaire Flippa
        └── app.js              # Orchestrateur des écrans et modales
```

---

## 📄 Licence
Ce projet est fourni avec une licence commerciale complète libre de droits, prêt pour la revente sur Flippa ou toute autre marketplace d'actifs numériques.
