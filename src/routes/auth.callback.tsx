import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Leaf } from "lucide-react";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Connexion en cours..." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "success" | "error">("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        // Récupérer la session depuis l'URL fragment (#access_token=...)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (session) {
          // Session valide → rediriger vers dashboard
          setStatus("success");
          
          // Petit délai pour afficher le succès
          setTimeout(() => {
            navigate({ to: "/dashboard", replace: true });
          }, 1000);
        } else {
          // Pas de session → erreur
          throw new Error("Aucune session trouvée après redirection OAuth");
        }
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setError(err.message || "Erreur de connexion");
        setStatus("error");
        
        // Rediriger vers login après 3 secondes
        setTimeout(() => {
          navigate({ to: "/auth", replace: true });
        }, 3000);
      }
    }

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 px-4">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="inline-flex items-center gap-2 text-primary mb-6">
          <Leaf className="h-12 w-12" />
          <span className="text-3xl font-black tracking-tight">AgroSphere</span>
        </div>

        {status === "checking" && (
          <>
            <div className="mb-6">
              <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Connexion en cours...
            </h2>
            <p className="text-muted-foreground">
              Finalisation de votre authentification
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-bold text-green-700 mb-2">
              Connexion réussie !
            </h2>
            <p className="text-muted-foreground">
              Redirection vers votre espace...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-bold text-red-700 mb-2">
              Échec de connexion
            </h2>
            <p className="text-muted-foreground mb-4">
              {error || "Une erreur est survenue"}
            </p>
            <p className="text-sm text-muted-foreground">
              Redirection vers la page de connexion...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
