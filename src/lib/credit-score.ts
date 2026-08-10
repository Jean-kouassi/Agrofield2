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
  { min: 900, rating: 'Excellent' as const, color: 'text-green-600', bg: 'bg-green-100' },
  { min: 750, rating: 'Très bon' as const, color: 'text-blue-600', bg: 'bg-blue-100' },
  { min: 600, rating: 'Bon' as const, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  { min: 400, rating: 'Moyen' as const, color: 'text-orange-600', bg: 'bg-orange-100' },
  { min: 0, rating: 'Faible' as const, color: 'text-red-600', bg: 'bg-red-100' },
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
 * Générer une recommandation basée sur le score et les facteurs
 */
export function getRecommendation(score: number, factors: CreditScoreFactors): string {
  if (score >= 900) {
    return "Excellent profil ! Vous êtes éligible aux meilleurs taux de prêt. Continuez à documenter vos transactions avec des preuves.";
  }
  
  if (score >= 750) {
    const tips: string[] = [];
    if (factors.incomeStability < 80) tips.push(" régulariser vos ventes mensuelles");
    if (factors.transactionHistory < 80) tips.push(" ajouter plus de transactions documentées");
    return tips.length > 0
      ? `Très bon profil. Pour atteindre l'excellence: ${tips.join(',')}.`
      : "Très bon profil. Continuez ainsi pour maintenir votre score.";
  }
  
  if (score >= 600) {
    const weakPoints: string[] = [];
    if (factors.repaymentHistory < 70) weakPoints.push("documenter plus de transactions avec preuves");
    if (factors.debtRatio < 60) weakPoints.push("réduire vos dépenses par rapport à vos revenus");
    if (factors.incomeStability < 60) weakPoints.push("régulariser vos ventes (vendre chaque mois)");
    
    if (weakPoints.length > 0) {
      return `Bon profil. Pour améliorer: ${weakPoints.join(', ')}.`;
    }
    return "Bon profil. Maintenez vos bonnes habitudes financières.";
  }
  
  if (score >= 400) {
    const issues: string[] = [];
    if (factors.transactionHistory < 40) issues.push("ajoutez plus de transactions dans l'application");
    if (factors.incomeStability < 40) issues.push("essayez de vendre régulièrement chaque mois");
    if (factors.debtRatio < 40) issues.push("réduisez vos dépenses");
    return issues.length > 0
      ? `Profil moyen. Actions recommandées: ${issues.join(', ')}.`
      : "Profil moyen. Consultez un conseiller pour améliorer votre situation.";
  }
  
  return "Profil fragile. Commencez par enregistrer vos transactions avec des preuves (reçus, SMS) et remboursez à temps pour construire votre historique.";
}

/**
 * Calculer le montant maximum de prêt recommandé
 */
export function calculateMaxLoan(score: number, monthlyIncome: number): number {
  // Multiplicateur selon le score (mois de revenu)
  let baseMultiplier: number;
  if (score >= 900) baseMultiplier = 24;
  else if (score >= 750) baseMultiplier = 18;
  else if (score >= 600) baseMultiplier = 12;
  else if (score >= 400) baseMultiplier = 6;
  else baseMultiplier = 3;

  // Plafonner à 10M FCFA pour éviter des montants irréalistes
  const maxAmount = Math.min(monthlyIncome * baseMultiplier, 10_000_000);
  return Math.max(50_000, Math.round(maxAmount / 1000) * 1000); // Arrondi au millier, min 50k FCFA
}

/**
 * Récupérer l'historique financier d'un utilisateur
 */
export async function getUserFinancialHistory(userId: string, months: number = 12) {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - months);

  // Récupérer dépenses et ventes avec preuves
  const [expenses, sales] = await Promise.all([
    supabase
      .from('expenses')
      .select('amount_fcfa, spent_at, proof_type, receipt_path, flagged_outlier')
      .eq('user_id', userId)
      .gte('spent_at', twelveMonthsAgo.toISOString())
      .order('spent_at', { ascending: true }),
    
    supabase
      .from('sales')
      .select('quantity_kg, unit_price_fcfa, sold_at, proof_type, receipt_path, flagged_outlier')
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
  
  // Facteur 1: Historique des transactions (volume + preuves)
  const totalTransactions = history.expenses.length + history.sales.length;
  const transactionsWithProof = [
    ...history.expenses.filter(e => e.proof_type && e.proof_type !== 'none' && e.receipt_path),
    ...history.sales.filter(s => s.proof_type && s.proof_type !== 'none' && s.receipt_path),
  ].length;
  const proofRatio = totalTransactions > 0 ? transactionsWithProof / totalTransactions : 0;
  // Score base sur le volume + bonus pour preuves (max 100)
  const transactionHistory = Math.min(100, Math.round((totalTransactions / 50) * 70 + proofRatio * 30));

  // Facteur 2: Historique de remboursement (basé sur preuves + pas d'outliers)
  const flaggedOutliers = [
    ...history.expenses.filter(e => e.flagged_outlier),
    ...history.sales.filter(s => s.flagged_outlier),
  ].length;
  const cleanTransactions = totalTransactions - flaggedOutliers;
  const repaymentHistory = totalTransactions > 0 
    ? Math.round((cleanTransactions / totalTransactions) * 100)
    : 50;

  // Facteur 3: Stabilité des revenus (régularité des ventes par mois)
  const monthlySales = new Array(12).fill(0);
  history.sales.forEach(sale => {
    const month = new Date(sale.sold_at).getMonth();
    const amount = (sale.quantity_kg || 0) * (sale.unit_price_fcfa || 0);
    monthlySales[month] += amount;
  });
  
  const activeMonths = monthlySales.filter(v => v > 0).length;
  const avgMonthly = monthlySales.reduce((a, b) => a + b, 0) / 12;
  const variance = monthlySales.reduce((sum, val) => sum + Math.pow(val - avgMonthly, 2), 0) / 12;
  const stdDev = Math.sqrt(variance);
  const cv = avgMonthly > 0 ? (stdDev / avgMonthly) * 100 : 100;
  // Score: régularité (CV bas = bon) + continuité (mois actifs)
  const regularityScore = Math.max(0, Math.min(70, Math.round(70 - cv * 0.7)));
  const continuityScore = Math.round((activeMonths / 12) * 30);
  const incomeStability = Math.min(100, regularityScore + continuityScore);

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
    factors: result.factors as any, // Cast to Json
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
