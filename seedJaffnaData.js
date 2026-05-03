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

// Remove top-level connection to prevent buffering timeout
// mongoose.connect(process.env.MONGODB_URI);

const TEST_PASSWORD = 'Password123!';

const jaffnaStudents = [
    { name: 'Tharaka Sivanesan', email: 'tharaka@jaffna.com', field: 'Computer Science', type: 'Fullstack Developer', location: 'Nallur, Jaffna', skills: ['React', 'Node.js', 'MongoDB', 'TypeScript'] },
    { name: 'Senthuran Balasubramaniam', email: 'senthuran@jaffna.com', field: 'Software Engineering', type: 'Backend Engineer', location: 'Kokuvil, Jaffna', skills: ['Python', 'Django', 'PostgreSQL', 'Docker'] },
    { name: 'Nivetha Ratnam', email: 'nivetha@jaffna.com', field: 'Information Technology', type: 'Frontend Specialist', location: 'Kondavil, Jaffna', skills: ['Vue.js', 'JavaScript', 'CSS3', 'Tailwind'] },
    { name: 'Kirishanth Thavalingam', email: 'kirishanth@jaffna.com', field: 'Computer Science', type: 'Mobile App Developer', location: 'Thirunelveli, Jaffna', skills: ['React Native', 'Flutter', 'Firebase', 'Swift'] },
    { name: 'Abirami Chandrasekar', email: 'abirami@jaffna.com', field: 'Data Science', type: 'Data Analyst', location: 'Kopay, Jaffna', skills: ['R', 'Python', 'Pandas', 'PowerBI'] },
    { name: 'Jegatheesan Murugiah', email: 'jegatheesan@jaffna.com', field: 'Computer Science', type: 'Security Consultant', location: 'Chunnakam, Jaffna', skills: ['Ethical Hacking', 'Linux', 'Networking', 'Wireshark'] },
    { name: 'Vithushan Pathmanathan', email: 'vithushan@jaffna.com', field: 'Software Engineering', type: 'Cloud Architect', location: 'Manipay, Jaffna', skills: ['AWS', 'Azure', 'Kubernetes', 'Terraform'] },
    { name: 'Mathura Ganeshamoorthy', email: 'mathura@jaffna.com', field: 'Design', type: 'UI/UX Designer', location: 'Point Pedro, Jaffna', skills: ['Figma', 'Adobe XD', 'Sketch', 'Prototyping'] },
    { name: 'Kabilan Suntharalingam', email: 'kabilan@jaffna.com', field: 'Artificial Intelligence', type: 'ML Engineer', location: 'Chavakachcheri, Jaffna', skills: ['PyTorch', 'TensorFlow', 'Computer Vision', 'NLP'] },
    { name: 'Pavithra Jegannathan', email: 'pavithra@jaffna.com', field: 'Information Systems', type: 'QA Automation Engineer', location: 'Karainagar, Jaffna', skills: ['Selenium', 'Jest', 'Cypress', 'Automation'] }
];

const jaffnaEmployers = [
    { name: 'Northern Tech Solutions', email: 'hr@northerntech.lk', companyName: 'Northern Tech Solutions', location: 'Nallur, Jaffna', description: 'Premier software development firm in Northern Province.' },
    { name: 'Jaffna Software Systems', email: 'jobs@jaffnasoft.lk', companyName: 'Jaffna Software Systems', location: 'Jaffna City', description: 'Enterprise solutions tailored for the local market.' },
    { name: 'Peninsula Innovations', email: 'contact@peninsula.lk', companyName: 'Peninsula Innovations', location: 'Kokuvil, Jaffna', description: 'Innovating the future of Jaffna through technology.' },
    { name: 'Nallur Digital', email: 'hello@nallurdigital.lk', companyName: 'Nallur Digital', location: 'Nallur, Jaffna', description: 'Creative digital agency specializing in web and branding.' },
    { name: 'Point Pedro Coders', email: 'dev@ppcoders.lk', companyName: 'Point Pedro Coders', location: 'Point Pedro, Jaffna', description: 'Specialized in high-performance computing solutions.' },
    { name: 'Chunnakam IT Hub', email: 'info@chunnakamithub.lk', companyName: 'Chunnakam IT Hub', location: 'Chunnakam, Jaffna', description: 'Empowering local businesses with IT infrastructure.' },
    { name: 'Valvettithurai Ventures', email: 'apply@vvtventures.lk', companyName: 'Valvettithurai Ventures', location: 'Valvettithurai, Jaffna', description: 'Venture capital and tech incubator in Jaffna.' },
    { name: 'Kankesanthurai Logics', email: 'admin@kslogics.lk', companyName: 'Kankesanthurai Logics', location: 'Kankesanthurai, Jaffna', description: 'Logistics and supply chain management software specialists.' },
    { name: 'Karainagar Web Services', email: 'support@karainagarweb.lk', companyName: 'Karainagar Web Services', location: 'Karainagar, Jaffna', description: 'Cloud and web hosting services provider.' },
    { name: 'Kopay App Devs', email: 'hr@kopayapps.lk', companyName: 'Kopay App Devs', location: 'Kopay, Jaffna', description: 'Boutique mobile application development studio.' }
];

const internshipPositions = [
    'Software Development Intern', 'Backend Developer', 'Frontend Developer', 'Mobile App Intern', 'Data Science Intern', 
    'Cybersecurity Associate', 'Cloud Operations Intern', 'UI/UX Design Intern', 'AI Research Intern', 'Quality Assurance Intern'
];

const extraInternshipPositions = [
    'Mobile App Developer (Flutter)', 'Backend Engineer (Node.js)', 'Frontend Engineer (React)', 
    'DevOps Intern', 'Data Analytics Intern', 'Machine Learning Intern', 
    'Security Operations Intern', 'Cloud Architect Trainee', 'Product Design Intern', 'QA Automation Intern'
];

const seedData = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected!');

        console.log('Clearing existing data (Students, Employers, Internships, Applications)...');
        await User.deleteMany({ role: { $in: ['student', 'employer'] } });
        await Student.deleteMany();
        await Internship.deleteMany();
        await Application.deleteMany();
        await Match.deleteMany();

        console.log('Creating 10 Jaffna Employers...');
        const createdEmployers = [];
        for (const empData of jaffnaEmployers) {
            const user = await User.create({
                name: empData.name,
                email: empData.email,
                password: TEST_PASSWORD,
                role: 'employer',
                status: 'approved',
                isVerified: true,
                verificationStatus: 'approved',
                companyName: empData.companyName,
                companyDescription: empData.description,
                location: empData.location,
                website: `https://www.${empData.companyName.toLowerCase().replace(/ /g, '')}.lk`,
                profilePicture: `https://api.dicebear.com/7.x/initials/svg?seed=${empData.companyName}`
            });
            createdEmployers.push(user);
        }

        console.log('Creating 10 Internships (one for each employer)...');
        const createdInternships = [];
        for (let i = 0; i < createdEmployers.length; i++) {
            const employer = createdEmployers[i];
            const internship = await Internship.create({
                employer: employer._id,
                company: employer.companyName,
                positionTitle: internshipPositions[i],
                domain: 'Software Engineering',
                description: `Exciting internship opportunity at ${employer.companyName} for a ${internshipPositions[i]}.`,
                location: employer.location,
                workEnvironment: 'On-site',
                duration: '6 Months',
                expiryDate: new Date(Date.now() + (30 + i * 10) * 24 * 60 * 60 * 1000),
                requiredSkills: [jaffnaStudents[i].skills[0], jaffnaStudents[i].skills[1]],
                requiredDegreeField: [jaffnaStudents[i].field, 'Information Technology', 'Software Engineering'],
                status: 'Hiring',
                numberOfOpenings: 2,
                experienceLevel: 'Entry Level',
                stipend: { amount: 15000 + (i * 2500), currency: 'LKR' }
            });
            createdInternships.push(internship);
        }

        console.log('Creating 10 EXTRA Internships (another for each employer)...');
        for (let i = 0; i < createdEmployers.length; i++) {
            const employer = createdEmployers[i];
            const internship = await Internship.create({
                employer: employer._id,
                company: employer.companyName,
                positionTitle: extraInternshipPositions[i],
                domain: 'Software Engineering',
                description: `Further exciting internship opportunity at ${employer.companyName} for a ${extraInternshipPositions[i]}.`,
                location: employer.location,
                workEnvironment: 'Remote',
                duration: '3 Months',
                expiryDate: new Date(Date.now() + (45 + i * 10) * 24 * 60 * 60 * 1000),
                requiredSkills: [jaffnaStudents[(i+5)%10].skills[0], jaffnaStudents[(i+5)%10].skills[1]],
                requiredDegreeField: [jaffnaStudents[(i+5)%10].field, 'Information Technology', 'Computer Science'],
                status: 'Hiring',
                numberOfOpenings: 3,
                experienceLevel: 'Entry Level',
                stipend: { amount: 18000 + (i * 2000), currency: 'LKR' }
            });
            createdInternships.push(internship);
        }

        console.log('Creating 10 Jaffna Students with full profiles...');
        const createdStudents = [];
        for (const sData of jaffnaStudents) {
            const user = await User.create({
                name: sData.name,
                email: sData.email,
                password: TEST_PASSWORD,
                role: 'student',
                status: 'approved',
                isVerified: true,
                verificationStatus: 'approved',
                profilePicture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${sData.name.replace(' ', '')}`
            });

            const studentProfile = await Student.create({
                userId: user._id,
                personalInfo: {
                    fullName: sData.name,
                    email: sData.email,
                    designation: sData.type,
                    location: sData.location,
                    gpa: (3.2 + Math.random() * 0.7).toFixed(2),
                    preferredLocation: ['Jaffna'],
                    durationPreference: '6-12 months',
                    industriesOfInterest: ['Technology', 'Software Engineering'],
                    isPublic: true
                },
                skills: sData.skills.map(skill => ({ name: skill, proficiency: 'INTERMEDIATE' })),
                education: [{
                    institution: 'University of Jaffna',
                    degree: 'Bachelor of Science in Engineering',
                    field: sData.field,
                    degreeLevel: 'BACHELOR',
                    startDate: new Date('2021-01-01'),
                    isCurrentlyStudying: true
                }],
                status: 'complete',
                profileCompletion: { overall: 100 }
            });
            createdStudents.push({ user, profile: studentProfile });
        }

        console.log('Applying students to internships...');
        // Each student applies to 2 random internships
        for (const studentObj of createdStudents) {
            const randomIndexes = [];
            while (randomIndexes.length < 2) {
                const r = Math.floor(Math.random() * createdInternships.length);
                if (randomIndexes.indexOf(r) === -1) randomIndexes.push(r);
            }

            for (const idx of randomIndexes) {
                const internship = createdInternships[idx];
                await Application.create({
                    student: studentObj.user._id,
                    internship: internship._id,
                    employer: internship.employer,
                    status: ['Applied', 'Reviewing', 'Interviewing'][Math.floor(Math.random() * 3)],
                    matchScore: 70 + Math.floor(Math.random() * 25),
                    answers: [{ question: 'Why are you interested?', answer: 'I want to contribute to the growing tech ecosystem in Jaffna.' }],
                    resume: `https://storage.googleapis.com/jaffna-interns/resumes/${studentObj.user._id}.pdf`
                });
            }
        }

        console.log('----------------------------------------------------');
        console.log('Jaffna Test Data Seeded Successfully!');
        console.log(`- 10 Employers created in Jaffna`);
        console.log(`- 10 Internships posted`);
        console.log(`- 10 Students created with Jaffna Tamil names`);
        console.log(`- 20 Applications submitted`);
        console.log('----------------------------------------------------');
        process.exit(0);
    } catch (err) {
        console.error('Seed Error:', err);
        process.exit(1);
    }
};

seedData();
