# Carnet Auto slah

**Carnet Auto slah** est une application web progressive (PWA) et mobile (prête pour Capacitor Android/iOS) conçue pour assurer le suivi rigoureux, simple et hors connexion de votre véhicule : kilométrage, trajets, carburant & recharges, entretiens, réparations, dépenses unifiées, pièces jointes et échéances réglementaires.

---

## 1. Architecture et Choix Techniques

- **Langage & Framework** : TypeScript strict, React 19, Vite.
- **Design & Responsive UI** : Tailwind CSS v4, palette sombre moderne (`#0f172a`), composants tactiles (minimum 44×44 px), navigation mobile-first avec barre inférieure et adaptation grand écran (PC/Tablette).
- **Stockage local & Confidentialité** : Base de données locale **IndexedDB** (`CarnetAutoSlahDB`) stockant les données structurées et les pièces jointes (photos/factures compressées). Fonctionnement autonome hors ligne garanti.
- **Authentification & Cloud** : Authentification officielle **Google** (Firebase Auth via popup) et sauvegarde cloud Firestore sécurisée avec règles de sécurité durcies (`firestore.rules`).
- **Moteur de calcul automobile** :
  - Détermination du kilométrage actuel d’après le dernier relevé chronologique valide.
  - Détection et signalement des incohérences sans suppression de données.
  - Consommation réelle selon la méthode officielle des pleins complets : `litres consommés ÷ kilomètres parcourus × 100` (intégrant les pleins partiels intermédiaires). Mention « Données insuffisantes » tant que 2 pleins complets ne sont pas enregistrés.
  - Consolidation unifiée des dépenses **sans double comptage** (les pleins et entretiens alimentent directement le suivi des dépenses).
  - Gestion monétaire précise adaptée au **Dinar Tunisien (TND)** avec 3 décimales (ex: `2.525 TND`), configurable en EUR, USD, DZD, MAD, etc.
- **PWA & Offline** : Service Worker Workbox via `vite-plugin-pwa`, Web App Manifest standalone, icônes standard et maskable avec safe zone, bannière et bouton d'installation in-app interceptant `beforeinstallprompt`, guide iOS pas-à-pas.
- **Capacitor** : Prêt pour compilation native Android et iOS avec configuration `capacitor.config.ts`, détection de plateforme et compression client des photos.

---

## 2. Commandes d'installation et de développement

### Prérequis
- Node.js version 18+ (testé sous Node 22).

### Installation des dépendances
```bash
npm install
```

### Lancement du serveur de développement
```bash
npm run dev
```
L'application est accessible sur `http://localhost:3000`.

### Vérification TypeScript (Linter)
```bash
npm run lint
```

### Compilation de production (Build Web / PWA)
```bash
npm run build
```
Les fichiers compilés prêts pour la production ou pour Capacitor sont générés dans le dossier `dist/`.

---

## 3. Procédure d'installation PWA

### Sur smartphone Android (Chrome, Edge, Samsung Internet)
1. Ouvrez l'application dans votre navigateur.
2. Cliquez directement sur le bouton **« Installer l'application »** présent dans la barre supérieure ou utilisez le menu du navigateur : **« Installer l'application »** ou **« Ajouter à l'écran d'accueil »**.
3. L'icône **Carnet Auto** s'installe sur votre écran d'accueil et s'exécute en mode plein écran autonome sans barre de navigateur.

### Sur iPhone / iPad (Safari)
1. Ouvrez l'application dans **Safari**.
2. Cliquez sur le bouton d'installation **« Installer sur iOS »** ou directement sur l'icône **Partager** (le carré avec une flèche vers le haut).
3. Faites défiler la liste d'actions et sélectionnez **« Sur l'écran d'accueil »**.
4. Validez en appuyant sur **« Ajouter »**.

### Sur ordinateur (Chrome, Edge, Brave sur Windows / Mac / Linux)
1. Cliquez sur l'icône d'installation dans la barre d'adresse ou sur le bouton **« Installer l'application »**.
2. L'application s'ouvre dans sa propre fenêtre indépendante avec support du raccourci bureau.

---

## 4. Instructions de génération Android avec Capacitor

### Prérequis
- Android Studio (version Flamingo ou ultérieure).
- Android SDK et Java JDK 17+.

### Étapes de génération :
1. Installez les dépendances Capacitor :
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   ```
2. Compilez les assets web de l'application :
   ```bash
   npm run build
   ```
3. Ajoutez la plateforme Android :
   ```bash
   npx cap add android
   ```
4. Synchronisez les fichiers web vers le projet Android :
   ```bash
   npx cap sync android
   ```
5. Ouvrez le projet dans Android Studio :
   ```bash
   npx cap open android
   ```
6. Dans Android Studio :
   - Attendez la synchronisation Gradle.
   - Sélectionnez **Build > Build Bundle(s) / APK(s) > Build APK(s)** pour générer votre fichier APK installable sur smartphone.

---

## 5. Instructions de génération iOS avec Capacitor

### Prérequis
- Un ordinateur Apple sous macOS.
- Xcode (version 15+) installé depuis le Mac App Store.
- CocoaPods (`sudo gem install cocoapods`).

### Étapes de génération :
1. Installez les packages Capacitor iOS :
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/ios
   ```
2. Compilez l'application web :
   ```bash
   npm run build
   ```
3. Ajoutez le projet iOS :
   ```bash
   npx cap add ios
   ```
4. Synchronisez les assets :
   ```bash
   npx cap sync ios
   ```
5. Ouvrez le projet dans Xcode :
   ```bash
   npx cap open ios
   ```
6. Dans Xcode, configurez votre équipe de signature (*Signing & Capabilities*) puis lancez l'application sur simulateur ou sur votre iPhone connecté en USB.

---

## 6. Guide des Fonctionnalités

### Fiche véhicule
- Création dès le premier lancement.
- Gestion multi-véhicules avec sélection rapide dans la barre supérieure.
- Informations : nom, marque et modèle (listes suggérées avec champ de saisie libre), immatriculation, année, énergie (Essence, Diesel, Électrique, Hybride, GPL, Autre), photo compressée, date d'achat et notes.
- Relevé de compteur initial daté (base indispensable aux calculs kilométriques).

### Carnet chronologique
- Journal unifié classant par date décroissante : trajets, pleins, entretiens et dépenses.
- Filtres rapides : Tous, Trajets, Carburant, Entretiens, Dépenses.
- Filtre par période : Tout, Ce mois, 3 mois, Cette année.
- Recherche instantanée dans les libellés, garages, stations, lieux et notes.
- Clic sur une ligne : affiche la fiche détaillée avec accès aux pièces jointes, modification, suppression et partage.

### Trajets
- Compteurs de départ et d'arrivée avec calcul instantané de la distance.
- Trajet incomplet autorisé : la distance n'est calculée que lorsque les deux compteurs sont saisis.
- Avertissement visuel immédiat si le compteur d'arrivée est inférieur au compteur de départ.
- Motif personnel ou professionnel, origine, destination, conducteur et remarques.

### Carburant & Recharge électrique
- Plein carburant (Litres, prix au litre, montant total en TND à 3 décimales, indicateur « Plein complet »).
- Calcul bidirectionnel automatique (quantité × prix unitaire = total, ou total ÷ quantité = prix unitaire).
- Véhicule électrique : suivi en kWh, lieu de recharge et coût.
- Calcul de consommation entre deux pleins complets successifs intégrant les éventuels pleins partiels intermédiaires.

### Entretien & Réparations
- Enregistrement de l'intervention, kilométrage, garage, montant et date.
- Catégories personnalisables : vidange, filtres, pneumatiques, freins, batterie, distribution, suspension, climatisation, autre.
- Programmation de la prochaine échéance (date et/ou kilométrage), créant automatiquement un rappel dans l'onglet des échéances.

### Dépenses consolidées (Zéro double comptage)
- Les pleins et entretiens alimentent automatiquement la vue des dépenses.
- Enregistrement direct des dépenses autonomes : assurance, contrôle technique, vignette fiscale, parking, péages, amendes.
- Graphiques de répartition par catégorie et suivi mensuel.

### Documents & Justificatifs
- Stockage de la carte grise, quittances d'assurance, factures et rapports de contrôle technique.
- Prise de photo directe ou sélection de fichier avec compression client intégrée.
- Date d'expiration facultative avec alerte automatique si le document arrive à échéance.
- Consultation, téléchargement et partage natif.

### Échéances & Rappels
- Statuts clairs : **À venir**, **Bientôt** (sous le seuil d'alerte), **Dépassée**.
- Seuils personnalisables en jours (ex: 30 jours) et en kilomètres (ex: 1 000 km).
- Note explicative indiquant que les alertes kilométriques se basent sur le dernier relevé saisi.
- Action rapide pour marquer une échéance comme effectuée.

### Sauvegarde, Restauration & Import/Export
- **Sauvegarde complète** : exporte en un clic un fichier `.json` unique contenant l'ensemble des véhicules, entrées, documents et images.
- **Restauration** : vérification du fichier, aperçu du nombre d'éléments, choix entre fusionner ou remplacer.
- **Export CSV** : tableau universel Excel/LibreOffice de l'historique complet du véhicule actif.
- **Import CSV** : sélection du fichier, aperçu des lignes, correspondance des colonnes personnalisable et journal de détection des erreurs.
- **Rapport imprimable / PDF** : page synthétique optimisée pour impression ou sauvegarde au format PDF (`window.print`).

---

## 7. Résultats des tests et limitations actuelles

### Tests validés avec succès :
- [x] Ajout, modification et suppression de trajets (calcul de distance, alertes compteur départ > arrivée).
- [x] Enregistrement des pleins et calculs bidirectionnels des montants en TND (3 décimales).
- [x] Calcul rigoureux de la consommation entre pleins complets (et affichage « Données insuffisantes » lorsque moins de 2 pleins complets sont présents).
- [x] Absence de double comptage des dépenses entre pleins, entretiens et dépenses libres.
- [x] Persistance des données et pièces jointes dans IndexedDB après fermeture et réouverture.
- [x] Mode hors ligne vérifié (indicateur non intrusif).
- [x] Sauvegarde JSON complète et restauration avec aperçu préalable.
- [x] Import CSV avec analyseur et correspondance des colonnes.
- [x] Responsive design : testé sur écran mobile (360px - 414px), tablette (768px - 1024px) et écran PC (1920px).
- [x] Installation PWA (`beforeinstallprompt` + dialogue guidé iOS).

### Limitations et évolutions futures :
- Le suivi GPS automatique en direct est désactivé par conception dans cette v1 (saisie manuelle des compteurs).
- Dans le navigateur web, les notifications push en arrière-plan dépendent de l'ouverture de l'application ou de l'installation de la PWA ; pour des rappels système en arrière-plan constant à heure fixe sans ouvrir l'application, l'utilisation de la version compilée Capacitor avec le plugin Local Notifications est recommandée.
