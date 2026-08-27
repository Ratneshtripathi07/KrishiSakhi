'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { checkServerHealth, ServerHealthResponse } from '@/services/api';
import { useI18n } from '@/lib/i18n';
import { usePathname } from 'next/navigation';
import {
  Server,
  Database,
  CloudSun,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Info,
  X,
  Zap,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';

export type ServerStatusState = 'checking' | 'waking_up' | 'connected' | 'db_paused' | 'error';

const STORAGE_KEY = 'km_free_tier_notice_dismissed';

export default function ServerStatusNotice() {
  const { t } = useI18n();
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  const [status, setStatus] = useState<ServerStatusState>('checking');
  const [elapsed, setElapsed] = useState(0);
  const [healthData, setHealthData] = useState<ServerHealthResponse | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const retryCount = useRef(0);

  // Load initial dismissal from sessionStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved === 'true') {
          setDismissed(true);
        }
      }
    } catch {}
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEY, 'true');
      }
    } catch {}
  };

  const startElapsedTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
  }, []);

  const stopElapsedTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const doHealthCheck = useCallback(async () => {
    try {
      const data = await checkServerHealth();
      setHealthData(data);
      stopElapsedTimer();

      if (data.database === 'paused_or_unavailable') {
        setStatus('db_paused');
      } else {
        setStatus('connected');
      }
    } catch (err) {
      retryCount.current += 1;
      setStatus('waking_up');

      if (retryCount.current > 25) {
        setStatus('error');
        stopElapsedTimer();
      } else {
        pollRef.current = setTimeout(doHealthCheck, 3500);
      }
    }
  }, [stopElapsedTimer]);

  useEffect(() => {
    startElapsedTimer();
    doHealthCheck();

    const openHandler = () => setShowModal(true);
    window.addEventListener('open-server-status-modal', openHandler);

    return () => {
      stopElapsedTimer();
      if (pollRef.current) clearTimeout(pollRef.current);
      window.removeEventListener('open-server-status-modal', openHandler);
    };
  }, [doHealthCheck, startElapsedTimer, stopElapsedTimer]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

  const handleManualRetry = () => {
    retryCount.current = 0;
    setStatus('checking');
    startElapsedTimer();
    doHealthCheck();
  };

  return (
    <>
      {/* Top Banner: Only visible on Home Page ('/') and only if not dismissed */}
      {isHomePage && !dismissed && (
        <div className="w-full transition-all duration-300 relative z-40">
          {status === 'waking_up' && (
            <div className="bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-300/70 dark:border-amber-700/60 text-amber-950 dark:text-amber-100 px-3.5 py-2.5 sm:px-4 shadow-sm backdrop-blur-md">
              <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <div className="p-1.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse mt-0.5">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="text-xs sm:text-sm">
                    <div className="font-semibold flex items-center gap-2 flex-wrap text-amber-900 dark:text-amber-200">
                      <span>{t('freeTierTitle') || 'Free-Tier Hosting Notice'}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-medium">
                        <Clock className="w-3 h-3 animate-spin" />
                        {t('wakingUp') || 'Waking Up...'} ({elapsed}s / ~50s)
                      </span>
                    </div>
                    <p className="mt-0.5 text-amber-900/90 dark:text-amber-200/90 leading-snug">
                      Backend (Render) is waking from free-tier sleep (~50s).{' '}
                      <span className="font-medium text-amber-950 dark:text-amber-100 underline decoration-amber-400 underline-offset-2">
                        If Supabase DB project is paused, DB features will not work until unpaused
                      </span>
                      , while Weather & AI features work normally.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-amber-500/20 hover:bg-amber-500/30 dark:bg-amber-400/20 dark:hover:bg-amber-400/30 text-amber-900 dark:text-amber-100 transition-colors"
                  >
                    <Info className="w-3.5 h-3.5" />
                    {t('details') || 'View Details'}
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="p-1 rounded hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 transition-colors"
                    title="Dismiss banner"
                    aria-label="Dismiss banner"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {status === 'db_paused' && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 px-3.5 py-2 sm:px-4 shadow-sm">
              <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    <strong>Backend Active:</strong> Supabase DB appears paused. Database activities (Login, Saved Farms) won&apos;t work, but Weather & Advisory remain functional.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowModal(true)}
                    className="underline hover:text-amber-950 dark:hover:text-white font-medium text-xs sm:text-sm"
                  >
                    {t('details') || 'Details'}
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="p-1 rounded hover:bg-amber-200/50 dark:hover:bg-amber-900/50"
                    title="Dismiss"
                    aria-label="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {status === 'connected' && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 px-3.5 py-1.5 sm:px-4 shadow-sm transition-all duration-500">
              <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t('serverConnected') || 'Backend server and database connected successfully!'}</span>
                </div>
                <button
                  onClick={handleDismiss}
                  className="p-1 rounded hover:bg-emerald-200/50 dark:hover:bg-emerald-900/50"
                  title="Dismiss"
                  aria-label="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 dark:bg-red-950/40 border-b border-red-300 dark:border-red-800 text-red-900 dark:text-red-200 px-3.5 py-2 sm:px-4 shadow-sm">
              <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                  <span>Backend response delayed. Render instance may still be waking up.</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleManualRetry}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-red-600 hover:bg-red-700 text-white shadow-sm"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {t('retry') || 'Retry'}
                  </button>
                  <button
                    onClick={() => setShowModal(true)}
                    className="underline text-xs hover:text-red-950 dark:hover:text-white"
                  >
                    {t('details') || 'Details'}
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="p-1 rounded hover:bg-red-200/50 dark:hover:bg-red-900/50"
                    title="Dismiss"
                    aria-label="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Status Pill: Only on Home Page */}
      {isHomePage && (
        <div className="fixed bottom-16 right-3 sm:bottom-4 sm:right-4 z-30">
          <button
            onClick={() => setShowModal(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg border backdrop-blur-md transition-all duration-300 hover:scale-105 ${
              status === 'waking_up' || status === 'checking'
                ? 'bg-amber-100/90 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                : status === 'db_paused'
                ? 'bg-orange-100/90 dark:bg-orange-950/80 border-orange-300 dark:border-orange-700 text-orange-900 dark:text-orange-200'
                : status === 'error'
                ? 'bg-red-100/90 dark:bg-red-950/80 border-red-300 dark:border-red-700 text-red-900 dark:text-red-200'
                : 'bg-white/90 dark:bg-[#1E1E1E]/90 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200'
            }`}
            title="Click to view free tier & server details"
            aria-label="Server status details"
          >
            <span className="relative flex h-2.5 w-2.5">
              {status === 'waking_up' || status === 'checking' ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </>
              ) : status === 'connected' ? (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              ) : status === 'db_paused' ? (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
              ) : (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              )}
            </span>

            <span>
              {status === 'waking_up'
                ? `Waking Up (${elapsed}s)`
                : status === 'connected'
                ? 'Server Online'
                : status === 'db_paused'
                ? 'DB Paused'
                : status === 'checking'
                ? 'Connecting...'
                : 'Server Slow / Offline'}
            </span>
          </button>
        </div>
      )}

      {/* Redesigned Details Modal (Available from any page via Header or Home Page pill) */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 max-w-lg w-full overflow-hidden text-gray-900 dark:text-gray-100 transform transition-all">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white dark:from-[#18181A] dark:to-[#1C1C1E]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-brand/10 text-brand dark:text-brand-light">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">
                    {t('whyTitle') || 'Free Tier Hosting & Architecture'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Live infrastructure & availability breakdown
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-sm max-h-[75vh] overflow-y-auto">
              {/* Live Status Header Card */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#141416] border border-gray-200/80 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span
                      className={`relative inline-flex rounded-full h-3 w-3 ${
                        status === 'connected'
                          ? 'bg-emerald-500'
                          : status === 'db_paused'
                          ? 'bg-orange-500'
                          : status === 'waking_up'
                          ? 'bg-amber-500 animate-pulse'
                          : 'bg-red-500'
                      }`}
                    ></span>
                  </span>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                      Live Backend Status
                    </span>
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">
                      {status === 'connected' && 'Online & Database Active 🟢'}
                      {status === 'db_paused' && 'Backend Active, Supabase DB Paused 🟠'}
                      {status === 'waking_up' && `Waking Up (Elapsed: ${elapsed}s) 🟡`}
                      {status === 'checking' && 'Connecting to Backend... ⏳'}
                      {status === 'error' && 'Server Delayed / Retrying 🔴'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleManualRetry}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
                  title="Refresh status"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Check</span>
                </button>
              </div>

              {/* Notice Cards */}
              <div className="space-y-3">
                {/* 1. Render Card */}
                <div className="p-3.5 rounded-xl border border-amber-200/70 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-xs text-amber-950 dark:text-amber-200 uppercase tracking-wide">
                          1. Render Backend (Cold Start ~50s)
                        </h4>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">
                        {t('renderNoticeDesc') ||
                          'The backend server is hosted on Render free tier. When inactive, it automatically sleeps. On first visit, it takes approximately 50 seconds to boot up.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Supabase Card */}
                <div className="p-3.5 rounded-xl border border-orange-200/70 dark:border-orange-900/40 bg-orange-50/40 dark:bg-orange-950/20">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-xs text-orange-950 dark:text-orange-200 uppercase tracking-wide">
                          2. Supabase Database (Paused Project Info)
                        </h4>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">
                        {t('supabaseNoticeDesc') ||
                          'If the Supabase project itself is paused due to inactivity, database-dependent activities will not work until unpaused in Supabase.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Feature Breakdown Matrix */}
                <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#161618]">
                  <h4 className="font-semibold text-xs text-gray-800 dark:text-gray-200 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand dark:text-brand-light" />
                    Feature Availability Matrix
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-2 p-2 rounded-lg bg-white dark:bg-[#1E1E20] border border-gray-200/60 dark:border-gray-800">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-gray-100 block">
                          🌤️ Weather, AI Advisory & Calculators
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          Operate independently of the database once the backend is awake.
                        </span>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 shrink-0">
                        Non-DB (OK)
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2 p-2 rounded-lg bg-white dark:bg-[#1E1E20] border border-gray-200/60 dark:border-gray-800">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-gray-100 block">
                          🔐 User Login, Farmer Profile, Saved Farms
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          Require an active (unpaused) Supabase PostgreSQL database.
                        </span>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 shrink-0">
                        DB Dependent
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-[#161618] flex items-center justify-between">
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                Press ESC or click outside to close
              </span>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-brand hover:bg-brand-dark text-white shadow-sm transition-colors"
              >
                {t('gotIt') || 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
