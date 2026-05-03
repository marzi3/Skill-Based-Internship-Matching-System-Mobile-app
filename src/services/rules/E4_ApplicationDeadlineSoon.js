/**
 * Rule E4: ApplicationDeadlineSoon
 * Priority: 2 (Engagement & Activity)
 * 
 * IF internship.deadline is within 5 days
 * THEN +5 points (boosts urgency)
 * 
 * @module E4_ApplicationDeadlineSoon
 */

const rule = {
    name: "E4_ApplicationDeadlineSoon",
    priority: 2,

    /**
     * Evaluates if the listing is closing soon.
     * 
     * @param {Object} facts - The facts base
     * @returns {boolean} True if closing within 5 days.
     */
    condition: (facts) => {
        const { internship } = facts;

        if (!internship?.deadline) return false;

        const deadline = new Date(internship.deadline);
        if (isNaN(deadline.getTime())) return false;

        const now = new Date();
        const MS_PER_DAY = 1000 * 60 * 60 * 24;

        const timeRemaining = deadline.getTime() - now.getTime();
        const daysRemaining = timeRemaining / MS_PER_DAY;

        // Ensure deadline hasn't fully passed (or is at least positive) and is <= 5
        return daysRemaining >= 0 && daysRemaining <= 5;
    },

    /**
     * Yields points for urgency.
     * 
     * @returns {Object} The score adjustment and explanation.
     */
    action: () => {
        return {
            scoreAdjustment: 5,
            explanation: "Application deadline approaching"
        };
    }
};

module.exports = rule;
