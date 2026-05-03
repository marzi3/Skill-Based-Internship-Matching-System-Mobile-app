const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: './.env' });

// Load models
const User = require('./src/models/User');
const Student = require('./src/models/Student');
const Internship = require('./src/models/Internship');
const Application = require('./src/models/Application');
const Message = require('./src/models/Message');
const Notification = require('./src/models/Notification');
const Match = require('./src/models/Match');
const MatchingEngine = require('./src/services/matchingEngine');

mongoose.connect(process.env.MONGODB_URI);

const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;
const TEST_PASSWORD = 'Password123!';

const seedData = async () => {
    try {
        console.log('Clearing entire test database...');
        await User.deleteMany({ role: { $in: ['student', 'employer'] } });
        await Student.deleteMany();
        await Internship.deleteMany();
        await Application.deleteMany();
        await Message.deleteMany();
        await Notification.deleteMany();
        await Match.deleteMany();

        console.log('----------------------------------------------------');
        console.log('0. Creating Admin...');
        await User.findOneAndUpdate(
            { email: 'admin@test.com' },
            { name: 'System Admin', password: TEST_PASSWORD, role: 'admin', status: 'approved', isVerified: true, verificationStatus: 'approved' },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        console.log('----------------------------------------------------');
        console.log('1. Creating Employers...');

        const emp1 = await User.create({
            name: 'TechCorp Solutions', email: 'employer1@test.com', password: TEST_PASSWORD,
            role: 'employer', status: 'approved', isVerified: true, verificationStatus: 'approved',
            companyName: 'TechCorp Solutions', businessRegistrationNumber: 'TX-12345',
            companyDescription: 'Leading enterprise software solutions.', website: 'https://techcorp.example.com',
            profilePicture: 'https://api.dicebear.com/7.x/initials/svg?seed=TC'
        });

        const emp2 = await User.create({
            name: 'Incubator Labs', email: 'employer2@test.com', password: TEST_PASSWORD,
            role: 'employer', status: 'approved', isVerified: true, verificationStatus: 'approved',
            companyName: 'Incubator Labs', businessRegistrationNumber: 'IL-98765',
            companyDescription: 'Fast-paced startup focusing on AI.', website: 'https://incubatorlabs.example.com',
            profilePicture: 'https://api.dicebear.com/7.x/initials/svg?seed=IL'
        });

        const emp3 = await User.create({
            name: 'FinanceFlow', email: 'employer3@test.com', password: TEST_PASSWORD,
            role: 'employer', status: 'approved', isVerified: true, verificationStatus: 'approved',
            companyName: 'FinanceFlow Group', businessRegistrationNumber: 'FF-44556',
            companyDescription: 'Global FinTech leaders.', website: 'https://financeflow.example.com',
            profilePicture: 'https://api.dicebear.com/7.x/initials/svg?seed=FF'
        });

        console.log('----------------------------------------------------');
        console.log('2. Creating Diverse Internships...');

        const internshipsData = [
            {
                employer: emp1._id,
                positionTitle: 'Frontend React Developer', domain: 'Software Engineering',
                workEnvironment: 'Remote', location: 'Remote', duration: '3 Months',
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                requiredSkills: ['React', 'JavaScript', 'Tailwind CSS', 'Redux'],
                requiredDegreeField: ['Computer Science', 'Information Technology'],
                description: 'Build fast and responsive UIs with modern React.', company: emp1.companyName,
                status: 'Hiring', numberOfOpenings: 3, experienceLevel: 'Intermediate',
                stipend: { amount: 25000, currency: 'INR' }, perks: ['Flexible Hours', 'Certificate']
            },
            {
                employer: emp1._id,
                positionTitle: 'Backend Node.js Engineer', domain: 'Software Engineering',
                workEnvironment: 'Hybrid', location: 'Bangalore', duration: '6 Months',
                expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                requiredSkills: ['Node.js', 'Express', 'MongoDB', 'REST APIs'],
                requiredDegreeField: ['Computer Science', 'Software Engineering'],
                description: 'Design and optimize scalable backend microservices.', company: emp1.companyName,
                status: 'Hiring', numberOfOpenings: 2, experienceLevel: 'Advanced', minimumGPA: 3.5,
                stipend: { amount: 35000, currency: 'INR' }
            },
            {
                employer: emp2._id,
                positionTitle: 'AI / Machine Learning Intern', domain: 'Data Science',
                workEnvironment: 'Remote', location: 'Remote', duration: '6 Months',
                expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                requiredSkills: ['Python', 'TensorFlow', 'PyTorch', 'Data Analysis'],
                requiredDegreeField: ['Computer Science', 'Data Science', 'Mathematics'],
                description: 'Train models for our advanced generative AI platform.', company: emp2.companyName,
                status: 'Hiring', numberOfOpenings: 1, experienceLevel: 'Entry Level',
                stipend: { amount: 40000, currency: 'INR' }, perks: ['GPU Access', 'Mentorship']
            },
            {
                employer: emp2._id,
                positionTitle: 'UI/UX Design Intern', domain: 'Design',
                workEnvironment: 'On-site', location: 'Mumbai', duration: '3 Months',
                expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
                requiredSkills: ['Figma', 'UI Design', 'Wireframing', 'Prototyping'],
                requiredDegreeField: ['Design', 'Graphic Arts', 'Information Architecture'],
                description: 'Redesign our core mobile applications.', company: emp2.companyName,
                status: 'Hiring', numberOfOpenings: 2, experienceLevel: 'Entry Level',
                stipend: { amount: 15000, currency: 'INR' }, perks: ['Free Food', 'MacBook Provided']
            },
            {
                employer: emp3._id,
                positionTitle: 'Financial Analyst Intern', domain: 'Finance',
                workEnvironment: 'Hybrid', location: 'Delhi', duration: '12 Months',
                expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                requiredSkills: ['Excel', 'Financial Modeling', 'Data Analysis'],
                requiredDegreeField: ['Finance', 'Business Administration', 'Economics'],
                description: 'Analyze market trends and prepare financial forecasts.', company: emp3.companyName,
                status: 'Hiring', numberOfOpenings: 5, experienceLevel: 'Entry Level', minimumGPA: 3.0,
                stipend: { amount: 20000, currency: 'INR' }
            },
            {
                employer: emp3._id,
                positionTitle: 'Cybersecurity Intern', domain: 'Cybersecurity',
                workEnvironment: 'Remote', location: 'Remote', duration: '6 Months',
                expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
                requiredSkills: ['Network Security', 'Penetration Testing', 'Linux'],
                requiredDegreeField: ['Computer Science', 'Cybersecurity'],
                description: 'Help secure our FinTech infrastructure against modern threats.', company: emp3.companyName,
                status: 'Hiring', numberOfOpenings: 2, experienceLevel: 'Intermediate',
                stipend: { amount: 30000, currency: 'INR' }
            }
        ];

        const internships = await Internship.insertMany(internshipsData);

        console.log('----------------------------------------------------');
        console.log('3. Creating Diverse Students...');

        const studentsBase = [
            {
                name: 'Alex Johnson', email: 'student1@test.com', field: 'Computer Science',
                skills: ['React', 'JavaScript', 'Tailwind CSS', 'Redux', 'Node.js'], location: 'Remote',
                gpa: '3.8', type: 'Frontend Rockstar'
            },
            {
                name: 'Sam Smith', email: 'student2@test.com', field: 'Software Engineering',
                skills: ['Node.js', 'Express', 'MongoDB', 'Python', 'Docker'], location: 'Bangalore',
                gpa: '3.6', type: 'Backend Specialist'
            },
            {
                name: 'Priya Patel', email: 'student3@test.com', field: 'Data Science',
                skills: ['Python', 'TensorFlow', 'Data Analysis', 'SQL'], location: 'Pune',
                gpa: '3.9', type: 'AI Enthusiast'
            },
            {
                name: 'David Chen', email: 'student4@test.com', field: 'Design',
                skills: ['Figma', 'UI Design', 'Adobe XD', 'Wireframing'], location: 'Mumbai',
                gpa: '3.2', type: 'Creative Designer'
            },
            {
                name: 'Sarah Williams', email: 'student5@test.com', field: 'Finance',
                skills: ['Excel', 'Financial Modeling', 'Tableau'], location: 'Delhi',
                gpa: '3.4', type: 'Finance Guru'
            },
            {
                name: 'Michael Brown', email: 'student6@test.com', field: 'Cybersecurity',
                skills: ['Linux', 'Network Security', 'Python', 'Wireshark'], location: 'Remote',
                gpa: '3.1', type: 'Security Expert'
            }
        ];

        const createdStudents = [];

        for (const [idx, sBase] of studentsBase.entries()) {
            const user = await User.create({
                name: sBase.name, email: sBase.email, password: TEST_PASSWORD,
                role: 'student', status: 'approved', isVerified: true, verificationStatus: 'approved',
                profilePicture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${sBase.name.replace(' ', '')}`
            });

            const studentDoc = await Student.create({
                userId: user._id,
                personalInfo: {
                    fullName: sBase.name, email: sBase.email,
                    designation: sBase.type, location: sBase.location,
                    gpa: sBase.gpa, preferredLocation: sBase.location === 'Remote' ? 'Remote' : 'Hybrid',
                    durationPreference: '6-12 months', industriesOfInterest: [internshipsData[idx].domain],
                    isPublic: true
                },
                skills: sBase.skills.map(skill => ({ name: skill, proficiency: 'ADVANCED' })),
                education: [{
                    institution: 'Global Tech University', degree: 'Bachelor',
                    field: sBase.field, degreeLevel: 'BACHELOR',
                    startDate: new Date('2021-08-01'), isCurrentlyStudying: true
                }],
                status: 'complete', profileCompletion: { overall: 100 }
            });
            createdStudents.push({ user, studentProfile: studentDoc });
        }

        console.log('----------------------------------------------------');
        console.log('4. Seeding Applications & Engagement...');

        // Alex (Frontend) applies to Frontend React Developer
        const app1 = await Application.create({
            student: createdStudents[0].user._id, internship: internships[0]._id, employer: emp1._id,
            status: 'Reviewing', matchScore: 95,
            answers: [{ question: 'Why apply?', answer: 'I have built 5 React apps.' }],
            resume: 'https://example.com/alex-resume.pdf'
        });

        // Sam (Backend) applies to Backend Node.js Engineering AND CyberSec
        await Application.create({
            student: createdStudents[1].user._id, internship: internships[1]._id, employer: emp1._id,
            status: 'Interviewing', matchScore: 88,
            answers: [{ question: 'Why apply?', answer: 'Node is my primary stack.' }],
            resume: 'https://example.com/sam-resume.pdf'
        });
        await Application.create({
            student: createdStudents[1].user._id, internship: internships[5]._id, employer: emp3._id,
            status: 'Applied', matchScore: 45,
            answers: [{ question: 'Why apply?', answer: 'I want to learn security.' }],
            resume: 'https://example.com/sam-resume-sec.pdf'
        });

        // Priya (AI) applies to AI/ML Intern
        await Application.create({
            student: createdStudents[2].user._id, internship: internships[2]._id, employer: emp2._id,
            status: 'Accepted', matchScore: 98,
            answers: [{ question: 'Why apply?', answer: 'Trained models on AWS.' }],
            resume: 'https://example.com/priya-resume.pdf'
        });

        // David (Design) applies to UI/UX
        await Application.create({
            student: createdStudents[3].user._id, internship: internships[3]._id, employer: emp2._id,
            status: 'Rejected', matchScore: 85,
            answers: [{ question: 'Why apply?', answer: 'I love Figma.' }],
            resume: 'https://example.com/david-portfolio.pdf'
        });

        console.log('----------------------------------------------------');
        console.log('5. Populating Internal Messages & Notifications...');

        await Message.create({
            applicationId: app1._id, senderId: emp1._id, receiverId: createdStudents[0].user._id,
            content: 'Hi Alex, your portfolio looks incredible. When are you free for a technical interview call?',
            isRead: false
        });

        await Notification.create({
            userId: createdStudents[0].user._id, type: 'NEW_MATCH',
            message: `You have a 95% match for ${internships[0].positionTitle} at TechCorp Solutions`,
            link: `/internships/${internships[0]._id}`
        });

        await Notification.create({
            userId: createdStudents[1].user._id, type: 'APPLICATION_STATUS',
            message: `Your application to Backend Node.js Engineer moved to Interview stage!`,
            link: `/applications`
        });

        // Add Employer Notifications for "Recent Activity"
        await Notification.create({
            userId: emp1._id, type: 'APPLICATION_RECEIVED',
            message: `New application received for Frontend React Developer from Alex Johnson`,
            link: `/employer/applications`
        });
        await Notification.create({
            userId: emp1._id, type: 'NEW_MESSAGE',
            message: `You have a new message regarding the Node.js Engineer position`,
            link: `/employer/messages`
        });
        await Notification.create({
            userId: emp2._id, type: 'APPLICATION_RECEIVED',
            message: `New application received for AI / Machine Learning Intern from Priya Patel`,
            link: `/employer/applications`
        });
        
        console.log('----------------------------------------------------');
        console.log('6. Seeding Match Caching Engine...');

        // Let's create dummy match cache records for the students
        const studentsToMatch = createdStudents.map(c => c.studentProfile);

        for (const stu of studentsToMatch) {
            let matches = MatchingEngine.matchInternshipsForStudent(stu, internships);
            matches = matches.filter(m => m.tier !== 'DISQUALIFIED').slice(0, 3);

            for (const matchObj of matches) {
                const fullInternship = internships.find(int => int._id.toString() === matchObj.internshipId.toString());
                await Match.create({
                    student: stu._id,
                    internship: fullInternship._id,
                    employer: fullInternship.employer,
                    rawScore: matchObj.rawScore,
                    normalizedScore: matchObj.normalizedScore || (matchObj.tier === 'EXCELLENT' ? 90 : 75),
                    tier: matchObj.tier,
                    explanations: matchObj.explanation || [],
                    status: 'Pending'
                });
            }
        }


        console.log('----------------------------------------------------');
        console.log('Seed Completed Successfully. Database beautifully populated!');
        process.exit();
    } catch (err) {
        console.error('Seed Error:', err);
        process.exit(1);
    }
};

seedData();
