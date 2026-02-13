import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DB_PATH = path.join(process.cwd(), '.local-db.json');

export type DbUser = {
  id: string;
  phone: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  nickname?: string;
  language: string;
  dateOfBirth?: string;
  gender?: string;
  referrer?: string;
  createdAt: string;
};

export type DbClub = {
  id: string;
  name: string;
  description?: string;
  type?: string;
  levelsAccepted?: string[];
  location?: Record<string, unknown>;
  badge?: string;
  rules?: string;
  joinMode?: string;
  isAcceptingNewMembers?: boolean;
  activeMemberLimit?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type DbMembership = {
  id: string;
  userId: string;
  clubId: string;
  role: 'ADMIN' | 'MEMBER';
  status: 'ACTIVE' | 'INACTIVE' | 'REMOVED';
  showPhoneToMembers: boolean;
  showEmailToMembers: boolean;
  adminNotes?: string;
  createdAt: string;
};

export type DbInvite = {
  id: string;
  clubId: string;
  token: string;
  targetPhone?: string;
  targetEmail?: string;
  status: string;
  createdAt: string;
};

export type DbApplication = {
  id: string;
  clubId: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  denialReason?: string;
  denialNotes?: string;
  createdAt: string;
};

export type DbOtp = {
  phone: string;
  code: string;
  createdAt: number;
  used: boolean;
};

export type DbToken = {
  token: string;
  userId: string;
  type: 'access' | 'refresh';
  createdAt: number;
  expiresAt: number;
  revoked: boolean;
};

export type DbAuditLog = {
  id: string;
  clubId: string;
  action: string;
  eventCategory: string;
  targetType?: string;
  targetId?: string;
  actorUserId?: string;
  result: string;
  statusCode: number;
  createdAt: string;
};

type Database = {
  users: DbUser[];
  clubs: DbClub[];
  memberships: DbMembership[];
  invites: DbInvite[];
  applications: DbApplication[];
  otps: DbOtp[];
  tokens: DbToken[];
  auditLogs: DbAuditLog[];
};

const EMPTY_DB: Database = {
  users: [],
  clubs: [],
  memberships: [],
  invites: [],
  applications: [],
  otps: [],
  tokens: [],
  auditLogs: [],
};

function readDb(): Database {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    }
  } catch { /* ignore */ }
  return structuredClone(EMPTY_DB);
}

function writeDb(db: Database) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function getDb(): Database {
  return readDb();
}

export function saveDb(db: Database) {
  writeDb(db);
}

export function uuid(): string {
  return crypto.randomUUID();
}

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function makeJwt(userId: string, type: 'access' | 'refresh'): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = type === 'access' ? now + 900 : now + 2592000; // 15min / 30d
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: userId, type, iat: now, exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', 'local-dev-secret').update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

export function parseJwt(token: string): { sub: string; type: string; exp: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  } catch {
    return null;
  }
}

export function getUserFromToken(authHeader: string | null): DbUser | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const payload = parseJwt(token);
  if (!payload) return null;
  if (payload.exp * 1000 < Date.now()) return null;

  const db = getDb();
  const tokenRecord = db.tokens.find(t => t.token === token && !t.revoked);
  if (!tokenRecord) return null;

  return db.users.find(u => u.id === payload.sub) || null;
}

export function jsonResponse(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function errorResponse(status: number, message: string) {
  return Response.json({ statusCode: status, message }, { status });
}

export function addAuditLog(db: Database, entry: Omit<DbAuditLog, 'id' | 'createdAt'>) {
  db.auditLogs.push({
    ...entry,
    id: uuid(),
    createdAt: new Date().toISOString(),
  });
}
