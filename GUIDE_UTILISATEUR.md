# 📱 Guide Utilisateur - AgroField

**Version :** 1.0  
**Dernière mise à jour :** 31 Juillet 2026  
**Public cible :** Agriculteurs individuels et coopératives (Burkina Faso, Mali, Niger, Bénin, Togo)

---

## 👋 Bienvenue sur AgroField !

AgroField est votre assistant agricole intelligent. Il vous aide à :

- 🌾 **Gérer vos parcelles** (superficie, cultures, traitements)
- 🤖 **Diagnostiquer les maladies** de vos plantes par photo
- 📡 **Suivre l'humidité du sol** avec des capteurs connectés
- 💰 **Vendre vos récoltes** au meilleur prix sur le marketplace
- 🏦 **Obtenir un crédit** grâce à votre score agricole

**100% gratuit** pendant la phase beta.  
**Fonctionne sans internet** (mode hors ligne).

---

## 🚀 Premiers pas

### Étape 1 : Installer l'application

**Sur Android :**

1. Ouvrez https://agrofield2.pages.dev dans Chrome
2. Une bannière apparaît : **"Installer AgroField"**
3. Appuyez sur **"Installer"**
4. L'icône AgroField apparaît sur votre écran d'accueil

**Sur iPhone :**

1. Ouvrez https://agrofield2.pages.dev dans Safari
2. Appuyez sur le bouton **Partager** (carré avec flèche vers le haut)
3. Choisissez **"Sur l'écran d'accueil"**
4. Nommez "AgroField" et validez

> 💡 **Astuce :** L'application fonctionne même sans connexion internet après installation !

---

### Étape 2 : Créer votre compte

1. Ouvrez AgroField
2. Appuyez sur **"Commencer"**
3. Choisissez **"Se connecter avec Google"**
4. Sélectionnez votre compte Google
5. Remplissez votre profil :
   - **Nom complet**
   - **Quartier/Village** (ex: Gounghin, Secteur 24)
   - **Ville** (ex: Ouagadougou, Bobo-Dioulasso)
   - **Téléphone** (ex: +226 XX XX XX XX)
6. Validez

> 🔒 **Vos données sont sécurisées** et ne sont jamais partagées sans votre accord.

---

### Étape 3 : Ajouter votre première parcelle

1. Sur l'écran d'accueil, appuyez sur **"Parcelles"** (ou glissez vers la gauche)
2. Appuyez sur le bouton **"+"** en bas à droite
3. Remplissez les informations :
   - **Culture** : Maïs, Mil, Sorgho, Riz, Coton, etc.
   - **Superficie** : en hectares (ex: 2.5 ha)
   - **Date de semis** : quand vous avez planté
   - **Localisation** : appuyez sur la carte pour placer votre parcelle
4. Appuyez sur **"Enregistrer"**

> 📍 **Conseil :** Ajoutez toutes vos parcelles dès le début pour un meilleur suivi !

---

## 📊 Fonctionnalités principales

### 1. Tableau de bord

**Ce que vous voyez :**

- 🌡️ **Météo locale** (prévisions 7 jours)
- 📅 **Rappels** (semis, traitements, récolte)
- 📈 **Résumé de vos parcelles** (nombre, superficie totale)
- ⚠️ **Alertes** (maladies détectées, capteurs critiques)

**Actions rapides :**

- Ajouter une parcelle
- Lancer un diagnostic
- Vendre une récolte
- Voir les prix du marché

---

### 2. Gestion des parcelles

**Pour chaque parcelle, vous pouvez :**

#### 📝 Modifier les informations
- Changer la culture
- Mettre à jour la superficie
- Ajuster la date de semis

#### 🗓️ Suivre les événements culturaux
Appuyez sur **"Ajouter un événement"** :
- **Semis** : date, variété, densité
- **Traitement** : produit, dose, date
- **Irrigation** : date, quantité d'eau
- **Récolte** : date, rendement (kg/ha)

#### 📸 Prendre des photos
- Photo de la parcelle (pour suivre la croissance)
- Photo de maladie (pour diagnostic IA)
- Photo de ravageurs

#### 🗺️ Voir la localisation
- Carte interactive avec votre parcelle
- Calcul automatique de la superficie
- Partage de position avec un conseiller

---

### 3. Diagnostic IA des maladies

**Comment diagnostiquer une plante malade :**

1. Allez dans **"Diagnostic"** (glissez vers la gauche depuis le dashboard)
2. Appuyez sur **"Prendre une photo"**
3. Photographiez la feuille/plante malade
   - Assurez-vous que la zone malade est bien visible
   - Évitez les ombres et le flou
4. Attendez 5-10 secondes
5. L'IA vous donne :
   - **Nom de la maladie** (ex: Striga, Mildiou, Chenille légionnaire)
   - **Niveau de gravité** (Faible, Moyen, Élevé)
   - **Traitements recommandés** (bio et conventionnel)
   - **Dosages et fréquences**

> 🌿 **Traitements bio prioritaires** : Nous privilégions les solutions naturelles (neem, cendres, rotation) avant les pesticides chimiques.

**Historique des diagnostics :**
- Tous vos diagnostics sont sauvegardés
- Consultez-les anytime dans l'onglet **"Historique"**
- Partagez-les avec un conseiller agricole

---

### 4. Capteurs IoT (optionnel)

**Si vous avez un capteur ESP32 :**

#### Configuration initiale
1. Allez dans **"Capteurs"**
2. Appuyez sur **"Ajouter un capteur"**
3. Entrez le **ID du capteur** (ex: ESP32_001)
4. Associez-le à une **parcelle**
5. Choisissez le **mode** :
   - **Auto** : mesures toutes les 15 minutes
   - **Manuel** : vous déclenchez les mesures

#### Données surveillées
- 💧 **Humidité du sol** (10 cm et 30 cm de profondeur)
- 🌡️ **Température** (air et sol)
- 🌞 **Luminosité** (en lux)
- 🔋 **Batterie** (niveau de charge)

#### Alertes automatiques
Vous recevez une notification si :
- Humidité < 20% → **Risque de sécheresse**
- Température > 40°C → **Stress thermique**
- Batterie < 10% → **Recharger le capteur**

#### Irrigation à distance
- Appuyez sur **"Activer l'irrigation"**
- Le capteur ouvre l'électrovanne
- Arrêt automatique après 30 minutes (ou manuel)

> 📶 **Mode hors ligne :** Les capteurs stockent les données localement et les synchronisent quand le réseau revient.

---

### 5. Marketplace (Vendre vos récoltes)

**Comment vendre :**

1. Allez dans **"Marketplace"**
2. Appuyez sur **"Créer une offre"**
3. Remplissez :
   - **Produit** : Maïs, Mil, Sorgho, etc.
   - **Quantité disponible** : en kg ou tonnes
   - **Prix demandé** : en FCFA/kg
   - **Localisation** : où se trouve la récolte
   - **Photos** : ajoutez 1-3 photos de la récolte
   - **Description** : qualité, variété, date de récolte
4. Appuyez sur **"Publier l'offre"**

**Votre offre est visible par :**
- Acheteurs grossistes
- Coopératives
- Transformateurs locaux

**Quand vous recevez une proposition :**
1. Notification push ou SMS
2. Consultez l'offre dans **"Mes ventes"**
3. Acceptez, refusez ou négociez
4. Une fois accepté → **Génération automatique du reçu**

**Paiement :**
- 📱 **Orange Money** / **Moov Money** (recommandé)
- 💵 **Espèces** (à la livraison)
- 🏦 **Virement bancaire** (pour gros volumes)

> 📄 **Preuve de transaction :** Chaque vente génère un reçu PDF + SMS de confirmation + témoin optionnel.

---

### 6. Finances & Crédit

#### Suivi des revenus/dépenses

**Enregistrer une transaction :**

1. Allez dans **"Finances"**
2. Appuyez sur **"+"**
3. Choisissez **Type** :
   - **Revenu** (vente de récolte, subvention)
   - **Dépense** (semences, engrais, main d'œuvre)
4. Remplissez :
   - **Montant** (en FCFA)
   - **Catégorie** (ex: "Vente maïs", "Achat engrais")
   - **Date**
   - **Parcelle associée** (optionnel)
   - **Preuve** (photo du reçu, SMS)
5. Validez

**Tableau de bord financier :**
- 📊 Revenus vs Dépenses (par mois, par parcelle)
- 📈 Bénéfice net
- 🏷️ Répartition par catégorie (graphique camembert)

---

#### Score de crédit agricole

**Comment ça marche :**

AgroField calcule automatiquement votre **score de crédit** (0 à 1000) basé sur :

| Facteur | Poids | Comment l'améliorer |
|---------|-------|---------------------|
| **Historique de ventes** | 30% | Vendez régulièrement sur le marketplace |
| **Rendements déclarés** | 25% | Enregistrez vos récoltes avec précision |
| **Régularité des activités** | 20% | Soyez actif sur l'app (au moins 1x/semaine) |
| **Diversification** | 15% | Ayez plusieurs parcelles/cultures |
| **Paiements Orange/Moov** | 10% | Utilisez le mobile money pour les transactions |

**Votre score est visible dans :**
- Onglet **"Profil"** → **"Score de crédit"**
- Exemple : **720/1000** = "Bon crédit"

**À quoi sert le score ?**
- 🏦 **Demander un prêt** auprès des microfinances partenaires
- 📉 **Négocier de meilleurs prix** avec les acheteurs
- 🤝 **Accéder à des programmes de subvention**

> 💡 **Conseil :** Un score > 600 vous qualifie pour des prêts à taux préférentiel !

---

## 📶 Mode hors ligne

### Ce qui fonctionne SANS internet

✅ Consulter vos parcelles enregistrées  
✅ Voir l'historique des diagnostics  
✅ Consulter les prix de référence (cache 24h)  
✅ Enregistrer des événements culturaux (sync au retour du réseau)  
✅ Prendre des photos (sync ultérieure)  

### Ce qui NE fonctionne PAS sans internet

❌ Nouveau diagnostic IA (nécessite l'API Gemini)  
❌ Publier une offre sur le marketplace  
❌ Envoyer des commandes d'irrigation aux capteurs  
❌ Synchroniser les données des capteurs Bluetooth  

### Comment activer/désactiver le mode hors ligne

Le mode hors ligne est **automatique** :
- Quand vous perdez le réseau → l'app bascule en mode offline
- Une bannière jaune apparaît : **"Mode hors ligne activé"**
- Quand le réseau revient → sync automatique en arrière-plan

> 🔄 **Sync intelligente :** Seules les nouvelles données sont envoyées (économie de data).

---

## 🛠️ Dépannage

### Problème : L'application ne se lance pas

**Solution :**
1. Fermez complètement l'app (swipe vers le haut dans les apps récentes)
2. Rouvrez-la
3. Si ça persiste → Désinstallez et réinstallez

---

### Problème : Je n'arrive pas à me connecter

**Solution :**
1. Vérifiez votre connexion internet
2. Essayez en navigation privée : https://agrofield2.pages.dev
3. Si ça marche → Videz le cache de votre navigateur
4. Si ça ne marche pas → Contactez support@agrofield.com

---

### Problème : Le diagnostic IA ne fonctionne pas

**Causes possibles :**
- ❌ Pas de connexion internet (requis pour l'IA)
- ❌ Photo trop floue ou mal éclairée
- ❌ Plante non reconnue (culture non supportée)

**Solutions :**
1. Activez vos données mobiles ou WiFi
2. Reprenez la photo :
   - Zone malade bien visible
   - Lumière naturelle (pas de flash)
   - Pas de mouvement (tenir le téléphone stable)
3. Réessayez avec une autre feuille

---

### Problème : Mes capteurs n'envoient pas de données

**Vérifications :**
1. ✅ Le capteur est-il allumé ? (LED verte)
2. ✅ La batterie est-elle chargée ? (>20%)
3. ✅ Le capteur est-il associé à votre parcelle dans l'app ?
4. ✅ Êtes-vous dans la zone Bluetooth (<50m) ?

**Solution :**
- Redémarrez le capteur (bouton reset 3 secondes)
- Dans l'app : **"Capteurs"** → **"Resynchroniser"**
- Si ça persiste → Contactez support@agrofield.com

---

### Problème : Je ne reçois pas les notifications

**Sur Android :**
1. Paramètres → Applications → AgroField → Notifications
2. Activez **"Autoriser les notifications"**
3. Cochez toutes les catégories (Alertes, Rappels, Ventes)

**Sur iPhone :**
1. Réglages → Notifications → AgroField
2. Activez **"Autoriser les notifications"**
3. Choisissez **"Bannières"** ou **"Alertes"**

---

## 📞 Support & Contact

### Besoin d'aide ?

**Par email :**  
📧 support@agrofield.com  
(Réponse sous 24-48h)

**Par WhatsApp :**  
📱 +226 XX XX XX XX  
(Lun-Sam, 8h-18h)

**Dans l'application :**  
1. Allez dans **"Profil"**
2. Appuyez sur **"Aide & Support"**
3. Décrivez votre problème
4. Envoyez (avec photos si nécessaire)

---

### Signaler un bug

1. Allez dans **"Profil"** → **"Signaler un bug"**
2. Décrivez le problème :
   - Que faisiez-vous quand le bug est arrivé ?
   - Quel est le comportement attendu ?
   - Quel est le comportement observé ?
3. Ajoutez une capture d'écran (optionnel)
4. Envoyez

> 🐛 **Merci !** Chaque signalement nous aide à améliorer l'application.

---

## 📚 Ressources supplémentaires

### Guides thématiques

- 📘 **Guide des cultures** (semis, entretien, récolte)
- 🐛 **Encyclopédie des maladies** (symptômes, traitements)
- 🌧️ **Calendrier cultural** (quand planifier quoi)
- 💰 **Guide des prix** (tendances par région/culture)

Disponibles dans l'app : **"Profil"** → **"Ressources"**

---

### Vidéos tutorielles

- 🎥 **"Premiers pas sur AgroField"** (5 min)
- 🎥 **"Diagnostiquer une maladie en 1 minute"** (2 min)
- 🎥 **"Configurer son capteur ESP32"** (10 min)
- 🎥 **"Vendre sur le marketplace"** (7 min)

Disponibles sur : **YouTube → @AgroFieldAfrica**

---

### Foire Aux Questions (FAQ)

**Q : L'application est-elle vraiment gratuite ?**  
R : Oui, 100% gratuite pendant la phase beta. À l'avenir, certaines fonctionnalités premium pourraient être payantes (ex: analyses avancées, conseils personnalisés).

**Q : Mes données sont-elles en sécurité ?**  
R : Oui. Vos données sont stockées sur des serveurs sécurisés (Supabase) et ne sont jamais vendues à des tiers. Vous pouvez exporter/supprimer vos données anytime.

**Q : Puis-je utiliser l'app sans smartphone ?**  
R : Non, AgroField nécessite un smartphone Android ou iPhone. Cependant, une version USSD (*123#) est en développement pour les téléphones basiques.

**Q : Comment ajouter plusieurs utilisateurs (coopérative) ?**  
R : Chaque membre crée son propre compte. Un compte "Chef de coopérative" (bientôt disponible) permettra de regrouper les parcelles de tous les membres.

**Q : L'IA peut-elle se tromper ?**  
R : Oui, comme toute IA, le diagnostic peut être incorrect à ~10-15%. Toujours confirmer avec un conseiller agricole en cas de doute.

---

## 🎯 Conseils pour bien démarrer

### Semaine 1 : Prise en main
- [ ] Installez l'application
- [ ] Créez votre compte
- [ ] Ajoutez toutes vos parcelles
- [ ] Explorez chaque onglet

### Semaine 2 : Utilisation active
- [ ] Enregistrez un événement cultural (semis, traitement)
- [ ] Faites un diagnostic IA (même sur une plante saine pour tester)
- [ ] Consultez les prix du marketplace
- [ ] Invitez un ami agriculteur

### Semaine 3 : Optimisation
- [ ] Configurez un capteur IoT (si disponible)
- [ ] Publiez une offre de vente
- [ ] Enregistrez vos dépenses/revenus
- [ ] Consultez votre score de crédit

### Semaine 4 : Routine
- [ ] Ouvrez l'app quotidiennement (check météo + rappels)
- [ ] Mettez à jour vos parcelles weekly
- [ ] Vendez vos récoltes sur le marketplace
- [ ] Partagez votre expérience avec d'autres agriculteurs

---

## 🙏 Remerciements

Merci d'utiliser AgroField ! 🌾

Nous sommes fiers de contribuer au développement de l'agriculture ouest-africaine. Chaque parcelle enregistrée, chaque diagnostic effectué, chaque vente réalisée nous rapproche d'une agriculture plus productive, durable et rémunératrice.

**Ensemble, cultivons l'avenir !** 🚜🌱

---

*Document rédigé en français simple et accessible.*  
*Traductions disponibles : Mooré, Dioula, Fulfulde (bientôt)*  
*Dernière mise à jour : 31 Juillet 2026*
