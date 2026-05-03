const request = require('supertest');
const jwt = require('jsonwebtoken');

const app = require('../../src/app');
const User = require('../../src/models/User');
const Student = require('../../src/models/Student');

describe('Student Profile API - Personal Info', () => {
  let user;
  let token;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';

    user = await User.create({
      name: 'Test Student',
      email: 'student@test.com',
      password: 'Password123!',
      role: 'student',
      isVerified: true,
      verificationStatus: 'approved'
    });

    token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    await Student.create({
      userId: user._id,
      personalInfo: {
        fullName: 'Test Student',
        email: 'student@test.com'
      },
      education: [],
      schools: [],
      skills: [],
      projects: [],
      certifications: []
    });
  });

  it('saves personal info and updates the user email', async () => {
    const res = await request(app)
      .post('/api/v1/students/profile/personal')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: 'Test Student Updated',
        email: 'updated.student@test.com',
        phone: '771234567',
        about: 'A short profile summary',
        designation: 'Student',
        location: 'Colombo',
        country: 'Sri Lanka',
        gender: 'Male',
        gpa: '3.75',
        portfolioUrl: 'https://portfolio.example.com',
        preferredLocation: ['Remote'],
        durationPreference: '3-6 months',
        industriesOfInterest: ['IT'],
        previousInternshipsCount: 1,
        isPublic: true,
        seniority: ['Student'],
        portfolio: {
          github: 'https://github.com/test',
          linkedin: 'https://linkedin.com/in/test',
          website: 'https://example.com'
        }
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Personal information saved successfully');
    expect(res.body.data.personalInfo.fullName).toBe('Test Student Updated');
    expect(res.body.data.personalInfo.email).toBe('updated.student@test.com');
    expect(res.body.data.personalInfo.location).toBe('Colombo');
    expect(res.body.data.personalInfo.gpa).toBe('3.75');
    expect(res.body.data.portfolio.github).toBe('https://github.com/test');

    const updatedUser = await User.findById(user._id);
    expect(updatedUser.email).toBe('updated.student@test.com');
  });

  it('returns 400 when personal info fields are missing', async () => {
    const res = await request(app)
      .post('/api/v1/students/profile/personal')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'missing-name@test.com' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Full name and email are required');
  });
});
