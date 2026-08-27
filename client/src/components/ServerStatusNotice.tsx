'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { checkServerHealth, ServerHealthResponse } from '@/services/api';
import { useI18n } from '@/lib/i18n';
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
  HelpCircle,
  Clock
} from 'lucide-react';

export type ServerStatusState = 'checking' | 'waking_up' | 'connected' | 'db_paused' | 'error';

export default function ServerStatusNotice() {
  const { t } = useI18n();
  const [status, setStatus] = useState<ServerStatusState>('checking');
  const [elapsed, setElapsed] = useState(0);
  const [healthData, setHealthData] = useState<ServerHealthResponse | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const retryCount = useRef(0);

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
        // Auto-minimize success message after 4.5 seconds
        setTimeout(() => {
          setMinimized(true);
        }, 4500);
      }
    } catch (err) {
      retryCount.current += 1;
      // After first attempt or if taking more than 3s, show waking_up state
      setStatus('waking_up');

      if (retryCount.current > 20) {
        // After ~70s of retrying
        setStatus('error');
        stopElapsedTimer();
      } else {
        // Schedule next poll
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

  const handleManualRetry = () => {
    retryCount.current = 0;
    setStatus('checking');
    startElapsedTimer();
    doHealthCheck();
  };

  // If dismissed or fully connected and minimized without error, show nothing in the top bar
  // (the status remains accessible via header badge or modal)
  if (dismissed && status !== 'waking_up') {
    return null;
  }

  return (
    <>
      {/* Top Banner for Cold Start / Free Tier Notice */}
      {(!dismissed || status === 'waking_up') && (
        <div className="w-full transition-all duration-300">
          {status === 'waking_up' && (
            <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-yellow-500/15 dark:from-amber-950/40 dark:via-orange-950/40 dark:to-yellow-950/40 border-b border-amber-300/60 dark:border-amber-700/60 text-amber-950 dark:text-amber-100 px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-sm backdrop-blur-md">
              <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
                <div className="flex items-start gap-2.5 flex-1">
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
                      Backend (Render) is booting from inactivity (~50s cold start).{' '}
                      <span className="font-medium text-amber-950 dark:text-amber-100 underline decoration-amber-400 underline-offset-2">
                        If Supabase DB is paused, database-dependent features will not work until resumed
                      </span>
                      , while weather & AI features remain functional.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-amber-500/20 hover:bg-amber-500/30 dark:bg-amber-400/20 dark:hover:bg-amber-400/30 text-amber-900 dark:text-amber-100 transition-colors"
                  >
                    <Info className="w-3.5 h-3.5" />
                    {t('details') || 'Details'}
                  </button>
                  <button
                    onClick={() => setDismissed(true)}
                    className="p-1 rounded hover:bg-amber-500/20 text-amber-800 dark:text-amber-300"
                    aria-label="Dismiss banner"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {status === 'db_paused' && !minimized && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 px-3.5 py-2 sm:px-4 shadow-sm">
              <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    <strong>Backend Online:</strong> Supabase DB appears paused or unreachable. DB features (Login, Profile, Saved Farms) are disabled, but Weather & Advisory remain functional.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowModal(true)}
                    className="underline hover:text-amber-950 dark:hover:text-white font-medium"
                  >
                    {t('details') || 'Details'}
                  </button>
                  <button
                    onClick={() => setMinimized(true)}
                    className="p-1 rounded hover:bg-amber-200/50 dark:hover:bg-amber-900/50"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {status === 'connected' && !minimized && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 px-3.5 py-1.5 sm:px-4 shadow-sm transition-all duration-500">
              <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t('serverConnected') || 'Backend server and database connected successfully!'}</span>
                </div>
                <button
                  onClick={() => setMinimized(true)}
                  className="p-1 rounded hover:bg-emerald-200/50 dark:hover:bg-emerald-900/50"
                  aria-label="Close"
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
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Status Pill (bottom-right on mobile/desktop for quick status & reopening modal) */}
      <div className="fixed bottom-16 right-3 sm:bottom-4 sm:right-4 z-40">
        <button
          onClick={() => setShowModal(true)}
          className={`flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full text-xs font-medium shadow-md border backdrop-blur-md transition-all duration-300 hover:scale-105 ${
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
          <span className="relative flex h-2 w-2">
            {status === 'waking_up' || status === 'checking' ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </>
            ) : status === 'connected' ? (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            ) : status === 'db_paused' ? (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            )}
          </span>

          <span className="hidden sm:inline">
            {status === 'waking_up'
              ? `Render Waking Up (${elapsed}s)`
              : status === 'connected'
              ? 'Server & DB Online'
              : status === 'db_paused'
              ? 'DB Paused (Non-DB OK)'
              : status === 'checking'
              ? 'Connecting...'
              : 'Server Offline / Retrying'}
          </span>
          <span className="sm:hidden font-mono">
            {status === 'waking_up' ? `${elapsed}s` : status === 'connected' ? 'Online' : 'Status'}
          </span>
          <HelpCircle className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
        </button>
      </div>

      {/* Free Tier & Architecture Info Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-lg w-full overflow-hidden text-gray-900 dark:text-gray-100">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-[#181818]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-brand/10 text-brand dark:text-brand-light">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">
                    {t('whyTitle') || 'Free Tier Hosting & Availability'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Krishi Sakhi Infrastructure Status
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-sm max-h-[70vh] overflow-y-auto">
              {/* Current Status Box */}
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#161616] border border-gray-200/80 dark:border-gray-700/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
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
                    <span className="font-medium text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 block">
                      Live Status
                    </span>
                    <span className="font-semibold text-sm">
                      {status === 'connected'
                        ? 'Backend & Database Active 🟢'
                        : status === 'db_paused'
                        ? 'Backend Active, Supabase DB Paused 🟠'
                        : status === 'waking_up'
                        ? `Backend Waking Up (~${elapsed}s elapsed) 🟡`
                        : 'Checking / Stalled 🔴'}
                    </span>
                  </div>
                </div>
                {status === 'waking_up' || status === 'error' ? (
                  <button
                    onClick={handleManualRetry}
                    className="p-2 rounded-md bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 transition-colors"
                    title="Retry health check"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                ) : null}
              </div>

              {/* Notice cards */}
              <div className="space-y-3">
                {/* Render info */}
                <div className="p-3.5 rounded-lg border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
                  <div className="flex items-start gap-2.5">
                    <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-medium text-xs text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                        1. Render Backend (Cold Start ~50s)
                      </h4>
                      <p className="text-xs text-amber-900/80 dark:text-amber-200/80 mt-1 leading-relaxed">
                        {t('renderNoticeDesc') ||
                          'The backend server is hosted on Render free tier. Inactive instances automatically sleep and take ~50 seconds to boot on the first visit.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Supabase DB info */}
                <div className="p-3.5 rounded-lg border border-orange-200/80 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/20">
                  <div className="flex items-start gap-2.5">
                    <Database className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-medium text-xs text-orange-900 dark:text-orange-200 uppercase tracking-wider">
                        2. Supabase Database (Paused Project Behavior)
                      </h4>
                      <p className="text-xs text-orange-900/80 dark:text-orange-200/80 mt-1 leading-relaxed">
                        {t('supabaseNoticeDesc') ||
                          'If the Supabase project itself is paused due to inactivity, database-dependent activities (such as User Login, Farmer Profile, Saved Farms, Market Listings, and Grievance records) will not work until unpaused.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Non-DB Features info */}
                <div className="p-3.5 rounded-lg border border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <div className="flex items-start gap-2.5">
                    <CloudSun className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-medium text-xs text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                        3. Independent / Non-Database Features
                      </h4>
                      <p className="text-xs text-emerald-900/80 dark:text-emerald-200/80 mt-1 leading-relaxed">
                        {t('nonDbNoticeDesc') ||
                          'Non-database features such as Live Weather Forecasts, AI Advisory Engine, Pest Diagnosis rules, Crop Calculators, Mandi Price estimates, and PWA Offline cache will continue to work seamlessly once the backend is awake.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#161616] flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs sm:text-sm font-medium rounded-lg bg-brand hover:bg-brand-dark text-white shadow-sm transition-colors"
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
