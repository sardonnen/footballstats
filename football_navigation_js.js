/**
 * Gestion de la navigation et des pages pour l'application Football Stats
 */

const NavigationManager = {
    
    currentPage: 'home',
    history: ['home'],
    
    /**
     * Affiche une page spécifique
     */
    showPage: function(pageId) {
        try {
            // Masquer toutes les pages
            const pages = document.querySelectorAll('.page');
            pages.forEach(page => {
                page.classList.remove('active');
            });
            
            // Afficher la page demandée
            const targetPage = document.getElementById(pageId);
            if (targetPage) {
                targetPage.classList.add('active');
                
                // Mettre à jour l'historique
                if (this.currentPage !== pageId) {
                    this.history.push(pageId);
                    if (this.history.length > 10) {
                        this.history.shift(); // Limiter l'historique
                    }
                }
                
                this.currentPage = pageId;
                
                // Mettre à jour les boutons de navigation
                this.updateNavigationButtons();
                
                // Initialiser le contenu de la page
                this.initializePage(pageId);
                
                // Scroll vers le haut
                window.scrollTo(0, 0);
                
                console.log('📄 Page affichée:', pageId);
                
                // Vibration légère sur mobile
                if (DEVICE_INFO.isMobile) {
                    MobileUtils.vibrate([50]);
                }
                
                return true;
            } else {
                console.error('❌ Page non trouvée:', pageId);
                return false;
            }
        } catch (error) {
            console.error('❌ Erreur navigation:', error);
            DebugUtils.logError(error, 'NavigationManager.showPage');
            return false;
        }
    },
    
    /**
     * Revient à la page précédente
     */
    goBack: function() {
        if (this.history.length > 1) {
            this.history.pop(); // Retirer la page actuelle
            const previousPage = this.history[this.history.length - 1];
            this.showPage(previousPage);
        } else {
            this.showPage('home');
        }
    },
    
    /**
     * Met à jour les boutons de navigation
     */
    updateNavigationButtons: function() {
        const buttons = document.querySelectorAll('.navigation .btn');
        buttons.forEach(button => {
            button.classList.remove('active');
        });
        
        // Marquer le bouton actif si disponible
        const activeButton = document.querySelector(`.navigation .btn[onclick*="'${this.currentPage}'"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    },
    
    /**
     * Initialise le contenu d'une page
     */
    initializePage: function(pageId) {
        switch (pageId) {
            case 'home':
                this.initializeHomePage();
                break;
            case 'match':
                this.initializeMatchPage();
                break;
            case 'live':
                this.initializeLivePage();
                break;
            case 'settings':
                this.initializeSettingsPage();
                break;
            default:
                console.warn('⚠️ Page non reconnue:', pageId);
        }
    },
    
    /**
     * Initialise la page d'accueil
     */
    initializeHomePage: function() {
        const matchList = MatchStorage.getMatchList();
        const savedMatchesDiv = document.getElementById('savedMatches');
        
        if (savedMatchesDiv) {
            if (matchList.length > 0) {
                savedMatchesDiv.innerHTML = `
                    <h3>📁 Matchs sauvegardés</h3>
                    <div class="saved-matches-list">
                        ${matchList.map(match => this.createMatchCard(match)).join('')}
                    </div>
                `;
            } else {
                savedMatchesDiv.innerHTML = `
                    <div class="empty-state">
                        <h3>🆕 Aucun match sauvegardé</h3>
                        <p>Commencez par créer votre premier match !</p>
                    </div>
                `;
            }
        }
        
        // Vérifier s'il y a un match live en cours
        this.checkLiveMatch();
    },
    
    /**
     * Crée une carte pour un match sauvegardé
     */
    createMatchCard: function(match) {
        const date = new Date(match.date).toLocaleDateString('fr-FR');
        const time = new Date(match.lastSaved).toLocaleTimeString('fr-FR');
        
        return `
            <div class="match-card" onclick="loadSavedMatch('${match.id}')">
                <div class="match-header">
                    <strong>${match.team1} vs ${match.team2}</strong>
                    ${match.isLive ? '<span class="live-badge">🔴 LIVE</span>' : ''}
                </div>
                <div class="match-score">
                    ${match.score.team1} - ${match.score.team2}
                </div>
                <div class="match-info">
                    📅 ${date} • ⏰ ${time}
                </div>
                <div class="match-actions">
                    <button class="btn btn-small btn-primary" onclick="event.stopPropagation(); loadSavedMatch('${match.id}')">
                        📂 Charger
                    </button>
                    <button class="btn btn-small btn-secondary" onclick="event.stopPropagation(); deleteMatch('${match.id}')">
                        🗑️ Supprimer
                    </button>
                </div>
            </div>
        `;
    },
    
    /**
     * Vérifie s'il y a un match live en cours
     */
    checkLiveMatch: function() {
        const urlParams = new URLSearchParams(window.location.search);
        const liveId = urlParams.get('live');
        
        if (liveId) {
            console.log('🔴 Mode Live détecté:', liveId);
            this.showPage('live');
            return;
        }
        
        // Vérifier si il y a un match live sauvegardé
        const matchList = MatchStorage.getMatchList();
        const liveMatch = matchList.find(match => match.isLive);
        
        if (liveMatch) {
            const continueBtn = document.createElement('button');
            continueBtn.className = 'btn btn-warning';
            continueBtn.innerHTML = '🔴 Continuer le match live';
            continueBtn.onclick = () => this.resumeLiveMatch(liveMatch.id);
            
            const quickActions = document.querySelector('.quick-actions');
            if (quickActions) {
                quickActions.appendChild(continueBtn);
            }
        }
    },
    
    /**
     * Reprend un match live
     */
    resumeLiveMatch: function(matchId) {
        try {
            const matchData = MatchStorage.loadLiveMatch(matchId);
            if (matchData) {
                // Charger les données dans l'état global
                window.currentMatch = matchData;
                window.stats = matchData.stats || { team1: {}, team2: {} };
                window.events = matchData.events || [];
                window.players = matchData.players || [];
                
                this.showPage('live');
                
                // Redémarrer les mises à jour live
                if (typeof startLiveUpdates === 'function') {
                    startLiveUpdates();
                }
                
                NotificationUtils.show('Match live repris', 'success');
            } else {
                NotificationUtils.show('Impossible de reprendre le match', 'error');
            }
        } catch (error) {
            console.error('❌ Erreur reprise match live:', error);
            NotificationUtils.show('Erreur lors de la reprise', 'error');
        }
    },
    
    /**
     * Initialise la page de création de match
     */
    initializeMatchPage: function() {
        const matchForm = document.getElementById('matchForm');
        if (matchForm) {
            matchForm.innerHTML = this.createMatchForm();
        }
    },
    
    /**
     * Crée le formulaire de création de match
     */
    createMatchForm: function() {
        return `
            <form id="newMatchForm" onsubmit="createNewMatch(event)">
                <div class="form-group">
                    <label for="team1Name">Nom de votre équipe</label>
                    <input type="text" id="team1Name" required 
                           placeholder="Entrez le nom de votre équipe" 
                           maxlength="30">
                </div>
                
                <div class="form-group">
                    <label for="team2Name">Nom de l'équipe adverse</label>
                    <input type="text" id="team2Name" required 
                           placeholder="Entrez le nom de l'équipe adverse" 
                           maxlength="30">
                </div>
                
                <div class="form-group">
                    <label for="matchDuration">Durée du match (minutes)</label>
                    <select id="matchDuration">
                        <option value="45">45 minutes (une mi-temps)</option>
                        <option value="90" selected>90 minutes (deux mi-temps)</option>
                        <option value="120">120 minutes (avec prolongations)</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="formation">Formation</label>
                    <select id="formation">
                        ${Object.entries(FORMATIONS).map(([key, formation]) => 
                            `<option value="${key}">${formation.name}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="match-actions">
                    <button type="submit" class="btn btn-primary">
                        ⚽ Créer le match
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="showPage('home')">
                        ❌ Annuler
                    </button>
                </div>
            </form>
            
            <div id="teamSetup" style="display: none;">
                <!-- Le setup des équipes sera ajouté ici -->
            </div>
        `;
    },
    
    /**
     * Initialise la page live
     */
    initializeLivePage: function() {
        const liveContent = document.getElementById('liveContent');
        if (liveContent) {
            // Vérifier s'il y a des données de match
            if (window.currentMatch) {
                this.displayLiveMatch();
            } else {
                liveContent.innerHTML = `
                    <div class="live-loading">
                        <div class="loading-spinner"></div>
                        <h3>🔄 Connexion au match...</h3>
                        <p>Patientez pendant le chargement des données</p>
                    </div>
                `;
                
                // Essayer de charger depuis l'URL
                this.loadLiveFromURL();
            }
        }
    },
    
    /**
     * Charge un match live depuis l'URL
     */
    loadLiveFromURL: function() {
        const urlParams = new URLSearchParams(window.location.search);
        const liveId = urlParams.get('live');
        
        if (liveId) {
            const matchData = MatchStorage.loadLiveMatch(liveId);
            if (matchData) {
                window.currentMatch = matchData;
                window.stats = matchData.stats || { team1: {}, team2: {} };
                window.events = matchData.events || [];
                window.players = matchData.players || [];
                
                this.displayLiveMatch();
                
                // Démarrer les mises à jour
                if (typeof startLiveUpdates === 'function') {
                    startLiveUpdates();
                }
            } else {
                this.showMatchNotFound();
            }
        } else {
            this.showLiveError();
        }
    },
    
    /**
     * Affiche le match live
     */
    displayLiveMatch: function() {
        if (typeof showLiveMatch === 'function') {
            showLiveMatch();
        } else {
            console.error('❌ Fonction showLiveMatch non trouvée');
        }
    },
    
    /**
     * Affiche l'erreur match non trouvé
     */
    showMatchNotFound: function() {
        const liveContent = document.getElementById('liveContent');
        if (liveContent) {
            liveContent.innerHTML = `
                <div style="text-align: center; padding: 50px;">
                    <h2>❌ Match non trouvé</h2>
                    <p style="margin: 20px 0;">Ce lien de match n'est plus valide ou n'existe pas.</p>
                    <button class="btn btn-primary" onclick="showPage('home')">
                        🏠 Retour à l'accueil
                    </button>
                </div>
            `;
        }
    },
    
    /**
     * Affiche l'erreur de live
     */
    showLiveError: function() {
        const liveContent = document.getElementById('liveContent');
        if (liveContent) {
            liveContent.innerHTML = `
                <div style="text-align: center; padding: 50px;">
                    <h2>⚠️ Aucun match live</h2>
                    <p style="margin: 20px 0;">Aucun match en cours n'a été trouvé.</p>
                    <button class="btn btn-primary" onclick="showPage('match')">
                        ⚽ Créer un nouveau match
                    </button>
                    <button class="btn btn-secondary" onclick="showPage('home')">
                        🏠 Retour à l'accueil
                    </button>
                </div>
            `;
        }
    },
    
    /**
     * Initialise la page des paramètres
     */
    initializeSettingsPage: function() {
        const settingsForm = document.getElementById('settingsForm');
        if (settingsForm) {
            const settings = SettingsStorage.load();
            settingsForm.innerHTML = this.createSettingsForm(settings);
        }
    },
    
    /**
     * Crée le formulaire des paramètres
     */
    createSettingsForm: function(settings) {
        return `
            <form id="userSettingsForm" onsubmit="saveSettings(event)">
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="notifications" 
                               ${settings.notifications ? 'checked' : ''}>
                        Activer les notifications
                    </label>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="vibrations" 
                               ${settings.vibrations ? 'checked' : ''}>
                        Activer les vibrations (mobile)
                    </label>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="autoSave" 
                               ${settings.autoSave ? 'checked' : ''}>
                        Sauvegarde automatique
                    </label>
                </div>
                
                <div class="form-group">
                    <label for="matchDurationDefault">Durée de match par défaut</label>
                    <select id="matchDurationDefault">
                        <option value="45" ${settings.matchDuration === 45 ? 'selected' : ''}>45 minutes</option>
                        <option value="90" ${settings.matchDuration === 90 ? 'selected' : ''}>90 minutes</option>
                        <option value="120" ${settings.matchDuration === 120 ? 'selected' : ''}>120 minutes</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="debugMode" 
                               ${settings.debugMode ? 'checked' : ''}>
                        Mode debug (développeurs)
                    </label>
                </div>
                
                <div class="settings-actions">
                    <button type="submit" class="btn btn-primary">
                        💾 Sauvegarder
                    </button>
                    <button type="button" class="btn btn-warning" onclick="resetSettings()">
                        🔄 Réinitialiser
                    </button>
                    <button type="button" class="btn btn-info" onclick="exportData()">
                        📤 Exporter données
                    </button>
                </div>
            </form>
            
            <div class="storage-info">
                <h3>📊 Informations de stockage</h3>
                <div id="storageStats"></div>
            </div>
        `;
    }
};

// Fonctions globales pour la navigation (appelées depuis HTML)
function showPage(pageId) {
    return NavigationManager.showPage(pageId);
}

function goBack() {
    return NavigationManager.goBack();
}

// Gestionnaire du bouton retour mobile
if (DEVICE_INFO.isMobile) {
    // Intercepter le bouton retour Android
    window.addEventListener('popstate', function(event) {
        NavigationManager.goBack();
    });
}

// CSS pour les cartes de match (ajouté dynamiquement)
if (!document.getElementById('matchCardStyles')) {
    const style = document.createElement('style');
    style.id = 'matchCardStyles';
    style.textContent = `
        .saved-matches-list {
            display: grid;
            gap: 15px;
            margin-top: 20px;
        }
        
        .match-card {
            background: rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        .match-card:hover {
            background: rgba(255,255,255,0.15);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        
        .match-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            font-size: 1.1em;
        }
        
        .live-badge {
            background: #e74c3c;
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        
        .match-score {
            font-size: 1.5em;
            font-weight: bold;
            text-align: center;
            margin: 10px 0;
            color: #3498db;
        }
        
        .match-info {
            font-size: 0.9em;
            color: rgba(255,255,255,0.8);
            margin-bottom: 15px;
        }
        
        .match-actions {
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        
        .empty-state {
            text-align: center;
            padding: 40px;
            color: rgba(255,255,255,0.8);
        }
        
        .storage-info {
            margin-top: 30px;
            padding: 20px;
            background: rgba(255,255,255,0.05);
            border-radius: 12px;
        }
    `;
    document.head.appendChild(style);
}

// Export si module ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        NavigationManager,
        showPage,
        goBack
    };
}