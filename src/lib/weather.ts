/**
 * Highland weather snapshot for Wright Park.
 *
 * Data is fetched on the server (at build time for this static site) and kept in a
 * short-lived cache so that every page render reuses one request per build.
 *
 * On top of the raw numbers the module exposes a small rule engine: it turns the
 * forecast into plain, actionable advice grouped into risk / outfit / plan / gear,
 * so visitors read "bring a raincoat" instead of "relative humidity 82%".
 */

export type WeatherGroup =
  | 'clear'
  | 'mainlyClear'
  | 'partly'
  | 'overcast'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'freezingRain'
  | 'snow'
  | 'showers'
  | 'snowShowers'
  | 'thunder'
  | 'thunderHail'
  | 'unknown';

export type AdviceCategory = 'risk' | 'outfit' | 'plan' | 'gear';

export interface DailyForecast {
  date: string;
  code: number;
  max: number;
  min: number;
  precipProb: number | null;
  precipSum: number | null;
  uvIndex: number | null;
  windMax: number | null;
}

export interface WeatherAdvice {
  /** Rule ids that describe a safety risk — rendered on top, in red. */
  risk: string[];
  /** Rule ids for what to wear. */
  outfit: string[];
  /** Rule ids for how to plan the visit. */
  plan: string[];
  /** Rule ids for what to carry. */
  gear: string[];
}

export interface WeatherSnapshot {
  observedAt: string;
  fetchedAt: string;
  elevation: number;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  windGusts: number | null;
  uvIndex: number | null;
  code: number;
  daily: DailyForecast[];
}

const ENDPOINT = 'https://api.open-meteo.com/v1/forecast';
const CACHE_TTL_MS = 30 * 60 * 1000;

/** Fallback elevation of the park, used when the service omits it. */
const FALLBACK_ELEVATION_M = 1475;

type CacheEntry = { value: WeatherSnapshot | null; expiresAt: number };
const cacheStore: { entry?: CacheEntry } = ((globalThis as any).__wrightParkWeather ??= {});

const codeGroups: Array<[number[], WeatherGroup]> = [
  [[0], 'clear'],
  [[1], 'mainlyClear'],
  [[2], 'partly'],
  [[3], 'overcast'],
  [[45, 48], 'fog'],
  [[51, 53, 55, 56, 57], 'drizzle'],
  [[61, 63, 65, 66, 67], 'rain'],
  [[71, 73, 75, 77], 'snow'],
  [[80, 81, 82], 'showers'],
  [[85, 86], 'snowShowers'],
  [[95], 'thunder'],
  [[96, 99], 'thunderHail'],
];

const HEAVY_RAIN_CODES = [65, 67, 82];
const WET_GROUPS: WeatherGroup[] = ['drizzle', 'rain', 'showers', 'thunder', 'thunderHail'];
const RAINY_SEASON_MONTHS = [6, 7, 8, 9, 10];
const RISK_PRIORITY = ['thunder', 'heavyRain', 'windStrong', 'fog', 'landslide'];

export function weatherGroup(code: number): WeatherGroup {
  for (const [codes, group] of codeGroups) {
    if (codes.includes(code)) return group;
  }
  return 'unknown';
}

/** Icon set used by the weather cards (see components/Icon.astro). */
export function weatherIcon(code: number): string {
  const group = weatherGroup(code);
  switch (group) {
    case 'clear':
    case 'mainlyClear':
      return 'sun';
    case 'partly':
    case 'overcast':
      return 'cloud';
    case 'fog':
      return 'fog';
    case 'drizzle':
      return 'drizzle';
    case 'rain':
    case 'showers':
      return 'rain';
    case 'freezingRain':
    case 'snow':
    case 'snowShowers':
      return 'snow';
    case 'thunder':
    case 'thunderHail':
      return 'thunder';
    default:
      return 'cloud';
  }
}

/** Beaufort force (0–12) for a wind speed given in km/h. */
export function beaufort(kmh: number): number {
  const limits = [1, 5, 11, 19, 28, 38, 49, 61, 74, 88, 102, 117];
  for (let level = 0; level < limits.length; level += 1) {
    if (kmh < limits[level]) return level;
  }
  return 12;
}

/** Plain-language band for a Beaufort force. */
export function windLevel(force: number): 'calm' | 'light' | 'moderate' | 'strong' | 'gale' {
  if (force <= 2) return 'calm';
  if (force === 3) return 'light';
  if (force === 4) return 'moderate';
  if (force <= 6) return 'strong';
  return 'gale';
}

/** Plain-language band for humidity — visitors do not need a percentage. */
export function humidityLevel(humidity: number): 'humid' | 'comfortable' | 'fresh' | 'dry' {
  if (humidity >= 80) return 'humid';
  if (humidity >= 60) return 'comfortable';
  if (humidity >= 40) return 'fresh';
  return 'dry';
}

/** Plain-language band for the UV index. */
export function uvLevel(index: number): 'low' | 'moderate' | 'high' | 'veryHigh' | 'extreme' {
  if (index >= 11) return 'extreme';
  if (index >= 8) return 'veryHigh';
  if (index >= 6) return 'high';
  if (index >= 3) return 'moderate';
  return 'low';
}

/** One short packing tip per forecast day, used as a chip in the 7-day list. */
export function dayTip(day: DailyForecast): string {
  const group = weatherGroup(day.code);
  if (group === 'thunder' || group === 'thunderHail') return 'raincoat';
  if ((day.precipSum ?? 0) >= 10 || HEAVY_RAIN_CODES.includes(day.code)) return 'raincoat';
  if ((day.precipProb ?? 0) >= 60) return 'umbrella';
  if (beaufort(day.windMax ?? 0) >= 7) return 'wind';
  if (group === 'fog') return 'fog';
  if ((day.uvIndex ?? 0) >= 6) return 'sun';
  if (day.min <= 14) return 'jacket';
  return 'ok';
}

/**
 * Turns the snapshot into rule ids per advice category. Nothing is rendered for
 * conditions that are not met, so the page never shows an umbrella on a dry day.
 */
export function buildAdvice(snapshot: WeatherSnapshot): WeatherAdvice {
  const today = snapshot.daily[0];
  const group = weatherGroup(snapshot.code);
  const max = today?.max ?? snapshot.temperature;
  const min = today?.min ?? snapshot.temperature;
  const prob = today?.precipProb ?? 0;
  const sum = today?.precipSum ?? snapshot.precipitation;
  const uv = today?.uvIndex ?? snapshot.uvIndex ?? 0;
  const wind = Math.max(snapshot.windSpeed, today?.windMax ?? 0);
  const force = beaufort(wind);
  const month = Number((today?.date ?? '').slice(5, 7));

  const risk: string[] = [];
  const outfit: string[] = [];
  const plan: string[] = [];
  const gear: string[] = [];
  const add = (list: string[], id: string) => {
    if (!list.includes(id)) list.push(id);
  };

  // Rain: thunderstorm > heavy rain > likely rain > light rain.
  const isThunder = group === 'thunder' || group === 'thunderHail';
  const isHeavy = HEAVY_RAIN_CODES.includes(snapshot.code) || sum >= 10;
  const isWet = WET_GROUPS.includes(group) || snapshot.precipitation > 0;

  if (isThunder) {
    add(risk, 'thunder');
    add(plan, 'thunder');
    add(gear, 'thunder');
  } else if (isHeavy) {
    add(risk, 'heavyRain');
    add(plan, 'heavyRain');
    add(gear, 'heavyRain');
  } else if (prob >= 60) {
    add(outfit, 'rainLikely');
    add(plan, 'rainLikely');
    add(gear, 'rainLikely');
  } else if (isWet) {
    add(outfit, 'lightRain');
    add(plan, 'lightRain');
    add(gear, 'lightRain');
  }

  // Ultraviolet — highland sun burns even on cool days.
  if (uv >= 6) {
    add(outfit, 'uvStrong');
    add(plan, 'uvStrong');
    add(gear, 'uvStrong');
  } else if (uv >= 3) {
    add(gear, 'uvModerate');
  }

  // Temperature and the day-to-night swing.
  if (max >= 32) {
    add(outfit, 'hot');
    add(plan, 'hot');
    add(gear, 'hot');
  } else if (max >= 28) {
    add(gear, 'warm');
  }
  if (max <= 10) {
    add(outfit, 'coldDay');
    add(plan, 'coldDay');
    add(gear, 'coldDay');
  } else if (min <= 12) {
    add(outfit, 'coldMorning');
  }
  if (max - min > 8) {
    add(outfit, 'bigRange');
    if (!plan.length) add(plan, 'bigRange');
  }

  // Wind.
  if (force >= 7) {
    add(risk, 'windStrong');
    add(plan, 'windStrong');
  } else if (force >= 5) {
    add(plan, 'windBreezy');
    add(gear, 'windBreezy');
  }

  // Sky, fog and how the air feels.
  if (group === 'clear' || group === 'mainlyClear') {
    add(plan, 'clear');
    add(gear, 'clear');
  } else if (group === 'overcast' || group === 'partly') {
    add(plan, 'overcast');
  }
  if (group === 'fog') {
    add(risk, 'fog');
    add(plan, 'fog');
    add(gear, 'fog');
  }
  if (snapshot.humidity >= 80) {
    add(plan, 'humid');
  } else if (snapshot.humidity <= 40) {
    add(gear, 'dry');
  }

  // Mountain context — always relevant at 1,400 m+.
  add(plan, 'highland');
  if (RAINY_SEASON_MONTHS.includes(month) && (prob >= 70 || sum >= 15)) {
    add(risk, 'landslide');
  }

  risk.sort((a, b) => RISK_PRIORITY.indexOf(a) - RISK_PRIORITY.indexOf(b));
  return { risk, outfit, plan, gear };
}

function buildRequest(lat: number, lng: number): string {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,uv_index',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max',
    timezone: 'Asia/Manila',
    forecast_days: '7',
    wind_speed_unit: 'kmh',
  });
  return `${ENDPOINT}?${params.toString()}`;
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toSnapshot(raw: any): WeatherSnapshot | null {
  const current = raw?.current;
  const daily = raw?.daily;
  if (!current || !daily || !Array.isArray(daily.time)) return null;

  const temperature = num(current.temperature_2m);
  if (temperature === null) return null;

  const times: string[] = daily.time;
  const forecast: DailyForecast[] = times.map((date, i) => ({
    date,
    code: num(daily.weather_code?.[i]) ?? 0,
    max: Math.round(num(daily.temperature_2m_max?.[i]) ?? temperature),
    min: Math.round(num(daily.temperature_2m_min?.[i]) ?? temperature),
    precipProb: num(daily.precipitation_probability_max?.[i]),
    precipSum: num(daily.precipitation_sum?.[i]),
    uvIndex: num(daily.uv_index_max?.[i]),
    windMax: num(daily.wind_speed_10m_max?.[i]),
  }));

  return {
    observedAt: typeof current.time === 'string' ? current.time : '',
    fetchedAt: new Date().toISOString(),
    elevation: Math.round(num(raw?.elevation) ?? FALLBACK_ELEVATION_M),
    temperature,
    apparentTemperature: num(current.apparent_temperature) ?? temperature,
    humidity: num(current.relative_humidity_2m) ?? 0,
    precipitation: num(current.precipitation) ?? 0,
    windSpeed: num(current.wind_speed_10m) ?? 0,
    windGusts: num(current.wind_gusts_10m),
    uvIndex: num(current.uv_index),
    code: num(current.weather_code) ?? 0,
    daily: forecast,
  };
}

/**
 * Returns the cached snapshot, or fetches a fresh one from the weather service.
 * Resolves to `null` when the service cannot be reached, so pages can fall back
 * to seasonal climate guidance instead of showing placeholder numbers.
 */
export async function getWeather(lat: number, lng: number): Promise<WeatherSnapshot | null> {
  const now = Date.now();
  const cached = cacheStore.entry;
  if (cached && cached.expiresAt > now) return cached.value;

  let value: WeatherSnapshot | null = null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(buildRequest(lat, lng), {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    });
    clearTimeout(timer);
    if (response.ok) {
      value = toSnapshot(await response.json());
    }
  } catch {
    value = null;
  }

  cacheStore.entry = { value, expiresAt: now + CACHE_TTL_MS };
  return value;
}

/** Short weekday + day label for a `YYYY-MM-DD` string, in Asia/Manila time. */
export function formatDay(date: string, locale: string): string {
  const [y, m, d] = date.split('-').map((v) => Number(v));
  if (!y || !m || !d) return date;
  return new Intl.DateTimeFormat(locale === 'tl' ? 'fil-PH' : 'en-PH', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Manila',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** Local clock label for an ISO timestamp, rendered in Asia/Manila time. */
export function formatClock(iso: string, locale: string): string {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return '';
  return new Intl.DateTimeFormat(locale === 'tl' ? 'fil-PH' : 'en-PH', {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Manila',
  }).format(value);
}
