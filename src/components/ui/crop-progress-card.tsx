import { cn } from "@/lib/utils";

interface CropProgressCardProps {
  cropName: string;
  currentDay: number;
  totalDays: number;
  stage?: string;
  className?: string;
}

export function CropProgressCard({
  cropName,
  currentDay,
  totalDays,
  stage,
  className,
}: CropProgressCardProps) {
  const progress = Math.min((currentDay / totalDays) * 100, 100);
  
  // Déterminer la couleur selon le stade
  const getColorClass = (p: number) => {
    if (p < 25) return "bg-agro-light";
    if (p < 50) return "bg-agro-primary";
    if (p < 75) return "bg-agro-soil";
    return "bg-agro-accent";
  };

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 shadow-sm",
        className
      )}
      role="region"
      aria-label={`Progression de ${cropName}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-agro-primary">{cropName}</h4>
        <span className="text-xs font-medium text-muted-foreground">
          J{currentDay}/{totalDays}
        </span>
      </div>
      
      {/* Barre de progression */}
      <div 
        className="relative h-3 w-full overflow-hidden rounded-full bg-agro-pale"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${Math.round(progress)}% du cycle cultural`}
      >
        <div
          className={cn(
            "absolute left-0 top-0 h-full transition-all duration-500 ease-in-out",
            getColorClass(progress)
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Stade de croissance */}
      {stage && (
        <p className="mt-3 text-xs text-muted-foreground">
          Stade: <span className="font-medium text-agro-primary">{stage}</span>
        </p>
      )}
      
      {/* Indicateurs de phases */}
      <div className="mt-3 flex justify-between text-[10px] text-muted-foreground">
        <span>Semis</span>
        <span>Croissance</span>
        <span>Floraison</span>
        <span>Récolte</span>
      </div>
    </div>
  );
}
