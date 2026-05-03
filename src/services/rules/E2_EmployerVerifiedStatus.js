/**
 * Rule E2: EmployerVerifiedStatus
 * Priority: 3 (Engagement & Activity)
 * 
 * IF employer account is verified/approved by admin
 * THEN +4 points (favors quality listings)
 * 
 * @module E2_EmployerVerifiedStatus
 */

const rule = {
    name: "E2_EmployerVerifiedStatus",
    priority: 3,

    /**
     * Evaluates if the internship listing is from a verified employer.
     * 
     * @param {Object} facts - The facts base
     * @returns {boolean} True if verified.
     */
    condition: (facts) => {
        const { internship } = facts;

        return Boolean(internship?.employerVerified);
    },

    /**
     * Yields points for verified standing.
     * 
     * @returns {Object} The score adjustment and explanation.
     */
    action: () => {
        return {
            scoreAdjustment: 4,
            explanation: "Verified employer listing"
        };
    }
};

module.exports = rule;
