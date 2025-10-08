"use client";

import { useEffect, useState } from 'react';
import { adminCreateScheme, adminListSchemes, adminDeleteScheme, type Scheme } from '@/services/schemesService';
import Button from '@/components/ui/button';
import { fetchStates, fetchCities, fetchConstituencies } from '@/services/locationService';

export default function AdminSchemesPage() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [targetState, setTargetState] = useState('');
  const [targetCity, setTargetCity] = useState('');
  const [targetConstituency, setTargetConstituency] = useState('');
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [constituencies, setConstituencies] = useState<string[]>([]);
  const [eligibility, setEligibility] = useState('');
  const [link, setLink] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const { schemes } = await adminListSchemes();
      setSchemes(schemes);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => { (async () => setStates(await fetchStates()))(); }, []);
  useEffect(() => { (async () => setCities(await fetchCities(targetState || undefined)))(); }, [targetState]);
  useEffect(() => { (async () => setConstituencies(await fetchConstituencies(targetState || undefined, targetCity || undefined)))(); }, [targetState, targetCity]);

  const submit = async () => {
    try {
      setLoading(true);
      setError(null);
      await adminCreateScheme({ title, description, eligibility, link, start_date: start || undefined, end_date: end || undefined, active, image, target_state: targetState || undefined, target_city: targetCity || undefined, target_constituency: targetConstituency || undefined });
      setTitle(''); setDescription(''); setEligibility(''); setLink(''); setStart(''); setEnd(''); setActive(true);
      await load();
    } catch (e: any) {
      setError(e.message || 'Failed to create');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-[#F1F5F9]">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="text-2xl font-semibold mb-4">Admin: Schemes</h1>
        <div className="rounded-2xl bg-white shadow-sm border p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Title</label>
              <input className="w-full rounded-md border px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Eligibility</label>
              <input className="w-full rounded-md border px-3 py-2" value={eligibility} onChange={(e) => setEligibility(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">Description</label>
              <textarea className="w-full rounded-md border px-3 py-2" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Image (optional)</label>
              <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} className="block w-full" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Target State (optional)</label>
              <select className="w-full rounded-md border px-3 py-2" value={targetState} onChange={(e) => setTargetState(e.target.value)}>
                <option value="">All</option>
                {states.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Target City (optional)</label>
              <select className="w-full rounded-md border px-3 py-2" value={targetCity} onChange={(e) => setTargetCity(e.target.value)}>
                <option value="">All</option>
                {cities.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Target Constituency (optional)</label>
              <select className="w-full rounded-md border px-3 py-2" value={targetConstituency} onChange={(e) => setTargetConstituency(e.target.value)}>
                <option value="">All</option>
                {constituencies.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Link</label>
              <input className="w-full rounded-md border px-3 py-2" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Start Date</label>
              <input type="date" className="w-full rounded-md border px-3 py-2" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">End Date</label>
              <input type="date" className="w-full rounded-md border px-3 py-2" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              <span className="text-sm">Active</span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button onClick={submit} disabled={loading || !title}>{loading ? 'Saving…' : 'Create Scheme'}</Button>
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow-sm border p-4">
          <h2 className="text-lg font-semibold mb-3">Existing Schemes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {schemes.map((s) => (
              <div key={s.id} className="rounded-xl border p-3 bg-emerald-50">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{s.title}</div>
                    {s.description && <div className="text-sm text-gray-700 mt-1">{s.description}</div>}
                    <div className="text-xs text-gray-600 mt-1">{s.eligibility}</div>
                    {s.link && <a className="text-sm text-emerald-700 hover:underline" href={s.link} target="_blank" rel="noreferrer">Open link</a>}
                  </div>
                  <button onClick={async () => { await adminDeleteScheme(s.id); await load(); }} className="text-sm rounded-md border px-2 py-1 hover:bg-red-50">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
