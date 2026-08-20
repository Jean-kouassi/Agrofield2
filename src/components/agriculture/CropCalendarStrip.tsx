/**
 * CropCalendarStrip
 * Bandeau horizontal scrollable montrant le cycle cultural d'une parcelle.
 * 5 phases : Semis → Croissance → Floraison → Maturation → Récolte
 * Indicateur visuel "Jour X/Y" + alertes phases critiques.
 */

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sprout,
  TrendingUp,
  Flower2,
  Wheat,
  Scissors,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

/* ──────────────── Types ──────────────── */

type CropPhase = "seeding" | "growing" | "flowering" | "maturation" | "harvest";

interface CropCalendarStripProps {
  cropType?: CropType;
  plantingDate: string; // ISO date
  currentDay?: number; // override: jour actuel du cycle
  onPhaseClick?: (phase: CropPhase, info: PhaseInfo) => void;
  className?: string;
}

type CropType = "mil" | "sorgho" | "mais" | "riz" | "coton" | "arachide" | "niebe";

interface PhaseInfo {
  phase: CropPhase;
  label: string;
  startDay: number;
  endDay: number;
  current: boolean;
  icon: typeof Sprout;
  color: string;
  bgColor: string;
  tips: string;
}

/* ──────────────── Crop Durations ──────────────── */

const CROP_DURATIONS: Record<CropType, { total: number; phases: Record<CropPhase, [number, number]> }> = {
  mil: {
    total: 90,
    phases: {
      seeding: [1, 15],
      growing: [16, 40],
      flowering: [41, 60],
      maturation: [61, 80],
      harvest: [81, 90],
    },
  },
  sorgho: {
    total: 120,
    phases: {
      seeding: [1, 20],
      growing: [21, 55],
      flowering: [56, 80],
      maturation: [81, 110],
      harvest: [111, 120],
    },
  },
  mais: {
    total: 100,
    phases: {
      seeding: [1, 15],
      growing: [16, 50],
      flowering: [51, 70],
      maturation: [71, 90],
      harvest: [91, 100],
    },
  },
  riz: {
    total: 140,
    phases: {
      seeding: [1, 25],
      growing: [26, 70],
      flowering: [71, 100],
      maturation: [101, 125],
      harvest: [126, 140],
    },
  },
  coton: {
    total: 160,
    phases: {
      seeding: [1, 25],
      growing: [26, 80],
      flowering: [81, 110],
      maturation: [111, 145],
      harvest: [146, 160],
    },
  },
  arachide: {
    total: 110,
    phases: {
      seeding: [1, 20],
      growing: [21, 55],
      flowering: [56, 75],
      maturation: [76, 100],
      harvest: [101, 110],
    },
  },
  niebe: {
    total: 75,
    phases: {
      seeding: [1, 12],
      growing: [13, 35],
      flowering: [36, 50],
      maturation: [51, 68],
      harvest: [69, 75],
    },
  },
};

const PHASE_META: Record<
  CropPhase,
  { label: string; icon: typeof Sprout; color: string; bgColor: string; tips: string }
> = {
  seeding: {
    label: "Semis",
    icon: Sprout,
    color: "text-primary",
    bgColor: "bg-primary/15",
    tips: "Arrosez régulièrement. Protégez des oiseaux et insectes ravageurs.",
  },
  growing: {
    label: "Croissance",
    icon: TrendingUp,
    color: "text-primary",
    bgColor: "bg-primary/25",
    tips: "Désherbage et sarclage. Surveillez l'humidité du sol avec vos capteurs.",
  },
  flowering: {
    label: "Floraison",
    icon: Flower2,
    color: "text-accent-foreground",
    bgColor: "bg-accent/30",
    tips: "Phase critique ! Évitez les stress hydriques. Traitements phytosanitaires sineeded.",
  },
  maturation: {
    label: "Maturation",
    icon: Wheat,
    color: "text-accent-foreground",
    bgColor: "bg-accent/50",
    tips: "Réduisez l'irrigation. Surveillez la coloration des grains. Préparez la récolte.",
  },
  harvest: {
    label: "Récolte",
    icon: Scissors,
    color: "text-destructive",
    bgColor: "bg-destructive/20",
    tips: "Récoltez par temps sec. Séchez les grains rapidement pour éviter les moisissures.",
  },
};

const CROP_LABELS: Record<CropType, string> = {
  mil: "Mil",
  sorgho: "Sorgho",
  mais: "Maïs",
  riz: "Riz",
  coton: "Coton",
  arachide: "Arachide",
  niebe: "Niébé",
};

/* ──────────────── Component ──────────────── */

export function CropCalendarStrip({
  cropType = "mais",
  plantingDate,
  currentDay,
  onPhaseClick,
  className,
}: CropCalendarStripProps) {
  const [selectedPhase, setSelectedPhase] = useState<CropPhase | null>(null);

  const { day, phases, totalDays, isComplete } = useMemo(() => {
    const crop = CROP_DURATIONS[cropType];
    const planted = new Date(plantingDate);
    const today = new Date();
    const diffMs = today.getTime() - planted.getTime();
    const calculatedDay = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
    const day = currentDay ?? Math.max(1, Math.min(calculatedDay, crop.total));

    const phases: PhaseInfo[] = (Object.keys(crop.phases) as CropPhase[]).map((phase) => {
      const [start, end] = crop.phases[phase];
      const meta = PHASE_META[phase];
      return {
        phase,
        label: meta.label,
        startDay: start,
        endDay: end,
        current: day >= start && day <= end,
        icon: meta.icon,
        color: meta.color,
        bgColor: meta.bgColor,
        tips: meta.tips,
      };
    });

    return {
      day,
      phases,
      totalDays: crop.total,
      isComplete: day >= crop.total,
    };
  }, [cropType, plantingDate, currentDay]);

  const currentPhase = phases.find((p) => p.current);
  const progressPercent = Math.round((day / totalDays) * 100);

  // Critical alerts
  const alerts: string[] = [];
  if (currentPhase?.phase === "flowering") {
    alerts.push("Phase critique : floraison. Stress hydrique = perte de rendement.");
  }
  if (currentPhase?.phase === "maturation") {
    const daysToHarvest = currentPhase.endDay - day;
    if (daysToHarvest <= 5) {
      alerts.push(`J-${daysToHarvest} avant récolte optimale. Préparez l'équipement.`);
    }
  }
  if (currentPhase?.phase === "harvest") {
    alerts.push("Récolte en cours ! Séchez les grains dans les 48h.");
  }

  const handlePhaseClick = (info: PhaseInfo) => {
    setSelectedPhase(info.phase === selectedPhase ? null : info.phase);
    onPhaseClick?.(info.phase, info);
  };

  return (
    <Card className={cn("overflow-hidden", className)} role="region" aria-label="Calendrier cultural">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Sprout className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground">
            {CROP_LABELS[cropType]}
          </span>
          <Badge variant="secondary" className="text-[10px]">
            Jour {day}/{totalDays}
          </Badge>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {progressPercent}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full bg-muted" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-1 px-4 pt-3">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-md border-l-4 border-l-accent bg-accent/10 p-2"
              role="alert"
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-foreground" aria-hidden="true" />
              <p className="text-xs text-foreground">{alert}</p>
            </div>
          ))}
        </div>
      )}

      {/* Phase strip */}
      <div className="flex gap-1 overflow-x-auto scrollbar-thin p-3" data-swipe-ignore>
        {phases.map((info) => {
          const Icon = info.icon;
          const isSelected = info.phase === selectedPhase;
          const isPast = day > info.endDay;
          return (
            <button
              key={info.phase}
              onClick={() => handlePhaseClick(info)}
              className={cn(
                "flex min-w-[72px] flex-col items-center gap-1 rounded-lg border p-2 transition-all",
                info.current
                  ? "border-primary ring-2 ring-primary/30"
                  : isSelected
                    ? "border-primary"
                    : "border-border",
                isPast && !info.current && "opacity-50",
                "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
              )}
              style={{ minHeight: 80 }}
              aria-label={`Phase ${info.label} jours ${info.startDay}-${info.endDay}`}
              aria-pressed={isSelected}
            >
              <div className={cn("rounded-full p-1.5", info.bgColor)}>
                <Icon className={cn("h-4 w-4", info.color)} aria-hidden="true" />
              </div>
              <span className="text-[10px] font-medium text-foreground">{info.label}</span>
              <span className="text-[9px] text-muted-foreground">
                J{info.startDay}-{info.endDay}
              </span>
              {info.current && (
                <span className="text-[9px] font-bold text-primary">● En cours</span>
              )}
              {isPast && (
                <span className="text-[9px] text-muted-foreground">✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected phase details */}
      {selectedPhase && (
        <div className="border-t bg-muted/30 px-4 py-3">
          {(() => {
            const info = phases.find((p) => p.phase === selectedPhase)!;
            const Icon = info.icon;
            return (
              <div className="flex items-start gap-3">
                <div className={cn("rounded-lg p-2", info.bgColor)}>
                  <Icon className={cn("h-5 w-5", info.color)} aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{info.label}</span>
                    <span className="text-xs text-muted-foreground">
                      Jours {info.startDay} - {info.endDay}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{info.tips}</p>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </div>
            );
          })()}
        </div>
      )}

      {/* Completion banner */}
      {isComplete && (
        <div className="border-t border-l-4 border-l-primary bg-primary/10 px-4 py-2">
          <p className="text-xs font-medium text-foreground">
            ✅ Cycle cultural terminé ! Planifiez la prochaine saison.
          </p>
        </div>
      )}
    </Card>
  );
}

export { CROP_DURATIONS, PHASE_META, CROP_LABELS };
export type { CropType, CropPhase, PhaseInfo };