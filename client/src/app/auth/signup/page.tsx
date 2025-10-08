"use client";

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import FormField from '@/components/ui/form-field';
import { signupFarmer } from '@/services/authService';

export default function SignupPage() {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const onSignup = async () => {
    if (password !== confirm) {
      setError(t('passwords_do_not_match') || 'Passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signupFarmer({ name, phoneNumber, password, email: email || undefined });
      setMessage(t('signup_success') || 'Account created successfully. You can now log in.');
      // Redirect to login after short delay
      setTimeout(() => { window.location.href = '/auth/login'; }, 800);
    } catch (e: any) {
      setError(e.message || (t('signup_failed') || 'Failed to sign up'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-[#F0FDF4]">
      <div className="mx-auto max-w-md min-h-[80vh] flex items-center justify-center py-12 md:py-16">
        <div className="w-full rounded-2xl bg-white shadow-xl border p-6 md:p-8">
          <h1 className="text-2xl font-semibold tracking-tight mb-4">{t('sign_up') || 'Sign Up'}</h1>
          <div className="space-y-3">
            <FormField label={t('farmer_name') || "Farmer's Name"}>
              <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sri. Ramesh" />
            </FormField>
            <FormField label={t('phone_number') || 'Phone Number'} hint="+919876543210">
              <Input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+919876543210" />
            </FormField>
            <FormField label={`${t('email') || 'Email'} (${t('optional') || 'optional'})`}>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </FormField>
            <FormField label={t('create_password') || 'Create Password'}>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </FormField>
            <FormField label={t('confirm_password') || 'Confirm Password'}>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
            </FormField>
            <Button onClick={onSignup} disabled={loading || !name || !phoneNumber || !password || !confirm}>
              {loading ? (t('creating') || 'Creating…') : (t('create_account') || 'Create Account')}
            </Button>
          </div>

          {message && <p className="text-green-700 mt-3" aria-live="polite">{message}</p>}
          {error && <p className="text-red-600 mt-3" aria-live="assertive">{error}</p>}

          <div className="my-6 border-t" />
          <div className="text-sm text-gray-700">
            <span>{t('already_have_account') || 'Already have an account?'}</span>{' '}
            <a href="/auth/login" className="text-brand hover:underline">{t('login') || 'Login'}</a>
          </div>
        </div>
      </div>
    </div>
  );
}
