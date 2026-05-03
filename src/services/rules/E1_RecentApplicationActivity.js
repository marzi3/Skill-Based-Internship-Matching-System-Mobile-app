/**
 * Rule E1: RecentApplicationActivity
 * Priority: 3 (Engagement & Activity)
 * 
 * IF student has applied to >= 3 internships in last 30 days
 * THEN +3 points (demonstrates active job-seeking)
 * 
 * @module E1_RecentApplicationActivity
 */

const rule = {
    name: "E1_RecentApplicationActivity",
    priority: 3,

    /**
     * Evaluates if the student is an active applicant.
     * Note: As a pure forward-chaining engine, facts about application history 
     * must be computed before rule evaluation and passed dynamically if we want to
     * strictly avoid DB queries inside rules. We assume `student.recentApplicationCount` exists 
     * or a derived trait is provided via a decorator/fact-hydration step.
     * 
     * @param {Object} facts - The facts base
     * @returns {boolean} True if active.
     */
    condition: (facts) => {
        const { student } = facts;

        // We expect the controller to inject recentApplicationCount via aggregating Applications DB
        return Number(student?.recentApplicationCount || 0) >= 3;
    },

    /**
     * Yields points for job-seeking activity.
     * 
     * @returns {Object} The score adjustment and explanation.
     */
    action: () => {
        return {
            scoreAdjustment: 3,
            explanation: "Active applicant"
        };
    }
};

module.exports = rule;
