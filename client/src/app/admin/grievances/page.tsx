"use client";

import { useEffect, useState } from 'react';
import { adminListGrievances, adminUpdateGrievance } from '@/services/grievancesService';
import { prettifyKey } from '@/lib/labels';

export default function AdminGrievancesPage() {
  const [list, setList] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try { const { grievances } = await adminListGrievances(); setList(grievances); } catch (e: any) { setError(e.message || 'Failed'); }
  };
  useEffect(() => { load(); }, []);

  const update = async (id: number, status: 'open' | 'in_progress' | 'resolved') => {
    try { await adminUpdateGrievance(id, status); await load(); } catch (e) {}
  };

  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-[#F1F5F9]">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-semibold mb-4">Admin: Grievances</h1>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.map((g) => (
            <div key={g.id} className="rounded-2xl bg-white shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">{g.title}</div>
                <select className="rounded-md border px-2 py-1 text-sm" value={g.status} onChange={(e) => update(g.id, e.target.value as any)}>
                  <option value="open">{prettifyKey('open')}</option>
                  <option value="in_progress">{prettifyKey('in_progress')}</option>
                  <option value="resolved">{prettifyKey('resolved')}</option>
                </select>
              </div>
              <div className="text-sm text-gray-700 mt-1">{g.description}</div>
              <div className="text-xs text-gray-600 mt-1">Farmer: {g.user?.name || g.user?.phone_number || g.user_id}</div>
              <div className="text-xs text-gray-600">Created: {new Date(g.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
