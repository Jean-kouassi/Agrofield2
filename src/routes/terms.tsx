import { createFileRoute, Link } from "@tanstack/react-router";
import { Leaf } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Conditions d'utilisation — AgroSphere" },
      { name: "description", content: "Conditions générales d'utilisation d'AgroSphere." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/" className="mb-6 inline-flex items-center gap-2 text-primary">
        <Leaf className="h-5 w-5" /> <span className="font-bold">AgroSphere</span>
      </Link>
      <h1 className="mb-4 text-3xl font-bold">Conditions d'utilisation</h1>
      <p className="mb-6 text-sm text-muted-foreground">Version 1.0 · {new Date().toLocaleDateString("fr-FR")}</p>

      <section className="space-y-4 text-sm">
        <p><strong>Service.</strong> AgroSphere est une application de gestion agricole destinée aux exploitants d'Afrique de l'Ouest.</p>
        <p><strong>Compte.</strong> Tu es responsable de la confidentialité de ton mot de passe et de tes accès Google.</p>
        <p><strong>Contenu.</strong> Tu restes propriétaire de tes données. Tu accordes à AgroSphere le droit de les traiter uniquement pour te fournir le service.</p>
        <p><strong>Immuabilité financière.</strong> Les écritures de dépenses et ventes sont scellées par empreinte cryptographique. Elles ne peuvent être ni modifiées ni supprimées — les erreurs se corrigent par une écriture inverse.</p>
        <p><strong>Diagnostic IA.</strong> Le module de diagnostic est fourni à titre indicatif. Il ne remplace pas un phytosanitaire agréé.</p>
        <p><strong>Responsabilité.</strong> AgroSphere ne peut être tenu responsable des pertes de récolte, décisions financières ou dommages liés à l'usage de l'app.</p>
        <p><strong>Contact.</strong> <a href="mailto:jeankouasst@gmail.com" className="text-primary underline">jeankouasst@gmail.com</a></p>
      </section>
    </div>
  );
}
