/**
 * Rule B3: PartialSkillCoverage
 * Priority: 9 (Core Skill Matching)
 * 
 * Compute: coverageRatio = matchedSkills.length / internship.requiredSkills.length
 * IF coverageRatio >= 0.75 → +30 points (Strong Coverage)
 * IF coverageRatio >= 0.50 → +15 points (Moderate Coverage)
 * IF coverageRatio >= 0.25 → +10 points (Partial Coverage)
 * 
 * @module B3_PartialSkillCoverage
 */

const { normalizeSkill } = require('../../utils/skillUtils');

const rule = {
    name: "B3_PartialSkillCoverage",
    priority: 9,

    /**
     * Computes ratio and matches for both condition and action
     * @param {Object} facts Facts base
     * @returns {Object} Data about the coverage
     */
    _getCoverageData: (facts) => {
        const { student, internship } = facts;

        const requiredSkills = internship?.requiredSkills || [];
        const studentSkills = student?.skills || [];

        // Avoid division by zero
        if (requiredSkills.length === 0) {
            return { ratio: 0, matchedCount: 0, totalCount: 0 };
        }

        const studentSkillNames = studentSkills.map(s => normalizeSkill(s));

        let matchedCount = 0;

        requiredSkills.forEach(req => {
            const reqName = typeof req === 'string' ? req : req?.name;
            if (reqName && studentSkillNames.includes(normalizeSkill(reqName))) {
                matchedCount++;
            }
        });

        return {
            ratio: matchedCount / requiredSkills.length,
            matchedCount: matchedCount,
            totalCount: requiredSkills.length
        };
    },

    /**
     * Evaluates if skill coverage is >= 25%.
     * 
     * @param {Object} facts - The facts base containing student and internship data.
     * @returns {boolean} True if coverage >= 0.25
     */
    condition: (facts) => {
        return rule._getCoverageData(facts).ratio >= 0.25;
    },

    /**
     * Calculates specific coverage bonus block.
     * 
     * @param {Object} facts - The facts base containing student and internship data.
     * @returns {Object} The score adjustment and explanation.
     */
    action: (facts) => {
        const { student, internship } = facts;
        const requiredSkills = internship?.requiredSkills || [];
        const studentSkills = student?.skills || [];
        
        const studentSkillNames = studentSkills.map(s => normalizeSkill(s));

        const matchedSkills = [];
        const missingSkills = [];

        requiredSkills.forEach(req => {
            const reqName = typeof req === 'string' ? req : req?.name;
            const displayName = typeof req === 'string' ? req : req?.name;
            if (reqName && studentSkillNames.includes(normalizeSkill(reqName))) {
                matchedSkills.push(displayName);
            } else if (reqName) {
                missingSkills.push(displayName);
            }
        });

        const ratio = requiredSkills.length > 0 ? matchedSkills.length / requiredSkills.length : 0;
        let points = 0;

        if (ratio >= 0.75) points = 30;
        else if (ratio >= 0.50) points = 15;
        else if (ratio >= 0.25) points = 10;

        const ratioPercentage = Math.round(ratio * 100);
        const explanation = missingSkills.length > 0 
            ? `Skill coverage: ${ratioPercentage}% (${matchedSkills.length} of ${requiredSkills.length} skills). Missing: ${missingSkills.join(', ')}.`
            : `Perfect skill alignment! You possess all ${requiredSkills.length} required skills.`;

        return {
            scoreAdjustment: points,
            explanation
        };
    }
};

module.exports = rule;
