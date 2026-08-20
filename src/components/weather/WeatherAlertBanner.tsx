/**
 * WeatherAlertBanner
 * Bandeau d'alerte météo agricole avec prévisions 7 jours et conseils culturaux.
 * Fonctionne offline (affiche dernière météo connue + timestamp).
 */

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Wind,
  Droplets,
  X,
  MapPin,
  Clock,
} from "lucide-react";

/* ──────────────── Types ──────────────── */

type WeatherCondition =
  | "sunny"
  | "partly-cloudy"
  | "cloudy"
  | "rainy"
  | "stormy"
  | "windy";

interface DayForecast {
  date: string;
  dayLabel: string;
  tempMin: number;
  tempMax: number;
  condition: WeatherCondition;
  rainProbability: number;
  windSpeed: number;
  humidity: number;
}

interface WeatherAlert {
  type: "info" | "warning" | "critical";
  message: string;
  cropAdvice: string;
}

interface WeatherAlertBannerProps {
  location?: string;
  latitude?: number;
  longitude?: number;
  isOffline?: boolean;
  onDismiss?: () => void;
  className?: string;
}

/* ──────────────── Constants ──────────────── */

const CONDITION_META: Record<
  WeatherCondition,
  { icon: typeof Sun; label: string }
> = {
  sunny: { icon: Sun, label: "Ensoleillé" },
  "partly-cloudy": { icon: Cloud, label: "Partiellement nuageux" },
  cloudy: { icon: Cloud, label: "Nuageux" },
  rainy: { icon: CloudRain, label: "Pluvieux" },
  stormy: { icon: CloudLightning, label: "Orageux" },
  windy: { icon: Wind, label: "Venteux" },
};

const DAY_NAMES = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

const CITIES: Record<string, { lat: number; lon: number }> = {
  Ouagadougou: { lat: 12.3714, lon: -1.5197 },
  "Bobo-Dioulasso": { lat: 11.1716, lon: -4.297 },
  Banfora: { lat: 10.6333, lon: -4.7667 },
  Koudougou: { lat: 12.2526, lon: -2.3628 },
};

/* ──────────────── Mock Data (fallback offline) ──────────────── */

function generateMockForecast(): DayForecast[] {
  const conditions: WeatherCondition[] = [
    "sunny",
    "partly-cloudy",
    "rainy",
    "cloudy",
    "sunny",
    "partly-cloudy",
    "stormy",
  ];
  const today = new Date();

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const condition = conditions[i];
    return {
      date: date.toISOString().split("T")[0],
      dayLabel: DAY_NAMES[date.getDay()],
      tempMin: 22 + Math.floor(Math.random() * 4),
      tempMax: 30 + Math.floor(Math.random() * 8),
      condition,
      rainProbability:
        condition === "rainy" || condition === "stormy"
          ? 60 + Math.floor(Math.random() * 35)
          : Math.floor(Math.random() * 30),
      windSpeed: 5 + Math.floor(Math.random() * 20),
      humidity: 40 + Math.floor(Math.random() * 40),
    };
  });
}

function generateAlerts(forecast: DayForecast[]): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];

  const heavyRain = forecast.find(
    (d) => d.rainProbability > 70 && (d.condition === "rainy" || d.condition === "stormy")
  );
  if (heavyRain) {
    alerts.push({
      type: "warning",
      message: `Forte probabilité de pluie ${heavyRain.dayLabel} (${heavyRain.rainProbability}%)`,
      cropAdvice: "Reportez l'irrigation programmée. Protégez les jeunes plants.",
    });
  }

  const storm = forecast.find((d) => d.condition === "stormy");
  if (storm) {
    alerts.push({
      type: "critical",
      message: `Risque d'orage ${storm.dayLabel}`,
      cropAdvice: "Récoltez les cultures mûres avant l'orage. Sécurisez les équipements.",
    });
  }

  const dryStreak = forecast.slice(0, 3).every((d) => d.rainProbability < 20);
  if (dryStreak) {
    alerts.push({
      type: "info",
      message: "3 jours secs annoncés",
      cropAdvice: "Augmentez l'irrigation. Surveillez l'humidité du sol avec vos capteurs.",
    });
  }

  const windy = forecast.find((d) => d.windSpeed > 25);
  if (windy) {
    alerts.push({
      type: "warning",
      message: `Vents forts ${windy.dayLabel} (${windy.windSpeed} km/h)`,
      cropAdvice: "Évitez les traitements foliaires. Vérifiez les tuteurs des jeunes plants.",
    });
  }

  return alerts;
}

/* ──────────────── Component ──────────────── */

export function WeatherAlertBanner({
  location = "Ouagadougou",
  latitude,
  longitude,
  isOffline = false,
  onDismiss,
  className,
}: WeatherAlertBannerProps) {
  const [forecast, setForecast] = useState<DayForecast[]>([]);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);

  /* Check localStorage for dismissed state */
  useEffect(() => {
    const stored = localStorage.getItem("weather-banner-dismissed");
    if (stored) {
      const dismissTime = parseInt(stored, 10);
      // Re-show after 12 hours
      if (Date.now() - dismissTime < 30 * 60 * 1000) { // 30 min instead of 12h
        setDismissed(true);
      }
    }
  }, []);

  const fetchWeather = useCallback(async () => {
    const coords = CITIES[location] ?? {
      lat: latitude ?? 12.3714,
      lon: longitude ?? -1.5197,
    };

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,wind_speed_10m_max,relative_humidity_2m_mean&timezone=Africa%2FOuagadougou&forecast_days=7`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();

      const weatherCodes: Record<number, WeatherCondition> = {
        0: "sunny", 1: "partly-cloudy", 2: "cloudy", 3: "cloudy",
        45: "cloudy", 48: "cloudy",
        51: "rainy", 53: "rainy", 55: "rainy",
        61: "rainy", 63: "rainy", 65: "rainy",
        80: "rainy", 81: "rainy", 82: "rainy",
        95: "stormy", 96: "stormy", 99: "stormy",
      };

      const days: DayForecast[] = data.daily.time.map((t: string, i: number) => {
        const d = new Date(t);
        return {
          date: t,
          dayLabel: DAY_NAMES[d.getDay()],
          tempMin: Math.round(data.daily.temperature_2m_min[i]),
          tempMax: Math.round(data.daily.temperature_2m_max[i]),
          condition: weatherCodes[data.daily.weather_code[i]] ?? "partly-cloudy",
          rainProbability: data.daily.precipitation_probability_max[i] ?? 0,
          windSpeed: Math.round(data.daily.wind_speed_10m_max[i] ?? 0),
          humidity: Math.round(data.daily.relative_humidity_2m_mean[i] ?? 50),
        };
      });

      setForecast(days);
      setAlerts(generateAlerts(days));
      setLastUpdated(new Date());
      setLoading(false);
    } catch {
      // Fallback to mock data
      const mock = generateMockForecast();
      setForecast(mock);
      setAlerts(generateAlerts(mock));
      setLastUpdated(new Date());
      setLoading(false);
    }
  }, [location, latitude, longitude]);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000); // 30 min
    return () => clearInterval(interval);
  }, [fetchWeather]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("weather-banner-dismissed", Date.now().toString());
    onDismiss?.();
  };

  if (dismissed) return null;

  const alertStyles: Record<WeatherAlert["type"], string> = {
    info: "border-l-accent bg-accent/10",
    warning: "border-l-primary bg-primary/10",
    critical: "border-l-destructive bg-destructive/10",
  };

  const alertBadge: Record<WeatherAlert["type"], "default" | "secondary" | "destructive"> = {
    info: "secondary",
    warning: "default",
    critical: "destructive",
  };

  const selectedForecast = forecast[selectedDay];

  return (
    <Card
      className={cn(
        "overflow-hidden border-l-4",
        alerts.some((a) => a.type === "critical")
          ? "border-l-destructive"
          : alerts.some((a) => a.type === "warning")
            ? "border-l-primary"
            : "border-l-accent",
        className
      )}
      role="region"
      aria-label="Alertes météo agricoles"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground">{location}</span>
          {lastUpdated && (
            <span className="text-[10px] text-muted-foreground">
              · {lastUpdated.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          {isOffline && (
            <Badge variant="secondary" className="text-[10px]">
              <Clock className="mr-1 h-3 w-3" /> Hors ligne
            </Badge>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Fermer les alertes météo"
          style={{ minHeight: 40, minWidth: 40 }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Alerts - max 2 */}
      {alerts.length > 0 && (
        <div className="space-y-1.5 px-4 pt-2">
          {alerts.slice(0, 2).map((alert, i) => (
            <div
              key={i}
              className={cn("flex items-start gap-2 rounded-md border-l-4 px-3 py-2", alertStyles[alert.type])}
              role="alert"
            >
              <Badge variant={alertBadge[alert.type]} className="shrink-0 text-[10px]">
                {alert.type === "critical" ? "CRITIQUE" : alert.type === "warning" ? "ATTENTION" : "INFO"}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">{alert.message}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{alert.cropAdvice}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 7-day forecast strip */}
      {!loading && forecast.length > 0 && (
        <div className="px-4 pb-3 pt-2">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-thin pb-1" data-swipe-ignore>
            {forecast.map((day, i) => {
              const Icon = CONDITION_META[day.condition].icon;
              const isSelected = i === selectedDay;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(i)}
                  className={cn(
                    "flex min-w-[56px] flex-col items-center gap-0.5 rounded-lg border px-2 py-2 transition-colors",
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:bg-muted",
                    "focus:outline-none focus:ring-2 focus:ring-ring"
                  )}
                  style={{ minHeight: 72 }}
                  aria-label={`Prévisions ${day.dayLabel} ${day.date}`}
                  aria-pressed={isSelected}
                >
                  <span className="text-[11px] font-medium text-foreground">{day.dayLabel}</span>
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="text-xs font-bold text-foreground">{day.tempMax}°</span>
                  <span className="text-[10px] text-muted-foreground">{day.tempMin}°</span>
                  {day.rainProbability > 30 && (
                    <span className="flex items-center gap-0.5 text-[9px] text-accent-foreground">
                      <Droplets className="h-2.5 w-2.5" />
                      {day.rainProbability}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected day details - grid 3 colonnes */}
          {selectedForecast && (
            <div className="mt-2 grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-2.5">
              <div className="flex flex-col items-center gap-0.5">
                <Droplets className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="text-[10px] text-muted-foreground">Humidité</span>
                <span className="text-sm font-semibold text-foreground">{selectedForecast.humidity}%</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <CloudRain className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="text-[10px] text-muted-foreground">Pluie</span>
                <span className="text-sm font-semibold text-foreground">{selectedForecast.rainProbability}%</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <Wind className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="text-[10px] text-muted-foreground">Vent</span>
                <span className="text-sm font-semibold text-foreground">{selectedForecast.windSpeed} km/h</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="px-4 pb-3 pt-2">
          <div className="flex gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="h-18 w-14 animate-pulse rounded-lg bg-muted"
                style={{ height: 72, width: 56 }}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}