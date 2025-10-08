"use client";

import { useEffect, useState } from 'react';
import { createGrievance, listMyGrievances, type Grievance } from '@/services/grievancesService';
import Button from '@/components/ui/button';

export default function GrievancesPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [list, setList] = useState<Grievance[]>([]);

  const load = async () => {
    try { const { grievances } = await listMyGrievances(); setList(grievances); } catch {}
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    try {
      setLoading(true); setError(null);
      await createGrievance({ title, description, category: category || undefined });
      setTitle(''); setDescription(''); setCategory('');
      await load();
    } catch (e: any) { setError(e.message || 'Failed'); } finally { setLoading(false); }
  };

  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-[#F1F5F9]">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="text-2xl font-semibold mb-4">Grievance Redressal</h1>
        <div className="rounded-2xl bg-white shadow-sm border p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">Title</label>
              <input className="w-full rounded-md border px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">Description</label>
              <textarea className="w-full rounded-md border px-3 py-2" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Category</label>
              <input className="w-full rounded-md border px-3 py-2" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="pest/disease/irrigation" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button onClick={submit} disabled={loading || !title || !description}>{loading ? 'Submitting…' : 'Submit Grievance'}</Button>
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow-sm border p-4">
          <h2 className="text-lg font-semibold mb-3">My Grievances</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {list.map((g) => (
              <div key={g.id} className={`rounded-xl border p-3 ${g.status === 'resolved' ? 'bg-emerald-50' : g.status === 'in_progress' ? 'bg-amber-50' : 'bg-sky-50'}`}>
                <div className="font-semibold">{g.title}</div>
                <div className="text-sm text-gray-700 mt-1">{g.description}</div>
                <div className="text-xs text-gray-600 mt-1">Status: {g.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
