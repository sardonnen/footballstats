# ⚽ Football Stats - Application Modulaire

Application de statistiques de football en temps réel, optimisée pour mobile et desktop.

## 📁 Structure des fichiers

Voici comment organiser tous les fichiers pour que l'application fonctionne correctement :

```
football-stats/
├── index.html                 # Page principale
├── styles/
│   ├── base.css              # Styles principaux
│   ├── mobile.css            # Styles mobiles
│   └── live.css              # Styles vue live
├── js/
│   ├── config.js             # Configuration générale
│   ├── utils.js              # Fonctions utilitaires
│   ├── storage.js            # Gestion du stockage
│   ├── navigation.js         # Navigation entre pages
│   ├── match.js              # Logique des matchs
│   ├── live.js               # Vue live du match
│   ├── mobile.js             # Optimisations mobiles
│   └── app.js                # Application principale
└── README.md                 # Ce fichier
```

## 🚀 Installation rapide

### Méthode 1 : Téléchargement direct

1. **Créez** un dossier `football-stats` sur votre ordinateur
2. **Téléchargez** tous les fichiers depuis Claude
3. **Organisez** les fichiers selon la structure ci-dessus
4. **Ouvrez** `index.html` dans votre navigateur

### Méthode 2 : Création manuelle

1. **Créez** la structure de dossiers :
   ```bash
   mkdir football-stats
   cd football-stats
   mkdir styles js
   ```

2. **Copiez** le contenu de chaque fichier depuis Claude
3. **Sauvegardez** chaque fichier à sa place dans la structure
4. **Ouvrez** `index.html` dans votre navigateur

## 📱 Installation sur mobile

### Android
1. **Ouvrez** `index.html` dans Chrome
2. **Menu** → "Ajouter à l'écran d'accueil"
3. L'application fonctionne comme une app native !

### iPhone/iPad
1. **Ouvrez** `index.html` dans Safari
2. **Partager** → "Sur l'écran d'accueil"
3. L'application est installée comme PWA !

## ✨ Fonctionnalités

- ⚽ **Création de matchs** avec équipes personnalisables
- 📊 **Statistiques en temps réel** (buts, cartons, arrêts...)
- 🔴 **Mode live** avec partage de liens
- 📱 **Optimisé mobile** avec vibrations et notifications
- 💾 **Sauvegarde automatique** des matchs
- 🌙 **Mode sombre automatique**
- 📶 **Fonctionne hors ligne**

## 🛠️ Avantages de la structure modulaire

### ✅ **Avant (fichier unique)**
- ❌ Tout dans un seul fichier de 2000+ lignes
- ❌ Difficile à maintenir et déboguer
- ❌ Risque de tout casser à chaque modification
- ❌ Impossible de travailler à plusieurs

### ✅ **Maintenant (structure modulaire)**
- ✅ Code organisé par fonctionnalité
- ✅ Facile à maintenir et déboguer
- ✅ Modifications sûres et isolées
- ✅ Collaboration possible
- ✅ Réutilisabilité des modules

## 🔧 Modification du code

### Pour modifier les **styles** :
- **Général** → `styles/base.css`
- **Mobile** → `styles/mobile.css`
- **Vue live** → `styles/live.css`

### Pour modifier la **logique** :
- **Configuration** → `js/config.js`
- **Navigation** → `js/navigation.js`
- **Matchs** → `js/match.js`
- **Live** → `js/live.js`
- **Mobile** → `js/mobile.js`

### Pour ajouter une **nouvelle fonctionnalité** :
1. Créez un nouveau fichier `js/ma-fonction.js`
2. Ajoutez `<script src="js/ma-fonction.js"></script>` dans `index.html`
3. Utilisez la fonction dans les autres modules

## 🐛 Résolution des problèmes

### L'application ne s'affiche pas
1. **Vérifiez** que tous les fichiers sont présents
2. **Contrôlez** la structure des dossiers
3. **Ouvrez** la console (F12) pour voir les erreurs

### Erreur "fichier non trouvé"
1. **Vérifiez** les chemins dans `index.html`
2. **Assurez-vous** que les dossiers `styles/` et `js/` existent
3. **Respectez** la casse des noms de fichiers

### Sur mobile, ça ne marche pas
1. **Utilisez** Chrome sur Android ou Safari sur iOS
2. **Activez** JavaScript dans les paramètres
3. **Essayez** le mode debug (touche F11)

## 🔄 Mises à jour

Pour mettre à jour l'application :

1. **Sauvegardez** vos matchs (Paramètres → Exporter)
2. **Remplacez** les fichiers par les nouvelles versions
3. **Gardez** vos données dans le navigateur
4. **Importez** vos matchs si besoin

## 📞 Support

### Mode Debug
- **Touche F11** pour activer le mode debug
- **Console** (F12) pour voir les logs détaillés
- **Mobile** : Bouton "🔧 Debug" en bas à droite

### Informations système
Le mode debug affiche :
- Version de l'application
- Type d'appareil et navigateur
- État du stockage local
- Journaux d'erreurs

## 🎯 Conseils d'utilisation

### Pour un match fluide :
1. **Préparez** vos équipes avant de lancer
2. **Testez** le lien live avant de le partager
3. **Gardez** l'application ouverte pendant le match
4. **Sauvegardez** régulièrement

### Pour le partage live :
1. **Générez** le lien depuis le match
2. **Copiez** et partagez via WhatsApp, SMS...
3. **Les spectateurs** peuvent suivre en temps réel
4. **Pas besoin** d'installation pour les spectateurs

## 🔒 Confidentialité

- ✅ **Aucune donnée** envoyée sur internet
- ✅ **Tout stocké localement** sur votre appareil
- ✅ **Pas de tracking** ni d'analytics
- ✅ **Code source ouvert** et transparent

## 📄 Licence

Ce projet est libre d'utilisation pour :
- ✅ Usage personnel
- ✅ Clubs et associations
- ✅ Modifications et améliorations
- ✅ Redistribution

---

## 🚀 Prêt à jouer ?

1. **Organisez** les fichiers selon la structure
2. **Ouvrez** `index.html`
3. **Créez** votre premier match
4. **Profitez** de l'application !

**Bon match ! ⚽🏆**