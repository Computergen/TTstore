const http = require('node:http');
const crypto = require('node:crypto');
const { query } = require('./db');
const { hashPassword, verifyPassword } = require('./passwords');

const PORT = Number(process.env.PORT || 3000);
const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS || 30);
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';

function send(response, status, body, headers = {}) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': FRONTEND_ORIGIN,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type',
    ...headers
  });
  response.end(body === undefined ? '' : JSON.stringify(body));
}

function parseCookies(request) {
  return Object.fromEntries((request.headers.cookie || '').split(';').filter(Boolean).map((part) => {
    const separator = part.indexOf('=');
    return [part.slice(0, separator).trim(), decodeURIComponent(part.slice(separator + 1).trim())];
  }));
}

function sessionCookie(token, maxAge) {
  return `tula_session=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${COOKIE_SECURE ? '; Secure' : ''}`;
}

function tokenHash(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let raw = '';
    request.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) request.destroy(new Error('Request body is too large.'));
    });
    request.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch { reject(Object.assign(new Error('Request body must be valid JSON.'), { status: 400 })); }
    });
    request.on('error', reject);
  });
}

async function authenticate(request) {
  const token = parseCookies(request).tula_session;
  if (!token) return null;
  const result = await query(`
    SELECT u.id, u.email, u.name, u.role, u.profile_image_url, v.id AS vendor_id, s.slug AS store_slug
    FROM sessions session
    JOIN users u ON u.id = session.user_id
    LEFT JOIN vendors v ON v.owner_id = u.id
    LEFT JOIN stores s ON s.vendor_id = v.id
    WHERE session.token_hash = $1 AND session.expires_at > NOW()
  `, [tokenHash(token)]);
  return result.rows[0] || null;
}

function publicUser(user) {
  return { id: user.id, uid: user.id, email: user.email, name: user.name, role: user.role, profileImageUrl: user.profile_image_url || null, vendorId: user.vendor_id || null, storeSlug: user.store_slug || null };
}

async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  await query('DELETE FROM sessions WHERE user_id = $1 OR expires_at <= NOW()', [userId]);
  await query('INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + ($3 * INTERVAL \'1 day\'))', [userId, tokenHash(token), SESSION_TTL_DAYS]);
  return token;
}

async function route(request, response) {
  if (request.method === 'OPTIONS') return send(response, 204);
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  if (!url.pathname.startsWith('/api/v1/')) return send(response, 404, { error: 'Route not found.' });

  const body = ['POST', 'PUT', 'PATCH'].includes(request.method) ? await readBody(request) : {};
  const user = await authenticate(request);

  if (request.method === 'POST' && url.pathname === '/api/v1/auth/register') {
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const name = String(body.name || '').trim();
    if (!email || !email.includes('@') || password.length < 8 || !name) return send(response, 400, { error: 'Name, valid email, and a password of at least 8 characters are required.' });
    const passwordHash = await hashPassword(password);
    try {
      const result = await query('INSERT INTO users (email, name, role) VALUES ($1, $2, $3) RETURNING id, email, name, role, profile_image_url', [email, name, body.role === 'vendor' ? 'vendor' : 'customer']);
      const created = result.rows[0];
      await query('INSERT INTO password_credentials (user_id, password_hash) VALUES ($1, $2)', [created.id, passwordHash]);
      const token = await createSession(created.id);
      return send(response, 201, { user: publicUser(created) }, { 'Set-Cookie': sessionCookie(token, SESSION_TTL_DAYS * 86400) });
    } catch (error) {
      if (error.code === '23505') return send(response, 409, { error: 'An account already exists for this email.' });
      throw error;
    }
  }

  if (request.method === 'POST' && url.pathname === '/api/v1/auth/login') {
    const email = String(body.email || '').trim().toLowerCase();
    const result = await query(`SELECT u.*, c.password_hash FROM users u JOIN password_credentials c ON c.user_id = u.id WHERE u.email = $1`, [email]);
    if (!result.rows[0] || !(await verifyPassword(body.password, result.rows[0].password_hash))) return send(response, 401, { error: 'The email or password is incorrect.' });
    const token = await createSession(result.rows[0].id);
    return send(response, 200, { user: publicUser(result.rows[0]) }, { 'Set-Cookie': sessionCookie(token, SESSION_TTL_DAYS * 86400) });
  }

  if (request.method === 'POST' && url.pathname === '/api/v1/auth/logout') {
    const token = parseCookies(request).tula_session;
    if (token) await query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash(token)]);
    return send(response, 200, { success: true }, { 'Set-Cookie': sessionCookie('', 0) });
  }

  if (request.method === 'GET' && url.pathname === '/api/v1/auth/me') {
    return user ? send(response, 200, { user: publicUser(user) }) : send(response, 401, { error: 'Authentication required.' });
  }

  if (request.method === 'GET' && url.pathname === '/api/v1/catalog/products') {
    const result = await query(`SELECT p.id, p.name, p.description, p.category, p.price, p.discount_price, p.stock_quantity, p.featured_image, p.status, p.created_at, s.slug AS store_slug, s.name AS store_name FROM products p LEFT JOIN stores s ON s.id = p.store_id WHERE p.status = 'Active' ORDER BY p.created_at DESC`);
    return send(response, 200, { products: result.rows });
  }

  if (request.method === 'GET' && url.pathname === '/api/v1/catalog/stores') {
    const result = await query(`SELECT s.id, s.slug, s.name, s.description, s.category, s.location, s.logo_url, s.banner_url, s.status FROM stores s WHERE s.status = 'active' ORDER BY s.created_at DESC`);
    return send(response, 200, { stores: result.rows });
  }

  return send(response, 404, { error: 'Route not found.' });
}

const server = http.createServer((request, response) => {
  route(request, response).catch((error) => {
    console.error(error);
    send(response, error.status || 500, { error: error.status ? error.message : 'Internal server error.' });
  });
});

server.listen(PORT, () => console.log(`TULA MARKET API listening on http://localhost:${PORT}`));
