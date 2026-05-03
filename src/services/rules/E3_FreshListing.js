/**
 * Rule E3: FreshListing
 * Priority: 2 (Engagement & Activity)
 * 
 * IF internship.postedDate is within last 7 days
 * THEN +3 points
 * 
 * @module E3_FreshListing
 */

const rule = {
    name: "E3_FreshListing",
    priority: 2,

    /**
     * Evaluates if the listing is fresh.
     * 
     * @param {Object} facts - The facts base
     * @returns {boolean} True if posted in the last 7 days.
     */
    condition: (facts) => {
        const { internship } = facts;

        if (!internship?.postedDate) return false;

        // Convert to Date object properly handling string or Date
        const posted = new Date(internship.postedDate);
        if (isNaN(posted.getTime())) return false; // Invalid date

        const now = new Date();
        // Milliseconds in a day
        const MS_PER_DAY = 1000 * 60 * 60 * 24;

        // Check if difference is <= 7 days
        const diffDays = (now.getTime() - posted.getTime()) / MS_PER_DAY;

        return diffDays >= 0 && diffDays <= 7;
    },

    /**
     * Yields points for fresh listings.
     * 
     * @returns {Object} The score adjustment and explanation.
     */
    action: () => {
        return {
            scoreAdjustment: 3,
            explanation: "Recently posted opportunity"
        };
    }
};

module.exports = rule;
