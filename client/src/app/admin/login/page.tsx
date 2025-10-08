"use client";

import { useState } from 'react';
import { adminLoginPassword, adminLoginOtp, isAllowedGovEmail } from '@/services/adminAuthService';
import { useI18n } from '@/lib/i18n';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';

export default function AdminLoginPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setMessage(null);
    if (!isAllowedGovEmail(email)) {
      setError(t('email_domain_not_allowed') || 'Email domain not allowed. Use an official government email.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'password') {
        await adminLoginPassword(email, password);
      } else {
        await adminLoginOtp(email, otp);
      }
      try { localStorage.setItem('km_role', 'admin'); } catch {}
      setMessage(t('admin_logged_in_redirect') || 'Logged in as admin. Redirecting...');
      window.location.href = '/admin';
    } catch (e: any) {
      setError(e.message || (t('login_failed') || 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-[#F0FDF4]">
      <div className="mx-auto max-w-md min-h-[80vh] flex items-center justify-center py-12 md:py-16">
        <div className="w-full rounded-2xl bg-white shadow-xl border p-6 md:p-8">
          <h1 className="text-2xl font-semibold tracking-tight mb-1">{t('admin_login') || 'Admin Login'}</h1>
          <p className="text-gray-600 text-sm mb-4">{t('gov_email_note') || 'Use your official government email (e.g., @kerala.gov.in, @punjab.gov.in, @up.gov.in)'}</p>

          <div className="space-y-3">
            <Label>{t('email') || 'Email'}</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="officer@kerala.gov.in"
            />
          </div>

          <div className="flex gap-3 items-center text-sm mt-4">
            <label className="flex items-center gap-2">
              <input type="radio" name="mode" checked={mode==='password'} onChange={() => setMode('password')} /> {t('password') || 'Password'}
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="mode" checked={mode==='otp'} onChange={() => setMode('otp')} /> {t('otp') || 'OTP'}
            </label>
          </div>

          {mode === 'password' ? (
            <div className="space-y-3 mt-3">
              <Label>{t('password') || 'Password'}</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-3 mt-3">
              <Label>{t('otp') || 'OTP'}</Label>
              <Input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
              />
              <p className="text-xs text-gray-600">{t('admin_otp_demo_note') || 'For the hackathon demo, the admin OTP is 000000 (configured on backend).'}</p>
            </div>
          )}

          <Button className="mt-4" onClick={submit} disabled={loading || !email || (mode==='password' ? !password : !otp)}>
            {loading ? (t('verifying') || 'Verifying…') : (t('login') || 'Login')}
          </Button>

          {message && <p className="text-green-700 mt-3" aria-live="polite">{message}</p>}
          {error && <p className="text-red-600 mt-3" aria-live="assertive">{error}</p>}
        </div>
      </div>
    </div>
  );
}
