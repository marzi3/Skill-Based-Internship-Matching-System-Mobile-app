/**
 * Normalizes a skill name for consistent comparison.
 * Removes spaces, dots, dashes and converts to lowercase.
 * Example: "Node.js" -> "nodejs", "React Native" -> "reactnative"
 * 
 * @param {string|Object} skill - The skill name or object containing name.
 * @returns {string} Normalized skill name.
 */
function normalizeSkill(skill) {
    if (!skill) return '';
    const name = typeof skill === 'string' ? skill : (skill.name || '');
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Checks if two skills match after normalization.
 * 
 * @param {string|Object} skill1 
 * @param {string|Object} skill2 
 * @returns {boolean} True if they match.
 */
function isSkillMatch(skill1, skill2) {
    return normalizeSkill(skill1) === normalizeSkill(skill2);
}

module.exports = {
    normalizeSkill,
    isSkillMatch
};
