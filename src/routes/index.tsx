import { createFileRoute, Link } from "@tanstack/react-router";
import { Leaf, Sprout, LineChart, Camera, ShoppingCart } from "lucide-react";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 font-bold text-primary">
            <Leaf className="h-6 w-6" />
            <span className="text-lg tracking-tight">AgroField</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              to="/auth"
              className="inline-flex items-center rounded-full border border-primary bg-background px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-accent"
            >
              Se connecter
            </Link>
            <Link
              to="/marketplace/create"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              Publier une offre
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        {/* Hero Section */}
        <section className="grid gap-8 sm:grid-cols-[1.2fr_1fr] sm:items-center">
          <div>
            <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
              Pour l'agriculteur burkinabè
            </span>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-foreground sm:text-5xl">
              Vos parcelles, vos finances,
              <br />
              <span className="text-primary">votre récolte</span> — sur votre téléphone.
            </h1>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              AgroField vous aide à suivre vos parcelles, détecter les maladies des plantes
              par simple photo, et savoir combien vous gagnez vraiment — en FCFA.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/auth"
                className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
              >
                Commencer gratuitement
              </Link>
              <Link
                to="/marketplace"
                className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-6 py-3 text-base font-semibold text-foreground transition-colors hover:bg-accent"
              >
                <ShoppingCart className="h-5 w-5" />
                Voir le marketplace
              </Link>
            </div>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-primary/15 via-accent/20 to-secondary p-6 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              <Feature icon={<Sprout className="h-5 w-5" />} title="Parcelles" body="Cultures, semis, récoltes" />
              <Feature icon={<Camera className="h-5 w-5" />} title="Diagnostic IA" body="Photo → maladie en 10s" />
              <Feature icon={<LineChart className="h-5 w-5" />} title="Finances" body="Dépenses / ventes FCFA" />
              <Feature icon={<Leaf className="h-5 w-5" />} title="Alertes" body="Rappels de récolte" />
            </div>
          </div>
        </section>

        {/* Marketplace CTA Section */}
        <section className="mt-16 rounded-3xl bg-gradient-to-r from-green-50 to-emerald-50 p-8 shadow-sm border border-border">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <ShoppingCart className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              🛒 Marketplace AgroField
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Vendez vos récoltes et achetez des produits agricoles directement auprès des producteurs locaux.
              Tomates, oignons, mil, sorgho, maïs et bien plus encore.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/marketplace/create"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 sm:w-auto text-lg"
              >
                🌾 Publier une offre
              </Link>
              <Link
                to="/marketplace"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary bg-background px-8 py-4 text-base font-semibold text-primary transition-colors hover:bg-accent sm:w-auto text-lg"
              >
                🛒 Parcourir les offres
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-4 text-center sm:grid-cols-3">
              <Stat number="100%" label="Produits locaux" />
              <Stat number="0 FCFA" label="Commission (lancement)" />
              <Stat number="24/7" label="Accès au marché" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Pourquoi utiliser AgroField ?</h2>
          <p className="mt-2 text-muted-foreground">Tout ce dont vous avez besoin pour réussir votre activité agricole</p>
          
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Sprout className="h-6 w-6" />}
              title="Gestion des parcelles"
              description="Suivez vos cultures, dates de semis et prévisions de récolte."
            />
            <FeatureCard
              icon={<Camera className="h-6 w-6" />}
              title="Diagnostic IA"
              description="Prenez une photo de votre plante et identifiez les maladies en quelques secondes."
            />
            <FeatureCard
              icon={<ShoppingCart className="h-6 w-6" />}
              title="Marketplace intégré"
              description="Vendez vos récoltes au juste prix et trouvez des acheteurs facilement."
            />
            <FeatureCard
              icon={<LineChart className="h-6 w-6" />}
              title="Suivi financier"
              description="Gérez vos dépenses et revenus en FCFA. Sachez ce que vous gagnez vraiment."
            />
            <FeatureCard
              icon={<Leaf className="h-6 w-6" />}
              title="Alertes intelligentes"
              description="Rappels automatiques pour les récoltes, traitements et irrigations."
            />
            <FeatureCard
              icon={<Sprout className="h-6 w-6" />}
              title="Conseils agricoles"
              description="Recommandations personnalisées basées sur votre région et vos cultures."
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-green-200 py-6 text-center text-xs text-gray-500 mt-16">
        AgroField — un outil AgroTech BF 🇧🇫
      </footer>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm border">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="mt-3 text-sm font-semibold text-foreground">{title}</div>
      <div className="text-xs text-muted-foreground">{body}</div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-bold text-primary">{number}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
