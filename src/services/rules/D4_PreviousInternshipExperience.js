/**
 * Rule D4: PreviousInternshipExperience
 * Priority: 4 (Contextual Preference)
 * 
 * IF student.previousInternships > 0 AND internship.prefersExperienced = true
 * THEN +5 points
 * 
 * @module D4_PreviousInternshipExperience
 */

const rule = {
    name: "D4_PreviousInternshipExperience",
    priority: 4,

    /**
     * Evaluates if the student has prior internships and the listing prefers it.
     * 
     * @param {Object} facts - The facts base
     * @returns {boolean} True if condition met.
     */
    condition: (facts) => {
        const { student, internship } = facts;

        if (!internship?.prefersExperienced) {
            return false;
        }

        return Number(student?.previousInternships || 0) > 0;
    },

    /**
     * Yields points for matching prior experience needs.
     * 
     * @returns {Object} The score adjustment and explanation.
     */
    action: () => {
        return {
            scoreAdjustment: 5,
            explanation: "Prior internship experience"
        };
    }
};

module.exports = rule;
