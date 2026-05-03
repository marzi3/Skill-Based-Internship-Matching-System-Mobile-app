/**
 * Rule A3: MinimumGPANotMet
 * Priority: 10 (Hard Disqualification)
 * 
 * IF internship.minimumGPA is specified
 * AND student.gpa < internship.minimumGPA
 * THEN disqualify
 * 
 * @module A3_MinimumGPANotMet
 */

const rule = {
    name: "A3_MinimumGPANotMet",
    priority: 10,

    /**
     * Evaluates if the student's gpa falls below the minimum requirement.
     * 
     * @param {Object} facts - The facts base containing student and internship data.
     * @param {Object} facts.student - The student profile object.
     * @param {Object} facts.internship - The internship listing object.
     * @returns {boolean} True if the GPA is below the minimum threshold, false otherwise.
     */
    condition: (facts) => {
        const { student, internship } = facts;

        // If the internship doesn't specify a minimum GPA, this rule doesn't fire
        if (internship?.minimumGPA === undefined || internship?.minimumGPA === null) {
            return false;
        }

        // If student GPA is missing, don't disqualify (since GPA is optional for students)
        if (student?.gpa === undefined || student?.gpa === null || student?.gpa === '') {
            return false;
        }

        // Compare numeric values
        return Number(student.gpa) < Number(internship.minimumGPA);
    },

    /**
     * Action to perform when the condition is met.
     * 
     * @returns {Object} The score adjustment and explanation.
     */
    action: () => {
        return {
            scoreAdjustment: -Infinity,
            explanation: "GPA below minimum threshold"
        };
    }
};

module.exports = rule;
