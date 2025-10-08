// server/src/services/AdvisoryEngine.ts
import { WeatherService, WeatherResponse } from './WeatherService';

export type Advisory = {
  key: string; // stable identifier, e.g., RAIN_HIGH_24H
  text: string; // human-readable guidance
  severity: 'info' | 'warning' | 'critical';
};

export type AdvisoryParams = {
  lat?: number;
  lon?: number;
  state?: string;
  city?: string;
  crop?: string;
};

export class AdvisoryEngine {
  private weather = new WeatherService();

  private computeFromWeather(w: WeatherResponse, ctx: { crop?: string }): Advisory[] {
    const advisories: Advisory[] = [];

    const hourly: any[] = Array.isArray(w.hourly) ? w.hourly : [];
    const daily: any[] = Array.isArray(w.daily) ? w.daily : [];
    const current = w.current || {};

    const popNext24 = Math.round(
      Math.max(
        ...hourly.slice(0, 24).map((h: any) => (typeof h?.pop === 'number' ? h.pop : 0)),
        0,
      ) * 100,
    );

    const windMaxNext24 = Math.max(
      typeof current?.wind_speed === 'number' ? current.wind_speed : 0,
      ...hourly.slice(0, 24).map((h: any) => (typeof h?.wind_speed === 'number' ? h.wind_speed : 0)),
      0,
    );

    const tempMaxNext3d = Math.max(
      typeof current?.temp === 'number' ? current.temp : 0,
      ...daily.slice(0, 3).map((d: any) => (typeof d?.temp?.day === 'number' ? d.temp.day : 0)),
      0,
    );

    const highHumidityNow = typeof current?.humidity === 'number' ? current.humidity >= 85 : false;

    // Rain advisories
    if (popNext24 >= 70) {
      advisories.push({
        key: 'RAIN_VERY_HIGH_24H',
        text: 'Very high chance of rain in the next 24h. Delay spraying and ensure field drainage.',
        severity: 'critical',
      });
    } else if (popNext24 >= 50) {
      advisories.push({
        key: 'RAIN_HIGH_24H',
        text: 'High chance of rain in the next 24h. Plan irrigation and fertilizer accordingly; avoid spraying if possible.',
        severity: 'warning',
      });
    }

    // Wind advisories (m/s)
    if (windMaxNext24 >= 10) {
      advisories.push({
        key: 'WIND_VERY_HIGH',
        text: 'Strong winds expected. Avoid spraying and secure temporary structures.',
        severity: 'critical',
      });
    } else if (windMaxNext24 >= 8) {
      advisories.push({
        key: 'WIND_HIGH',
        text: 'Windy conditions ahead. Avoid pesticide spraying and provide support to tender plants.',
        severity: 'warning',
      });
    }

    // Heat advisories (Celsius)
    if (tempMaxNext3d >= 37) {
      advisories.push({
        key: 'HEAT_VERY_HIGH',
        text: 'Very high temperatures expected. Irrigate early/late and provide shade for sensitive crops.',
        severity: 'critical',
      });
    } else if (tempMaxNext3d >= 34) {
      advisories.push({
        key: 'HEAT_HIGH',
        text: 'Hot conditions expected. Mulch to conserve moisture and avoid mid-day operations.',
        severity: 'warning',
      });
    }

    // Humidity + temp (fungal risk)
    if (highHumidityNow && tempMaxNext3d >= 30) {
      advisories.push({
        key: 'FUNGAL_RISK',
        text: 'High humidity and heat may favor fungal diseases. Ensure airflow and monitor for leaf spots.',
        severity: 'info',
      });
    }

    // Crop-specific hints (Kerala staples)
    if (ctx.crop) {
      const cropLc = ctx.crop.toLowerCase();
      if (cropLc.includes('rice') || cropLc.includes('paddy')) {
        if (popNext24 >= 50) {
          advisories.push({
            key: 'RICE_RAIN_MANAGEMENT',
            text: 'Rice: with rain likely, strengthen bunds and manage drainage to reduce lodging/nutrient loss.',
            severity: popNext24 >= 70 ? 'warning' : 'info',
          });
        }
        if (highHumidityNow && tempMaxNext3d >= 28) {
          advisories.push({
            key: 'RICE_FUNGAL_RISK',
            text: 'Rice: humidity and warmth may favor blast/leaf spot. Improve airflow; scout regularly.',
            severity: 'info',
          });
        }
      }
      if (cropLc.includes('coconut') || cropLc.includes('coco')) {
        if (windMaxNext24 >= 10) {
          advisories.push({
            key: 'COCONUT_WIND_CRITICAL',
            text: 'Coconut: strong winds expected. Risk of frond/nut fall; secure young palms and avoid climbing.',
            severity: 'critical',
          });
        } else if (windMaxNext24 >= 8) {
          advisories.push({
            key: 'COCONUT_WIND_WARNING',
            text: 'Coconut: windy conditions. Inspect for loose fronds and avoid pesticide spraying.',
            severity: 'warning',
          });
        }
        if (tempMaxNext3d >= 34) {
          advisories.push({
            key: 'COCONUT_HEAT_WATER',
            text: 'Coconut: schedule basin irrigation and mulch to reduce heat stress and conserve moisture.',
            severity: tempMaxNext3d >= 37 ? 'warning' : 'info',
          });
        }
      }
    }

    return advisories;
  }

  async getAdvisories(params: AdvisoryParams): Promise<{ advisories: Advisory[]; weather: WeatherResponse }> {
    const weather = await this.weather.getWeather(params);
    const advisories = this.computeFromWeather(weather, { crop: params.crop });
    return { advisories, weather };
  }
}