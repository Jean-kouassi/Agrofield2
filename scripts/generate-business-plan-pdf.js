import PdfPrinter from 'pdfmake/build/pdfmake.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fonts
const fonts = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf'
  }
};

const printer = new PdfPrinter(fonts);

// Couleurs AgroField2
const COLORS = {
  primary: '#10b981',
  secondary: '#059669',
  accent: '#f59e0b',
  text: '#1f2937'
};

function generateBusinessPlan() {
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [20, 20, 20, 20],
    
    // En-tête
    header: {
      columns: [
        { 
          text: 'AgroField²', 
          fontSize: 14, 
          bold: true, 
          color: COLORS.primary,
          margin: [20, 10]
        },
        { 
          text: 'Business Plan 2026', 
          fontSize: 10, 
          italics: true, 
          color: COLORS.muted,
          alignment: 'right',
          margin: [0, 15]
        }
      ]
    },
    
    // Pied de page
    footer: function(currentPage, pageCount) {
      return {
        columns: [
          { 
            text: `© 2026 AgroField2`, 
            fontSize: 8, 
            color: COLORS.muted,
            margin: [20, 10]
          },
          { 
            text: `Page ${currentPage} / ${pageCount}`, 
            fontSize: 8, 
            color: COLORS.muted,
            alignment: 'right',
            margin: [0, 10]
          }
        ]
      };
    },
    
    // Contenu
    content: [
      // PAGE DE COUVERTURE
      {
        stack: [
          { text: '', margin: [0, 100] },
          {
            text: 'AgroField²',
            fontSize: 48,
            bold: true,
            color: COLORS.primary,
            alignment: 'center',
            margin: [0, 0, 0, 20]
          },
          {
            text: 'Plateforme Tech pour l\'Agriculture Africaine',
            fontSize: 16,
            color: COLORS.text,
            alignment: 'center',
            margin: [0, 0, 0, 40]
          },
          {
            text: 'BUSINESS PLAN',
            fontSize: 32,
            bold: true,
            color: COLORS.secondary,
            alignment: 'center',
            margin: [0, 0, 0, 10]
          },
          {
            text: 'Modèle Économique & Stratégie de Croissance',
            fontSize: 14,
            color: COLORS.text,
            alignment: 'center',
            margin: [0, 0, 0, 60]
          },
          {
            text: 'Présenté par Jean Kouassi',
            fontSize: 12,
            color: COLORS.text,
            alignment: 'center'
          },
          {
            text: 'Juillet 2026',
            fontSize: 12,
            color: COLORS.text,
            alignment: 'center',
            margin: [0, 5, 0, 5]
          },
          {
            text: 'Ouagadougou, Burkina Faso',
            fontSize: 12,
            color: COLORS.text,
            alignment: 'center'
          },
          {
            text: 'v2.0 - Modèle "Freemium Utility + Ecosystem Revenue"',
            fontSize: 10,
            color: COLORS.muted,
            alignment: 'center',
            margin: [0, 80, 0, 0]
          }
        ],
        pageBreak: 'after'
      },
      
      // TABLE DES MATIÈRES
      {
        text: 'Table des Matières',
        fontSize: 20,
        bold: true,
        color: COLORS.primary,
        margin: [0, 0, 0, 20]
      },
      {
        toc: {
          title: { text: 'Sommaire', fontSize: 16, bold: true },
          numberStyle: { bold: false },
          textStyle: { fontSize: 11 },
          lineStyle: { dash: { length: 2 } }
        },
        pageBreak: 'after'
      },
      
      // SECTION 1
      {
        text: '1. Résumé Exécutif',
        fontSize: 18,
        bold: true,
        color: COLORS.primary,
        margin: [0, 0, 0, 15],
        tocItem: true,
        id: 'resume'
      },
      {
        text: "AgroField2 est une plateforme numérique tout-en-un destinée à moderniser l'agriculture familiale en Afrique de l'Ouest. Notre solution combine application mobile, intelligence artificielle, capteurs IoT et marketplace pour offrir aux agriculteurs des outils professionnels accessibles même sur Android basique et en zones rurales.",
        fontSize: 11,
        margin: [0, 0, 0, 15]
      },
      {
        ul: [
          {
            stack: [
              { text: '🎯 Vision', bold: true, color: COLORS.accent, fontSize: 12 },
              { text: "Devenir la plateforme de référence pour 500 000 agriculteurs ouest-africains d'ici 2029, en augmentant leurs revenus de 40% grâce à la technologie.", fontSize: 11, margin: [15, 5, 0, 0] }
            ]
          },
          {
            stack: [
              { text: '💰 Objectif Financier', bold: true, color: COLORS.accent, fontSize: 12 },
              { text: "Atteindre 147 millions FCFA de revenus annuels dès l'Année 3, avec une marge nette de ~35%, grâce à un modèle multi-flux combinant abonnements, commissions, services financiers et data.", fontSize: 11, margin: [15, 5, 0, 0] }
            ]
          },
          {
            stack: [
              { text: '🤝 Partenariats Clés', bold: true, color: COLORS.accent, fontSize: 12 },
              { text: 'FAIJ (financement non-dilutif), Coris Bank (crédit agricole), Orange Money (paiements), assureurs (assurance indicielle), transporteurs (logistique), État (data agricole).', fontSize: 11, margin: [15, 5, 0, 0] }
            ]
          }
        ],
        margin: [0, 0, 0, 20]
      },
      
      // SECTION 2
      {
        text: '2. Analyse du Modèle Actuel (SWOT)',
        fontSize: 18,
        bold: true,
        color: COLORS.primary,
        margin: [0, 0, 0, 15],
        tocItem: true
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*'],
          body: [
            [
              { text: 'FORCES ✅', bold: true, fillColor: COLORS.primary, color: 'white' },
              { text: 'FAIBLESSES ❌', bold: true, fillColor: COLORS.primary, color: 'white' }
            ],
            [
              {
                ul: [
                  'Multi-revenus (commission, abonnement, services, data)',
                  'Faible coût marginal',
                  'Effet de réseau puissant',
                  'Data précieuse pour partenaires'
                ],
                margin: [5, 5, 5, 5]
              },
              {
                ul: [
                  'Risque de contournement marketplace',
                  'Adoption lente en zone rurale',
                  'Dépendance aux partenaires',
                  'Saisonnalité des revenus'
                ],
                margin: [5, 5, 5, 5]
              }
            ],
            [
              { text: 'OPPORTUNITÉS 🚀', bold: true, fillColor: COLORS.light },
              { text: 'MENACES ⚠️', bold: true, fillColor: COLORS.light }
            ],
            [
              {
                ul: [
                  'Marché immense (80M agriculteurs AO)',
                  'Digitalisation accélérée',
                  'Soutien institutionnel fort',
                  'IA mature et abordable'
                ],
                margin: [5, 5, 5, 5]
              },
              {
                ul: [
                  'Concurrents gratuits (apps gov, WhatsApp)',
                  'Connectivité rurale instable',
                  'Pouvoir d\'achat limité',
                  'Régulation bancaire stricte'
                ],
                margin: [5, 5, 5, 5]
              }
            ]
          ]
        },
        margin: [0, 0, 0, 20]
      },
      
      // SECTIONS 3-14 (SQUELETTE)
      {
        text: '3. Nouveau Modèle Économique: "Freemium Utility + Ecosystem Revenue"',
        fontSize: 18,
        bold: true,
        color: COLORS.primary,
        margin: [0, 20, 0, 15],
        tocItem: true,
        pageBreak: 'before'
      },
      { text: '[Voir détails complets dans le rapport chat]', fontSize: 11, italics: true, color: COLORS.muted },
      
      {
        text: '4. Pilier 1: Offre Gratuite (Acquisition Massive)',
        fontSize: 18,
        bold: true,
        color: COLORS.primary,
        margin: [0, 20, 0, 15],
        tocItem: true
      },
      { text: '[Voir détails complets dans le rapport chat]', fontSize: 11, italics: true, color: COLORS.muted },
      
      {
        text: '5. Pilier 2: Abonnement Premium (Revenus Récurrents)',
        fontSize: 18,
        bold: true,
        color: COLORS.primary,
        margin: [0, 20, 0, 15],
        tocItem: true
      },
      { text: '[Voir détails complets dans le rapport chat]', fontSize: 11, italics: true, color: COLORS.muted },
      
      {
        text: '6. Pilier 3: Commissions Marketplace (Transactionnel)',
        fontSize: 18,
        bold: true,
        color: COLORS.primary,
        margin: [0, 20, 0, 15],
        tocItem: true
      },
      { text: '[Voir détails complets dans le rapport chat]', fontSize: 11, italics: true, color: COLORS.muted },
      
      {
        text: '7. Pilier 4: Services Écosystémiques (PARTENAIRES)',
        fontSize: 18,
        bold: true,
        color: COLORS.primary,
        margin: [0, 20, 0, 15],
        tocItem: true,
        pageBreak: 'before'
      },
      { text: '[Voir détails complets dans le rapport chat]', fontSize: 11, italics: true, color: COLORS.muted },
      
      {
        text: '8. Pilier 5: Capteurs IoT (Hardware + SaaS)',
        fontSize: 18,
        bold: true,
        color: COLORS.primary,
        margin: [0, 20, 0, 15],
        tocItem: true
      },
      { text: '[Voir détails complets dans le rapport chat]', fontSize: 11, italics: true, color: COLORS.muted },
      
      {
        text: '9. Projections Financières (Année 1-3)',
        fontSize: 18,
        bold: true,
        color: COLORS.primary,
        margin: [0, 20, 0, 15],
        tocItem: true
      },
      {
        table: {
          widths: ['*', '*', '*', '*'],
          body: [
            [
              { text: 'Pilier', bold: true, fillColor: COLORS.primary, color: 'white' },
              { text: 'Année 1', bold: true, fillColor: COLORS.light },
              { text: 'Année 2', bold: true, fillColor: COLORS.light },
              { text: 'Année 3', bold: true, fillColor: COLORS.light }
            ],
            ['Premium', '0.6M', '6M', '30M'],
            ['Marketplace', '0M', '1M', '3M'],
            ['Crédit', '0.3M', '3M', '15M'],
            ['Assurance', '0M', '1M', '3M'],
            ['Logistique', '0M', '9.6M', '24M'],
            ['Data B2B', '2M', '15M', '50M'],
            ['Formation', '0M', '3M', '10M'],
            ['IoT', '0M', '1.8M', '12M'],
            [
              { text: 'TOTAL', bold: true },
              { text: '2.9M FCFA', bold: true, color: COLORS.primary },
              { text: '41.4M FCFA', bold: true, color: COLORS.primary },
              { text: '147M FCFA', bold: true, color: COLORS.accent }
            ]
          ]
        },
        margin: [0, 10, 0, 20]
      },
      
      {
        text: '10. Intégration des Partenaires',
        fontSize: 18,
        bold: true,
        color: COLORS.primary,
        margin: [0, 20, 0, 15],
        tocItem: true,
        pageBreak: 'before'
      },
      { text: '[Voir détails complets dans le rapport chat]', fontSize: 11, italics: true, color: COLORS.muted },
      
      {
        text: '11. Roadmap de Monétisation',
        fontSize: 18,
        bold: true,
        color: COLORS.primary,
        margin: [0, 20, 0, 15],
        tocItem: true
      },
      { text: '[Voir détails complets dans le rapport chat]', fontSize: 11, italics: true, color: COLORS.muted },
      
      {
        text: '12. Innovations Disruptives',
        fontSize: 18,
        bold: true,
        color: COLORS.primary,
        margin: [0, 20, 0, 15],
        tocItem: true
      },
      { text: '[Voir détails complets dans le rapport chat]', fontSize: 11, italics: true, color: COLORS.muted },
      
      {
        text: '13. Analyse des Risques & Mitigation',
        fontSize: 18,
        bold: true,
        color: COLORS.primary,
        margin: [0, 20, 0, 15],
        tocItem: true,
        pageBreak: 'before'
      },
      { text: '[Voir détails complets dans le rapport chat]', fontSize: 11, italics: true, color: COLORS.muted },
      
      {
        text: '14. Feuille de Route & Prochaines Actions',
        fontSize: 18,
        bold: true,
        color: COLORS.primary,
        margin: [0, 20, 0, 15],
        tocItem: true
      },
      { text: '[Voir détails complets dans le rapport chat]', fontSize: 11, italics: true, color: COLORS.muted },
      
      // PAGE FINALE
      {
        stack: [
          { text: '', margin: [0, 100] },
          {
            text: 'Merci de votre attention',
            fontSize: 24,
            bold: true,
            color: COLORS.primary,
            alignment: 'center',
            margin: [0, 0, 0, 20]
          },
          {
            text: 'Des questions ? Discutons-en !',
            fontSize: 14,
            color: COLORS.text,
            alignment: 'center',
            margin: [0, 0, 0, 40]
          },
          {
            text: 'Jean Kouassi',
            fontSize: 12,
            bold: true,
            alignment: 'center'
          },
          {
            text: '📧 jeankouasst@gmail.com',
            fontSize: 11,
            color: COLORS.text,
            alignment: 'center',
            margin: [0, 5, 0, 5]
          },
          {
            text: '📱 +226 XX XX XX XX',
            fontSize: 11,
            color: COLORS.text,
            alignment: 'center',
            margin: [0, 5, 0, 5]
          },
          {
            text: '🌐 https://agrofield2.vercel.app',
            fontSize: 11,
            color: COLORS.text,
            alignment: 'center',
            margin: [0, 5, 0, 5]
          },
          {
            text: '📍 Ouagadougou, Burkina Faso',
            fontSize: 11,
            color: COLORS.text,
            alignment: 'center',
            margin: [0, 20, 0, 0]
          }
        ],
        alignment: 'center'
      }
    ],
    
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      subheader: {
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5]
      }
    }
  };

  // Générer le PDF
  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  const outputPath = path.join(__dirname, '..', 'AgroField2_Business_Plan_2026.pdf');
  
  pdfDoc.pipe(fs.createWriteStream(outputPath));
  pdfDoc.end();
  
  console.log(`✅ PDF généré avec succès: ${outputPath}`);
}

// Exécution
try {
  generateBusinessPlan();
  console.log('🎉 Business Plan PDF créé sur votre bureau !');
} catch (error) {
  console.error('❌ Erreur lors de la génération du PDF:', error);
  process.exit(1);
}
