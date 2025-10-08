"use client";

import { useEffect, useMemo, useState } from 'react';
import { fetchStates, fetchCities } from '@/services/locationService';
import { useI18n } from '@/lib/i18n';
import { useFormat } from '@/lib/format';
import VoiceButton from '@/components/voice/VoiceButton';
import { useSpeak } from '@/lib/tts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Select from '@/components/ui/select';
import Button from '@/components/ui/button';
import Label from '@/components/ui/label';
import IconButton from '@/components/ui/icon-button';
import { Volume2 } from 'lucide-react';
import { Cloud, AlertTriangle, Clock, CalendarDays } from 'lucide-react';
import CardHeaderTitle from '@/components/ui/card-header-title';
import { label } from '@/lib/labels';

function useGeolocation() {
  const [pos, setPos] = useState<{ lat?: number; lon?: number }>({});
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => setPos({}),
      { enableHighAccuracy: true, maximumAge: 60_000 },
    );
  }, []);
  return pos;
}

export default function WeatherPage() {
  const { t } = useI18n();
  const { formatNumber, formatDate, formatTime } = useFormat();
  const { speak, speakLines } = useSpeak();
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const geo = useGeolocation();

  useEffect(() => {
    (async () => setStates(await fetchStates()))();
  }, []);

  useEffect(() => {
    (async () => setCities(await fetchCities(state || undefined)))();
  }, [state]);

  const canGeo = useMemo(() => typeof geo.lat === 'number' && typeof geo.lon === 'number', [geo.lat, geo.lon]);

  const load = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      let url = '/api/weather';
      const params = new URLSearchParams();
      if (canGeo) {
        params.set('lat', String(geo.lat));
        params.set('lon', String(geo.lon));
      } else {
        if (state) params.set('state', state);
        if (city) params.set('city', city);
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error((await res.json())?.error || 'Failed to load weather');
      setData(await res.json());
    } catch (e: any) {
      setError(e.message || 'Failed to load weather');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-load if geolocation is available
    if (canGeo) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canGeo]);

  // Compute simple advisories for farmers
  type AdvisoryObj = { key: string; text: string; severity: 'info' | 'warning' | 'critical' };
  const [advisories, setAdvisories] = useState<AdvisoryObj[]>([]);

  useEffect(() => {
    (async () => {
      setAdvisories([]);
      try {
        const qs = new URLSearchParams();
        if (canGeo) {
          qs.set('lat', String(geo.lat));
          qs.set('lon', String(geo.lon));
        } else {
          if (state) qs.set('state', state);
          if (city) qs.set('city', city);
        }
        const url = `/api/advisory${qs.toString() ? `?${qs.toString()}` : ''}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const arr = Array.isArray(data?.advisories) ? data.advisories : [];
          setAdvisories(arr.map((a: any) => ({ key: a.key, text: a.text, severity: a.severity || 'info' })));
        }
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canGeo, geo.lat, geo.lon, state, city]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{label(t, 'weather')} & {label(t, 'advisories')}</h1>
      <p className="text-gray-600 text-sm">{t('complete_profile_weather')}</p>

      {!canGeo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 items-end">
          <div>
            <Label>State</Label>
            <Select value={state} onChange={(e) => setState((e.target as HTMLSelectElement).value)}>
              <option value="">Select State</option>
              {states.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>City</Label>
            <Select value={city} onChange={(e) => setCity((e.target as HTMLSelectElement).value)}>
              <option value="">Select City</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={load}>{label(t, 'weather')}</Button>
            <VoiceButton onTranscript={async () => { await load(); setTimeout(() => { const lines = advisories.map((a) => a.text); if (lines.length) speakLines(lines); }, 150); }} title={t('voice') || 'Voice'} />
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-3" role="status" aria-live="polite">
          <div className="rounded-md border p-4">
            <div className="h-3 w-24 animate-pulse bg-gray-200 rounded mb-2" />
            <div className="h-4 w-64 animate-pulse bg-gray-200 rounded mb-2" />
            <div className="h-4 w-56 animate-pulse bg-gray-200 rounded" />
          </div>
        </div>
      )}
      {error && <p className="text-red-600" aria-live="assertive">{error}</p>}

      {data && (
        <div className="space-y-4">
          {advisories.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" aria-hidden="true" />
                  <CardTitle>Advisories</CardTitle>
                </div>
                <IconButton aria-label={t('speak') || 'Speak'} title={t('speak') || 'Speak'} onClick={() => { const lines = advisories.map((a) => a.text); if (lines.length) speakLines(lines); }}>
                  <Volume2 className="w-4 h-4" aria-hidden="true" />
                </IconButton>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-800">
                  {advisories.map((a, i) => (
                    <li key={a.key || i} className="flex items-start gap-2">
                      <Badge variant={a.severity === 'critical' ? 'critical' : a.severity === 'warning' ? 'warning' : 'info'}>{label(t, `severity_${a.severity}`, a.severity.replace(/_/g, ' '))}</Badge>
                      <span>{(t(`advisory_${a.key}`) !== `advisory_${a.key}`) ? t(`advisory_${a.key}`) : a.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardHeaderTitle icon={<Cloud className="w-5 h-5 text-emerald-700" aria-hidden="true" />} title="Current" />
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-700">Location: {formatNumber(data.lat, 2)}, {formatNumber(data.lon, 2)} ({data.timezone || '—'})</div>
              <div className="text-sm text-gray-700">Temp: {formatNumber(data.current?.temp)}° | Humidity: {formatNumber(data.current?.humidity)}% | Wind: {formatNumber(data.current?.wind_speed)} m/s</div>
              <div className="text-sm text-gray-700">Conditions: {data.current?.weather?.[0]?.description || '—'}</div>
              <div className="mt-2">
                <Button onClick={() => { const parts = [
                  `Temperature ${formatNumber(data.current?.temp)} degrees`,
                  `Humidity ${formatNumber(data.current?.humidity)} percent`,
                  `Wind ${formatNumber(data.current?.wind_speed)} meters per second`,
                  advisories.length ? `${advisories.length} advisories available` : ''
                ].filter(Boolean) as string[]; speak(parts.join('. ')); }} variant="outline" size="sm" title={t('speak') || 'Speak'}>{t('speak') || 'Speak'}</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardHeaderTitle icon={<Clock className="w-5 h-5 text-emerald-700" aria-hidden="true" />} title="Next 24 hours" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {(data.hourly || []).slice(0, 8).map((h: any, i: number) => (
                  <div key={i} className="rounded border p-2">
                    <div>{formatTime((h.dt || 0) * 1000)}</div>
                    <div>Temp: {formatNumber(h.temp)}°</div>
                    <div>POP: {formatNumber(Math.round((h.pop || 0) * 100))}%</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardHeaderTitle icon={<CalendarDays className="w-5 h-5 text-emerald-700" aria-hidden="true" />} title="Next 3 days" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                {(data.daily || []).slice(0, 3).map((d: any, i: number) => (
                  <div key={i} className="rounded border p-2">
                    <div>{formatDate((d.dt || 0) * 1000)}</div>
                    <div>Day: {formatNumber(d.temp?.day)}° / Night: {formatNumber(d.temp?.night)}°</div>
                    <div>POP: {formatNumber(Math.round((d.pop || 0) * 100))}%</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}