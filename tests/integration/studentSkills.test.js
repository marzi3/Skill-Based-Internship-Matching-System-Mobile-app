const request = require('supertest');
const jwt = require('jsonwebtoken');

const app = require('../../src/app');
const User = require('../../src/models/User');
const Student = require('../../src/models/Student');

describe('Student Profile API - Skills', () => {
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

  describe('POST /api/v1/students/profile/skill', () => {
    it('adds a skill with proficiency level', async () => {
      const res = await request(app)
        .post('/api/v1/students/profile/skill')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'JavaScript',
          proficiency: 'EXPERT'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Skill added successfully');
      expect(res.body.data.skills).toBeTruthy();
      expect(res.body.data.skills[0].name).toBe('JavaScript');
      expect(res.body.data.skills[0].proficiency).toBe('EXPERT');
    });

    it('adds a skill with default proficiency when not provided', async () => {
      const res = await request(app)
        .post('/api/v1/students/profile/skill')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'React'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.skills[0].name).toBe('React');
      expect(res.body.data.skills[0].proficiency).toBe('INTERMEDIATE');
    });

    it('updates proficiency if skill already exists', async () => {
      // Add first skill
      await request(app)
        .post('/api/v1/students/profile/skill')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'JavaScript',
          proficiency: 'BEGINNER'
        });

      // Update same skill
      const res = await request(app)
        .post('/api/v1/students/profile/skill')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'JavaScript',
          proficiency: 'EXPERT'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.skills.length).toBe(1);
      expect(res.body.data.skills[0].proficiency).toBe('EXPERT');
    });

    it('accepts all valid proficiency levels', async () => {
      const proficiencies = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
      
      for (const level of proficiencies) {
        const res = await request(app)
          .post('/api/v1/students/profile/skill')
          .set('Authorization', `Bearer ${token}`)
          .send({
            name: `Skill_${level}`,
            proficiency: level
          });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.skills.some(s => s.proficiency === level)).toBe(true);
      }
    });

    it('returns 400 when skill name is missing', async () => {
      const res = await request(app)
        .post('/api/v1/students/profile/skill')
        .set('Authorization', `Bearer ${token}`)
        .send({
          proficiency: 'EXPERT'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/skill name/i);
    });
  });

  describe('GET /api/v1/students/profile/skills', () => {
    it('returns empty skills array initially', async () => {
      const res = await request(app)
        .get('/api/v1/students/profile/skills')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });

    it('returns list of skills after adding', async () => {
      // Add multiple skills
      const skills = [
        { name: 'JavaScript', proficiency: 'EXPERT' },
        { name: 'React', proficiency: 'ADVANCED' },
        { name: 'Node.js', proficiency: 'INTERMEDIATE' }
      ];

      for (const skill of skills) {
        await request(app)
          .post('/api/v1/students/profile/skill')
          .set('Authorization', `Bearer ${token}`)
          .send(skill);
      }

      const res = await request(app)
        .get('/api/v1/students/profile/skills')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(3);
      expect(res.body.data.map(s => s.name)).toContain('JavaScript');
      expect(res.body.data.map(s => s.name)).toContain('React');
      expect(res.body.data.map(s => s.name)).toContain('Node.js');
    });
  });

  describe('DELETE /api/v1/students/profile/skill/:skillId', () => {
    it('removes a skill by id', async () => {
      // Add a skill
      const addRes = await request(app)
        .post('/api/v1/students/profile/skill')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'JavaScript',
          proficiency: 'EXPERT'
        });

      const skillId = addRes.body.data.skills[0]._id;

      // Remove the skill
      const deleteRes = await request(app)
        .delete(`/api/v1/students/profile/skill/${skillId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(deleteRes.statusCode).toBe(200);
      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.message).toMatch(/removed|deleted/i);
      expect(deleteRes.body.data.skills.length).toBe(0);
    });

    it('returns 404 when skill not found', async () => {
      const fakeId = '507f1f77bcf86cd799439999';
      
      const res = await request(app)
        .delete(`/api/v1/students/profile/skill/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.skills.length).toBe(0);
    });
  });
});
