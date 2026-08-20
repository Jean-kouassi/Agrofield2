import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface WeatherForecast {
  time: string;
  temperature: number;
  condition: "sunny" | "cloudy" | "rainy" | "stormy" | "partly-cloudy";
  rainProbability: number;
}

interface WeatherMiniCardProps {
  className?: string;
  autoFetch?: boolean;
  location?: string;
}

const weatherIcons: Record<string, string> = {
  sunny: "☀️",
  cloudy: "☁️",
  rainy: "🌧️",
  stormy: "⛈️",
  "partly-cloudy": "⛅",
};

const weatherCodes: Record<number, keyof typeof weatherIcons> = {
  0: "sunny",
  1: "partly-cloudy",
  2: "cloudy",
  3: "cloudy",
  45: "cloudy",
  48: "cloudy",
  51: "rainy",
  53: "rainy",
  55: "rainy",
  61: "rainy",
  63: "rainy",
  65: "rainy",
  80: "rainy",
  81: "rainy",
  82: "rainy",
  95: "stormy",
  96: "stormy",
  99: "stormy",
};

export function WeatherMiniCard({ className, autoFetch = true, location = "Ouagadougou" }: WeatherMiniCardProps) {
  const [temperature, setTemperature] = useState<number>(32);
  const [condition, setCondition] = useState<"sunny" | "cloudy" | "rainy" | "stormy" | "partly-cloudy">("partly-cloudy");
  const [rainProbability, setRainProbability] = useState<number>(45);
  const [forecast, setForecast] = useState<WeatherForecast[]>([]);
  const [loading, setLoading] = useState(autoFetch);

  useEffect(() => {
    if (!autoFetch) return;

    // Coordonnées de Ouagadougou
    const lat = 12.3714;
    const lon = -1.5197;

    async function fetchWeather() {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,precipitation_probability&hourly=temperature_2m,weather_code,precipitation_probability&timezone=Africa%2FOuagadougou&forecast_days=1`
        );
        
        if (!response.ok) throw new Error("Erreur réseau");
        
        const data = await response.json();
        
        // Météo actuelle
        const currentCondition = weatherCodes[data.current.weather_code] || "partly-cloudy";
        setTemperature(Math.round(data.current.temperature_2m));
        setCondition(currentCondition as any);
        setRainProbability(data.current.precipitation_probability || 45);
        
        // Prévisions des prochaines heures
        const currentHour = new Date().getHours();
        const nextHours: WeatherForecast[] = [];
        
        for (let i = 1; i <= 5; i++) {
          const hourIndex = currentHour + i;
          if (hourIndex < data.hourly.time.length) {
            nextHours.push({
              time: `${hourIndex}:00`,
              temperature: Math.round(data.hourly.temperature_2m[hourIndex]),
              condition: (weatherCodes[data.hourly.weather_code[hourIndex]] || "sunny") as any,
              rainProbability: data.hourly.precipitation_probability[hourIndex] || 0,
            });
          }
        }
        
        setForecast(nextHours.slice(0, 4));
        setLoading(false);
      } catch (err) {
        console.error("Erreur météo:", err);
        setLoading(false);
        // Données de fallback
        setForecast([
          { time: "11:00", temperature: 33, condition: "sunny", rainProbability: 30 },
          { time: "12:00", temperature: 35, condition: "sunny", rainProbability: 20 },
          { time: "13:00", temperature: 36, condition: "partly-cloudy", rainProbability: 35 },
          { time: "14:00", temperature: 34, condition: "cloudy", rainProbability: 45 },
        ]);
      }
    }

    fetchWeather();
    
    // Rafraîchir toutes les 30 minutes
    const intervalId = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [autoFetch, location]);

  if (loading) {
    return (
      <div className={cn("flex items-center gap-3 rounded-lg border bg-gradient-to-r from-agro-sky/10 to-agro-pale p-3 shadow-sm animate-pulse", className)}>
        <div className="h-8 w-8 bg-muted rounded-full" />
        <div className="flex-1">
          <div className="h-6 w-16 bg-muted rounded mb-1" />
          <div className="h-4 w-12 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3 rounded-lg border bg-gradient-to-r from-agro-sky/10 to-agro-pale p-3 shadow-sm", className)}>
      {/* Météo actuelle */}
      <div className="flex items-center gap-3">
        <div className="text-3xl" aria-hidden="true">
          {weatherIcons[condition]}
        </div>
        
        <div className="flex-1">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-agro-primary">{temperature}</span>
            <span className="text-sm text-muted-foreground">°C</span>
          </div>
          
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-agro-sky">🌧️</span>
            <span className="text-xs font-medium text-agro-sky">
              {rainProbability}%
            </span>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground text-right">
          {location}
        </div>
      </div>
      
      {/* Prévisions des prochaines heures */}
      {forecast.length > 0 && (
        <div className="border-t pt-3">
          <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Prévisions (prochaines heures)
          </p>
          <div className="grid grid-cols-4 gap-2">
            {forecast.map((hour, index) => (
              <div
                key={index}
                className="flex flex-col items-center gap-1 rounded-md bg-background/50 p-2 text-center"
              >
                <span className="text-[9px] font-medium text-muted-foreground">
                  {hour.time}
                </span>
                <span className="text-xl">{weatherIcons[hour.condition]}</span>
                <span className="text-xs font-bold text-agro-primary">
                  {hour.temperature}°
                </span>
                {hour.rainProbability > 30 && (
                  <span className="text-[8px] text-agro-sky whitespace-nowrap">
                    🌧️{hour.rainProbability}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
