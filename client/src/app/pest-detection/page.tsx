"use client";

import { useEffect, useRef, useState } from 'react';
import { analyzeImage, type AnalyzeImageOptions, type PestAnalysis } from '@/services/pestService';
import { useI18n } from '@/lib/i18n';
import VoiceButton from '@/components/voice/VoiceButton';
import { useSpeak } from '@/lib/tts';
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import Button from '@/components/ui/button';
import Label from '@/components/ui/label';

export default function PestDetectionPage() {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [crop, setCrop] = useState('');
  const [notes, setNotes] = useState('');
  const [coords, setCoords] = useState<{ lat?: number; lon?: number }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PestAnalysis | null>(null);
  const { speak } = useSpeak();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const NOTES_LIMIT = 500;

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => setCoords({}),
        { enableHighAccuracy: true, maximumAge: 60_000 }
      );
    }
  }, []);

  const handleFile = async (f: File | null) => {
    if (!f) {
      setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }
    // Data Saver: compress image before upload
    try {
      const canvas = document.createElement('canvas');
      const img = document.createElement('img');
      const tmpUrl = URL.createObjectURL(f);
      await new Promise((res, rej) => { img.onload = () => res(null); img.onerror = rej; img.src = tmpUrl; });
      const maxW = 1024; const maxH = 1024;
      let { width, height } = img;
      const scale = Math.min(1, maxW / width, maxH / height);
      width = Math.round(width * scale); height = Math.round(height * scale);
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.drawImage(img, 0, 0, width, height); }
      URL.revokeObjectURL(tmpUrl);
      const q = 0.7;
      const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b as Blob), 'image/jpeg', q));
      const jf = new File([blob], f.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
      setFile(jf);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(jf));
    } catch {
      setFile(f);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(f));
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    await handleFile(f);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!file) {
      setError(t('photo_label') || 'Please select an image first.');
      return;
    }
    setLoading(true);
    try {
      const opts: AnalyzeImageOptions = { crop: crop || undefined, notes: notes || undefined, lat: coords.lat, lon: coords.lon };
      const analysis = await analyzeImage(file, opts);
      setResult(analysis);
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  // Drag & drop handlers
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith('image/')) await handleFile(f);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-center min-h-[calc(100vh-180px)] px-0 md:px-4">
        <div className="w-full max-w-2xl mx-auto">
          <div className="rounded-2xl bg-white dark:bg-[#1E1E1E] shadow-sm border dark:border-gray-700 p-5 md:p-6">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-semibold">🌿 AI Pest & Disease Analysis</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Upload a photo and describe the symptoms to get instant insights.</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              {/* Crop */}
              <div>
                <Label>{t('crop_optional')}</Label>
                <Input
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  placeholder="e.g., Brinjal"
                  className="mt-1 focus:border-emerald-600 focus:ring-emerald-200"
                />
              </div>

              {/* File upload */}
              <div>
                <Label>{t('photo_label')}</Label>
                {!previewUrl ? (
                  <div
                    className={`mt-2 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${dragActive ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-300 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-400'}`}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    aria-label="Upload image"
                  >
                    <div className="text-5xl mb-2">📷</div>
                    <p className="text-gray-700 dark:text-gray-200 font-medium">Drag & drop your image here</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">or click to browse</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={onFileChange}
                      className="sr-only"
                    />
                  </div>
                ) : (
                  <div className="mt-2">
                    <div className="relative rounded-xl overflow-hidden border bg-gray-50 dark:bg-[#0f0f0f] dark:border-gray-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewUrl} alt="Selected crop image preview" className="w-full h-auto object-contain max-h-80" />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                        Replace Image
                      </Button>
                      <button
                        type="button"
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        onClick={() => handleFile(null)}
                      >
                        Remove
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={onFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <Label>{t('notes_optional')}</Label>
                <div className="mt-1 flex items-start gap-2">
                  <div className="relative flex-1">
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Describe symptoms, when it started, how it spreads, etc."
                      rows={4}
                      maxLength={NOTES_LIMIT}
                      className="pr-28 focus:border-emerald-600 focus:ring-emerald-200"
                    />
                    <div className="absolute bottom-2 right-3 text-xs text-gray-500">
                      {notes.length}/{NOTES_LIMIT}
                    </div>
                  </div>
                  <VoiceButton onTranscript={(tx) => setNotes(tx)} title={t('voice') || 'Voice'} className="shrink-0" />
                </div>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('location')}: {coords.lat?.toFixed(4) || '—'}, {coords.lon?.toFixed(4) || '—'}
              </div>

              <Button disabled={loading || !file} className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700">
                {loading ? (
                  <span className="inline-flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    {t('analyzing') || 'Analyzing…'}
                  </span>
                ) : (
                  (t('analyze_button') || 'Analyze Image')
                )}
              </Button>
            </form>

            {error && <p className="text-red-600 dark:text-red-400 mt-4">{error}</p>}

            {result && (
              <div className="mt-6 rounded-2xl bg-white dark:bg-[#1E1E1E] shadow-sm border dark:border-gray-700 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">{t('result_title') || 'Result'}</h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const parts: string[] = [];
                      if (result?.prediction) parts.push(`${t('prediction_label') || 'Prediction'}: ${result.prediction}`);
                      if (typeof result?.confidence === 'number') parts.push(`Confidence ${(result.confidence * 100).toFixed(0)}%`);
                      if (Array.isArray(result?.recommended_actions) && result.recommended_actions.length) parts.push(`Recommended: ${result.recommended_actions.join('; ')}`);
                      if (Array.isArray(result?.caution) && result.caution.length) parts.push(`Advisories: ${result.caution.join('; ')}`);
                      speak(parts.join('. '));
                    }}
                  >
                    {t('speak') || 'Speak'}
                  </Button>
                </div>
                {result.prediction && (
                  <p className="text-base">
                    <span className="font-medium">{t('prediction_label') || 'Prediction'}:</span> {result.prediction}
                    {typeof result.confidence === 'number' ? ` (confidence ${(result.confidence * 100).toFixed(0)}%)` : ''}
                  </p>
                )}
                {result.likely_causes && result.likely_causes.length > 0 && (
                  <div>
                    <p className="font-medium">{t('likely_causes') || 'Likely Causes'}</p>
                    <ul className="list-disc pl-6 text-sm text-gray-700 dark:text-gray-300">
                      {result.likely_causes.map((c, idx) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.recommended_actions && result.recommended_actions.length > 0 && (
                  <div>
                    <p className="font-medium">{t('recommended_actions') || 'Recommended Actions'}</p>
                    <ul className="list-disc pl-6 text-sm text-gray-700 dark:text-gray-300">
                      {result.recommended_actions.map((a, idx) => (
                        <li key={idx}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.caution && result.caution.length > 0 && (
                  <div>
                    <p className="font-medium">{t('advisories')}</p>
                    <ul className="list-disc pl-6 text-sm text-gray-700 dark:text-gray-300">
                      {result.caution.map((a, idx) => (
                        <li key={idx}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {t('model_label') || 'Model'}: {result.model || 'demo'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
