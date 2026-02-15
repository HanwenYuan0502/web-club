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

  requestOtp: (phone: string, context?: 'login' | 'register') =>
    request<{ ok: boolean }>('/v1/auth/otp/request', { method: 'POST', body: { phone, referrer: REFERRER, context } }),

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
    request<UserProfile>('/v1/users/me', { token }),

  update: (token: string, body: Partial<UserProfile>) =>
    request<UserProfile>('/v1/users/me', { method: 'PATCH', token, body }),

  // NOTE: 以下功能未在API文档中，仅用于本地Mock测试
  searchClubs: (token: string, query?: string, filters?: { type?: string; joinMode?: string }) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filters?.type) params.set('type', filters.type);
    if (filters?.joinMode) params.set('joinMode', filters.joinMode);
    const qs = params.toString();
    return request<Club[]>(`/v1/me/clubs/search${qs ? `?${qs}` : ''}`, { token });
  },

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

  disband: (token: string, clubId: string) =>
    request<void>(`/v1/clubs/${clubId}/disband`, { method: 'POST', token }),
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
    request<void>(`/v1/clubs/${clubId}/members/me/leave`, { method: 'POST', token }),

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
  query: (token: string, clubId: string, params: AuditLogQuery = {}) => {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.offset !== undefined) queryParams.set('offset', params.offset.toString());
    if (params.eventCategory) queryParams.set('eventCategory', params.eventCategory);
    if (params.result) queryParams.set('result', params.result);
    if (params.correlationId) queryParams.set('correlationId', params.correlationId);
    if (params.createdAfter) queryParams.set('createdAfter', params.createdAfter);
    if (params.createdBefore) queryParams.set('createdBefore', params.createdBefore);
    const qs = queryParams.toString();
    return request<AuditLogEntry[]>(`/v1/clubs/${clubId}/audit-logs${qs ? `?${qs}` : ''}`, { token });
  },
};

// ─── Notifications ───
// NOTE: 未在API文档中，仅用于本地Mock测试
export const notifications = {
  list: (token: string) =>
    request<Notification[]>('/v1/me/notifications', { token }),

  markAllRead: (token: string) =>
    request<{ ok: boolean }>('/v1/me/notifications', { method: 'POST', token }),
};

// ─── Events ───
// NOTE: 未在API文档中，仅用于本地Mock测试
export const events = {
  list: (token: string, clubId: string) =>
    request<ClubEvent[]>(`/v1/clubs/${clubId}/events`, { token }),

  create: (token: string, clubId: string, body: CreateEventBody) =>
    request<ClubEvent>(`/v1/clubs/${clubId}/events`, { method: 'POST', token, body }),

  get: (token: string, clubId: string, eventId: string) =>
    request<ClubEvent>(`/v1/clubs/${clubId}/events/${eventId}`, { token }),

  register: (token: string, clubId: string, eventId: string) =>
    request<EventRegistration>(`/v1/clubs/${clubId}/events/${eventId}/register`, { method: 'POST', token }),

  unregister: (token: string, clubId: string, eventId: string) =>
    request<{ ok: boolean }>(`/v1/clubs/${clubId}/events/${eventId}/register`, { method: 'DELETE', token }),

  registrations: (token: string, clubId: string, eventId: string) =>
    request<EventRegistration[]>(`/v1/clubs/${clubId}/events/${eventId}/registrations`, { token }),
};

// ─── Upload ───
// NOTE: 未在API文档中，仅用于本地Mock测试
export const upload = {
  image: async (token: string, file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/v1/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new ApiError(res.status, data);
    return data as { url: string };
  },
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
  avatarUrl?: string;
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
  limit?: number;
  offset?: number;
  eventCategory?: string;
  result?: string;
  correlationId?: string;
  createdAfter?: string;
  createdBefore?: string;
};

export type Notification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  clubId?: string;
  linkUrl?: string;
  read: boolean;
  createdAt: string;
};

export type ClubEvent = {
  id: string;
  clubId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime?: string;
  maxParticipants?: number | null;
  createdBy: string;
  registrationCount?: number;
  isRegistered?: boolean;
  createdAt: string;
};

export type CreateEventBody = {
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime?: string;
  maxParticipants?: number | null;
};

export type EventRegistration = {
  id: string;
  eventId: string;
  userId: string;
  status: 'REGISTERED' | 'CANCELLED';
  user?: Partial<UserProfile>;
  createdAt: string;
};
