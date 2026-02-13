'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { clubs as clubsApi, me as meApi, type Club } from '@/lib/api';
import { Badminton } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClubCardSkeleton } from '@/components/skeletons';
import { Plus, Search, Users, Shield, MapPin, ArrowRight, ChevronRight, Filter } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { getToken, user } = useAuth();
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [searchResults, setSearchResults] = useState<Club[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterJoinMode, setFilterJoinMode] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const loadClubs = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const data = await clubsApi.list(token);
      setMyClubs(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load clubs');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { loadClubs(); }, [loadClubs]);

  const handleSearch = async () => {
    if (!searchQuery.trim() && !filterType && !filterJoinMode) { setSearchResults([]); return; }
    const token = await getToken();
    if (!token) return;
    setSearching(true);
    try {
      const filters: { type?: string; joinMode?: string } = {};
      if (filterType) filters.type = filterType;
      if (filterJoinMode) filters.joinMode = filterJoinMode;
      const data = await meApi.searchClubs(token, searchQuery, filters);
      setSearchResults(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const greeting = user?.firstName ? `Welcome back, ${user.firstName}` : 'Welcome back';

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <div className="rounded-xl border bg-gradient-to-r from-primary/5 via-background to-primary/5 p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{greeting}</h1>
            <p className="text-muted-foreground mt-1">Manage your badminton clubs and memberships</p>
          </div>
          <Button asChild size="lg" className="hidden sm:inline-flex">
            <Link href="/clubs/new"><Plus className="mr-2 h-4 w-4" />Create Club</Link>
          </Button>
          <Button asChild size="icon" className="sm:hidden shrink-0">
            <Link href="/clubs/new"><Plus className="h-4 w-4" /></Link>
          </Button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clubs to join..."
              className="pl-10"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button variant="secondary" onClick={handleSearch} disabled={searching}>
            {searching ? 'Searching...' : 'Search'}
          </Button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <Filter className="mr-1 h-3 w-3" /><SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="CASUAL">Casual</SelectItem>
              <SelectItem value="COMPETITIVE">Competitive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterJoinMode} onValueChange={setFilterJoinMode}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue placeholder="Join Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Modes</SelectItem>
              <SelectItem value="APPLY_TO_JOIN">Open</SelectItem>
              <SelectItem value="INVITE_ONLY">Invite Only</SelectItem>
            </SelectContent>
          </Select>
          {(filterType || filterJoinMode) && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setFilterType(''); setFilterJoinMode(''); }}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            Search Results ({searchResults.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {searchResults.map(club => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
        </div>
      )}

      {/* My Clubs */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          My Clubs {!loading && `(${myClubs.length})`}
        </h2>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => <ClubCardSkeleton key={i} />)}
          </div>
        ) : myClubs.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Badminton className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">No clubs yet</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">Create your own badminton club or search for one to join</p>
              <div className="flex gap-3 mt-6">
                <Button asChild>
                  <Link href="/clubs/new"><Plus className="mr-2 h-4 w-4" />Create Club</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myClubs.map(club => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ClubCard({ club }: { club: Club }) {
  return (
    <Link href={`/clubs/${club.id}`} className="group">
      <Card className="h-full transition-all duration-200 group-hover:shadow-md group-hover:border-primary/20 group-hover:-translate-y-0.5">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Badminton className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base line-clamp-1 flex items-center gap-2">
                {club.name}
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </CardTitle>
              {club.description && (
                <CardDescription className="line-clamp-2 mt-0.5 text-xs">{club.description}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1.5">
            {club.type && (
              <Badge variant={club.type === 'COMPETITIVE' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                {club.type === 'COMPETITIVE' ? <Shield className="mr-0.5 h-2.5 w-2.5" /> : null}
                {club.type}
              </Badge>
            )}
            {club.joinMode && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {club.joinMode === 'INVITE_ONLY' ? 'Invite Only' : 'Open'}
              </Badge>
            )}
            {club.levelsAccepted && club.levelsAccepted.length > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {club.levelsAccepted.join(', ')}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
