'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  clubs as clubsApi, members as membersApi, invites as invitesApi,
  applications as applicationsApi, auditLogs as auditApi, events as eventsApi,
  ApiError,
  type Club, type Member, type Invite, type Application, type AuditLogEntry, type ClubEvent,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  ArrowLeft, Users, Mail, Link2, ClipboardCheck, ScrollText,
  Settings, UserPlus, Copy, Trash2, Check, X, Shield, LogOut,
  ChevronRight, RefreshCw, Share2, MessageCircle, Smartphone, ExternalLink,
  CalendarDays, MapPin, Clock, UserCheck, Plus, Loader2,
} from 'lucide-react';
import { Badminton } from '@/components/icons';
import { PhoneInput } from '@/components/phone-input';
import { ClubDetailSkeleton } from '@/components/skeletons';

export default function ClubDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getToken, user } = useAuth();
  const clubId = params.id as string;

  const [club, setClub] = useState<Club | null>(null);
  const [myMembership, setMyMembership] = useState<Member | null>(null);
  const [membersList, setMembersList] = useState<Member[]>([]);
  const [invitesList, setInvitesList] = useState<Invite[]>([]);
  const [applicationsList, setApplicationsList] = useState<Application[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<AuditLogEntry[]>([]);
  const [auditOffset, setAuditOffset] = useState(0);
  const [auditHasMore, setAuditHasMore] = useState(true);
  const [eventsList, setEventsList] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const isAdmin = myMembership?.role === 'ADMIN';

  const loadClub = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const [c, m] = await Promise.all([
        clubsApi.get(token, clubId),
        membersApi.getMe(token, clubId).catch(() => null),
      ]);
      setClub(c);
      setMyMembership(m);
    } catch {
      toast.error('Failed to load club');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [getToken, clubId, router]);

  const loadMembers = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const data = await membersApi.list(token, clubId);
      setMembersList(Array.isArray(data) ? data : []);
    } catch { /* empty */ }
  }, [getToken, clubId]);

  const loadInvites = useCallback(async () => {
    const token = await getToken();
    if (!token || !isAdmin) return;
    try {
      const data = await invitesApi.list(token, clubId);
      setInvitesList(Array.isArray(data) ? data : []);
    } catch { /* empty */ }
  }, [getToken, clubId, isAdmin]);

  const loadApplications = useCallback(async () => {
    const token = await getToken();
    if (!token || !isAdmin) return;
    try {
      const data = await applicationsApi.list(token, clubId);
      setApplicationsList(Array.isArray(data) ? data : []);
    } catch { /* empty */ }
  }, [getToken, clubId, isAdmin]);

  const loadEvents = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const data = await eventsApi.list(token, clubId);
      setEventsList(Array.isArray(data) ? data : []);
    } catch { /* empty */ }
  }, [getToken, clubId]);

  const loadAuditLogs = useCallback(async (loadMore = false) => {
    const token = await getToken();
    if (!token || !isAdmin) return;
    try {
      const offset = loadMore ? auditOffset : 0;
      const data = await auditApi.query(token, clubId, { limit: 50, offset });
      if (loadMore) {
        setAuditLogsList(prev => [...prev, ...data]);
      } else {
        setAuditLogsList(data);
      }
      setAuditOffset(offset + data.length);
      setAuditHasMore(data.length === 50);
    } catch { /* empty */ }
  }, [getToken, clubId, isAdmin, auditOffset]);

  useEffect(() => { loadClub(); }, [loadClub]);

  useEffect(() => {
    if (!loading && club) {
      if (activeTab === 'overview' && isAdmin) loadInvites();
      if (activeTab === 'members') loadMembers();
      if (activeTab === 'invites') loadInvites();
      if (activeTab === 'applications') loadApplications();
      if (activeTab === 'events') loadEvents();
      if (activeTab === 'audit') loadAuditLogs();
    }
  }, [activeTab, loading, club, isAdmin, loadMembers, loadInvites, loadApplications, loadEvents, loadAuditLogs]);

  if (loading) {
    return <ClubDetailSkeleton />;
  }

  if (!club) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border bg-gradient-to-r from-primary/5 via-background to-primary/5 p-6">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="mr-1 h-4 w-4" />Back to Dashboard
        </Link>
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Badminton className="h-7 w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{club.name}</h1>
              {club.type && (
                <Badge variant={club.type === 'COMPETITIVE' ? 'default' : 'secondary'} className="text-xs">
                  {club.type}
                </Badge>
              )}
              {isAdmin && <Badge variant="outline" className="text-xs border-primary/30 text-primary"><Shield className="mr-1 h-3 w-3" />Admin</Badge>}
            </div>
            {club.description && <p className="text-muted-foreground mt-1 line-clamp-2">{club.description}</p>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members"><Users className="mr-1 h-3.5 w-3.5" />Members</TabsTrigger>
          {isAdmin && <TabsTrigger value="invites"><Link2 className="mr-1 h-3.5 w-3.5" />Invites</TabsTrigger>}
          {isAdmin && <TabsTrigger value="applications"><ClipboardCheck className="mr-1 h-3.5 w-3.5" />Applications</TabsTrigger>}
          <TabsTrigger value="events"><CalendarDays className="mr-1 h-3.5 w-3.5" />Events</TabsTrigger>
          {isAdmin && <TabsTrigger value="audit"><ScrollText className="mr-1 h-3.5 w-3.5" />Audit Logs</TabsTrigger>}
          {isAdmin && <TabsTrigger value="settings"><Settings className="mr-1 h-3.5 w-3.5" />Settings</TabsTrigger>}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <OverviewTab club={club} myMembership={myMembership} isAdmin={isAdmin} invitesList={invitesList} getToken={getToken} clubId={clubId} onUpdate={loadClub} onLoadInvites={loadInvites} router={router} />
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <MembersTab
            members={membersList}
            isAdmin={isAdmin}
            currentUserId={user?.id}
            getToken={getToken}
            clubId={clubId}
            onRefresh={loadMembers}
          />
        </TabsContent>

        {/* Invites Tab */}
        <TabsContent value="invites">
          <InvitesTab
            invitesList={invitesList}
            getToken={getToken}
            clubId={clubId}
            clubName={club.name}
            onRefresh={loadInvites}
          />
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications">
          <ApplicationsTab
            applications={applicationsList}
            getToken={getToken}
            clubId={clubId}
            onRefresh={loadApplications}
          />
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events">
          <EventsTab
            events={eventsList}
            isAdmin={isAdmin}
            getToken={getToken}
            clubId={clubId}
            currentUserId={user?.id}
            onRefresh={loadEvents}
          />
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit">
          <AuditTab
            logs={auditLogsList}
            hasMore={auditHasMore}
            onLoadMore={() => loadAuditLogs(true)}
            onRefresh={() => loadAuditLogs(false)}
          />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <SettingsTab club={club} getToken={getToken} clubId={clubId} onUpdate={loadClub} router={router} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Overview Tab ───
function OverviewTab({ club, myMembership, isAdmin, invitesList, getToken, clubId, onUpdate, onLoadInvites, router }: {
  club: Club; myMembership: Member | null; isAdmin: boolean; invitesList: Invite[];
  getToken: () => Promise<string | null>;
  clubId: string; onUpdate: () => void; onLoadInvites: () => void; router: ReturnType<typeof useRouter>;
}) {
  const [creatingInvite, setCreatingInvite] = useState(false);

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this club?')) return;
    const token = await getToken();
    if (!token) return;
    try {
      await membersApi.leave(token, clubId);
      toast.success('You have left the club');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to leave club');
    }
  };

  const handleCreateGeneralInvite = async () => {
    const token = await getToken();
    if (!token) return;
    setCreatingInvite(true);
    try {
      await invitesApi.create(token, clubId);
      toast.success('Invite link created!');
      onLoadInvites();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create invite');
    } finally {
      setCreatingInvite(false);
    }
  };

  const activeGeneralInvite = invitesList.find(i => i.status === 'ACTIVE' && !i.targetPhone && !i.targetEmail);
  const inviteUrl = activeGeneralInvite ? `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${activeGeneralInvite.token}` : '';

  const shareInvite = (method: 'copy' | 'whatsapp' | 'sms') => {
    if (!inviteUrl) return;
    const text = `Join ${club.name} on BadBuddy! ${inviteUrl}`;
    if (method === 'copy') {
      navigator.clipboard.writeText(inviteUrl);
      toast.success('Invite link copied!');
    } else if (method === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } else if (method === 'sms') {
      window.open(`sms:?body=${encodeURIComponent(text)}`, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Invite link card for admins */}
      {isAdmin && (
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Share2 className="h-4 w-4 text-primary" />
              Invite People
            </CardTitle>
            <CardDescription>Share this link to invite people to your club</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeGeneralInvite ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-md border bg-muted/50 px-3 py-2 text-sm font-mono truncate select-all">
                    {inviteUrl}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => shareInvite('copy')}>
                    <Copy className="h-3.5 w-3.5 mr-1" />Copy
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => shareInvite('whatsapp')}>
                    <MessageCircle className="h-3.5 w-3.5 mr-1" />WhatsApp
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => shareInvite('sms')}>
                    <Smartphone className="h-3.5 w-3.5 mr-1" />SMS
                  </Button>
                </div>
              </>
            ) : (
              <Button onClick={handleCreateGeneralInvite} disabled={creatingInvite}>
                <Link2 className="mr-2 h-4 w-4" />{creatingInvite ? 'Creating...' : 'Generate Invite Link'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Club Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Type" value={club.type || 'N/A'} />
            <InfoRow label="Join Mode" value={club.joinMode === 'INVITE_ONLY' ? 'Invite Only' : 'Open to Applications'} />
            <InfoRow label="Accepting Members" value={club.isAcceptingNewMembers ? 'Yes' : 'No'} />
            <InfoRow label="Member Limit" value={club.activeMemberLimit ? String(club.activeMemberLimit) : 'Unlimited'} />
            {club.levelsAccepted && club.levelsAccepted.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground">Levels:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {club.levelsAccepted.map(l => <Badge key={l} variant="outline" className="text-xs">{l}</Badge>)}
                </div>
              </div>
            )}
            {club.rules && (
              <div>
                <span className="text-sm text-muted-foreground">Rules:</span>
                <p className="text-sm mt-1 whitespace-pre-wrap">{club.rules}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">My Membership</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {myMembership ? (
              <>
                <InfoRow label="Role" value={myMembership.role} />
                <InfoRow label="Status" value={myMembership.status} />
                <InfoRow label="Phone Visible" value={myMembership.showPhoneToMembers ? 'Yes' : 'No'} />
                <InfoRow label="Email Visible" value={myMembership.showEmailToMembers ? 'Yes' : 'No'} />
                <Separator />
                <Button variant="destructive" size="sm" onClick={handleLeave}>
                  <LogOut className="mr-2 h-4 w-4" />Leave Club
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">No membership info available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

// ─── Members Tab ───
function MembersTab({ members, isAdmin, currentUserId, getToken, clubId, onRefresh }: {
  members: Member[]; isAdmin: boolean; currentUserId?: string;
  getToken: () => Promise<string | null>; clubId: string; onRefresh: () => void;
}) {
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [newRole, setNewRole] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const handleUpdateMember = async () => {
    if (!editingMember) return;
    const token = await getToken();
    if (!token) return;
    try {
      const body: { role?: string; status?: string } = {};
      if (newRole && newRole !== editingMember.role) body.role = newRole;
      if (newStatus && newStatus !== editingMember.status) body.status = newStatus;
      await membersApi.updateByUser(token, clubId, editingMember.userId, body);
      toast.success('Member updated');
      setEditingMember(null);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update member');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Members ({members.length})</CardTitle>
          <CardDescription>Club roster</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" />Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow><TableCell colSpan={isAdmin ? 5 : 4} className="text-center text-muted-foreground py-8">No members found</TableCell></TableRow>
            ) : (
              members.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">
                    {m.user?.firstName} {m.user?.lastName}
                    {m.userId === currentUserId && <span className="text-xs text-muted-foreground ml-1">(you)</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.user?.phone || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={m.role === 'ADMIN' ? 'default' : 'secondary'} className="text-xs">
                      {m.role === 'ADMIN' && <Shield className="mr-1 h-3 w-3" />}{m.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.status === 'ACTIVE' ? 'default' : m.status === 'INACTIVE' ? 'secondary' : 'destructive'} className="text-xs">
                      {m.status}
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      {m.userId !== currentUserId && (
                        <Button variant="ghost" size="sm" onClick={() => { setEditingMember(m); setNewRole(m.role); setNewStatus(m.status); }}>
                          Edit
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Edit Member Dialog */}
        <Dialog open={!!editingMember} onOpenChange={open => !open && setEditingMember(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Member</DialogTitle>
              <DialogDescription>
                {editingMember?.user?.firstName} {editingMember?.user?.lastName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="MEMBER">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="REMOVED">Removed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingMember(null)}>Cancel</Button>
              <Button onClick={handleUpdateMember}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ─── Invites Tab ───
function InvitesTab({ invitesList, getToken, clubId, clubName, onRefresh }: {
  invitesList: Invite[]; getToken: () => Promise<string | null>; clubId: string; clubName: string; onRefresh: () => void;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [targetPhone, setTargetPhone] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [shareMenuInvite, setShareMenuInvite] = useState<string | null>(null);

  const handleCreate = async (targeted: boolean) => {
    const token = await getToken();
    if (!token) return;
    setCreating(true);
    try {
      const body = targeted ? { targetPhone: targetPhone || undefined, targetEmail: targetEmail || undefined } : undefined;
      await invitesApi.create(token, clubId, body);
      toast.success('Invite created!');
      setShowCreate(false);
      setTargetPhone('');
      setTargetEmail('');
      onRefresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create invite');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (inviteId: string) => {
    const token = await getToken();
    if (!token) return;
    try {
      await invitesApi.revoke(token, clubId, inviteId);
      toast.success('Invite revoked');
      onRefresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to revoke invite');
    }
  };

  const getInviteUrl = (inviteToken: string) => `${window.location.origin}/invite/${inviteToken}`;

  const shareInvite = (inviteToken: string, method: 'copy' | 'whatsapp' | 'sms') => {
    const url = getInviteUrl(inviteToken);
    const text = `Join ${clubName} on BadBuddy! ${url}`;
    if (method === 'copy') {
      navigator.clipboard.writeText(url);
      toast.success('Invite link copied!');
    } else if (method === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } else if (method === 'sms') {
      window.open(`sms:?body=${encodeURIComponent(text)}`, '_blank');
    }
    setShareMenuInvite(null);
  };

  const activeInvites = invitesList.filter(i => i.status === 'ACTIVE');
  const otherInvites = invitesList.filter(i => i.status !== 'ACTIVE');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Invites ({invitesList.length})</CardTitle>
            <CardDescription>Manage club invitations</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="mr-1 h-3.5 w-3.5" />Refresh
            </Button>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button size="sm"><UserPlus className="mr-1 h-3.5 w-3.5" />New Invite</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Invite</DialogTitle>
                  <DialogDescription>Create a general or targeted invite link</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Button className="w-full" onClick={() => handleCreate(false)} disabled={creating}>
                    <Link2 className="mr-2 h-4 w-4" />Create General Invite Link
                  </Button>
                  <Separator />
                  <p className="text-sm text-muted-foreground">Or send a targeted invite to a specific person:</p>
                  <div className="space-y-2">
                    <Label>Target Phone</Label>
                    <PhoneInput value={targetPhone} onChange={setTargetPhone} />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Email</Label>
                    <Input placeholder="user@example.com" value={targetEmail} onChange={e => setTargetEmail(e.target.value)} />
                  </div>
                  <Button className="w-full" variant="secondary" onClick={() => handleCreate(true)} disabled={creating || (!targetPhone && !targetEmail)}>
                    <Mail className="mr-2 h-4 w-4" />Send Targeted Invite
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitesList.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No invites yet. Create one to start inviting people.</TableCell></TableRow>
              ) : (
                [...activeInvites, ...otherInvites].map(inv => (
                  <TableRow key={inv.id} className={inv.status !== 'ACTIVE' ? 'opacity-50' : ''}>
                    <TableCell className="text-sm font-medium">
                      {inv.targetPhone || inv.targetEmail ? (
                        <Badge variant="secondary" className="text-xs"><Mail className="mr-1 h-3 w-3" />Targeted</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs"><Link2 className="mr-1 h-3 w-3" />General</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {inv.targetPhone || inv.targetEmail || <span className="text-muted-foreground">Anyone with link</span>}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={inv.status === 'ACTIVE' ? 'default' : inv.status === 'CONSUMED' ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {inv.status || 'ACTIVE'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {inv.status === 'ACTIVE' && (
                          <>
                            <Button variant="ghost" size="sm" title="Copy link" onClick={() => shareInvite(inv.token, 'copy')}>
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" title="Share via WhatsApp" className="text-green-600" onClick={() => shareInvite(inv.token, 'whatsapp')}>
                              <MessageCircle className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" title="Share via SMS" onClick={() => shareInvite(inv.token, 'sms')}>
                              <Smartphone className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive" title="Revoke" onClick={() => handleRevoke(inv.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Applications Tab ───
function ApplicationsTab({ applications, getToken, clubId, onRefresh }: {
  applications: Application[]; getToken: () => Promise<string | null>; clubId: string; onRefresh: () => void;
}) {
  const [rejectDialog, setRejectDialog] = useState<Application | null>(null);
  const [denialReason, setDenialReason] = useState('');
  const [denialNotes, setDenialNotes] = useState('');

  const handleApprove = async (appId: string) => {
    const token = await getToken();
    if (!token) return;
    try {
      await applicationsApi.approve(token, clubId, appId);
      toast.success('Application approved');
      onRefresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to approve');
    }
  };

  const handleReject = async () => {
    if (!rejectDialog) return;
    const token = await getToken();
    if (!token) return;
    try {
      await applicationsApi.reject(token, clubId, rejectDialog.id, {
        denialReason: denialReason || 'OTHER',
        denialNotes: denialNotes || undefined,
      });
      toast.success('Application rejected');
      setRejectDialog(null);
      setDenialReason('');
      setDenialNotes('');
      onRefresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to reject');
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'PENDING': return 'secondary';
      case 'APPROVED': return 'default';
      case 'REJECTED': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Applications ({applications.length})</CardTitle>
          <CardDescription>Review membership applications</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" />Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No applications</TableCell></TableRow>
            ) : (
              applications.map(app => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">
                    {app.user?.firstName} {app.user?.lastName}
                    <span className="block text-xs text-muted-foreground">{app.user?.phone}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColor(app.status) as 'default' | 'secondary' | 'destructive' | 'outline'} className="text-xs">{app.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {app.status === 'PENDING' && (
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" className="text-green-600" onClick={() => handleApprove(app.id)}>
                          <Check className="h-3.5 w-3.5 mr-1" />Approve
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setRejectDialog(app)}>
                          <X className="h-3.5 w-3.5 mr-1" />Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Dialog open={!!rejectDialog} onOpenChange={open => !open && setRejectDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Application</DialogTitle>
              <DialogDescription>
                {rejectDialog?.user?.firstName} {rejectDialog?.user?.lastName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Denial Reason</Label>
                <Select value={denialReason} onValueChange={setDenialReason}>
                  <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLUB_FULL">Club Full</SelectItem>
                    <SelectItem value="SKILL_LEVEL_MISMATCH">Skill Level Mismatch</SelectItem>
                    <SelectItem value="INCOMPLETE_PROFILE">Incomplete Profile</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Internal Notes (admin-only)</Label>
                <Textarea value={denialNotes} onChange={e => setDenialNotes(e.target.value)} placeholder="Optional notes..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialog(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject}>Reject Application</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ─── Audit Logs Tab ───
function AuditTab({ logs, hasMore, onLoadMore, onRefresh }: {
  logs: AuditLogEntry[]; hasMore: boolean; onLoadMore: () => void; onRefresh: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Audit Logs ({logs.length})</CardTitle>
          <CardDescription>Activity history for this club</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" />Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No audit logs</TableCell></TableRow>
            ) : (
              logs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs">{log.action}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{log.eventCategory}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={log.result === 'success' ? 'default' : log.result === 'failure' ? 'destructive' : 'secondary'} className="text-xs">
                      {log.result}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.targetType && `${log.targetType}`}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {hasMore && logs.length > 0 && (
          <div className="flex justify-center mt-4">
            <Button variant="outline" onClick={onLoadMore} size="sm">
              Load More <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Settings Tab ───
function SettingsTab({ club, getToken, clubId, onUpdate, router }: {
  club: Club; getToken: () => Promise<string | null>; clubId: string;
  onUpdate: () => void; router: ReturnType<typeof useRouter>;
}) {
  const [form, setForm] = useState({
    name: club.name,
    description: club.description || '',
    type: club.type || 'CASUAL',
    joinMode: club.joinMode || 'APPLY_TO_JOIN',
    isAcceptingNewMembers: club.isAcceptingNewMembers ?? true,
    activeMemberLimit: club.activeMemberLimit,
    rules: club.rules || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const token = await getToken();
    if (!token) return;
    setSaving(true);
    try {
      await clubsApi.update(token, clubId, {
        ...form,
        activeMemberLimit: form.activeMemberLimit || null,
      });
      toast.success('Club settings updated');
      onUpdate();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleDisband = async () => {
    if (!confirm('Are you sure you want to disband this club? This action cannot be undone.')) return;
    const token = await getToken();
    if (!token) return;
    try {
      await clubsApi.delete(token, clubId);
      toast.success('Club disbanded');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to disband');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Club Settings</CardTitle>
          <CardDescription>Update club configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Club Name</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as 'CASUAL' | 'COMPETITIVE' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASUAL">Casual</SelectItem>
                  <SelectItem value="COMPETITIVE">Competitive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Join Mode</Label>
              <Select value={form.joinMode} onValueChange={v => setForm(f => ({ ...f, joinMode: v as 'INVITE_ONLY' | 'APPLY_TO_JOIN' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPLY_TO_JOIN">Open to Applications</SelectItem>
                  <SelectItem value="INVITE_ONLY">Invite Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="accepting"
              checked={form.isAcceptingNewMembers}
              onChange={e => setForm(f => ({ ...f, isAcceptingNewMembers: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="accepting">Accepting new members</Label>
          </div>
          <div className="space-y-2">
            <Label>Active Member Limit</Label>
            <Input
              type="number"
              min={1}
              value={form.activeMemberLimit ?? ''}
              onChange={e => setForm(f => ({ ...f, activeMemberLimit: e.target.value ? Number(e.target.value) : null }))}
              placeholder="Unlimited"
            />
          </div>
          <div className="space-y-2">
            <Label>Rules</Label>
            <Textarea value={form.rules} onChange={e => setForm(f => ({ ...f, rules: e.target.value }))} rows={3} />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Disbanding a club is permanent and removes all members.</p>
          <Button variant="destructive" onClick={handleDisband}>
            <Trash2 className="mr-2 h-4 w-4" />Disband Club
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Events Tab ───
function EventsTab({ events, isAdmin, getToken, clubId, currentUserId, onRefresh }: {
  events: ClubEvent[]; isAdmin: boolean;
  getToken: () => Promise<string | null>; clubId: string; currentUserId?: string; onRefresh: () => void;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', location: '', startTime: '', endTime: '', maxParticipants: '' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = await getToken();
    if (!token) return;
    setCreating(true);
    try {
      await eventsApi.create(token, clubId, {
        ...form,
        maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : null,
      });
      toast.success('Event created!');
      setShowCreate(false);
      setForm({ title: '', description: '', location: '', startTime: '', endTime: '', maxParticipants: '' });
      onRefresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleRegister = async (event: ClubEvent) => {
    const token = await getToken();
    if (!token) return;
    setRegisteringId(event.id);
    try {
      if (event.isRegistered) {
        await eventsApi.unregister(token, clubId, event.id);
        toast.success('Unregistered from event');
      } else {
        await eventsApi.register(token, clubId, event.id);
        toast.success('Registered for event!');
      }
      onRefresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed');
    } finally {
      setRegisteringId(null);
    }
  };

  const upcoming = events.filter(e => new Date(e.startTime) >= new Date());
  const past = events.filter(e => new Date(e.startTime) < new Date());

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };
  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Events ({events.length})</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="mr-1 h-3.5 w-3.5" />Refresh
          </Button>
          {isAdmin && (
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-1 h-3.5 w-3.5" />New Event</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Event</DialogTitle>
                  <DialogDescription>Schedule a new event for your club</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Sports Center Court 3" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start *</Label>
                      <Input type="datetime-local" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label>End</Label>
                      <Input type="datetime-local" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Max Participants</Label>
                    <Input type="number" min={1} value={form.maxParticipants} onChange={e => setForm(f => ({ ...f, maxParticipants: e.target.value }))} placeholder="Unlimited" />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                    <Button type="submit" disabled={creating}>
                      {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create Event'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {events.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-semibold">No events yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {isAdmin ? 'Create an event to get your club members together!' : 'No upcoming events scheduled.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Upcoming</h4>
              <div className="grid gap-3">
                {upcoming.map(ev => (
                  <EventCard key={ev.id} event={ev} onToggle={handleToggleRegister} registeringId={registeringId} />
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Past</h4>
              <div className="grid gap-3">
                {past.map(ev => (
                  <EventCard key={ev.id} event={ev} onToggle={handleToggleRegister} registeringId={registeringId} isPast />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EventCard({ event, onToggle, registeringId, isPast }: {
  event: ClubEvent; onToggle: (e: ClubEvent) => void; registeringId: string | null; isPast?: boolean;
}) {
  const d = new Date(event.startTime);
  const day = d.getDate();
  const month = d.toLocaleString(undefined, { month: 'short' });
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const isFull = event.maxParticipants ? (event.registrationCount || 0) >= event.maxParticipants : false;

  return (
    <Card className={`transition-all ${isPast ? 'opacity-60' : 'hover:shadow-md hover:-translate-y-0.5'}`}>
      <CardContent className="flex gap-4 py-4">
        <div className="flex flex-col items-center justify-center rounded-lg bg-primary/10 text-primary px-3 py-2 min-w-[60px]">
          <span className="text-2xl font-bold leading-none">{day}</span>
          <span className="text-xs font-medium uppercase">{month}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold truncate">{event.title}</h4>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{time}</span>
            {event.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>}
            <span className="flex items-center gap-1">
              <UserCheck className="h-3 w-3" />
              {event.registrationCount || 0}{event.maxParticipants ? `/${event.maxParticipants}` : ''} going
            </span>
          </div>
          {event.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{event.description}</p>}
        </div>
        {!isPast && (
          <div className="flex items-center shrink-0">
            <Button
              size="sm"
              variant={event.isRegistered ? 'secondary' : 'default'}
              disabled={registeringId === event.id || (isFull && !event.isRegistered)}
              onClick={() => onToggle(event)}
            >
              {registeringId === event.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : event.isRegistered ? (
                'Leave'
              ) : isFull ? (
                'Full'
              ) : (
                'Join'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
