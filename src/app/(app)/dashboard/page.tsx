'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { clubs as clubsApi, me as meApi, type Club } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Search, Users, Shield, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { getToken } = useAuth();
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [searchResults, setSearchResults] = useState<Club[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const token = await getToken();
    if (!token) return;
    setSearching(true);
    try {
      const data = await meApi.searchClubs(token, searchQuery);
      setSearchResults(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Clubs</h1>
          <p className="text-muted-foreground mt-1">Manage your badminton clubs</p>
        </div>
        <Button asChild>
          <Link href="/clubs/new"><Plus className="mr-2 h-4 w-4" />Create Club</Link>
        </Button>
      </div>

      {/* Search */}
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

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Search Results</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {searchResults.map(club => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
        </div>
      )}

      {/* My Clubs */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader><div className="h-5 bg-muted rounded w-2/3" /><div className="h-3 bg-muted rounded w-1/2 mt-2" /></CardHeader>
              <CardContent><div className="h-4 bg-muted rounded w-1/3" /></CardContent>
            </Card>
          ))}
        </div>
      ) : myClubs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No clubs yet</h3>
            <p className="text-muted-foreground mt-1">Create a club or search for one to join</p>
            <Button className="mt-4" asChild>
              <Link href="/clubs/new"><Plus className="mr-2 h-4 w-4" />Create Club</Link>
            </Button>
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
  );
}

function ClubCard({ club }: { club: Club }) {
  return (
    <Link href={`/clubs/${club.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg line-clamp-1">{club.name}</CardTitle>
            {club.type && (
              <Badge variant={club.type === 'COMPETITIVE' ? 'default' : 'secondary'} className="shrink-0 ml-2">
                {club.type === 'COMPETITIVE' ? <Shield className="mr-1 h-3 w-3" /> : null}
                {club.type}
              </Badge>
            )}
          </div>
          {club.description && (
            <CardDescription className="line-clamp-2">{club.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {club.joinMode && (
              <Badge variant="outline" className="text-xs">
                {club.joinMode === 'INVITE_ONLY' ? 'Invite Only' : 'Open to Apply'}
              </Badge>
            )}
            {club.levelsAccepted && club.levelsAccepted.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {club.levelsAccepted.join(', ')}
              </Badge>
            )}
            {club.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />Location set
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
