/**
 * Rule B1: ExactSkillMatch
 * Priority: 9 (Core Skill Matching)
 * 
 * IF student.skills contains a skill exactly matching one in internship.requiredSkills
 * THEN +15 points per exact match
 * 
 * @module B1_ExactSkillMatch
 */

const { normalizeSkill } = require('../../utils/skillUtils');

const rule = {
    name: "B1_ExactSkillMatch",
    priority: 9,

    /**
     * Evaluates if there are any exact skill matches.
     * 
     * @param {Object} facts - The facts base containing student and internship data.
     * @returns {boolean} True if at least one skill matches exactly, false otherwise.
     */
    condition: (facts) => {
        const { student, internship } = facts;

        const requiredSkills = internship?.requiredSkills || [];
        const studentSkills = student?.skills || [];

        if (requiredSkills.length === 0 || studentSkills.length === 0) {
            return false;
        }

        const studentSkillNames = studentSkills.map(s => normalizeSkill(s));
        const requiredSkillNames = requiredSkills.map(s => normalizeSkill(s));

        return requiredSkillNames.some(skill => studentSkillNames.includes(skill));
    },

    /**
     * Action to perform when the condition is met.
     * Calculates +15 per exact match.
     * 
     * @param {Object} facts - The facts base containing student and internship data.
     * @returns {Object} The score adjustment and explanation array.
     * Note: The matching engine supports array of explanations or a single string.
     */
    action: (facts) => {
        const { student, internship } = facts;

        const requiredSkills = internship?.requiredSkills || [];
        const studentSkills = student?.skills || [];

        const studentSkillNames = studentSkills.map(s => normalizeSkill(s));

        let totalScore = 0;
        const explanations = [];

        requiredSkills.forEach(req => {
            const reqName = typeof req === 'string' ? req : req?.name;
            if (reqName && studentSkillNames.includes(normalizeSkill(reqName))) {
                totalScore += 20;
                explanations.push(`Exact skill match: ${reqName}`);
            }
        });

        return {
            scoreAdjustment: totalScore,
            // We will normalize explanations array handling in the inference engine
            explanation: explanations
        };
    }
};

module.exports = rule;
