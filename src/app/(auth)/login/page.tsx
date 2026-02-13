'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { auth as authApi, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/phone-input';
import { toast } from 'sonner';
import { Loader2, ShieldCheck } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuth();

  const [phone, setPhone] = useState(searchParams.get('phone') || '');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const redirect = searchParams.get('redirect') || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) router.replace(redirect);
  }, [isAuthenticated, router, redirect]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.requestOtp(phone);
      setStep('otp');
      setCountdown(30);
      toast.success('OTP sent to your phone');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    if (value.length > 1) {
      const chars = value.slice(0, 6).split('');
      chars.forEach((c, i) => { if (index + i < 6) newDigits[index + i] = c; });
      setOtpDigits(newDigits);
      inputRefs.current[Math.min(index + chars.length, 5)]?.focus();
    } else {
      newDigits[index] = value;
      setOtpDigits(newDigits);
      if (value && index < 5) inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (code.length !== 6) { toast.error('Please enter the full 6-digit code'); return; }
    setLoading(true);
    try {
      await login(phone, code);
      toast.success('Login successful!');
      router.push(redirect);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Invalid OTP');
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        <CardDescription>
          {step === 'phone' ? 'Enter your phone number to login' : 'Enter the OTP code sent to your phone'}
        </CardDescription>
      </CardHeader>

      {step === 'phone' ? (
        <form onSubmit={handleRequestOtp}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <PhoneInput
                value={phone}
                onChange={setPhone}
                autoFocus
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading || !phone}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending OTP...</> : 'Send OTP'}
            </Button>
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary hover:underline font-medium">Register</Link>
            </p>
          </CardFooter>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <CardContent className="space-y-6">
            <div className="flex justify-center gap-1.5 sm:gap-2">
              {otpDigits.map((digit, i) => (
                <Input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  onFocus={e => e.target.select()}
                  className="h-11 w-10 sm:h-12 sm:w-12 text-center text-lg font-semibold p-0"
                  autoFocus={i === 0}
                />
              ))}
            </div>
            <p className="text-xs text-center text-muted-foreground">Check your SMS for the 6-digit code</p>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading || otpDigits.join('').length !== 6}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</>
              ) : (
                <><ShieldCheck className="mr-2 h-4 w-4" />Login</>
              )}
            </Button>
            <div className="flex gap-4 text-sm">
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                onClick={() => { setStep('phone'); setOtpDigits(['', '', '', '', '', '']); }}
              >
                Change number
              </button>
              <button
                type="button"
                className="text-primary hover:underline disabled:opacity-50"
                disabled={countdown > 0 || loading}
                onClick={async () => {
                  try {
                    await authApi.requestOtp(phone);
                    setCountdown(30);
                    setOtpDigits(['', '', '', '', '', '']);
                    inputRefs.current[0]?.focus();
                    toast.success('OTP resent');
                  } catch (err) {
                    toast.error(err instanceof ApiError ? err.message : 'Failed to resend');
                  }
                }}
              >
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
              </button>
            </div>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>}>
      <LoginForm />
    </Suspense>
  );
}
