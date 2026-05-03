const mongoose = require('mongoose');
const User = require('./src/models/User');
const Internship = require('./src/models/Internship');
require('dotenv').config();

const seedInternships = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const employer = await User.findOne({ email: 'employer@test.com' });
        if (!employer) {
            console.error('Employer not found. Run seedUsers.js first.');
            process.exit(1);
        }

        const internships = [
            {
                employer: employer._id,
                positionTitle: 'Full Stack Engineering Intern',
                domain: 'Software Engineering',
                workEnvironment: 'Remote',
                location: 'San Francisco, CA',
                duration: '6 Months',
                expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // 1 month from now
                requiredSkills: [{ skillName: 'React', proficiencyLevel: 'Intermediate' }, { skillName: 'Node.js', proficiencyLevel: 'Intermediate' }],
                description: 'Join our team to build scalable web applications using React and Node.js. Great learning opportunity!',
                company: employer.companyName || 'Test Corp',
                status: 'Active',
                numberOfOpenings: 3,
                experienceLevel: 'Entry Level',
                stipend: { amount: 5000, currency: 'USD' },
                requiredDegreeField: ['Computer Science', 'Software Engineering'],
                perks: ['Mentorship', 'Flexible Hours', 'Stock Options']
            },
            {
                employer: employer._id,
                positionTitle: 'Data Science Intern',
                domain: 'Data Science',
                workEnvironment: 'Hybrid',
                location: 'New York, NY',
                duration: '3 Months',
                expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 2)),
                requiredSkills: [{ skillName: 'Python', proficiencyLevel: 'Advanced' }, { skillName: 'Machine Learning', proficiencyLevel: 'Basic' }],
                description: 'Analyze large datasets and build predictive models. Work closely with our senior data scientists.',
                company: employer.companyName || 'Test Corp',
                status: 'Active',
                numberOfOpenings: 1,
                experienceLevel: 'Entry Level',
                stipend: { amount: 4500, currency: 'USD' },
                requiredDegreeField: ['Data Science', 'Statistics', 'Computer Science'],
                perks: ['Free Lunch', 'Commuter Benefits']
            },
            {
                employer: employer._id,
                positionTitle: 'UX/UI Design Intern',
                domain: 'Design',
                workEnvironment: 'Remote',
                location: 'London, UK',
                duration: '3 Months',
                expiryDate: new Date(new Date().setDate(new Date().getDate() + 15)),
                requiredSkills: [{ skillName: 'Figma', proficiencyLevel: 'Advanced' }, { skillName: 'Prototyping', proficiencyLevel: 'Intermediate' }],
                description: 'Help design beautiful and intuitive user interfaces for our flagship product.',
                company: employer.companyName || 'Test Corp',
                status: 'Active',
                numberOfOpenings: 2,
                experienceLevel: 'Entry Level',
                stipend: { amount: 3000, currency: 'GBP' },
                requiredDegreeField: ['Interaction Design', 'Graphic Design'],
                perks: ['Remote Work Stipend', 'Creative Environment']
            }
        ];

        for (const data of internships) {
            const existing = await Internship.findOne({ positionTitle: data.positionTitle, employer: employer._id });
            if (!existing) {
                await Internship.create(data);
                console.log(`Created internship: ${data.positionTitle}`);
            } else {
                console.log(`Internship already exists: ${data.positionTitle}`);
            }
        }

        console.log('Internship seeding complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding internships:', error);
        process.exit(1);
    }
};

seedInternships();
