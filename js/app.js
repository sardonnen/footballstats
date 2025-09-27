/**
 * Application principale Football Stats
 * Point d'entrée et orchestration de tous les modules
 */

const FootballStatsApp = {
    
    // État de l'application
    initialized: false,
    startTime: Date.now(),
    
    /**
     * Initialise l'application complète
     */
    initialize: function() {
        if (this.initialized) {
            console.warn('⚠️ Application déjà initialisée');
            return;
        }
        
        console.log('🚀 Initialisation de Football Stats...');
        
        try {
            // Étape 1: Configuration et validation
            this.validateEnvironment();
            this.loadUserSettings();
            
            // Étape 2: Optimisations mobile
            if (DEVICE_INFO.isMobile) {
                MobileOptimizer.initialize();
            }
            
            // Étape 3: Interface utilisateur
            this.setupUI();
            this.setupGlobalEventListeners();
            
            // Étape 4: Fonctionnalités principales
            this.initializeModules();
            this.setupAutoSave();
            
            // Étape 5: Vérifications initiales
            this.checkInitialState();
            this.performStartupTasks();
            
            // Étape 6: Finalisation
            this.finializeInitialization();
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            this.handleInitializationError(error);
        }
    },
    
    /**
     * Valide l'environnement et les dépendances
     */
    validateEnvironment: function() {
        console.log('🔍 Validation de l\'environnement...');
        
        // Vérifier le support localStorage
        if (!this.checkLocalStorageSupport()) {
            throw new Error('LocalStorage non supporté');
        }
        
        // Vérifier les dépendances critiques
        const requiredGlobals = ['Utils', 'StorageManager', 'NavigationManager'];
        const missingDeps = requiredGlobals.filter(dep => typeof window[dep] === 'undefined');
        
        if (missingDeps.length > 0) {
            throw new Error(`Dépendances manquantes: ${missingDeps.join(', ')}`);
        }
        
        // Vérifier la compatibilité du navigateur
        if (!this.checkBrowserCompatibility()) {
            this.showCompatibilityWarning();
        }
        
        console.log('✅ Environnement validé');
    },
    
    /**
     * Vérifie le support localStorage
     */
    checkLocalStorageSupport: function() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    },
    
    /**
     * Vérifie la compatibilité du navigateur
     */
    checkBrowserCompatibility: function() {
        const required = [
            'addEventListener',
            'querySelector',
            'JSON',
            'Date',
            'Array.prototype.forEach',
            'Object.keys'
        ];
        
        return required.every(feature => {
            try {
                return eval(`typeof ${feature}`) !== 'undefined';
            } catch (error) {
                return false;
            }
        });
    },
    
    /**
     * Affiche un avertissement de compatibilité
     */
    showCompatibilityWarning: function() {
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #e74c3c;
            color: white;
            padding: 10px;
            text-align: center;
            z-index: 10002;
            font-weight: bold;
        `;
        warning.innerHTML = '⚠️ Navigateur non compatible. Certaines fonctionnalités peuvent ne pas marcher.';
        document.body.insertBefore(warning, document.body.firstChild);
        
        setTimeout(() => {
            if (warning.parentNode) {
                warning.parentNode.removeChild(warning);
            }
        }, 5000);
    },
    
    /**
     * Charge les paramètres utilisateur
     */
    loadUserSettings: function() {
        console.log('⚙️ Chargement des paramètres...');
        
        const settings = SettingsStorage.load();
        
        // Appliquer les paramètres
        APP_CONFIG.debug = settings.debugMode || APP_CONFIG.debug;
        APP_CONFIG.mobile.enableVibration = settings.vibrations && DEVICE_INFO.capabilities.vibrate;
        APP_CONFIG.mobile.enableNotifications = settings.notifications && DEVICE_INFO.capabilities.notification;
        
        // Appliquer le thème
        this.applyTheme(settings.theme);
        
        console.log('✅ Paramètres chargés:', settings);
    },
    
    /**
     * Applique un thème
     */
    applyTheme: function(theme) {
        document.body.classList.remove('theme-light', 'theme-dark', 'theme-auto');
        
        switch (theme) {
            case 'light':
                document.body.classList.add('theme-light');
                break;
            case 'dark':
                document.body.classList.add('theme-dark');
                break;
            case 'auto':
            default:
                document.body.classList.add('theme-auto');
                break;
        }
    },
    
    /**
     * Configure l'interface utilisateur
     */
    setupUI: function() {
        console.log('🎨 Configuration de l\'interface...');
        
        // Afficher la version dans le footer si debug
        if (APP_CONFIG.debug) {
            this.addVersionInfo();
        }
        
        // Configuration de l'interface mobile
        if (DEVICE_INFO.isMobile) {
            document.body.classList.add('mobile-device');
            
            if (DEVICE_INFO.isAndroid) {
                document.body.classList.add('android');
            } else if (DEVICE_INFO.isIOS) {
                document.body.classList.add('ios');
            }
        }
        
        // Gérer la classe pour les appareils tactiles
        if (DEVICE_INFO.hasTouch) {
            document.body.classList.add('touch-device');
        }
        
        console.log('✅ Interface configurée');
    },
    
    /**
     * Ajoute les informations de version
     */
    addVersionInfo: function() {
        const versionInfo = document.createElement('div');
        versionInfo.style.cssText = `
            position: fixed;
            bottom: 5px;
            left: 5px;
            font-size: 10px;
            color: rgba(255,255,255,0.5);
            z-index: 9999;
            pointer-events: none;
        `;
        versionInfo.textContent = `v${APP_CONFIG.version} - ${DEVICE_INFO.isMobile ? 'Mobile' : 'Desktop'}`;
        document.body.appendChild(versionInfo);
    },
    
    /**
     * Configure les écouteurs d'événements globaux
     */
    setupGlobalEventListeners: function() {
        console.log('👂 Configuration des événements globaux...');
        
        // Gestion des erreurs globales
        window.addEventListener('error', (event) => {
            this.handleGlobalError(event.error, event);
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            this.handleGlobalError(event.reason, event);
        });
        
        // Gestion du redimensionnement
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, 250));
        
        // Gestion de la fermeture de l'application
        window.addEventListener('beforeunload', (event) => {
            this.handleBeforeUnload(event);
        });
        
        // Raccourcis clavier globaux
        document.addEventListener('keydown', (event) => {
            this.handleGlobalKeyboard(event);
        });
        
        console.log('✅ Événements globaux configurés');
    },
    
    /**
     * Gère les erreurs globales
     */
    handleGlobalError: function(error, event) {
        console.error('❌ Erreur globale:', error, event);
        
        // Logger l'erreur
        const errorInfo = DebugUtils.logError(error, 'Global Error');
        
        // Notifier l'utilisateur si c'est critique
        if (error.name !== 'ChunkLoadError' && !error.message.includes('Script error')) {
            NotificationUtils.show('Une erreur est survenue', 'error');
        }
        
        // Essayer de récupérer automatiquement
        this.attemptErrorRecovery(error);
    },
    
    /**
     * Tentative de récupération d'erreur
     */
    attemptErrorRecovery: function(error) {
        // Si c'est une erreur de réseau, réessayer plus tard
        if (error.message.includes('fetch') || error.message.includes('network')) {
            setTimeout(() => {
                if (NavigationManager.currentPage === 'live') {
                    LiveManager.updateLiveDisplay();
                }
            }, 5000);
        }
        
        // Si c'est une erreur de stockage, nettoyer
        if (error.name === 'QuotaExceededError') {
            StorageManager.cleanOldData();
        }
    },
    
    /**
     * Gère le redimensionnement
     */
    handleResize: function() {
        // Ajuster l'interface mobile
        if (DEVICE_INFO.isMobile) {
            // Gérer le changement d'orientation
            const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
            document.body.className = document.body.className.replace(/orientation-\w+/, '');
            document.body.classList.add(`orientation-${orientation}`);
            
            // Forcer un redraw de la vue live si active
            if (NavigationManager.currentPage === 'live') {
                setTimeout(() => {
                    LiveManager.updateLiveDisplay();
                }, 100);
            }
        }
    },
    
    /**
     * Gère la fermeture de l'application
     */
    handleBeforeUnload: function(event) {
        // Sauvegarder les données critiques
        if (window.currentMatch && window.currentMatch.isLive) {
            MatchManager.autoSave();
            
            // Avertir si un match est en cours
            event.preventDefault();
            event.returnValue = 'Un match est en cours. Êtes-vous sûr de vouloir quitter ?';
            return event.returnValue;
        }
        
        // Nettoyer les intervalles
        if (window.matchTimer) {
            clearInterval(window.matchTimer);
        }
        
        if (window.liveUpdateInterval) {
            clearInterval(window.liveUpdateInterval);
        }
    },
    
    /**
     * Gère les raccourcis clavier globaux
     */
    handleGlobalKeyboard: function(event) {
        // Raccourcis avec Ctrl/Cmd
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 'h':
                    event.preventDefault();
                    NavigationManager.showPage('home');
                    break;
                case 'm':
                    event.preventDefault();
                    NavigationManager.showPage('match');
                    break;
                case 'l':
                    event.preventDefault();
                    NavigationManager.showPage('live');
                    break;
                case 's':
                    event.preventDefault();
                    if (window.currentMatch) {
                        MatchManager.autoSave();
                        NotificationUtils.show('Match sauvegardé', 'success');
                    }
                    break;
            }
        }
        
        // Touche Échap pour retour
        if (event.key === 'Escape') {
            NavigationManager.goBack();
        }
        
        // F11 pour debug
        if (event.key === 'F11' && !event.ctrlKey) {
            event.preventDefault();
            this.toggleDebugMode();
        }
    },
    
    /**
     * Bascule le mode debug
     */
    toggleDebugMode: function() {
        APP_CONFIG.debug = !APP_CONFIG.debug;
        
        if (APP_CONFIG.debug) {
            DebugUtils.enableMobileDebug();
            NotificationUtils.show('Mode debug activé', 'info');
        } else {
            const debugDiv = document.getElementById('mobileDebug');
            if (debugDiv) {
                debugDiv.remove();
            }
            NotificationUtils.show('Mode debug désactivé', 'info');
        }
        
        // Sauvegarder la préférence
        SettingsStorage.update('debugMode', APP_CONFIG.debug);
    },
    
    /**
     * Initialise tous les modules
     */
    initializeModules: function() {
        console.log('🔧 Initialisation des modules...');
        
        // Initialiser la navigation
        NavigationManager.showPage('home');
        
        // Vérifier s'il y a un match live à charger
        LiveManager.initializeLiveView();
        
        // Nettoyer les anciennes données
        StorageManager.cleanOldData();
        
        console.log('✅ Modules initialisés');
    },
    
    /**
     * Configure la sauvegarde automatique
     */
    setupAutoSave: function() {
        const settings = SettingsStorage.load();
        
        if (settings.autoSave) {
            AutoSave.start(() => {
                if (window.currentMatch && window.currentMatch.isLive) {
                    MatchManager.autoSave();
                }
            }, settings.autoSaveInterval);
            
            console.log('💾 Auto-sauvegarde activée');
        }
    },
    
    /**
     * Vérifie l'état initial de l'application
     */
    checkInitialState: function() {
        console.log('🔍 Vérification de l\'état initial...');
        
        // Vérifier l'espace de stockage
        const storageInfo = StorageManager.getUsedSpace();
        console.log('💾 Espace utilisé:', storageInfo.kb + 'KB');
        
        if (parseFloat(storageInfo.mb) > 5) {
            NotificationUtils.show('Espace de stockage important utilisé', 'warning');
        }
        
        // Vérifier s'il y a des matchs en cours
        const matchList = MatchStorage.getMatchList();
        const liveMatches = matchList.filter(match => match.isLive);
        
        if (liveMatches.length > 0) {
            console.log('🔴 Matchs live détectés:', liveMatches.length);
        }
        
        console.log('✅ État initial vérifié');
    },
    
    /**
     * Effectue les tâches de démarrage
     */
    performStartupTasks: function() {
        console.log('🏁 Tâches de démarrage...');
        
        // Précharger les données critiques si nécessaire
        this.preloadCriticalData();
        
        // Vérifier les mises à jour (si applicable)
        this.checkForUpdates();
        
        // Statistiques d'utilisation (anonymes)
        this.trackUsage();
        
        console.log('✅ Tâches de démarrage terminées');
    },
    
    /**
     * Précharge les données critiques
     */
    preloadCriticalData: function() {
        // Précharger la liste des matchs
        MatchStorage.getMatchList();
        
        // Précharger les paramètres
        SettingsStorage.load();
    },
    
    /**
     * Vérifie les mises à jour
     */
    checkForUpdates: function() {
        const lastVersion = StorageManager.load('appVersion', '1.0.0');
        
        if (lastVersion !== APP_CONFIG.version) {
            console.log('🆕 Nouvelle version détectée:', APP_CONFIG.version);
            this.handleVersionUpdate(lastVersion, APP_CONFIG.version);
            StorageManager.save('appVersion', APP_CONFIG.version);
        }
    },
    
    /**
     * Gère la mise à jour de version
     */
    handleVersionUpdate: function(oldVersion, newVersion) {
        NotificationUtils.show(`Mise à jour vers v${newVersion}`, 'success');
        
        // Migrations de données si nécessaire
        this.performDataMigrations(oldVersion, newVersion);
    },
    
    /**
     * Effectue les migrations de données
     */
    performDataMigrations: function(oldVersion, newVersion) {
        console.log(`🔄 Migration ${oldVersion} → ${newVersion}`);
        
        // Exemple de migration
        if (oldVersion < '2.0.0') {
            // Migrer l'ancien format de données
            console.log('📦 Migration vers v2.0.0...');
        }
    },
    
    /**
     * Suit l'utilisation de l'application
     */
    trackUsage: function() {
        const usage = StorageManager.load('usageStats', {
            firstLaunch: Date.now(),
            launches: 0,
            totalMatches: 0,
            totalEvents: 0
        });
        
        usage.launches++;
        usage.lastLaunch = Date.now();
        
        StorageManager.save('usageStats', usage);
        
        if (APP_CONFIG.debug) {
            console.log('📊 Statistiques d\'utilisation:', usage);
        }
    },
    
    /**
     * Finalise l'initialisation
     */
    finializeInitialization: function() {
        this.initialized = true;
        const initTime = Date.now() - this.startTime;
        
        console.log(`🎉 Football Stats initialisé en ${initTime}ms`);
        
        // Notification de bienvenue
        if (DEVICE_INFO.isMobile) {
            NotificationUtils.show('⚽ Football Stats prêt !', 'success');
        }
        
        // Événement personnalisé pour signaler l'initialisation
        const event = new CustomEvent('footballStatsReady', {
            detail: {
                version: APP_CONFIG.version,
                initTime: initTime,
                isMobile: DEVICE_INFO.isMobile
            }
        });
        
        document.dispatchEvent(event);
    },
    
    /**
     * Gère les erreurs d'initialisation
     */
    handleInitializationError: function(error) {
        console.error('💥 Erreur critique d\'initialisation:', error);
        
        // Interface d'erreur de base
        document.body.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #e74c3c;
                color: white;
                padding: 30px;
                border-radius: 12px;
                text-align: center;
                font-family: sans-serif;
                max-width: 300px;
            ">
                <h2>❌ Erreur d'initialisation</h2>
                <p>L'application n'a pas pu démarrer correctement.</p>
                <p style="font-size: 12px; margin-top: 15px; opacity: 0.8;">
                    ${error.message}
                </p>
                <button onclick="location.reload()" style="
                    background: white;
                    color: #e74c3c;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    margin-top: 15px;
                    cursor: pointer;
                    font-weight: bold;
                ">
                    🔄 Recharger
                </button>
            </div>
        `;
    },
    
    /**
     * Redémarre l'application
     */
    restart: function() {
        console.log('🔄 Redémarrage de l\'application...');
        
        // Nettoyer les intervalles
        if (window.matchTimer) {
            clearInterval(window.matchTimer);
        }
        
        if (window.liveUpdateInterval) {
            clearInterval(window.liveUpdateInterval);
        }
        
        AutoSave.stop();
        
        // Réinitialiser l'état
        this.initialized = false;
        
        // Recharger la page
        location.reload();
    }
};

// Fonction d'initialisation globale
function initializeApp() {
    FootballStatsApp.initialize();
}

// Fonction pour les paramètres (appelée depuis HTML)
function saveSettings(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const settings = {
        notifications: formData.has('notifications'),
        vibrations: formData.has('vibrations'),
        autoSave: formData.has('autoSave'),
        matchDuration: parseInt(formData.get('matchDurationDefault')),
        debugMode: formData.has('debugMode')
    };
    
    const saved = SettingsStorage.save(settings);
    if (saved) {
        NotificationUtils.show('Paramètres sauvegardés', 'success');
        
        // Appliquer immédiatement certains paramètres
        APP_CONFIG.debug = settings.debugMode;
        APP_CONFIG.mobile.enableVibration = settings.vibrations;
        APP_CONFIG.mobile.enableNotifications = settings.notifications;
        
        // Redémarrer auto-save si nécessaire
        if (settings.autoSave) {
            AutoSave.start(() => {
                if (window.currentMatch?.isLive) {
                    MatchManager.autoSave();
                }
            });
        } else {
            AutoSave.stop();
        }
    } else {
        NotificationUtils.show('Erreur sauvegarde paramètres', 'error');
    }
}

function resetSettings() {
    if (confirm('Remettre tous les paramètres par défaut ?')) {
        SettingsStorage.reset();
        NavigationManager.initializeSettingsPage();
    }
}

function exportData() {
    try {
        const exportData = StorageManager.exportData();
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `football-stats-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        NotificationUtils.show('Données exportées', 'success');
    } catch (error) {
        console.error('❌ Erreur export:', error);
        NotificationUtils.show('Erreur lors de l\'export', 'error');
    }
}

// Auto-initialisation quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM déjà prêt
    initializeApp();
}

// Export si module ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FootballStatsApp,
        initializeApp
    };
}
