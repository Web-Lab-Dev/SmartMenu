/**
 * Script to fix prices in Firestore database
 * Run this ONCE to convert all existing prices from cents to FCFA
 *
 * Usage:
 * npx ts-node scripts/fix-prices-in-db.ts
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

async function fixProductPrices() {
  console.log('🔧 Starting price fix...\n');

  try {
    // Get all restaurants
    const restaurantsSnapshot = await db.collection('restaurants').get();

    let totalProducts = 0;
    let fixedProducts = 0;

    for (const restaurantDoc of restaurantsSnapshot.docs) {
      const restaurantId = restaurantDoc.id;
      console.log(`\n📍 Restaurant: ${restaurantId}`);

      // Get all products for this restaurant
      const productsSnapshot = await db
        .collection('restaurants')
        .doc(restaurantId)
        .collection('products')
        .get();

      console.log(`   Found ${productsSnapshot.size} products`);

      for (const productDoc of productsSnapshot.docs) {
        const product = productDoc.data();
        totalProducts++;

        // Check if price needs fixing (if it's suspiciously large)
        if (product.price && product.price > 10000) {
          const oldPrice = product.price;
          const newPrice = Math.round(product.price / 100);

          console.log(`   ✏️  Fixing ${productDoc.id}: ${oldPrice} → ${newPrice} FCFA`);

          await productDoc.ref.update({
            price: newPrice,
          });

          fixedProducts++;
        }
      }
    }

    console.log(`\n✅ Price fix complete!`);
    console.log(`   Total products scanned: ${totalProducts}`);
    console.log(`   Products fixed: ${fixedProducts}`);
    console.log(`   Products unchanged: ${totalProducts - fixedProducts}`);
  } catch (error) {
    console.error('❌ Error fixing prices:', error);
    throw error;
  }
}

// Run the fix
fixProductPrices()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });
