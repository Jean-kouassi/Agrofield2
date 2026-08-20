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
  
  // ============================================
  // EN-TÊTE AVEC LOGO
  // ============================================
  
  // Bandeau superieur - Dégradé vert agriculture
  doc.setFillColor(34, 139, 34); // Forest green
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // Logo AgroSphere (à gauche)
  try {
    const logoPath = 'public/agrosphere-logo.png';
    doc.addImage(logoPath, 'PNG', margin + 5, 8, 35, 35);
  } catch (e) {
    // Si le logo n'est pas trouvé, on continue sans
  }
  
  // Titre principal (décalé à droite du logo)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text('AgroSphere', margin + 48, 20, { align: 'left' });
  
  // Sous-titre
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(200, 255, 200);
  doc.text('Plateforme de Gestion Agricole', margin + 48, 28, { align: 'left' });
  
  // Type de document
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('RELEVÉ FINANCIER', margin + 48, 38, { align: 'left' });
  
  // Ligne decorative dorée (récolte)
  doc.setDrawColor(218, 165, 32); // Goldenrod
  doc.setLineWidth(0.8);
  doc.line(0, 50, pageWidth, 50);
  
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
  doc.text('Date d\'émission: ' + today, pageWidth - margin - 60, 58, { align: 'right' });

  // ============================================
  // CARTEAU RESUME FINANCIER
  // ============================================
  
  let yPos = 68;
  
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
      head: [['DATE', 'TYPE', 'CATÉGORIE', 'DÉTAILS', 'MONTANT']],
      body: tableRows,
      theme: 'striped',
      // Largeur totale du tableau = largeur de page - marges
      tableWidth: pageWidth - (margin * 2),
      // Distribution optimisée des colonnes
      columnStyles: {
        0: { 
          cellWidth: (pageWidth - (margin * 2)) * 0.12, 
          halign: 'center', 
          valign: 'middle', 
          fontStyle: 'normal',
          fontSize: 9,
          cellPadding: 4 
        }, // DATE
        1: { 
          cellWidth: (pageWidth - (margin * 2)) * 0.10, 
          halign: 'center', 
          valign: 'middle', 
          fontStyle: 'bold',
          fontSize: 9,
          cellPadding: 4 
        }, // TYPE
        2: { 
          cellWidth: (pageWidth - (margin * 2)) * 0.15, 
          halign: 'left', 
          valign: 'middle', 
          fontStyle: 'normal',
          fontSize: 9,
          cellPadding: 4 
        }, // CATÉGORIE
        3: { 
          cellWidth: (pageWidth - (margin * 2)) * 0.33, 
          halign: 'left', 
          valign: 'middle', 
          fontStyle: 'normal',
          fontSize: 8,
          cellPadding: 4 
        }, // DÉTAILS
        4: { 
          cellWidth: (pageWidth - (margin * 2)) * 0.30, 
          halign: 'right', 
          valign: 'middle', 
          fontStyle: 'bold',
          fontSize: 10,
          cellPadding: { top: 4, right: 5, bottom: 4, left: 4 } 
        }, // MONTANT
      },
      headStyles: {
        fillColor: [34, 139, 34], // Vert forêt
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center',
        cellPadding: 5
      },
      alternateRowStyles: {
        fillColor: [245, 250, 245], // Vert très pâle pour les lignes paires
      },
      didParseCell: (data) => {
        // Colorer par type dans la colonne TYPE et MONTANT
        if (data.section === 'body') {
          const row = data.row.raw as any;
          const isDepense = row[1] === 'DEPENSE';
          
          // Colonne TYPE
          if (data.column.index === 1) {
            if (isDepense) {
              data.cell.styles.textColor = [185, 28, 28]; // Rouge foncé
              data.cell.styles.fillColor = [254, 226, 226]; // Fond rouge très pâle
            } else {
              data.cell.styles.textColor = [22, 163, 74]; // Vert
              data.cell.styles.fillColor = [220, 252, 231]; // Fond vert très pâle
            }
          }
          
          // Colonne MONTANT
          if (data.column.index === 4) {
            if (isDepense) {
              data.cell.styles.textColor = [185, 28, 28]; // Rouge foncé
            } else {
              data.cell.styles.textColor = [22, 103, 7]; // Vert foncé
            }
          }
        }
      },
      margin: { left: margin, right: margin, top: 10 },
      showHead: 'everyPage',
      tableLineWidth: 0.3,
      tableLineColor: [200, 200, 200],
      foot: [['', '', '', 'TOTAL:', formatNumberSimple(transactions.reduce((sum, t) => sum + (t.signe === '-' ? -t.montant : t.montant), 0))]],
      footStyles: {
        fillColor: [34, 139, 34],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11,
        halign: 'right',
        cellPadding: 5
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
    footerStartY = drawStatsSection(doc, footerStartY, margin, pageWidth, transactions, totalExp, totalSales, netto) as any;
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
    'Document genere automatiquement par AgroSphere.',
    'Donnees infalsifiables (hash SHA-256).',
    'Support: support@AgroSphere.bf',
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
  doc.text('(c) 2026 AgroSphere - Burkina Faso', pageWidth / 2, finalFooterY, { align: 'center' });

  // ============================================
  // GENERATION DU FICHIER
  // ============================================
  
  const filename = 'AgroSphere_Releve_Financier_' + new Date().toISOString().slice(0, 10) + '.pdf';
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
  (doc.setDrawColor as any)(...color.map(c => Math.max(0, c - 40)));
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
// FONCTION AUXILIAIRE: Section stats (stub)
// ============================================

function drawStatsSection(doc: any, y: number, margin: number, pageWidth: number, transactions: any[], totalExp: number, totalSales: number, netto: number): number {
  return y + 10;
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
    (doc.setFillColor as any)(...color);
    doc.roundedRect(x, y, width, height, radius, radius, 'F');
  } else {
    (doc.setDrawColor as any)(...color);
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
