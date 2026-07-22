/**
 * AgroField - Credit Scoring System
 * Algorithme de calcul de score de crédit pour les agriculteurs
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================
// TYPES
// ============================================

export interface CreditScoreFactors {
  transactionHistory: number;    // 0-100 (historique des transactions)
  repaymentHistory: number;      // 0-100 (historique de remboursement)
  incomeStability: number;       // 0-100 (stabilité des revenus)
  debtRatio: number;            // 0-100 (ratio d'endettement)
  accountAge: number;           // 0-100 (ancienneté du compte)
}

export interface CreditScoreResult {
  score: number;                // 0-1000
  rating: 'Excellent' | 'Très bon' | 'Bon' | 'Moyen' | 'Faible';
  factors: CreditScoreFactors;
  recommendation: string;
  maxLoanAmount: number;        // Montant maximum de prêt recommandé
}

export interface LoanApplication {
  id?: string;
  user_id: string;
  amount_xof: number;
  purpose: string;
  duration_months: number;
  status: 'pending' | 'approved' | 'rejected';
  credit_score_at_application?: number;
  lender_id?: string;
  decision_date?: string;
  notes?: string;
  created_at?: string;
}

// ============================================
// CONSTANTES
// ============================================

const SCORE_WEIGHTS = {
  transactionHistory: 0.25,
  repaymentHistory: 0.30,
  incomeStability: 0.20,
  debtRatio: 0.15,
  accountAge: 0.10,
};

const SCORE_RATINGS = [
  { min: 900, rating: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' },
  { min: 750, rating: 'Très bon', color: 'text-blue-600', bg: 'bg-blue-100' },
  { min: 600, rating: 'Bon', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  { min: 400, rating: 'Moyen', color: 'text-orange-600', bg: 'bg-orange-100' },
  { min: 0, rating: 'Faible', color: 'text-red-600', bg: 'bg-red-100' },
];

// ============================================
// FONCTIONS PRINCIPALES
// ============================================

/**
 * Calculer le score de crédit d'un utilisateur
 */
export function calculateCreditScore(factors: CreditScoreFactors): number {
  const score = 
    factors.transactionHistory * SCORE_WEIGHTS.transactionHistory +
    factors.repaymentHistory * SCORE_WEIGHTS.repaymentHistory +
    factors.incomeStability * SCORE_WEIGHTS.incomeStability +
    factors.debtRatio * SCORE_WEIGHTS.debtRatio +
    factors.accountAge * SCORE_WEIGHTS.accountAge;

  return Math.round(score * 10); // Score 0-1000
}

/**
 * Obtenir la catégorie/rating du score
 */
export function getScoreRating(score: number): typeof SCORE_RATINGS[0] {
  return SCORE_RATINGS.find(r => score >= r.min) || SCORE_RATINGS[SCORE_RATINGS.length - 1];
}

/**
 * Générer une recommandation basée sur le score
 */
export function getRecommendation(score: number, factors: CreditScoreFactors): string {
  if (score >= 900) {
    return "Excellent profil ! Vous êtes éligible aux meilleurs taux de prêt.";
  }
  
  if (score >= 750) {
    return "Très bon profil. Continuez ainsi pour améliorer encore votre score.";
  }
  
  if (score >= 600) {
    const weakPoints = [];
    if (factors.repaymentHistory < 70) weakPoints.push("retards de paiement");
    if (factors.debtRatio < 60) weakPoints.push("taux d'endettement élevé");
    if (factors.incomeStability < 60) weakPoints.push("revenus irréguliers");
    
    if (weakPoints.length > 0) {
      return `Bon profil. Pour améliorer: ${weakPoints.join(', ')}.`;
    }
    return "Bon profil. Maintenez vos bonnes habitudes financières.";
  }
  
  if (score >= 400) {
    return "Profil moyen. Consultez un conseiller pour améliorer votre situation.";
  }
  
  return "Profil fragile. Commencez par de petits crédits et remboursez à temps.";
}

/**
 * Calculer le montant maximum de prêt recommandé
 */
export function calculateMaxLoan(score: number, monthlyIncome: number): number {
  const baseMultiplier = score >= 750 ? 24 : score >= 600 ? 18 : score >= 400 ? 12 : 6;
  return Math.round(monthlyIncome * baseMultiplier / 1000) * 1000; // Arrondi au millier
}

/**
 * Récupérer l'historique financier d'un utilisateur
 */
export async function getUserFinancialHistory(userId: string, months: number = 12) {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - months);

  // Récupérer dépenses et ventes
  const [expenses, sales] = await Promise.all([
    supabase
      .from('expenses')
      .select('amount_fcfa, spent_at')
      .eq('user_id', userId)
      .gte('spent_at', twelveMonthsAgo.toISOString())
      .order('spent_at', { ascending: true }),
    
    supabase
      .from('sales')
      .select('quantity_kg, unit_price_fcfa, sold_at')
      .eq('user_id', userId)
      .gte('sold_at', twelveMonthsAgo.toISOString())
      .order('sold_at', { ascending: true }),
  ]);

  return {
    expenses: expenses.data || [],
    sales: sales.data || [],
  };
}

/**
 * Analyser les facteurs de crédit d'un utilisateur
 */
export async function analyzeCreditFactors(userId: string): Promise<CreditScoreFactors> {
  const history = await getUserFinancialHistory(userId);
  
  // Facteur 1: Historique des transactions (nombre total)
  const totalTransactions = history.expenses.length + history.sales.length;
  const transactionHistory = Math.min(100, Math.round((totalTransactions / 50) * 100));

  // Facteur 2: Historique de remboursement (simulé - à améliorer avec données réelles)
  const onTimePayments = history.expenses.filter(e => {
    // Simulation: considérer comme "à temps" si payé en espèces ou mobile money
    return true; // À remplacer par vraie logique
  }).length;
  const repaymentHistory = history.expenses.length > 0 
    ? Math.round((onTimePayments / history.expenses.length) * 100)
    : 50; // Défaut si aucune donnée

  // Facteur 3: Stabilité des revenus (régularité des ventes)
  const monthlySales = new Array(12).fill(0);
  history.sales.forEach(sale => {
    const month = new Date(sale.sold_at).getMonth();
    const amount = (sale.quantity_kg || 0) * (sale.unit_price_fcfa || 0);
    monthlySales[month] += amount;
  });
  
  const avgMonthly = monthlySales.reduce((a, b) => a + b, 0) / 12;
  const variance = monthlySales.reduce((sum, val) => sum + Math.pow(val - avgMonthly, 2), 0) / 12;
  const stdDev = Math.sqrt(variance);
  const cv = avgMonthly > 0 ? (stdDev / avgMonthly) * 100 : 100; // Coefficient de variation
  const incomeStability = Math.max(0, Math.min(100, Math.round(100 - cv)));

  // Facteur 4: Ratio d'endettement (dépenses / revenus)
  const totalExpenses = history.expenses.reduce((sum, e) => sum + (e.amount_fcfa || 0), 0);
  const totalIncome = history.sales.reduce((sum, s) => 
    sum + ((s.quantity_kg || 0) * (s.unit_price_fcfa || 0)), 0);
  
  const debtRatio = totalIncome > 0 
    ? Math.max(0, Math.min(100, Math.round((1 - (totalExpenses / totalIncome)) * 100)))
    : 50;

  // Facteur 5: Ancienneté du compte (depuis inscription)
  const { data: { user } } = await supabase.auth.getUser();
  const accountCreated = user?.created_at ? new Date(user.created_at) : new Date();
  const accountAgeMonths = (Date.now() - accountCreated.getTime()) / (1000 * 60 * 60 * 24 * 30);
  const accountAge = Math.min(100, Math.round((accountAgeMonths / 24) * 100));

  return {
    transactionHistory,
    repaymentHistory,
    incomeStability,
    debtRatio,
    accountAge,
  };
}

/**
 * Obtenir le score de crédit complet d'un utilisateur
 */
export async function getCreditScore(userId: string): Promise<CreditScoreResult> {
  // Analyser les facteurs
  const factors = await analyzeCreditFactors(userId);
  
  // Calculer le score
  const score = calculateCreditScore(factors);
  
  // Obtenir le rating
  const { rating, color, bg } = getScoreRating(score);
  
  // Générer recommandation
  const recommendation = getRecommendation(score, factors);
  
  // Calculer montant max de prêt (estimation basée sur revenus)
  const history = await getUserFinancialHistory(userId);
  const totalIncome = history.sales.reduce((sum, s) => 
    sum + ((s.quantity_kg || 0) * (s.unit_price_fcfa || 0)), 0);
  const monthlyIncome = totalIncome / 12;
  const maxLoanAmount = calculateMaxLoan(score, monthlyIncome);

  return {
    score,
    rating,
    factors,
    recommendation,
    maxLoanAmount,
  };
}

/**
 * Enregistrer le score de crédit dans la base de données
 */
export async function saveCreditScore(userId: string, result: CreditScoreResult) {
  const { error } = await supabase.from('credit_scores').upsert({
    user_id: userId,
    score: result.score,
    score_date: new Date().toISOString(),
    factors: result.factors,
    recommendation: result.recommendation,
    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 jours
  }, {
    onConflict: 'user_id',
  });

  if (error) throw error;
}

/**
 * Créer une demande de prêt
 */
export async function createLoanApplication(application: LoanApplication) {
  // Récupérer le score actuel
  const creditScore = await getCreditScore(application.user_id);
  
  const newApplication: Omit<LoanApplication, 'id'> = {
    ...application,
    credit_score_at_application: creditScore.score,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('loan_applications')
    .insert([newApplication])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Récupérer les demandes de prêt d'un utilisateur
 */
export async function getUserLoanApplications(userId: string) {
  const { data, error } = await supabase
    .from('loan_applications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
