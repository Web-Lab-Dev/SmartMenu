'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, UtensilsCrossed, Sparkles, Search, X } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';
import type { Product, Category } from '@/types/schema';
import CategoryTabs from '@/components/admin/CategoryTabs';
import AdminProductCard from '@/components/admin/AdminProductCard';
import ProductFormModal from '@/components/admin/ProductFormModal';
import { MenuService } from '@/lib/services/menu-service';

export default function MenuEditorPage() {
  const { user, loading: authLoading } = useAdminAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ⚡ PERF: Memoize restaurantId to prevent useEffect re-subscriptions
  const restaurantId = useMemo(() => user?.restaurantId, [user?.restaurantId]);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    const db = getDb();
    const categoriesQuery = query(
      collection(db, COLLECTIONS.CATEGORIES),
      where('restaurantId', '==', restaurantId),
      orderBy('order', 'asc')
    );

    const unsubscribe = onSnapshot(categoriesQuery, (snapshot) => {
      const fetchedCategories = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];

      setCategories(fetchedCategories);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;

    const db = getDb();
    const productsQuery = query(
      collection(db, COLLECTIONS.PRODUCTS),
      where('restaurantId', '==', restaurantId)
    );

    const unsubscribe = onSnapshot(productsQuery, (snapshot) => {
      const fetchedProducts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];

      setProducts(fetchedProducts);
    });

    return () => {
      unsubscribe();
    };
  }, [restaurantId]);

  // ⚡ PERF: Memoize filteredProducts pour éviter recalcul à chaque render
  const filteredProducts = useMemo(() =>
    products
      .filter((p) => {
        // Category filter
        if (selectedCategoryId && p.categoryId !== selectedCategoryId) return false;

        // Search filter
        if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

        return true;
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0)), // Sort by order field
    [products, selectedCategoryId, searchQuery]
  );

  const handleAddProduct = useCallback(() => {
    setEditingProduct(null);
    setIsModalOpen(true);
  }, []);

  const handleEditProduct = useCallback((product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setEditingProduct(null);
  }, []);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source } = result;

    // Dropped outside the list
    if (!destination) return;

    // No movement
    if (destination.index === source.index) return;

    // Reorder the products array
    const items = Array.from(filteredProducts);
    const [reorderedItem] = items.splice(source.index, 1);
    if (!reorderedItem) return;
    items.splice(destination.index, 0, reorderedItem);

    // Update the order values
    const updates = items.map((product, index) => ({
      productId: product.id,
      order: index,
    }));

    try {
      // Optimistic UI: Update local state immediately
      setProducts((prevProducts) => {
        const updatedProducts = [...prevProducts];
        updates.forEach(({ productId, order }) => {
          const productIndex = updatedProducts.findIndex((p) => p.id === productId);
          if (productIndex !== -1 && updatedProducts[productIndex]) {
            updatedProducts[productIndex] = { ...updatedProducts[productIndex]!, order };
          }
        });
        return updatedProducts;
      });

      // Save to Firestore
      await MenuService.updateProductsOrder(restaurantId!, updates);
    } catch (error) {
      console.error('Error reordering products:', error);
      alert('Erreur lors de la réorganisation des produits');
    }
  }, [filteredProducts, restaurantId]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Chargement du menu...</p>
        </div>
      </div>
    );
  }

  if (!restaurantId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Restaurant non trouve</p>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 p-12">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10 mb-4">
              <UtensilsCrossed className="w-8 h-8 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Creez votre premiere categorie
            </h2>
            <p className="text-gray-400 mb-8">
              Pour commencer, vous devez creer au moins une categorie (ex: Entrees, Plats, Desserts).
            </p>

            <div className="inline-block">
              <CategoryTabs
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
                restaurantId={restaurantId}
                onCategoryAdded={() => {}}
                onCategoryDeleted={() => {}}
              />
            </div>

            <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-400">
                Astuce: Cliquez sur Ajouter une categorie ci-dessus pour demarrer.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Ma Carte</h1>
          <p className="text-gray-400">
            Gerez vos produits et categories en temps reel
          </p>
        </div>

        <button
          onClick={handleAddProduct}
          className="px-6 py-3 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 transition-all whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Ajouter un Plat
        </button>
      </div>

      {/* Category Tabs */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 p-4">
        <CategoryTabs
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          restaurantId={restaurantId}
          onCategoryAdded={() => {}}
          onCategoryDeleted={() => {}}
        />
      </div>

      {/* Search Bar */}
      {products.length > 0 && (
        <div className="flex items-center justify-end">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-800 text-white placeholder-gray-500 border border-gray-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                title="Effacer la recherche"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {filteredProducts.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 p-12">
          <div className="text-center max-w-md mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10 mb-4">
              <Sparkles className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {selectedCategoryId ? 'Aucun produit dans cette categorie' : 'Aucun produit pour le moment'}
            </h3>
            <p className="text-gray-400 mb-6">
              Commencez par ajouter votre premier plat a votre carte
            </p>
            <button
              onClick={handleAddProduct}
              className="px-6 py-3 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 inline-flex items-center gap-2 transition-all"
            >
              <Plus className="w-5 h-5" />
              Ajouter un Plat
            </button>
          </div>
        </div>
      ) : searchQuery ? (
        // Disable drag-and-drop when searching
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredProducts.map((product) => (
            <AdminProductCard
              key={product.id}
              product={product}
              restaurantId={restaurantId}
              onEdit={handleEditProduct}
              onDeleted={() => {}}
            />
          ))}
        </div>
      ) : (
        // Enable drag-and-drop when not searching
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="products-list">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${
                  snapshot.isDraggingOver ? 'bg-gray-800/30 rounded-lg' : ''
                }`}
              >
                {filteredProducts.map((product, index) => (
                  <Draggable
                    key={product.id}
                    draggableId={product.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`
                          ${snapshot.isDragging ? 'opacity-80 shadow-2xl shadow-orange-500/20 scale-105' : ''}
                          transition-all duration-200
                        `}
                      >
                        <AdminProductCard
                          product={product}
                          restaurantId={restaurantId}
                          onEdit={handleEditProduct}
                          onDeleted={() => {}}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        restaurantId={restaurantId}
        categories={categories}
        product={editingProduct}
        onSuccess={() => {}}
      />
    </div>
  );
}
