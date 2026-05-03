/**
 * Rule A2: FieldOfStudyMismatch
 * Priority: 10 (Soft Penalty — previously Hard Disqualification)
 *
 * DESIGN DECISION (updated):
 * Changed from hard disqualify (-Infinity) to a -25 soft penalty.
 * WHY? Hard disqualifying students with no education data (empty array)
 * silently produced ZERO matches for all partially-completed profiles.
 * Students with mismatched-but-not-empty fields still get penalized heavily,
 * but remain discoverable. Students with NO education data are simply
 * not filtered here — the C3_ProfileCompleteness rule already penalizes them.
 *
 * @module A2_FieldOfStudyMismatch
 */

const rule = {
    name: "A2_FieldOfStudyMismatch",
    priority: 10,

    /**
     * Fires only when the student has EXPLICITLY provided a degree field
     * AND it does NOT match any of the internship's accepted degree fields.
     * 
     * @param {Object} facts - The facts base containing student and internship data.
     * @returns {boolean} True if there is an explicit mismatch.
     */
    condition: (facts) => {
        const { student, internship } = facts;

        // If the internship has no field requirement, rule doesn't fire.
        const reqFields = Array.isArray(internship?.requiredDegreeField)
            ? internship.requiredDegreeField
            : [internship?.requiredDegreeField].filter(Boolean);

        if (reqFields.length === 0) return false;

        // Collect the student's stated degree fields.
        const studentFields = [];
        if (Array.isArray(student?.education)) {
            student.education.forEach(edu => {
                if (edu.field) studentFields.push(String(edu.field).trim().toLowerCase());
            });
        }
        if (student?.degreeField) {
            studentFields.push(String(student.degreeField).trim().toLowerCase());
        }

        // No education data at all → skip this rule (C3 penalty covers incomplete profile).
        if (studentFields.length === 0) return false;

        // Fire only if NO student field matches ANY required field.
        return !reqFields.some(req => {
            const reqName = typeof req === 'string' ? req : (req.name || String(req));
            const reqLower = reqName.trim().toLowerCase();
            return studentFields.some(sf => sf.includes(reqLower) || reqLower.includes(sf));
        });
    },

    /**
     * Soft penalty: visible in results but ranked low.
     * A student with a mismatched-but-strong skill profile may still be
     * a viable candidate — let the employer decide.
     * 
     * @returns {Object} Score adjustment and explanation.
     */
    action: () => ({
        scoreAdjustment: -25,
        explanation: "Degree field does not match any accepted field for this internship"
    })
};

module.exports = rule;
