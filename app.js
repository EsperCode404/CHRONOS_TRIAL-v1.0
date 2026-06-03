/**
 * CHRONOS-TRIAL // CENTRAL ORCHESTRATION ENGINE
 * Handles DOM manipulation, runtime ticks, event routing, and state rendering
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Capture the exact instantiation timestamp for our Uptime tracker
    const SYSTEM_BOOT_TIME = Date.now();

    // 2. Map Difficulty Tiers directly to XP reward pools
    const REWARD_MATRIX = {
        bronze: 40,
        silver: 80,
        gold: 150,
        shadow: 300
    };

    // 3. Cache DOM Node Elements
    const dom = {
        clock: document.getElementById('global-clock'),
        uptime: document.getElementById('uptime-counter'),
        level: document.getElementById('player-level'),
        xpText: document.getElementById('xp-text'),
        xpBar: document.getElementById('xp-bar-inner'),
        form: document.getElementById('quest-form'),
        titleInput: document.getElementById('quest-title'),
        difficultyInput: document.getElementById('quest-difficulty'),
        durationInput: document.getElementById('quest-duration'),
        activeContainer: document.getElementById('active-quests-container'),
        archiveToggle: document.getElementById('archive-toggle'),
        archiveContainer: document.getElementById('archive-container'),
        archiveRows: document.getElementById('archive-rows')
    };

    /**
     * CORE INITIALIZER: Syncs system views with database matrices on bootup
     */
    function init() {
        renderPlayerStats();
        renderActiveBoard();
        renderHistoricalArchive();
        setupEventListeners();
        
        // Start the master synchronization cycle (Runs every single second)
        setInterval(runtimeHeartbeat, 1000);
        runtimeHeartbeat(); // Fire instantly to bypass initial 1-second delay gap
    }

    /**
     * EVENT HANDLERS: Intercept user interactions
     */
    function setupEventListeners() {
        // Handle Trial Deployment creation
        dom.form.addEventListener('submit', (e) => {
            e.preventDefault();
            deployNewQuest();
        });

        // Toggle visibility state of the Historical Ledger list
        dom.archiveToggle.addEventListener('click', () => {
            dom.archiveContainer.classList.toggle('hidden');
            if (dom.archiveContainer.classList.contains('hidden')) {
                dom.archiveToggle.textContent = '[ + HISTORICAL_TRIAL_LOGS ]';
            } else {
                dom.archiveToggle.textContent = '[ - HISTORICAL_TRIAL_LOGS ]';
            }
        });
    }

    /**
     * CORE RE-RENDERING ENGINE: Updates Player Level and Experience Gauges
     */
    function renderPlayerStats() {
        const stats = StorageEngine.getStats();
        dom.level.textContent = String(stats.level).padStart(2, '0');
        dom.xpText.textContent = `${stats.xp} / ${stats.nextLevelXp} XP`;
        
        // Calculate raw percentage width for CSS bar layout animation
        const percentage = (stats.xp / stats.nextLevelXp) * 100;
        dom.xpBar.style.width = `${Math.min(percentage, 100)}%`;
    }

    /**
     * SYSTEM MASTER CLOCK HEARTBEAT
     * Ticks global time, system uptime, updates card timers, and scans for deadlocks
     */
    function runtimeHeartbeat() {
        // A. Render current clock time
        const now = new Date();
        dom.clock.textContent = now.toTimeString().split(' ')[0];

        // B. Render active system uptime metric
        dom.uptime.textContent = TimerEngine.getSystemUptime(SYSTEM_BOOT_TIME);

        // C. Sweep dynamic countdown cards and flag timeouts
        const activeQuests = StorageEngine.getActiveTrials();
        let stateChanged = false;

        activeQuests.forEach(quest => {
            if (quest.status === 'active') {
                const timeMetrics = TimerEngine.getRemainingTime(quest.targetTimestamp);
                const timerElement = document.getElementById(`timer-${quest.id}`);

                if (timerElement) {
                    timerElement.textContent = TimerEngine.formatDuration(timeMetrics.totalMs);
                }

                // Auto-failure evaluation window hit
                if (timeMetrics.isExpired) {
                    quest.status = 'failed';
                    stateChanged = true;
                    
                    // Archive the failed attempt permanently
                    StorageEngine.logToHistory({
                        title: quest.title,
                        difficulty: quest.difficulty,
                        duration: quest.duration,
                        status: 'failed'
                    });
                }
            }
        });

        if (stateChanged) {
            // Save modified array adjustments back to local memory and force a screen redraw
            StorageEngine.saveActiveTrials(activeQuests);
            renderActiveBoard();
            renderHistoricalArchive();
        }
    }

    /**
     * INITIALIZATION LOGIC: Registers a brand new syllabus target array card
     */
    function deployNewQuest() {
        const title = dom.titleInput.value.trim();
        const difficulty = dom.difficultyInput.value;
        const durationDays = parseInt(dom.durationInput.value);

        // Map relative dropdown duration parameters to absolute futures
        const targetTimestamp = TimerEngine.calculateTargetTimestamp(durationDays);

        const newQuest = {
            id: `trial_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            title: title,
            difficulty: difficulty,
            duration: durationDays,
            progress: 0,
            targetTimestamp: targetTimestamp,
            status: 'active'
        };

        const activeQuests = StorageEngine.getActiveTrials();
        activeQuests.push(newQuest);
        StorageEngine.saveActiveTrials(activeQuests);

        // Reset form inputs safely
        dom.titleInput.value = '';
        dom.form.reset();

        // Refresh UI layers
        renderActiveBoard();
    }

    /**
     * GENERATES ACTIVE OVERVIEWS: Injects responsive card modules into container grid
     */
    function renderActiveBoard() {
        const activeQuests = StorageEngine.getActiveTrials();
        dom.activeContainer.innerHTML = '';

        if (activeQuests.length === 0) {
            dom.activeContainer.innerHTML = `<div class="empty-notice">> NO ACTIVE TRIALS DETECTED. CHOOSE A SILLABUS OBJECTIVE TO GENERATE QUEST SECTOR.</div>`;
            return;
        }

        activeQuests.forEach(quest => {
            const isFailed = quest.status === 'failed';
            const card = document.createElement('div');
            card.className = `quest-card ${quest.difficulty} ${isFailed ? 'failed' : ''}`;
            
            // Generate visual markup string for cards
            card.innerHTML = `
                <div class="quest-header">
                    <div>
                        <div class="quest-title">${quest.title}</div>
                        <div class="quest-meta">CLASS: ${quest.difficulty} // TERM: ${quest.duration} DAY(S)</div>
                    </div>
                    <div id="timer-${quest.id}" class="quest-timer">00h 00m 00s</div>
                </div>
                <div class="progress-control">
                    <div class="progress-meta">
                        <span>PREPARATION MARGIN</span>
                        <span id="prog-val-${quest.id}">${quest.progress}%</span>
                    </div>
                    <input 
                        type="range" 
                        class="progress-slider" 
                        id="slider-${quest.id}" 
                        min="0" max="100" 
                        value="${quest.progress}" 
                        ${isFailed ? 'disabled' : ''}
                    >
                </div>
                ${!isFailed ? `
                <div class="quest-actions">
                    <button class="btn-complete" id="btn-${quest.id}">MANUAL RESOLUTION COMPLETE</button>
                </div>` : ''}
            `;

            dom.activeContainer.appendChild(card);

            // Setup tracking listener bindings inside the active loop instances
            if (!isFailed) {
                const slider = card.querySelector(`#slider-${quest.id}`);
                const progValueText = card.querySelector(`#prog-val-${quest.id}`);
                const completeBtn = card.querySelector(`#btn-${quest.id}`);

                // Real-time slider update stream tracking
                slider.addEventListener('input', (e) => {
                    const currentVal = e.target.value;
                    progValueText.textContent = `${currentVal}%`;
                    updateQuestProgress(quest.id, parseInt(currentVal));
                });

                // Resolution completion validation check triggering experience gain hooks
                completeBtn.addEventListener('click', () => {
                    resolveQuestSuccess(quest.id);
                });
            }
        });
    }

    /**
     * DYNAMIC MUTATION: Updates range slider percentages into localStorage arrays
     */
    function updateQuestProgress(questId, value) {
        const activeQuests = StorageEngine.getActiveTrials();
        const quest = activeQuests.find(q => q.id === questId);
        if (quest) {
            quest.progress = value;
            StorageEngine.saveActiveTrials(activeQuests);
        }
    }

    /**
     * STATE SUCCESS PROTOCOL: Safely rewards completion and purges runtime cards
     */
    function resolveQuestSuccess(questId) {
        let activeQuests = StorageEngine.getActiveTrials();
        const questIndex = activeQuests.findIndex(q => q.id === questId);

        if (questIndex !== -1) {
            const targetQuest = activeQuests[questIndex];
            
            // 1. Calculate and map XP awards based on Difficulty matrix rules
            const xpReward = REWARD_MATRIX[targetQuest.difficulty] || 40;
            StorageEngine.addExperience(xpReward);

            // 2. Commit data signature metrics to historical arrays
            StorageEngine.logToHistory({
                title: targetQuest.title,
                difficulty: targetQuest.difficulty,
                duration: targetQuest.duration,
                status: 'success'
            });

            // 3. Splice target element out of active array tracking completely
            activeQuests.splice(questIndex, 1);
            StorageEngine.saveActiveTrials(activeQuests);

            // 4. Reset screen components to display upgraded system levels
            renderPlayerStats();
            renderActiveBoard();
            renderHistoricalArchive();
        }
    }

    /**
     * HISTORICAL ARCHIVE ENGINE: Rebuilds data rows inside lower expandable panel ledger
     */
    function renderHistoricalArchive() {
        const history = StorageEngine.getHistory();
        dom.archiveRows.innerHTML = '';

        if (history.length === 0) {
            dom.archiveRows.innerHTML = `<tr><td colspan="4" style="color: #6b7280; text-align: center;">> REGISTRATION LOG EMPTY. NO RESOLVED TRIALS ON RECORD.</td></tr>`;
            return;
        }

        history.forEach(log => {
            const row = document.createElement('tr');
            const isSuccess = log.status === 'success';
            
            row.innerHTML = `
                <td style="font-weight: 500;">${log.title}</td>
                <td style="text-transform: uppercase; color: #9ca3af;">${log.difficulty}</td>
                <td>${log.duration} DAY(S)</td>
                <td>
                    <span class="status-tag ${isSuccess ? 'success' : 'failed'}">
                        ${isSuccess ? 'CLEAR ✓' : 'FAILED ✗'}
                    </span>
                </td>
            `;
            dom.archiveRows.appendChild(row);
        });
    }

    init();
});