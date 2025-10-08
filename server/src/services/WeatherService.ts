// server/src/services/WeatherService.ts
import { env } from '../config/environment';

// Minimal in-memory cache with TTL
class TTLCache<V> {
  private store = new Map<string, { value: V; expiresAt: number }>();
  constructor(private ttlMs: number) {}
  get(key: string): V | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (Date.now() > hit.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value;
  }
  set(key: string, value: V) {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}

export type WeatherResponse = {
  lat: number;
  lon: number;
  timezone?: string;
  current?: any;
  hourly?: any[];
  daily?: any[];
  alerts?: any[];
  source: 'open-meteo';
};

export class WeatherService {
  private cache = new TTLCache<WeatherResponse>(env.WEATHER_CACHE_TTL_SECONDS * 1000);

  private units(): string {
    return env.WEATHER_UNITS;
  }

  private async fetchJson(url: string): Promise<any> {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      throw Object.assign(new Error(`Weather fetch failed (${res.status}): ${text}`), { status: res.status });
    }
    return res.json();
  }

  private async geocodeOpenMeteo(state?: string, city?: string): Promise<{ lat: number; lon: number } | null> {
    if (!city && !state) return null;
    const name = [city, state, 'India'].filter(Boolean).join(', ');
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;
    const data = await this.fetchJson(url);
    const r = Array.isArray(data?.results) && data.results[0];
    if (r && typeof r.latitude === 'number' && typeof r.longitude === 'number') {
      return { lat: r.latitude, lon: r.longitude };
    }
    return null;
  }

  async geocode(state?: string, city?: string): Promise<{ lat: number; lon: number } | null> {
    return this.geocodeOpenMeteo(state, city);
  }

  private shapeFromOpenMeteo(lat: number, lon: number, data: any): WeatherResponse {
    const timezone = data.timezone;
    const currentWeather = data.current_weather || {};
    const hourly = data.hourly || {};
    const daily = data.daily || {};

    // Build a map from ISO time to values
    const hourlyTimes: string[] = hourly.time || [];
    const hTemp: number[] = hourly.temperature_2m || [];
    const hPopPct: number[] = hourly.precipitation_probability || [];
    const hHumidity: number[] = hourly.relative_humidity_2m || [];
    const hWind: number[] = (hourly.wind_speed_10m || hourly.windspeed_10m || []) as number[];

    const hourlyArray = hourlyTimes.map((iso, i) => ({
      dt: Math.floor(new Date(iso).getTime() / 1000),
      temp: typeof hTemp[i] === 'number' ? hTemp[i] : undefined,
      pop: typeof hPopPct[i] === 'number' ? Math.max(0, Math.min(1, hPopPct[i] / 100)) : 0,
      wind_speed: typeof hWind[i] === 'number' ? hWind[i] : undefined,
      humidity: typeof hHumidity[i] === 'number' ? hHumidity[i] : undefined,
    }));

    const dailyTimes: string[] = daily.time || [];
    const dTmax: number[] = daily.temperature_2m_max || [];
    const dTmin: number[] = daily.temperature_2m_min || [];
    const dPopPct: number[] = daily.precipitation_probability_max || [];
    const dailyArray = dailyTimes.map((iso, i) => ({
      dt: Math.floor(new Date(iso).getTime() / 1000),
      temp: { day: dTmax[i], night: dTmin[i] },
      pop: typeof dPopPct[i] === 'number' ? Math.max(0, Math.min(1, dPopPct[i] / 100)) : 0,
    }));

    // Map weathercode to description (simple subset)
    const code = currentWeather.weathercode as number | undefined;
    const desc = (() => {
      if (code === undefined || code === null) return undefined;
      const m: Record<number, string> = {
        0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
        45: 'Fog', 48: 'Depositing rime fog',
        51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
        61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
        71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
        80: 'Rain showers', 81: 'Heavy rain showers', 82: 'Violent rain showers',
        95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
      };
      return m[code] || 'Weather';
    })();

    // Approximate current humidity from the nearest hourly step
    let currentHumidity: number | undefined = undefined;
    if (hourlyArray.length) {
      const idx = hourlyTimes.findIndex((t) => t === currentWeather.time);
      const h = idx >= 0 ? hourlyArray[idx] : hourlyArray[0];
      currentHumidity = h?.humidity;
    }

    const shaped: WeatherResponse = {
      lat, lon,
      timezone,
      current: {
        temp: currentWeather.temperature,
        wind_speed: currentWeather.windspeed,
        humidity: currentHumidity,
        weather: [{ description: desc }],
      },
      hourly: hourlyArray,
      daily: dailyArray,
      alerts: [],
      source: 'open-meteo',
    };
    return shaped;
  }

  private async getWeatherOpenMeteo(lat: number, lon: number): Promise<WeatherResponse> {
    const key = `om:${lat.toFixed(3)},${lon.toFixed(3)}:${this.units()}`;
    const cached = this.cache.get(key);
    if (cached) return cached;

    const tempUnit = this.units() === 'imperial' ? 'fahrenheit' : 'celsius';
    const windUnit = 'ms';
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      current_weather: 'true',
      hourly: 'temperature_2m,precipitation_probability,relative_humidity_2m,wind_speed_10m',
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      timezone: 'auto',
      temperature_unit: tempUnit,
      windspeed_unit: windUnit,
    });
    const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
    const data = await this.fetchJson(url);
    const shaped = this.shapeFromOpenMeteo(lat, lon, data);
    this.cache.set(key, shaped);
    return shaped;
  }

  async getWeather(params: { lat?: number; lon?: number; state?: string; city?: string }): Promise<WeatherResponse> {
    let lat = params.lat;
    let lon = params.lon;

    if ((lat === undefined || lon === undefined) && (params.state || params.city)) {
      const geo = await this.geocode(params.state, params.city);
      if (geo) { lat = geo.lat; lon = geo.lon; }
    }

    if (lat === undefined || lon === undefined) {
      lat = env.WEATHER_DEFAULT_LAT;
      lon = env.WEATHER_DEFAULT_LON;
    }

    if (lat === undefined || lon === undefined) {
      throw Object.assign(new Error('Unable to resolve location for weather'), { status: 400 });
    }

    // Always use Open-Meteo (OWM removed)
    return this.getWeatherOpenMeteo(lat, lon);
  }
}

