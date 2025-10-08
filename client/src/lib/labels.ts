export function prettifyKey(key: string): string {
  if (!key) return '';
  const s = String(key)
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function label(t: (k: string) => string | undefined | null, key: string, fallback?: string): string {
  try {
    const v = t?.(key);
    if (v && v !== key) return v;
  } catch {}
  if (fallback) return fallback;
  return prettifyKey(key);
}