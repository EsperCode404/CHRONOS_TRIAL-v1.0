/**
 * CHRONOS-TRIAL // STORAGE MECHANICS CORE
 * Manages states, experience arithmetic, and persistent records
 */

const StorageEngine = {
    // Keys used inside the local storage dictionary
    KEYS: {
        STATS: 'chronos_player_stats',
        TRIALS: 'chronos_active_trials',
        HISTORY: 'chronos_trial_history'
    },

    // Standard baseline configurations if no data is found
    DEFAULTS: {
        stats: { level: 1, xp: 0, nextLevelXp: 100 },
        trials: [],
        history: []
    },

    /**
     * Retrieves current Player statistics (Level, XP)
     */
    getStats() {
        const data = localStorage.getItem(this.KEYS.STATS);
        return data ? JSON.parse(data) : { ...this.DEFAULTS.stats };
    },

    /**
     * Commits updated Player stats to disk
     */
    saveStats(stats) {
        localStorage.setItem(this.KEYS.STATS, JSON.stringify(stats));
    },

    /**
     * Processes experience gain and handles level ascension boundaries
     */
    addExperience(amount) {
        let stats = this.getStats();
        stats.xp += amount;

        // Level up loop logic in case massive XP amounts skip a level
        while (stats.xp >= stats.nextLevelXp) {
            stats.xp -= stats.nextLevelXp;
            stats.level += 1;
            // Scale difficulty for next level upward dynamically
            stats.nextLevelXp = Math.floor(stats.nextLevelXp * 1.5);
        }

        this.saveStats(stats);
        return stats;
    },

    /**
     * Retrieves all unexpired active trial targets
     */
    getActiveTrials() {
        const data = localStorage.getItem(this.KEYS.TRIALS);
        return data ? JSON.parse(data) : [...this.DEFAULTS.trials];
    },

    /**
     * Commits the active trial array
     */
    saveActiveTrials(trials) {
        localStorage.setItem(this.KEYS.TRIALS, JSON.stringify(trials));
    },

    /**
     * Retrieves completed or failed historical trial logs
     */
    getHistory() {
        const data = localStorage.getItem(this.KEYS.HISTORY);
        return data ? JSON.parse(data) : [...this.DEFAULTS.history];
    },

    /**
     * Appends a resolved trial into the permanent historical ledger
     */
    logToHistory(trial) {
        const history = this.getHistory();
        history.unshift(trial); // Pushes newest resolutions to the top
        localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(history));
    }
};