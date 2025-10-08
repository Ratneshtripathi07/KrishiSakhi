// server/src/services/LocationFallback.ts
import { env } from '../config/environment';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

type FallbackRecord = {
  pincode?: string | number;
  state?: string;
  statename?: string;
  district?: string; // often city/district interchangeably used in datasets
  city?: string;
  constituency?: string;
  gram_panchayat?: string;
};

type Cache = {
  byPin: Map<string, FallbackRecord[]>;
  statesIndex: Map<string, Set<string>>; // state(UPPER) -> cities (as-is)
  constituencyIndex: Map<string, Set<string>>; // key: `${STATE}||${CITY_UPPER}` -> constituencies (as-is)
  validStates: Set<string>;
};

function pickFirst(obj: any, keys: string[]): any {
  if (!obj) return undefined;
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined && obj[k] !== null) {
      return obj[k];
    }
  }
  return undefined;
}

let cache: Cache | null = null;
let loaded = false;

function normalizePin(v: any): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  // Exact 6 digits
  if (/^[0-9]{6}$/.test(s)) return s;
  // Handle trailing decimals like "683572.0" or a stray dot
  const m = s.match(/^([0-9]{6})(?:\.0+|\.)?$/);
  if (m) return m[1];
  // Remove non-digits and re-check
  const digits = s.replace(/\D/g, '');
  if (/^[0-9]{6}$/.test(digits)) return digits;
  return null;
}

function toArrayFromJson(raw: string): FallbackRecord[] {
  try {
    const parsed: any = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as FallbackRecord[];
    if (parsed && Array.isArray(parsed.records)) return parsed.records as FallbackRecord[];
  } catch {}
  // Attempt JSONL (one record per line)
  const lines = raw.split(/\r?\n/);
  const arr: FallbackRecord[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    try { arr.push(JSON.parse(t)); } catch { /* ignore */ }
  }
  return arr;
}

function normalizeStateName(s?: string): string | undefined {
  if (!s) return undefined;
  return s.toString().trim();
}

function normalizeDistrictName(s?: string): string | undefined {
  if (!s) return undefined;
  return s.toString().trim();
}

function normalizeConstituencyName(s?: string): string | undefined {
  if (!s) return undefined;
  return s.toString().trim();
}

function getAllowedStates(): Set<string> {
  const raw = (env as any).LOCATION_FALLBACK_STATES as string | undefined;
  const list = (raw || 'ODISHA,KERALA,PUNJAB,UTTAR PRADESH')
    .split(',')
    .map((x) => x.trim().toUpperCase())
    .filter(Boolean);
  return new Set(list);
}

function resolveFallbackFiles(): string[] {
  const envFile = (env as any).LOCATION_FALLBACK_FILE as string | undefined;
  const files: string[] = [];
  // Default to project-root/New_DataSet.json when running under server/
  const guess = path.resolve(__dirname, '../../..', 'New_DataSet.json');
  files.push(guess);
  if (envFile && envFile.trim()) {
    const p = envFile.trim();
    if (p !== guess) files.push(p);
  }
  // De-duplicate while preserving order
  return Array.from(new Set(files));
}

function loadFallback(): void {
  if (loaded && cache) return;
const files = resolveFallbackFiles();
  cache = { byPin: new Map(), statesIndex: new Map(), constituencyIndex: new Map(), validStates: getAllowedStates() };
  try {
    let arr: any[] = [];
    for (const f of files) {
      try {
        if (!f || !existsSync(f)) continue;
        const raw = readFileSync(f, 'utf-8');
        const part: any[] = toArrayFromJson(raw) as any[];
        if (Array.isArray(part) && part.length) arr = arr.concat(part);
      } catch {}
    }
    if (arr.length === 0) { loaded = true; return; }

    const build = (allowedFilter: Set<string> | null) => {
      for (const r of arr) {
        // Support both legacy pin-based rows and new state/city/constituency rows
        const pinRaw = pickFirst(r, ['pincode', 'pin_code', 'pinCode', 'PinCode', 'PINCODE', 'Pincode', 'PIN']);
        const pin = normalizePin(pinRaw);
        const stateRaw0 = normalizeStateName(
          pickFirst(r, ['statename', 'state', 'StateName', 'STATE', 'State'])
        );
        const stateUpper = stateRaw0 ? stateRaw0.toUpperCase() : undefined;
        const cityRaw = normalizeDistrictName(
          pickFirst(r, ['city', 'City', 'district', 'districtname', 'DistrictName', 'DISTRICT'])
        );
        const cityUpper = cityRaw ? cityRaw.toUpperCase() : undefined;
        const constituencyRaw = normalizeConstituencyName(
          pickFirst(r, ['constituency', 'Constituency', 'assembly', 'AC_NAME', 'ACNAME', 'assembly_constituency'])
        );

        if (allowedFilter && stateUpper && !allowedFilter.has(stateUpper)) continue;

        // Build pin index if available (legacy compatibility)
        if (pin) {
          const rec: FallbackRecord = {
            pincode: pin,
            state: stateUpper,
            statename: stateUpper,
            district: cityRaw,
            city: cityRaw,
          } as any;
          (rec as any).districtname = cityRaw;
          (rec as any).officename = pickFirst(r, ['officename', 'office', 'office_name', 'OfficeName']);
          (rec as any).taluk = pickFirst(r, ['taluk', 'subdistrict', 'sub_district']);
          (rec as any).latitude = (r as any).latitude;
          (rec as any).longitude = (r as any).longitude;
          const list = cache!.byPin.get(pin) || [];
          list.push(rec);
          cache!.byPin.set(pin, list);
        }

        // Build state -> cities index
        if (stateUpper && cityRaw) {
          const set = cache!.statesIndex.get(stateUpper) || new Set<string>();
          set.add(cityRaw);
          cache!.statesIndex.set(stateUpper, set);
        }

        // Build constituencies index
        if (stateUpper && cityUpper && constituencyRaw) {
          const key = `${stateUpper}||${cityUpper}`;
          const set = cache!.constituencyIndex.get(key) || new Set<string>();
          set.add(constituencyRaw);
          cache!.constituencyIndex.set(key, set);
        }
      }
    };

    // First attempt with allowed states if provided
    build(cache.validStates.size ? cache.validStates : null);
    // Also build without filter to keep pin index complete; constituency index will be overwritten with same keys
    build(null);

    if ((process.env.NODE_ENV || 'development') !== 'production') {
      try {
        const sampleKey = `${Array.from(cache.statesIndex.keys())[0] || 'N/A'}||${Array.from((cache.statesIndex.get(Array.from(cache.statesIndex.keys())[0] || '') || new Set<string>()).values())[0] || 'N/A'}`;
        // eslint-disable-next-line no-console
        console.log(`[fallback] loaded files=${files.length} states=${cache.statesIndex.size} constituencyKeys=${cache.constituencyIndex.size} sampleKey=${sampleKey} constituenciesForSample=${Array.from(cache.constituencyIndex.get(sampleKey) || [])?.length}`);
      } catch {}
    }
  } catch {
    // ignore malformed files
  }
  loaded = true;
}

export function fallbackStates(): string[] {
  loadFallback();
  if (!cache) return [];
  const keys = Array.from(cache.statesIndex.keys());
  if (cache.validStates.size === 0) return keys;
  // intersect with allowed
  return keys.filter((k) => cache!.validStates.has(k));
}

export function fallbackCities(state?: string): string[] {
  loadFallback();
  if (!cache) return [];
  const allowed = cache!.validStates;
  if (!state) {
    const all = new Set<string>();
    for (const [s, set] of cache!.statesIndex) {
      if (allowed.size && !allowed.has(s)) continue;
      for (const c of set) all.add(c);
    }
    return Array.from(all);
  }
  const key = state.toUpperCase();
  if (allowed.size && !allowed.has(key)) return [];
  return Array.from(cache!.statesIndex.get(key) || []);
}

export function fallbackConstituencies(state?: string, city?: string): string[] {
  loadFallback();
  if (!cache) return [];
  const allowed = cache!.validStates;

  const addAllFrom = (stateKey?: string, cityNameUpper?: string) => {
    const out = new Set<string>();
    if (!stateKey) return out;
    if (allowed.size && !allowed.has(stateKey)) return out;
    if (!cityNameUpper) {
      // Union across all cities for a state
      const cities = cache!.statesIndex.get(stateKey) || new Set<string>();
      for (const cityName of cities) {
        const key = `${stateKey}||${cityName.toUpperCase()}`;
        const set = cache!.constituencyIndex.get(key) || new Set<string>();
        for (const v of set) out.add(v);
      }
      return out;
    }
    const key = `${stateKey}||${cityNameUpper}`;
    const set = cache!.constituencyIndex.get(key) || new Set<string>();
    for (const v of set) out.add(v);
    return out;
  };

  if (!state && !city) {
    // Return all constituencies (could be large)
    const all = new Set<string>();
    for (const s of cache.statesIndex.keys()) {
      const part = addAllFrom(s);
      for (const v of part) all.add(v);
    }
    return Array.from(all);
  }

  const sKey = state ? state.toUpperCase() : undefined;
  const cKey = city ? city.toUpperCase() : undefined;
  const res = addAllFrom(sKey, cKey);
  return Array.from(res);
}

function slowScanAndIndex(pin: string) {
  const files = resolveFallbackFiles();
  if (!files || !cache) return;
  try {
    const target = normalizePin(pin);
    if (!target) return;
    for (const file of files) {
      try {
        if (!existsSync(file)) continue;
        const raw = readFileSync(file, 'utf-8');
        const arr: any[] = toArrayFromJson(raw) as any[];
        const hits: FallbackRecord[] = [];
        for (const r of arr) {
          const p = normalizePin(pickFirst(r, ['pincode', 'pin_code', 'pinCode', 'PinCode', 'PINCODE', 'Pincode', 'PIN']));
          if (p !== target) continue;
          const stateRaw0 = normalizeStateName(
            pickFirst(r, ['statename', 'state', 'StateName', 'STATE', 'State'])
          );
          const stateUpper = stateRaw0 ? stateRaw0.toUpperCase() : undefined;
          const districtRaw = normalizeDistrictName(
            pickFirst(r, ['district', 'districtname', 'DistrictName', 'DISTRICT', 'city', 'City'])
          );
          const rec: any = {
            pincode: target,
            state: stateUpper,
            statename: stateUpper,
            district: districtRaw,
            city: districtRaw,
            districtname: districtRaw,
            officename: pickFirst(r, ['officename', 'office', 'office_name', 'OfficeName']),
            taluk: pickFirst(r, ['taluk', 'subdistrict', 'sub_district']),
            latitude: (r as any).latitude,
            longitude: (r as any).longitude,
          };
          hits.push(rec);
        }
        if (hits.length) {
          cache!.byPin.set(target, hits);
          for (const rec of hits) {
            if (rec.statename && rec.district) {
              const key = (rec.statename as string).toUpperCase();
              const set = cache!.statesIndex.get(key) || new Set<string>();
              set.add(rec.district as string);
              cache!.statesIndex.set(key, set);
            }
          }
          if ((process.env.NODE_ENV || 'development') !== 'production') {
            // eslint-disable-next-line no-console
            console.log(`[fallback] indexed pin=${target} hits=${hits.length} states=${Array.from(new Set(hits.map(h=>h.statename))).join(',')} cities=${Array.from(new Set(hits.map(h=>h.district))).join(',')}`);
          }
          break; // indexed from the first file that contains it
        }
      } catch (e) {
        if ((process.env.NODE_ENV || 'development') !== 'production') {
          // eslint-disable-next-line no-console
          console.log('[fallback] slowScan error', (e as any)?.message);
        }
      }
    }
  } catch (e) {
    if ((process.env.NODE_ENV || 'development') !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[fallback] slowScan error', (e as any)?.message);
    }
  }
}

export function fallbackLookup(pin: string): FallbackRecord[] {
  loadFallback();
  if (!cache) return [];
  const norm = normalizePin(pin);
  if (!norm) {
    // Attempt to scan with raw input; internal normalization will handle if possible
    slowScanAndIndex((pin || '').toString());
    const key2 = normalizePin(pin);
    const list2 = (key2 && cache.byPin.get(key2)) || [];
    return list2;
  }
  let list = cache.byPin.get(norm) || [];
  if (list.length === 0) {
    // As a last resort, scan the dataset for this pin and index it
    slowScanAndIndex(norm);
    list = cache.byPin.get(norm) || [];
  }
  // If allowed states are configured, filter results to those states; otherwise return all
  if (cache.validStates.size) {
    const filtered = list.filter((r: any) => !r.statename || cache!.validStates.has((r.statename as string).toUpperCase()));
    return filtered.length ? filtered : list; // if filter empties, fall back to list
  }
  return list;
}
