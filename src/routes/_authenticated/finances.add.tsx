import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Save, X, PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { BottomSheetMobile, useBottomSheet } from "../../components/ui/bottom-sheet-mobile";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type FinanceType } from "../../lib/finances";

export const Route = createFileRoute("/_authenticated/finances/add")({
  component: AddTransactionPage,
});

function AddTransactionPage() {
  const router = useRouter();
  const { isOpen, open, close } = useBottomSheet();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'expense' as FinanceType,
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");

      const { error } = await supabase
        .from('user_finances')
        .insert({
          user_id: user.id,
          kind: formData.type,
          amount_fcfa: parseInt(formData.amount),
          category: formData.category,
          transaction_date: formData.date,
          created_at: new Date().toISOString(),
        } as any);

      if (error) throw error;

      alert('✅ Transaction ajoutée avec succès !');
      close();
      router.navigate({ to: '/finance' });
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      alert('❌ Erreur lors de l\'ajout de la transaction');
    } finally {
      setLoading(false);
    }
  };

  const categories = formData.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Nouvelle Transaction</h1>
            <p className="text-muted-foreground mt-1">
              Ajoutez une dépense ou un revenu agricole
            </p>
          </div>
        </div>

        {/* Bouton pour ouvrir la BottomSheet sur mobile */}
        <Button 
          className="w-full h-14 text-lg shadow-lg"
          size="lg"
          onClick={open}
        >
          <PlusCircle className="h-6 w-6 mr-2" />
          Nouvelle Transaction
        </Button>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Comment ajouter une transaction ?</CardTitle>
            <CardDescription>
              Cliquez sur le bouton ci-dessus pour ouvrir le formulaire
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="space-y-2">
              <li>✅ <strong>Dépenses :</strong> Engrais, semences, main d'oeuvre...</li>
              <li>✅ <strong>Revenus :</strong> Ventes de récoltes, prestations...</li>
              <li>📍 <strong>Localisation :</strong> Optionnelle mais recommandée</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* BottomSheet Mobile - Formulaire complet */}
      <BottomSheetMobile
        isOpen={isOpen}
        onClose={close}
        title="Nouvelle Transaction"
        footer={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={close}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={loading}
              onClick={handleSubmit}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        }
      >
        <form className="space-y-6">
          {/* Type de transaction */}
          <div className="space-y-2">
            <Label>Type de transaction</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={formData.type === 'expense' ? 'default' : 'outline'}
                className={`flex-1 ${formData.type === 'expense' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                onClick={() => {
                  setFormData({ ...formData, type: 'expense', category: '' });
                }}
              >
                Dépense
              </Button>
              <Button
                type="button"
                variant={formData.type === 'income' ? 'default' : 'outline'}
                className={`flex-1 ${formData.type === 'income' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                onClick={() => {
                  setFormData({ ...formData, type: 'income', category: '' });
                }}
              >
                Revenu
              </Button>
            </div>
          </div>

          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="amount">Montant (FCFA) *</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Ex: 50000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              min="1"
            />
          </div>

          {/* Catégorie */}
          <div className="space-y-2">
            <Label htmlFor="category">Catégorie *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Ex: Achat d'engrais pour le champ de maïs..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Localisation */}
          <div className="space-y-2">
            <Label htmlFor="location">Lieu (optionnel)</Label>
            <Input
              id="location"
              placeholder="Ex: Marché de Ouaga, Champ villageois..."
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
        </form>
      </BottomSheetMobile>
    </div>
  );
}
