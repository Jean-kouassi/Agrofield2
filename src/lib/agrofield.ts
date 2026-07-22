export const CROP_TYPES = [
  "Mil",
  "Sorgho",
  "Maïs",
  "Riz",
  "Coton",
  "Arachide",
  "Niébé",
  "Sésame",
  "Tomate",
  "Oignon",
  "Chou",
  "Autre maraîchage",
] as const;

export const EXPENSE_CATEGORIES = [
  "Semences",
  "Engrais",
  "Pesticides",
  "Main d'œuvre",
  "Transport",
  "Outillage",
  "Eau / irrigation",
  "Autre",
] as const;

export function formatFcfa(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "0 FCFA";
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
}

export function daysSince(date: string | null | undefined) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Rough optimal harvest window in days after sowing per crop (indicative).
const HARVEST_DAYS: Record<string, number> = {
  Mil: 100,
  Sorgho: 110,
  Maïs: 95,
  Riz: 120,
  Coton: 160,
  Arachide: 100,
  Niébé: 70,
  Sésame: 95,
  Tomate: 90,
  Oignon: 120,
  Chou: 80,
};

export function harvestAlert(crop: string, sowingDate: string | null | undefined) {
  const days = daysSince(sowingDate);
  const target = HARVEST_DAYS[crop];
  if (days == null || !target) return null;
  const remaining = target - days;
  if (remaining > 14) return { level: "info" as const, label: `Croissance — jour ${days}` };
  if (remaining > 0)
    return { level: "warn" as const, label: `Récolte optimale dans ${remaining} jour${remaining > 1 ? "s" : ""}` };
  if (remaining > -14) return { level: "critical" as const, label: `Période de récolte dépassée de ${-remaining}j` };
  return { level: "info" as const, label: `Saison terminée (jour ${days})` };
}
