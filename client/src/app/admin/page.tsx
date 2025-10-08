"use client";

import { useEffect, useState } from 'react';
import { getAdminStats, getWeeklyIssues, broadcastAdvisory, type AdminStats, type WeeklyIssue } from '@/services/adminService';
import { clearAuthToken, TOKEN_KEY } from '@/services/api';
import { fetchStates, fetchCities, fetchConstituencies } from '@/services/locationService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart3, Megaphone, Map } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import Button from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import CardHeaderTitle from '@/components/ui/card-header-title';

export default function AdminDashboardPage() {
  const { t } = useI18n();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [issues, setIssues] = useState<WeeklyIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [deliveries, setDeliveries] = useState<number | null>(null);

  // Broadcast filters
  const [bState, setBState] = useState('');
  const [bCity, setBCity] = useState('');
  const [bConstituency, setBConstituency] = useState('');
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [constituencies, setConstituencies] = useState<string[]>([]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    if (!token) {
      window.location.href = '/admin/login';
      return;
    }
    (async () => {
      try {
        const [s, w] = await Promise.all([getAdminStats(), getWeeklyIssues()]);
        setStats(s);
        setIssues(Array.isArray(w?.issues) ? w.issues : []);
        // Load broadcast filter options
        const st = await fetchStates();
        setStates(st);
      } catch (e: any) {
        setError(e.message || 'Failed to load admin data');
        const status = (e as any)?.status;
        if (status === 401 || status === 403) {
          window.location.href = '/admin/login';
          return;
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const cs = await fetchCities(bState || undefined);
      setCities(cs);
      setBCity('');
      setBConstituency('');
      setConstituencies([]);
    })();
  }, [bState]);

  useEffect(() => {
    (async () => {
      const cons = await fetchConstituencies(bState || undefined, bCity || undefined);
      setConstituencies(cons);
      setBConstituency('');
    })();
  }, [bState, bCity]);

  const onBroadcast = async () => {
    setDeliveries(null);
    setError(null);
    try {
      const res = await broadcastAdvisory(message, 'ADMIN_BROADCAST', {
        state: bState || undefined,
        city: bCity || undefined,
        constituency: bConstituency || undefined,
      });
      setDeliveries(res.delivered);
      setMessage('');
    } catch (e: any) {
      setError(e.message || 'Failed to broadcast');
    }
  };

  const onLogout = () => {
    clearAuthToken();
    window.location.href = '/admin/login';
  };

  if (loading) return <div className="max-w-4xl mx-auto">{t('loading_dashboard') || 'Loading dashboard…'}</div>;
  
  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-[#F1F5F9]">
      <div className="grid grid-cols-12 gap-4 px-4 py-6">
        {/* Sidebar */}
        <aside className="hidden md:block col-span-3 xl:col-span-2 md:sticky md:top-0 self-start">
          <div className="h-screen">
            <div className="border-r bg-white/95 shadow-sm h-full">
              <nav className="p-3 h-full overflow-y-auto">
                <ul className="space-y-1">
                  <li><a href="/admin/grievances" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-emerald-50 hover:text-emerald-800 transition-colors"><span>📄</span><span>Farmer's Grievances</span></a></li>
                  <li><a href="/admin/geo" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-emerald-50 hover:text-emerald-800 transition-colors"><span>🗺️</span><span>GeoAnalytics</span></a></li>
                  <li><a href="/admin/schemes" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-emerald-50 hover:text-emerald-800 transition-colors"><span>🏷️</span><span>Schemes</span></a></li>
                </ul>
              </nav>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="col-span-12 md:col-span-9 xl:col-span-10 space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">{t('admin_dashboard') || 'Admin Dashboard'}</h1>
            <div className="flex items-center gap-3">
              <Button href="/admin/geo" variant="outline" size="sm" className="inline-flex items-center gap-1"><Map className="w-4 h-4" /> {t('geo_analytics') || 'Geo Analytics'}</Button>
            </div>
          </div>

      {error && <p className="text-red-600">{error}</p>}

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent>
              <p className="text-sm text-gray-600">{t('registered_farmers') || 'Registered Farmers'}</p>
              <p className="text-2xl font-semibold">{stats.users}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-sm text-gray-600">{t('farms') || 'Farms'}</p>
              <p className="text-2xl font-semibold">{stats.farms}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-sm text-gray-600">{t('active_crop_cycles') || 'Active Crop Cycles'}</p>
              <p className="text-2xl font-semibold">{stats.cycles}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardHeaderTitle icon={<BarChart3 className="w-5 h-5 text-emerald-700" />} title={t('weekly_issues_last7') || 'Weekly Issues (last 7 days)'} />
        </CardHeader>
        <CardContent>
          {(issues?.length ?? 0) === 0 ? (
<EmptyState title={t('no_recent_issues') || 'No recent issues logged.'} icon={<BarChart3 className="w-4 h-4 text-emerald-700" />} />
          ) : (
<ul className="list-disc pl-6 text-sm text-gray-700">
              {issues.map((i, idx) => (
                <li key={idx} className="flex justify-between"><span>{i.type}</span><span className="font-medium">{i.count}</span></li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

          <Card>
            <CardHeader>
              <CardHeaderTitle icon={<Megaphone className="w-5 h-5 text-emerald-700" />} title={t('broadcast_advisory') || 'Broadcast Advisory'} />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{t('send_short_advisory_note') || 'Send a short advisory. Optionally target by location.'}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium">{t('state') || 'State'}</label>
              <select value={bState} onChange={(e) => setBState(e.target.value)} className="w-full rounded-md border px-3 py-2">
                <option value="">{t('all') || 'All'}</option>
                {states.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">{t('city') || 'City'}</label>
              <select value={bCity} onChange={(e) => setBCity(e.target.value)} className="w-full rounded-md border px-3 py-2">
                <option value="">{t('all') || 'All'}</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">{t('constituency') || 'Constituency'}</label>
              <select value={bConstituency} onChange={(e) => setBConstituency(e.target.value)} className="w-full rounded-md border px-3 py-2">
                <option value="">{t('all') || 'All'}</option>
                {constituencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="w-full rounded-md border px-3 py-2" rows={3} placeholder={t('advisory_placeholder') || 'e.g., Heavy rain expected in next 24h. Avoid spraying.'} />
          <div className="mt-2">
            <Button onClick={onBroadcast} disabled={!message.trim()}>{t('send_broadcast') || 'Send Broadcast'}</Button>
          </div>
              {deliveries !== null && (
                <p className="text-green-700 text-sm">{(t('delivered_to') || 'Delivered to')} {deliveries} {(t('users') || 'users')}.</p>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
