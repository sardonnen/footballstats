/**
 * Utilitaires génériques pour l'application Football Stats
 */

// Utilitaires de base
const Utils = {
    
    /**
     * Génère un ID unique
     */
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    /**
     * Génère un ID pour les matchs live
     */
    generateMatchId: function() {
        return 'match_' + Date.now().toString(36);
    },
    
    /**
     * Formate un timestamp en temps de match (MM:SS)
     */
    formatMatchTime: function(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    },
    
    /**
     * Formate une date en string lisible
     */
    formatDate: function(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    /**
     * Attend un délai (Promise)
     */
    delay: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    /**
     * Debounce une fonction
     */
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    /**
     * Throttle une fonction
     */
    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    },
    
    /**
     * Clone un objet profondément
     */
    deepClone: function(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    },
    
    /**
     * Vérifie si deux objets sont égaux
     */
    isEqual: function(obj1, obj2) {
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    },
    
    /**
     * Nettoie une chaîne de caractères
     */
    sanitizeString: function(str) {
        if (typeof str !== 'string') return '';
        return str.trim().replace(/[<>]/g, '');
    },
    
    /**
     * Valide un nom d'équipe
     */
    validateTeamName: function(name) {
        const rules = VALIDATION_RULES.teamName;
        if (!name || name.length < rules.minLength || name.length > rules.maxLength) {
            return false;
        }
        return rules.pattern.test(name);
    },
    
    /**
     * Valide un nom de joueur
     */
    validatePlayerName: function(name) {
        const rules = VALIDATION_RULES.playerName;
        if (!name || name.length < rules.minLength || name.length > rules.maxLength) {
            return false;
        }
        return rules.pattern.test(name);
    },
    
    /**
     * Valide un numéro de joueur
     */
    validatePlayerNumber: function(number) {
        const rules = VALIDATION_RULES.playerNumber;
        const num = parseInt(number);
        return !isNaN(num) && num >= rules.min && num <= rules.max;
    }
};

// Utilitaires spécifiques mobile
const MobileUtils = {
    
    /**
     * Détecte si l'appareil supporte la vibration
     */
    canVibrate: function() {
        return DEVICE_INFO.capabilities.vibrate && APP_CONFIG.mobile.enableVibration;
    },
    
    /**
     * Fait vibrer l'appareil
     */
    vibrate: function(pattern = [100]) {
        if (this.canVibrate()) {
            try {
                navigator.vibrate(pattern);
            } catch (error) {
                console.warn('Vibration non supportée:', error);
            }
        }
    },
    
    /**
     * Vérifie si on peut partager nativement
     */
    canShare: function() {
        return DEVICE_INFO.capabilities.share;
    },
    
    /**
     * Partage natif mobile
     */
    share: async function(data) {
        if (this.canShare()) {
            try {
                await navigator.share(data);
                return true;
            } catch (error) {
                console.warn('Partage échoué:', error);
                return false;
            }
        }
        return false;
    },
    
    /**
     * Copie dans le presse-papiers
     */
    copyToClipboard: async function(text) {
        try {
            if (DEVICE_INFO.capabilities.clipboard) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback pour anciens navigateurs
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                textarea.setSelectionRange(0, 99999);
                
                const successful = document.execCommand('copy');
                document.body.removeChild(textarea);
                return successful;
            }
        } catch (error) {
            console.warn('Copie échouée:', error);
            return false;
        }
    },
    
    /**
     * Demande la permission pour les notifications
     */
    requestNotificationPermission: async function() {
        if (!DEVICE_INFO.capabilities.notification) return false;
        
        try {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        } catch (error) {
            console.warn('Permission notification échouée:', error);
            return false;
        }
    },
    
    /**
     * Envoie une notification mobile
     */
    sendNotification: function(title, options = {}) {
        if (!DEVICE_INFO.capabilities.notification || Notification.permission !== 'granted') {
            return false;
        }
        
        try {
            const notification = new Notification(title, {
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: 'football-stats',
                renotify: true,
                ...options
            });
            
            // Auto-fermeture après 5 secondes
            setTimeout(() => notification.close(), 5000);
            
            return true;
        } catch (error) {
            console.warn('Notification échouée:', error);
            return false;
        }
    },
    
    /**
     * Vérifie si l'app est en plein écran
     */
    isFullscreen: function() {
        return document.fullscreenElement || 
               document.webkitFullscreenElement || 
               document.mozFullScreenElement ||
               document.msFullscreenElement;
    },
    
    /**
     * Basculer en plein écran
     */
    toggleFullscreen: function(element = document.documentElement) {
        if (this.isFullscreen()) {
            // Sortir du plein écran
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        } else {
            // Entrer en plein écran
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            }
        }
    }
};

// Utilitaires pour les notifications toast
const NotificationUtils = {
    
    notifications: [],
    
    /**
     * Affiche une notification toast
     */
    show: function(message, type = 'info', duration = NOTIFICATION_CONFIG.duration) {
        const notification = this.create(message, type, duration);
        this.display(notification);
        
        // Auto-suppression
        setTimeout(() => {
            this.remove(notification.id);
        }, duration);
        
        return notification.id;
    },
    
    /**
     * Crée un objet notification
     */
    create: function(message, type, duration) {
        const config = NOTIFICATION_CONFIG.types[type] || NOTIFICATION_CONFIG.types.info;
        
        return {
            id: Utils.generateId(),
            message: Utils.sanitizeString(message),
            type: type,
            duration: duration,
            timestamp: Date.now(),
            config: config
        };
    },
    
    /**
     * Affiche la notification dans le DOM
     */
    display: function(notification) {
        // Limiter le nombre de notifications
        if (this.notifications.length >= NOTIFICATION_CONFIG.maxNotifications) {
            this.remove(this.notifications[0].id);
        }
        
        this.notifications.push(notification);
        
        const element = document.createElement('div');
        element.id = 'notification-' + notification.id;
        element.className = 'notification';
        element.style.backgroundColor = notification.config.backgroundColor;
        element.innerHTML = `
            ${notification.config.icon} ${notification.message}
            <button onclick="NotificationUtils.remove('${notification.id}')" 
                    style="float: right; background: none; border: none; color: white; cursor: pointer; margin-left: 10px;">✕</button>
        `;
        
        // Conteneur des notifications
        let container = document.getElementById('notifications');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notifications';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 300px;
            `;
            document.body.appendChild(container);
        }
        
        container.appendChild(element);
        
        // Animation d'entrée
        setTimeout(() => {
            element.classList.add('show');
        }, 100);
        
        // Vibration sur mobile
        if (notification.type === 'error') {
            MobileUtils.vibrate([200, 100, 200]);
        } else if (notification.type === 'success') {
            MobileUtils.vibrate([100]);
        }
    },
    
    /**
     * Supprime une notification
     */
    remove: function(notificationId) {
        const element = document.getElementById('notification-' + notificationId);
        if (element) {
            element.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            }, 300);
        }
        
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
    },
    
    /**
     * Supprime toutes les notifications
     */
    clear: function() {
        this.notifications.forEach(n => this.remove(n.id));
        this.notifications = [];
    }
};

// Debug et diagnostics
const DebugUtils = {
    
    /**
     * Active le mode debug mobile
     */
    enableMobileDebug: function() {
        if (!DEVICE_INFO.isMobile) return;
        
        const debugDiv = document.createElement('div');
        debugDiv.id = 'mobileDebug';
        debugDiv.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0,0,0,0.9);
            color: #00ff00;
            font-family: monospace;
            font-size: 12px;
            padding: 10px;
            max-height: 200px;
            overflow-y: auto;
            z-index: 9999;
            border-top: 2px solid #00ff00;
        `;
        
        const info = this.getSystemInfo();
        debugDiv.innerHTML = `
            <div style="margin-bottom: 10px;">
                <button onclick="this.parentNode.parentNode.remove()" 
                        style="float: right; background: red; color: white; border: none; padding: 5px;">✕</button>
                <strong>🔧 DEBUG MOBILE</strong>
            </div>
            <div>📱 ${info.device}</div>
            <div>🌐 ${info.browser}</div>
            <div>📏 ${info.screen}</div>
            <div>💾 ${info.storage}</div>
            <div>🔌 ${info.features}</div>
            <div>⚡ ${info.performance}</div>
        `;
        
        document.body.appendChild(debugDiv);
        
        console.log('🔧 Debug mobile activé');
        console.log('System Info:', info);
    },
    
    /**
     * Récupère les informations système
     */
    getSystemInfo: function() {
        return {
            device: `${DEVICE_INFO.isAndroid ? 'Android' : DEVICE_INFO.isIOS ? 'iOS' : 'Autre'} - ${window.innerWidth}x${window.innerHeight}`,
            browser: navigator.userAgent.split(' ').pop(),
            screen: `${screen.width}x${screen.height} (${window.devicePixelRatio}x)`,
            storage: `localStorage: ${this.getStorageSize()}`,
            features: `Touch: ${DEVICE_INFO.hasTouch}, Share: ${DEVICE_INFO.capabilities.share}, SW: ${DEVICE_INFO.capabilities.serviceWorker}`,
            performance: `Memory: ${navigator.deviceMemory || 'N/A'}GB, Cores: ${navigator.hardwareConcurrency || 'N/A'}`
        };
    },
    
    /**
     * Calcule la taille du localStorage utilisé
     */
    getStorageSize: function() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        return (total / 1024).toFixed(2) + 'KB';
    },
    
    /**
     * Log une erreur avec contexte
     */
    logError: function(error, context = '') {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            context: context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        console.error('❌ Football Stats Error:', errorInfo);
        
        // Afficher en mode debug
        if (APP_CONFIG.debug) {
            NotificationUtils.show(`Erreur: ${error.message}`, 'error');
        }
        
        return errorInfo;
    }
};

// Export si module ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Utils,
        MobileUtils,
        NotificationUtils,
        DebugUtils
    };
}