/**
 * Rule C2: PortfolioProvided
 * Priority: 7 (Profile Strength)
 * 
 * IF student.portfolioUrl is not null/empty
 * THEN +5 points
 * 
 * @module C2_PortfolioProvided
 */

const rule = {
    name: "C2_PortfolioProvided",
    priority: 7,

    /**
     * Evaluates if the student has provided a portfolio URL.
     * 
     * @param {Object} facts - The facts base
     * @returns {boolean} True if portfolioUrl exists and is not empty.
     */
    condition: (facts) => {
        const { student } = facts;
        return !!(student?.portfolioUrl && String(student.portfolioUrl).trim() !== "");
    },

    /**
     * Yields a small bonus score for robust profile metrics.
     * 
     * @returns {Object} The score adjustment and explanation.
     */
    action: () => {
        return {
            scoreAdjustment: 5,
            explanation: "Portfolio link provided"
        };
    }
};

module.exports = rule;
