"use client";

import { useEffect, useMemo, useState } from 'react';
import { fetchStates, fetchCities, fetchConstituencies } from '@/services/locationService';
import { api } from '@/services/api';
import { Bar, Pie } from 'react-chartjs-2';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Map, BarChart3, PieChart } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import Button from '@/components/ui/button';
import Select from '@/components/ui/select';
import Label from '@/components/ui/label';
import CardHeaderTitle from '@/components/ui/card-header-title';
import EmptyState from '@/components/ui/empty-state';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import type { ChartOptions } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function AdminGeoAnalyticsPage() {
  const { t } = useI18n();
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [constituency, setConstituency] = useState('');
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [constituencies, setConstituencies] = useState<string[]>([]);
  const [data, setData] = useState<{ total: number; byState: any[]; byCity: any[]; byConstituency: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topN, setTopN] = useState(3);
  const [showState, setShowState] = useState(true);
  const [showCity, setShowCity] = useState(true);

  useEffect(() => {
    (async () => setStates(await fetchStates()))();
  }, []);

  useEffect(() => {
    (async () => setCities(await fetchCities(state || undefined)))();
  }, [state]);

  useEffect(() => {
    (async () => setConstituencies(await fetchConstituencies(state || undefined, city || undefined)))();
  }, [state, city]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/geo-analytics', { params: { state: state || undefined, city: city || undefined, constituency: constituency || undefined } });
      setData(res.data);
    } catch (e: any) {
      setError(e.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto reload on filter change (debounced)
  useEffect(() => {
    const id = setTimeout(() => { load(); }, 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, city, constituency]);

  const barState = useMemo(() => {
    const arr = (data?.byState || []).slice().sort((a: any, b: any) => b.count - a.count).slice(0, topN);
    return {
      labels: arr.map((d: any) => d.label),
      datasets: [{ label: t('by_state') || 'By State', data: arr.map((d: any) => d.count), backgroundColor: '#16a34a' }],
    };
  }, [data, topN, t]);

  const barCity = useMemo(() => {
    const arr = (data?.byCity || []).slice().sort((a: any, b: any) => b.count - a.count).slice(0, topN);
    return {
      labels: arr.map((d: any) => d.label),
      datasets: [{ label: t('by_city') || 'By City', data: arr.map((d: any) => d.count), backgroundColor: '#22c55e' }],
    };
  }, [data, topN, t]);

  const pieConstituency = useMemo(() => ({
    labels: (data?.byConstituency || []).map((d: any) => d.label),
    datasets: [{ label: 'By Constituency', data: (data?.byConstituency || []).map((d: any) => d.count), backgroundColor: ['#16a34a', '#22c55e', '#86efac', '#15803d', '#65a30d'] }],
  }), [data]);

  const pieOptions: ChartOptions<'pie'> = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { enabled: true },
    },
  }), []);

  const topStates = useMemo(() => {
    const arr = (data?.byState || []).filter((x: any) => x && x.label).slice();
    arr.sort((a: any, b: any) => b.count - a.count);
    return arr.slice(0, topN);
  }, [data, topN]);
  const topCities = useMemo(() => {
    const arr = (data?.byCity || []).filter((x: any) => x && x.label).slice();
    arr.sort((a: any, b: any) => b.count - a.count);
    return arr.slice(0, topN);
  }, [data, topN]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t('geo_analytics') || 'Geo Analytics'}</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2"><Map className="w-5 h-5 text-emerald-700" /><CardTitle>{t('filters') || 'Filters'}</CardTitle></div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-3 items-end">
            <div>
              <Label title="Filter users by state">{t('state') || 'State'}</Label>
              <Select value={state} onChange={(e) => setState((e.target as HTMLSelectElement).value)} title="Select a state">
                <option value="">{t('all') || 'All'}</option>
                {states.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label title="Filter within the selected state">{t('city') || 'City'}</Label>
              <Select value={city} onChange={(e) => setCity((e.target as HTMLSelectElement).value)} title="Select a city">
                <option value="">{t('all') || 'All'}</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label title="Filter within the selected city">{t('constituency') || 'Constituency'}</Label>
              <Select value={constituency} onChange={(e) => setConstituency((e.target as HTMLSelectElement).value)} title="Select a constituency">
                <option value="">{t('all') || 'All'}</option>
                {constituencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
            <Button onClick={load}>{t('apply_filters') || 'Apply Filters'}</Button>
          </div>
          {error && <p className="text-red-600 mt-2">{error}</p>}
          {loading && (
            <div className="mt-2">
              <div className="rounded-md border p-4"><div className="h-48 animate-pulse bg-gray-200 rounded-md" /></div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-md border p-4"><div className="h-48 animate-pulse bg-gray-200 rounded-md" /></div>
                <div className="rounded-md border p-4"><div className="h-48 animate-pulse bg-gray-200 rounded-md" /></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {data && (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Counts of users by state and city">
              <CardHeaderTitle icon={<BarChart3 className="w-5 h-5 text-emerald-700" aria-hidden="true" />} title={t('distribution') || 'Distribution'} />
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex items-center gap-4 text-sm">
                <label className="inline-flex items-center gap-1" title="Toggle state chart">
                  <input type="checkbox" checked={showState} onChange={(e) => setShowState(e.target.checked)} /> {t('state') || 'State'}
                </label>
                <label className="inline-flex items-center gap-1" title="Toggle city chart">
                  <input type="checkbox" checked={showCity} onChange={(e) => setShowCity(e.target.checked)} /> {t('city') || 'City'}
                </label>
                <label className="inline-flex items-center gap-2" title="Show top N in summary lists below">
                  {t('top_n') || 'Top N'}
                  <input type="number" min={1} max={10} value={topN} onChange={(e) => setTopN(Math.max(1, Math.min(10, Number(e.target.value) || 1)))} className="w-16 rounded border px-2 py-1" />
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {showState && (
                  <div className="rounded-md border p-4">
                    {(data?.byState || []).length === 0 ? (
                      <EmptyState title={t('no_items_yet') || 'No items yet.'} />
                    ) : (
                      <Bar data={barState} />
                    )}
                  </div>
                )}
                {showCity && (
                  <div className="rounded-md border p-4">
                    {(data?.byCity || []).length === 0 ? (
                      <EmptyState title={t('no_items_yet') || 'No items yet.'} />
                    ) : (
                      <Bar data={barCity} />
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader title="Users grouped by constituency">
              <CardHeaderTitle icon={<PieChart className="w-5 h-5 text-emerald-700" aria-hidden="true" />} title={t('by_constituency') || 'By Constituency'} />
            </CardHeader>
            <CardContent>
              {(data?.byConstituency || []).length === 0 ? (
                <EmptyState title={t('no_items_yet') || 'No items yet.'} />
              ) : (
                <div className="rounded-md border p-4">
                  <div style={{ height: 320 }}>
                    <Pie data={pieConstituency} options={pieOptions} />
                  </div>
                </div>
              )}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="font-medium text-gray-700">{t('top_states') || 'Top States'}</div>
                  {topStates.length === 0 ? (
                    <EmptyState title={t('no_items_yet') || 'No items yet.'} />
                  ) : (
                    <ul className="list-disc pl-5 text-gray-700">
                      {topStates.map((s: any, i: number) => (<li key={i}>{s.label} — {s.count}</li>))}
                    </ul>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-700">{t('top_cities') || 'Top Cities'}</div>
                  {topCities.length === 0 ? (
                    <EmptyState title={t('no_items_yet') || 'No items yet.'} />
                  ) : (
                    <ul className="list-disc pl-5 text-gray-700">
                      {topCities.map((c: any, i: number) => (<li key={i}>{c.label} — {c.count}</li>))}
                    </ul>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
