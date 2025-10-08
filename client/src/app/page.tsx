"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useI18n } from '@/lib/i18n';
import { label } from '@/lib/labels';
import Image from 'next/image';
import Button from '@/components/ui/button';
import { Cloud, Bug, LineChart, MessageSquare, LogIn, ShieldCheck, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import Footer from '@/components/Footer';

// Full-bleed helper: make a section span the full viewport width even inside a centered layout
function FullBleed({ children }: { children: ReactNode }) {
  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
      {children}
    </div>
  );
}

function Carousel() {
  const slides = [
    '/images/banner.jpg',
    '/images/banner1.jpg',
    '/images/banner2.jpg',
  ];
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Auto-advance every 1000ms as requested
    timerRef.current = window.setInterval(() => {
      setIdx((i) => (i + 1) % slides.length);
    }, 2600);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [slides.length]);

  const prev = () => setIdx((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIdx((i) => (i + 1) % slides.length);

  return (
    <div className="relative h-[46vw] max-h-[520px] min-h-[220px] overflow-hidden">
      {slides.map((src, i) => (
        <a
          key={i}
          href="https://pmfby.gov.in/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open PMFBY website"
          className={`absolute inset-0 block transition-opacity duration-700 ease-in-out z-0 ${i === idx ? 'opacity-100' : 'opacity-0'}`}
        >
          <Image
            src={src}
            alt="Banner"
            fill
            sizes="100vw"
            className="object-cover"
            priority={i === 0}
            quality={90}
          />
        </a>
      ))}
      {/* Prev/Next Controls */}
      <button aria-label="Previous" onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white dark:bg-[#121212]/80 dark:hover:bg-[#1E1E1E] p-2 shadow transition-colors z-10">
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button aria-label="Next" onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white dark:bg-[#121212]/80 dark:hover:bg-[#1E1E1E] p-2 shadow transition-colors z-10">
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
}

export default function Page() {
  const { t } = useI18n();

  // Weather preview (current only: temp/humidity/wind/desc)
  const [weather, setWeather] = useState<any | null>(null);
  useEffect(() => {
    const load = async () => {
      try {
        let url = '/api/weather';
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (p) => {
              try {
                const r = await fetch(`${url}?lat=${p.coords.latitude}&lon=${p.coords.longitude}`);
                if (r.ok) setWeather(await r.json());
              } catch {}
            },
            async () => {
              try {
                const r = await fetch(`${url}?state=KERALA&city=KANNUR`);
                if (r.ok) setWeather(await r.json());
              } catch {}
            },
            { enableHighAccuracy: true, maximumAge: 60_000 }
          );
        } else {
          const r = await fetch(`${url}?state=KERALA&city=KANNUR`);
          if (r.ok) setWeather(await r.json());
        }
      } catch {}
    };
    load();
  }, []);

  // Market preview: show last price + arrow vs previous
  const [price, setPrice] = useState<{ curr?: number; prev?: number } | null>(null);
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/market/trends?crop=${encodeURIComponent('Rice')}&state=KERALA&city=KANNUR`);
        if (!res.ok) return;
        const j = await res.json();
        const pts = Array.isArray(j.points) ? j.points : [];
        const last = pts[pts.length - 1];
        const prev = pts[pts.length - 2];
        setPrice({ curr: last?.avgPrice, prev: prev?.avgPrice });
      } catch {}
    };
    load();
  }, []);

  const delta = useMemo(() => {
    if (!price?.curr || !price?.prev || !(price.prev > 0)) return undefined;
    return ((price.curr - price.prev) / price.prev) * 100;
  }, [price]);

  return (
    <>
    <section className="py-0">
      {/* Full-width carousel banner */}
      <FullBleed>
        <Carousel />
      </FullBleed>

      {/* Feature grid */}
      <FullBleed>
        <div className="px-4 pt-6 pb-4">
          <div id="features" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {/* Weather card: concise current conditions */}
            <a href="/weather" className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-emerald-50 to-white dark:bg-[#1E1E1E] dark:border-gray-800 dark:bg-none p-6 md:p-7 lg:p-8 min-h-[160px] transition-all duration-500 ease-out hover:-translate-y-0.5 hover:shadow-2xl">
              <div className="flex items-start gap-4">
                <Cloud className="w-9 h-9 text-emerald-700" />
                <div>
                  <h3 className="text-lg font-semibold">{t('weather') || 'Weather'}</h3>
                  <div className="mt-1 text-sm text-gray-700 dark:text-gray-300 space-y-0.5">
                    <div>{t('location') || 'Location'}: {weather?.lat && weather?.lon ? `${weather.lat.toFixed?.(2)}, ${weather.lon.toFixed?.(2)}` : '—'}</div>
                    <div>{t('temp') || 'Temp'}: {Number.isFinite(weather?.current?.temp) ? `${Math.round(weather.current.temp)}°` : '—'}</div>
                    <div>{t('humidity') || 'Humidity'}: {Number.isFinite(weather?.current?.humidity) ? `${Math.round(weather.current.humidity)}%` : '—'}</div>
                    <div>{t('wind') || 'Wind'}: {Number.isFinite(weather?.current?.wind_speed) ? Math.round(weather.current.wind_speed) : '—'}</div>
                  </div>
                </div>
              </div>
            </a>

            {/* Pest check card with CTA */}
            <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-rose-50 to-white dark:bg-[#1E1E1E] dark:border-gray-800 dark:bg-none p-6 md:p-7 lg:p-8 min-h-[160px] transition-all duration-500 ease-out hover:-translate-y-0.5 hover:shadow-2xl">
              <div className="flex items-start gap-4 h-full">
                <Bug className="w-9 h-9 text-emerald-700" />
                <div className="flex-1 flex flex-col min-w-0">
<h3 className="text-lg font-semibold truncate" title={label(t, 'pest_check')}>{label(t, 'pest_check')}</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{label(t, 'analyze_title', 'Analyze crop image for issues')}</p>
                  <div className="mt-auto pt-3">
                    <Button href="/pest-detection" variant="outline" size="sm" className="w-max">{label(t, 'analyze_button', 'Analyze image')}</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Market trends preview with delta */}
            <a href="/market-trends" className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-sky-50 to-white dark:bg-[#1E1E1E] dark:border-gray-800 dark:bg-none p-6 md:p-7 lg:p-8 min-h-[160px] transition-all duration-500 ease-out hover:-translate-y-0.5 hover:shadow-2xl">
              <div className="flex items-start gap-4">
                <LineChart className="w-9 h-9 text-emerald-700" />
                <div className="flex-1">
<h3 className="text-lg font-semibold">{label(t, 'market_trends')}</h3>
                  <div className="mt-1 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span>Rice:</span>
                    <span className="font-medium">{Number.isFinite(price?.curr) ? `${Math.round(price!.curr!)} ₹` : '—'}</span>
                    {typeof delta === 'number' ? (
                      <span className="inline-flex items-center gap-1 text-xs">
                        {delta > 0 ? <ArrowUpRight className="w-4 h-4 text-emerald-700" /> : delta < 0 ? <ArrowDownRight className="w-4 h-4 text-red-700" /> : <Minus className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                        <span className={delta > 0 ? 'text-emerald-700' : delta < 0 ? 'text-red-700' : 'text-gray-600 dark:text-gray-400'}>{`${Math.abs(Math.round(delta))}%`}</span>
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </a>

            {/* Chat */}
            <a href="/chat" className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-amber-50 to-white dark:bg-[#1E1E1E] dark:border-gray-800 dark:bg-none p-6 md:p-7 lg:p-8 min-h-[160px] transition-all duration-500 ease-out hover:-translate-y-0.5 hover:shadow-2xl">
              <div className="flex items-start gap-4">
                <MessageSquare className="w-9 h-9 text-emerald-700" />
                <div>
<h3 className="text-lg font-semibold">{label(t, 'ask_question')}</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Get simple answers and advisories.</p>
                </div>
              </div>
            </a>

            {/* Farmer Login */}
            <a href="/auth/login" className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-emerald-100 to-white dark:bg-[#1E1E1E] dark:border-gray-800 dark:bg-none p-6 md:p-7 lg:p-8 min-h-[160px] transition-all duration-500 ease-out hover:-translate-y-0.5 hover:shadow-2xl">
              <div className="flex items-start gap-4">
                <LogIn className="w-9 h-9 text-emerald-700" />
                <div>
<h3 className="text-lg font-semibold">{label(t, 'get_started')}</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Access your dashboard and personalized advisories.</p>
                </div>
              </div>
            </a>

            {/* Admin Login (still accessible here; header hides on mobile) */}
            <a href="/admin/login" className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-gray-50 to-white dark:bg-[#1E1E1E] dark:border-gray-800 dark:bg-none p-6 md:p-7 lg:p-8 min-h-[160px] transition-all duration-500 ease-out hover:-translate-y-0.5 hover:shadow-2xl">
              <div className="flex items-start gap-4">
                <ShieldCheck className="w-9 h-9 text-emerald-700" />
                <div>
                  <h3 className="text-lg font-semibold">{label(t, 'for_officers', 'For officers')}</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Access admin tools and geo analytics.</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </FullBleed>
    </section>
    <FullBleed>
      <Footer />
    </FullBleed>
  </>
  );
}
