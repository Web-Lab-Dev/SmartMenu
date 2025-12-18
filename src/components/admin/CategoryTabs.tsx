'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import type { Category } from '@/types/schema';
import { MenuService } from '@/lib/services/menu-service';

interface CategoryTabsProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  restaurantId: string;
  onCategoryAdded?: () => void;
  onCategoryDeleted?: () => void;
}

export default function CategoryTabs({
  categories,
  selectedCategoryId,
  onSelectCategory,
  restaurantId,
  onCategoryAdded,
  onCategoryDeleted,
}: CategoryTabsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openDropdownId) setOpenDropdownId(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdownId]);

  // ⚡ PERF: Use useCallback pour tous les handlers
  const handleSelectAll = useCallback(() => {
    onSelectCategory(null);
  }, [onSelectCategory]);

  const handleSelectCategory = useCallback((categoryId: string) => {
    onSelectCategory(categoryId);
  }, [onSelectCategory]);

  const handleToggleDropdown = useCallback((categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdownId(prev => prev === categoryId ? null : categoryId);
  }, []);

  const handleAddCategory = useCallback(async () => {
    const name = window.prompt('Nom de la nouvelle catégorie :');
    if (!name || name.trim() === '') return;

    setIsAdding(true);
    try {
      await MenuService.addCategory(restaurantId, name.trim());
      onCategoryAdded?.();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur lors de la création');
    } finally {
      setIsAdding(false);
    }
  }, [restaurantId, onCategoryAdded]);

  const handleRenameCategory = useCallback(async (categoryId: string, currentName: string) => {
    const newName = window.prompt('Nouveau nom de la catégorie :', currentName);
    if (!newName || newName.trim() === '' || newName.trim() === currentName) return;

    setOpenDropdownId(null);
    try {
      await MenuService.updateCategory(restaurantId, categoryId, newName.trim());
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur lors de la modification');
    }
  }, [restaurantId]);

  const handleDeleteCategory = useCallback(async (categoryId: string, categoryName: string) => {
    const confirm = window.confirm(
      `Supprimer la catégorie "${categoryName}" ?\n\nCette action est irréversible et ne fonctionnera que si la catégorie est vide.`
    );
    if (!confirm) return;

    setOpenDropdownId(null);
    setDeletingId(categoryId);
    try {
      await MenuService.deleteCategory(restaurantId, categoryId);

      // If deleted category was selected, reset selection
      if (selectedCategoryId === categoryId) {
        onSelectCategory(null);
      }

      onCategoryDeleted?.();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  }, [restaurantId, selectedCategoryId, onSelectCategory, onCategoryDeleted]);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {/* "All" Tab */}
      <button
        onClick={handleSelectAll}
        className={`
          px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all
          ${
            selectedCategoryId === null
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }
        `}
      >
        Tous les produits
      </button>

      {/* Category Tabs */}
      {categories.map((category) => (
        <div
          key={category.id}
          className="group relative"
        >
          <button
            onClick={() => handleSelectCategory(category.id)}
            disabled={deletingId === category.id}
            className={`
              px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all
              ${
                selectedCategoryId === category.id
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }
              ${deletingId === category.id ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {category.name}
          </button>

          {/* Dropdown Menu Button (shown on hover) */}
          <div className="absolute -top-2 -right-2">
            <button
              onClick={(e) => handleToggleDropdown(category.id, e)}
              disabled={deletingId === category.id}
              className="
                w-6 h-6 rounded-full
                bg-gray-700 text-white
                flex items-center justify-center
                opacity-0 group-hover:opacity-100
                transition-opacity
                hover:bg-gray-600
                disabled:opacity-50 disabled:cursor-not-allowed
              "
              title="Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {openDropdownId === category.id && (
              <div className="absolute right-0 top-8 z-10 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
                <button
                  onClick={() => handleRenameCategory(category.id, category.name)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Renommer
                </button>
                <button
                  onClick={() => handleDeleteCategory(category.id, category.name)}
                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Add Category Button */}
      <button
        onClick={handleAddCategory}
        disabled={isAdding}
        className="
          px-4 py-2 rounded-full font-medium whitespace-nowrap
          bg-gray-800 text-gray-300
          hover:bg-gray-700 hover:text-orange-500
          border border-dashed border-gray-600
          flex items-center gap-2
          transition-all
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {isAdding ? (
          <>
            <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            Création...
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            Ajouter une catégorie
          </>
        )}
      </button>
    </div>
  );
}
