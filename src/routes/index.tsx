import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatFcfa, harvestAlert } from "@/lib/agrofield";
import {
  Leaf, Sprout, LineChart, Camera, ShoppingCart, CheckCircle, ArrowRight,
  Play, Users, TrendingUp, TrendingDown, Award, MapPin, Smartphone, Shield,
  Wheat, Wifi, LogOut, AlertTriangle, Plus, LayoutDashboard, ArrowUp
} from "lucide-react";
import { useState, useEffect } from "react";
import { PWAInstallPrompt } from "@/components/ui/pwa-install-prompt";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Landing,
});

function Landing() {
  const qc = useQueryClient();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sessionQ = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const isConnected = !!sessionQ.data;
  const userId = sessionQ.data?.user?.id;
  const userName = sessionQ.data?.user?.user_metadata?.full_name || sessionQ.data?.user?.email?.split('@')[0] || "Agriculteur";

  const parcelsQ = useQuery({
    queryKey: ["parcels-home"],
    queryFn: async () => {
      const { data } = await supabase.from("parcels").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: isConnected,
  });

  const expensesQ = useQuery({
    queryKey: ["expenses-home"],
    queryFn: async () => {
      const { data, error } = await supabase.from("expenses").select("amount_fcfa");
      if (error) return 0;
      return (data ?? []).reduce((s: number, r: any) => s + Number(r.amount_fcfa || 0), 0);
    },
    enabled: isConnected,
  });

  const salesQ = useQuery({
    queryKey: ["sales-home"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sales").select("quantity_kg, unit_price_fcfa");
      if (error) return 0;
      return (data ?? []).reduce((s: number, r: any) => s + Number(r.quantity_kg || 0) * Number(r.unit_price_fcfa || 0), 0);
    },
    enabled: isConnected,
  });

  const eventsQ = useQuery({
    queryKey: ["crop-events-home"],
    queryFn: async () => {
      const { data } = await supabase.from("crop_events").select("*").order("event_date", { ascending: false }).limit(5);
      return data ?? [];
    },
    enabled: isConnected,
  });

  const devicesQ = useQuery({
    queryKey: ["sensor-devices-home"],
    queryFn: async () => {
      const { data } = await supabase.from("sensor_devices").select("*");
      return data ?? [];
    },
    enabled: isConnected,
  });

  const myOffersQ = useQuery({
    queryKey: ["my-offers-home", userId],
    queryFn: async () => {
      const { data } = await supabase.from("marketplace_listings").select("*").eq("seller_id", userId).eq("status", "available").order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: isConnected,
  });

  const parcelCount = parcelsQ.data?.length ?? 0;
  const totalArea = parcelsQ.data?.reduce((s: number, p: any) => s + Number(p.area_ha || 0), 0) ?? 0;
  const activeDevices = devicesQ.data?.filter((d: any) => d.last_seen_at && Date.now() - new Date(d.last_seen_at).getTime() < 3600000).length ?? 0;
  const recentEvents = eventsQ.data?.length ?? 0;
  const totalExpenses = expensesQ.data ?? 0;
  const totalSales = salesQ.data ?? 0;
  const netto = totalSales - totalExpenses;
  const activeOffersCount = myOffersQ.data?.length ?? 0;

  const alerts = (parcelsQ.data ?? [])
    .map((p: any) => ({ p, a: harvestAlert(p.crop_type, p.sowing_date) }))
    .filter((x: any) => x.a && x.a.level !== "info");

  async function handleLogout() {
    await supabase.auth.signOut();
    qc.invalidateQueries({ queryKey: ["session"] });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-emerald-50">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-green-100 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 font-bold text-primary">
            <Leaf className="h-7 w-7" />
            <span className="text-xl tracking-tight">AgroField</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#fonctionnalites" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">Fonctionnalités</a>
            {isConnected && <Link to="/crop-events" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">Suivi Cultural</Link>}
            {isConnected && <Link to="/marketplace" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">Marketplace</Link>}
          </nav>
          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                <Link to="/parcels" className="hidden sm:inline-flex items-center rounded-full border-2 border-primary bg-white px-5 py-2.5 text-sm font-semibold text-primary hover:bg-green-50">Mes parcelles</Link>
                <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200">
                  <LogOut className="h-4 w-4" /> Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link to="/auth" className="hidden sm:inline-flex items-center rounded-full border-2 border-primary bg-white px-5 py-2.5 text-sm font-semibold text-primary hover:bg-green-50">Se connecter</Link>
                <Link to="/auth" className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-primary/90">Commencer gratuit</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200 rounded-full blur-3xl opacity-30"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-200 rounded-full blur-3xl opacity-30"></div>
          </div>

          <div className="relative grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800 mb-6">
                <Shield className="h-4 w-4" />
                <span>Fait avec ❤️ pour les agriculteurs burkinabè 🇧🇫</span>
              </div>

              <h1 className="text-4xl font-black tracking-tight text-gray-900 sm:text-5xl lg:text-6xl leading-tight">
                {isConnected ? (
                  <>Bonjour {userName} 👋<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">Vos cultures</span>, votre activité</>
                ) : (
                  <>Suivez vos parcelles,<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">vendez mieux</span>,<br />gagnez plus.</>
                )}
              </h1>

              <p className="mt-6 text-lg text-gray-600 sm:text-xl max-w-2xl mx-auto lg:mx-0">
                {isConnected
                  ? "Retrouvez vos statistiques, vos outils et vos actions rapides ci-dessous."
                  : "L'outil #1 des agriculteurs du Burkina Faso. Gérez vos cultures, diagnostiquez les maladies par IA, et vendez au meilleur prix — 100% gratuit."
                }
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {isConnected ? (
                  <>
                    <Link to="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-bold text-white shadow-xl hover:bg-primary/90 hover:scale-105 transition-all">
                      <LayoutDashboard className="h-5 w-5" /> Tableau de bord
                    </Link>
                    <Link to="/parcels" className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-gray-300 bg-white px-8 py-4 text-base font-bold text-gray-700 hover:border-primary hover:text-primary transition-all">
                      <Sprout className="h-5 w-5" /> Mes parcelles
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/auth" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-bold text-white shadow-xl hover:bg-primary/90 hover:scale-105 transition-all">
                      Commencer gratuitement <ArrowRight className="h-5 w-5" />
                    </Link>
                    <button className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-gray-300 bg-white px-8 py-4 text-base font-bold text-gray-700 hover:border-primary hover:text-primary transition-all">
                      <Play className="h-5 w-5 fill-current" /> Voir la démo (2 min)
                    </button>
                  </>
                )}
              </div>

              {!isConnected && (
                <div className="mt-8 flex items-center gap-6 justify-center lg:justify-start text-sm text-gray-500">
                  <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /><span>Gratuit</span></div>
                  <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /><span>Sans engagement</span></div>
                  <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /><span>Google Auth</span></div>
                </div>
              )}
            </div>

            {/* DASHBOARD INTÉGRÉ si connecté */}
            <div className="relative">
              {isConnected ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <DashStat label="Ventes" value={formatFcfa(totalSales)} icon={<TrendingUp className="h-4 w-4" />} tone="ok" />
                    <DashStat label="Dépenses" value={formatFcfa(totalExpenses)} icon={<TrendingDown className="h-4 w-4" />} tone="muted" />
                    <DashStat label="Bénéfice net" value={formatFcfa(netto)} icon={<TrendingUp className="h-4 w-4" />} tone={netto >= 0 ? "primary" : "warn"} />
                    <DashStat label="Parcelles" value={String(parcelCount)} icon={<Sprout className="h-4 w-4" />} tone="muted" />
                  </div>

                  {alerts.length > 0 && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-bold text-amber-900">Alertes des cultures</span>
                      </div>
                      <div className="space-y-1.5">
                        {alerts.slice(0, 3).map(({ p, a }: any) => (
                          <div key={p.id} className="text-xs">
                            <span className="font-semibold">{p.name} — {p.crop_type}</span>
                            <span className={`ml-2 rounded-full px-2 py-0.5 ${a.level === "critical" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{a.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-3">Actions rapides</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <QuickAction icon={<Plus className="h-5 w-5" />} label="Nouvelle parcelle" link="/parcels" />
                      <QuickAction icon={<Wheat className="h-5 w-5" />} label="Intervention" link="/crop-events" />
                      <QuickAction icon={<Camera className="h-5 w-5" />} label="Diagnostiquer" link="/diagnose" />
                      <QuickAction icon={<ShoppingCart className="h-5 w-5" />} label="Vendre" link="/marketplace/create" />
                    </div>
                  </div>

                  <Link to="/marketplace/my-offers" className="block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold">🛒 Mes offres marketplace</div>
                        <div className="text-xs text-gray-500">{activeOffersCount} offre(s) active(s)</div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </Link>
                </div>
              ) : (
                <div className="relative mx-auto max-w-md">
                  <div className="relative rounded-[2.5rem] bg-gray-900 p-3 shadow-2xl">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl"></div>
                    <div className="rounded-[2rem] bg-white overflow-hidden">
                      <div className="aspect-[9/19] bg-gradient-to-br from-green-500 to-emerald-600 p-6 flex flex-col">
                        <div className="mt-8 space-y-4">
                          <div className="h-8 bg-white/20 rounded-lg"></div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="h-20 bg-white/30 rounded-xl"></div>
                            <div className="h-20 bg-white/30 rounded-xl"></div>
                          </div>
                          <div className="h-32 bg-white/20 rounded-xl"></div>
                          <div className="h-16 bg-white/30 rounded-xl"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -top-4 -left-4 bg-white rounded-2xl shadow-xl p-4 animate-bounce">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Revenu moyen</div>
                        <div className="text-lg font-bold text-gray-900">+35%</div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Agriculteurs</div>
                        <div className="text-lg font-bold text-gray-900">500+</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* FONCTIONNALITÉS - Boutons actionnables */}
        <section id="fonctionnalites" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800 mb-4">
              <Smartphone className="h-4 w-4 mr-2" /> 100% Mobile & Offline
            </span>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              {isConnected ? "Vos outils agricoles" : "Tout ce dont vous avez besoin"}
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              {isConnected ? "Cliquez sur un outil pour y accéder directement" : "Une suite complète d'outils pour réussir votre activité agricole"}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ActionCard icon={<Sprout className="h-8 w-8" />} title="Gestion des parcelles" description="Suivez vos cultures, dates de semis, traitements et prévisions de récolte. Alertes intelligentes incluses." color="bg-green-100 text-green-600" link="/parcels" badge={isConnected ? `${parcelCount} parcelles` : undefined} />
            <ActionCard icon={<Wheat className="h-8 w-8" />} title="Suivi Cultural" description="Enregistrez vos interventions : semis, irrigation, fertilisation, traitement, récolte. Suivez les coûts et rendements." color="bg-amber-100 text-amber-600" link="/crop-events" badge={isConnected ? `${recentEvents} interventions` : undefined} />
            <ActionCard icon={<Camera className="h-8 w-8" />} title="Diagnostic IA" description="Prenez une photo de votre plante et identifiez les maladies en quelques secondes grâce à l'IA." color="bg-blue-100 text-blue-600" link="/diagnose" />
            <ActionCard icon={<Wifi className="h-8 w-8" />} title="Capteurs IoT" description="Pilotez vos stations de mesure : sol, météo, irrigation. Données en temps réel et alertes automatiques." color="bg-purple-100 text-purple-600" link="/sensors" badge={isConnected ? `${activeDevices} actifs` : undefined} />
            <ActionCard icon={<ShoppingCart className="h-8 w-8" />} title="Marketplace" description="Vendez vos récoltes au juste prix et trouvez des acheteurs directement. 0% de commission." color="bg-orange-100 text-orange-600" link="/marketplace" />
            <ActionCard icon={<LineChart className="h-8 w-8" />} title="Suivi financier" description="Gérez vos dépenses et revenus en FCFA. Tableaux de bord, exports PDF et preuves de transaction." color="bg-red-100 text-red-600" link="/finances" />
          </div>
        </section>

        {/* STATS / PREUVE SOCIALE */}
        <section className="bg-white py-16 border-y border-green-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {isConnected ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Vos statistiques</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <StatCard icon={<Sprout className="h-8 w-8" />} number={String(parcelCount)} label="Parcelles" color="bg-green-100 text-green-600" />
                  <StatCard icon={<MapPin className="h-8 w-8" />} number={`${totalArea.toFixed(1)} ha`} label="Surface totale" color="bg-blue-100 text-blue-600" />
                  <StatCard icon={<Wheat className="h-8 w-8" />} number={String(recentEvents)} label="Interventions" color="bg-amber-100 text-amber-600" />
                  <StatCard icon={<Wifi className="h-8 w-8" />} number={String(activeDevices)} label="Capteurs actifs" color="bg-purple-100 text-purple-600" />
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900">Ils nous font confiance</h2>
                  <p className="mt-4 text-lg text-gray-600">Rejoignez des centaines d'agriculteurs qui ont transformé leur activité</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <StatCard icon={<Users className="h-8 w-8" />} number="500+" label="Agriculteurs actifs" color="bg-green-100 text-green-600" />
                  <StatCard icon={<TrendingUp className="h-8 w-8" />} number="200M" label="FCFA transactions" color="bg-blue-100 text-blue-600" />
                  <StatCard icon={<Award className="h-8 w-8" />} number="4.8/5" label="Satisfaction" color="bg-yellow-100 text-yellow-600" />
                  <StatCard icon={<MapPin className="h-8 w-8" />} number="13" label="Régions" color="bg-purple-100 text-purple-600" />
                </div>
              </>
            )}
          </div>
        </section>

        {/* TÉMOIGNAGES - masqués si connecté */}
        {!isConnected && (
          <section id="temoignages" className="bg-gradient-to-br from-green-50 to-emerald-50 py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Ce qu'ils en disent</h2>
                <p className="mt-4 text-lg text-gray-600">Des agriculteurs comme vous qui ont transformé leur activité</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                <TestimonialCard quote="Depuis AgroField, je sais exactement quand récolter et je vends 30% plus cher." author="Mamadou O." role="Maraîcher" location="Bobo-Dioulasso" rating={5} />
                <TestimonialCard quote="Le diagnostic IA m'a sauvé ma récolte de tomates. J'ai détecté la maladie à temps !" author="Fatoumata K." role="Productrice" location="Ouagadougou" rating={5} />
                <TestimonialCard quote="Je vends mes oignons directement sur le marketplace. Plus besoin d'intermédiaires." author="Ibrahim S." role="Agriculteur" location="Koudougou" rating={5} />
              </div>
            </div>
          </section>
        )}

        {/* COMMENT ÇA MARCHE - masqué si connecté */}
        {!isConnected && (
          <section id="comment-ca-marche" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Comment ça marche ?</h2>
              <p className="mt-4 text-lg text-gray-600">En 3 étapes simples</p>
            </div>
            <div className="grid md:grid-cols-3 gap-12">
              <StepCard number="01" title="Créez votre compte" description="Inscription gratuite en 2 minutes avec Google. Accès immédiat." icon={<CheckCircle className="h-8 w-8" />} />
              <StepCard number="02" title="Ajoutez vos parcelles" description="Enregistrez vos cultures, superficies et dates de semis." icon={<Sprout className="h-8 w-8" />} />
              <StepCard number="03" title="Suivez et vendez" description="Consultez vos tableaux de bord, diagnostiquez et vendez." icon={<TrendingUp className="h-8 w-8" />} />
            </div>
            <div className="mt-16 text-center">
              <Link to="/auth" className="inline-flex items-center gap-2 rounded-full bg-primary px-10 py-5 text-lg font-bold text-white shadow-xl hover:bg-primary/90 hover:scale-105 transition-all">
                Commencer maintenant — C'est gratuit <ArrowRight className="h-6 w-6" />
              </Link>
            </div>
          </section>
        )}

        {/* MARKETPLACE CTA */}
        <section className="bg-[#F0FDF4] py-20 border-t border-[#DCFCE7]">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#BBF7D0] mb-6">
              <ShoppingCart className="h-8 w-8 text-[#166534]" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 sm:text-4xl mb-4">
              🛒 Marketplace AgroField
            </h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed mb-8">
              Vendez vos récoltes et achetez des produits agricoles directement auprès des
              producteurs locaux. Tomates, oignons, mil, sorgho, maïs et bien plus encore.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <Link
                to="/marketplace/create"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#166534] px-8 py-4 text-base font-bold text-white shadow-lg hover:bg-[#14532D] transition-colors"
              >
                <span>🌱</span> Publier une offre
              </Link>
              <Link
                to="/marketplace"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-[#166534] border-2 border-[#166534] shadow-sm hover:bg-[#F0FDF4] transition-colors"
              >
                <ShoppingCart className="h-5 w-5" /> Parcourir les offres
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-[#DCFCE7] max-w-xl mx-auto">
              <div>
                <div className="text-2xl font-bold text-[#166534]">100%</div>
                <div className="text-xs text-gray-600 mt-1">Produits locaux</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#166534]">0 FCFA</div>
                <div className="text-xs text-gray-600 mt-1">Commission (lancement)</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#166534]">24/7</div>
                <div className="text-xs text-gray-600 mt-1">Accès au marché</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 font-bold text-xl mb-4">
                <Leaf className="h-7 w-7 text-green-400" /><span>AgroField</span>
              </div>
              <p className="text-gray-400 text-sm max-w-md">L'outil numérique #1 pour les agriculteurs du Burkina Faso. 🇧🇫</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Produit</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#fonctionnalites" className="hover:text-white">Fonctionnalités</a></li>
                <li><Link to="/marketplace" className="hover:text-white">Marketplace</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Légal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Conditions</a></li>
                <li><a href="#" className="hover:text-white">Confidentialité</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-400">
            AgroField 🇧🇫 — © 2026
          </div>
        </div>
      </footer>

      {/* Bouton retour en haut */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl hover:bg-primary/90 transition-all animate-in fade-in zoom-in"
          aria-label="Retour en haut"
        >
          <ArrowUp className="h-6 w-6" />
        </button>
      )}

      {/* Prompt d'installation PWA */}
      <PWAInstallPrompt />
    </div>
  );
}

// ============ COMPOSANTS ============

function DashStat({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: "primary" | "ok" | "warn" | "muted" }) {
  const toneClass = tone === "primary" ? "bg-primary text-primary-foreground" : tone === "ok" ? "bg-secondary text-secondary-foreground" : tone === "warn" ? "bg-destructive/10 text-destructive" : "bg-card text-card-foreground border border-border";
  return (
    <div className={`rounded-2xl p-4 shadow-sm ${toneClass}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide opacity-80">{icon} {label}</div>
      <div className="mt-1 text-xl font-black tracking-tight">{value}</div>
    </div>
  );
}

function QuickAction({ icon, label, link }: { icon: React.ReactNode; label: string; link: string }) {
  return (
    <Link to={link} className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary hover:bg-green-50 transition-all">
      {icon}{label}
    </Link>
  );
}

function StatCard({ icon, number, label, color }: { icon: React.ReactNode; number: string; label: string; color: string }) {
  return (
    <div className="text-center">
      <div className={`mx-auto h-16 w-16 rounded-2xl ${color} flex items-center justify-center mb-4`}>{icon}</div>
      <div className="text-3xl font-bold text-gray-900">{number}</div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </div>
  );
}

function ActionCard({ icon, title, description, color, link, badge }: { icon: React.ReactNode; title: string; description: string; color: string; link: string; badge?: string }) {
  return (
    <Link to={link} className="block group">
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 h-full">
        <div className="flex items-center justify-between mb-6">
          <div className={`h-14 w-14 rounded-2xl ${color} flex items-center justify-center`}>{icon}</div>
          {badge && <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">{badge}</span>}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">{title} →</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </Link>
  );
}

function TestimonialCard({ quote, author, role, location, rating }: { quote: string; author: string; role: string; location: string; rating: number }) {
  return (
    <div className="bg-white rounded-3xl p-8 shadow-lg border border-green-100">
      <div className="flex items-center gap-1 mb-4">
        {[...Array(rating)].map((_, i) => (<svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>))}
      </div>
      <blockquote className="text-gray-700 mb-6 leading-relaxed">"{quote}"</blockquote>
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">{author.charAt(0)}</div>
        <div><div className="font-bold text-gray-900">{author}</div><div className="text-sm text-gray-500">{role} • {location}</div></div>
      </div>
    </div>
  );
}

function StepCard({ number, title, description, icon }: { number: string; title: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="text-center">
      <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white mb-6 shadow-lg">{icon}</div>
      <div className="inline-block rounded-full bg-green-100 px-4 py-1 text-sm font-bold text-green-800 mb-4">Étape {number}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}