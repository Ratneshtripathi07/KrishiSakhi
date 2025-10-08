"use client";

import { useEffect, useState } from 'react';
import { fetchStates, fetchCities, fetchConstituencies } from '@/services/locationService';
import { useI18n } from '@/lib/i18n';
import { label } from '@/lib/labels';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import Label from '@/components/ui/label';

export default function UserSubmissionPage() {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [constituency, setConstituency] = useState('');
  const [gp, setGp] = useState('');

  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [constituencies, setConstituencies] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const s = await fetchStates();
      setStates(s);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const c = await fetchCities(state || undefined);
      setCities(c);
      setCity('');
      setConstituency('');
      setConstituencies([]);
    })();
  }, [state]);

  useEffect(() => {
    (async () => {
      const cons = await fetchConstituencies(state || undefined, city || undefined);
      setConstituencies(cons);
      setConstituency('');
    })();
  }, [state, city]);

  const submit = async () => {
    setLoading(true);
    setError(null);
    setOk(false);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone_number: phone,
          state,
          city,
          constituency: constituency || undefined,
          gram_panchayat: gp || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setOk(true);
      setToast(t('location_saved') || 'Location Saved!');
      setTimeout(() => setToast(null), 2000);
      setName(''); setPhone(''); setConstituency(''); setGp('');
    } catch (e: any) {
      setError(e.message || (t('failed_to_submit') || 'Failed to submit'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 relative">
      {toast && (
        <div className="absolute right-4 top-0 mt-2 rounded bg-emerald-600 text-white px-3 py-2 text-sm shadow">
          {toast}
        </div>
      )}
      <h1 className="text-2xl font-semibold tracking-tight">{t('submit_details') || 'Submit Your Details'}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>{t('name') || 'Name'}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>{label(t, 'phone_number', 'Phone number')}</Label>
          <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91XXXXXXXXXX" />
        </div>
        <div>
          <Label>{t('state') || 'State'}</Label>
          <Select value={state} onChange={(e) => setState((e.target as HTMLSelectElement).value)}>
            <option value="">{t('select_state') || 'Select State'}</option>
            {states.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>{t('city') || 'City'}</Label>
          <Select value={city} onChange={(e) => setCity((e.target as HTMLSelectElement).value)}>
            <option value="">{t('select_city') || 'Select City'}</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>{t('constituency') || 'Constituency'}</Label>
          <Select value={constituency} onChange={(e) => setConstituency((e.target as HTMLSelectElement).value)} disabled={!state || !city}>
            <option value="">{t('select_constituency') || 'Select Constituency'}</option>
            {constituencies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>{t('gram_panchayat') || 'Gram Panchayat'}</Label>
          <Input value={gp} onChange={(e) => setGp(e.target.value)} />
        </div>
      </div>
      <Button onClick={submit} disabled={loading || !name || !phone}>
        {loading ? (t('submitting') || 'Submitting…') : (t('submit') || 'Submit')}
      </Button>
      {ok && <p className="text-green-700" aria-live="polite">{t('submitted_success') || 'Submitted successfully.'}</p>}
      {error && <p className="text-red-600" aria-live="assertive">{error}</p>}
    </div>
  );
}
