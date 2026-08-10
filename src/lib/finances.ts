/**
 * AgroField - Finance Management
 * Gestion des dépenses et revenus pour les agriculteurs
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================
// TYPES
// ============================================

export type FinanceType = 'income' | 'expense';

export type ExpenseCategory = 
  | 'semences'
  | 'engrais'
  | 'pesticides'
  | 'irrigation'
  | 'equipment'
  | 'main_doeuvre'
  | 'transport'
  | 'emballage'
  | 'communication'
  | 'credit_remboursement'
  | 'frais_generaux'
  | 'autre_depense';

export type IncomeCategory =
  | 'vente_tomates'
  | 'vente_oignons'
  | 'vente_mil'
  | 'vente_sorgho'
  | 'vente_mais'
  | 'vente_niebe'
  | 'vente_arachide'
  | 'vente_betail'
  | 'subventions'
  | 'autres_revenus';

export type PaymentMethod = 'cash' | 'orange_money' | 'moov_money' | 'virement';

export interface FinanceTransaction {
  id: string;
  user_id: string;
  kind: 'expense' | 'sale' | 'transfer';
  category: string | null;
  amount_fcfa: number;
  crop_type: string | null;
  quantity_kg: number | null;
  unit_price_fcfa: number | null;
  buyer: string | null;
  seller: string | null;
  transaction_date: string;
  proof_type: string;
  proof_image_path: string | null;
  proof_reference: string | null;
  parcel_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinanceFilters {
  kind?: 'expense' | 'sale' | 'transfer';
  category?: string;
  startDate?: string;
  endDate?: string;
  parcelId?: string;
}

export interface FinanceSummary {
  totalTransactions: number;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  incomeCount: number;
  expenseCount: number;
  firstTransaction: string;
  lastTransaction: string;
}

export interface CategoryBreakdown {
  category: string;
  transactionCount: number;
  totalAmount: number;
  avgAmount: number;
}
export interface MonthlySummary {
  month: string;
  totalTransactions: number;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
}

// ============================================
// CATÉGORIES
// ============================================

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; icon: string }[] = [
  { value: 'semences', label: 'Semences', icon: '🌱' },
  { value: 'engrais', label: 'Engrais', icon: '🧪' },
  { value: 'pesticides', label: 'Pesticides', icon: '🦟' },
  { value: 'irrigation', label: 'Irrigation', icon: '💧' },
  { value: 'equipment', label: 'Équipement', icon: '🚜' },
  { value: 'main_doeuvre', label: 'Main d\'œuvre', icon: '👥' },
  { value: 'transport', label: 'Transport', icon: '🚚' },
  { value: 'emballage', label: 'Emballage', icon: '📦' },
  { value: 'communication', label: 'Communication', icon: '📱' },
  { value: 'credit_remboursement', label: 'Remboursement crédit', icon: '💰' },
  { value: 'frais_generaux', label: 'Frais généraux', icon: '🏠' },
  { value: 'autre_depense', label: 'Autre dépense', icon: '💸' },
];

export const INCOME_CATEGORIES: { value: IncomeCategory; label: string; icon: string }[] = [
  { value: 'vente_tomates', label: 'Vente de tomates', icon: '🍅' },
  { value: 'vente_oignons', label: 'Vente d\'oignons', icon: '🧅' },
  { value: 'vente_mil', label: 'Vente de mil', icon: '🌾' },
  { value: 'vente_sorgho', label: 'Vente de sorgho', icon: '🌽' },
  { value: 'vente_mais', label: 'Vente de maïs', icon: '🌽' },
  { value: 'vente_niebe', label: 'Vente de niébé', icon: '🫘' },
  { value: 'vente_arachide', label: 'Vente d\'arachide', icon: '🥜' },
  { value: 'vente_betail', label: 'Vente de bétail', icon: '🐄' },
  { value: 'subventions', label: 'Subventions', icon: '🎁' },
  { value: 'autres_revenus', label: 'Autres revenus', icon: '💵' },
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; color: string }[] = [
  { value: 'cash', label: 'Espèces', color: 'bg-green-500' },
  { value: 'orange_money', label: 'Orange Money', color: 'bg-orange-500' },
  { value: 'moov_money', label: 'Moov Money', color: 'bg-blue-500' },
  { value: 'virement', label: 'Virement bancaire', color: 'bg-purple-500' },
];

// ============================================
// FONCTIONS PRINCIPALES
// ============================================

/**
 * Récupérer toutes les transactions d'un utilisateur
 */
export async function fetchFinances(filters?: FinanceFilters): Promise<FinanceTransaction[]> {
  let query = supabase
    .from('user_finances')
    .select('*')
    .order('transaction_date', { ascending: false });

  // Appliquer les filtres
  if (filters?.kind) {
    query = query.eq('kind', filters.kind);
  }

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.startDate) {
    query = query.gte('transaction_date', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('transaction_date', filters.endDate);
  }

  if (filters?.parcelId) {
    query = query.eq('parcel_id', filters.parcelId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as FinanceTransaction[];
}

/**
 * Récupérer le résumé financier d'un utilisateur
 */
export async function fetchFinanceSummary(userId: string): Promise<FinanceSummary | null> {
  const { data, error } = await supabase
    .from('user_finances_summary')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as FinanceSummary | null;
}

/**
 * Récupérer les dépenses par catégorie
 */
export async function fetchExpensesByCategory(userId: string): Promise<CategoryBreakdown[]> {
  const { data, error } = await supabase
    .from('expenses_by_category')
    .select('*')
    .eq('user_id', userId)
    .order('total_amount', { ascending: false });

  if (error) throw error;
  return (data || []) as unknown as CategoryBreakdown[];
}

/**
 * Récupérer les revenus par catégorie
 */
export async function fetchIncomesByCategory(userId: string): Promise<CategoryBreakdown[]> {
  const { data, error } = await supabase
    .from('incomes_by_category')
    .select('*')
    .eq('user_id', userId)
    .order('total_amount', { ascending: false });

  if (error) throw error;
  return (data || []) as unknown as CategoryBreakdown[];
}

/**
 * Récupérer le résumé mensuel
 */
export async function fetchMonthlySummary(userId: string, months: number = 12): Promise<MonthlySummary[]> {
  const { data, error } = await supabase
    .from('monthly_finances_summary')
    .select('*')
    .eq('user_id', userId)
    .order('month', { ascending: false })
    .limit(months);

  if (error) throw error;
  return (data || []) as unknown as MonthlySummary[];
}

/**
 * Créer une nouvelle transaction
 */
export async function createTransaction(transaction: Partial<FinanceTransaction>): Promise<FinanceTransaction> {
  const { data, error } = await supabase
    .from('user_finances')
    .insert({
      ...transaction,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any)
    .select()
    .single();

  if (error) throw error;
  return data as FinanceTransaction;
}

/**
 * Mettre à jour une transaction
 */
export async function updateTransaction(
  id: string,
  updates: Partial<FinanceTransaction>
): Promise<FinanceTransaction> {
  const { data, error } = await supabase
    .from('user_finances')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as FinanceTransaction;
}

/**
 * Supprimer une transaction
 */
export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase
    .from('user_finances')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Télécharger un reçu (image)
 */
export async function uploadReceipt(file: File, userId: string): Promise<string> {
  const fileName = `${userId}/receipts/${Date.now()}_${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('finance-receipts')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('finance-receipts')
    .getPublicUrl(fileName);

  return publicUrl;
}

/**
 * Calculer le solde net
 */
export function calculateNetBalance(income: number, expense: number): number {
  return income - expense;
}

/**
 * Formater un montant en FCFA
 */
export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}

/**
 * Obtenir l'icône pour une catégorie
 */
export function getCategoryIcon(category: string, type: FinanceType): string {
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const found = categories.find(c => c.value === category);
  return found?.icon || '💰';
}

/**
 * Obtenir le label pour une catégorie
 */
export function getCategoryLabel(category: string, type: FinanceType): string {
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const found = categories.find(c => c.value === category);
  return found?.label || category;
}
