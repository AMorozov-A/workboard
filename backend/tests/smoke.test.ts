import { getTestApp } from './helpers';

describe('Health check', () => {
  it('GET /api/v1/ping returns 200 and { ok: true }', async () => {
    const res = await getTestApp().get('/api/v1/ping').expect(200);
    expect(res.body).toMatchObject({ ok: true });
  });
});

describe('Auth smoke', () => {
  const email = 'smoke@example.com';
  const password = 'password123';

  it('POST /api/v1/auth/register creates user and returns accessToken', async () => {
    const res = await getTestApp()
      .post('/api/v1/auth/register')
      .send({ email, password, name: 'Smoke' })
      .expect(201);

    expect(res.body).toMatchObject({ ok: true });
    expect(res.body.accessToken).toBeTypeOf('string');
    expect(res.body.accessToken.length).toBeGreaterThan(0);
    expect(res.body.user).toMatchObject({ email });
  });

  it('POST /api/v1/auth/login returns accessToken for valid credentials', async () => {
    await getTestApp()
      .post('/api/v1/auth/register')
      .send({ email: 'login@example.com', password })
      .expect(201);

    const res = await getTestApp()
      .post('/api/v1/auth/login')
      .send({ email: 'login@example.com', password })
      .expect(200);

    expect(res.body).toMatchObject({ ok: true });
    expect(res.body.accessToken).toBeTypeOf('string');
    expect(res.body.accessToken.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/auth/me returns user with valid token', async () => {
    const reg = await getTestApp()
      .post('/api/v1/auth/register')
      .send({ email: 'me@example.com', password })
      .expect(201);

    const token = reg.body.accessToken as string;

    const res = await getTestApp()
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({ ok: true });
    expect(res.body.user).toMatchObject({ email: 'me@example.com' });
  });

  it('GET /api/v1/auth/me returns 401 without token', async () => {
    await getTestApp().get('/api/v1/auth/me').expect(401);
  });
});
