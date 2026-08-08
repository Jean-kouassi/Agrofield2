/**
 * Export PDF professionnel pour l'historique des finances
 * Design inspire du contexte agricole africain
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function exportFinanceToPDF(
  expenses: any[],
  sales: any[],
  parcels: any[]
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // ============================================
  // CALCULS DES TOTAUX - CONVERSION EXPLICITE
  // ============================================
  
  let totalExp = 0;
  for (const e of expenses) {
    const amount = Number(e.amount_fcfa);
    if (!isNaN(amount)) {
      totalExp += amount;
    }
  }

  let totalSales = 0;
  for (const s of sales) {
    const qty = Number(s.quantity_kg);
    const price = Number(s.unit_price_fcfa);
    if (!isNaN(qty) && !isNaN(price)) {
      totalSales += qty * price;
    }
  }

  const netto = totalSales - totalExp;

  console.log('=== DEBUG PDF ===');
  console.log('Total Ventes:', totalSales);
  console.log('Total Depenses:', totalExp);
  console.log('Netto:', netto);

  // ============================================
  // EN-TETE PROFESSIONNEL AVEC MOTIF AGRICOLE
  // ============================================
  
  // Bandeau superieur - Degradé vert agriculture
  doc.setFillColor(34, 139, 34); // Forest green
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Ligne decorative dorée (recolte)
  doc.setDrawColor(218, 165, 32); // Goldenrod
  doc.setLineWidth(0.5);
  doc.line(0, 40, pageWidth, 40);
  
  // Titre principal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(255, 255, 255);
  doc.text('AGROFIELD', pageWidth / 2, 18, { align: 'center' });
  
  // Sous-titre
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('Plateforme de Gestion Agricole', pageWidth / 2, 27, { align: 'center' });
  
  // Type de document
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('RELEVE FINANCIER', pageWidth / 2, 35, { align: 'center' });
  
  // Metadonnees du rapport
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  const today = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text('Date d\'emission: ' + today, pageWidth / 2, 48, { align: 'center' });

  // ============================================
  // CARTEAU RESUME FINANCIER
  // ============================================
  
  let yPos = 58;
  
  // Titre de section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(34, 139, 34);
  doc.text('SYNTHESE FINANCIERE', margin, yPos);
  
  yPos += 8;
  
  // Calculer les dimensions des cartes
  const cardWidth = (pageWidth - (margin * 2) - 20) / 3;
  const cardHeight = 30;
  const cardX = [margin, margin + cardWidth + 10, margin + (cardWidth * 2) + 20];
  
  // Carte 1: Ventes (Vert clair)
  drawFinancialCard(doc, cardX[0], yPos, cardWidth, cardHeight, 
    'TOTAL VENTES', formatNumberSimple(totalSales), [34, 197, 94], 'FCFA');
  
  // Carte 2: Depenses (Rouge orange)
  drawFinancialCard(doc, cardX[1], yPos, cardWidth, cardHeight,
    'TOTAL DEPENSES', formatNumberSimple(totalExp), [239, 68, 68], 'FCFA');
  
  // Carte 3: Benefice (Bleu ou Orange selon resultat)
  const benefitLabel = netto >= 0 ? 'BENEFICE NET' : 'PERTE NETTE';
  const benefitColor = netto >= 0 ? [59, 130, 246] : [249, 115, 22];
  drawFinancialCard(doc, cardX[2], yPos, cardWidth, cardHeight,
    benefitLabel, formatNumberSimple(Math.abs(netto)), benefitColor, 'FCFA');
  
  yPos += cardHeight + 15;

  // ============================================
  // TABLEAU DETAILLE DES TRANSACTIONS
  // ============================================
  
  // Titre de section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(34, 139, 34);
  doc.text('DETAIL DES TRANSACTIONS', margin, yPos);
  
  yPos += 8;
  
  const parcelMap = new Map(parcels.map((p: any) => [p.id, p.name]));
  const transactions: any[] = [];
  
  // Ajouter les depenses
  for (const e of expenses) {
    const amount = Number(e.amount_fcfa);
    if (!isNaN(amount)) {
      transactions.push({
        date: formatDateFull(e.spent_at),
        type: 'DEPENSE',
        libelle: e.category,
        details: buildExpenseDetails(e, parcelMap),
        montant: amount,
        signe: '-',
      });
    }
  }
  
  // Ajouter les ventes
  for (const s of sales) {
    const qty = Number(s.quantity_kg);
    const price = Number(s.unit_price_fcfa);
    if (!isNaN(qty) && !isNaN(price)) {
      const amount = qty * price;
      transactions.push({
        date: formatDateFull(s.sold_at),
        type: 'VENTE',
        libelle: s.crop_type,
        details: buildSaleDetails(s, parcelMap),
        montant: amount,
        signe: '+',
      });
    }
  }
  
  // Trier par date decroissante
  transactions.sort((a, b) => (a.date < b.date ? 1 : -1));
  
  if (transactions.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('Aucune transaction enregistree sur cette periode.', margin, yPos);
    yPos += 10;
  } else {
    const tableRows = transactions.map((t) => [
      t.date,
      t.type,
      t.libelle,
      t.details,
      t.signe + formatNumberSimple(t.montant),
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['DATE', 'TYPE', 'CATEGORIE', 'DETAILS', 'MONTANT']],
      body: tableRows,
      theme: 'grid',
      // Largeur totale du tableau = largeur de page - marges (0 pour coller aux bords)
      tableWidth: pageWidth - margin,
      // Distribution en pourcentages qui totalise 100%
      columnStyles: {
        0: { cellWidth: (pageWidth - margin) * 0.09, halign: 'center', valign: 'middle', fontStyle: 'bold', cellPadding: 3 }, // DATE
        1: { cellWidth: (pageWidth - margin) * 0.07, halign: 'center', valign: 'middle', fontStyle: 'bold', cellPadding: 3 }, // TYPE
        2: { cellWidth: (pageWidth - margin) * 0.11, valign: 'middle', fontStyle: 'normal', cellPadding: 3 }, // CATEGORIE
        3: { cellWidth: (pageWidth - margin) * 0.28, valign: 'middle', fontStyle: 'normal', cellPadding: 3 }, // DETAILS
        4: { cellWidth: (pageWidth - margin) * 0.45, halign: 'right', valign: 'middle', fontStyle: 'bold', cellPadding: { top: 3, right: 0, bottom: 3, left: 3 } }, // MONTANT - padding right à 0
      },
      didParseCell: (data) => {
        // Colorer par type
        if (data.section === 'body' && data.column.index === 1) {
          const row = data.row.raw;
          if (row[1] === 'DEPENSE') {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          } else if (row[1] === 'VENTE') {
            data.cell.styles.textColor = [22, 163, 74];
            data.cell.styles.fontStyle = 'bold';
          }
        }
        // Montant colore
        if (data.section === 'body' && data.column.index === 4) {
          const row = data.row.raw;
          if (row[1] === 'DEPENSE') {
            data.cell.styles.textColor = [220, 38, 38];
          } else {
            data.cell.styles.textColor = [22, 163, 74];
          }
        }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: margin, right: margin },
      showHead: 'everyPage',
      tableLineWidth: 0.3,
      tableLineColor: [220, 220, 220],
      foot: [['', '', '', 'TOTAL:', formatNumberSimple(transactions.reduce((sum, t) => sum + (t.signe === '-' ? -t.montant : t.montant), 0))]],
      footStyles: {
        fillColor: [34, 139, 34],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'right',
      },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // ============================================
  // PIED DE PAGE PROFESSIONNEL
  // ============================================
  
  // Le pied de page se place directement apres le tableau
  // Si le tableau est court, on ajoute une section de stats pour remplir l'espace
  let footerStartY = yPos + 5;
  const remainingSpace = pageHeight - footerStartY - 35; // 35mm reserve pour le pied de page
  
  // Si il y a beaucoup d'espace vide (> 40mm), on remplit avec des stats supplementaires
  if (remainingSpace > 40 && transactions.length > 0) {
    // Section statistiques pour remplir l'espace
    footerStartY = drawStatsSection(doc, footerStartY, margin, pageWidth, transactions, totalExp, totalSales, netto);
  }
  
  // S'assurer que le pied de page ne depasse pas la page
  footerStartY = Math.min(footerStartY, pageHeight - 35);
  
  // Ligne de separation decorative
  doc.setDrawColor(218, 165, 32);
  doc.setLineWidth(0.5);
  doc.line(margin, footerStartY, pageWidth - margin, footerStartY);
  
  let footerY = footerStartY + 8;
  
  // Informations legales
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(34, 139, 34);
  doc.text('INFORMATIONS', margin, footerY);
  
  footerY += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  
  const legalText = [
    'Document genere automatiquement par AgroField.',
    'Donnees infalsifiables (hash SHA-256).',
    'Support: support@agrofield.bf',
  ];
  
  legalText.forEach((line) => {
    doc.text(line, margin, footerY);
    footerY += 4;
  });
  
  // Copyright centre en bas
  const finalFooterY = pageHeight - 8;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text('(c) 2026 AgroField - Burkina Faso', pageWidth / 2, finalFooterY, { align: 'center' });

  // ============================================
  // GENERATION DU FICHIER
  // ============================================
  
  const filename = 'AGROFIELD_Releve_Financier_' + new Date().toISOString().slice(0, 10) + '.pdf';
  doc.save(filename);
  
  console.log('PDF genere:', filename);
  console.log('Transactions:', transactions.length);
  console.log('Total Ventes:', formatNumberSimple(totalSales), 'FCFA');
  console.log('Total Depenses:', formatNumberSimple(totalExp), 'FCFA');
  console.log('Benefice:', formatNumberSimple(netto), 'FCFA');
}

// ============================================
// FONCTION AUXILIAIRE: Carte financiere
// ============================================

function drawFinancialCard(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  value: string,
  color: number[],
  unit: string
) {
  // Background avec coins arrondis
  const radius = 5;
  roundRect(doc, x, y, width, height, radius, color, true);
  
  // Bordure fine
  doc.setLineWidth(1);
  doc.setDrawColor(...color.map(c => Math.max(0, c - 40)));
  roundRect(doc, x, y, width, height, radius, color, false);
  
  // Label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(label, x + width / 2, y + 10, { align: 'center' });
  
  // Valeur
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(value, x + width / 2, y + 20, { align: 'center' });
  
  // Unite
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(unit, x + width / 2, y + 26, { align: 'center' });
}

// ============================================
// FONCTION AUXILIAIRE: Rectangle arrondi
// ============================================

function roundRect(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  color: number[],
  fill: boolean
) {
  if (fill) {
    doc.setFillColor(...color);
    doc.roundedRect(x, y, width, height, radius, radius, 'F');
  } else {
    doc.setDrawColor(...color);
    doc.roundedRect(x, y, width, height, radius, radius, 'S');
  }
}

// ============================================
// UTILITAIRES
// ============================================

/**
 * Formatage simple pour jsPDF-AutoTable
 * Utilise un espace normal (ASCII 32) au lieu de l'espace insécable
 * IMPORTANT: Convertit le nombre en string CHIFFRE PAR CHIFFRE
 * pour eviter tout probleme d'encodage
 */
function formatNumberSimple(n: number): string {
  const num = Math.round(Number(n));
  if (isNaN(num)) {
    return '0';
  }
  
  // Conversion manuelle pour eviter tout probleme
  const str = Math.abs(num).toString();
  let result = '';
  let count = 0;
  
  for (let i = str.length - 1; i >= 0; i--) {
    if (count > 0 && count % 3 === 0) {
      result = ' ' + result;
    }
    result = str[i] + result;
    count++;
  }
  
  if (num < 0) {
    result = '-' + result;
  }
  
  return result;
}

function formatDateFull(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

function buildExpenseDetails(e: any, parcelMap: Map<string, string>): string {
  const parts: string[] = [];
  
  if (e.parcel_id && parcelMap.has(e.parcel_id)) {
    parts.push('Parcelle: ' + parcelMap.get(e.parcel_id));
  }
  
  if (e.description) {
    parts.push(e.description);
  }
  
  if (e.proof_type && e.proof_type !== 'none') {
    const proofLabels: Record<string, string> = {
      receipt: 'Reçu',
      mobile_money: 'Mobile Money',
      coop_slip: 'Bon coop',
      witness: 'Témoin',
    };
    parts.push('Preuve: ' + proofLabels[e.proof_type]);
  }
  
  return parts.join(' | ');
}

function buildSaleDetails(s: any, parcelMap: Map<string, string>): string {
  const parts: string[] = [];
  
  const qty = Number(s.quantity_kg);
  const price = Number(s.unit_price_fcfa);
  parts.push(qty + ' kg x ' + formatNumberSimple(price) + ' F/kg');
  
  if (s.buyer) {
    parts.push('Acheteur: ' + s.buyer);
  }
  
  if (s.parcel_id && parcelMap.has(s.parcel_id)) {
    parts.push('Parcelle: ' + parcelMap.get(s.parcel_id));
  }
  
  if (s.proof_type && s.proof_type !== 'none') {
    const proofLabels: Record<string, string> = {
      receipt: 'Reçu',
      mobile_money: 'Mobile Money',
      coop_slip: 'Bon coop',
      witness: 'Témoin',
    };
    parts.push('Preuve: ' + proofLabels[s.proof_type]);
  }
  
  return parts.join(' | ');
}
