/**
 * Seed script: Inserts diverse internships across multiple employers
 * to stress-test the matching engine with varied skill/domain combos.
 *
 * Usage: node scripts/seedInternships.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI;

// Employer IDs from the database
const EMPLOYERS = {
  techcorp:   '69c02943d0cd5d7e7182cc80', // TechCorp Solutions
  incubator:  '69c02943d0cd5d7e7182cc82', // Incubator Labs
  financeflow:'69c02944d0cd5d7e7182cc84', // FinanceFlow Group
};

const sixMonthsFromNow = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

const internships = [
  // ──────── TechCorp Solutions ────────
  {
    employer: EMPLOYERS.techcorp,
    company: 'TechCorp Solutions',
    positionTitle: 'Frontend React Developer Intern',
    domain: 'Software Engineering',
    workEnvironment: 'Remote',
    location: 'Colombo, Sri Lanka',
    duration: '6 Months',
    expiryDate: sixMonthsFromNow,
    requiredSkills: [
      { name: 'React', mandatory: true },
      { name: 'JavaScript', mandatory: true },
      { name: 'Tailwind CSS', mandatory: false },
      { name: 'Redux', mandatory: false },
    ],
    preferredSkills: ['TypeScript', 'Next.js', 'Figma'],
    description: 'Join our frontend team to build modern, responsive web applications using React and Tailwind CSS. You will work on real customer-facing products, participate in code reviews, and ship features weekly.',
    status: 'Hiring',
    numberOfOpenings: 3,
    experienceLevel: 'Entry Level',
    minimumGPA: 2.8,
    requiredDegreeField: ['Computer Science', 'Software Engineering', 'Information Technology'],
    stipend: { amount: 45000, currency: 'LKR' },
    perks: ['Flexible hours', 'Certificate of completion', 'Mentorship'],
  },
  {
    employer: EMPLOYERS.techcorp,
    company: 'TechCorp Solutions',
    positionTitle: 'Full Stack MERN Developer Intern',
    domain: 'Software Engineering',
    workEnvironment: 'Hybrid',
    location: 'Colombo, Sri Lanka',
    duration: '6 Months',
    expiryDate: sixMonthsFromNow,
    requiredSkills: [
      { name: 'Node.js', mandatory: true },
      { name: 'Express', mandatory: true },
      { name: 'MongoDB', mandatory: true },
      { name: 'React', mandatory: true },
    ],
    preferredSkills: ['Docker', 'AWS', 'GraphQL'],
    description: 'Work across the full MERN stack building internal tools and SaaS products. End-to-end feature ownership from database schema to polished UI components.',
    status: 'Hiring',
    numberOfOpenings: 2,
    experienceLevel: 'Entry Level',
    minimumGPA: 3.0,
    requiredDegreeField: ['Computer Science', 'Software Engineering'],
    stipend: { amount: 55000, currency: 'LKR' },
    perks: ['Gym access', 'Team lunches', 'Laptop provided'],
  },
  {
    employer: EMPLOYERS.techcorp,
    company: 'TechCorp Solutions',
    positionTitle: 'DevOps & Cloud Infrastructure Intern',
    domain: 'Software Engineering',
    workEnvironment: 'On-site',
    location: 'Colombo, Sri Lanka',
    duration: '3 Months',
    expiryDate: sixMonthsFromNow,
    requiredSkills: [
      { name: 'Docker', mandatory: true },
      { name: 'Linux', mandatory: true },
      { name: 'AWS', mandatory: false },
      { name: 'CI/CD', mandatory: false },
    ],
    preferredSkills: ['Kubernetes', 'Terraform', 'Ansible'],
    description: 'Automate deployments, manage cloud infrastructure on AWS, and build CI/CD pipelines. Ideal for students passionate about infrastructure-as-code and site reliability.',
    status: 'Hiring',
    numberOfOpenings: 1,
    experienceLevel: 'Entry Level',
    minimumGPA: 2.5,
    requiredDegreeField: ['Computer Science', 'Software Engineering', 'Information Technology'],
    stipend: { amount: 50000, currency: 'LKR' },
    perks: ['AWS certification voucher', 'Mentorship'],
  },
  {
    employer: EMPLOYERS.techcorp,
    company: 'TechCorp Solutions',
    positionTitle: 'Mobile App Developer Intern (React Native)',
    domain: 'Software Engineering',
    workEnvironment: 'Remote',
    location: 'Colombo, Sri Lanka',
    duration: '6 Months',
    expiryDate: sixMonthsFromNow,
    requiredSkills: [
      { name: 'React', mandatory: true },
      { name: 'JavaScript', mandatory: true },
      { name: 'React Native', mandatory: true },
    ],
    preferredSkills: ['Expo', 'Firebase', 'Redux'],
    description: 'Build cross-platform mobile apps for iOS and Android using React Native. Collaborate with the design team on user experience and deliver production-ready features.',
    status: 'Hiring',
    numberOfOpenings: 2,
    experienceLevel: 'Entry Level',
    minimumGPA: 2.8,
    requiredDegreeField: ['Computer Science', 'Software Engineering', 'Information Technology'],
    stipend: { amount: 40000, currency: 'LKR' },
    perks: ['Remote work', 'Learning allowance'],
  },

  // ──────── Incubator Labs ────────
  {
    employer: EMPLOYERS.incubator,
    company: 'Incubator Labs',
    positionTitle: 'Machine Learning Research Intern',
    domain: 'Data Science',
    workEnvironment: 'Remote',
    location: 'Kandy, Sri Lanka',
    duration: '6 Months',
    expiryDate: sixMonthsFromNow,
    requiredSkills: [
      { name: 'Python', mandatory: true },
      { name: 'TensorFlow', mandatory: false },
      { name: 'Machine Learning', mandatory: true },
    ],
    preferredSkills: ['PyTorch', 'Pandas', 'NumPy', 'Jupyter'],
    description: 'Conduct ML research on NLP and computer vision problems. Build, train, and evaluate models. Publish findings in internal tech reports and assist with academic paper submissions.',
    status: 'Hiring',
    numberOfOpenings: 2,
    experienceLevel: 'Entry Level',
    minimumGPA: 3.2,
    requiredDegreeField: ['Computer Science', 'Data Science', 'Mathematics', 'Statistics'],
    stipend: { amount: 60000, currency: 'LKR' },
    perks: ['GPU access', 'Research mentorship', 'Conference attendance'],
  },
  {
    employer: EMPLOYERS.incubator,
    company: 'Incubator Labs',
    positionTitle: 'Data Analytics Intern',
    domain: 'Data Science',
    workEnvironment: 'Hybrid',
    location: 'Kandy, Sri Lanka',
    duration: '3 Months',
    expiryDate: sixMonthsFromNow,
    requiredSkills: [
      { name: 'Python', mandatory: true },
      { name: 'SQL', mandatory: true },
      { name: 'Excel', mandatory: false },
    ],
    preferredSkills: ['Power BI', 'Tableau', 'Pandas'],
    description: 'Analyze business datasets to uncover trends and generate actionable insights. Create dashboards and automated reporting pipelines for stakeholders.',
    status: 'Hiring',
    numberOfOpenings: 3,
    experienceLevel: 'Entry Level',
    minimumGPA: 2.5,
    requiredDegreeField: ['Data Science', 'Computer Science', 'Mathematics', 'Business Analytics'],
    stipend: { amount: 35000, currency: 'LKR' },
    perks: ['Flexible schedule', 'Certificate'],
  },
  {
    employer: EMPLOYERS.incubator,
    company: 'Incubator Labs',
    positionTitle: 'Cybersecurity Analyst Intern',
    domain: 'Cybersecurity',
    workEnvironment: 'On-site',
    location: 'Kandy, Sri Lanka',
    duration: '6 Months',
    expiryDate: sixMonthsFromNow,
    requiredSkills: [
      { name: 'Network Security', mandatory: true },
      { name: 'Linux', mandatory: true },
      { name: 'Python', mandatory: false },
      { name: 'Wireshark', mandatory: false },
    ],
    preferredSkills: ['Penetration Testing', 'SIEM', 'Burp Suite'],
    description: 'Monitor and analyze security threats, perform vulnerability assessments, and assist with penetration testing engagements. Work with our SOC team on incident response.',
    status: 'Hiring',
    numberOfOpenings: 1,
    experienceLevel: 'Entry Level',
    minimumGPA: 3.0,
    requiredDegreeField: ['Cybersecurity', 'Computer Science', 'Information Technology'],
    stipend: { amount: 50000, currency: 'LKR' },
    perks: ['Security certifications', 'Hands-on lab access'],
  },
  {
    employer: EMPLOYERS.incubator,
    company: 'Incubator Labs',
    positionTitle: 'Backend API Developer Intern',
    domain: 'Software Engineering',
    workEnvironment: 'Remote',
    location: 'Kandy, Sri Lanka',
    duration: '3 Months',
    expiryDate: sixMonthsFromNow,
    requiredSkills: [
      { name: 'Node.js', mandatory: true },
      { name: 'Express', mandatory: true },
      { name: 'MongoDB', mandatory: false },
    ],
    preferredSkills: ['PostgreSQL', 'Redis', 'Jest'],
    description: 'Design and implement RESTful APIs for our startup products. Write clean, testable code with comprehensive documentation and integration tests.',
    status: 'Hiring',
    numberOfOpenings: 2,
    experienceLevel: 'Entry Level',
    minimumGPA: 2.8,
    requiredDegreeField: ['Computer Science', 'Software Engineering'],
    stipend: { amount: 42000, currency: 'LKR' },
    perks: ['Remote work', 'Open-source contributions'],
  },

  // ──────── FinanceFlow Group ────────
  {
    employer: EMPLOYERS.financeflow,
    company: 'FinanceFlow Group',
    positionTitle: 'UI/UX Design Intern',
    domain: 'Design',
    workEnvironment: 'Remote',
    location: 'Galle, Sri Lanka',
    duration: '3 Months',
    expiryDate: sixMonthsFromNow,
    requiredSkills: [
      { name: 'Figma', mandatory: true },
      { name: 'UI Design', mandatory: true },
    ],
    preferredSkills: ['Adobe XD', 'Prototyping', 'User Research', 'Tailwind CSS'],
    description: 'Redesign our fintech product interfaces with a focus on usability and accessibility. Create wireframes, prototypes, and production-ready design systems in Figma.',
    status: 'Hiring',
    numberOfOpenings: 2,
    experienceLevel: 'Entry Level',
    minimumGPA: 2.5,
    requiredDegreeField: ['Design', 'Computer Science', 'Information Technology', 'Multimedia'],
    stipend: { amount: 38000, currency: 'LKR' },
    perks: ['Design tool licenses', 'Portfolio mentorship'],
  },
  {
    employer: EMPLOYERS.financeflow,
    company: 'FinanceFlow Group',
    positionTitle: 'Financial Data Analyst Intern',
    domain: 'Finance',
    workEnvironment: 'On-site',
    location: 'Galle, Sri Lanka',
    duration: '6 Months',
    expiryDate: sixMonthsFromNow,
    requiredSkills: [
      { name: 'Excel', mandatory: true },
      { name: 'SQL', mandatory: true },
      { name: 'Python', mandatory: false },
    ],
    preferredSkills: ['Power BI', 'R', 'Financial Modeling'],
    description: 'Support the finance team with data-driven analysis, build automated reporting templates, and help develop risk assessment models for lending products.',
    status: 'Hiring',
    numberOfOpenings: 2,
    experienceLevel: 'Entry Level',
    minimumGPA: 3.0,
    requiredDegreeField: ['Finance', 'Business Analytics', 'Mathematics', 'Data Science'],
    stipend: { amount: 48000, currency: 'LKR' },
    perks: ['Financial certifications', 'Networking events'],
  },
  {
    employer: EMPLOYERS.financeflow,
    company: 'FinanceFlow Group',
    positionTitle: 'Blockchain Developer Intern',
    domain: 'Software Engineering',
    workEnvironment: 'Remote',
    location: 'Galle, Sri Lanka',
    duration: '6 Months',
    expiryDate: sixMonthsFromNow,
    requiredSkills: [
      { name: 'JavaScript', mandatory: true },
      { name: 'Solidity', mandatory: true },
      { name: 'Node.js', mandatory: false },
    ],
    preferredSkills: ['Ethereum', 'Web3.js', 'Smart Contracts', 'Hardhat'],
    description: 'Develop and audit smart contracts for DeFi applications. Integrate blockchain wallets and build frontend interfaces for decentralized products.',
    status: 'Hiring',
    numberOfOpenings: 1,
    experienceLevel: 'Entry Level',
    minimumGPA: 3.0,
    prefersExperienced: true,
    requiredDegreeField: ['Computer Science', 'Software Engineering'],
    stipend: { amount: 65000, currency: 'LKR' },
    perks: ['Crypto education', 'Hackathon participation'],
  },
  {
    employer: EMPLOYERS.financeflow,
    company: 'FinanceFlow Group',
    positionTitle: 'QA & Test Automation Intern',
    domain: 'Software Engineering',
    workEnvironment: 'Hybrid',
    location: 'Galle, Sri Lanka',
    duration: '3 Months',
    expiryDate: sixMonthsFromNow,
    requiredSkills: [
      { name: 'JavaScript', mandatory: true },
      { name: 'Selenium', mandatory: false },
      { name: 'Jest', mandatory: false },
    ],
    preferredSkills: ['Cypress', 'Playwright', 'Postman', 'CI/CD'],
    description: 'Write end-to-end and unit tests for our web applications. Build test automation frameworks, track defects, and help improve our release quality gates.',
    status: 'Hiring',
    numberOfOpenings: 2,
    experienceLevel: 'Entry Level',
    minimumGPA: 2.5,
    requiredDegreeField: ['Computer Science', 'Software Engineering', 'Information Technology'],
    stipend: { amount: 35000, currency: 'LKR' },
    perks: ['Quality certification', 'Agile training'],
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const Internship = require('../src/models/Internship');

    const result = await Internship.insertMany(internships);
    console.log(`✅ Seeded ${result.length} internships successfully`);

    // Print summary
    const byCompany = {};
    result.forEach(i => {
      byCompany[i.company] = (byCompany[i.company] || 0) + 1;
    });
    console.log('\n📊 Breakdown by company:');
    Object.entries(byCompany).forEach(([company, count]) => {
      console.log(`   ${company}: ${count} internships`);
    });

    const byDomain = {};
    result.forEach(i => {
      byDomain[i.domain] = (byDomain[i.domain] || 0) + 1;
    });
    console.log('\n📊 Breakdown by domain:');
    Object.entries(byDomain).forEach(([domain, count]) => {
      console.log(`   ${domain}: ${count} internships`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
