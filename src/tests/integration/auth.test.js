import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import { registerUser, uniqueEmail } from '../helpers.js';

describe('Authentication', () => {
  it('registers a student and omits the password hash', async () => {
    const { res, payload } = await registerUser(app, {
      name: 'Ada Lovelace',
      role: 'student',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(payload.email);
    expect(res.body.data.user.role).toBe('student');
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.token).toEqual(expect.any(String));
  });

  it('normalizes email addresses during registration', async () => {
    const email = uniqueEmail('MixEd');
    const res = await request(app).post('/api/auth/register').send({
      name: 'Mixed Case',
      email: email.toUpperCase(),
      password: 'Password123',
      role: 'teacher',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe(email.toLowerCase());
  });

  it('rejects public registration of admin accounts', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Would Be Admin',
      email: uniqueEmail('admin'),
      password: 'Password123',
      role: 'admin',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects duplicate email registration', async () => {
    const { payload } = await registerUser(app);
    const res = await request(app).post('/api/auth/register').send({
      name: 'Duplicate',
      email: payload.email,
      password: 'Password123',
      role: 'student',
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('logs in with valid credentials', async () => {
    const { payload } = await registerUser(app);
    const res = await request(app).post('/api/auth/login').send({
      email: payload.email,
      password: payload.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('rejects an incorrect password', async () => {
    const { payload } = await registerUser(app);
    const res = await request(app).post('/api/auth/login').send({
      email: payload.email,
      password: 'WrongPass123',
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('rejects login for an unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: uniqueEmail('missing'),
      password: 'Password123',
    });

    expect(res.status).toBe(401);
  });

  it('returns the current user for a valid token', async () => {
    const { res: registerRes, payload } = await registerUser(app);
    const res = await request(app)
      .post('/api/auth/me')
      .send({})
      .set('Authorization', `Bearer ${registerRes.body.data.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(payload.email);
    expect(res.body.data.password).toBeUndefined();
  });

  it('blocks protected routes without authentication', async () => {
    const res = await request(app).post('/api/auth/me').send({});
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects an invalid JWT', async () => {
    const res = await request(app)
      .post('/api/auth/me')
      .send({})
      .set('Authorization', 'Bearer not-a-valid-token');

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid or expired/i);
  });

  it('rejects an expired JWT', async () => {
    const expired = jwt.sign(
      { sub: '507f1f77bcf86cd799439011', role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '1ms' }
    );
    await new Promise((resolve) => {
      setTimeout(resolve, 15);
    });

    const res = await request(app)
      .post('/api/auth/me')
      .send({})
      .set('Authorization', `Bearer ${expired}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/expired/i);
  });

  it('rejects a weak password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Weak Password',
      email: uniqueEmail('weak'),
      password: 'short',
      role: 'student',
    });

    expect(res.status).toBe(400);
    expect(res.body.details).toEqual(expect.any(Array));
  });
});
