/**
 * CHRONOS-TRIAL // TIME CALCULATION MODULE
 * Pure epoch math preventing browser suspension drift
 */

const TimerEngine = {
    /**
     * Calculates precise remaining milliseconds relative to current clock time
     * @param {number} targetTimestamp - The exact millisecond epoch cap for the trial
     */
    getRemainingTime(targetTimestamp) {
        const delta = targetTimestamp - Date.now();
        return {
            totalMs: delta,
            isExpired: delta <= 0
        };
    },

    /**
     * Formats milliseconds into a standard high-fidelity layout string
     * @param {number} durationMs - Raw milliseconds left
     */
    formatDuration(durationMs) {
        if (durationMs <= 0) return "00h 00m 00s";

        const totalSeconds = Math.floor(durationMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        // Pads numbers with a leading zero to maintain grid formatting alignment
        const pad = (num) => String(num).padStart(2, '0');

        return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
    },

    /**
     * Calculates system operational uptime string since the application booted up
     * @param {number} bootTimestamp - Window load initiation time
     */
    getSystemUptime(bootTimestamp) {
        return this.formatDuration(Date.now() - bootTimestamp);
    },

    /**
     * Maps user drop-down duration choice to an absolute target epoch timestamp
     * @param {number} days - Form choice constraint (1, 2, or 3 days)
     */
    calculateTargetTimestamp(days) {
        const hoursPerDay = 24;
        const minutesPerHour = 60;
        const secondsPerMinute = 60;
        const msPerSecond = 1000;
        
        const totalDurationMs = days * hoursPerDay * minutesPerHour * secondsPerMinute * msPerSecond;
        return Date.now() + totalDurationMs;
    }
};