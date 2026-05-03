/**
 * Rule B2: ProficiencyLevelBonus
 * Priority: 8 (Core Skill Matching)
 * 
 * IF matched skill has proficiency level ADVANCED or EXPERT
 * AND internship prefers senior proficiency
 * THEN +10 additional points per qualifying skill
 * 
 * @module B2_ProficiencyLevelBonus
 */

const { isSkillMatch } = require('../../utils/skillUtils');

const rule = {
    name: "B2_ProficiencyLevelBonus",
    priority: 8,

    /**
     * Generates a list of qualifying skills.
     * @param {Object} facts - Facts base
     * @returns {Array} List of qualifying skill rules mapping 
     */
    _getQualifyingSkills: (facts) => {
        const { student, internship } = facts;

        const requiredSkills = internship?.requiredSkills || [];
        const studentSkills = student?.skills || [];

        // All required skills are eligible for the proficiency bonus
        if (requiredSkills.length === 0 || studentSkills.length === 0) {
            return [];
        }

        const qualifyingSkills = [];

        requiredSkills.forEach(reqSkill => {
            const reqName = typeof reqSkill === 'string' ? reqSkill : reqSkill.name;

            const match = studentSkills.find(studentSkill => {
                // If studentSkill is just a string, it has no proficiency recorded natively
                if (typeof studentSkill === 'string') return false;

                const isNameMatch = isSkillMatch(studentSkill, reqName);
                const hasHighProficiency = ['ADVANCED', 'EXPERT'].includes(studentSkill.proficiency?.toUpperCase());

                return isNameMatch && hasHighProficiency;
            });

            if (match) {
                qualifyingSkills.push(match.name);
            }
        });

        return qualifyingSkills;
    },

    /**
     * Evaluates if there are matched skills where student is ADVANCED/EXPERT 
     * 
     * @param {Object} facts - The facts base containing student and internship data.
     * @returns {boolean} True if condition met.
     */
    condition: (facts) => {
        // Re-use logic helper to stay D.R.Y
        return rule._getQualifyingSkills(facts).length > 0;
    },

    /**
     * Action to perform when the condition is met.
     * Calculates +10 per qualifying match.
     * 
     * @param {Object} facts - The facts base containing student and internship data.
     * @returns {Object} The score adjustment and explanation array.
     */
    action: (facts) => {
        const qualifyingSkills = rule._getQualifyingSkills(facts);

        let totalScore = 0;
        const explanations = [];

        qualifyingSkills.forEach(skillName => {
            totalScore += 10;
            explanations.push(`Advanced proficiency bonus: ${skillName}`);
        });

        return {
            scoreAdjustment: totalScore,
            explanation: explanations
        };
    }
};

module.exports = rule;
