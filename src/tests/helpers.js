import request from 'supertest';
import User from '../models/User.js';

let counter = 0;

function uniqueEmail(prefix = 'user') {
  counter += 1;
  return `${prefix}${counter}${Date.now()}@example.com`;
}

async function registerUser(app, overrides = {}) {
  const payload = {
    name: overrides.name || 'Test User',
    email: overrides.email || uniqueEmail(overrides.role || 'student'),
    password: overrides.password || 'Password123',
    role: overrides.role || 'student',
  };

  const res = await request(app).post('/api/auth/register').send(payload);
  return { res, payload, token: res.body.data && res.body.data.token };
}

async function createAdmin(app, overrides = {}) {
  const email = overrides.email || uniqueEmail('admin');
  const password = overrides.password || 'Adminpass123';
  await User.create({
    name: overrides.name || 'Admin User',
    email,
    password,
    role: 'admin',
  });

  const res = await request(app).post('/api/auth/login').send({ email, password });
  return {
    res,
    email,
    password,
    token: res.body.data.token,
    user: res.body.data.user,
  };
}

async function createCollege(app, token, overrides = {}) {
  const payload = {
    name: overrides.name || `Test College ${Date.now()}-${counter}`,
    description: overrides.description || 'A sample college used in tests.',
    location: overrides.location || 'Test City',
    website: overrides.website || 'https://college.example.com',
  };

  const res = await request(app)
    .post('/api/colleges/create')
    .set('Authorization', `Bearer ${token}`)
    .send(payload);

  return { res, payload, college: res.body.data };
}

async function createReview(app, token, collegeId, overrides = {}) {
  const payload = {
    collegeId,
    rating: overrides.rating ?? 4,
    comment: overrides.comment || 'A thoughtful review used in tests.',
  };

  const res = await request(app)
    .post('/api/colleges/reviews/create')
    .set('Authorization', `Bearer ${token}`)
    .send(payload);

  return { res, payload, review: res.body.data };
}

export { uniqueEmail, registerUser, createAdmin, createCollege, createReview };
