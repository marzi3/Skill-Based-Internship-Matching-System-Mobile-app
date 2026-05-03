const request = require('supertest');
const jwt = require('jsonwebtoken');

const app = require('../../src/app');
const User = require('../../src/models/User');
const Student = require('../../src/models/Student');

describe('Student Profile API - Projects', () => {
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

  describe('POST /api/v1/students/profile/project', () => {
    it('adds a project with all fields', async () => {
      const res = await request(app)
        .post('/api/v1/students/profile/project')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'E-commerce Platform',
          description: 'A full-stack e-commerce application with payment integration',
          technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
          repositoryUrl: 'https://github.com/user/ecommerce',
          liveUrl: 'https://ecommerce.example.com'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Project added successfully');
      expect(res.body.data.projects).toBeTruthy();
      expect(res.body.data.projects[0].title).toBe('E-commerce Platform');
      expect(res.body.data.projects[0].description).toContain('e-commerce');
      expect(res.body.data.projects[0].technologies).toContain('React');
    });

    it('adds a project with only required title field', async () => {
      const res = await request(app)
        .post('/api/v1/students/profile/project')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Simple Project'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.projects[0].title).toBe('Simple Project');
      expect(res.body.data.projects[0].description).toBe('');
      expect(res.body.data.projects[0].technologies).toEqual([]);
    });

    it('adds projects with arrays of technologies', async () => {
      const res = await request(app)
        .post('/api/v1/students/profile/project')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Mobile App',
          technologies: ['React Native', 'Firebase', 'Redux']
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.projects[0].technologies).toContain('React Native');
      expect(res.body.data.projects[0].technologies).toContain('Firebase');
      expect(res.body.data.projects[0].technologies).toContain('Redux');
    });

    it('returns 400 when project title is missing', async () => {
      const res = await request(app)
        .post('/api/v1/students/profile/project')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'A project without title',
          technologies: ['React']
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/title/i);
    });

    it('returns 400 when project title is empty string', async () => {
      const res = await request(app)
        .post('/api/v1/students/profile/project')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: '   ',
          description: 'Whitespace title only'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/title/i);
    });

    it('returns 400 when duplicate project title exists', async () => {
      // Add first project
      await request(app)
        .post('/api/v1/students/profile/project')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Unique Project',
          description: 'First one'
        });

      // Try adding duplicate
      const res = await request(app)
        .post('/api/v1/students/profile/project')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Unique Project',
          description: 'Second one'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/already exists/i);
    });
  });

  describe('GET /api/v1/students/profile/project', () => {
    it('returns empty projects array initially (from profile)', async () => {
      const res = await request(app)
        .get('/api/v1/students/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeTruthy();
      expect(Array.isArray(res.body.data.projects)).toBe(true);
      expect(res.body.data.projects.length).toBe(0);
    });

    it('returns list of projects after adding', async () => {
      // Add multiple projects
      const projects = [
        { title: 'Project One', technologies: ['React'] },
        { title: 'Project Two', technologies: ['Vue.js'] },
        { title: 'Project Three', technologies: ['Angular'] }
      ];

      for (const project of projects) {
        await request(app)
          .post('/api/v1/students/profile/project')
          .set('Authorization', `Bearer ${token}`)
          .send(project);
      }

      const res = await request(app)
        .get('/api/v1/students/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.projects)).toBe(true);
      expect(res.body.data.projects.length).toBe(3);
      expect(res.body.data.projects.map(p => p.title)).toContain('Project One');
      expect(res.body.data.projects.map(p => p.title)).toContain('Project Two');
      expect(res.body.data.projects.map(p => p.title)).toContain('Project Three');
    });
  });
  describe('PUT /api/v1/students/profile/project/:projectId', () => {
    it('updates an existing project', async () => {
      // Add project
      const addRes = await request(app)
        .post('/api/v1/students/profile/project')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Project To Update',
          description: 'Original description',
          technologies: ['Node']
        });

      const projectId = addRes.body.data.projects[0]._id;

      const res = await request(app)
        .put(`/api/v1/students/profile/project/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Project Updated',
          description: 'Updated description',
          technologies: ['Node', 'Express']
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/updated successfully/i);
      const updated = res.body.data.projects.find(p => p._id === projectId);
      expect(updated.title).toBe('Project Updated');
      expect(updated.technologies).toContain('Express');
    });

    it('returns 400 when updating to a duplicate title', async () => {
      // Add two projects
      await request(app)
        .post('/api/v1/students/profile/project')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'First Project' });

      const addRes = await request(app)
        .post('/api/v1/students/profile/project')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Second Project' });

      const projectId = addRes.body.data.projects.find(p => p.title === 'Second Project')._id;

      const res = await request(app)
        .put(`/api/v1/students/profile/project/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'First Project', description: 'Try duplicate' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/already exists/i);
    });
  });

  describe('DELETE /api/v1/students/profile/project/:projectId', () => {
    it('removes a project by id', async () => {
      // Add a project
      const addRes = await request(app)
        .post('/api/v1/students/profile/project')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Project to Delete',
          description: 'This will be deleted'
        });

      const projectId = addRes.body.data.projects[0]._id;

      // Remove the project
      const deleteRes = await request(app)
        .delete(`/api/v1/students/profile/project/${projectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(deleteRes.statusCode).toBe(200);
      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.message).toMatch(/removed|deleted/i);
      expect(deleteRes.body.data.projects.length).toBe(0);
    });
  });
});
