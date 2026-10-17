import request from 'supertest';
import app from '../../app.js';

describe('Health and docs', () => {
  it('returns a healthy status payload', async () => {
    const res = await request(app).post('/health').send({});
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.database).toBe('connected');
  });

  it('serves the OpenAPI document', async () => {
    const res = await request(app).get('/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.paths['/api/auth/login']).toBeDefined();
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).post('/api/does-not-exist').send({});
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
