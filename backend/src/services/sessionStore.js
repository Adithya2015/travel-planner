const crypto = require('crypto');

const WORKFLOW_STATES = {
    INFO_GATHERING: 'INFO_GATHERING',
    SKELETON: 'SKELETON',
    EXPAND_DAY: 'EXPAND_DAY',
    REVIEW: 'REVIEW',
    FINALIZE: 'FINALIZE'
};

class SessionStore {
    constructor() {
        this.sessions = new Map();
        this.SESSION_TTL = 30 * 60 * 1000; // 30 minutes
        this.CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
        this._startCleanupInterval();
    }

    create() {
        const sessionId = crypto.randomUUID();
        const now = Date.now();

        const session = {
            sessionId,
            createdAt: now,
            lastAccessed: now,
            workflowState: WORKFLOW_STATES.INFO_GATHERING,
            tripInfo: {
                destination: null,
                startDate: null,
                endDate: null,
                durationDays: null,
                interests: [],
                activityLevel: 'moderate',
                travelers: 1,
                budget: null
            },
            skeleton: null,
            expandedDays: {},
            currentExpandDay: null,
            currentSuggestions: null, // Stores suggestions for current day being planned
            conversationHistory: [],
            finalPlan: null
        };

        this.sessions.set(sessionId, session);
        return session;
    }

    get(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return null;
        }

        // Check if session has expired
        if (Date.now() - session.lastAccessed > this.SESSION_TTL) {
            this.sessions.delete(sessionId);
            return null;
        }

        // Update last accessed time
        session.lastAccessed = Date.now();
        return session;
    }

    update(sessionId, updates) {
        const session = this.get(sessionId);
        if (!session) {
            return null;
        }

        // Deep merge for nested objects
        if (updates.tripInfo) {
            session.tripInfo = { ...session.tripInfo, ...updates.tripInfo };
            delete updates.tripInfo;
        }

        // Merge remaining updates
        Object.assign(session, updates);
        session.lastAccessed = Date.now();

        return session;
    }

    addToConversation(sessionId, role, content) {
        const session = this.get(sessionId);
        if (!session) {
            return null;
        }

        session.conversationHistory.push({ role, content });
        session.lastAccessed = Date.now();
        return session;
    }

    setExpandedDay(sessionId, dayNumber, dayData) {
        const session = this.get(sessionId);
        if (!session) {
            return null;
        }

        session.expandedDays[dayNumber] = dayData;
        session.lastAccessed = Date.now();
        return session;
    }

    delete(sessionId) {
        return this.sessions.delete(sessionId);
    }

    _startCleanupInterval() {
        setInterval(() => {
            const now = Date.now();
            for (const [sessionId, session] of this.sessions.entries()) {
                if (now - session.lastAccessed > this.SESSION_TTL) {
                    this.sessions.delete(sessionId);
                }
            }
        }, this.CLEANUP_INTERVAL);
    }

    // Get session count (useful for debugging/monitoring)
    getSessionCount() {
        return this.sessions.size;
    }
}

// Export singleton instance
const sessionStore = new SessionStore();

module.exports = {
    sessionStore,
    WORKFLOW_STATES
};
