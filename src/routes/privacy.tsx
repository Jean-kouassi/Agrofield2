import { createFileRoute, Link } from "@tanstack/react-router";
import { Leaf } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — AgroSphere" },
      { name: "description", content: "Comment AgroSphere collecte, utilise et protège tes données agricoles." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/" className="mb-6 inline-flex items-center gap-2 text-primary">
        <Leaf className="h-5 w-5" /> <span className="font-bold">AgroSphere</span>
      </Link>
      <h1 className="mb-4 text-3xl font-bold">Politique de confidentialité</h1>
      <p className="mb-6 text-sm text-muted-foreground">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}</p>

      <section className="prose prose-sm max-w-none space-y-4">
        <h2 className="text-xl font-semibold">1. Données collectées</h2>
        <p>AgroSphere collecte : email, nom, parcelles (géolocalisation, cultures), dépenses/ventes, photos de plantes, mesures de capteurs.</p>

        <h2 className="text-xl font-semibold">2. Utilisation</h2>
        <p>Ces données servent uniquement à fournir le service (suivi, diagnostic IA, alertes irrigation, rapports financiers) et à faciliter l'accès au crédit agricole si tu partages explicitement ton dossier.</p>

        <h2 className="text-xl font-semibold">3. Stockage et sécurité</h2>
        <p>Données stockées sur des serveurs Supabase (UE) avec RLS (Row Level Security). Le registre financier est immuable (hash SHA-256 chaîné).</p>

        <h2 className="text-xl font-semibold">4. Partage</h2>
        <p>Aucune vente à des tiers. Partage uniquement avec les institutions financières que tu choisis explicitement.</p>

        <h2 className="text-xl font-semibold">5. IA</h2>
        <p>Les photos envoyées au module de diagnostic sont analysées par un modèle Gemini de Google. Elles ne sont pas utilisées pour entraîner de modèles tiers.</p>

        <h2 className="text-xl font-semibold">6. Droits</h2>
        <p>Tu peux exporter ou supprimer tes données à tout moment depuis <Link to="/profile" className="text-primary underline">ton profil</Link>.</p>

        <h2 className="text-xl font-semibold">7. Contact</h2>
        <p>Pour toute question : <a href="mailto:jeankouasst@gmail.com" className="text-primary underline">jeankouasst@gmail.com</a></p>
      </section>
    </div>
  );
}
