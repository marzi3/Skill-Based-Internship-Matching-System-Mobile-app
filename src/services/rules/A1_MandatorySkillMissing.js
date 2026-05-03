/**
 * Rule A1: MandatorySkillMissing
 * Priority: 10 (Hard Disqualification)
 * 
 * If an internship specifies 'mandatory' skills, the student MUST possess
 * ALL of those skills. If any mandatory skill is missing, the student is disqualified.
 * 
 * @module A1_MandatorySkillMissing
 */

const { normalizeSkill } = require('../../utils/skillUtils');

const rule = {
    name: "A1_MandatorySkillMissing",
    priority: 10,

    /**
     * Evaluates if the student is missing any mandatory skills required by the internship.
     * 
     * @param {Object} facts - The facts base containing student and internship data.
     * @param {Object} facts.student - The student profile object.
     * @param {Object} facts.internship - The internship listing object.
     * @returns {boolean} True if a mandatory skill is missing, false otherwise.
     */
    condition: (facts) => {
        const { student, internship } = facts;

        // Safely extract required skills and student skills
        const requiredSkills = internship?.requiredSkills || [];
        const studentSkills = student?.skills || [];

        // Find all required skills marked as mandatory
        const mandatorySkills = requiredSkills.filter(s => s.mandatory);

        // If there are no mandatory skills, this rule won't fire
        if (mandatorySkills.length === 0) {
            return false;
        }

        // Extract just the names of the student's skills for easier matching
        // (assuming student.skills is an array of objects like { name: 'React', proficiency: '...' })
        // If it's an array of strings, we handle that as well.
        const studentSkillNames = studentSkills.map(s => normalizeSkill(s));

        // Check if the student is missing ANY of the mandatory skills
        const missingAny = mandatorySkills.some(mandatorySkill => {
            const mandatoryName = normalizeSkill(mandatorySkill);
            return !studentSkillNames.includes(mandatoryName);
        });

        return missingAny;
    },

    /**
     * Action to perform when the condition is met.
     * 
     * @param {Object} facts - The facts base containing student and internship data.
     * @returns {Object} The score adjustment and explanation.
     */
    action: (facts) => {
        const { student, internship } = facts;
        const requiredSkills = internship?.requiredSkills || [];
        const studentSkills = student?.skills || [];

        const mandatorySkills = requiredSkills.filter(s => s.mandatory);
        const studentSkillNames = studentSkills.map(s => normalizeSkill(s));

        // Find exactly which ones are missing for the explanation
        const missingSkills = mandatorySkills
            .filter(ms => !studentSkillNames.includes(normalizeSkill(ms)))
            .map(ms => typeof ms === 'string' ? ms : ms.name);

        // Hard disqualification yields -Infinity
        return {
            scoreAdjustment: -Infinity,
            explanation: `Missing mandatory skill(s): ${missingSkills.join(', ')}`
        };
    }
};

module.exports = rule;
