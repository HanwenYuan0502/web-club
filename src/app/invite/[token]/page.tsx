'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { invites as invitesApi, ApiError, type InvitePreview } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Badminton } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Users, CheckCircle2, XCircle, LogIn, UserPlus, Shield, ArrowRight } from 'lucide-react';

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

  // Auto-accept on login if redirected from this page
  useEffect(() => {
    if (isAuthenticated && preview && !accepted && !accepting) {
      handleAccept();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, preview]);

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
      const msg = err instanceof ApiError ? err.message : 'Failed to accept invite';
      if (err instanceof ApiError && err.status === 403) {
        toast.error('This invite is for a different user');
      } else {
        toast.error(msg);
      }
    } finally {
      setAccepting(false);
    }
  };

  const redirectUrl = encodeURIComponent(`/invite/${inviteToken}`);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-muted/40 to-primary/5 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground mb-4 animate-pulse">
          <Badminton className="h-5 w-5" />
        </div>
        <p className="text-muted-foreground animate-pulse">Loading invite...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-muted/40 to-primary/5 p-4">
      <Link href="/" className="mb-6 flex items-center gap-2.5 text-xl font-bold tracking-tight">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Badminton className="h-5 w-5" />
        </div>
        <span>BadBuddy</span>
      </Link>

      <div className="w-full max-w-md">
        {error ? (
          <Card className="shadow-lg">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold mb-2">Invalid Invite</h2>
              <p className="text-muted-foreground text-sm">{error}</p>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : accepted ? (
          <Card className="shadow-lg">
            <CardContent className="flex flex-col items-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">You&apos;re In!</h2>
              <p className="text-muted-foreground text-sm">
                You have successfully joined <span className="font-medium text-foreground">{preview?.club?.name || 'the club'}</span>.
              </p>
              <Button className="mt-6" asChild>
                <Link href="/dashboard">Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">You&apos;re Invited!</CardTitle>
              <CardDescription>You&apos;ve been invited to join a badminton club</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {preview?.club && (
                <div className="rounded-xl border bg-muted/30 p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Badminton className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{preview.club.name}</h3>
                      {preview.club.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">{preview.club.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {preview.club.type && (
                      <Badge variant={preview.club.type === 'COMPETITIVE' ? 'default' : 'secondary'} className="text-xs">
                        {preview.club.type === 'COMPETITIVE' && <Shield className="mr-1 h-3 w-3" />}
                        {preview.club.type}
                      </Badge>
                    )}
                    {preview.club.levelsAccepted?.map(l => (
                      <Badge key={l} variant="outline" className="text-xs">{l}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              {isAuthenticated ? (
                <Button className="w-full" size="lg" onClick={handleAccept} disabled={accepting}>
                  {accepting ? 'Joining...' : 'Accept & Join Club'}
                  {!accepting && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              ) : (
                <>
                  <div className="w-full space-y-2">
                    <Button className="w-full" size="lg" asChild>
                      <Link href={`/login?redirect=${redirectUrl}`}>
                        <LogIn className="mr-2 h-4 w-4" />Login & Accept
                      </Link>
                    </Button>
                    <Button className="w-full" variant="outline" size="lg" asChild>
                      <Link href={`/register?redirect=${redirectUrl}`}>
                        <UserPlus className="mr-2 h-4 w-4" />Create Account & Join
                      </Link>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    You need an account to join this club. After logging in, you&apos;ll be automatically redirected back.
                  </p>
                </>
              )}
            </CardFooter>
          </Card>
        )}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">&copy; {new Date().getFullYear()} BadBuddy Club Portal</p>
    </div>
  );
}
