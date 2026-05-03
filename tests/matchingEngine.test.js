const MatchingEngine = require('../src/services/matchingEngine');
const A1 = require('../src/services/rules/A1_MandatorySkillMissing');
const B1 = require('../src/services/rules/B1_ExactSkillMatch');
const E1 = require('../src/services/rules/E1_RecentApplicationActivity');

describe('Matching Engine Tests', () => {

    beforeAll(() => {
        MatchingEngine._reloadRulesForTesting();
    });

    describe('Rule Isolation Tests', () => {

        test('A1_MandatorySkillMissing: fails when mandatory skill is missing', () => {
            const facts = {
                internship: { requiredSkills: [{ name: 'React', mandatory: true }, { name: 'Node', mandatory: false }] },
                student: { skills: [{ name: 'Node' }] }
            };
            expect(A1.condition(facts)).toBe(true); // Is missing: true
            const result = A1.action(facts);
            expect(result.scoreAdjustment).toBe(-Infinity);
        });

        test('A1_MandatorySkillMissing: passes when all mandatory skills present', () => {
            const facts = {
                internship: { requiredSkills: [{ name: 'React', mandatory: true }] },
                student: { skills: [{ name: 'React' }] }
            };
            expect(A1.condition(facts)).toBe(false); // Is missing: false
        });

        test('B1_ExactSkillMatch: adds 15 points per matched skill', () => {
            const facts = {
                internship: { requiredSkills: [{ name: 'React' }, { name: 'Node' }] },
                student: { skills: [{ name: 'React' }, { name: 'MongoDB' }, { name: 'Node' }] }
            };
            expect(B1.condition(facts)).toBe(true);
            const result = B1.action(facts);
            expect(result.scoreAdjustment).toBe(30); // 2 exact matches * 15
        });

        test('E1_RecentApplicationActivity: adds 3 points if recent apps >= 3', () => {
            const facts = { student: { recentApplicationCount: 4 }, internship: {} };
            expect(E1.condition(facts)).toBe(true);
            const result = E1.action(facts);
            expect(result.scoreAdjustment).toBe(3);
        });
    });

    describe('Full Engine Scenarios', () => {

        test('Scenario 1: Perfect Match (All preferred, high coverage, max tier)', () => {
            const student = {
                _id: 's1',
                skills: [
                    { name: 'React', proficiency: 'EXPERT' },
                    { name: 'TypeScript', proficiency: 'ADVANCED' },
                    { name: 'Docker', proficiency: 'INTERMEDIATE' }
                ],
                gpa: 3.9,
                resumeUrl: 'http://resume.com/s1',
                portfolioUrl: 'http://portfolio.com/s1',
                educationLevel: 'BACHELORS',
                preferredLocation: 'Remote',
                profileCompleteness: 100,
                recentApplicationCount: 5,
                previousInternships: 1
            };

            const internship = {
                _id: 'i1',
                requiredSkills: [
                    { name: 'React', mandatory: true, prefersSenior: true },
                    { name: 'TypeScript', mandatory: true, prefersSenior: true }
                ],
                preferredSkills: ['Docker'],
                minimumGPA: 3.0,
                requiredEducationLevel: 'BACHELORS',
                isRemote: true,
                employerVerified: true,
                deadline: new Date(Date.now() + (2 * 24 * 60 * 60 * 1000)), // 2 days from now
                prefersExperienced: true
            };

            const result = MatchingEngine.explainMatch(student, internship);
            expect(result.tier).toBe('EXCELLENT');
            expect(result.rawScore).toBeGreaterThan(120);
            expect(result.explanation.length).toBeGreaterThan(5);
        });

        test('Scenario 2: Hard Disqualification (Missing mandatory skill)', () => {
            const student = {
                _id: 's2',
                skills: [{ name: 'JavaScript' }],
                gpa: 3.5
            };

            const internship = {
                _id: 'i2',
                requiredSkills: [
                    { name: 'Java', mandatory: true }
                ]
            };

            const result = MatchingEngine.explainMatch(student, internship);
            expect(result.tier).toBe('DISQUALIFIED');
            expect(result.rawScore).toBe(-Infinity);
            expect(result.normalizedScore).toBe(0);

            const hasDisqualifyLog = result.explanation.some(e => e.rule === 'A1_MandatorySkillMissing');
            expect(hasDisqualifyLog).toBe(true);
        });

        test('Scenario 3: Partial Match (Fair to Good Tier)', () => {
            const student = {
                _id: 's3',
                skills: [{ name: 'Python' }, { name: 'SQL' }],
                gpa: 3.2,
                preferredLocation: 'New York',
                profileCompleteness: 75
            };

            const internship = {
                _id: 'i3',
                requiredSkills: [
                    { name: 'Python', mandatory: true },
                    { name: 'AWS', mandatory: false },
                    { name: 'Docker', mandatory: false } // only 33% coverage (Rule B3 => 0 points since < 0.25 not applied or applied with 5 points depending on exact math)
                ],
                minimumGPA: 3.0,
                location: 'New York'
            };

            const result = MatchingEngine.explainMatch(student, internship);
            expect(result.tier).not.toBe('DISQUALIFIED');
            expect(result.rawScore).toBeGreaterThan(0);
            // location (+8), python exact match (+15), completeness > 70 (+5), coverage > 25% (+5) => ~33 pts -> FAIR/WEAK tier
        });

        test('Scenario 4: No Skills Match at All', () => {
            const student = {
                _id: 's4',
                skills: [{ name: 'C++' }],
                gpa: 3.0
            };

            const internship = {
                _id: 'i4',
                requiredSkills: [{ name: 'Ruby', mandatory: false }]
            };

            const result = MatchingEngine.explainMatch(student, internship);
            expect(result.tier).not.toBe('DISQUALIFIED'); // Since Ruby isn't mandatory
            // Very low score expected
        });

        test('Scenario 5: Bonus-Only Match', () => {
            const student = {
                _id: 's5',
                skills: [{ name: 'Figma' }],
                gpa: 3.0
            };

            const internship = {
                _id: 'i5',
                requiredSkills: [{ name: 'React', mandatory: false }],
                preferredSkills: ['Figma']
            };

            const result = MatchingEngine.explainMatch(student, internship);
            // Fired B4_BonusSkillMatch (+5 points)
            const hasBonus = result.explanation.some(e => e.rule === 'B4_BonusSkillMatch');
            expect(hasBonus).toBe(true);
        });
    });

});
