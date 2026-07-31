export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `pbkdf2:100000:${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(':');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = parseInt(parts[1]);
  const salt = new Uint8Array(parts[2].match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const hash = parts[3];

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt, iterations: iterations, hash: "SHA-256" },
    keyMaterial,
    256
  );
  const derivedHashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
  return derivedHashHex === hash;
}

export async function generateToken(userId: string, role: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const header = { alg: "HS256", typ: "JWT" };
  const payload = { userId, role, exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) };
  const base64UrlEncode = (obj: any) => btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unsignedToken = `${base64UrlEncode(header)}.${base64UrlEncode(payload)}`;

  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(unsignedToken));
  const sigBase64Url = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${unsignedToken}.${sigBase64Url}`;
}

export async function verifyToken(token: string, secret: string): Promise<any> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]
  );
  const unsignedToken = `${parts[0]}.${parts[1]}`;
  const signatureStr = atob(parts[2].replace(/-/g, '+').replace(/_/g, '/'));
  const signature = new Uint8Array(signatureStr.length);
  for (let i = 0; i < signatureStr.length; i++) {
    signature[i] = signatureStr.charCodeAt(i);
  }
  const isValid = await crypto.subtle.verify("HMAC", key, signature, enc.encode(unsignedToken));
  if (!isValid) return null;
  const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

export const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  const token = authHeader.split(' ')[1];
  const payload = await verifyToken(token, c.env.JWT_SECRET);
  if (!payload) return c.json({ success: false, error: 'Invalid or expired token' }, 401);
  c.set('user', payload);
  await next();
};

export const requireRole = (...roles: string[]) => {
  return async (c: any, next: any) => {
    const user = c.get('user');
    if (!user || !roles.includes(user.role)) return c.json({ success: false, error: 'Forbidden' }, 403);
    await next();
  };
};
