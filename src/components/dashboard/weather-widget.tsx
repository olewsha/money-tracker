import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Cloudy,
  Droplets,
  MapPin,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  Wind,
} from 'lucide-react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const TBILISI = {
  lat: 41.7151,
  lon: 44.8271,
  name: 'Тбилиси',
} as const

const API_URL =
  `https://api.open-meteo.com/v1/forecast` +
  `?latitude=${TBILISI.lat}&longitude=${TBILISI.lon}` +
  `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m` +
  `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset` +
  `&timezone=Asia%2FTbilisi&forecast_days=3&wind_speed_unit=kmh&temperature_unit=celsius`

type WeatherGroup = 'clear' | 'cloud' | 'rain' | 'snow' | 'storm' | 'fog'

type OpenMeteoResponse = {
  current: {
    time: string
    temperature_2m: number
    relative_humidity_2m: number
    apparent_temperature: number
    is_day: 0 | 1
    precipitation: number
    weather_code: number
    wind_speed_10m: number
  }
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_probability_max: number[]
    sunrise: string[]
    sunset: string[]
  }
}

function describeWeather(code: number, isDay: 0 | 1 = 1): { label: string; group: WeatherGroup } {
  if (code === 0) return { label: isDay ? 'Ясно' : 'Ясная ночь', group: 'clear' }
  if (code === 1) return { label: 'В основном ясно', group: 'clear' }
  if (code === 2) return { label: 'Переменная облачность', group: 'cloud' }
  if (code === 3) return { label: 'Пасмурно', group: 'cloud' }
  if (code === 45 || code === 48) return { label: 'Туман', group: 'fog' }
  if (code >= 51 && code <= 57) return { label: 'Морось', group: 'rain' }
  if (code >= 61 && code <= 67) return { label: 'Дождь', group: 'rain' }
  if (code >= 71 && code <= 77) return { label: 'Снег', group: 'snow' }
  if (code >= 80 && code <= 82) return { label: 'Ливень', group: 'rain' }
  if (code >= 85 && code <= 86) return { label: 'Снегопад', group: 'snow' }
  if (code === 95) return { label: 'Гроза', group: 'storm' }
  if (code === 96 || code === 99) return { label: 'Гроза с градом', group: 'storm' }
  return { label: 'Погода', group: 'cloud' }
}

function WeatherGlyph({
  code,
  isDay = 1,
  className,
  strokeWidth = 1.5,
}: {
  code: number
  isDay?: 0 | 1
  className?: string
  strokeWidth?: number
}) {
  const common = { className, strokeWidth }

  if (code === 0) return isDay ? <Sun {...common} /> : <Moon {...common} />
  if (code === 1) return isDay ? <CloudSun {...common} /> : <Moon {...common} />
  if (code === 2) return <CloudSun {...common} />
  if (code === 3) return <Cloudy {...common} />
  if (code === 45 || code === 48) return <CloudFog {...common} />
  if (code >= 51 && code <= 57) return <CloudDrizzle {...common} />
  if (code >= 61 && code <= 67) return <CloudRain {...common} />
  if (code >= 71 && code <= 77) return <CloudSnow {...common} />
  if (code >= 80 && code <= 82) return <CloudRain {...common} />
  if (code >= 85 && code <= 86) return <CloudSnow {...common} />
  if (code === 95) return <CloudLightning {...common} />
  if (code === 96 || code === 99) return <CloudHail {...common} />
  return <Cloud {...common} />
}

async function fetchWeather(): Promise<OpenMeteoResponse | null> {
  try {
    const res = await fetch(API_URL, { next: { revalidate: 600 } })
    if (!res.ok) return null
    return (await res.json()) as OpenMeteoResponse
  } catch {
    return null
  }
}

function formatTemp(t: number) {
  return `${Math.round(t)}°`
}

function formatTime(iso: string) {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tbilisi',
  }).format(date)
}

function formatWeekday(iso: string, index: number) {
  if (index === 0) return 'Сег.'
  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
    timeZone: 'Asia/Tbilisi',
  }).format(new Date(iso))
}

function RainLayer({ density = 10 }: { density?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: density }).map((_, i) => {
        const left = (i * 100) / density + (i % 3) * 1.5
        const duration = 0.7 + ((i * 37) % 9) / 10
        const delay = ((i * 13) % 20) / 10
        const height = 10 + ((i * 7) % 8)
        return (
          <span
            key={i}
            className="absolute top-0 w-px bg-gradient-to-b from-transparent via-sky-200/80 to-sky-100/0 dark:via-sky-300/70"
            style={{
              left: `${left}%`,
              height: `${height}px`,
              animation: `weather-rain-fall ${duration}s linear ${delay}s infinite`,
            }}
          />
        )
      })}
    </div>
  )
}

function SnowLayer({ density = 12 }: { density?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: density }).map((_, i) => {
        const left = (i * 100) / density + ((i * 11) % 5)
        const duration = 4 + ((i * 17) % 30) / 10
        const delay = ((i * 23) % 40) / 10
        const size = 2 + ((i * 5) % 3)
        return (
          <span
            key={i}
            className="absolute top-0 rounded-full bg-white/80 shadow-[0_0_4px_rgba(255,255,255,0.7)]"
            style={{
              left: `${left}%`,
              width: `${size}px`,
              height: `${size}px`,
              animation: `weather-snow-fall ${duration}s linear ${delay}s infinite`,
            }}
          />
        )
      })}
    </div>
  )
}

function SunLayer({ isDay = 1 }: { isDay?: 0 | 1 }) {
  if (!isDay) {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-8 -right-8 size-32 rounded-full bg-indigo-300/30 blur-2xl" />
      </div>
    )
  }
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -top-12 -right-12 size-40 rounded-full blur-xl"
        style={{
          backgroundImage:
            'radial-gradient(closest-side, rgba(253,224,71,0.75), rgba(251,146,60,0.4) 55%, transparent 75%)',
          animation: 'weather-sun-pulse 4s ease-in-out infinite',
        }}
      />
    </div>
  )
}

function CloudLayer() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute top-2 h-8 w-24 rounded-full bg-white/40 blur-lg dark:bg-white/15"
        style={{ animation: 'weather-cloud-drift 35s linear infinite' }}
      />
    </div>
  )
}

function FogLayer() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-x-0 top-1/3 h-10 bg-gradient-to-r from-transparent via-white/50 to-transparent blur-md dark:via-white/15"
        style={{ animation: 'weather-fog-drift 8s ease-in-out infinite' }}
      />
    </div>
  )
}

function StormLayer() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <RainLayer density={14} />
      <div
        className="absolute inset-0 bg-white/70 mix-blend-overlay dark:bg-white/30"
        style={{ animation: 'weather-lightning-flash 6s ease-in-out infinite' }}
      />
    </div>
  )
}

function WeatherBackground({ group, isDay }: { group: WeatherGroup; isDay: 0 | 1 }) {
  const gradient = (() => {
    if (group === 'clear' && isDay) {
      return 'bg-gradient-to-br from-amber-100/70 via-sky-100/60 to-sky-200/70 dark:from-amber-500/20 dark:via-indigo-500/15 dark:to-sky-700/25'
    }
    if (group === 'clear' && !isDay) {
      return 'bg-gradient-to-br from-indigo-200/70 via-violet-200/60 to-slate-300/70 dark:from-indigo-950 dark:via-violet-900/40 dark:to-slate-900'
    }
    if (group === 'cloud') {
      return 'bg-gradient-to-br from-slate-100/80 via-sky-100/60 to-slate-200/80 dark:from-slate-700/40 dark:via-slate-600/30 dark:to-slate-800/50'
    }
    if (group === 'rain') {
      return 'bg-gradient-to-br from-sky-200/70 via-slate-200/70 to-slate-300/80 dark:from-sky-900/40 dark:via-slate-800/40 dark:to-slate-900/60'
    }
    if (group === 'snow') {
      return 'bg-gradient-to-br from-white/90 via-sky-100/70 to-slate-100/80 dark:from-slate-700/40 dark:via-slate-600/40 dark:to-slate-800/60'
    }
    if (group === 'storm') {
      return 'bg-gradient-to-br from-slate-300/80 via-slate-400/70 to-slate-500/80 dark:from-slate-800/70 dark:via-slate-900/70 dark:to-black/70'
    }
    return 'bg-gradient-to-br from-slate-100/80 via-slate-200/70 to-slate-300/80 dark:from-slate-700/40 dark:via-slate-800/40 dark:to-slate-900/60'
  })()

  return (
    <>
      <div className={cn('absolute inset-0', gradient)} aria-hidden />
      {group === 'clear' && <SunLayer isDay={isDay} />}
      {group === 'cloud' && <CloudLayer />}
      {group === 'rain' && <RainLayer />}
      {group === 'snow' && <SnowLayer />}
      {group === 'storm' && <StormLayer />}
      {group === 'fog' && <FogLayer />}
    </>
  )
}

export async function WeatherWidget() {
  const data = await fetchWeather()

  if (!data) {
    return (
      <Card className="relative p-3 text-xs text-muted-foreground" size="sm">
        Не удалось загрузить погоду
      </Card>
    )
  }

  const { current, daily } = data
  const info = describeWeather(current.weather_code, current.is_day)

  return (
    <Card
      className="group relative isolate overflow-hidden border-0 ring-1 ring-foreground/10 backdrop-blur-xl"
      size="sm"
    >
      <WeatherBackground group={info.group} isDay={current.is_day} />

      <div
        className="relative z-10 flex flex-col gap-2.5 p-3"
        style={{ animation: 'weather-fade-in 400ms ease-out' }}
      >
        <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-foreground/65">
          <MapPin className="size-2.5 shrink-0" />
          <span className="truncate">{TBILISI.name}</span>
          <span className="text-foreground/35">·</span>
          <span className="truncate font-normal normal-case tracking-normal">{info.label}</span>
        </p>

        <div className="flex items-center gap-2.5">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/40 ring-1 ring-white/40 backdrop-blur-md dark:bg-white/10 dark:ring-white/15">
            <WeatherGlyph
              code={current.weather_code}
              isDay={current.is_day}
              className="size-6 text-foreground drop-shadow-sm"
              strokeWidth={1.5}
            />
          </div>
          <div className="min-w-0 leading-none">
            <p className="font-mono text-3xl font-semibold tabular-nums tracking-tight text-foreground">
              {formatTemp(current.temperature_2m)}
            </p>
            <p className="mt-1 truncate text-[10px] text-foreground/65">
              Ощущ. {formatTemp(current.apparent_temperature)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-foreground/75">
          <span className="inline-flex items-center gap-1">
            <Wind className="size-2.5 shrink-0" />
            {Math.round(current.wind_speed_10m)} км/ч
          </span>
          <span className="text-foreground/25">·</span>
          <span className="inline-flex items-center gap-1">
            <Droplets className="size-2.5 shrink-0" />
            {Math.round(current.relative_humidity_2m)}%
          </span>
          <span className="text-foreground/25">·</span>
          <span className="inline-flex items-center gap-1">
            Дождь {Math.round(daily.precipitation_probability_max[0] ?? 0)}%
          </span>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-white/30 px-2 py-1.5 text-[10px] ring-1 ring-white/30 backdrop-blur-md dark:bg-white/5 dark:ring-white/10">
          <span className="inline-flex items-center gap-1 text-foreground/75">
            <Sunrise className="size-3 text-amber-500 dark:text-amber-300" />
            <span className="font-mono tabular-nums">{formatTime(daily.sunrise[0])}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-foreground/75">
            <Sunset className="size-3 text-orange-500 dark:text-orange-300" />
            <span className="font-mono tabular-nums">{formatTime(daily.sunset[0])}</span>
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1">
          {daily.time.slice(0, 3).map((day, i) => {
            const tmax = daily.temperature_2m_max[i]
            const tmin = daily.temperature_2m_min[i]
            const code = daily.weather_code[i]
            return (
              <div
                key={day}
                className="flex flex-col items-center gap-0.5 rounded-lg bg-white/30 px-1 py-1.5 text-center ring-1 ring-white/30 backdrop-blur-md dark:bg-white/5 dark:ring-white/10"
              >
                <span className="text-[9px] font-medium uppercase tracking-wide text-foreground/55">
                  {formatWeekday(day, i)}
                </span>
                <WeatherGlyph code={code} className="size-3.5 text-foreground/90" strokeWidth={1.6} />
                <div className="flex items-baseline gap-0.5 font-mono text-[10px] tabular-nums">
                  <span className="font-semibold text-foreground">{formatTemp(tmax)}</span>
                  <span className="text-foreground/45">{formatTemp(tmin)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
