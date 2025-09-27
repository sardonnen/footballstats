/**
 * Logique de la vue live pour l'application Football Stats
 */

let liveUpdateInterval = null;

const LiveManager = {
    
    /**
     * Affiche le match en live
     */
    showLiveMatch: function() {
        const liveContent = document.getElementById('liveContent');
        if (!liveContent || !window.currentMatch) {
            console.error('❌ Pas de conteneur live ou de match');
            return;
        }
        
        liveContent.innerHTML = this.createLiveMatchHTML();
        this.updateLiveDisplay();
        this.bindLiveEvents();
        
        console.log('🔴 Vue live affichée');
    },
    
    /**
     * Crée le HTML pour le match live
     */
    createLiveMatchHTML: function() {
        const match = window.currentMatch;
        const score = match.score || { team1: 0, team2: 0 };
        
        return `
            <div class="live-header">
                <div class="live-time">
                    <span id="matchTimer">00:00</span>
                </div>
                
                <div class="team-names">
                    <span class="team1-name">${match.team1.name}</span>
                    <span class="live-score" id="liveScore">${score.team1} - ${score.team2}</span>
                    <span class="team2-name">${match.team2.name}</span>
                </div>
                
                <div class="match-controls">
                    <button id="toggleMatchButton" class="btn btn-warning" onclick="toggleMatch()">
                        ${window.isMatchRunning ? '⏸️ Pause' : '▶️ Reprendre'}
                    </button>
                    <button class="btn btn-secondary" onclick="endMatch()">
                        🏁 Terminer
                    </button>
                    ${DEVICE_INFO.isMobile ? '<button class="btn btn-info" onclick="toggleFullscreen()" id="fullscreenBtn">📱 Plein écran</button>' : ''}
                </div>
            </div>
            
            <!-- Structure tableau FIXE pour maintenir la disposition -->
            <div class="live-match-table">
                <div class="live-table-row">
                    <!-- Colonne actions de mon équipe -->
                    <div class="live-table-cell team-actions-column">
                        <div class="column-title">🟢 ${match.team1.name}</div>
                        <div class="team-actions" id="team1Actions">
                            ${this.createActionButtons('team1')}
                            <div class="player-selector">
                                <select id="team1PlayerSelect">
                                    <option value="">Sélectionner joueur...</option>
                                    ${this.createPlayerOptions('team1')}
                                </select>
                            </div>
                            <div class="quick-stats" id="team1Stats">
                                ${this.createQuickStats('team1')}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Colonne timeline centrale -->
                    <div class="live-table-cell timeline-column">
                        <div class="column-title">📈 Timeline</div>
                        <div class="timeline-events" id="timelineEvents">
                            <!-- Les événements seront ajoutés ici -->
                        </div>
                    </div>
                    
                    <!-- Colonne actions équipe adverse -->
                    <div class="live-table-cell opponent-actions-column">
                        <div class="column-title">🔴 ${match.team2.name}</div>
                        <div class="opponent-actions" id="team2Actions">
                            ${this.createActionButtons('team2')}
                            <div class="player-selector">
                                <select id="team2PlayerSelect">
                                    <option value="">Sélectionner joueur...</option>
                                    ${this.createPlayerOptions('team2')}
                                </select>
                            </div>
                            <div class="quick-stats" id="team2Stats">
                                ${this.createQuickStats('team2')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Zone de debug mobile (masquée par défaut) -->
            ${DEVICE_INFO.isMobile && APP_CONFIG.debug ? '<button class="btn btn-info" onclick="DebugUtils.enableMobileDebug()" style="position: fixed; bottom: 10px; right: 10px; z-index: 9998;">🔧 Debug</button>' : ''}
        `;
    },
    
    /**
     * Crée les boutons d'action pour une équipe
     */
    createActionButtons: function(teamKey) {
        return `
            <div class="action-buttons">
                <button class="action-btn goal" onclick="addEvent('${teamKey}', 'goal')">
                    ⚽ But
                </button>
                <button class="action-btn assist" onclick="addEvent('${teamKey}', 'assist')">
                    🎯 Passe D.
                </button>
                <button class="action-btn card" onclick="addEvent('${teamKey}', 'yellow_card')">
                    🟨 Carton J.
                </button>
                <button class="action-btn card" onclick="addEvent('${teamKey}', 'red_card')">
                    🟥 Carton R.
                </button>
                <button class="action-btn save" onclick="addEvent('${teamKey}', 'save')">
                    🥅 Arrêt
                </button>
                <button class="action-btn foul" onclick="addEvent('${teamKey}', 'foul')">
                    ⚠️ Faute
                </button>
            </div>
        `;
    },
    
    /**
     * Crée les options pour le sélecteur de joueurs
     */
    createPlayerOptions: function(teamKey) {
        const teamPlayers = window.players.filter(p => p.team === teamKey && p.isActive);
        return teamPlayers.map(player => 
            `<option value="${player.id}">#${player.number} ${player.name}</option>`
        ).join('');
    },
    
    /**
     * Crée les statistiques rapides
     */
    createQuickStats: function(teamKey) {
        const stats = window.stats[teamKey] || {};
        return `
            <div class="stat-item">⚽ ${stats.goals || 0}</div>
            <div class="stat-item">🎯 ${stats.assists || 0}</div>
            <div class="stat-item">🟨 ${stats.yellowCards || 0}</div>
            <div class="stat-item">🟥 ${stats.redCards || 0}</div>
            <div class="stat-item">🥅 ${stats.saves || 0}</div>
        `;
    },
    
    /**
     * Associe les événements de la vue live
     */
    bindLiveEvents: function() {
        // Gestion du changement de visibilité (mobile)
        if (DEVICE_INFO.isMobile) {
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) {
                    console.log('📱 App visible, mise à jour live');
                    this.updateLiveDisplay();
                }
            });
        }
        
        // Touches clavier pour actions rapides
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey || event.metaKey) {
                switch(event.key) {
                    case 'g':
                        event.preventDefault();
                        this.quickAddGoal();
                        break;
                    case ' ':
                        event.preventDefault();
                        toggleMatch();
                        break;
                }
            }
        });
    },
    
    /**
     * Ajoute un événement au match
     */
    addEvent: function(teamKey, eventType) {
        try {
            const playerSelect = document.getElementById(`${teamKey}PlayerSelect`);
            const playerId = playerSelect ? playerSelect.value : null;
            
            if (!playerId && ['goal', 'assist', 'yellow_card', 'red_card', 'save'].includes(eventType)) {
                NotificationUtils.show('Veuillez sélectionner un joueur', 'warning');
                return false;
            }
            
            const player = window.players.find(p => p.id === playerId);
            const event = {
                id: Utils.generateId(),
                type: eventType,
                team: teamKey,
                player: player || null,
                time: window.currentTime,
                timestamp: Date.now(),
                description: this.createEventDescription(eventType, player, teamKey)
            };
            
            // Ajouter l'événement
            window.events.unshift(event); // Ajouter en début pour affichage récent en haut
            
            // Mettre à jour les statistiques
            this.updateStats(teamKey, eventType, player);
            
            // Mettre à jour l'affichage
            this.updateLiveDisplay();
            
            // Vibration et notification mobile
            if (DEVICE_INFO.isMobile) {
                if (eventType === 'goal') {
                    MobileUtils.vibrate([200, 100, 200]);
                    MobileUtils.sendNotification('⚽ But marqué !', {
                        body: event.description,
                        icon: '/favicon.ico'
                    });
                } else {
                    MobileUtils.vibrate([100]);
                }
            }
            
            NotificationUtils.show(`${APP_CONFIG.eventIcons[eventType]} ${event.description}`, 'success');
            
            // Auto-sauvegarde
            MatchManager.autoSave();
            
            console.log('📊 Événement ajouté:', event);
            return true;
            
        } catch (error) {
            console.error('❌ Erreur ajout événement:', error);
            DebugUtils.logError(error, 'LiveManager.addEvent');
            NotificationUtils.show('Erreur lors de l\'ajout', 'error');
            return false;
        }
    },
    
    /**
     * Crée la description d'un événement
     */
    createEventDescription: function(eventType, player, teamKey) {
        const teamName = window.currentMatch[teamKey].name;
        const playerName = player ? `${player.name} (#${player.number})` : teamName;
        const time = Utils.formatMatchTime(window.currentTime);
        
        const descriptions = {
            goal: `But de ${playerName} (${time})`,
            assist: `Passe décisive de ${playerName} (${time})`,
            yellow_card: `Carton jaune pour ${playerName} (${time})`,
            red_card: `Carton rouge pour ${playerName} (${time})`,
            save: `Arrêt de ${playerName} (${time})`,
            foul: `Faute de ${teamName} (${time})`,
            substitution: `Changement pour ${teamName} (${time})`,
            corner: `Corner pour ${teamName} (${time})`,
            offside: `Hors-jeu de ${teamName} (${time})`
        };
        
        return descriptions[eventType] || `Événement ${eventType} (${time})`;
    },
    
    /**
     * Met à jour les statistiques
     */
    updateStats: function(teamKey, eventType, player) {
        // Statistiques d'équipe
        if (!window.stats[teamKey]) {
            window.stats[teamKey] = {};
        }
        
        if (!window.stats[teamKey][eventType + 's']) {
            window.stats[teamKey][eventType + 's'] = 0;
        }
        
        window.stats[teamKey][eventType + 's']++;
        
        // Statistiques individuelles
        if (player && player.stats) {
            if (!player.stats[eventType + 's']) {
                player.stats[eventType + 's'] = 0;
            }
            player.stats[eventType + 's']++;
        }
        
        // Gestion spéciale pour les buts
        if (eventType === 'goal') {
            window.currentMatch.score[teamKey]++;
        }
        
        console.log('📈 Stats mises à jour:', window.stats);
    },
    
    /**
     * Met à jour l'affichage live
     */
    updateLiveDisplay: function() {
        try {
            // Mettre à jour le score
            this.updateScore();
            
            // Mettre à jour la timeline
            this.updateTimeline();
            
            // Mettre à jour les stats rapides
            this.updateQuickStats();
            
            // Mettre à jour le timer
            if (typeof MatchManager.updateTimerDisplay === 'function') {
                MatchManager.updateTimerDisplay();
            }
            
        } catch (error) {
            console.error('❌ Erreur mise à jour live:', error);
            DebugUtils.logError(error, 'LiveManager.updateLiveDisplay');
        }
    },
    
    /**
     * Met à jour le score affiché
     */
    updateScore: function() {
        const scoreElement = document.getElementById('liveScore');
        if (scoreElement && window.currentMatch) {
            const score = window.currentMatch.score;
            scoreElement.textContent = `${score.team1} - ${score.team2}`;
        }
    },
    
    /**
     * Met à jour la timeline des événements
     */
    updateTimeline: function() {
        const timelineElement = document.getElementById('timelineEvents');
        if (!timelineElement) return;
        
        if (window.events.length === 0) {
            timelineElement.innerHTML = `
                <div class="no-events">
                    <p>🕘 Aucun événement pour le moment</p>
                    <p>Les actions apparaîtront ici en temps réel</p>
                </div>
            `;
            return;
        }
        
        // Afficher les événements récents (limiter sur mobile)
        const maxEvents = DEVICE_INFO.isMobile ? 20 : 50;
        const recentEvents = window.events.slice(0, maxEvents);
        
        timelineElement.innerHTML = recentEvents.map(event => {
            const eventColor = APP_CONFIG.eventColors[event.type] || '#3498db';
            const eventIcon = APP_CONFIG.eventIcons[event.type] || '📊';
            
            return `
                <div class="timeline-event ${event.type}" style="border-left-color: ${eventColor}">
                    <div class="event-time">${Utils.formatMatchTime(event.time)}</div>
                    <div class="event-description">
                        ${eventIcon} ${event.description}
                    </div>
                    <button class="remove-event-btn" onclick="removeEvent('${event.id}')" title="Supprimer">
                        ❌
                    </button>
                </div>
            `;
        }).join('');
    },
    
    /**
     * Met à jour les statistiques rapides
     */
    updateQuickStats: function() {
        ['team1', 'team2'].forEach(teamKey => {
            const statsElement = document.getElementById(`${teamKey}Stats`);
            if (statsElement) {
                statsElement.innerHTML = this.createQuickStats(teamKey);
            }
        });
    },
    
    /**
     * Supprime un événement
     */
    removeEvent: function(eventId) {
        if (!confirm('Supprimer cet événement ?')) return;
        
        try {
            const eventIndex = window.events.findIndex(e => e.id === eventId);
            if (eventIndex === -1) {
                NotificationUtils.show('Événement non trouvé', 'error');
                return;
            }
            
            const event = window.events[eventIndex];
            
            // Reverser les statistiques
            this.reverseStats(event);
            
            // Supprimer l'événement
            window.events.splice(eventIndex, 1);
            
            // Mettre à jour l'affichage
            this.updateLiveDisplay();
            
            // Auto-sauvegarde
            MatchManager.autoSave();
            
            NotificationUtils.show('Événement supprimé', 'info');
            MobileUtils.vibrate([50]);
            
            console.log('🗑️ Événement supprimé:', event);
            
        } catch (error) {
            console.error('❌ Erreur suppression événement:', error);
            NotificationUtils.show('Erreur lors de la suppression', 'error');
        }
    },
    
    /**
     * Inverse les statistiques lors de la suppression
     */
    reverseStats: function(event) {
        const teamKey = event.team;
        const eventType = event.type;
        
        // Statistiques d'équipe
        if (window.stats[teamKey] && window.stats[teamKey][eventType + 's']) {
            window.stats[teamKey][eventType + 's']--;
        }
        
        // Statistiques individuelles
        if (event.player && event.player.stats && event.player.stats[eventType + 's']) {
            event.player.stats[eventType + 's']--;
        }
        
        // Gestion spéciale pour les buts
        if (eventType === 'goal' && window.currentMatch.score[teamKey] > 0) {
            window.currentMatch.score[teamKey]--;
        }
    },
    
    /**
     * Démarre les mises à jour live automatiques
     */
    startLiveUpdates: function() {
        this.stopLiveUpdates(); // Arrêter l'ancien s'il existe
        
        liveUpdateInterval = setInterval(() => {
            try {
                // Vérifier s'il y a des changements depuis le stockage
                if (window.currentMatch && window.currentMatch.id) {
                    const latestData = MatchStorage.loadLiveMatch(window.currentMatch.id);
                    
                    if (latestData && latestData.lastUpdate > (window.currentMatch.lastUpdate || 0)) {
                        console.log('🔄 Nouvelles données détectées, mise à jour...');
                        
                        // Mettre à jour les données locales
                        window.stats = latestData.stats || window.stats;
                        window.events = latestData.events || window.events;
                        window.currentMatch = latestData;
                        
                        // Mettre à jour l'affichage
                        this.updateLiveDisplay();
                    }
                }
            } catch (error) {
                console.error('❌ Erreur mise à jour live:', error);
            }
        }, APP_CONFIG.mobile.updateInterval);
        
        console.log('🔄 Mises à jour live démarrées');
    },
    
    /**
     * Arrête les mises à jour live
     */
    stopLiveUpdates: function() {
        if (liveUpdateInterval) {
            clearInterval(liveUpdateInterval);
            liveUpdateInterval = null;
            console.log('⏸️ Mises à jour live arrêtées');
        }
    },
    
    /**
     * Initialise la vue live depuis l'URL
     */
    initializeLiveView: function() {
        const urlParams = new URLSearchParams(window.location.search);
        const liveId = urlParams.get('live');
        
        if (liveId) {
            console.log('🔴 Mode Live détecté, ID:', liveId);
            
            const matchData = MatchStorage.loadLiveMatch(liveId);
            
            if (matchData) {
                try {
                    // Charger les données
                    window.stats = matchData.stats || { team1: {}, team2: {} };
                    window.events = matchData.events || [];
                    window.players = matchData.players || [];
                    window.gameSettings = matchData.gameSettings || {};
                    window.currentMatch = matchData;
                    window.currentTime = matchData.currentTime || 0;
                    
                    // Afficher directement le live
                    this.showLiveMatch();
                    NavigationManager.showPage('live');
                    
                    // Démarrer les mises à jour
                    this.startLiveUpdates();
                    
                    console.log('✅ Live initialisé avec succès');
                    
                } catch (error) {
                    console.error('❌ Erreur parsing données match:', error);
                    this.showErrorAndRedirect();
                }
            } else {
                console.log('❌ Aucune donnée trouvée pour ce match');
                this.showErrorAndRedirect();
            }
        }
    },
    
    /**
     * Affiche une erreur et redirige
     */
    showErrorAndRedirect: function() {
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
     * Action rapide : ajouter un but
     */
    quickAddGoal: function() {
        // Ajouter un but pour l'équipe sélectionnée par défaut
        const team1Select = document.getElementById('team1PlayerSelect');
        if (team1Select && team1Select.value) {
            this.addEvent('team1', 'goal');
        } else {
            NotificationUtils.show('Sélectionnez un joueur pour ajouter un but', 'info');
        }
    },
    
    /**
     * Bascule le mode plein écran sur mobile
     */
    toggleMobileFullscreen: function() {
        const liveContainer = document.querySelector('.live-container');
        if (!liveContainer) return;
        
        if (liveContainer.classList.contains('live-fullscreen')) {
            liveContainer.classList.remove('live-fullscreen');
            document.getElementById('fullscreenBtn').textContent = '📱 Plein écran';
        } else {
            liveContainer.classList.add('live-fullscreen');
            document.getElementById('fullscreenBtn').textContent = '📱 Fenêtré';
        }
    }
};

// Fonctions globales pour les événements HTML
function showLiveMatch() {
    LiveManager.showLiveMatch();
}

function addEvent(teamKey, eventType) {
    return LiveManager.addEvent(teamKey, eventType);
}

function removeEvent(eventId) {
    LiveManager.removeEvent(eventId);
}

function startLiveUpdates() {
    LiveManager.startLiveUpdates();
}

function stopLiveUpdates() {
    LiveManager.stopLiveUpdates();
}

function toggleFullscreen() {
    if (DEVICE_INFO.isMobile) {
        LiveManager.toggleMobileFullscreen();
    } else {
        MobileUtils.toggleFullscreen();
    }
}

// CSS spécifique pour les événements (si pas déjà inclus)
if (!document.getElementById('liveEventsStyles')) {
    const style = document.createElement('style');
    style.id = 'liveEventsStyles';
    style.textContent = `
        .no-events {
            text-align: center;
            padding: 40px 20px;
            color: rgba(255,255,255,0.6);
        }
        
        .remove-event-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            background: none;
            border: none;
            color: rgba(255,255,255,0.6);
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            font-size: 12px;
            transition: all 0.2s ease;
        }
        
        .remove-event-btn:hover {
            background: rgba(231, 76, 60, 0.8);
            color: white;
        }
        
        .timeline-event {
            position: relative;
            padding-right: 35px;
        }
        
        .player-selector {
            margin: 15px 0;
        }
        
        .player-selector select {
            width: 100%;
            padding: 10px;
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 6px;
            background: rgba(255,255,255,0.1);
            color: white;
            font-size: 14px;
        }
        
        .quick-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-top: 15px;
        }
        
        .stat-item {
            background: rgba(255,255,255,0.1);
            padding: 8px;
            border-radius: 6px;
            text-align: center;
            font-size: 13px;
            font-weight: bold;
        }
        
        .match-controls {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin: 15px 0;
            flex-wrap: wrap;
        }
        
        @media (max-width: 480px) {
            .action-buttons {
                grid-template-columns: 1fr !important;
                gap: 6px !important;
            }
            
            .action-btn {
                padding: 8px !important;
                font-size: 11px !important;
            }
            
            .quick-stats {
                grid-template-columns: repeat(3, 1fr);
                gap: 5px;
            }
            
            .stat-item {
                padding: 6px;
                font-size: 11px;
            }
            
            .match-controls {
                flex-direction: column;
                gap: 8px;
            }
            
            .match-controls .btn {
                width: 100%;
                padding: 10px;
            }
        }
    `;
    document.head.appendChild(style);
}

// Export si module ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        LiveManager,
        showLiveMatch,
        addEvent,
        removeEvent,
        startLiveUpdates
    };
}
