'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth as authApi, ApiError, type RegisterBody } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhoneInput } from '@/components/phone-input';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, Phone, User, ShieldCheck, Loader2 } from 'lucide-react';

const STEPS = [
  { id: 'phone', label: 'Phone', icon: Phone },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'verify', label: 'Verify', icon: ShieldCheck },
] as const;

type Step = typeof STEPS[number]['id'];

const E164_REGEX = /^\+[1-9]\d{6,14}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState<Step>('phone');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<RegisterBody>({ phone: '', language: 'en' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // OTP state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const [otpExpiry, setOtpExpiry] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // OTP expiry timer
  useEffect(() => {
    if (otpExpiry <= 0) return;
    const t = setTimeout(() => setOtpExpiry(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpExpiry]);

  const stepIndex = STEPS.findIndex(s => s.id === step);

  // ─── Validation ───
  const validatePhone = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!E164_REGEX.test(form.phone.trim())) {
      newErrors.phone = 'Must be E.164 format (e.g., +1234567890)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form.phone]);

  const validateProfile = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!form.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (form.email && !EMAIL_REGEX.test(form.email)) {
      newErrors.email = 'Invalid email format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form.firstName, form.lastName, form.email]);

  // ─── Step 1: Phone → Check & proceed ───
  const handlePhoneNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone()) return;
    setStep('profile');
  };

  // ─── Step 2: Profile → Register & send OTP ───
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfile()) return;
    setLoading(true);
    try {
      // Register user
      await authApi.register({ ...form, phone: form.phone.trim() });
      toast.success('Account created!');

      // Immediately request OTP
      try {
        await authApi.requestOtp(form.phone.trim());
        toast.info('Verification code sent to your phone');
        setCountdown(30);
        setOtpExpiry(300);
      } catch {
        toast.info('Account created. Please request OTP manually.');
      }

      setStep('verify');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          const msg = err.message.toLowerCase();
          if (msg.includes('phone')) {
            setErrors({ phone: 'This phone number is already registered' });
            setStep('phone');
            toast.error('Phone number already registered. Try logging in instead.');
          } else if (msg.includes('email')) {
            setErrors({ email: 'This email is already in use' });
            toast.error('Email already in use by another account');
          } else {
            toast.error(err.message);
          }
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 3: OTP Verify → Login ───
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    if (value.length > 1) {
      // Handle paste
      const chars = value.slice(0, 6).split('');
      chars.forEach((c, i) => {
        if (index + i < 6) newDigits[index + i] = c;
      });
      setOtpDigits(newDigits);
      const focusIdx = Math.min(index + chars.length, 5);
      inputRefs.current[focusIdx]?.focus();
    } else {
      newDigits[index] = value;
      setOtpDigits(newDigits);
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (code.length !== 6) {
      toast.error('Please enter the full 6-digit code');
      return;
    }
    setLoading(true);
    try {
      await login(form.phone.trim(), code);
      toast.success('Welcome to BadBuddy!');
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.message.toLowerCase().includes('expired')) {
          toast.error('Code expired. Please request a new one.');
          setOtpExpiry(0);
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error('Verification failed');
      }
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await authApi.requestOtp(form.phone.trim());
      setCountdown(30);
      setOtpExpiry(300);
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      toast.success('New code sent!');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to resend code');
    }
  };

  const formatExpiry = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="space-y-6">
      {/* Step Progress */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === stepIndex;
          const isCompleted = i < stepIndex;
          return (
            <div key={s.id} className="flex items-center gap-2">
              {i > 0 && (
                <div className={`h-px w-8 transition-colors ${isCompleted ? 'bg-primary' : 'bg-border'}`} />
              )}
              <div className={`
                flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all
                ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : ''}
                ${isCompleted ? 'bg-primary/10 text-primary' : ''}
                ${!isActive && !isCompleted ? 'bg-muted text-muted-foreground' : ''}
              `}>
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <Card>
        {/* ─── Step 1: Phone ─── */}
        {step === 'phone' && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
              <CardDescription>Enter your phone number to get started</CardDescription>
            </CardHeader>
            <form onSubmit={handlePhoneNext}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <PhoneInput
                    value={form.phone}
                    onChange={v => { setForm(f => ({ ...f, phone: v })); setErrors({}); }}
                    error={errors.phone}
                    autoFocus
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full">
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/login" className="text-primary hover:underline font-medium">Login</Link>
                </p>
              </CardFooter>
            </form>
          </>
        )}

        {/* ─── Step 2: Profile ─── */}
        {step === 'profile' && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
              <CardDescription>Tell us a bit about yourself</CardDescription>
            </CardHeader>
            <form onSubmit={handleProfileSubmit}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={form.firstName || ''}
                      onChange={e => { setForm(f => ({ ...f, firstName: e.target.value })); setErrors(prev => ({ ...prev, firstName: '' })); }}
                      className={errors.firstName ? 'border-destructive focus-visible:ring-destructive' : ''}
                      autoFocus
                    />
                    {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={form.lastName || ''}
                      onChange={e => { setForm(f => ({ ...f, lastName: e.target.value })); setErrors(prev => ({ ...prev, lastName: '' })); }}
                      className={errors.lastName ? 'border-destructive focus-visible:ring-destructive' : ''}
                    />
                    {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email || ''}
                    onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(prev => ({ ...prev, email: '' })); }}
                    className={errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nickname">Nickname</Label>
                  <Input
                    id="nickname"
                    placeholder="Optional display name"
                    value={form.nickname || ''}
                    onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={form.gender || ''} onValueChange={v => setForm(f => ({ ...f, gender: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select value={form.language || 'en'} onValueChange={v => setForm(f => ({ ...f, language: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="zh-hans">简体中文</SelectItem>
                        <SelectItem value="zh-hant">繁體中文</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={form.dateOfBirth || ''}
                    onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <div className="flex w-full gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep('phone')} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" />Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
                    ) : (
                      <>Create Account <ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </div>
              </CardFooter>
            </form>
          </>
        )}

        {/* ─── Step 3: OTP Verify ─── */}
        {step === 'verify' && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Verify Your Phone</CardTitle>
              <CardDescription>
                We sent a 6-digit code to{' '}
                <span className="font-medium text-foreground">{form.phone}</span>
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleVerify}>
              <CardContent className="space-y-6">
                {/* OTP Input Grid */}
                <div className="flex justify-center gap-2">
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
                      className="h-12 w-12 text-center text-lg font-semibold"
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                {/* Expiry countdown */}
                {otpExpiry > 0 && (
                  <p className="text-center text-xs text-muted-foreground">
                    Code expires in <span className="font-medium text-foreground">{formatExpiry(otpExpiry)}</span>
                  </p>
                )}
                {otpExpiry === 0 && step === 'verify' && (
                  <p className="text-center text-xs text-destructive">Code expired. Please request a new one.</p>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={loading || otpDigits.join('').length !== 6}>
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</>
                  ) : (
                    <><ShieldCheck className="mr-2 h-4 w-4" />Verify & Continue</>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-4 text-sm">
                  <button
                    type="button"
                    className="text-primary hover:underline font-medium disabled:opacity-50 disabled:no-underline"
                    disabled={countdown > 0}
                    onClick={handleResendOtp}
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                  </button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  Wrong number?{' '}
                  <button
                    type="button"
                    onClick={() => { setStep('phone'); setOtpDigits(['', '', '', '', '', '']); setOtpExpiry(0); }}
                    className="text-primary hover:underline font-medium"
                  >
                    Start over
                  </button>
                </p>
              </CardFooter>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
