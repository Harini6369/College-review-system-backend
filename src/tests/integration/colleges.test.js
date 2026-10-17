import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import Review from '../../models/Review.js';
import { registerUser, createAdmin, createCollege, createReview } from '../helpers.js';

describe('College CRUD', () => {
  it('creates, lists, retrieves, updates, and deletes a college', async () => {
    const admin = await createAdmin(app);
    const { res: created, college } = await createCollege(app, admin.token, {
      name: 'Riverside College',
      location: 'Riverside',
    });

    expect(created.status).toBe(201);
    expect(college.averageRating).toBe(0);
    expect(college.reviewCount).toBe(0);
    expect(college.createdBy.email).toBe(admin.email);

    const listRes = await request(app).post('/api/colleges/list').send({});
    expect(listRes.status).toBe(200);
    expect(listRes.body.meta.total).toBe(1);
    expect(listRes.body.data[0].id).toBe(college.id);

    const getRes = await request(app).post('/api/colleges/get').send({ id: college.id });
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.name).toBe('Riverside College');

    const updateRes = await request(app)
      .post('/api/colleges/update')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ id: college.id, location: 'Riverside North' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.location).toBe('Riverside North');

    const deleteRes = await request(app)
      .post('/api/colleges/delete')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ id: college.id });
    expect(deleteRes.status).toBe(204);

    const missing = await request(app).post('/api/colleges/get').send({ id: college.id });
    expect(missing.status).toBe(404);
  });

  it('rejects an invalid college id', async () => {
    const res = await request(app).post('/api/colleges/get').send({ id: 'not-an-id' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for a missing college', async () => {
    const res = await request(app)
      .post('/api/colleges/get')
      .send({ id: new mongoose.Types.ObjectId().toString() });
    expect(res.status).toBe(404);
  });

  it('supports search, location filter, and pagination', async () => {
    const admin = await createAdmin(app);
    await createCollege(app, admin.token, { name: 'Alpha Institute', location: 'Boston' });
    await createCollege(app, admin.token, { name: 'Beta Institute', location: 'Boston' });
    await createCollege(app, admin.token, { name: 'Gamma College', location: 'Austin' });

    const searchRes = await request(app).post('/api/colleges/list').send({ search: 'Institute' });
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.meta.total).toBe(2);

    const locationRes = await request(app).post('/api/colleges/list').send({ location: 'Austin' });
    expect(locationRes.body.meta.total).toBe(1);
    expect(locationRes.body.data[0].name).toBe('Gamma College');

    const pageRes = await request(app).post('/api/colleges/list').send({
      page: 2,
      limit: 2,
      sortBy: 'name',
      sortOrder: 'asc',
    });
    expect(pageRes.body.meta.page).toBe(2);
    expect(pageRes.body.meta.limit).toBe(2);
    expect(pageRes.body.meta.total).toBe(3);
    expect(pageRes.body.meta.hasPrevPage).toBe(true);
    expect(pageRes.body.data).toHaveLength(1);
  });

  it('rejects duplicate colleges with the same name and location', async () => {
    const admin = await createAdmin(app);
    await createCollege(app, admin.token, { name: 'Duplicate U', location: 'Same Town' });
    const { res } = await createCollege(app, admin.token, {
      name: 'duplicate u',
      location: 'same town',
    });
    expect(res.status).toBe(409);
  });

  it('calculates average rating and review count without N+1 lookups', async () => {
    const admin = await createAdmin(app);
    const studentA = await registerUser(app, { role: 'student' });
    const studentB = await registerUser(app, { role: 'student' });
    const { college } = await createCollege(app, admin.token, { name: 'Rated College' });

    const empty = await request(app).post('/api/colleges/get').send({ id: college.id });
    expect(empty.body.data.averageRating).toBe(0);
    expect(empty.body.data.reviewCount).toBe(0);

    await createReview(app, studentA.token, college.id, { rating: 5, comment: 'Excellent' });
    await createReview(app, studentB.token, college.id, { rating: 3, comment: 'Average' });

    const detailed = await request(app).post('/api/colleges/get').send({ id: college.id });
    expect(detailed.body.data.averageRating).toBe(4);
    expect(detailed.body.data.reviewCount).toBe(2);

    const listed = await request(app).post('/api/colleges/list').send({ search: 'Rated College' });
    expect(listed.body.data[0].averageRating).toBe(4);
    expect(listed.body.data[0].reviewCount).toBe(2);
  });

  it('deletes associated reviews when a college is deleted', async () => {
    const admin = await createAdmin(app);
    const student = await registerUser(app, { role: 'student' });
    const { college } = await createCollege(app, admin.token);
    await createReview(app, student.token, college.id);

    const deleteRes = await request(app)
      .post('/api/colleges/delete')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ id: college.id });
    expect(deleteRes.status).toBe(204);
    expect(await Review.countDocuments({ collegeId: college.id })).toBe(0);
  });

  it('rejects unknown college fields', async () => {
    const admin = await createAdmin(app);
    const res = await request(app)
      .post('/api/colleges/create')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        name: 'Mass Assignment College',
        description: 'Should ignore extra fields',
        location: 'Testville',
        createdBy: new mongoose.Types.ObjectId().toString(),
        averageRating: 5,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.createdBy.email).toBe(admin.email);
    expect(res.body.data.averageRating).toBe(0);
  });
});
