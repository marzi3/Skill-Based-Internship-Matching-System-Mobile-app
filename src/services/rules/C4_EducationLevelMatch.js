/**
 * Rule C4: EducationLevelMatch
 * Priority: 6 (Profile Strength)
 * 
 * IF internship.requiredEducationLevel matches or is below student.educationLevel
 * THEN +8 points
 * 
 * @module C4_EducationLevelMatch
 */

const EDUCATION_TIERS = {
    'DIPLOMA': 1,
    'BACHELORS': 2,
    'MASTERS': 3,
    'PHD': 4
};

const rule = {
    name: "C4_EducationLevelMatch",
    priority: 6,

    /**
     * Evaluates if the student's education level meets or exceeds the internship requirement.
     * 
     * @param {Object} facts - The facts base
     * @returns {boolean} True if education level matches or exceeds.
     */
    condition: (facts) => {
        const { student, internship } = facts;

        if (!internship?.requiredEducationLevel || !student?.educationLevel) {
            return false; // Requirement unspecified or student data missing
        }

        const requiredLevel = EDUCATION_TIERS[String(internship.requiredEducationLevel).toUpperCase()];
        const studentLevel = EDUCATION_TIERS[String(student.educationLevel).toUpperCase()];

        if (!requiredLevel || !studentLevel) {
            return false; // Unknown tier formats
        }

        return studentLevel >= requiredLevel;
    },

    /**
     * Yields a bonus for meeting the education tier.
     * 
     * @returns {Object} The score adjustment and explanation.
     */
    action: () => {
        return {
            scoreAdjustment: 8,
            explanation: "Education level meets requirement"
        };
    }
};

module.exports = rule;
