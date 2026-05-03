/**
 * Rule D3: IndustryInterestMatch
 * Priority: 4 (Contextual Preference)
 * 
 * IF internship.industry is in student.industriesOfInterest
 * THEN +7 points
 * 
 * @module D3_IndustryInterestMatch
 */

const rule = {
    name: "D3_IndustryInterestMatch",
    priority: 4,

    /**
     * Evaluates if the internship industry aligns with student interests.
     * 
     * @param {Object} facts - The facts base
     * @returns {boolean} True if there's a match.
     */
    condition: (facts) => {
        const { student, internship } = facts;

        if (!internship?.domain || !student?.industriesOfInterest || student.industriesOfInterest.length === 0) {
            return false;
        }

        const industry = String(internship.domain).trim().toLowerCase();
        const interests = student.industriesOfInterest.map(i => String(i).trim().toLowerCase());

        return interests.includes(industry);
    },

    /**
     * Yields points for industry affinity.
     * 
     * @returns {Object} The score adjustment and explanation.
     */
    action: () => {
        return {
            scoreAdjustment: 7,
            explanation: "Industry interest alignment"
        };
    }
};

module.exports = rule;
