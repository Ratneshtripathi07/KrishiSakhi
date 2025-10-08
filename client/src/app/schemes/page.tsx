"use client";

import { useEffect, useState } from 'react';
import { getSchemes, type Scheme } from '@/services/schemesService';

export default function SchemesPage() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);

  useEffect(() => { (async () => { try { const { schemes } = await getSchemes(); setSchemes(schemes); } catch {} })(); }, []);

  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-[#F1F5F9]">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-semibold mb-4">Government Schemes</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {schemes.map((s, i) => (
            <div key={s.id} className={`rounded-2xl border p-4 shadow-sm hover:shadow transition-all ${i % 3 === 0 ? 'bg-emerald-50' : i % 3 === 1 ? 'bg-amber-50' : 'bg-sky-50'}`}>
              <div className="text-lg font-semibold">{s.title}</div>
              {s.description && <div className="text-sm text-gray-700 mt-1">{s.description}</div>}
              {s.eligibility && <div className="text-xs text-gray-600 mt-1"><span className="font-medium">Eligibility:</span> {s.eligibility}</div>}
              <div className="text-xs text-gray-600 mt-1">{s.start_date ? `From ${new Date(s.start_date).toLocaleDateString()}` : ''} {s.end_date ? `to ${new Date(s.end_date).toLocaleDateString()}` : ''}</div>
              {s.link && <a href={s.link} target="_blank" rel="noreferrer" className="inline-block mt-2 text-sm text-emerald-700 hover:underline">Open Details</a>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
