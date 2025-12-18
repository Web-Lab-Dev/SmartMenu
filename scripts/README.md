# Scripts de Maintenance

## fix-prices-in-db.ts

Ce script corrige tous les prix existants dans la base de données Firestore en les divisant par 100.

### Pourquoi ce script ?

Avant les corrections, les prix étaient stockés en "centimes" (multipliés par 100).
Par exemple:
- 1000 FCFA était stocké comme 100000
- 3500 FCFA était stocké comme 350000

Maintenant, les prix sont stockés directement en FCFA.

### Comment l'utiliser ?

1. **Assure-toi d'avoir les variables d'environnement Firebase Admin configurées:**
   ```env
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-service-account-email
   FIREBASE_PRIVATE_KEY="your-private-key"
   ```

2. **Installe ts-node si ce n'est pas déjà fait:**
   ```bash
   npm install -D ts-node
   ```

3. **Exécute le script:**
   ```bash
   npx ts-node scripts/fix-prices-in-db.ts
   ```

### Ce que fait le script

1. Parcourt tous les restaurants dans Firestore
2. Pour chaque restaurant, parcourt tous les produits
3. Si le prix est > 10000 (indiquant qu'il est en "centimes"), divise par 100
4. Met à jour le produit dans Firestore
5. Affiche un résumé des modifications

### Sécurité

- ⚠️ **Exécute ce script UNE SEULE FOIS**
- Le script vérifie si le prix est > 10000 avant de le diviser
- Crée une sauvegarde de ta base de données avant d'exécuter (recommandé)

### Exemple de sortie

```
🔧 Starting price fix...

📍 Restaurant: resto-abc123
   Found 15 products
   ✏️  Fixing prod-1: 100000 → 1000 FCFA
   ✏️  Fixing prod-2: 350000 → 3500 FCFA
   ✏️  Fixing prod-3: 80000 → 800 FCFA

✅ Price fix complete!
   Total products scanned: 15
   Products fixed: 15
   Products unchanged: 0

🎉 All done!
```
