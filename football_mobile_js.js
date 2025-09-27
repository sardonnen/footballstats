/**
 * Optimisations et fonctionnalités spécifiques mobiles pour Football Stats
 */

const MobileOptimizer = {
    
    /**
     * Initialise les optimisations mobiles
     */
    initialize: function() {
        if (!DEVICE_INFO.isMobile) {
            console.log('📱 Pas un appareil mobile, optimisations désactivées');
            return;
        }
        
        console.log('📱 Initialisation des optimisations mobiles...');
        
        // Optimisations de base
        this.setupViewport();
        this.preventZoom();
        this.optimizeScrolling();
        this.setupTouchEvents();
        this.setupVisibilityHandling();
        this.setupNetworkHandling();
        
        // Optimisations spécifiques Android
        if (DEVICE_INFO.isAndroid) {
            this.setupAndroidOptimizations();
        }
        
        // Optimisations spécifiques iOS
        if (DEVICE_INFO.isIOS) {
            this.setupIOSOptimizations();
        }
        
        // PWA et service worker
        this.setupPWA();
        
        console.log('✅ Optimisations mobiles initialisées');
    },
    
    /**
     * Configure le viewport pour mobile
     */
    setupViewport: function() {
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
        
        // Meta tags additionnels pour mobile
        this.addMetaTag('mobile-web-app-capable', 'yes');
        this.addMetaTag('apple-mobile-web-app-capable', 'yes');
        this.addMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');
        this.addMetaTag('theme-color', '#2a5298');
    },
    
    /**
     * Ajoute un meta tag
     */
    addMetaTag: function(name, content) {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = name;
            meta.content = content;
            document.head.appendChild(meta);
        }
    },
    
    /**
     * Empêche le zoom non désiré
     */
    preventZoom: function() {
        // Empêcher le zoom sur double-tap
        document.addEventListener('touchstart', function(event) {
            if (event.touches.length > 1) {
                event.preventDefault();
            }
        }, { passive: false });
        
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });
    },
    
    /**
     * Optimise le scrolling mobile
     */
    optimizeScrolling: function() {
        // CSS pour le smooth scrolling
        const style = document.createElement('style');
        style.textContent = `
            body {
                -webkit-overflow-scrolling: touch;
                overscroll-behavior: contain;
            }
            
            .timeline-events,
            .team-actions,
            .opponent-actions {
                -webkit-overflow-scrolling: touch;
                overscroll-behavior: contain;
            }
            
            /* Optimisation momentum scrolling iOS */
            .scrollable {
                -webkit-overflow-scrolling: touch;
            }
            
            /* Éviter le bounce sur Android */
            html, body {
                overscroll-behavior: none;
            }
        `;
        document.head.appendChild(style);
    },
    
    /**
     * Configure les événements tactiles
     */
    setupTouchEvents: function() {
        // Gestion du swipe pour navigation
        let startX, startY, endX, endY;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;
            
            endX = e.changedTouches[0].clientX;
            endY = e.changedTouches[0].clientY;
            
            const diffX = startX - endX;
            const diffY = startY - endY;
            
            // Swipe horizontal pour navigation (si pas dans la zone de jeu)
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 100) {
                if (!e.target.closest('.live-match-table')) {
                    if (diffX > 0) {
                        // Swipe gauche - page suivante
                        this.handleSwipeLeft();
                    } else {
                        // Swipe droite - page précédente
                        this.handleSwipeRight();
                    }
                }
            }
            
            startX = startY = endX = endY = null;
        }, { passive: true });
        
        // Empêcher la sélection de texte non désirée
        document.addEventListener('selectstart', (e) => {
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
            }
        });
    },
    
    /**
     * Gère le swipe vers la gauche
     */
    handleSwipeLeft: function() {
        // Navigation vers la page suivante
        const pages = ['home', 'match', 'live', 'settings'];
        const currentIndex = pages.indexOf(NavigationManager.currentPage);
        if (currentIndex < pages.length - 1) {
            NavigationManager.showPage(pages[currentIndex + 1]);
        }
    },
    
    /**
     * Gère le swipe vers la droite
     */
    handleSwipeRight: function() {
        // Navigation vers la page précédente ou retour
        NavigationManager.goBack();
    },
    
    /**
     * Gère la visibilité de l'application
     */
    setupVisibilityHandling: function() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('📱 App cachée');
                // Mettre en pause certaines fonctionnalités
                this.onAppHidden();
            } else {
                console.log('📱 App visible');
                // Reprendre les fonctionnalités
                this.onAppVisible();
            }
        });
        
        // Gestion du focus/blur de la fenêtre
        window.addEventListener('blur', () => this.onAppHidden());
        window.addEventListener('focus', () => this.onAppVisible());
    },
    
    /**
     * Actions quand l'app est cachée
     */
    onAppHidden: function() {
        // Mettre en pause les animations coûteuses
        document.body.classList.add('app-hidden');
        
        // Réduire la fréquence des mises à jour live
        if (window.liveUpdateInterval) {
            clearInterval(window.liveUpdateInterval);
        }
    },
    
    /**
     * Actions quand l'app redevient visible
     */
    onAppVisible: function() {
        document.body.classList.remove('app-hidden');
        
        // Reprendre les mises à jour live si on est en live
        if (NavigationManager.currentPage === 'live' && window.currentMatch?.isLive) {
            LiveManager.startLiveUpdates();
            
            // Forcer une mise à jour immédiate
            setTimeout(() => {
                LiveManager.updateLiveDisplay();
            }, 100);
        }
        
        // Vérifier l'état de la connexion
        this.checkNetworkStatus();
    },
    
    /**
     * Gère l'état du réseau
     */
    setupNetworkHandling: function() {
        if ('navigator' in window && 'onLine' in navigator) {
            window.addEventListener('online', () => {
                NotificationUtils.show('🟢 Connexion rétablie', 'success');
                this.onNetworkOnline();
            });
            
            window.addEventListener('offline', () => {
                NotificationUtils.show('🔴 Hors ligne', 'warning');
                this.onNetworkOffline();
            });
        }
        
        // Vérification périodique de la connexion
        setInterval(() => {
            this.checkNetworkStatus();
        }, 30000); // Toutes les 30 secondes
    },
    
    /**
     * Vérifie l'état du réseau
     */
    checkNetworkStatus: function() {
        if ('navigator' in window && 'onLine' in navigator) {
            const isOnline = navigator.onLine;
            const networkInfo = this.getNetworkInfo();
            
            if (APP_CONFIG.debug) {
                console.log('🌐 État réseau:', isOnline, networkInfo);
            }
            
            // Adapter le comportement selon la connexion
            if (networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g') {
                this.enableLowBandwidthMode();
            } else {
                this.disableLowBandwidthMode();
            }
        }
    },
    
    /**
     * Récupère les informations réseau
     */
    getNetworkInfo: function() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (connection) {
            return {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            };
        }
        
        return { effectiveType: 'unknown' };
    },
    
    /**
     * Actions quand le réseau revient
     */
    onNetworkOnline: function() {
        // Resynchroniser les données si nécessaire
        if (window.currentMatch?.isLive) {
            LiveManager.updateLiveDisplay();
        }
    },
    
    /**
     * Actions quand le réseau disparaît
     */
    onNetworkOffline: function() {
        // Passer en mode hors ligne
        NotificationUtils.show('Mode hors ligne activé', 'info');
    },
    
    /**
     * Active le mode faible bande passante
     */
    enableLowBandwidthMode: function() {
        document.body.classList.add('low-bandwidth');
        
        // Réduire la fréquence des mises à jour
        APP_CONFIG.mobile.updateInterval = 2000;
        
        if (APP_CONFIG.debug) {
            console.log('📶 Mode faible bande passante activé');
        }
    },
    
    /**
     * Désactive le mode faible bande passante
     */
    disableLowBandwidthMode: function() {
        document.body.classList.remove('low-bandwidth');
        
        // Rétablir la fréquence normale
        APP_CONFIG.mobile.updateInterval = 1000;
    },
    
    /**
     * Optimisations spécifiques Android
     */
    setupAndroidOptimizations: function() {
        console.log('🤖 Optimisations Android activées');
        
        // Gérer le bouton retour Android
        window.addEventListener('popstate', (event) => {
            event.preventDefault();
            NavigationManager.goBack();
        });
        
        // Optimisations pour Chrome Android
        if (navigator.userAgent.includes('Chrome')) {
            this.setupChromeAndroidOptimizations();
        }
        
        // Gestion des notifications Android
        if (DEVICE_INFO.capabilities.notification) {
            MobileUtils.requestNotificationPermission();
        }
    },
    
    /**
     * Optimisations pour Chrome sur Android
     */
    setupChromeAndroidOptimizations: function() {
        // Désactiver le pull-to-refresh
        document.body.style.overscrollBehavior = 'none';
        
        // Optimiser le rendu
        const style = document.createElement('style');
        style.textContent = `
            * {
                -webkit-tap-highlight-color: transparent;
            }
            
            .live-match-table {
                transform: translateZ(0);
                will-change: transform;
            }
            
            .timeline-events {
                contain: layout style paint;
            }
        `;
        document.head.appendChild(style);
    },
    
    /**
     * Optimisations spécifiques iOS
     */
    setupIOSOptimizations: function() {
        console.log('🍎 Optimisations iOS activées');
        
        // Gérer la safe area sur iPhone X+
        this.setupIOSSafeArea();
        
        // Optimisations pour Safari iOS
        this.setupSafariOptimizations();
        
        // Empêcher le zoom sur les inputs
        this.preventIOSInputZoom();
    },
    
    /**
     * Configure la safe area iOS
     */
    setupIOSSafeArea: function() {
        const style = document.createElement('style');
        style.textContent = `
            @supports (padding: max(0px)) {
                .header {
                    padding-top: max(15px, env(safe-area-inset-top));
                }
                
                .container {
                    padding-left: max(20px, env(safe-area-inset-left));
                    padding-right: max(20px, env(safe-area-inset-right));
                    padding-bottom: max(20px, env(safe-area-inset-bottom));
                }
            }
        `;
        document.head.appendChild(style);
    },
    
    /**
     * Optimisations pour Safari iOS
     */
    setupSafariOptimizations: function() {
        // Empêcher le rebond de scroll
        document.addEventListener('touchmove', (e) => {
            if (!e.target.closest('.scrollable, .timeline-events, .team-actions, .opponent-actions')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Masquer la barre d'adresse
        window.addEventListener('load', () => {
            setTimeout(() => {
                window.scrollTo(0, 1);
            }, 100);
        });
    },
    
    /**
     * Empêche le zoom sur les inputs iOS
     */
    preventIOSInputZoom: function() {
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (parseFloat(window.getComputedStyle(input).fontSize) < 16) {
                input.style.fontSize = '16px';
            }
        });
        
        // Observer pour les nouveaux inputs
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        const newInputs = node.querySelectorAll('input, select, textarea');
                        newInputs.forEach(input => {
                            if (parseFloat(window.getComputedStyle(input).fontSize) < 16) {
                                input.style.fontSize = '16px';
                            }
                        });
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    },
    
    /**
     * Configure le PWA
     */
    setupPWA: function() {
        // Manifest
        if (!document.querySelector('link[rel="manifest"]')) {
            const manifest = {
                name: 'Football Stats',
                short_name: 'FootStats',
                description: 'Application de statistiques de football en temps réel',
                start_url: '/',
                display: 'standalone',
                background_color: '#2a5298',
                theme_color: '#2a5298',
                orientation: 'portrait',
                icons: [
                    {
                        src: 'data:image/svg+xml;base64,' + btoa(`
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="#2a5298"/>
                                <text x="50" y="60" text-anchor="middle" fill="white" font-size="40">⚽</text>
                            </svg>
                        `),
                        sizes: '192x192',
                        type: 'image/svg+xml'
                    }
                ]
            };
            
            const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
            const manifestURL = URL.createObjectURL(blob);
            
            const link = document.createElement('link');
            link.rel = 'manifest';
            link.href = manifestURL;
            document.head.appendChild(link);
        }
        
        // Service Worker basique pour le cache
        if (DEVICE_INFO.capabilities.serviceWorker) {
            this.registerServiceWorker();
        }
        
        // Gestion de l'installation PWA
        this.setupPWAInstall();
    },
    
    /**
     * Enregistre le service worker
     */
    registerServiceWorker: function() {
        const swCode = `
            const CACHE_NAME = 'football-stats-v1';
            
            self.addEventListener('install', (event) => {
                console.log('Service Worker installé');
                self.skipWaiting();
            });
            
            self.addEventListener('activate', (event) => {
                console.log('Service Worker activé');
                event.waitUntil(self.clients.claim());
            });
            
            self.addEventListener('fetch', (event) => {
                // Cache basique pour les ressources statiques
                if (event.request.method === 'GET') {
                    event.respondWith(
                        caches.match(event.request)
                            .then(response => response || fetch(event.request))
                    );
                }
            });
        `;
        
        const blob = new Blob([swCode], { type: 'application/javascript' });
        const swURL = URL.createObjectURL(blob);
        
        navigator.serviceWorker.register(swURL)
            .then((registration) => {
                console.log('✅ Service Worker enregistré');
            })
            .catch((error) => {
                console.warn('❌ Erreur Service Worker:', error);
            });
    },
    
    /**
     * Configure l'installation PWA
     */
    setupPWAInstall: function() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Afficher le bouton d'installation
            this.showInstallButton(deferredPrompt);
        });
        
        window.addEventListener('appinstalled', () => {
            NotificationUtils.show('📱 App installée !', 'success');
            deferredPrompt = null;
        });
    },
    
    /**
     * Affiche le bouton d'installation
     */
    showInstallButton: function(prompt) {
        const installBtn = document.createElement('button');
        installBtn.className = 'btn btn-primary install-btn';
        installBtn.innerHTML = '📱 Installer l\'app';
        installBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        installBtn.addEventListener('click', () => {
            prompt.prompt();
            prompt.userChoice.then((result) => {
                if (result.outcome === 'accepted') {
                    console.log('✅ Installation acceptée');
                } else {
                    console.log('❌ Installation refusée');
                }
                installBtn.remove();
            });
        });
        
        document.body.appendChild(installBtn);
        
        // Auto-suppression après 10 secondes
        setTimeout(() => {
            if (installBtn.parentNode) {
                installBtn.remove();
            }
        }, 10000);
    },
    
    /**
     * Optimise les performances
     */
    optimizePerformance: function() {
        // Lazy loading des images
        if ('IntersectionObserver' in window) {
            this.setupLazyLoading();
        }
        
        // Réduire les repaints/reflows
        this.optimizeDOM();
        
        // Gérer la mémoire
        this.setupMemoryManagement();
    },
    
    /**
     * Configure le lazy loading
     */
    setupLazyLoading: function() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            observer.observe(img);
        });
    },
    
    /**
     * Optimise le DOM
     */
    optimizeDOM: function() {
        // Utiliser requestAnimationFrame pour les mises à jour visuelles
        let rafId;
        const optimizedUpdate = () => {
            if (rafId) return;
            
            rafId = requestAnimationFrame(() => {
                // Batching des mises à jour DOM
                rafId = null;
            });
        };
        
        // Appliquer aux mises à jour fréquentes
        window.optimizedUpdate = optimizedUpdate;
    },
    
    /**
     * Gère la mémoire
     */
    setupMemoryManagement: function() {
        // Nettoyer les événements et intervalles quand on quitte une page
        const originalShowPage = NavigationManager.showPage;
        NavigationManager.showPage = function(pageId) {
            // Nettoyer la page précédente
            MobileOptimizer.cleanupPage(NavigationManager.currentPage);
            
            // Appeler la fonction originale
            return originalShowPage.call(this, pageId);
        };
        
        // Nettoyage périodique
        setInterval(() => {
            this.performMemoryCleanup();
        }, 60000); // Toutes les minutes
    },
    
    /**
     * Nettoie une page
     */
    cleanupPage: function(pageId) {
        // Nettoyer les intervalles spécifiques à la page
        if (pageId === 'live') {
            LiveManager.stopLiveUpdates();
        }
        
        // Forcer le garbage collection si disponible
        if (window.gc) {
            window.gc();
        }
    },
    
    /**
     * Effectue un nettoyage mémoire
     */
    performMemoryCleanup: function() {
        // Limiter la taille de l'historique des événements
        if (window.events && window.events.length > 100) {
            window.events = window.events.slice(0, 50);
            console.log('🧹 Historique des événements nettoyé');
        }
        
        // Nettoyer les notifications expirées
        NotificationUtils.clear();
    }
};

// CSS pour les optimisations mobiles
if (!document.getElementById('mobileOptimizationStyles')) {
    const style = document.createElement('style');
    style.id = 'mobileOptimizationStyles';
    style.textContent = `
        /* Optimisations générales mobile */
        .app-hidden * {
            animation-play-state: paused !important;
        }
        
        .low-bandwidth .timeline-event {
            animation: none !important;
        }
        
        /* PWA styles */
        .install-btn {
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: translateX(-50%) scale(1); }
            50% { transform: translateX(-50%) scale(1.05); }
        }
        
        /* Optimisations pour les performances */
        .timeline-events {
            contain: layout style paint;
        }
        
        .live-table-cell {
            contain: layout style;
        }
        
        /* Styles pour les appareils avec écran tactile */
        @media (pointer: coarse) {
            .btn, .action-btn {
                min-height: 44px;
                min-width: 44px;
            }
            
            .remove-event-btn {
                min-width: 32px;
                min-height: 32px;
            }
        }
        
        /* Optimisations pour économie de batterie */
        @media (prefers-reduced-motion: reduce) {
            * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        }
        
        /* Mode sombre automatique */
        @media (prefers-color-scheme: dark) {
            :root {
                --text-color: #ffffff;
                --bg-color: #1a1a1a;
            }
        }
    `;
    document.head.appendChild(style);
}

// Export si module ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MobileOptimizer
    };
}