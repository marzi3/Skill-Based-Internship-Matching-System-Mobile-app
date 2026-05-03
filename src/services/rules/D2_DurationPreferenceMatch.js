/**
 * Rule D2: DurationPreferenceMatch
 * Priority: 5 (Contextual Preference)
 * 
 * IF internship.duration falls within student.preferredDurationRange
 * THEN +6 points
 * 
 * @module D2_DurationPreferenceMatch
 */

const rule = {
    name: "D2_DurationPreferenceMatch",
    priority: 5,

    /**
     * Evaluates if the internship duration (in weeks) falls within the student's preferred range.
     * 
     * @param {Object} facts - The facts base
     * @returns {boolean} True if the duration is within range.
     */
    condition: (facts) => {
        const { student, internship } = facts;

        if (!internship?.duration || !student?.preferredDurationRange) {
            return false;
        }

        const { min, max } = student.preferredDurationRange;
        // Internship duration is saved from the UI as a string representing Months (e.g., '3', '6')
        // We convert to weeks for the rule by multiplying by 4
        const duration = Number(internship.duration) * 4;

        // Check boundaries safely
        const hasMin = min !== undefined && min !== null;
        const hasMax = max !== undefined && max !== null;

        if (hasMin && hasMax) {
            return duration >= Number(min) && duration <= Number(max);
        } else if (hasMin) {
            return duration >= Number(min);
        } else if (hasMax) {
            return duration <= Number(max);
        }

        return false;
    },

    /**
     * Yields points for duration affinity.
     * 
     * @returns {Object} The score adjustment and explanation.
     */
    action: () => {
        return {
            scoreAdjustment: 6,
            explanation: "Duration within preferred range"
        };
    }
};

module.exports = rule;
