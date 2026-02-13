const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://sandbox.api.badmintonclub.ai';
const REFERRER = process.env.NEXT_PUBLIC_REFERRER || 'badbuddy-club-web';

export { API_BASE, REFERRER };

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
};

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, data: unknown) {
    super(typeof data === 'object' && data !== null && 'message' in data ? (data as { message: string }).message : `API Error ${status}`);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, headers: extraHeaders } = opts;
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extraHeaders };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);

  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

// ─── Auth ───
export const auth = {
  register: (body: RegisterBody) =>
    request<UserProfile>('/v1/auth/register', { method: 'POST', body: { ...body, referrer: REFERRER } }),

  requestOtp: (phone: string) =>
    request<{ ok: boolean }>('/v1/auth/otp/request', { method: 'POST', body: { phone, referrer: REFERRER } }),

  verifyOtp: (phone: string, code: string) =>
    request<LoginResponse>('/v1/auth/otp/verify', { method: 'POST', body: { phone, code } }),

  refresh: (refreshToken: string) =>
    request<TokenPair>('/v1/auth/refresh', { method: 'POST', token: refreshToken }),

  logout: (refreshToken: string) =>
    request<{ ok: boolean }>('/v1/auth/logout', { method: 'POST', token: refreshToken }),
};

// ─── User Profile ───
export const me = {
  get: (token: string) =>
    request<UserProfile>('/v1/me', { token }),

  update: (token: string, body: Partial<UserProfile>) =>
    request<UserProfile>('/v1/me', { method: 'PATCH', token, body }),

  searchClubs: (token: string, query?: string) =>
    request<Club[]>(`/v1/me/clubs/search${query ? `?q=${encodeURIComponent(query)}` : ''}`, { token }),

  listApplications: (token: string) =>
    request<Application[]>('/v1/me/applications', { token }),

  cancelApplication: (token: string, applicationId: string) =>
    request<Application>(`/v1/me/applications/${applicationId}/cancel`, { method: 'POST', token }),
};

// ─── Clubs ───
export const clubs = {
  list: (token: string) =>
    request<Club[]>('/v1/clubs', { token }),

  get: (token: string, clubId: string) =>
    request<Club>(`/v1/clubs/${clubId}`, { token }),

  create: (token: string, body: CreateClubBody) =>
    request<Club>('/v1/clubs', { method: 'POST', token, body }),

  update: (token: string, clubId: string, body: Partial<CreateClubBody>) =>
    request<Club>(`/v1/clubs/${clubId}`, { method: 'PATCH', token, body }),

  delete: (token: string, clubId: string) =>
    request<void>(`/v1/clubs/${clubId}`, { method: 'DELETE', token }),
};

// ─── Members ───
export const members = {
  list: (token: string, clubId: string) =>
    request<Member[]>(`/v1/clubs/${clubId}/members`, { token }),

  getMe: (token: string, clubId: string) =>
    request<Member>(`/v1/clubs/${clubId}/members/me`, { token }),

  updateMySettings: (token: string, clubId: string, body: MemberSettings) =>
    request<Member>(`/v1/clubs/${clubId}/members/me/settings`, { method: 'PATCH', token, body }),

  leave: (token: string, clubId: string) =>
    request<void>(`/v1/clubs/${clubId}/members/me`, { method: 'DELETE', token }),

  updateByUser: (token: string, clubId: string, userId: string, body: { role?: string; status?: string; adminNotes?: string }) =>
    request<Member>(`/v1/clubs/${clubId}/members/by-user/${userId}`, { method: 'PATCH', token, body }),
};

// ─── Invites ───
export const invites = {
  create: (token: string, clubId: string, body?: { targetPhone?: string; targetEmail?: string }) =>
    request<Invite>(`/v1/clubs/${clubId}/invites`, { method: 'POST', token, body }),

  list: (token: string, clubId: string) =>
    request<Invite[]>(`/v1/clubs/${clubId}/invites`, { token }),

  revoke: (token: string, clubId: string, inviteId: string) =>
    request<void>(`/v1/clubs/${clubId}/invites/${inviteId}/revoke`, { method: 'POST', token }),

  preview: (inviteToken: string) =>
    request<InvitePreview>(`/v1/invites/${inviteToken}`),

  accept: (token: string, inviteToken: string) =>
    request<unknown>(`/v1/invites/${inviteToken}/accept`, { method: 'POST', token }),
};

// ─── Applications ───
export const applications = {
  list: (token: string, clubId: string) =>
    request<Application[]>(`/v1/clubs/${clubId}/applications`, { token }),

  apply: (token: string, clubId: string) =>
    request<Application>(`/v1/clubs/${clubId}/applications`, { method: 'POST', token }),

  getMyLatest: (token: string, clubId: string) =>
    request<Application>(`/v1/clubs/${clubId}/applications/me`, { token }),

  approve: (token: string, clubId: string, applicationId: string) =>
    request<Application>(`/v1/clubs/${clubId}/applications/${applicationId}/approve`, { method: 'POST', token }),

  reject: (token: string, clubId: string, applicationId: string, body: { denialReason: string; denialNotes?: string }) =>
    request<Application>(`/v1/clubs/${clubId}/applications/${applicationId}/reject`, { method: 'POST', token, body }),
};

// ─── Audit Logs ───
export const auditLogs = {
  query: (token: string, clubId: string, body: AuditLogQuery = {}) =>
    request<AuditLogResponse>(`/v1/clubs/${clubId}/audit-logs`, { method: 'POST', token, body }),
};

// ─── Types ───
export type RegisterBody = {
  phone: string;
  firstName?: string;
  lastName?: string;
  nickname?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  language?: string;
};

export type UserProfile = {
  id: string;
  phone: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  nickname?: string;
  language?: string;
  dateOfBirth?: string;
  gender?: string;
  referrer?: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type LoginResponse = TokenPair & {
  me: {
    id: string;
    phone: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
};

export type Club = {
  id: string;
  name: string;
  description?: string;
  type?: 'CASUAL' | 'COMPETITIVE';
  levelsAccepted?: string[];
  location?: Record<string, unknown>;
  badge?: string;
  rules?: string;
  joinMode?: 'INVITE_ONLY' | 'APPLY_TO_JOIN';
  isAcceptingNewMembers?: boolean;
  activeMemberLimit?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateClubBody = {
  name: string;
  description?: string;
  type?: 'CASUAL' | 'COMPETITIVE';
  levelsAccepted?: string[];
  location?: Record<string, unknown>;
  rules?: string;
  joinMode?: 'INVITE_ONLY' | 'APPLY_TO_JOIN';
  isAcceptingNewMembers?: boolean;
  activeMemberLimit?: number | null;
};

export type Member = {
  id: string;
  userId: string;
  clubId: string;
  role: 'ADMIN' | 'MEMBER';
  status: 'ACTIVE' | 'INACTIVE' | 'REMOVED';
  user?: Partial<UserProfile>;
  showPhoneToMembers?: boolean;
  showEmailToMembers?: boolean;
  adminNotes?: string;
  createdAt?: string;
};

export type MemberSettings = {
  showPhoneToMembers?: boolean;
  showEmailToMembers?: boolean;
};

export type Invite = {
  id: string;
  clubId: string;
  token: string;
  targetPhone?: string;
  targetEmail?: string;
  status?: string;
  createdAt?: string;
};

export type InvitePreview = {
  club: Partial<Club>;
  invite: Partial<Invite>;
};

export type Application = {
  id: string;
  clubId: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  denialReason?: string;
  denialNotes?: string;
  user?: Partial<UserProfile>;
  createdAt?: string;
};

export type AuditLogEntry = {
  id: string;
  action: string;
  eventCategory: string;
  targetType?: string;
  targetId?: string;
  actorUserId?: string;
  result: string;
  statusCode?: number;
  errorMessage?: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
};

export type AuditLogQuery = {
  pageSize?: number;
  pageToken?: string;
  eventCategory?: string;
  result?: string;
  correlationId?: string;
  createdAfter?: string;
  createdBefore?: string;
};

export type AuditLogResponse = {
  items: AuditLogEntry[];
  nextPageToken: string;
};
