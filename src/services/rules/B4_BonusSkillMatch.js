/**
 * Rule B4: BonusSkillMatch
 * Priority: 8 (Core Skill Matching)
 * 
 * IF student.skills includes skills in internship.preferredSkills (non-mandatory)
 * THEN +5 points per bonus skill match (max +25)
 * 
 * @module B4_BonusSkillMatch
 */

const { normalizeSkill } = require('../../utils/skillUtils');

const rule = {
    name: "B4_BonusSkillMatch",
    priority: 8,

    /**
     * Helper to identify which preferred skills the student has.
     * 
     * @param {Object} facts - Facts base
     * @returns {Array} List of matched preferred skills
     */
    _getMatchedBonusSkills: (facts) => {
        const { student, internship } = facts;

        const preferredSkills = internship?.preferredSkills || [];
        const studentSkills = student?.skills || [];

        if (preferredSkills.length === 0 || studentSkills.length === 0) {
            return [];
        }

        const studentSkillNames = studentSkills.map(s => normalizeSkill(s));

        return preferredSkills.filter(pref => {
            const prefName = normalizeSkill(pref);
            return studentSkillNames.includes(prefName);
        }).map(pref => typeof pref === 'string' ? pref : pref.name);
    },

    /**
     * Evaluates if there are any bonus skill matches.
     * 
     * @param {Object} facts - The facts base
     * @returns {boolean} True if > 0 matches
     */
    condition: (facts) => {
        return rule._getMatchedBonusSkills(facts).length > 0;
    },

    /**
     * Calculates +5 points per bonus skill match (max +25).
     * 
     * @param {Object} facts - The facts base 
     * @returns {Object} The score adjustment and explanation.
     */
    action: (facts) => {
        const matchedSkills = rule._getMatchedBonusSkills(facts);

        const points = Math.min(matchedSkills.length * 5, 25);

        const explanations = matchedSkills.map(skill =>
            `Bonus skill match: ${skill}`
        );

        return {
            scoreAdjustment: points,
            explanation: explanations
        };
    }
};

module.exports = rule;
