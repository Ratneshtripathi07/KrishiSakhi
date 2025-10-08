"use client";

import { useEffect, useState } from 'react';
import { requestOtp, login, loginWithPassword } from '@/services/authService';
import { TOKEN_KEY } from '@/services/api';
import { useI18n } from '@/lib/i18n';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import FormField from '@/components/ui/form-field';

export default function LoginPage() {
  const { t } = useI18n();
  const [mode, setMode] = useState<'password-phone' | 'password-email' | 'otp'>('password-phone');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    try {
      const t = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
      if (t) {
        window.location.href = '/dashboard';
      }
    } catch {}
  }, []);

  const onRequestOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      await requestOtp(phoneNumber);
      setMessage(t('otp_sent_note') || 'OTP sent. Enter the code you received (or use 000000 in demo mode).');
      setMode('otp');
    } catch (e: any) {
      setError(e.message || (t('failed_request_otp') || 'Failed to request OTP'));
    } finally {
      setLoading(false);
    }
  };

const onPasswordLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = mode === 'password-email' ? { email, password } : { phoneNumber, password };
      await loginWithPassword(payload);
      try { localStorage.setItem('km_role', 'user'); } catch {}
      setMessage(t('logged_in_success') || 'Logged in successfully.');
      window.location.href = '/dashboard';
    } catch (e: any) {
      setError(e.message || (t('failed_login') || 'Failed to login'));
    } finally {
      setLoading(false);
    }
  };

  const onOtpLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await login(phoneNumber, otp);
      try { localStorage.setItem('km_role', 'user'); } catch {}
      setMessage(t('logged_in_success') || 'Logged in successfully.');
      window.location.href = '/dashboard';
    } catch (e: any) {
      setError(e.message || (t('failed_login') || 'Failed to login'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-[#F0FDF4]">
      <div className="mx-auto max-w-md min-h-[80vh] flex items-center justify-center py-12 md:py-16">
        <div className="w-full rounded-2xl bg-white shadow-xl border p-6 md:p-8">
          <h1 className="text-2xl font-semibold tracking-tight mb-4">{t('login') || 'Login'}</h1>

          {/* Password login (phone or email) */}
          {mode !== 'otp' && (
            <div className="space-y-3">
              {mode === 'password-phone' && (
                <>
                  <FormField label={t('farmer_name') || "Farmer's Name"}>
                    <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sri. Ramesh" />
                  </FormField>
                  <FormField label={t('phone_number') || 'Phone Number'} hint="+919876543210">
                    <Input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+919876543210" />
                  </FormField>
                </>
              )}
              {mode === 'password-email' && (
                <FormField label={t('email') || 'Email'}>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </FormField>
              )}
              <FormField label={t('password') || 'Password'}>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </FormField>
              <Button onClick={onPasswordLogin} disabled={loading || (!password) || (mode==='password-phone' && !phoneNumber) || (mode==='password-email' && !email)}>
                {loading ? (t('verifying') || 'Verifying…') : (t('sign_in') || 'Sign in')}
              </Button>

              <div className="space-y-2 pt-2">
                <Button variant="outline" onClick={() => setMode(mode === 'password-email' ? 'password-phone' : 'password-email')}>
                  {mode === 'password-email' ? (t('sign_in_with_phone') || 'Sign in with Phone') : (t('sign_in_with_email') || 'Sign in with Email')}
                </Button>
                <Button variant="ghost" onClick={() => setMode('otp')}>
                  {t('sign_in_with_otp') || 'Sign in with Phone OTP'}
                </Button>
              </div>
            </div>
          )}

          {/* OTP flow */}
          {mode === 'otp' && (
            <div className="space-y-3">
              <FormField label={t('phone_number') || 'Phone Number'} hint="+919876543210">
                <Input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+919876543210" />
              </FormField>
              <div className="flex gap-2">
                <Button onClick={onRequestOtp} disabled={loading || !phoneNumber}>
                  {loading ? (t('loading') || '…') : (t('send_otp_button') || 'Send OTP')}
                </Button>
                <Button variant="outline" onClick={() => setMode('password-phone')}>{t('back') || 'Back'}</Button>
              </div>
              <FormField label={t('enter_otp') || 'Enter OTP'} hint={t('demo_mode_note') || 'Demo Mode: Use OTP 000000 after requesting.'}>
                <Input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="000000" />
              </FormField>
              <Button onClick={onOtpLogin} disabled={loading || otp.length < 4}>
                {loading ? (t('loading') || '…') : (t('verify_login_button') || 'Verify & Login')}
              </Button>
            </div>
          )}

          {message && <p className="text-green-700 mt-3" aria-live="polite">{message}</p>}
          {error && <p data-testid="error-message" className="text-red-600 mt-3" aria-live="assertive">{error}</p>}

          <div className="my-6 border-t" />
          <div className="text-sm text-gray-700">
            <span>{t('not_registered') || 'Not registered yet?'}</span>{' '}
            <a href="/auth/signup" className="text-brand hover:underline">{t('sign_up') || 'Sign Up'}</a>
          </div>

          <div className="pt-4 border-t mt-6 text-sm text-gray-700">
            <a href="/admin/login" className="text-brand hover:underline">Login/Signup as Admin</a>
          </div>
        </div>
      </div>
    </div>
  );
}
