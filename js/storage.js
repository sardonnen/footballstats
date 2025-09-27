/**
 * Gestion du stockage local pour l'application Football Stats
 */

const StorageManager = {
    
    prefix: APP_CONFIG.storage.prefix,
    
    /**
     * Sauvegarde des données avec gestion d'erreurs
     */
    save: function(key, data) {
        try {
            const fullKey = this.prefix + key;
            const jsonData = JSON.stringify({
                data: data,
                timestamp: Date.now(),
                version: APP_CONFIG.version
            });
            
            localStorage.setItem(fullKey, jsonData);
            
            if (APP_CONFIG.debug) {
                console.log('💾 Sauvegardé:', key, data);
            }
            
            return true;
        } catch (error) {
            console.error('❌ Erreur sauvegarde:', error);
            DebugUtils.logError(error, 'StorageManager.save');
            
            // Vérifier si c'est un problème d'espace
            if (error.name === 'QuotaExceededError') {
                this.cleanOldData();
                NotificationUtils.show('Espace de stockage plein. Anciennes données supprimées.', 'warning');
            }
            
            return false;
        }
    },
    
    /**
     * Chargement des données avec validation
     */
    load: function(key, defaultValue = null) {
        try {
            const fullKey = this.prefix + key;
            const jsonData = localStorage.getItem(fullKey);
            
            if (!jsonData) {
                return defaultValue;
            }
            
            const parsed = JSON.parse(jsonData);
            
            // Vérifier la version et la validité
            if (!parsed.data || !parsed.timestamp) {
                console.warn('⚠️ Données corrompues pour:', key);
                this.remove(key);
                return defaultValue;
            }
            
            // Vérifier l'âge des données (30 jours max pour certaines données)
            const age = Date.now() - parsed.timestamp;
            const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 jours
            
            if (key.includes('temp_') && age > maxAge) {
                console.log('🗑️ Données expirées supprimées:', key);
                this.remove(key);
                return defaultValue;
            }
            
            if (APP_CONFIG.debug) {
                console.log('📂 Chargé:', key, parsed.data);
            }
            
            return parsed.data;
        } catch (error) {
            console.error('❌ Erreur chargement:', error);
            DebugUtils.logError(error, 'StorageManager.load');
            
            // Supprimer les données corrompues
            this.remove(key);
            return defaultValue;
        }
    },
    
    /**
     * Suppression d'une clé
     */
    remove: function(key) {
        try {
            const fullKey = this.prefix + key;
            localStorage.removeItem(fullKey);
            
            if (APP_CONFIG.debug) {
                console.log('🗑️ Supprimé:', key);
            }
            
            return true;
        } catch (error) {
            console.error('❌ Erreur suppression:', error);
            return false;
        }
    },
    
    /**
     * Vérifie si une clé existe
     */
    exists: function(key) {
        const fullKey = this.prefix + key;
        return localStorage.getItem(fullKey) !== null;
    },
    
    /**
     * Liste toutes les clés de l'application
     */
    getAllKeys: function() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                keys.push(key.substring(this.prefix.length));
            }
        }
        return keys;
    },
    
    /**
     * Nettoie les anciennes données
     */
    cleanOldData: function() {
        const keys = this.getAllKeys();
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 jours
        let cleaned = 0;
        
        keys.forEach(key => {
            try {
                const data = this.load(key);
                if (data && data.timestamp && (now - data.timestamp) > maxAge) {
                    this.remove(key);
                    cleaned++;
                }
            } catch (error) {
                // Supprimer les données corrompues
                this.remove(key);
                cleaned++;
            }
        });
        
        console.log(`🧹 ${cleaned} anciennes données supprimées`);
        return cleaned;
    },
    
    /**
     * Calcule l'espace utilisé
     */
    getUsedSpace: function() {
        let total = 0;
        const keys = this.getAllKeys();
        
        keys.forEach(key => {
            try {
                const fullKey = this.prefix + key;
                const data = localStorage.getItem(fullKey);
                if (data) {
                    total += data.length;
                }
            } catch (error) {
                console.warn('Erreur calcul espace:', error);
            }
        });
        
        return {
            bytes: total,
            kb: (total / 1024).toFixed(2),
            mb: (total / (1024 * 1024)).toFixed(2)
        };
    },
    
    /**
     * Exporte toutes les données
     */
    exportData: function() {
        const keys = this.getAllKeys();
        const exportData = {
            app: APP_CONFIG.name,
            version: APP_CONFIG.version,
            exportDate: new Date().toISOString(),
            data: {}
        };
        
        keys.forEach(key => {
            exportData.data[key] = this.load(key);
        });
        
        return exportData;
    },
    
    /**
     * Importe des données
     */
    importData: function(importData) {
        try {
            if (!importData.data) {
                throw new Error('Format d\'importation invalide');
            }
            
            let imported = 0;
            Object.keys(importData.data).forEach(key => {
                if (this.save(key, importData.data[key])) {
                    imported++;
                }
            });
            
            console.log(`📥 ${imported} éléments importés`);
            return imported;
        } catch (error) {
            console.error('❌ Erreur importation:', error);
            DebugUtils.logError(error, 'StorageManager.importData');
            return 0;
        }
    }
};

// Gestionnaire spécifique pour les matchs
const MatchStorage = {
    
    /**
     * Sauvegarde un match complet
     */
    saveMatch: function(matchData) {
        try {
            const matchId = matchData.id || Utils.generateMatchId();
            matchData.id = matchId;
            matchData.lastSaved = Date.now();
            
            // Sauvegarder le match complet
            const saved = StorageManager.save(`match_${matchId}`, matchData);
            
            if (saved) {
                // Mettre à jour la liste des matchs
                this.updateMatchList(matchId, matchData);
                NotificationUtils.show('Match sauvegardé', 'success');
            }
            
            return saved ? matchId : null;
        } catch (error) {
            console.error('❌ Erreur sauvegarde match:', error);
            NotificationUtils.show('Erreur sauvegarde match', 'error');
            return null;
        }
    },
    
    /**
     * Charge un match
     */
    loadMatch: function(matchId) {
        try {
            const matchData = StorageManager.load(`match_${matchId}`);
            
            if (matchData) {
                console.log('📂 Match chargé:', matchId);
                return matchData;
            } else {
                console.warn('⚠️ Match non trouvé:', matchId);
                NotificationUtils.show('Match non trouvé', 'error');
                return null;
            }
        } catch (error) {
            console.error('❌ Erreur chargement match:', error);
            NotificationUtils.show('Erreur chargement match', 'error');
            return null;
        }
    },
    
    /**
     * Supprime un match
     */
    deleteMatch: function(matchId) {
        try {
            const removed = StorageManager.remove(`match_${matchId}`);
            
            if (removed) {
                // Mettre à jour la liste
                this.removeFromMatchList(matchId);
                NotificationUtils.show('Match supprimé', 'success');
            }
            
            return removed;
        } catch (error) {
            console.error('❌ Erreur suppression match:', error);
            NotificationUtils.show('Erreur suppression match', 'error');
            return false;
        }
    },
    
    /**
     * Sauvegarde les données live d'un match
     */
    saveLiveMatch: function(matchId, liveData) {
        try {
            liveData.lastUpdate = Date.now();
            return StorageManager.save(`liveMatch_${matchId}`, liveData);
        } catch (error) {
            console.error('❌ Erreur sauvegarde live:', error);
            return false;
        }
    },
    
    /**
     * Charge les données live d'un match
     */
    loadLiveMatch: function(matchId) {
        try {
            return StorageManager.load(`liveMatch_${matchId}`);
        } catch (error) {
            console.error('❌ Erreur chargement live:', error);
            return null;
        }
    },
    
    /**
     * Met à jour la liste des matchs sauvegardés
     */
    updateMatchList: function(matchId, matchData) {
        try {
            let matchList = StorageManager.load('matchList', []);
            
            // Supprimer l'ancienne entrée si elle existe
            matchList = matchList.filter(match => match.id !== matchId);
            
            // Ajouter la nouvelle entrée
            matchList.unshift({
                id: matchId,
                team1: matchData.team1?.name || 'Équipe 1',
                team2: matchData.team2?.name || 'Équipe 2',
                date: matchData.date || new Date().toISOString(),
                lastSaved: matchData.lastSaved,
                isLive: matchData.isLive || false,
                score: matchData.score || { team1: 0, team2: 0 }
            });
            
            // Limiter le nombre de matchs dans la liste
            if (matchList.length > APP_CONFIG.storage.maxSavedMatches) {
                const removed = matchList.splice(APP_CONFIG.storage.maxSavedMatches);
                // Supprimer les matchs en trop du stockage
                removed.forEach(match => {
                    StorageManager.remove(`match_${match.id}`);
                    StorageManager.remove(`liveMatch_${match.id}`);
                });
            }
            
            return StorageManager.save('matchList', matchList);
        } catch (error) {
            console.error('❌ Erreur mise à jour liste matchs:', error);
            return false;
        }
    },
    
    /**
     * Supprime un match de la liste
     */
    removeFromMatchList: function(matchId) {
        try {
            let matchList = StorageManager.load('matchList', []);
            matchList = matchList.filter(match => match.id !== matchId);
            return StorageManager.save('matchList', matchList);
        } catch (error) {
            console.error('❌ Erreur suppression de la liste:', error);
            return false;
        }
    },
    
    /**
     * Récupère la liste des matchs sauvegardés
     */
    getMatchList: function() {
        try {
            return StorageManager.load('matchList', []);
        } catch (error) {
            console.error('❌ Erreur récupération liste matchs:', error);
            return [];
        }
    }
};

// Gestionnaire pour les paramètres utilisateur
const SettingsStorage = {
    
    /**
     * Sauvegarde les paramètres
     */
    save: function(settings) {
        return StorageManager.save('userSettings', settings);
    },
    
    /**
     * Charge les paramètres avec valeurs par défaut
     */
    load: function() {
        const defaultSettings = {
            notifications: true,
            vibrations: DEVICE_INFO.capabilities.vibrate,
            autoSave: true,
            autoSaveInterval: 30000,
            theme: 'auto',
            language: 'fr',
            matchDuration: 90,
            debugMode: false
        };
        
        const userSettings = StorageManager.load('userSettings', {});
        return { ...defaultSettings, ...userSettings };
    },
    
    /**
     * Met à jour un paramètre spécifique
     */
    update: function(key, value) {
        const settings = this.load();
        settings[key] = value;
        return this.save(settings);
    },
    
    /**
     * Remet les paramètres par défaut
     */
    reset: function() {
        StorageManager.remove('userSettings');
        NotificationUtils.show('Paramètres remis à zéro', 'info');
        return true;
    }
};

// Auto-sauvegarde périodique
let autoSaveInterval = null;

const AutoSave = {
    
    start: function(saveFunction, interval = APP_CONFIG.storage.autoSaveInterval) {
        this.stop(); // Arrêter l'ancien intervalle s'il existe
        
        autoSaveInterval = setInterval(() => {
            try {
                if (typeof saveFunction === 'function') {
                    saveFunction();
                    console.log('💾 Auto-sauvegarde effectuée');
                }
            } catch (error) {
                console.error('❌ Erreur auto-sauvegarde:', error);
            }
        }, interval);
        
        console.log('⏰ Auto-sauvegarde démarrée');
    },
    
    stop: function() {
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
            autoSaveInterval = null;
            console.log('⏸️ Auto-sauvegarde arrêtée');
        }
    }
};

// Export si module ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        StorageManager,
        MatchStorage,
        SettingsStorage,
        AutoSave
    };
}
