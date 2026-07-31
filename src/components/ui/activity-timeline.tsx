import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  type: "alert" | "activity" | "success" | "warning";
  title: string;
  description?: string;
  timestamp: string;
  icon?: React.ReactNode;
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
  className?: string;
  title?: string;
}

const typeStyles: Record<string, string> = {
  alert: "border-agro-danger bg-agro-danger/5",
  activity: "border-agro-primary bg-agro-light/30",
  success: "border-green-600 bg-green-50",
  warning: "border-agro-accent bg-agro-accent/10",
};

const typeDotColors: Record<string, string> = {
  alert: "bg-agro-danger",
  activity: "bg-agro-primary",
  success: "bg-green-600",
  warning: "bg-agro-accent",
};

export function ActivityTimeline({
  events,
  className,
  title,
}: ActivityTimelineProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)} role="region" aria-label={title || "Activités récentes"}>
      {title && (
        <h3 className="text-lg font-semibold text-agro-primary">{title}</h3>
      )}
      
      <div className="relative space-y-4">
        {/* Ligne verticale */}
        <div 
          className="absolute left-4 top-2 bottom-2 w-0.5 bg-agro-pale" 
          aria-hidden="true"
        />
        
        {events.map((event, index) => (
          <div
            key={event.id}
            className={cn(
              "relative flex gap-4 rounded-lg border-l-4 p-3 transition-colors",
              typeStyles[event.type] || typeStyles.activity
            )}
          >
            {/* Point sur la timeline */}
            <div
              className={cn(
                "absolute -left-[9px] top-4 h-4 w-4 rounded-full border-2 border-white shadow-sm",
                typeDotColors[event.type] || typeDotColors.activity
              )}
              aria-hidden="true"
            />
            
            {/* Icône optionnelle */}
            {event.icon && (
              <div className="flex-shrink-0 text-agro-primary">
                {event.icon}
              </div>
            )}
            
            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-medium text-agro-primary truncate">
                  {event.title}
                </h4>
                <time 
                  className="text-xs text-muted-foreground flex-shrink-0"
                  dateTime={event.timestamp}
                >
                  {event.timestamp}
                </time>
              </div>
              {event.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {event.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
