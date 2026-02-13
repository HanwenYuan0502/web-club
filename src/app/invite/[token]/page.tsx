'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { invites as invitesApi, ApiError, type InvitePreview } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Users, CheckCircle2, XCircle } from 'lucide-react';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, getToken } = useAuth();
  const inviteToken = params.token as string;

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await invitesApi.preview(inviteToken);
        setPreview(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Invalid or expired invite link');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [inviteToken]);

  const handleAccept = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/invite/${inviteToken}`);
      return;
    }
    const token = await getToken();
    if (!token) return;
    setAccepting(true);
    try {
      await invitesApi.accept(token, inviteToken);
      setAccepted(true);
      toast.success('Invite accepted!');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to accept invite');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="animate-pulse text-muted-foreground">Loading invite...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        {error ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <XCircle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-bold mb-2">Invalid Invite</h2>
              <p className="text-muted-foreground">{error}</p>
              <Button className="mt-6" asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        ) : accepted ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
              <h2 className="text-xl font-bold mb-2">Invite Accepted!</h2>
              <p className="text-muted-foreground">You have joined {preview?.club?.name || 'the club'}.</p>
              <Button className="mt-6" asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">You&apos;re Invited!</CardTitle>
              <CardDescription>You&apos;ve been invited to join a club</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {preview?.club && (
                <div className="rounded-lg border p-4 space-y-2">
                  <h3 className="font-semibold text-lg">{preview.club.name}</h3>
                  {preview.club.description && (
                    <p className="text-sm text-muted-foreground">{preview.club.description}</p>
                  )}
                  <div className="flex gap-2">
                    {preview.club.type && <Badge variant="secondary">{preview.club.type}</Badge>}
                    {preview.club.levelsAccepted?.map(l => (
                      <Badge key={l} variant="outline" className="text-xs">{l}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button className="w-full" onClick={handleAccept} disabled={accepting}>
                {accepting ? 'Accepting...' : isAuthenticated ? 'Accept Invite' : 'Login to Accept'}
              </Button>
              {!isAuthenticated && (
                <p className="text-xs text-muted-foreground text-center">
                  You need to be logged in to accept this invite.{' '}
                  <Link href="/register" className="text-primary hover:underline">Create an account</Link>
                </p>
              )}
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
