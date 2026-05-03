const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../src/models/User');
const Student = require('../src/models/Student');
const Internship = require('../src/models/Internship');
const { matchInternshipsForStudent } = require('../src/services/matchingEngine');
const { connectDB } = require('../src/config/database');

dotenv.config({ path: path.join(__dirname, '../.env') });

const DOMAINS = ['Software Engineering', 'Data Science', 'UI/UX Design', 'Marketing', 'Product Management'];
const SKILLS = {
    'Software Engineering': ['React', 'Node.js', 'MongoDB'],
    'Data Science': ['Python', 'Machine Learning', 'SQL'],
    'UI/UX Design': ['Figma', 'UI Design', 'Prototyping'],
    'Marketing': ['SEO', 'Content Creation', 'Social Media'],
    'Product Management': ['Agile', 'Jira', 'Roadmapping']
};

async function seedJaffnaData() {
    try {
        console.log('--- Starting Jaffna Test Data Seed ---');
        await connectDB();

        // 1. CLEAR existing Jaffna test data to maintain idempotency
        console.log('Clearing old test data...');
        const usersToDelete = await User.find({ email: /@jaffna\.test$/ });
        const userIds = usersToDelete.map(u => u._id);
        await User.deleteMany({ _id: { $in: userIds } });
        await Student.deleteMany({ userId: { $in: userIds } });
        await Internship.deleteMany({ employer: { $in: userIds } });

        // 2. CREATE 10 Employers & 10 Internships
        console.log('Creating 10 Employers and Internships...');
        const internships = [];
        for (let i = 1; i <= 10; i++) {
            const domain = DOMAINS[i % DOMAINS.length];
            // Create Employer User (which holds employer data)
            const empUser = new User({
                name: `Jaffna Employer ${i}`,
                email: `employer${i}@jaffna.test`,
                password: 'JaffnaMatch2026!',
                role: 'employer',
                isVerified: true,
                verificationStatus: 'approved',
                companyName: `Jaffna Test Corp ${i}`,
                companyDescription: 'Innovating in Jaffna secretly.',
                website: 'https://jaffnatest.com'
            });
            await empUser.save();

            // Create Internship
            const internship = new Internship({
                employer: empUser._id,
                company: `Jaffna Test Corp ${i}`,
                positionTitle: `${domain} Intern`,
                domain: domain,
                workEnvironment: 'On-site',
                location: 'Jaffna',
                duration: '6',
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
                requiredSkills: SKILLS[domain].map(s => ({ name: s, level: 'Intermediate' })),
                preferredSkills: ['Teamwork'],
                description: `A secret internship in Jaffna for ${domain}.`,
                status: 'Hiring',
                minimumGPA: 3.0,
                requiredDegreeField: ['Computer Science', 'IT'],
                educationRequirements: 'BACHELORS',
                experienceLevel: 'Entry Level',
                prefersExperienced: true
            });
            await internship.save();
            internships.push(internship);
        }
        
        // 3. CREATE 20 Students (varying match rates)
        console.log('Creating 20 Structured Students...');
        const students = [];
        for (let i = 1; i <= 20; i++) {
            const stuUser = new User({
                name: `Jaffna Student ${i}`,
                email: `student${i}@jaffna.test`,
                password: 'JaffnaMatch2026!',
                role: 'student',
                isVerified: true,
                verificationStatus: 'approved'
            });
            await stuUser.save();

            // Determine Profile Type Based on Index
            // 1-5: 100% match (EXPERT, proper location, 4.0 GPA)
            // 6-10: ~50% match (Missing explicit skills, lower GPA)
            // 11-20: 0% match (Wrong domain, 0 GPA, missing location)
            
            const targetInternship = internships[i % 5]; // Group to first 5 internships to test specific matches
            const domain = targetInternship.domain;

            let studentProfile = new Student({
                userId: stuUser._id,
                personalInfo: {
                    fullName: `Jaffna Student ${i}`,
                    email: `student${i}@jaffna.test`,
                    phone: '1234567890',
                    isPublic: true
                }
            });

            if (i <= 5) {
                // 100% PERFECT MATCH
                studentProfile.personalInfo.gpa = '4.0';
                studentProfile.personalInfo.preferredLocation = 'Jaffna';
                studentProfile.personalInfo.location = 'Jaffna';
                studentProfile.personalInfo.durationPreference = '6-12 months'; // Match internship
                studentProfile.personalInfo.industriesOfInterest = [domain];
                studentProfile.personalInfo.portfolioUrl = "https://portfolio.com";
                studentProfile.personalInfo.previousInternshipsCount = 2;
                
                studentProfile.education = [{
                    institution: 'Jaffna University',
                    degree: 'BSc',
                    field: 'Computer Science',
                    degreeLevel: 'BACHELOR', // Reverted to valid Enum
                    startDate: new Date('2020-01-01')
                }];

                studentProfile.skills = SKILLS[domain].map(s => ({
                    name: s,
                    proficiency: 'EXPERT'
                }));

                studentProfile.resume = { fileName: 'resume.pdf', filePath: '/uploads/resume.pdf' };
            } else if (i <= 10) {
                // ~50% MATCH (Wrong location, acceptable gpa, beginner skills)
                studentProfile.personalInfo.gpa = '3.0';
                studentProfile.personalInfo.preferredLocation = 'Colombo';
                studentProfile.personalInfo.durationPreference = '3-6 months';
                studentProfile.personalInfo.industriesOfInterest = [domain];
                
                studentProfile.education = [{
                    institution: 'Colombo Tech',
                    degree: 'Diploma',
                    field: 'IT',
                    degreeLevel: 'ASSOCIATE',
                    startDate: new Date('2022-01-01')
                }];

                // Provide partial skills at beginner level
                studentProfile.skills = [
                    { name: SKILLS[domain][0], proficiency: 'BEGINNER' },
                    { name: 'Communication', proficiency: 'INTERMEDIATE' }
                ];
            } else {
                // 0% MATCH (Completely wrong domain, low gpa, no skills matching)
                const wrongDomain = 'Civil Engineering';
                studentProfile.personalInfo.gpa = '2.0';
                studentProfile.personalInfo.preferredLocation = 'Kandy';
                studentProfile.personalInfo.durationPreference = '1-3 months';
                studentProfile.personalInfo.industriesOfInterest = [wrongDomain];
                
                studentProfile.education = [{
                    institution: 'Kandy College',
                    degree: 'Certificate',
                    field: 'Civil Engineering',
                    degreeLevel: 'CERTIFICATE',
                    startDate: new Date('2023-01-01')
                }];

                studentProfile.skills = [
                    { name: 'AutoCAD', proficiency: 'BEGINNER' },
                    { name: 'Surveying', proficiency: 'INTERMEDIATE' }
                ];
            }

            // Calculate profile completeness and save
            studentProfile.calculateProfileCompletion();
            // Force status to complete for top matchers
            if (i <= 5) studentProfile.status = 'complete';
            
            await studentProfile.save();
            students.push(studentProfile);
        }

        console.log('✓ Seeding Completed.');
        
        // 4. TEST THE MATCHING ENGINE
        console.log('\n--- Evaluating Matching Engine ---\n');
        
        // Let's test Student 1 against all internships
        const testStudent = students[0];
        console.log(`Testing Matches for Perfect Student (1): Target Domain = ${testStudent.personalInfo.industriesOfInterest[0]}`);
        console.log('Student Skills:', JSON.stringify(testStudent.skills, null, 2));
        console.log('Internship (Data Science) Required Skills:', JSON.stringify(internships[0].requiredSkills, null, 2));
        
        const rankings = matchInternshipsForStudent(testStudent.toObject(), internships.map(i => i.toObject()));
        
        rankings.slice(0, 3).forEach((rank, idx) => {
            console.log(`#${idx + 1} | ID: ${rank.internshipId} | Title: ${rank.internshipTitle} | Score: ${rank.normalizedScore}% | Tier: ${rank.tier}`);
            console.log('   Explain Log:', JSON.stringify(rank.explanation, null, 2));
        });

        console.log('\n=== ACCOUNTS REPORT ===');
        console.log('Employers: employer1@jaffna.test to employer10@jaffna.test');
        console.log('Students: student1@jaffna.test to student20@jaffna.test');
        console.log('Students 1-5 are 100% Matches for their respective domains.');
        console.log('Global Password: JaffnaMatch2026!');

        process.exit(0);
    } catch (error) {
        console.error('✗ Seeding Failed:', error);
        process.exit(1);
    }
}

seedJaffnaData();
