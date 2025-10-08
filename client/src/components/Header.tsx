'use client';

import { useEffect, useRef, useState } from 'react';
import { TOKEN_KEY, clearAuthToken } from '@/services/api';
import { supportedLocales, useI18n } from '@/lib/i18n';
import { useDataSaver } from '@/lib/dataSaver';
import { useTheme } from '@/lib/theme';
import { Bell, Globe, Sun, Moon, MoreVertical } from 'lucide-react';
import { usePathname } from 'next/navigation';

function LangMenu({ locale, setLocale }: { locale: string; setLocale: (l: any) => void }) {
  const [active, setActive] = useState<number>(() => Math.max(0, supportedLocales.findIndex(l => l.code === locale as any)));
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!containerRef.current) return;
      const n = supportedLocales.length;
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % n); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i - 1 + n) % n); }
      if (e.key === 'Enter') { e.preventDefault(); setLocale(supportedLocales[active].code as any); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, setActive, setLocale]);

  return (
    <div ref={containerRef} className="absolute right-0 mt-2 bg-white dark:bg-[#1E1E1E] border dark:border-gray-700 rounded shadow text-sm min-w-[160px] z-50 py-1 text-gray-900 dark:text-gray-100" role="menu">
      {supportedLocales.map((opt, idx) => (
        <button
          key={opt.code}
          onMouseEnter={() => setActive(idx)}
          onClick={() => setLocale(opt.code as any)}
          className={`block w-full text-left px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-[#222] ${opt.code === locale ? 'text-brand dark:text-brand-light font-medium' : ''} ${idx === active ? 'bg-gray-50 dark:bg-[#222]' : ''}`}
          role="menuitem"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function Header() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const { locale, setLocale, t } = useI18n();
  const { enabled: dataSaver, setEnabled: setDataSaver } = useDataSaver();
  const { mode, toggle } = useTheme();
  const pathname = usePathname() || '/';

  // Language menu UX (click to open/close, close on outside click or Escape)
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!langRef.current) return;
      if (!langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLangOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    try {
      const t = localStorage.getItem(TOKEN_KEY);
      setLoggedIn(!!t);
      setRole(localStorage.getItem('km_role'));
    } catch {}
  }, []);

  const onLogout = () => {
    clearAuthToken();
    window.location.href = '/auth/login';
  };

  const currentLabel = supportedLocales.find((s) => s.code === locale)?.label || (t('language') || 'Language');

  // More/settings popover for Data Saver
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
<header className="sticky top-0 z-50 border-b bg-white/80 dark:bg-[#121212] backdrop-blur">
      <div className="w-full px-3 sm:px-4 md:px-6 py-2 flex items-center justify-between">
        <a href="/" className="inline-flex items-center gap-2">
          {/* Simple agriculture logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-leaf.svg" alt="Krishi Sakhi logo" className="h-7 w-7" />
          <span className="text-lg font-semibold text-brand dark:text-brand-light">Krishi Sakhi</span>
        </a>
        <div className="flex items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6 flex-wrap justify-end">
          {/* Language dropdown */}
<div ref={langRef} className="relative">
            <button onClick={() => setLangOpen((o) => !o)} className="inline-flex items-center gap-1 text-sm text-gray-700 dark:text-gray-200 hover:text-brand dark:hover:text-brand-light" aria-haspopup="menu" aria-expanded={langOpen} title={t('language') || 'Language'}>
              <Globe className="w-4 h-4" aria-hidden="true" /> {currentLabel}
            </button>
            {langOpen && (<LangMenu locale={locale} setLocale={(l) => { setLocale(l); setLangOpen(false); }} />)}
          </div>

          {/* Alerts bell */}
{loggedIn && (
            <a
              href="/alerts"
              className={`relative hover:text-brand dark:hover:text-brand-light ${pathname === '/alerts' ? 'text-brand dark:text-brand-light' : 'text-gray-700 dark:text-gray-200'} hidden sm:inline-flex`}
              title={t('my_alerts') || 'Alerts'}
              aria-label={t('my_alerts') || 'Alerts'}
            >
              <Bell className="w-5 h-5" aria-hidden="true" />
              {/* notification dot */}
              <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-red-500"></span>
            </a>
          )}

          {/* Theme toggle */}
          <button onClick={toggle} className="text-gray-700 dark:text-gray-200 hover:text-brand dark:hover:text-brand-light" aria-label="Toggle theme" title="Toggle theme">
            {mode === 'dark' ? <Sun className="w-5 h-5" aria-hidden="true" /> : <Moon className="w-5 h-5" aria-hidden="true" />}
          </button>

          {/* More menu for Data Saver */}
<div ref={moreRef} className="relative">
            <button onClick={() => setMoreOpen((o) => !o)} className="text-gray-700 dark:text-gray-200 hover:text-brand dark:hover:text-brand-light" aria-haspopup="menu" aria-expanded={moreOpen} title="More">
              <MoreVertical className="w-5 h-5" aria-hidden="true" />
            </button>
            {moreOpen && (
              <div className="absolute right-0 mt-2 bg-white dark:bg-[#1E1E1E] border dark:border-gray-700 rounded shadow text-sm min-w-[180px] z-50 py-1 text-gray-800 dark:text-gray-100">
                <a href="/settings" className="block px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-[#222]">Settings</a>
                <button onClick={() => setDataSaver(!dataSaver)} className="block w-full text-left px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-[#222]">
                  {dataSaver ? (t('data_saver_on') || 'Data Saver: ON') : (t('data_saver_off') || 'Data Saver: OFF')}
                </button>
              </div>
            )}
          </div>

          {/* Auth controls */}
          {!loggedIn ? (
            <>
              {/* Farmer login only on mobile and desktop */}
<a href="/auth/login" className={`rounded-md px-3 py-1.5 text-white text-sm ${pathname.startsWith('/auth/login') ? 'bg-brand-dark' : 'bg-brand hover:bg-brand-dark'} shrink-0`}>
                {t('login') || 'Login'}
              </a>
              {/* Admin login hidden on small screens; available on desktop header */}
              <a href="/admin/login" className={`hidden md:inline text-sm hover:text-brand dark:hover:text-brand-light ${pathname.startsWith('/admin/login') ? 'text-brand dark:text-brand-light font-medium' : 'text-gray-700 dark:text-gray-200'}`}>
                Admin Login
              </a>
            </>
          ) : (
            <>
              {role === 'admin' ? (
                <a href="/admin" className={`text-sm hover:text-brand dark:hover:text-brand-light ${pathname.startsWith('/admin') ? 'text-brand dark:text-brand-light font-medium' : 'text-gray-700 dark:text-gray-200'}`}>Admin Dashboard</a>
              ) : (
                <a href="/dashboard" className={`text-sm hover:text-brand dark:hover:text-brand-light ${pathname.startsWith('/dashboard') ? 'text-brand dark:text-brand-light font-medium' : 'text-gray-700 dark:text-gray-200'}`}>Dashboard</a>
              )}
              <button onClick={onLogout} className="text-sm text-gray-700 dark:text-gray-200 hover:text-brand dark:hover:text-brand-light">{t('logout') || 'Logout'}</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
