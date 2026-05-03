const request = require('supertest');
const jwt = require('jsonwebtoken');

const app = require('../../src/app');
const User = require('../../src/models/User');
const Student = require('../../src/models/Student');

describe('Student Profile API - Education', () => {
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

  describe('POST /api/v1/students/profile/education', () => {
    it('adds education successfully with all fields', async () => {
      const res = await request(app)
        .post('/api/v1/students/profile/education')
        .set('Authorization', `Bearer ${token}`)
        .send({
          institution: 'University of Example',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          degreeLevel: 'BACHELOR',
          startDate: '2020-01-15',
          endDate: '2024-05-30',
          durationMonths: 48,
          isCurrentlyStudying: false
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Education details saved successfully');
      expect(res.body.data.education).toBeTruthy();
      expect(res.body.data.education[0].institution).toBe('University of Example');
      expect(res.body.data.education[0].degree).toBe('Bachelor of Science');
      expect(res.body.data.education[0].field).toBe('Computer Science');
      expect(res.body.data.education[0].degreeLevel).toBe('BACHELOR');
    });

    it('adds education with only required fields', async () => {
      const res = await request(app)
        .post('/api/v1/students/profile/education')
        .set('Authorization', `Bearer ${token}`)
        .send({
          institution: 'Community College',
          degree: 'Associate Degree',
          field: 'Information Technology',
          startDate: '2022-09-01'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.education[0].institution).toBe('Community College');
      expect(res.body.data.education[0].isCurrentlyStudying).toBe(false);
      expect(res.body.data.education[0].endDate).toBeNull();
    });

    it('updates existing education entry', async () => {
      // Add first education
      await request(app)
        .post('/api/v1/students/profile/education')
        .set('Authorization', `Bearer ${token}`)
        .send({
          institution: 'University of Example',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          startDate: '2020-01-15'
        });

      // Update same education entry
      const res = await request(app)
        .post('/api/v1/students/profile/education')
        .set('Authorization', `Bearer ${token}`)
        .send({
          institution: 'University of Example',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          startDate: '2020-01-15',
          endDate: '2024-05-30',
          degreeLevel: 'BACHELOR'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.education.length).toBe(1);
      expect(res.body.data.education[0].endDate).toBeTruthy();
      expect(res.body.data.education[0].degreeLevel).toBe('BACHELOR');
    });
  });

  describe('GET /api/v1/students/profile/education', () => {
    it('returns education list', async () => {
      // First add an education
      await request(app)
        .post('/api/v1/students/profile/education')
        .set('Authorization', `Bearer ${token}`)
        .send({
          institution: 'University of Example',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          startDate: '2020-01-15'
        });

      // Get education
      const res = await request(app)
        .get('/api/v1/students/profile/education')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].institution).toBe('University of Example');
      expect(res.body.data[0].field).toBe('Computer Science');
    });

    it('returns empty array when no education exists', async () => {
      const res = await request(app)
        .get('/api/v1/students/profile/education')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });
  });

  describe('Validation Tests', () => {
    it('returns 400 when institution is missing', async () => {
      const res = await request(app)
        .post('/api/v1/students/profile/education')
        .set('Authorization', `Bearer ${token}`)
        .send({
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          startDate: '2020-01-15'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/institution/i);
    });

    it('returns 400 when degree is missing', async () => {
      const res = await request(app)
        .post('/api/v1/students/profile/education')
        .set('Authorization', `Bearer ${token}`)
        .send({
          institution: 'University of Example',
          field: 'Computer Science',
          startDate: '2020-01-15'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/degree/i);
    });

    it('returns 400 when field is missing', async () => {
      const res = await request(app)
        .post('/api/v1/students/profile/education')
        .set('Authorization', `Bearer ${token}`)
        .send({
          institution: 'University of Example',
          degree: 'Bachelor of Science',
          startDate: '2020-01-15'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/field/i);
    });

    it('returns 400 when startDate is missing', async () => {
      const res = await request(app)
        .post('/api/v1/students/profile/education')
        .set('Authorization', `Bearer ${token}`)
        .send({
          institution: 'University of Example',
          degree: 'Bachelor of Science',
          field: 'Computer Science'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/start date/i);
    });

    it('returns 400 when startDate format is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/students/profile/education')
        .set('Authorization', `Bearer ${token}`)
        .send({
          institution: 'University of Example',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          startDate: 'invalid-date'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/date format/i);
    });

    it('returns 400 when endDate format is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/students/profile/education')
        .set('Authorization', `Bearer ${token}`)
        .send({
          institution: 'University of Example',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          startDate: '2020-01-15',
          endDate: 'not-a-date'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/date format/i);
    });

    it('returns 400 when degreeLevel is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/students/profile/education')
        .set('Authorization', `Bearer ${token}`)
        .send({
          institution: 'University of Example',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          startDate: '2020-01-15',
          degreeLevel: 'INVALID_LEVEL'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/degree level/i);
    });

    it('returns 400 when durationMonths is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/students/profile/education')
        .set('Authorization', `Bearer ${token}`)
        .send({
          institution: 'University of Example',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          startDate: '2020-01-15',
          durationMonths: -5
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/durationMonths/i);
    });

    it('accepts all valid degreeLevel values', async () => {
      const validLevels = ['HIGH_SCHOOL', 'ASSOCIATE', 'BACHELOR', 'MASTER', 'DOCTORATE', 'CERTIFICATE'];

      for (const level of validLevels) {
        const res = await request(app)
          .post('/api/v1/students/profile/education')
          .set('Authorization', `Bearer ${token}`)
          .send({
            institution: `University ${level}`,
            degree: 'Degree',
            field: 'Field',
            startDate: '2020-01-15',
            degreeLevel: level
          });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.education.some(edu => edu.degreeLevel === level)).toBe(true);
      }
    });
  });

  describe('PUT /api/v1/students/profile/education/:educationId', () => {
    it('updates an existing education entry', async () => {
      // Add education
      const addRes = await request(app)
        .post('/api/v1/students/profile/education')
        .set('Authorization', `Bearer ${token}`)
        .send({
          institution: 'Update University',
          degree: 'Bachelor',
          field: 'Engineering',
          startDate: '2018-01-01'
        });

      const eduId = addRes.body.data.education[0]._id;

      // Update
      const res = await request(app)
        .put(`/api/v1/students/profile/education/${eduId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          institution: 'Updated University Name',
          degree: 'Bachelor of Engineering',
          field: 'Computer Engineering',
          startDate: '2018-01-01',
          endDate: '2022-05-01',
          degreeLevel: 'BACHELOR'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Education details updated successfully');
      const updated = res.body.data.education.find(e => e._id === eduId);
      expect(updated.institution).toBe('Updated University Name');
      expect(updated.degreeLevel).toBe('BACHELOR');
    });

    it('returns 404 when education entry not found', async () => {
      const fakeId = '507f1f77bcf86cd799439999';
      const res = await request(app)
        .put(`/api/v1/students/profile/education/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          institution: 'Nowhere',
          degree: 'None',
          field: 'None',
          startDate: '2020-01-01'
        });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/v1/students/profile/education/:educationId', () => {
    it('removes an education entry by id', async () => {
      const addRes = await request(app)
        .post('/api/v1/students/profile/education')
        .set('Authorization', `Bearer ${token}`)
        .send({
          institution: 'Delete University',
          degree: 'Diploma',
          field: 'Arts',
          startDate: '2015-01-01'
        });

      const eduId = addRes.body.data.education[0]._id;

      const delRes = await request(app)
        .delete(`/api/v1/students/profile/education/${eduId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(delRes.statusCode).toBe(200);
      expect(delRes.body.success).toBe(true);
      expect(delRes.body.message).toMatch(/removed/i);
      expect(delRes.body.data.education.find(e => e._id === eduId)).toBeUndefined();
    });
  });
});

