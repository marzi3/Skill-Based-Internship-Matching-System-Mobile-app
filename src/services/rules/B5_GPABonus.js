/**
 * Rule B5: GPABonus
 * Priority: 7 (Academic Performance)
 * 
 * IF student.gpa is high
 * THEN +5 to +15 points bonus
 * 
 * @module B5_GPABonus
 */

const rule = {
    name: "B5_GPABonus",
    priority: 7,

    /**
     * Evaluates if student has a GPA recorded.
     */
    condition: (facts) => {
        const { student } = facts;
        return !!student.gpa && !isNaN(parseFloat(student.gpa));
    },

    /**
     * Action to calculate bonus.
     */
    action: (facts) => {
        const { student } = facts;
        const gpa = parseFloat(student.gpa);
        
        let scoreAdjustment = 0;
        let detail = '';

        if (gpa >= 3.8) {
            scoreAdjustment = 15;
            detail = 'Exceptional GPA (3.8+)';
        } else if (gpa >= 3.5) {
            scoreAdjustment = 10;
            detail = 'High GPA (3.5+)';
        } else if (gpa >= 3.2) {
            scoreAdjustment = 5;
            detail = 'Competitive GPA (3.2+)';
        }

        return {
            scoreAdjustment,
            explanation: detail || 'Good academic standing'
        };
    }
};

module.exports = rule;
