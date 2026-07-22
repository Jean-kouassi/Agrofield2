import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  getCreditScore, 
  saveCreditScore, 
  createLoanApplication, 
  getUserLoanApplications,
  type CreditScoreResult,
  type LoanApplication 
} from "@/lib/credit-score";
import { toast } from "sonner";
import { 
  TrendingUp, 
  ShieldCheck, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  Clock, 
  XCircle,
  AlertTriangle,
  Award,
  Banknote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/finances/credit")({
  component: CreditScorePage,
});

function CreditScorePage() {
  const [loading, setLoading] = useState(true);
  const [creditScore, setCreditScore] = useState<CreditScoreResult | null>(null);
  const [loanApplications, setLoanApplications] = useState<LoanApplication[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Formulaire de demande de prêt
  const [loanForm, setLoanForm] = useState({
    amount: "",
    purpose: "",
    duration: "12",
  });

  useEffect(() => {
    loadCreditData();
  }, []);

  async function loadCreditData() {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      // Charger le score de crédit
      const score = await getCreditScore(user.id);
      setCreditScore(score);

      // Sauvegarder dans la base de données
      await saveCreditScore(user.id, score);

      // Charger les demandes de prêt
      const applications = await getUserLoanApplications(user.id);
      setLoanApplications(applications);
    } catch (error) {
      console.error("Erreur chargement credit:", error);
      toast.error("Impossible de charger votre score de crédit");
    } finally {
      setLoading(false);
    }
  }

  async function submitLoanApplication(e: React.FormEvent) {
    e.preventDefault();
    
    if (!creditScore) return;

    try {
      setSubmitting(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      const application: Omit<LoanApplication, 'id' | 'created_at'> = {
        user_id: user.id,
        amount_xof: parseInt(loanForm.amount),
        purpose: loanForm.purpose,
        duration_months: parseInt(loanForm.duration),
        status: 'pending',
      };

      await createLoanApplication(application);
      
      toast.success("Demande de prêt soumise avec succès !");
      setDialogOpen(false);
      setLoanForm({ amount: "", purpose: "", duration: "12" });
      
      // Recharger les données
      await loadCreditData();
    } catch (error: any) {
      console.error("Erreur soumission demande:", error);
      toast.error(error.message || "Erreur lors de la soumission");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-32 w-full bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const ratingColors = {
    'Excellent': 'text-green-600 bg-green-100 border-green-300',
    'Très bon': 'text-blue-600 bg-blue-100 border-blue-300',
    'Bon': 'text-yellow-600 bg-yellow-100 border-yellow-300',
    'Moyen': 'text-orange-600 bg-orange-100 border-orange-300',
    'Faible': 'text-red-600 bg-red-100 border-red-300',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Credit Scoring</h1>
            <p className="text-gray-600 mt-1">
              Évaluez votre éligibilité aux prêts agricoles
            </p>
          </div>
          
          {creditScore && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 gap-2">
                  <DollarSign className="w-4 h-4" />
                  Demander un prêt
                </Button>
              </DialogTrigger>
              
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Demande de prêt agricole</DialogTitle>
                  <DialogDescription>
                    Remplissez ce formulaire pour soumettre une demande de prêt.
                    Votre score actuel: {creditScore.score}/1000
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={submitLoanApplication} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Montant souhaité (FCFA)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="500000"
                      value={loanForm.amount}
                      onChange={(e) => setLoanForm({ ...loanForm, amount: e.target.value })}
                      required
                      min="10000"
                      max={creditScore.maxLoanAmount}
                    />
                    <p className="text-xs text-gray-500">
                      Maximum recommandé: {creditScore.maxLoanAmount.toLocaleString('fr-FR')} FCFA
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purpose">Objet du prêt</Label>
                    <Textarea
                      id="purpose"
                      placeholder="Achat de semences, équipement d'irrigation, etc."
                      value={loanForm.purpose}
                      onChange={(e) => setLoanForm({ ...loanForm, purpose: e.target.value })}
                      required
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Durée de remboursement (mois)</Label>
                    <Select
                      value={loanForm.duration}
                      onValueChange={(value) => setLoanForm({ ...loanForm, duration: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6">6 mois</SelectItem>
                        <SelectItem value="12">12 mois</SelectItem>
                        <SelectItem value="18">18 mois</SelectItem>
                        <SelectItem value="24">24 mois</SelectItem>
                        <SelectItem value="36">36 mois</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={submitting || !creditScore}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {submitting ? "Soumission..." : "Soumettre la demande"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Score Card */}
        {creditScore && (
          <Card className="border-2 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Award className="w-6 h-6" />
                    Votre Score de Crédit
                  </CardTitle>
                  <CardDescription className="text-green-100 mt-1">
                    Mis à jour le {new Date().toLocaleDateString('fr-FR')}
                  </CardDescription>
                </div>
                <Badge className={`${ratingColors[creditScore.rating]} text-sm px-4 py-2`}>
                  {creditScore.rating}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              {/* Score principal */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-40 h-40 rounded-full border-8 border-green-500 mb-4">
                  <div>
                    <div className="text-5xl font-black text-green-600">
                      {creditScore.score}
                    </div>
                    <div className="text-sm text-gray-500">/ 1000</div>
                  </div>
                </div>
                <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                  {creditScore.recommendation}
                </p>
              </div>

              {/* Facteurs détaillés */}
              <div className="grid md:grid-cols-2 gap-6">
                <FactorBar 
                  icon={<TrendingUp className="w-5 h-5" />}
                  label="Historique des transactions"
                  value={creditScore.factors.transactionHistory}
                  color="bg-blue-500"
                />
                <FactorBar 
                  icon={<ShieldCheck className="w-5 h-5" />}
                  label="Historique de remboursement"
                  value={creditScore.factors.repaymentHistory}
                  color="bg-green-500"
                />
                <FactorBar 
                  icon={<Calendar className="w-5 h-5" />}
                  label="Stabilité des revenus"
                  value={creditScore.factors.incomeStability}
                  color="bg-purple-500"
                />
                <FactorBar 
                  icon={<AlertTriangle className="w-5 h-5" />}
                  label="Ratio d'endettement"
                  value={creditScore.factors.debtRatio}
                  color="bg-orange-500"
                />
                <FactorBar 
                  icon={<Clock className="w-5 h-5" />}
                  label="Ancienneté du compte"
                  value={creditScore.factors.accountAge}
                  color="bg-yellow-500"
                />
              </div>

              {/* Montant maximum de prêt */}
              <div className="mt-8 p-6 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <Banknote className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-900">
                    Montant maximum de prêt recommandé
                  </h3>
                </div>
                <div className="text-3xl font-bold text-green-700">
                  {creditScore.maxLoanAmount.toLocaleString('fr-FR')} FCFA
                </div>
                <p className="text-sm text-green-700 mt-2">
                  Basé sur votre score et vos revenus des 12 derniers mois
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Historique des demandes */}
        <Tabs defaultValue="score" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="score">Mon Score</TabsTrigger>
            <TabsTrigger value="history">Historique des demandes</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Mes demandes de prêt</CardTitle>
                <CardDescription>
                  Suivez l'état de vos demandes de prêt
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loanApplications.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune demande de prêt</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {loanApplications.map((app) => (
                      <LoanApplicationCard key={app.id} application={app} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function FactorBar({ icon, label, value, color }: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  color: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <div className="text-gray-600">{icon}</div>
        <span>{label}</span>
        <span className="ml-auto text-gray-900">{value}/100</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}

function LoanApplicationCard({ application }: { application: LoanApplication }) {
  const statusConfig = {
    pending: { icon: Clock, color: 'text-orange-600 bg-orange-100', label: 'En attente' },
    approved: { icon: CheckCircle, color: 'text-green-600 bg-green-100', label: 'Approuvé' },
    rejected: { icon: XCircle, color: 'text-red-600 bg-red-100', label: 'Rejeté' },
  };

  const config = statusConfig[application.status];
  const Icon = config.icon;

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold text-lg">
            {application.amount_xof.toLocaleString('fr-FR')} FCFA
          </div>
          <div className="text-sm text-gray-600">{application.purpose}</div>
          <div className="text-xs text-gray-500 mt-1">
            Durée: {application.duration_months} mois • 
            Demandé le {new Date(application.created_at || '').toLocaleDateString('fr-FR')}
          </div>
        </div>
        <Badge className={`${config.color} flex items-center gap-1`}>
          <Icon className="w-3 h-3" />
          {config.label}
        </Badge>
      </div>
      
      {application.notes && (
        <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
          <strong>Notes:</strong> {application.notes}
        </div>
      )}
      
      {application.decision_date && (
        <div className="text-xs text-gray-500">
          Décision le {new Date(application.decision_date).toLocaleDateString('fr-FR')}
        </div>
      )}
    </div>
  );
}
