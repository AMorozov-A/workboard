import jwt from 'jsonwebtoken';
import { getTestApp } from './helpers';

describe('POST /api/v1/auth/register', () => {
  const uniqueEmail = (prefix: string) =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

  describe('positive', () => {
    it('201: returns user, accessToken, tokenType, expiresIn', async () => {
      const email = uniqueEmail('reg');
      const res = await getTestApp()
        .post('/api/v1/auth/register')
        .send({ email, password: 'password12', name: 'Test User' })
        .expect(201);

      expect(res.body).toMatchObject({
        ok: true,
        tokenType: 'Bearer',
      });
      expect(res.body.user).toMatchObject({
        email,
        name: 'Test User',
      });
      expect(res.body.user.id).toBeTypeOf('string');
      expect(res.body.accessToken).toBeTypeOf('string');
      expect((res.body.accessToken as string).length).toBeGreaterThan(0);
      expect(res.body.expiresIn).toBeDefined();
    });

    it('201: without name — user.name is null', async () => {
      const email = uniqueEmail('noname');
      const res = await getTestApp()
        .post('/api/v1/auth/register')
        .send({ email, password: 'password12' })
        .expect(201);

      expect(res.body.user.email).toBe(email);
      expect(res.body.user.name).toBeNull();
    });

    it('201: whitespace-only name is stored as null', async () => {
      const email = uniqueEmail('spaces');
      const res = await getTestApp()
        .post('/api/v1/auth/register')
        .send({ email, password: 'password12', name: '   ' })
        .expect(201);

      expect(res.body.user.name).toBeNull();
    });

    it('201: email is trimmed and lowercased', async () => {
      const res = await getTestApp()
        .post('/api/v1/auth/register')
        .send({
          email: '  MixedCase@EXAMPLE.COM ',
          password: 'password12',
        })
        .expect(201);

      expect(res.body.user.email).toBe('mixedcase@example.com');
    });

    it('accessToken works for GET /api/v1/auth/me', async () => {
      const email = uniqueEmail('me');
      const reg = await getTestApp()
        .post('/api/v1/auth/register')
        .send({ email, password: 'password12' })
        .expect(201);

      const token = reg.body.accessToken as string;
      const me = await getTestApp()
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(me.body.user).toMatchObject({ email });
    });
  });

  describe('negative', () => {
    it('409 when email already exists', async () => {
      const email = uniqueEmail('dup');
      await getTestApp()
        .post('/api/v1/auth/register')
        .send({ email, password: 'password12' })
        .expect(201);

      const res = await getTestApp()
        .post('/api/v1/auth/register')
        .send({ email, password: 'password12' })
        .expect(409);

      expect(res.body).toMatchObject({ ok: false });
      expect(res.body.message).toContain('уже зарегистрирован');
    });

    it('409 when same email after normalization (case)', async () => {
      const email = uniqueEmail('case');
      await getTestApp()
        .post('/api/v1/auth/register')
        .send({ email, password: 'password12' })
        .expect(201);

      const res = await getTestApp()
        .post('/api/v1/auth/register')
        .send({ email: email.toUpperCase(), password: 'password12' })
        .expect(409);

      expect(res.body.ok).toBe(false);
    });

    it('400 for invalid email', async () => {
      const res = await getTestApp()
        .post('/api/v1/auth/register')
        .send({ email: 'not-an-email', password: 'password12' })
        .expect(400);

      expect(res.body).toMatchObject({ ok: false });
      expect(res.body.message).toContain('email');
    });

    it('400 for password shorter than 8 characters', async () => {
      const res = await getTestApp()
        .post('/api/v1/auth/register')
        .send({ email: uniqueEmail('shortpw'), password: 'short1' })
        .expect(400);

      expect(res.body).toMatchObject({ ok: false });
      expect(res.body.message).toContain('8');
    });

    it('400 when name is not a string', async () => {
      const res = await getTestApp()
        .post('/api/v1/auth/register')
        .send({
          email: uniqueEmail('badname'),
          password: 'password12',
          name: 123,
        })
        .expect(400);

      expect(res.body.message).toContain('name');
    });

    it('400 when email is missing', async () => {
      const res = await getTestApp()
        .post('/api/v1/auth/register')
        .send({ password: 'password12' })
        .expect(400);

      expect(res.body).toMatchObject({ ok: false });
      expect(res.body.message).toMatch(/email/i);
    });

    it('400 when password is missing', async () => {
      const res = await getTestApp()
        .post('/api/v1/auth/register')
        .send({ email: uniqueEmail('nopw') })
        .expect(400);

      expect(res.body).toMatchObject({ ok: false });
      expect(String(res.body.message)).toMatch(/8|парол/i);
    });

    it('400 when password is not a string', async () => {
      const res = await getTestApp()
        .post('/api/v1/auth/register')
        .send({
          email: uniqueEmail('badpwtype'),
          password: 12345,
        })
        .expect(400);

      expect(res.body.ok).toBe(false);
    });
  });

  describe('security', () => {
    it('response JSON does not include password or passwordHash', async () => {
      const res = await getTestApp()
        .post('/api/v1/auth/register')
        .send({ email: uniqueEmail('sec'), password: 'password12' })
        .expect(201);

      const json = JSON.stringify(res.body);
      expect(json).not.toMatch(/passwordHash/i);
      expect(res.body).not.toHaveProperty('password');
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.user).not.toHaveProperty('passwordHash');
    });

    it('user object only exposes public fields', async () => {
      const res = await getTestApp()
        .post('/api/v1/auth/register')
        .send({ email: uniqueEmail('pub'), password: 'password12', name: 'N' })
        .expect(201);

      expect(Object.keys(res.body.user).sort()).toEqual(
        ['createdAt', 'email', 'id', 'name', 'updatedAt'].sort(),
      );
    });

    it('JWT payload contains sub and email matching user', async () => {
      const email = uniqueEmail('jwt');
      const res = await getTestApp()
        .post('/api/v1/auth/register')
        .send({ email, password: 'password12' })
        .expect(201);

      const token = res.body.accessToken as string;
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
      expect(decoded.sub).toBe(res.body.user.id);
      expect(decoded.email).toBe(email);
    });

    it('very long password: succeeds (201) without server error', async () => {
      const longPassword = 'a'.repeat(500);
      const res = await getTestApp()
        .post('/api/v1/auth/register')
        .send({ email: uniqueEmail('longpw'), password: longPassword })
        .expect(201);

      expect(res.body.ok).toBe(true);
    });

    it('request body larger than 1mb: rejected by express.json', async () => {
      const huge = 'x'.repeat(1024 * 1024 + 100);
      const res = await getTestApp()
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json')
        .send(`{"email":"${uniqueEmail('huge')}","password":"password12","junk":"${huge}"}`);

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it.skip('returns 429 when rate limiting is enabled on /auth/register', async () => {
      await getTestApp()
        .post('/api/v1/auth/register')
        .send({ email: uniqueEmail('rl'), password: 'password12' })
        .expect(429);
    });
  });
});
