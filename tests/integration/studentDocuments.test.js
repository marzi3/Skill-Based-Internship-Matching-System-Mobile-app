const request = require('supertest');
const jwt = require('jsonwebtoken');

const app = require('../../src/app');
const User = require('../../src/models/User');
const Student = require('../../src/models/Student');

describe('Student Profile API - Documents', () => {
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

  describe('POST /api/v1/students/profile/certification', () => {
    it('adds a certification with credential URL', async () => {
      const res = await request(app)
        .post('/api/v1/students/profile/certification')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'AWS Solutions Architect',
          credentialUrl: 'https://aws.amazon.com/certification',
          issuedDate: '2024-01-15'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Certification added successfully');
      expect(res.body.data.certifications).toBeTruthy();
      expect(res.body.data.certifications[0].name).toBe('AWS Solutions Architect');
      expect(res.body.data.certifications[0].credentialUrl).toBe('https://aws.amazon.com/certification');
    });

    it('adds a certification without credential URL', async () => {
      const res = await request(app)
        .post('/api/v1/students/profile/certification')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Google Cloud Associate',
          issuedDate: '2023-06-20'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.certifications[0].name).toBe('Google Cloud Associate');
      expect(res.body.data.certifications[0].credentialUrl).toBe('');
    });

    it('returns 400 when certification name is missing', async () => {
      const res = await request(app)
        .post('/api/v1/students/profile/certification')
        .set('Authorization', `Bearer ${token}`)
        .send({
          credentialUrl: 'https://example.com',
          issuedDate: '2024-01-15'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/certification name/i);
    });

    it('returns 400 when issuedDate is missing', async () => {
      const res = await request(app)
        .post('/api/v1/students/profile/certification')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Some Certification',
          credentialUrl: 'https://example.com'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/issued date/i);
    });

    it('returns 400 when duplicate certification exists', async () => {
      // Add first certification
      await request(app)
        .post('/api/v1/students/profile/certification')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Unique Certificate',
          issuedDate: '2024-01-15'
        });

      // Try adding duplicate
      const res = await request(app)
        .post('/api/v1/students/profile/certification')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Unique Certificate',
          issuedDate: '2024-02-20'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/already exists/i);
    });
  });

  describe('GET /api/v1/students/profile/certification', () => {
    it('returns empty certifications array initially (from profile)', async () => {
      const res = await request(app)
        .get('/api/v1/students/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeTruthy();
      expect(Array.isArray(res.body.data.certifications)).toBe(true);
      expect(res.body.data.certifications.length).toBe(0);
    });

    it('returns list of certifications after adding', async () => {
      // Add multiple certifications
      const certs = [
        { name: 'AWS Certified Solutions Architect', issuedDate: '2024-01-15' },
        { name: 'Google Cloud Professional Data Engineer', issuedDate: '2023-06-20' },
        { name: 'Certified Kubernetes Administrator', issuedDate: '2023-12-10' }
      ];

      for (const cert of certs) {
        await request(app)
          .post('/api/v1/students/profile/certification')
          .set('Authorization', `Bearer ${token}`)
          .send(cert);
      }

      const res = await request(app)
        .get('/api/v1/students/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.certifications)).toBe(true);
      expect(res.body.data.certifications.length).toBe(3);
      expect(res.body.data.certifications.map(c => c.name)).toContain('AWS Certified Solutions Architect');
      expect(res.body.data.certifications.map(c => c.name)).toContain('Google Cloud Professional Data Engineer');
      expect(res.body.data.certifications.map(c => c.name)).toContain('Certified Kubernetes Administrator');
    });

    it('returns issuedDate as a date object', async () => {
      // Add a certification
      await request(app)
        .post('/api/v1/students/profile/certification')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Certificate',
          issuedDate: '2024-05-15'
        });

      const res = await request(app)
        .get('/api/v1/students/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.certifications[0].issuedDate).toBeTruthy();
      expect(new Date(res.body.data.certifications[0].issuedDate)).toBeInstanceOf(Date);
    });
  });

  describe('DELETE /api/v1/students/profile/certification/:certificationId', () => {
    it('removes a certification by id', async () => {
      // Add a certification
      const addRes = await request(app)
        .post('/api/v1/students/profile/certification')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Certificate to Delete',
          issuedDate: '2024-01-15'
        });

      const certId = addRes.body.data.certifications[0]._id;

      // Remove the certification
      const deleteRes = await request(app)
        .delete(`/api/v1/students/profile/certification/${certId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(deleteRes.statusCode).toBe(200);
      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.message).toMatch(/removed|deleted/i);
      expect(deleteRes.body.data.certifications.length).toBe(0);
    });
  });

    describe('PUT /api/v1/students/profile/certification/:certificationId', () => {
      it('updates a certification successfully', async () => {
        const addRes = await request(app)
          .post('/api/v1/students/profile/certification')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'Cert To Update', issuedDate: '2023-01-01' });

        const certId = addRes.body.data.certifications[0]._id;

        const res = await request(app)
          .put(`/api/v1/students/profile/certification/${certId}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'Updated Cert', issuedDate: '2024-02-02', credentialUrl: 'https://example.com' });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toMatch(/updated successfully/i);
        const updated = res.body.data.certifications.find(c => c._id === certId);
        expect(updated.name).toBe('Updated Cert');
        expect(updated.credentialUrl).toBe('https://example.com');
      });

      it('returns 400 when updating to a duplicate certification name', async () => {
        // Add two certs
        await request(app)
          .post('/api/v1/students/profile/certification')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'Existing Cert', issuedDate: '2022-01-01' });

        const addRes = await request(app)
          .post('/api/v1/students/profile/certification')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'To Be Updated', issuedDate: '2023-01-01' });

        const certId = addRes.body.data.certifications.find(c => c.name === 'To Be Updated')._id;

        const res = await request(app)
          .put(`/api/v1/students/profile/certification/${certId}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'Existing Cert', issuedDate: '2024-01-01' });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/already exists/i);
      });
    });
});
