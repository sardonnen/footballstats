/**
 * Logique de gestion des matchs pour l'application Football Stats
 */

// Variables globales pour le match en cours
window.currentMatch = null;
window.stats = { team1: {}, team2: {} };
window.events = [];
window.players = [];
window.gameSettings = {};
window.matchTimer = null;
window.currentTime = 0;
window.isMatchRunning = false;

const MatchManager = {
    
    /**
     * Crée un nouveau match
     */
    createNewMatch: function(formData) {
        try {
            // Validation des données
            if (!this.validateMatchData(formData)) {
                NotificationUtils.show('Données du match invalides', 'error');
                return false;
            }
            
            const matchId = Utils.generateMatchId();
            const matchData = {
                id: matchId,
                team1: {
                    name: Utils.sanitizeString(formData.team1Name),
                    players: [],
                    formation: formData.formation || '4-4-2'
                },
                team2: {
                    name: Utils.sanitizeString(formData.team2Name),
                    players: [],
                    formation: formData.formation || '4-4-2'
                },
                duration: parseInt(formData.matchDuration) || 90,
                date: new Date().toISOString(),
                score: { team1: 0, team2: 0 },
                isLive: false,
                status: 'setup',
                events: [],
                stats: { team1: {}, team2: {} }
            };
            
            // Sauvegarder le match
            window.currentMatch = matchData;
            window.stats = matchData.stats;
            window.events = matchData.events;
            window.gameSettings = {
                duration: matchData.duration,
                formation: matchData.team1.formation
            };
            
            const saved = MatchStorage.saveMatch(matchData);
            if (saved) {
                console.log('✅ Nouveau match créé:', matchId);
                return matchId;
            } else {
                throw new Error('Erreur lors de la sauvegarde');
            }
            
        } catch (error) {
            console.error('❌ Erreur création match:', error);
            DebugUtils.logError(error, 'MatchManager.createNewMatch');
            NotificationUtils.show('Erreur lors de la création du match', 'error');
            return false;
        }
    },
    
    /**
     * Valide les données du match
     */
    validateMatchData: function(data) {
        if (!data.team1Name || !Utils.validateTeamName(data.team1Name)) {
            NotificationUtils.show('Nom de votre équipe invalide', 'error');
            return false;
        }
        
        if (!data.team2Name || !Utils.validateTeamName(data.team2Name)) {
            NotificationUtils.show('Nom de l\'équipe adverse invalide', 'error');
            return false;
        }
        
        if (data.team1Name.toLowerCase() === data.team2Name.toLowerCase()) {
            NotificationUtils.show('Les noms d\'équipes doivent être différents', 'error');
            return false;
        }
        
        const duration = parseInt(data.matchDuration);
        if (isNaN(duration) || duration < 1 || duration > 180) {
            NotificationUtils.show('Durée du match invalide', 'error');
            return false;
        }
        
        return true;
    },
    
    /**
     * Configure les équipes et joueurs
     */
    setupTeams: function(matchId) {
        const teamSetupDiv = document.getElementById('teamSetup');
        if (!teamSetupDiv) return;
        
        teamSetupDiv.style.display = 'block';
        teamSetupDiv.innerHTML = this.createTeamSetupForm();
        
        // Pré-remplir avec des joueurs par défaut
        this.generateDefaultPlayers();
    },
    
    /**
     * Crée le formulaire de configuration des équipes
     */
    createTeamSetupForm: function() {
        const formation = window.gameSettings.formation || '4-4-2';
        const positions = FORMATIONS[formation].positions;
        
        return `
            <h3>👥 Configuration des équipes</h3>
            
            <div class="team-setup-container">
                <div class="team-setup-section">
                    <h4>🟢 ${window.currentMatch.team1.name}</h4>
                    <div id="team1Players" class="players-grid">
                        ${this.createPlayerInputs('team1', positions)}
                    </div>
                </div>
                
                <div class="team-setup-section">
                    <h4>🔴 ${window.currentMatch.team2.name}</h4>
                    <div id="team2Players" class="players-grid">
                        ${this.createPlayerInputs('team2', positions)}
                    </div>
                </div>
            </div>
            
            <div class="team-actions">
                <button class="btn btn-primary" onclick="startMatch()">
                    🚀 Lancer le match
                </button>
                <button class="btn btn-warning" onclick="generateDefaultPlayers()">
                    🎲 Joueurs automatiques
                </button>
                <button class="btn btn-secondary" onclick="showPage('match')">
                    ← Retour
                </button>
            </div>
        `;
    },
    
    /**
     * Crée les inputs pour les joueurs
     */
    createPlayerInputs: function(teamKey, positions) {
        let html = '';
        let playerNumber = 1;
        
        Object.entries(positions).forEach(([position, count]) => {
            html += `<div class="position-group">`;
            html += `<h5>${PLAYER_POSITIONS[position]} (${count})</h5>`;
            
            for (let i = 0; i < count; i++) {
                html += `
                    <div class="player-input">
                        <input type="text" 
                               id="${teamKey}_player_${playerNumber}" 
                               placeholder="Joueur ${playerNumber}" 
                               data-position="${position}"
                               data-number="${playerNumber}"
                               maxlength="25">
                        <span class="player-number">#${playerNumber}</span>
                    </div>
                `;
                playerNumber++;
            }
            html += `</div>`;
        });
        
        return html;
    },
    
    /**
     * Génère des joueurs par défaut
     */
    generateDefaultPlayers: function() {
        const defaultNames = [
            'Dupont', 'Martin', 'Bernard', 'Dubois', 'Thomas',
            'Robert', 'Petit', 'Durand', 'Leroy', 'Moreau',
            'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia',
            'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier',
            'Morel', 'Girard', 'Andre', 'Lefevre', 'Mercier'
        ];
        
        ['team1', 'team2'].forEach(teamKey => {
            const playerInputs = document.querySelectorAll(`#${teamKey}Players input`);
            playerInputs.forEach((input, index) => {
                if (!input.value.trim()) {
                    const randomName = defaultNames[Math.floor(Math.random() * defaultNames.length)];
                    input.value = randomName;
                }
            });
        });
        
        NotificationUtils.show('Joueurs générés automatiquement', 'success');
    },
    
    /**
     * Lance le match
     */
    startMatch: function() {
        try {
            // Collecter les joueurs
            const team1Players = this.collectPlayers('team1');
            const team2Players = this.collectPlayers('team2');
            
            if (!this.validatePlayers(team1Players, team2Players)) {
                return false;
            }
            
            // Mettre à jour les données du match
            window.currentMatch.team1.players = team1Players;
            window.currentMatch.team2.players = team2Players;
            window.currentMatch.isLive = true;
            window.currentMatch.status = 'live';
            window.players = [...team1Players, ...team2Players];
            
            // Initialiser les statistiques
            this.initializeStats();
            
            // Sauvegarder le match live
            const matchId = MatchStorage.saveLiveMatch(window.currentMatch.id, window.currentMatch);
            
            if (matchId) {
                // Générer et afficher le lien live
                this.generateLiveLink();
                
                // Démarrer le timer
                this.startTimer();
                
                // Afficher la vue live
                NavigationManager.showPage('live');
                
                NotificationUtils.show('Match lancé !', 'success');
                MobileUtils.vibrate([100, 50, 100]);
                
                return true;
            } else {
                throw new Error('Erreur lors de la sauvegarde live');
            }
            
        } catch (error) {
            console.error('❌ Erreur lancement match:', error);
            DebugUtils.logError(error, 'MatchManager.startMatch');
            NotificationUtils.show('Erreur lors du lancement', 'error');
            return false;
        }
    },
    
    /**
     * Collecte les joueurs depuis les inputs
     */
    collectPlayers: function(teamKey) {
        const players = [];
        const playerInputs = document.querySelectorAll(`#${teamKey}Players input`);
        
        playerInputs.forEach(input => {
            const name = input.value.trim();
            if (name) {
                players.push({
                    id: Utils.generateId(),
                    name: Utils.sanitizeString(name),
                    number: parseInt(input.dataset.number),
                    position: input.dataset.position,
                    team: teamKey,
                    isActive: true,
                    stats: {
                        goals: 0,
                        assists: 0,
                        yellowCards: 0,
                        redCards: 0,
                        saves: 0,
                        fouls: 0
                    }
                });
            }
        });
        
        return players;
    },
    
    /**
     * Valide les joueurs
     */
    validatePlayers: function(team1Players, team2Players) {
        if (team1Players.length < 7) {
            NotificationUtils.show('Votre équipe doit avoir au moins 7 joueurs', 'error');
            return false;
        }
        
        if (team2Players.length < 7) {
            NotificationUtils.show('L\'équipe adverse doit avoir au moins 7 joueurs', 'error');
            return false;
        }
        
        // Vérifier les numéros uniques par équipe
        const team1Numbers = team1Players.map(p => p.number);
        const team2Numbers = team2Players.map(p => p.number);
        
        if (new Set(team1Numbers).size !== team1Numbers.length) {
            NotificationUtils.show('Numéros de joueurs dupliqués dans votre équipe', 'error');
            return false;
        }
        
        if (new Set(team2Numbers).size !== team2Numbers.length) {
            NotificationUtils.show('Numéros de joueurs dupliqués dans l\'équipe adverse', 'error');
            return false;
        }
        
        return true;
    },
    
    /**
     * Initialise les statistiques du match
     */
    initializeStats: function() {
        window.stats = {
            team1: {
                goals: 0,
                assists: 0,
                saves: 0,
                fouls: 0,
                yellowCards: 0,
                redCards: 0,
                corners: 0,
                offsides: 0,
                possession: 50
            },
            team2: {
                goals: 0,
                assists: 0,
                saves: 0,
                fouls: 0,
                yellowCards: 0,
                redCards: 0,
                corners: 0,
                offsides: 0,
                possession: 50
            }
        };
    },
    
    /**
     * Démarre le timer du match
     */
    startTimer: function() {
        window.currentTime = 0;
        window.isMatchRunning = true;
        
        if (window.matchTimer) {
            clearInterval(window.matchTimer);
        }
        
        window.matchTimer = setInterval(() => {
            if (window.isMatchRunning) {
                window.currentTime++;
                this.updateTimerDisplay();
                
                // Auto-sauvegarde toutes les 30 secondes
                if (window.currentTime % 30 === 0) {
                    this.autoSave();
                }
            }
        }, 1000);
        
        console.log('⏱️ Timer démarré');
    },
    
    /**
     * Met à jour l'affichage du timer
     */
    updateTimerDisplay: function() {
        const timerElement = document.getElementById('matchTimer');
        if (timerElement) {
            const minutes = Math.floor(window.currentTime / 60);
            const seconds = window.currentTime % 60;
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Changer la couleur selon le temps
            if (minutes >= 45 && minutes < 90) {
                timerElement.style.backgroundColor = '#f39c12'; // Orange pour la 2e mi-temps
            } else if (minutes >= 90) {
                timerElement.style.backgroundColor = '#e74c3c'; // Rouge pour les prolongations
            }
        }
    },
    
    /**
     * Pause/Reprend le match
     */
    toggleMatch: function() {
        window.isMatchRunning = !window.isMatchRunning;
        
        const toggleButton = document.getElementById('toggleMatchButton');
        if (toggleButton) {
            toggleButton.textContent = window.isMatchRunning ? '⏸️ Pause' : '▶️ Reprendre';
            toggleButton.className = window.isMatchRunning ? 'btn btn-warning' : 'btn btn-primary';
        }
        
        NotificationUtils.show(
            window.isMatchRunning ? 'Match repris' : 'Match en pause', 
            'info'
        );
        
        console.log('⏯️ Match', window.isMatchRunning ? 'repris' : 'en pause');
    },
    
    /**
     * Termine le match
     */
    endMatch: function() {
        if (confirm('Êtes-vous sûr de vouloir terminer le match ?')) {
            window.isMatchRunning = false;
            
            if (window.matchTimer) {
                clearInterval(window.matchTimer);
                window.matchTimer = null;
            }
            
            // Mettre à jour le statut
            if (window.currentMatch) {
                window.currentMatch.status = 'finished';
                window.currentMatch.isLive = false;
                window.currentMatch.finalTime = window.currentTime;
                
                // Sauvegarder le match final
                MatchStorage.saveMatch(window.currentMatch);
            }
            
            NotificationUtils.show('Match terminé !', 'success');
            MobileUtils.vibrate([200, 100, 200, 100, 200]);
            
            // Afficher le résumé
            this.showMatchSummary();
            
            console.log('🏁 Match terminé');
        }
    },
    
    /**
     * Affiche le résumé du match
     */
    showMatchSummary: function() {
        const liveContent = document.getElementById('liveContent');
        if (liveContent && window.currentMatch) {
            const score = window.currentMatch.score;
            const totalEvents = window.events.length;
            
            liveContent.innerHTML = `
                <div class="match-summary">
                    <h2>🏆 Match terminé !</h2>
                    
                    <div class="final-score">
                        <h3>${window.currentMatch.team1.name} ${score.team1} - ${score.team2} ${window.currentMatch.team2.name}</h3>
                    </div>
                    
                    <div class="match-stats-summary">
                        <p>⏱️ Durée: ${Utils.formatMatchTime(window.currentTime)}</p>
                        <p>📊 Total événements: ${totalEvents}</p>
                        <p>⚽ Buts: ${window.stats.team1.goals + window.stats.team2.goals}</p>
                    </div>
                    
                    <div class="summary-actions">
                        <button class="btn btn-primary" onclick="showPage('home')">
                            🏠 Retour à l'accueil
                        </button>
                        <button class="btn btn-secondary" onclick="shareMatchResults()">
                            🔗 Partager les résultats
                        </button>
                    </div>
                </div>
            `;
        }
    },
    
    /**
     * Auto-sauvegarde
     */
    autoSave: function() {
        if (window.currentMatch) {
            // Mettre à jour les données
            window.currentMatch.events = window.events;
            window.currentMatch.stats = window.stats;
            window.currentMatch.currentTime = window.currentTime;
            window.currentMatch.lastUpdate = Date.now();
            
            // Sauvegarder
            MatchStorage.saveLiveMatch(window.currentMatch.id, window.currentMatch);
            
            if (APP_CONFIG.debug) {
                console.log('💾 Auto-sauvegarde effectuée');
            }
        }
    },
    
    /**
     * Génère le lien live
     */
    generateLiveLink: function() {
        try {
            const liveUrl = APP_URLS.live(window.currentMatch.id);
            
            // Créer l'input pour le lien
            const linkContainer = document.createElement('div');
            linkContainer.innerHTML = `
                <div class="live-link-container">
                    <h3>🔗 Lien de partage live</h3>
                    <div class="link-input-group">
                        <input type="text" id="liveLink" value="${liveUrl}" readonly>
                        <button class="btn btn-primary" onclick="copyLiveLink()">
                            📋 Copier
                        </button>
                    </div>
                    <p class="link-info">Partagez ce lien pour que d'autres puissent suivre le match en direct !</p>
                </div>
            `;
            
            // Ajouter avant le contenu live
            const liveContent = document.getElementById('liveContent');
            if (liveContent) {
                liveContent.insertBefore(linkContainer, liveContent.firstChild);
            }
            
            // Auto-copie sur mobile
            if (DEVICE_INFO.isMobile) {
                setTimeout(() => {
                    this.copyLiveLink();
                }, 1000);
            }
            
            NotificationUtils.show('Lien live généré !', 'success');
            
        } catch (error) {
            console.error('❌ Erreur génération lien:', error);
            NotificationUtils.show('Erreur génération lien', 'error');
        }
    },
    
    /**
     * Copie le lien live
     */
    copyLiveLink: async function() {
        const linkInput = document.getElementById('liveLink');
        if (!linkInput) return false;
        
        const link = linkInput.value;
        
        try {
            // Partage natif mobile
            if (MobileUtils.canShare()) {
                const shared = await MobileUtils.share({
                    title: 'Match Live - Football Stats',
                    text: `Suivez le match ${window.currentMatch.team1.name} vs ${window.currentMatch.team2.name} en direct !`,
                    url: link
                });
                
                if (shared) {
                    NotificationUtils.show('Lien partagé !', 'success');
                    return true;
                }
            }
            
            // Copie dans le presse-papiers
            const copied = await MobileUtils.copyToClipboard(link);
            if (copied) {
                NotificationUtils.show('Lien copié !', 'success');
                return true;
            } else {
                throw new Error('Copie échouée');
            }
            
        } catch (error) {
            console.error('❌ Erreur copie lien:', error);
            
            // Fallback - sélectionner le texte
            linkInput.focus();
            linkInput.select();
            linkInput.setSelectionRange(0, 99999);
            
            NotificationUtils.show('Veuillez copier manuellement le lien sélectionné', 'info');
            return false;
        }
    }
};

// Fonctions globales pour les événements HTML
function createNewMatch(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {
        team1Name: formData.get('team1Name'),
        team2Name: formData.get('team2Name'),
        matchDuration: formData.get('matchDuration'),
        formation: formData.get('formation')
    };
    
    const matchId = MatchManager.createNewMatch(data);
    if (matchId) {
        MatchManager.setupTeams(matchId);
    }
}

function generateDefaultPlayers() {
    MatchManager.generateDefaultPlayers();
}

function startMatch() {
    MatchManager.startMatch();
}

function toggleMatch() {
    MatchManager.toggleMatch();
}

function endMatch() {
    MatchManager.endMatch();
}

function copyLiveLink() {
    MatchManager.copyLiveLink();
}

function startNewMatch() {
    NavigationManager.showPage('match');
}

function loadSavedMatches() {
    // Sera implémenté dans navigation.js
    NavigationManager.initializeHomePage();
}

function loadSavedMatch(matchId) {
    try {
        const matchData = MatchStorage.loadMatch(matchId);
        if (matchData) {
            window.currentMatch = matchData;
            window.stats = matchData.stats || { team1: {}, team2: {} };
            window.events = matchData.events || [];
            window.players = matchData.players || [];
            
            if (matchData.isLive) {
                NavigationManager.showPage('live');
            } else {
                NavigationUtils.show('Match chargé', 'success');
                // Afficher les options pour reprendre ou consulter
            }
        }
    } catch (error) {
        console.error('❌ Erreur chargement match:', error);
        NotificationUtils.show('Erreur lors du chargement', 'error');
    }
}

function deleteMatch(matchId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce match ?')) {
        const deleted = MatchStorage.deleteMatch(matchId);
        if (deleted) {
            // Rafraîchir la liste
            NavigationManager.initializeHomePage();
        }
    }
}

function shareMatchResults() {
    if (window.currentMatch) {
        const score = window.currentMatch.score;
        const message = `Résultat: ${window.currentMatch.team1.name} ${score.team1} - ${score.team2} ${window.currentMatch.team2.name}`;
        
        MobileUtils.share({
            title: 'Résultat du match - Football Stats',
            text: message
        });
    }
}

// CSS pour le setup des équipes
if (!document.getElementById('teamSetupStyles')) {
    const style = document.createElement('style');
    style.id = 'teamSetupStyles';
    style.textContent = `
        .team-setup-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin: 20px 0;
        }
        
        .team-setup-section {
            background: rgba(255,255,255,0.05);
            padding: 20px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .players-grid {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .position-group {
            margin-bottom: 20px;
        }
        
        .position-group h5 {
            color: #3498db;
            margin-bottom: 10px;
            font-size: 1.1em;
        }
        
        .player-input {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
        }
        
        .player-input input {
            flex: 1;
            padding: 10px;
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 6px;
            background: rgba(255,255,255,0.1);
            color: white;
        }
        
        .player-number {
            background: #3498db;
            color: white;
            padding: 8px 12px;
            border-radius: 50%;
            font-weight: bold;
            min-width: 40px;
            text-align: center;
            font-size: 12px;
        }
        
        .live-link-container {
            background: rgba(46, 204, 113, 0.1);
            border: 1px solid rgba(46, 204, 113, 0.3);
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 20px;
        }
        
        .link-input-group {
            display: flex;
            gap: 10px;
            margin: 10px 0;
        }
        
        .link-input-group input {
            flex: 1;
            padding: 12px;
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 6px;
            background: rgba(255,255,255,0.1);
            color: white;
            font-family: monospace;
        }
        
        .link-info {
            color: rgba(255,255,255,0.8);
            font-size: 14px;
            margin-top: 10px;
        }
        
        .match-summary {
            text-align: center;
            padding: 40px;
            background: rgba(255,255,255,0.1);
            border-radius: 16px;
        }
        
        .final-score {
            margin: 30px 0;
            padding: 20px;
            background: rgba(46, 204, 113, 0.2);
            border-radius: 12px;
        }
        
        .match-stats-summary {
            margin: 20px 0;
            color: rgba(255,255,255,0.9);
        }
        
        .summary-actions {
            margin-top: 30px;
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        @media (max-width: 768px) {
            .team-setup-container {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            
            .team-setup-section {
                padding: 15px;
            }
            
            .link-input-group {
                flex-direction: column;
            }
            
            .summary-actions {
                flex-direction: column;
            }
        }
    `;
    document.head.appendChild(style);
}

// Export si module ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MatchManager,
        createNewMatch,
        startMatch,
        toggleMatch,
        endMatch
    };
}