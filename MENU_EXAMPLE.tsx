/**
 * 📚 EXEMPLE D'UTILISATION
 * Comment utiliser les nouveaux composants "Orange Bistro"
 *
 * Ce fichier montre comment intégrer:
 * - CategoryPills (navigation par capsules)
 * - ProductCard avec variants (bistro-row + hero)
 * - Animations staggered
 * - Layout avec texture noise
 */

'use client';

import { useState } from 'react';
import { CategoryPills, type Category } from '@/components/menu/CategoryPills';
import { ProductCard } from '@/components/menu/ProductCard';
import type { Product } from '@/types/schema';

export default function MenuExample() {
  const [activeCategory, setActiveCategory] = useState('main-course');

  // EXEMPLE: Catégories
  const categories: Category[] = [
    { id: 'all', name: 'Tous', icon: '🍽️', count: 25 },
    { id: 'main-course', name: 'Plats Principaux', icon: '🍖', count: 8 },
    { id: 'appetizers', name: 'Entrées', icon: '🥗', count: 6 },
    { id: 'desserts', name: 'Desserts', icon: '🍰', count: 5 },
    { id: 'beverages', name: 'Boissons', icon: '🍹', count: 6 },
  ];

  // EXEMPLE: Produits (mock data)
  const products: Product[] = [
    {
      id: '1',
      name: 'Cheeseburger Deluxe',
      description: 'Steak haché premium, cheddar affiné, sauce maison, pain brioché',
      price: 1200, // En centimes
      preparationTime: 15,
      isAvailable: true,
      aiTags: ['best-seller', 'ai-recommended'],
      allergens: ['Gluten', 'Lactose'],
      images: ['/images/burger.jpg'],
      categoryId: 'main-course',
      restaurantId: 'resto-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'Poulet Rôti Citron',
      description: 'Cuisse de poulet fermier, marinade citron-herbes, légumes grillés',
      price: 1500,
      preparationTime: 20,
      isAvailable: true,
      aiTags: ['ai-recommended'],
      allergens: [],
      images: ['/images/chicken.jpg'],
      categoryId: 'main-course',
      restaurantId: 'resto-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      name: 'Salade César',
      description: 'Laitue romaine, poulet grillé, parmesan, croûtons, sauce César',
      price: 900,
      preparationTime: 10,
      isAvailable: true,
      aiTags: [],
      allergens: ['Gluten', 'Lactose', 'Œufs'],
      images: ['/images/salad.jpg'],
      categoryId: 'appetizers',
      restaurantId: 'resto-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Filtrer par catégorie active
  const filteredProducts =
    activeCategory === 'all'
      ? products
      : products.filter((p) => p.categoryId === activeCategory);

  // Le premier best-seller devient un Hero Dish
  const heroProduct = filteredProducts.find((p) => p.aiTags?.includes('best-seller'));
  const regularProducts = filteredProducts.filter((p) => p.id !== heroProduct?.id);

  return (
    <div className="min-h-screen bg-background bg-noise">
      {/* Header avec texture */}
      <header className="glass-header sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="font-display text-3xl text-text-primary uppercase tracking-wide">
            Food Menu
          </h1>
          <button className="text-primary text-2xl">⋯</button>
        </div>
      </header>

      {/* Container principal */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* 🔥 NAVIGATION PAR CAPSULES */}
        <section>
          <CategoryPills
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </section>

        {/* Séparateur avec style */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-text-muted/20" />
          <span className="font-display text-primary text-sm">
            {filteredProducts.length} plats
          </span>
          <div className="flex-1 h-px bg-text-muted/20" />
        </div>

        {/* 🌟 HERO DISH (si best-seller présent) */}
        {heroProduct && (
          <section>
            <h2 className="
              inline-block
              bg-primary text-black
              px-6 py-2 rounded-lg
              font-display text-xl uppercase
              mb-6
            ">
              🔥 Best Seller
            </h2>

            <ProductCard
              product={heroProduct}
              variant="hero"
              index={0}
              onClick={() => console.log('Hero clicked:', heroProduct.name)}
            />
          </section>
        )}

        {/* 🍽️ LISTE PRINCIPALE (Bistro Row) */}
        <section className="space-y-4">
          {regularProducts.length > 0 && (
            <>
              <div className="
                inline-block
                bg-primary px-6 py-2 rounded-lg
                font-display text-xl uppercase
              ">
                Nos Plats
              </div>

              <div className="space-y-3">
                {regularProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant="bistro-row"
                    index={index}
                    onClick={() => console.log('Product clicked:', product.name)}
                  />
                ))}
              </div>
            </>
          )}

          {/* État vide */}
          {filteredProducts.length === 0 && (
            <div className="
              bg-background-surface
              border border-white/5
              rounded-2xl p-12
              text-center
            ">
              <span className="text-6xl mb-4 block">🍽️</span>
              <p className="font-display text-xl text-text-secondary">
                Aucun plat dans cette catégorie
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Footer FAB (optionnel) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="
          glass-fab
          w-16 h-16 rounded-full
          bg-primary text-black
          flex items-center justify-center
          shadow-2xl shadow-primary/30
          hover:scale-110 transition-transform
          font-display text-2xl
        ">
          🛒
        </button>
      </div>
    </div>
  );
}

/**
 * 💡 NOTES D'UTILISATION:
 *
 * 1. HERO DISH:
 *    - Utilisez variant="hero" pour le premier plat de chaque catégorie
 *    - Ou pour les best-sellers uniquement
 *
 * 2. BISTRO ROW:
 *    - variant="bistro-row" (par défaut) pour tous les autres plats
 *    - Layout horizontal dense
 *
 * 3. ANIMATIONS STAGGERED:
 *    - Passez l'index du produit dans la liste
 *    - Les cartes apparaîtront avec un léger décalage
 *
 * 4. CATÉGORIES:
 *    - Les capsules actives sont en orange plein
 *    - Scroll horizontal automatique sur mobile
 *    - Animation de l'indicateur actif
 *
 * 5. TEXTURE NOISE:
 *    - Ajoutez "bg-noise" sur le container principal
 *    - Effet papier ardoise subtil
 */
