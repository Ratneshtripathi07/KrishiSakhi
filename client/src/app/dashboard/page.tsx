'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { TOKEN_KEY } from '@/services/api';
import { useFormat } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import { label } from '@/lib/labels';
import Button from '@/components/ui/button';
import { api } from '@/services/api';
import { Cloud, Bell, Home, Leaf, LineChart, Bug, MessageSquare, BookOpen, ShoppingCart, Users, AlertCircle, User as UserIcon, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, Minus, Cpu } from 'lucide-react';

// Full-bleed helper so we can extend beyond main's max width
function FullBleed({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
      {children}
    </div>
  );
}

function Carousel() {
  const slides = ['/images/banner.jpg','/images/banner1.jpg','/images/banner2.jpg'];
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    timerRef.current = window.setInterval(() => setIdx((i) => (i + 1) % slides.length), 1800);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [slides.length]);
  const prev = () => setIdx((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIdx((i) => (i + 1) % slides.length);
  return (
    <div className="relative h-[32vw] max-h-[420px] min-h-[180px] overflow-hidden rounded-2xl shadow">
      {slides.map((src, i) => (
        <div key={i} className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${i === idx ? 'opacity-100' : 'opacity-0'}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="Banner" className="w-full h-full object-cover" />
        </div>
      ))}
      <button aria-label="Previous" onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white dark:bg-[#121212]/80 dark:hover:bg-[#1E1E1E] p-2 shadow transition-colors">
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button aria-label="Next" onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white dark:bg-[#121212]/80 dark:hover:bg-[#1E1E1E] p-2 shadow transition-colors">
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useI18n();
  const { formatNumber, formatDate } = useFormat();

  // State
  const [profile, setProfile] = useState<any | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [weather, setWeather] = useState<any | null>(null);
  const [wError, setWError] = useState<string | null>(null);
  const [aError, setAError] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<{ text: string }[]>([]);
  const [schemes, setSchemes] = useState<{ id: number; title: string }[]>([]);
  const [sideOpen, setSideOpen] = useState(false);

  // Market data for major crops
  const crops = ['Rice','Coconut','Banana','Pepper'];
  const [market, setMarket] = useState<Record<string, { curr?: number; prev?: number }>>({});

  // Guard: require auth
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t) window.location.href = '/auth/login';
  }, []);

  // Profile
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/users/me');
        if (data?.user) setProfile(data.user);
      } catch (e) {
        setProfile(null);
      }
    })();
  }, []);

  // Alerts
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/alerts/me');
        setAlerts(Array.isArray(data?.alerts) ? data.alerts.slice(0, 5) : []);
      } catch {
        setAError('Could not load alerts');
      }
    })();
  }, []);

  // Weather
  useEffect(() => {
    let done = false;
    const loadByCoords = async (lat: number, lon: number) => {
      try {
        const r = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
        if (!r.ok) throw new Error();
        setWeather(await r.json());
        setWError(null);
      } catch {
        setWError('Could not load weather');
      }
    };
    const loadByProfile = async (st?: string | null, ct?: string | null) => {
      if (!st || !ct) { setWError(null); setWeather(null); return; }
      try {
        const r = await fetch(`/api/weather?state=${encodeURIComponent(st)}&city=${encodeURIComponent(ct)}`);
        if (!r.ok) throw new Error();
        setWeather(await r.json());
        setWError(null);
      } catch {
        setWError('Could not load weather');
      }
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => { if (!done) { done = true; loadByCoords(p.coords.latitude, p.coords.longitude); } },
        () => { if (!done) { done = true; loadByProfile(profile?.state, profile?.city); } },
        { enableHighAccuracy: true, maximumAge: 60_000 },
      );
    } else {
      loadByProfile(profile?.state, profile?.city);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.state, profile?.city]);

  // Market prices for major crops
  useEffect(() => {
    (async () => {
      try {
        const st = profile?.state || 'KERALA';
        const ct = profile?.city || 'KANNUR';
        const entries = await Promise.all(crops.map(async (crop) => {
          const res = await fetch(`/api/market/trends?crop=${encodeURIComponent(crop)}&state=${encodeURIComponent(st)}&city=${encodeURIComponent(ct)}`);
          if (!res.ok) return [crop, { curr: undefined, prev: undefined }] as const;
          const j = await res.json();
          const pts = Array.isArray(j.points) ? j.points : [];
          const last = pts[pts.length - 1];
          const prev = pts[pts.length - 2];
          return [crop, { curr: last?.avgPrice, prev: prev?.avgPrice }] as const;
        }));
        const next: Record<string, { curr?: number; prev?: number }> = {};
        for (const [c, p] of entries) next[c] = p;
        setMarket(next);
      } catch {}
    })();
  }, [profile?.state, profile?.city]);

  // Advisory list
  useEffect(() => {
    (async () => {
      try {
        const st = profile?.state;
        const ct = profile?.city;
        const params = new URLSearchParams();
        if (st) params.set('state', st);
        if (ct) params.set('city', ct);
        const res = await fetch(`/api/advisory?${params.toString()}`);
        if (!res.ok) return;
        const j = await res.json();
        const items = (j?.advisories || []).slice(0, 5).map((a: any) => ({ text: a.text || a }));
        setTimeline(items);
      } catch {}
    })();
  }, [profile?.state, profile?.city]);

  // Schemes preview for dashboard
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/schemes');
        const s = Array.isArray(data?.schemes) ? data.schemes.slice(0, 3).map((x: any) => ({ id: x.id, title: x.title })) : [];
        setSchemes(s);
      } catch {}
    })();
  }, []);

  const locationText = useMemo(() => {
    if (weather?.lat && weather?.lon) return `${formatNumber(weather.lat, 2)}, ${formatNumber(weather.lon, 2)}`;
    if (profile?.state && profile?.city) return `${profile.state} / ${profile.city}`;
    return '—';
  }, [weather, profile, formatNumber]);

  const welcomeName = useMemo(() => {
    const n = (profile?.name as string | undefined)?.trim?.();
    if (n) return n;
    const pn = (profile?.phone_number as string | undefined)?.trim?.();
    if (pn) return pn;
    return '';
  }, [profile?.name, profile?.phone_number]);

  // Checklist tasks (local state)
  const [tasks, setTasks] = useState([
    { id: 'irrigation', label: 'Irrigation for Field A', done: false },
    { id: 'fertilizer', label: 'Apply urea (recommended dose)', done: false },
    { id: 'weeding', label: 'Weeding near bunds', done: true },
    { id: 'pest', label: 'Inspect for pests', done: false },
  ]);
  const progress = useMemo(() => Math.round((tasks.filter(t => t.done).length / tasks.length) * 100), [tasks]);

  const toggleTask = (id: string) => setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));

  // Reminders (pill bar)
  const reminders = useMemo(() => [
    'Soil moisture check',
    'Next irrigation in 2 days',
    'Pest scout: Brown planthopper',
    'Fertilizer reminder: NPK',
  ], []);

  // Sidebar menu items
  const menu = [
    { href: '/dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
    { href: '/farms', label: 'Farms', icon: <Leaf className="w-5 h-5" /> },
    { href: '/alerts', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
    { href: '/market-trends', label: 'Mandi', icon: <LineChart className="w-5 h-5" /> },
    { href: '/pest-decision', label: 'Pest Control', icon: <Bug className="w-5 h-5" /> },
    { href: '/chat', label: 'AI Chat', icon: <MessageSquare className="w-5 h-5" /> },
    { href: '/schemes', label: 'Schemes', icon: <BookOpen className="w-5 h-5" /> },
    { href: '/buy-sell', label: 'Buy/Sell', icon: <ShoppingCart className="w-5 h-5" /> },
    { href: '/forum', label: 'Forum', icon: <Users className="w-5 h-5" /> },
    { href: '/grievances', label: 'Grievance Redressal', icon: <AlertCircle className="w-5 h-5" /> },
    { href: '/hardware', label: 'Hardware Data', icon: <Cpu className="w-5 h-5" /> },
    { href: '/submit', label: 'My Profile', icon: <UserIcon className="w-5 h-5" /> },
  ];

  const CardWrap = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`group rounded-2xl border bg-white/95 dark:bg-[#1E1E1E]/95 dark:border-gray-800 shadow-sm hover:shadow-2xl transition-all duration-300 ${className}`}>
      {children}
    </div>
  );

  return (
    <FullBleed>
      <div className="grid grid-cols-12 gap-4 px-4 py-6 bg-gradient-to-b from-emerald-50 to-white dark:from-[#0f0f0f] dark:to-[#121212]">
        {/* Mobile top row: hamburger */}
        <div className="col-span-12 md:hidden flex items-center justify-between">
          <button onClick={() => setSideOpen(true)} className="rounded-md border bg-white dark:bg-[#1E1E1E] dark:border-gray-800 px-3 py-1.5 shadow-sm">
            ☰ Menu
          </button>
          <div className="text-lg font-semibold">{t('dashboard_title') || 'Farmer Dashboard'}</div>
        </div>

        {/* Sidebar */}
        <aside className="hidden md:block col-span-3 xl:col-span-2 md:sticky md:top-0 self-start">
          <div className="h-screen">
            <div className="border-r bg-white/95 dark:bg-[#1E1E1E]/95 dark:border-gray-800 shadow-sm h-full">
              <nav className="p-3 h-full overflow-y-auto">
                <ul className="space-y-1">
                  {menu.map((m) => (
                    <li key={m.href}>
                      <a href={m.href} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-800 transition-colors ${typeof window !== 'undefined' && window.location.pathname.startsWith(m.href) ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-300' : 'text-gray-700'}`}>
                        <span className="text-emerald-700">{m.icon}</span>
                        <span>{m.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        </aside>

        {/* Mobile slide-over sidebar */}
        {sideOpen && (
          <div className="md:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/30" onClick={() => setSideOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-[#1E1E1E] shadow-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-semibold">Menu</div>
                <button className="rounded-md border px-2 py-1 dark:border-gray-800" onClick={() => setSideOpen(false)}>Close</button>
              </div>
              <nav>
                <ul className="space-y-1">
                  {menu.map((m) => (
                    <li key={m.href}>
                      <a href={m.href} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-emerald-50 hover:text-emerald-800 transition-colors" onClick={() => setSideOpen(false)}>
                        <span className="text-emerald-700">{m.icon}</span>
                        <span>{m.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="col-span-12 md:col-span-9 xl:col-span-10 space-y-6">
          {/* Carousel */}
          <Carousel />

          {/* Welcome + Reminders */}
          <CardWrap className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold">{welcomeName ? `Hello, ${welcomeName}!` : 'Hello!'} <span className="font-normal">Welcome back!</span></h2>
                <div className="text-sm text-gray-600 dark:text-gray-400">{t('profile_location') || 'Profile location'}: {locationText}</div>
              </div>
              <div className="text-right">
                <a href="/submit" className="text-sm text-emerald-700 hover:underline">{t('update_profile') || 'Update Profile'}</a>
              </div>
            </div>
            {/* Reminders pill bar */}
            <div className="mt-4 flex gap-2 overflow-x-auto">
              {reminders.map((r, i) => (
                <div key={i} className="shrink-0 rounded-full border bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300 px-3 py-1.5 text-xs shadow-sm hover:shadow transition-all">{r}</div>
              ))}
            </div>
          </CardWrap>

          {/* Top Info Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Weather */}
            <CardWrap className="p-5">
              <div className="flex items-start gap-3 mb-2">
                <Cloud className="w-6 h-6 text-emerald-700" />
                <div className="text-lg font-semibold">{t('weather') || 'Weather'}</div>
              </div>
              {!weather && !wError && (!profile?.state || !profile?.city) && (
                <div className="text-sm text-gray-700 dark:text-gray-300">{t('complete_profile_weather') || 'Complete your profile for local weather.'} <a className="text-emerald-700 hover:underline" href="/submit">{t('complete_now') || 'Complete now'}</a></div>
              )}
              {(!weather && !wError && profile?.state && profile?.city) && (
                <div className="space-y-2" role="status" aria-live="polite">
                  <div className="h-4 w-36 animate-pulse bg-gray-200 dark:bg-gray-800 rounded" />
                  <div className="h-4 w-64 animate-pulse bg-gray-200 dark:bg-gray-800 rounded" />
                  <div className="h-4 w-48 animate-pulse bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
              )}
              {wError && <p className="text-sm text-red-600">{wError}</p>}
              {weather && (
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <div>{t('location') || 'Location'}: {locationText}</div>
                  <div>{t('temp') || 'Temp'}: {formatNumber(weather.current?.temp)}° | {t('humidity') || 'Humidity'}: {formatNumber(weather.current?.humidity)}% | {t('wind') || 'Wind'}: {formatNumber(weather.current?.wind_speed)}</div>
                  <div>{t('conditions') || 'Conditions'}: {weather.current?.weather?.[0]?.description || '—'}</div>
                </div>
              )}
            </CardWrap>

            {/* Advisory */}
            <CardWrap className="p-5">
              <div className="flex items-start gap-3 mb-2">
                <Bell className="w-6 h-6 text-amber-700" />
                <div className="text-lg font-semibold">{t('advisory') || 'Advisory'}</div>
              </div>
              {timeline.length === 0 ? (
                <div className="text-sm text-gray-600 dark:text-gray-400">{t('no_items_yet') || 'No items yet.'}</div>
              ) : (
                <div className="text-sm text-gray-800">{timeline[0].text}</div>
              )}
              <div className="mt-3 text-right">
<a href="/chat" className="text-sm text-emerald-700 hover:underline">{label(t, 'ask_question')}</a>
              </div>
            </CardWrap>

            {/* Schemes */}
            <CardWrap className="p-5 bg-emerald-100">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-6 h-6 rounded-full bg-emerald-600" />
                <div className="text-lg font-semibold">{t('schemes') || 'Schemes'}</div>
              </div>
              {schemes.length === 0 ? (
                <div className="text-sm text-gray-700">Latest government schemes for you.</div>
              ) : (
                <ul className="text-sm text-gray-800 list-disc pl-5 space-y-1">
                  {schemes.map((s) => (<li key={s.id}>{s.title}</li>))}
                </ul>
              )}
              <div className="mt-3 text-right">
                <a href="/schemes" className="text-sm text-emerald-700 hover:underline">{t('view_all') || 'View all'}</a>
              </div>
            </CardWrap>
          </div>

          {/* Market section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Market Prices */}
            <CardWrap className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <LineChart className="w-6 h-6 text-emerald-700" />
                <div className="text-lg font-semibold">{t('market_prices') || 'Market Prices'}</div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 dark:text-gray-400">
                      <th className="py-2 pr-4">{t('crop') || 'Crop'}</th>
                      <th className="py-2 pr-4">{t('price') || 'Price'}</th>
                      <th className="py-2">{t('change') || 'Change'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crops.map((c) => {
                      const info = market[c] || {};
                      const curr = info.curr;
                      const prev = info.prev;
                      const delta = (typeof curr === 'number' && typeof prev === 'number' && prev > 0) ? ((curr - prev) / prev) * 100 : undefined;
                      return (
                        <tr key={c} className="border-t">
                          <td className="py-2 pr-4">{c}</td>
                          <td className="py-2 pr-4">{typeof curr === 'number' ? `${Math.round(curr)} ₹` : '—'}</td>
                          <td className="py-2">
                            {typeof delta === 'number' ? (
                              <span className="inline-flex items-center gap-1 text-xs">
                                {delta > 0 ? <ArrowUpRight className="w-4 h-4 text-emerald-700" /> : delta < 0 ? <ArrowDownRight className="w-4 h-4 text-red-700" /> : <Minus className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                                <span className={delta > 0 ? 'text-emerald-700' : delta < 0 ? 'text-red-700' : 'text-gray-600 dark:text-gray-400'}>{`${Math.abs(Math.round(delta))}%`}</span>
                              </span>
                            ) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardWrap>

            {/* Market Advisory */}
            <CardWrap className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <LineChart className="w-6 h-6 text-emerald-700" />
                <div className="text-lg font-semibold">{t('market_advisory') || 'Market Advisory'}</div>
              </div>
              <ul className="list-disc pl-5 text-sm text-gray-800 dark:text-gray-200 space-y-1">
                {crops.map((c) => {
                  const info = market[c] || {};
                  const curr = info.curr; const prev = info.prev;
                  const delta = (typeof curr === 'number' && typeof prev === 'number' && prev > 0) ? ((curr - prev) / prev) * 100 : undefined;
                  let tip = `${c}: `;
                  if (typeof delta === 'number') {
                    tip += delta > 0 ? 'Uptrend. Consider selling small lots.' : delta < 0 ? 'Downtrend. Consider holding.' : 'Stable.';
                  } else {
                    tip += 'No recent data.';
                  }
                  return <li key={c}>{tip}</li>;
                })}
              </ul>
            </CardWrap>
          </div>

          {/* Tasks & Checklist */}
          <CardWrap className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">{t('tasks_checklist') || 'Tasks & Checklist'}</div>
              <div className="text-xs text-gray-600">{progress}% {t('complete') || 'complete'}</div>
            </div>
            <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
              <div className="h-full bg-emerald-600" style={{ width: `${progress}%` }} />
            </div>
            <ul className="mt-4 space-y-2">
              {tasks.map((task) => (
                <li key={task.id} className="rounded-xl border px-3 py-2 flex items-center gap-3 hover:shadow transition-all" style={{ paddingLeft: '20px', paddingRight: '20px' }}>
                  <input id={`task-${task.id}`} type="checkbox" className="w-4 h-4 rounded border-gray-400 dark:border-gray-700 text-emerald-600 focus:ring-emerald-600" checked={task.done} onChange={() => toggleTask(task.id)} />
                  <label htmlFor={`task-${task.id}`} className={`text-sm ${task.done ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>{task.label}</label>
                </li>
              ))}
            </ul>
          </CardWrap>

          {/* Extra actions (kept) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button href="/submit" variant="outline" className="rounded-xl shadow-sm hover:shadow">{t('update_profile') || 'Update Profile'}</Button>
            <Button href="/weather" variant="outline" className="rounded-xl shadow-sm hover:shadow">{t('open_weather') || 'Open Weather'}</Button>
<Button href="/pest-detection" variant="outline" className="rounded-xl shadow-sm hover:shadow">{label(t, 'pest_check')}</Button>
<Button href="/market-trends" variant="outline" className="rounded-xl shadow-sm hover:shadow">{label(t, 'market_trends')}</Button>
<Button href="/chat" variant="outline" className="rounded-xl shadow-sm hover:shadow">{label(t, 'ask_question')}</Button>
            <Button href="/feedback" variant="outline" className="rounded-xl shadow-sm hover:shadow">{t('feedback') || 'Feedback'}</Button>
          </div>
        </main>
      </div>
    </FullBleed>
  );
}
