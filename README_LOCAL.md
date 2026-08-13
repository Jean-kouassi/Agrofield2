# 🌾 AgroSphere2 - PROJET LOCAL

**Date de clonage:** 21 Juillet 2026  
**Emplacement:** `C:\Users\Kouassi\Desktop\AgroSphere2`  
**Projet original:** https://github.com/Jean-kouassi/field-bloom-wise.git

---

## ⚠️ IMPORTANT : PROJET LOCAL UNIQUEMENT

Ce projet est une **copie locale** du repo GitHub.

**Règles :**
- ✅ Tu peux modifier **tout ce que tu veux** en local
- ❌ **NE PAS** pousser sur Git (`git push` désactivé)
- ✅ Les modifications restent **uniquement sur ton ordinateur**
- ✅ Parfait pour tester, expérimenter, développer

---

## 🚫 GIT DÉSACTIVÉ

Le dossier `.git` a été renommé en `.git.disabled` pour empêcher toute opération Git accidentelle.

**Si tu veux réactiver Git plus tard :**
```bash
cd C:\Users\Kouassi\Desktop\AgroSphere2
Move-Item -Path ".git.disabled" -Destination ".git"
```

---

## 📦 INSTALLATION

### Dépendances déjà installées ✅

```bash
cd C:\Users\Kouassi\Desktop\AgroSphere2
npm run dev
```

### Si besoin de réinstaller :

```bash
npm install
npm run dev
```

---

## 🔧 CONFIGURATION

### Projet Supabase utilisé :
- **URL:** https://lddgtwqfhpiwodpmjhia.supabase.co
- **Project ID:** `lddgtwqfhpiwodpmjhia`

Les variables sont déjà configurées dans `.env` ✅

---

## 🎯 PROCHAINES ÉTAPES

Maintenant que le projet est en local, tu peux :

1. **Modifier le code** comme tu veux
2. **Tester de nouvelles fonctionnalités**
3. **Casser des trucs** (pas de problème, c'est local !)
4. **Comparer avec AgroSphere** (l'autre projet)

---

## 📁 STRUCTURE DU PROJET

```
AgroSphere2/
├── src/                      # Code source
│   ├── routes/               # Pages (TanStack Router)
│   ├── components/           # Composants React
│   ├── lib/                  # Utilitaires
│   └── integrations/         # Intégrations (Supabase, etc.)
├── public/                   # Assets statiques
├── supabase/                 # Migrations SQL
├── .env                      # Variables d'environnement
├── package.json              # Dépendances
└── vite.config.ts            # Config Vite
```

---

## 💡 DIFFÉRENCES AVEC AgroSphere (workspace)

| Aspect | AgroSphere (workspace) | AgroSphere2 (bureau) |
|--------|----------------------|---------------------|
| **Emplacement** | `C:\Users\Kouassi\.openclaw\workspace\agrosphere-connect` | `C:\Users\Kouassi\Desktop\AgroSphere2` |
| **Git** | Non connecté | Cloné mais désactivé |
| **Supabase** | `stzilbwemluhftcvdqfm` | `lddgtwqfhpiwodpmjhia` |
| **Usage** | Développement principal | Tests/Expérimentation locale |
| **Modifications** | Peut être poussé sur Git | 100% local, jamais poussé |

---

## 🛠️ COMMANDES UTILES

```bash
# Lancer le serveur de développement
npm run dev

# Build de production
npm run build

# Preview production
npm run preview

# Installer une dépendance
npm install <package-name>

# Nettoyer node_modules (si problème)
Remove-Item -Recurse -Force node_modules
npm install
```

---

## 🎉 PRÊT À MODIFIER !

Le projet est maintenant :
- ✅ Cloné sur le bureau
- ✅ Dépendances installées
- ✅ Git désactivé
- ✅ Configuration prête
- ✅ 100% local

**Tu peux commencer à modifier ce que tu veux !** 🚀

---

**Projet AgroSphere2 — Copie locale pour développement et tests**  
*Ne pas pousser sur Git - Modifications locales uniquement*
