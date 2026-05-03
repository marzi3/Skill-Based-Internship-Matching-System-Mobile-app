/**
 * Rule C3: ProfileCompleteness
 * Priority: 6 (Profile Strength)
 * 
 * Compute completeness score across: bio, photo, skills, education, resume, portfolio
 * IF completeness >= 90% → +10 points
 * IF completeness >= 70% → +5 points
 * 
 * @module C3_ProfileCompleteness
 */

const rule = {
    name: "C3_ProfileCompleteness",
    priority: 6,

    /**
     * Evaluates if the student profile completeness meets the minimum 70% threshold.
     * 
     * @param {Object} facts - The facts base
     * @returns {boolean} True if profile completeness >= 70.
     */
    condition: (facts) => {
        const { student } = facts;

        // Some implementations might calculate this dynamically, but the prompt
        // indicates `profileCompleteness` is a computed field 0-100 on the model.
        // If not present, we will dynamically check it based on basic fields.
        const completeness = student?.profileCompleteness || rule._calculateCompleteness(student);

        return completeness >= 70;
    },

    /**
     * Action to calculate bonus points based on profile completeness tier.
     * 
     * @param {Object} facts - The facts base
     * @returns {Object} The score adjustment and explanation.
     */
    action: (facts) => {
        const { student } = facts;

        let completeness = student?.profileCompleteness || rule._calculateCompleteness(student);
        // Sanity clamp
        completeness = Math.min(Math.max(completeness, 0), 100);

        let scoreAdjustment = 0;

        if (completeness >= 90) {
            scoreAdjustment = 10;
        } else if (completeness >= 70) {
            scoreAdjustment = 5;
        }

        return {
            scoreAdjustment,
            explanation: `Profile completeness: ${Math.round(completeness)}%`
        };
    },

    /**
     * Fallback method if the profileCompleteness field is unexpectedly null in facts.
     * Calculates based on requested criteria: bio, photo, skills, education, resume, portfolio
     * @param {Object} student 
     * @returns {Number} completeness 0-100
     */
    _calculateCompleteness: (student) => {
        if (!student) return 0;

        const criteria = [
            !!(student.bio && student.bio.trim() !== ""),
            !!(student.avatarUrl || student.profilePicture),
            !!(student.skills && student.skills.length > 0),
            !!student.educationLevel,
            !!(student.resumeUrl && student.resumeUrl.trim() !== ""),
            !!(student.portfolioUrl && student.portfolioUrl.trim() !== "")
        ];

        const met = criteria.filter(Boolean).length;
        return (met / criteria.length) * 100;
    }
};

module.exports = rule;
