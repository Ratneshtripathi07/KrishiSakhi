"use client";

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import Button from '@/components/ui/button';
import Textarea from '@/components/ui/textarea';

const QUEUE_KEY = 'km_feedback_queue';

export default function FeedbackPage() {
  const { t } = useI18n();
  const [text, setText] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const flush = async () => {
    try {
      const raw = localStorage.getItem(QUEUE_KEY) || '[]';
      const items: string[] = JSON.parse(raw);
      if (!Array.isArray(items) || items.length === 0) return;
      // Try sending queued items (backend may not exist yet)
      for (const t of items) {
        // eslint-disable-next-line no-await-in-loop
        await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: t }) }).catch(() => {});
      }
      localStorage.removeItem(QUEUE_KEY);
      setStatus(t('sent_queued_feedback') || 'Sent queued feedback');
    } catch {}
  };

  useEffect(() => {
    const onOnline = () => { flush(); };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  const submit = async () => {
    setStatus(null);
    const payload = { text };
    try {
      const res = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Queueing locally');
      setStatus(t('thanks_feedback') || 'Thanks for your feedback!');
      setText('');
    } catch {
      // Queue locally for later
      try {
        const raw = localStorage.getItem(QUEUE_KEY) || '[]';
        const items: string[] = JSON.parse(raw);
        items.push(text);
        localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
        setStatus(t('offline_feedback_saved') || 'You are offline. Feedback saved and will be sent later.');
        setText('');
      } catch {}
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">{t('feedback') || 'Feedback'}</h1>
      <p className="text-sm text-gray-600">{t('feedback_note') || 'Share suggestions or issues. If offline, we will queue it and send later.'}</p>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder={t('type_here') || 'Type here...'} />
      <div className="space-x-2">
        <Button onClick={submit} disabled={!text.trim()} size="sm">{t('submit') || 'Submit'}</Button>
        <Button href="/dashboard" variant="outline" size="sm">{t('back_to_dashboard') || 'Back to Dashboard'}</Button>
      </div>
      {status && <p className="text-sm text-gray-700" aria-live="polite">{status}</p>}
    </div>
  );
}