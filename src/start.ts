import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Note CSRF: TanStack Start v1 ne nécessite pas de configuration CSRF explicite
// Les server functions sont automatiquement protégées par:
// 1. Authentification Supabase (attachSupabaseAuth)
// 2. Tokens JWT validés côté serveur
// 3. SameSite cookies par défaut
//
// Pour une protection CSRF additionnelle en production:
// - Utiliser des headers personnalisés (X-CSRF-Token)
// - Valider l'origine des requêtes (Origin/Referer headers)
// - Configurer les cookies avec SameSite=Strict

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware],
}));
