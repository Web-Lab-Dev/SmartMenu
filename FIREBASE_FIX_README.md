# Firebase Admin SDK - Solution au problème de clé privée

## Résumé du Problème

L'erreur `Failed to parse private key: Error: Invalid PEM formatted message.` est causée par des **variables d'environnement système Windows** qui écrasent votre fichier `.env.local`.

### Diagnostic Complet

✅ **Votre fichier `.env.local` est CORRECT**
- Clé privée complète (1732 caractères)
- Format PEM valide
- Client email correct: `firebase-adminsdk-fbsvc@smart-resto-d2577.iam.gserviceaccount.com`

❌ **Variables système Windows sont INCORRECTES**
- Clé privée tronquée (76 caractères seulement!)
- Client email différent: `firebase-adminsdk-jrgpg@smart-resto-d2577.iam.gserviceaccount.com`
- Ces variables ont priorité sur `.env.local`

## Solution en 3 Étapes

### Étape 1: Exécuter le script de nettoyage

**Option A - Script Batch (Simple):**
```cmd
fix-firebase-env.cmd
```
Double-cliquez sur le fichier ou exécutez-le dans un terminal.

**Option B - Script PowerShell (Recommandé):**
```powershell
powershell -ExecutionPolicy Bypass -File fix-firebase-env.ps1
```

Ce script va:
1. Détecter les variables Firebase dans l'environnement système
2. Vous demander confirmation
3. Les supprimer automatiquement

### Étape 2: Vérifier que c'est résolu

```bash
node verify-firebase-config.js
```

Vous devriez voir:
```
✅ CONFIGURATION LOOKS GOOD!
```

### Étape 3: Redémarrer le serveur

**IMPORTANT**: Fermez TOUS les terminaux ouverts, puis:

1. Ouvrez un NOUVEAU terminal
2. Naviguez vers le projet:
   ```bash
   cd "C:\Users\X1 Carbon\Desktop\RestoTech"
   ```
3. Lancez le serveur:
   ```bash
   npm run dev
   ```
4. Testez la génération de coupons!

## Vérification Manuelle (Si les scripts ne marchent pas)

### Vérifier les variables d'environnement

Dans PowerShell:
```powershell
# Vérifier les variables utilisateur
[System.Environment]::GetEnvironmentVariable("FIREBASE_PRIVATE_KEY", "User")
[System.Environment]::GetEnvironmentVariable("FIREBASE_CLIENT_EMAIL", "User")

# Vérifier les variables système (nécessite Admin)
[System.Environment]::GetEnvironmentVariable("FIREBASE_PRIVATE_KEY", "Machine")
[System.Environment]::GetEnvironmentVariable("FIREBASE_CLIENT_EMAIL", "Machine")
```

Toutes devraient retourner `$null` (vide).

### Supprimer manuellement les variables

1. **Ouvrir les Paramètres Système:**
   - Appuyez sur `Windows + R`
   - Tapez `sysdm.cpl` et appuyez sur Entrée
   - Allez dans l'onglet "Avancé"
   - Cliquez sur "Variables d'environnement"

2. **Supprimer les variables Firebase:**
   Dans "Variables utilisateur" ET "Variables système":
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PROJECT_ID`

3. **Redémarrer le terminal**

## Pourquoi ce problème s'est produit?

Les variables d'environnement système de Windows ont été probablement définies:
- Lors d'un test ou développement antérieur
- Par un autre outil ou script
- Par erreur avec des valeurs incomplètes

Windows donne priorité aux variables système sur les fichiers `.env.local`.

## Notes Importantes

### Ordre de priorité des variables d'environnement

Next.js charge les variables dans cet ordre (du plus prioritaire au moins):
1. ⚡ Variables d'environnement système (HIGHEST)
2. `.env.local` (pour le développement local)
3. `.env`

### Sécurité

**Ne jamais** mettre les credentials Firebase Admin dans:
- ❌ Variables d'environnement système
- ❌ Fichiers committés dans Git
- ❌ Code client-side

**Toujours** les mettre dans:
- ✅ `.env.local` (ignoré par Git)
- ✅ Variables d'environnement du serveur de production (Vercel, etc.)

### Format correct dans .env.local

Votre format actuel est parfait:
```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"
```

Next.js:
1. Enlève automatiquement les guillemets doubles
2. Convertit `\n` en vraies nouvelles lignes
3. Passe la clé correcte à Firebase Admin SDK

## Nettoyage après résolution

Une fois le problème résolu, vous pouvez supprimer:
- ✅ `fix-firebase-env.cmd`
- ✅ `fix-firebase-env.ps1`
- ✅ `verify-firebase-config.js`
- ✅ `FIREBASE_FIX_README.md` (ce fichier)
- ✅ `FIREBASE_ADMIN_FIX.md`
- ✅ `src/app/api/test-env/` (dossier)
- ✅ `src/app/api/test-firebase-admin/` (dossier)

## Support

Si le problème persiste après avoir suivi ces étapes:

1. Vérifiez que vous avez fermé ET rouvert votre terminal
2. Vérifiez le fichier `.env.local` directement:
   ```bash
   cat .env.local | grep FIREBASE_PRIVATE_KEY
   ```
3. Vérifiez que la clé fait ~1700 caractères (pas 76!)
4. Assurez-vous d'utiliser le bon projet Firebase
