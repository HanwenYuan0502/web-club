'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { clubs as clubsApi, ApiError, type CreateClubBody } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL'];

export default function CreateClubPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CreateClubBody>({
    name: '',
    description: '',
    type: 'CASUAL',
    joinMode: 'APPLY_TO_JOIN',
    isAcceptingNewMembers: true,
    levelsAccepted: [],
  });

  const toggleLevel = (level: string) => {
    setForm(f => ({
      ...f,
      levelsAccepted: f.levelsAccepted?.includes(level)
        ? f.levelsAccepted.filter(l => l !== level)
        : [...(f.levelsAccepted || []), level],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = await getToken();
    if (!token) return;
    setLoading(true);
    try {
      const club = await clubsApi.create(token, form);
      toast.success('Club created successfully!');
      router.push(`/clubs/${club.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create club');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" />Back to Dashboard
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Club</CardTitle>
          <CardDescription>Set up your badminton club. You will be the admin.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Club Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                placeholder="e.g., Downtown Smashers"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description || ''}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe your club..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Club Type</Label>
                <Select value={form.type} onValueChange={(v: 'CASUAL' | 'COMPETITIVE') => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASUAL">Casual</SelectItem>
                    <SelectItem value="COMPETITIVE">Competitive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Join Mode</Label>
                <Select value={form.joinMode} onValueChange={(v: 'INVITE_ONLY' | 'APPLY_TO_JOIN') => setForm(f => ({ ...f, joinMode: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APPLY_TO_JOIN">Open to Applications</SelectItem>
                    <SelectItem value="INVITE_ONLY">Invite Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Levels Accepted</Label>
              <div className="flex flex-wrap gap-2">
                {LEVELS.map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => toggleLevel(level)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      form.levelsAccepted?.includes(level)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border hover:bg-muted'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rules">Club Rules</Label>
              <Textarea
                id="rules"
                value={form.rules || ''}
                onChange={e => setForm(f => ({ ...f, rules: e.target.value }))}
                placeholder="Any rules for members..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="memberLimit">Active Member Limit</Label>
              <Input
                id="memberLimit"
                type="number"
                min={1}
                value={form.activeMemberLimit ?? ''}
                onChange={e => setForm(f => ({ ...f, activeMemberLimit: e.target.value ? Number(e.target.value) : null }))}
                placeholder="Leave blank for unlimited"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create Club'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
