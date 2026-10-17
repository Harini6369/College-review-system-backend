import request from 'supertest';
import app from '../../app.js';
import { registerUser, createAdmin, createCollege, createReview } from '../helpers.js';

describe('Authorization', () => {
  it('allows an admin to create, update, and delete a college', async () => {
    const admin = await createAdmin(app);
    const { res: created, college } = await createCollege(app, admin.token, {
      name: 'Admin Managed College',
      location: 'Admin City',
    });
    expect(created.status).toBe(201);

    const updated = await request(app)
      .post('/api/colleges/update')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ id: college.id, description: 'Updated by admin' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.description).toBe('Updated by admin');

    const deleted = await request(app)
      .post('/api/colleges/delete')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ id: college.id });
    expect(deleted.status).toBe(204);
  });

  it('prevents a teacher from performing admin-only college actions', async () => {
    const admin = await createAdmin(app);
    const teacher = await registerUser(app, { role: 'teacher', name: 'Teacher One' });
    const { college } = await createCollege(app, admin.token);

    const createRes = await request(app)
      .post('/api/colleges/create')
      .set('Authorization', `Bearer ${teacher.token}`)
      .send({
        name: 'Unauthorized College',
        description: 'Should be rejected',
        location: 'Nowhere',
      });
    expect(createRes.status).toBe(403);

    const updateRes = await request(app)
      .post('/api/colleges/update')
      .set('Authorization', `Bearer ${teacher.token}`)
      .send({ id: college.id, name: 'Hijacked' });
    expect(updateRes.status).toBe(403);

    const deleteRes = await request(app)
      .post('/api/colleges/delete')
      .set('Authorization', `Bearer ${teacher.token}`)
      .send({ id: college.id });
    expect(deleteRes.status).toBe(403);
  });

  it('prevents a student from performing admin-only college actions', async () => {
    const admin = await createAdmin(app);
    const student = await registerUser(app, { role: 'student' });
    const { college } = await createCollege(app, admin.token);

    const res = await request(app)
      .post('/api/colleges/delete')
      .set('Authorization', `Bearer ${student.token}`)
      .send({ id: college.id });
    expect(res.status).toBe(403);
  });

  it('prevents a user from modifying another user review', async () => {
    const admin = await createAdmin(app);
    const owner = await registerUser(app, { role: 'student', name: 'Owner' });
    const other = await registerUser(app, { role: 'teacher', name: 'Other' });
    const { college } = await createCollege(app, admin.token);
    const { review } = await createReview(app, owner.token, college.id);

    const updateRes = await request(app)
      .post('/api/reviews/update')
      .set('Authorization', `Bearer ${other.token}`)
      .send({ id: review.id, comment: 'Trying to edit someone else' });
    expect(updateRes.status).toBe(403);

    const deleteRes = await request(app)
      .post('/api/reviews/delete')
      .set('Authorization', `Bearer ${other.token}`)
      .send({ id: review.id });
    expect(deleteRes.status).toBe(403);
  });

  it('allows an admin to moderate another user review', async () => {
    const admin = await createAdmin(app);
    const student = await registerUser(app, { role: 'student' });
    const { college } = await createCollege(app, admin.token);
    const { review } = await createReview(app, student.token, college.id, {
      comment: 'Original comment',
    });

    const updateRes = await request(app)
      .post('/api/reviews/update')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ id: review.id, comment: 'Moderated by admin' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.comment).toBe('Moderated by admin');

    const deleteRes = await request(app)
      .post('/api/reviews/delete')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ id: review.id });
    expect(deleteRes.status).toBe(204);
  });

  it('prevents non-admins from listing users', async () => {
    const student = await registerUser(app, { role: 'student' });
    const res = await request(app)
      .post('/api/users/list')
      .set('Authorization', `Bearer ${student.token}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it('allows an admin to list users and change a role', async () => {
    const admin = await createAdmin(app);
    const student = await registerUser(app, { role: 'student', name: 'Promotable' });

    const listRes = await request(app)
      .post('/api/users/list')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({});
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBeGreaterThanOrEqual(2);

    const roleRes = await request(app)
      .post('/api/users/update-role')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ id: student.res.body.data.user.id, role: 'teacher' });
    expect(roleRes.status).toBe(200);
    expect(roleRes.body.data.role).toBe('teacher');
  });
});
