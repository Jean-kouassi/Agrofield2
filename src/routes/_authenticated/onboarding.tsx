import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Leaf, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ONBOARDING_ROLES, type AppRole } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/onboarding")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Bienvenue — AgroSphere" },
      { name: "description", content: "Choisissez votre profil pour personnaliser votre expérience AgroSphere." },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async ({ location }) => {
    // Vérifier que l'utilisateur est connecté
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
    
    // Si le rôle est déjà défini, rediriger vers dashboard
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.session.user.id)
      .maybeSingle();
    
    if (profile?.role) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<AppRole>("producer");
  const [saving, setSaving] = useState(false);

  async function handleContinue() {
    try {
      setSaving(true);
      
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        navigate({ to: "/auth" });
        return;
      }

      // Mettre à jour le profil avec le rôle choisi
      const { error } = await supabase
        .from("profiles")
        .update({ 
          role: selectedRole,
          business_type: selectedRole === 'cooperative_manager' ? 'cooperative' : 'individual',
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success(`Profil configuré comme ${getRoleLabel(selectedRole)}!`);
      navigate({ to: "/dashboard", replace: true });
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast.error(error.message || "Erreur lors de la configuration");
    } finally {
      setSaving(false);
    }
  }

  function getRoleLabel(role: AppRole): string {
    switch (role) {
      case 'producer': return 'Producteur';
      case 'wholesaler': return 'Grossiste';
      case 'retailer': return 'Détaillant';
      case 'admin': return 'Administrateur';
      case 'cooperative_manager': return 'Gestionnaire de coopérative';
      default: return 'Utilisateur';
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-primary mb-2">
            <Leaf className="h-10 w-10" />
            <span className="text-3xl font-black tracking-tight">AgroSphere</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Bienvenue sur AgroSphere !
          </h1>
          <p className="text-muted-foreground">
            Choisissez votre profil pour personnaliser votre expérience
          </p>
        </div>

        {/* Carte de sélection de rôle */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ONBOARDING_ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRole(r.id)}
                className={`flex flex-col items-start gap-2 rounded-2xl border-2 p-5 text-left transition-all hover:shadow-md ${
                  selectedRole === r.id
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <r.icon className="h-8 w-8" style={{ color: r.color }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold">{r.label}</span>
                      {selectedRole === r.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground pl-[44px]">
                  {r.description}
                </p>
              </button>
            ))}
          </div>

          {/* Bouton continuer */}
          <Button
            onClick={handleContinue}
            disabled={saving}
            className="w-full h-12 text-base font-semibold"
          >
            {saving ? (
              "Configuration..."
            ) : (
              <>
                Continuer avec {getRoleLabel(selectedRole)}
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Vous pourrez modifier votre rôle plus tard dans les paramètres de profil.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            AgroSphere 🇧🇫 — Fait avec ❤️ pour les agriculteurs burkinabè
          </p>
        </div>
      </div>
    </div>
  );
}