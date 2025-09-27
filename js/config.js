/**
 * Configuration globale de l'application Football Stats
 */

// Configuration générale
const APP_CONFIG = {
    name: 'Football Stats',
    version: '2.0.0',
    debug: false, // Passer à true pour le mode debug
    
    // Paramètres de match
    defaultMatchDuration: 90, // minutes
    halfTimeDuration: 45,
    extraTimeDuration: 30,
    
    // Paramètres mobile
    mobile: {
        updateInterval: 1000, // Mise à jour toutes les secondes
        touchDelay: 300, // Délai anti-rebond pour les touches
        maxEventsDisplay: 50, // Nombre max d'événements affichés
        enableVibration: true,
        enableNotifications: true
    },
    
    // Paramètres de stockage
    storage: {
        prefix: 'footballStats_',
        maxSavedMatches: 10,
        autoSaveInterval: 30000 // Sauvegarde auto toutes les 30 secondes
    },
    
    // Types d'événements
    eventTypes: {
        GOAL: 'goal',
        ASSIST: 'assist',
        YELLOW_CARD: 'yellow_card',
        RED_CARD: 'red_card',
        SUBSTITUTION: 'substitution',
        SAVE: 'save',
        FOUL: 'foul',
        CORNER: 'corner',
        OFFSIDE: 'offside',
        PENALTY: 'penalty'
    },
    
    // Couleurs par type d'événement
    eventColors: {
        goal: '#e74c3c',
        assist: '#27ae60',
        yellow_card: '#f39c12',
        red_card: '#c0392b',
        substitution: '#9b59b6',
        save: '#3498db',
        foul: '#95a5a6',
        corner: '#16a085',
        offside: '#e67e22',
        penalty: '#8e44ad'
    },
    
    // Icônes par type d'événement
    eventIcons: {
        goal: '⚽',
        assist: '🎯',
        yellow_card: '🟨',
        red_card: '🟥',
        substitution: '🔄',
        save: '🥅',
        foul: '⚠️',
        corner: '📐',
        offside: '🚩',
        penalty: '🎯'
    }
};

// Configuration des positions de jeu
const PLAYER_POSITIONS = {
    'GK': 'Gardienne',
    'DF': 'Défenseuse',
    'MF': 'Milieu',
    'FW': 'Attaquante'
};

// Configuration des formations
const FORMATIONS = {
    '4-4-2': {
        name: '4-4-2',
        positions: {
            'GK': 1,
            'DF': 4,
            'MF': 4,
            'FW': 2
        }
    },
    '4-3-3': {
        name: '4-3-3',
        positions: {
            'GK': 1,
            'DF': 4,
            'MF': 3,
            'FW': 3
        }
    },
    '3-5-2': {
        name: '3-5-2',
        positions: {
            'GK': 1,
            'DF': 3,
            'MF': 5,
            'FW': 2
        }
    },
    '4-5-1': {
        name: '4-5-1',
        positions: {
            'GK': 1,
            'DF': 4,
            'MF': 5,
            'FW': 1
        }
    }
};

// Messages d'erreur
const ERROR_MESSAGES = {
    CONNECTION_FAILED: 'Erreur de connexion. Vérifiez votre internet.',
    MATCH_NOT_FOUND: 'Match non trouvé ou expiré.',
    SAVE_FAILED: 'Erreur lors de la sauvegarde.',
    LOAD_FAILED: 'Erreur lors du chargement.',
    INVALID_DATA: 'Données invalides.',
    PERMISSION_DENIED: 'Permission refusée.',
    NETWORK_ERROR: 'Erreur réseau.',
    TIMEOUT_ERROR: 'Délai d\'attente dépassé.'
};

// Messages de succès
const SUCCESS_MESSAGES = {
    MATCH_SAVED: 'Match sauvegardé avec succès',
    MATCH_LOADED: 'Match chargé avec succès',
    LINK_COPIED: 'Lien copié dans le presse-papiers',
    LINK_SHARED: 'Lien partagé avec succès',
    EVENT_ADDED: 'Événement ajouté',
    EVENT_REMOVED: 'Événement supprimé',
    SETTINGS_SAVED: 'Paramètres sauvegardés'
};

// Configuration des notifications
const NOTIFICATION_CONFIG = {
    duration: 3000, // 3 secondes
    maxNotifications: 3,
    position: 'top-right',
    
    types: {
        success: {
            backgroundColor: '#27ae60',
            icon: '✅'
        },
        error: {
            backgroundColor: '#e74c3c',
            icon: '❌'
        },
        warning: {
            backgroundColor: '#f39c12',
            icon: '⚠️'
        },
        info: {
            backgroundColor: '#3498db',
            icon: 'ℹ️'
        }
    }
};

// Détection mobile
const DEVICE_INFO = {
    isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    isAndroid: /Android/i.test(navigator.userAgent),
    isIOS: /iPhone|iPad|iPod/i.test(navigator.userAgent),
    isTablet: /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent),
    hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    
    // Capacités du navigateur
    capabilities: {
        share: 'share' in navigator,
        clipboard: 'clipboard' in navigator,
        vibrate: 'vibrate' in navigator,
        notification: 'Notification' in window,
        serviceWorker: 'serviceWorker' in navigator,
        webSocket: 'WebSocket' in window
    }
};

// URLs de l'application (si hébergée)
const APP_URLS = {
    base: window.location.origin + window.location.pathname,
    live: function(matchId) {
        return this.base + '?live=' + matchId;
    },
    api: '' // À définir si une API backend est utilisée
};

// Validation des données
const VALIDATION_RULES = {
    teamName: {
        minLength: 2,
        maxLength: 30,
        pattern: /^[a-zA-ZÀ-ÿ0-9\s\-_]+$/
    },
    playerName: {
        minLength: 2,
        maxLength: 25,
        pattern: /^[a-zA-ZÀ-ÿ\s\-']+$/
    },
    playerNumber: {
        min: 1,
        max: 99
    },
    matchDuration: {
        min: 1,
        max: 180
    }
};

// Export des configurations (si module ES6)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        APP_CONFIG,
        PLAYER_POSITIONS,
        FORMATIONS,
        ERROR_MESSAGES,
        SUCCESS_MESSAGES,
        NOTIFICATION_CONFIG,
        DEVICE_INFO,
        APP_URLS,
        VALIDATION_RULES
    };
}

// Debug
if (APP_CONFIG.debug) {
    console.log('🔧 Football Stats - Configuration chargée');
    console.log('📱 Device Info:', DEVICE_INFO);
    console.log('⚙️ App Config:', APP_CONFIG);
}
