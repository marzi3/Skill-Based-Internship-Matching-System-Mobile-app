/**
 * Rule C1: ResumeUploaded
 * Priority: 7 (Profile Strength)
 * 
 * IF student.resumeUrl is not null/empty
 * THEN +5 points
 * 
 * @module C1_ResumeUploaded
 */

const rule = {
    name: "C1_ResumeUploaded",
    priority: 7,

    /**
     * Evaluates if the student has provided a resume URL.
     * 
     * @param {Object} facts - The facts base
     * @returns {boolean} True if resumeUrl exists and is not empty.
     */
    condition: (facts) => {
        const { student } = facts;
        return !!(student?.resumeUrl && String(student.resumeUrl).trim() !== "");
    },

    /**
     * Yields a small bonus score for profile completion.
     * 
     * @returns {Object} The score adjustment and explanation.
     */
    action: () => {
        return {
            scoreAdjustment: 5,
            explanation: "Complete resume uploaded"
        };
    }
};

module.exports = rule;
