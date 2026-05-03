const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

/**
 * 💡 RULE-BASED EXPERT SYSTEM: MATCHING ENGINE
 * 
 * DESIGN RATIONALE: 
 * We use a "Forward-Chaining Inference Engine" instead of raw SQL filters.
 * WHY? Because matching is probabilistic, not binary. A student might be a 
 * 70% match even if they don't meet every single 'preferred' criteria.
 * This approach allows for:
 * 1. Explainability (The 'Why am I a match?' feature)
 * 2. Rapid iteration (Adding a new rule is just adding a file)
 * 3. Priority handling (Mandatory rules run before bonus rules)
 * 
 * @module matchingEngine
 */

const RULES_DIR = path.join(__dirname, 'rules');
let knowledgeBase = [];

/**
 * loads all rule definitions from the rules/ directory. 
 * WHY SYNC?: This must complete before the server accepts requests, as 
 * the engine cannot function without its knowledge base.
 */
function loadRules() {
    try {
        const files = fs.readdirSync(RULES_DIR).filter(file => file.endsWith('.js'));
        knowledgeBase = files.map(file => {
            const rulePath = path.join(RULES_DIR, file);
            const rule = require(rulePath);
            
            // SECURITY/STABILITY: Validate rule schema to prevent a single 
            // bad file from crashing the whole engine startup.
            if (!rule.name || typeof rule.priority !== 'number' || typeof rule.condition !== 'function' || typeof rule.action !== 'function') {
                console.warn(`[MatchingEngine] Skipping invalid rule file: ${file}`);
                return null;
            }
            return rule;
        }).filter(Boolean);

        /**
         * CONFLICT RESOLUTION: We sort by priority descending.
         * WHY?: This ensures that 'Mandatory Match' rules (Priority 10) 
         * are evaluated first. If they fail (score = -Infinity), we can 
         * identify disqualifications early.
         */
        knowledgeBase.sort((a, b) => b.priority - a.priority);

        logger.info(`[MatchingEngine] Successfully loaded ${knowledgeBase.length} rules.`);
    } catch (error) {
        logger.error('[MatchingEngine] Failed to load rules directory:', error);
    }
}

// Bootstrap rules on startup
loadRules();

/**
 * NORMALIZATION BENCHMARK
 * WHY 110?: This represents the "Theoretical Perfect Score". 
 * Sum of: Core Skills(60) + GPA(10) + Degree(10) + Location(10) + Profile Quality(10) + Activity(10).
 */
const MAX_THEORETICAL_SCORE = 110;

/**
 * Normalizes a raw score to a 0-100 scale.
 * WHY MATH.MIN 100?: Sometimes bonus rules (like "Recent Activity") might 
 * push a perfect student slightly over the benchmark. We cap it at 100% 
 * for UI consistency.
 */
function normalizeScore(rawScore) {
    if (rawScore <= 0) return 0;
    const normalized = (rawScore / MAX_THEORETICAL_SCORE) * 100;
    return Math.min(Math.round(normalized * 10) / 10, 100);
}

/**
 * Maps a normalized score to a qualitative tier.
 * WHY TIERING?: Users process categories ("EXCELLENT") faster than 
 * raw numbers (87.4). It provides an immediate emotional context.
 */
function determineTier(normalizedScore, disqualified) {
    if (disqualified) return 'DISQUALIFIED';
    if (normalizedScore >= 80) return 'EXCELLENT';
    if (normalizedScore >= 60) return 'GOOD';
    if (normalizedScore >= 40) return 'FAIR';
    if (normalizedScore >= 20) return 'WEAK';
    return 'POOR';
}

/**
 * DTO PATTERN: Flattening Protocol
 * WHY?: Mongoose documents are heavy and contains private methods. 
 * Converting to a plain "Fact Object" (DTO) ensures the Rules 
 * are kept "Pure" and don't depend on database implementation.
 */
function flattenStudent(student) {
    if (!student) return null;
    
    // Ensure we are working with a plain object
    let studentObj = typeof student.toObject === 'function' ? student.toObject() : student;
    
    if (studentObj._flattened) return studentObj;

    // DATA NORMALIZATION: Map UI Friendly Strings to Engine Friendly Constants
    let durationRange = { min: 4, max: 12 }; // Default: 1-3 months
    if (studentObj.personalInfo?.durationPreference === '3-6 months') durationRange = { min: 12, max: 24 };
    if (studentObj.personalInfo?.durationPreference === '6-12 months') durationRange = { min: 24, max: 52 };
    if (studentObj.personalInfo?.durationPreference === '1+ years') durationRange = { min: 52, max: 104 };

    // ENUM MAPPING: Ensure rules don't break if DB value changes slightly
    const rawDegree = studentObj.education?.[0]?.degreeLevel || 'BACHELOR';
    const mappedDegree = rawDegree === 'BACHELOR' ? 'BACHELORS' : (rawDegree === 'MASTER' ? 'MASTERS' : rawDegree);

    return {
        ...studentObj,
        _flattened: true,
        gpa: studentObj.gpa || studentObj.personalInfo?.gpa,
        degreeField: studentObj.education?.[0]?.field,
        educationLevel: mappedDegree,
        preferredLocation: studentObj.personalInfo?.preferredLocation,
        preferredDurationRange: durationRange,
        industriesOfInterest: studentObj.personalInfo?.industriesOfInterest,
        previousInternships: studentObj.personalInfo?.previousInternshipsCount || 0,
        recentApplicationCount: 2, 
        resumeUrl: studentObj.resume?.filePath || studentObj.resumeUrl,
        portfolioUrl: studentObj.personalInfo?.portfolioUrl || studentObj.portfolio?.portfolio || studentObj.portfolioUrl,
        avatarUrl: studentObj.profileImage?.filePath || studentObj.avatarUrl,
        profileCompleteness: studentObj.profileCompletion?.overall || studentObj.profileCompleteness,
    };
}

/**
 * THE INFERENCE LOOP (Forward Chaining)
 * This is the core "AI" loop. It iterates through the entire knowledge base
 * and accumulates score/reasons for every rule where the condition is met.
 */
function evaluatePair(student, internship) {
    const flatStudent = flattenStudent(student);
    const internshipObj = typeof internship.toObject === 'function' ? internship.toObject() : internship;

    // Fact Context Initialization
    const flatInternship = {
        ...internshipObj,
        requiredEducationLevel: internshipObj.educationRequirements || 'BACHELORS',
    };

    const facts = { student: flatStudent, internship: flatInternship };

    let rawScore = 0;
    let disqualified = false;
    const explanationLog = [];

    // EXECUTION STRATEGY: Staggered Evaluation
    for (const rule of knowledgeBase) {
        try {
            // IF condition is met, execute ACTION
            if (rule.condition(facts)) {
                const result = rule.action(facts);

                // Accumulate points
                rawScore += result.scoreAdjustment;

                // TRACEABILITY: Log the reason for this point adjustment.
                // This is what the student sees when they click "Why did I match?"
                const messages = Array.isArray(result.explanation) ? result.explanation : [result.explanation];

                messages.forEach(msg => {
                    explanationLog.push({
                        rule: rule.name,
                        // If disqualified, we use -Infinity to trigger UI color change
                        score: result.scoreAdjustment === -Infinity ? -Infinity : (result.scoreAdjustment / messages.length),
                        detail: msg
                    });
                });

                // TERMINAL STATE: If a mandatory rule is broken
                if (result.scoreAdjustment === -Infinity) {
                    disqualified = true;
                    // WHY NOT BREAK?: We continue the loop so the user gets a 
                    // COMPLETE log of all pros/cons, not just the first error.
                }
            }
        } catch (error) {
            // FAULT TOLERANCE: A single buggy rule should never crash the engine.
            logger.error(`[MatchingEngine] Rule failed to evaluate: ${rule.name}`, error);
        }
    }

    const finalScore = disqualified ? -Infinity : rawScore;
    const normalizedScore = disqualified ? 0 : normalizeScore(finalScore);
    const tier = determineTier(normalizedScore, disqualified);

    return {
        rawScore: finalScore,
        normalizedScore,
        tier,
        explanation: explanationLog
    };
}

/**
 * Rank internships for a student. 
 * DESIGN: We use a simple Array.map and sort.
 * WHY?: For n=500 internships, O(n log n) is more than fast enough for 
 * real-time request/response without needing heavy background queues.
 */
function matchInternshipsForStudent(student, internships) {
    const results = internships.map(internship => {
        const evaluation = evaluatePair(student, internship);
        return {
            internshipId: internship._id || internship.id,
            internshipTitle: internship.positionTitle || internship.title || 'Unknown Title',
            internshipCompany: internship.company || 'Unknown Company',
            ...evaluation
        };
    });

    return results.sort((a, b) => b.rawScore - a.rawScore);
}

/**
 * Rank candidates for an employer.
 */
function matchStudentsForInternship(internship, students) {
    const results = students.map(student => {
        const evaluation = evaluatePair(student, internship);
        return {
            studentId: student._id || student.id,
            studentName: student.name || 'Unknown Student',
            ...evaluation
        };
    });

    return results.sort((a, b) => b.rawScore - a.rawScore);
}

module.exports = {
    matchInternshipsForStudent,
    matchStudentsForInternship,
    explainMatch: (s, i) => evaluatePair(s, i),
    normalizeScore,
    getRulesDirectory: () => knowledgeBase.map(r => ({ name: r.name, priority: r.priority }))
};
