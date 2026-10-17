import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import { registerUser, createAdmin, createCollege, createReview } from '../helpers.js';

describe('Review CRUD', () => {
  it('creates, retrieves, updates, and deletes a review', async () => {
    const admin = await createAdmin(app);
    const student = await registerUser(app, { role: 'student', name: 'Reviewer' });
    const { college } = await createCollege(app, admin.token);
    const { res: created, review } = await createReview(app, student.token, college.id, {
      rating: 5,
      comment: 'Loved the campus.',
    });

    expect(created.status).toBe(201);
    expect(review.rating).toBe(5);
    expect(review.user.email).toBe(student.payload.email);
    expect(review.user.password).toBeUndefined();

    const getRes = await request(app).post('/api/reviews/get').send({ id: review.id });
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.comment).toBe('Loved the campus.');

    const updateRes = await request(app)
      .post('/api/reviews/update')
      .set('Authorization', `Bearer ${student.token}`)
      .send({ id: review.id, rating: 4, comment: 'Still good after a semester.' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.rating).toBe(4);

    const deleteRes = await request(app)
      .post('/api/reviews/delete')
      .set('Authorization', `Bearer ${student.token}`)
      .send({ id: review.id });
    expect(deleteRes.status).toBe(204);
  });

  it('rejects invalid ratings and request fields', async () => {
    const admin = await createAdmin(app);
    const student = await registerUser(app, { role: 'student' });
    const { college } = await createCollege(app, admin.token);

    const invalidRating = await request(app)
      .post('/api/colleges/reviews/create')
      .set('Authorization', `Bearer ${student.token}`)
      .send({ collegeId: college.id, rating: 6, comment: 'Too high' });
    expect(invalidRating.status).toBe(400);

    const missingComment = await request(app)
      .post('/api/colleges/reviews/create')
      .set('Authorization', `Bearer ${student.token}`)
      .send({ collegeId: college.id, rating: 3 });
    expect(missingComment.status).toBe(400);

    const injectedOwner = await request(app)
      .post('/api/colleges/reviews/create')
      .set('Authorization', `Bearer ${student.token}`)
      .send({
        collegeId: college.id,
        rating: 5,
        comment: 'Trying to spoof ownership',
        userId: admin.user.id,
      });
    expect(injectedOwner.status).toBe(201);
    expect(injectedOwner.body.data.user.id).toBe(student.res.body.data.user.id);
  });

  it('rejects a review for a nonexistent college', async () => {
    const student = await registerUser(app, { role: 'student' });
    const res = await request(app)
      .post('/api/colleges/reviews/create')
      .set('Authorization', `Bearer ${student.token}`)
      .send({
        collegeId: new mongoose.Types.ObjectId().toString(),
        rating: 4,
        comment: 'Ghost campus',
      });
    expect(res.status).toBe(404);
  });

  it('prevents a user from creating a second review for the same college', async () => {
    const admin = await createAdmin(app);
    const student = await registerUser(app, { role: 'student' });
    const { college } = await createCollege(app, admin.token);
    await createReview(app, student.token, college.id);

    const { res } = await createReview(app, student.token, college.id, {
      comment: 'Second attempt',
    });
    expect(res.status).toBe(409);
  });

  it('supports pagination and filtering', async () => {
    const admin = await createAdmin(app);
    const studentA = await registerUser(app, { role: 'student' });
    const studentB = await registerUser(app, { role: 'teacher' });
    const first = await createCollege(app, admin.token, { name: 'Filter One', location: 'East' });
    const second = await createCollege(app, admin.token, { name: 'Filter Two', location: 'West' });

    await createReview(app, studentA.token, first.college.id, {
      rating: 5,
      comment: 'Superb labs',
    });
    await createReview(app, studentB.token, first.college.id, {
      rating: 2,
      comment: 'Needs work',
    });
    await createReview(app, studentA.token, second.college.id, {
      rating: 4,
      comment: 'Friendly staff',
    });

    const collegeReviews = await request(app)
      .post('/api/colleges/reviews/list')
      .send({
        collegeId: first.college.id,
        page: 1,
        limit: 1,
        sortBy: 'rating',
        sortOrder: 'desc',
      });
    expect(collegeReviews.status).toBe(200);
    expect(collegeReviews.body.meta.total).toBe(2);
    expect(collegeReviews.body.data).toHaveLength(1);
    expect(collegeReviews.body.data[0].rating).toBe(5);

    const filtered = await request(app).post('/api/reviews/list').send({
      collegeId: first.college.id,
      rating: 2,
    });
    expect(filtered.body.meta.total).toBe(1);
    expect(filtered.body.data[0].comment).toBe('Needs work');

    const searched = await request(app).post('/api/reviews/list').send({ search: 'staff' });
    expect(searched.body.meta.total).toBe(1);
  });

  it('recalculates average rating after create, update, and delete', async () => {
    const admin = await createAdmin(app);
    const first = await registerUser(app, { role: 'student' });
    const second = await registerUser(app, { role: 'teacher' });
    const third = await registerUser(app, { role: 'student' });
    const { college } = await createCollege(app, admin.token, { name: 'Stats College' });

    const none = await request(app).post('/api/colleges/get').send({ id: college.id });
    expect(none.body.data.averageRating).toBe(0);
    expect(none.body.data.reviewCount).toBe(0);

    const reviewA = await createReview(app, first.token, college.id, { rating: 5, comment: 'Five' });
    await createReview(app, second.token, college.id, { rating: 3, comment: 'Three' });
    const reviewC = await createReview(app, third.token, college.id, { rating: 4, comment: 'Four' });

    const afterCreate = await request(app).post('/api/colleges/get').send({ id: college.id });
    expect(afterCreate.body.data.averageRating).toBe(4);
    expect(afterCreate.body.data.reviewCount).toBe(3);

    await request(app)
      .post('/api/reviews/update')
      .set('Authorization', `Bearer ${third.token}`)
      .send({ id: reviewC.review.id, rating: 1 });

    const afterUpdate = await request(app).post('/api/colleges/get').send({ id: college.id });
    expect(afterUpdate.body.data.averageRating).toBe(3);
    expect(afterUpdate.body.data.reviewCount).toBe(3);

    await request(app)
      .post('/api/reviews/delete')
      .set('Authorization', `Bearer ${first.token}`)
      .send({ id: reviewA.review.id });

    const afterDelete = await request(app).post('/api/colleges/get').send({ id: college.id });
    expect(afterDelete.body.data.averageRating).toBe(2);
    expect(afterDelete.body.data.reviewCount).toBe(2);
  });

  it('sorts colleges by average rating', async () => {
    const admin = await createAdmin(app);
    const reviewer = await registerUser(app, { role: 'student' });
    const low = await createCollege(app, admin.token, { name: 'Low Rated', location: 'Alpha City' });
    const high = await createCollege(app, admin.token, { name: 'High Rated', location: 'Beta City' });

    await createReview(app, reviewer.token, low.college.id, { rating: 2, comment: 'Low' });
    await createReview(app, reviewer.token, high.college.id, { rating: 5, comment: 'High' });

    const res = await request(app).post('/api/colleges/list').send({
      sortBy: 'averageRating',
      sortOrder: 'desc',
    });
    expect(res.body.data[0].name).toBe('High Rated');
    expect(res.body.data[1].name).toBe('Low Rated');
  });
});
