// Mock the email sender to avoid attempting real SMTP connections during tests
jest.mock('../../src/utils/sendEmail', () => jest.fn().mockResolvedValue(true));

const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');

describe('Auth Endpoints', () => {

    describe('POST /api/v1/auth/register', () => {
        it('should register a new student and return a token', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'Test Student',
                    email: 'student@test.com',
                    password: 'Password123!',
                    role: 'student'
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body.email).toEqual('student@test.com');

            const user = await User.findOne({ email: 'student@test.com' });
            expect(user).toBeTruthy();
            expect(user.emailVerificationToken).toBeTruthy(); // Verify email token is generated
        });

        it('should return 400 if required fields are missing', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({ email: 'student@test.com' }); // Missing name and password

            expect(res.statusCode).toEqual(400);
        });
    });

    describe('POST /api/v1/auth/login', () => {
        beforeEach(async () => {
            // Create a verified user before trying to log them in
            const user = new User({
                name: 'Login User',
                email: 'login@test.com',
                password: 'Password123!',
                role: 'student',
                isVerified: true,
                verificationStatus: 'approved' // assuming verifyStatus needs this
            });
            await user.save();
        });

        it('should login an existing user and return a token', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'login@test.com',
                    password: 'Password123!'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');
        });

        it('should return 401 for invalid credentials', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'login@test.com',
                    password: 'WrongPassword!'
                });

            expect(res.statusCode).toEqual(401);
        });
    });

});
