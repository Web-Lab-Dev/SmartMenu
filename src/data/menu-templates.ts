/**
 * Menu Templates for Quick Product Creation
 * Provides pre-configured products to speed up menu setup
 */

export interface MenuTemplate {
  id: string;
  name: string;
  description: string;
  suggestedPrice: number; // in cents (e.g., 350000 = 3500 FCFA)
  category: string;
  type: 'fast-food' | 'african' | 'beverages' | 'desserts';
}

export const MENU_TEMPLATES: MenuTemplate[] = [
  // === FAST FOOD ===
  {
    id: 'burger-classic',
    name: 'Burger Classique',
    description: 'Steak haché, salade, tomate, oignons, sauce burger maison',
    suggestedPrice: 250000, // 2500 FCFA
    category: 'Fast Food',
    type: 'fast-food',
  },
  {
    id: 'burger-cheese',
    name: 'Cheeseburger',
    description: 'Steak haché, cheddar fondant, cornichons, sauce burger',
    suggestedPrice: 300000, // 3000 FCFA
    category: 'Fast Food',
    type: 'fast-food',
  },
  {
    id: 'pizza-reine',
    name: 'Pizza Reine',
    description: 'Tomate, mozzarella, jambon, champignons frais',
    suggestedPrice: 450000, // 4500 FCFA
    category: 'Fast Food',
    type: 'fast-food',
  },
  {
    id: 'pizza-margherita',
    name: 'Pizza Margherita',
    description: 'Tomate, mozzarella, basilic frais, huile d\'olive',
    suggestedPrice: 350000, // 3500 FCFA
    category: 'Fast Food',
    type: 'fast-food',
  },
  {
    id: 'tacos-poulet',
    name: 'Tacos Poulet',
    description: 'Poulet grillé, frites, fromage, sauce blanche et harissa',
    suggestedPrice: 280000, // 2800 FCFA
    category: 'Fast Food',
    type: 'fast-food',
  },
  {
    id: 'panini-poulet',
    name: 'Panini Poulet',
    description: 'Poulet grillé, tomate, mozzarella, pesto',
    suggestedPrice: 220000, // 2200 FCFA
    category: 'Fast Food',
    type: 'fast-food',
  },

  // === CUISINE AFRICAINE ===
  {
    id: 'thieboudienne',
    name: 'Thiéboudienne',
    description: 'Plat national sénégalais : riz au poisson, légumes et sauce tomate épicée',
    suggestedPrice: 350000, // 3500 FCFA
    category: 'Plats Résistance',
    type: 'african',
  },
  {
    id: 'poulet-yassa',
    name: 'Poulet Yassa',
    description: 'Poulet mariné au citron vert et aux oignons confits, servi avec du riz blanc',
    suggestedPrice: 320000, // 3200 FCFA
    category: 'Plats Résistance',
    type: 'african',
  },
  {
    id: 'mafe-boeuf',
    name: 'Mafé Bœuf',
    description: 'Viande de bœuf mijotée dans une sauce onctueuse à la pâte d\'arachide',
    suggestedPrice: 350000, // 3500 FCFA
    category: 'Plats Résistance',
    type: 'african',
  },
  {
    id: 'dibi-mouton',
    name: 'Dibi Mouton',
    description: 'Viande de mouton grillée, marinée aux épices, servie avec oignons et moutarde',
    suggestedPrice: 400000, // 4000 FCFA
    category: 'Grillades',
    type: 'african',
  },
  {
    id: 'thiou-viande',
    name: 'Thiou Viande',
    description: 'Ragoût de viande aux légumes frais et sauce tomate légèrement pimentée',
    suggestedPrice: 300000, // 3000 FCFA
    category: 'Plats Résistance',
    type: 'african',
  },
  {
    id: 'atieke-poisson',
    name: 'Attiéké Poisson Braisé',
    description: 'Semoule de manioc fermenté avec poisson braisé et sauce pimentée',
    suggestedPrice: 280000, // 2800 FCFA
    category: 'Plats Résistance',
    type: 'african',
  },
  {
    id: 'poulet-braise',
    name: 'Poulet Braisé',
    description: 'Demi-poulet mariné et grillé au feu de bois, servi avec frites ou allocos',
    suggestedPrice: 320000, // 3200 FCFA
    category: 'Grillades',
    type: 'african',
  },
  {
    id: 'allocos',
    name: 'Allocos',
    description: 'Bananes plantains frites, servies avec sauce pimentée',
    suggestedPrice: 150000, // 1500 FCFA
    category: 'Accompagnements',
    type: 'african',
  },
  {
    id: 'fataya',
    name: 'Fataya',
    description: 'Chaussons frits farcis à la viande hachée épicée (3 pièces)',
    suggestedPrice: 120000, // 1200 FCFA
    category: 'Entrées',
    type: 'african',
  },

  // === BOISSONS ===
  {
    id: 'coca-cola',
    name: 'Coca-Cola',
    description: 'Boisson gazeuse rafraîchissante - 33cl',
    suggestedPrice: 80000, // 800 FCFA
    category: 'Boissons',
    type: 'beverages',
  },
  {
    id: 'sprite',
    name: 'Sprite',
    description: 'Boisson gazeuse citron-citron vert - 33cl',
    suggestedPrice: 80000, // 800 FCFA
    category: 'Boissons',
    type: 'beverages',
  },
  {
    id: 'fanta-orange',
    name: 'Fanta Orange',
    description: 'Boisson gazeuse saveur orange - 33cl',
    suggestedPrice: 80000, // 800 FCFA
    category: 'Boissons',
    type: 'beverages',
  },
  {
    id: 'eau-minerale',
    name: 'Eau Minérale',
    description: 'Eau minérale naturelle - 50cl',
    suggestedPrice: 50000, // 500 FCFA
    category: 'Boissons',
    type: 'beverages',
  },
  {
    id: 'jus-bissap',
    name: 'Jus de Bissap',
    description: 'Boisson traditionnelle à base de fleurs d\'hibiscus - 50cl',
    suggestedPrice: 100000, // 1000 FCFA
    category: 'Boissons',
    type: 'beverages',
  },
  {
    id: 'jus-gingembre',
    name: 'Jus de Gingembre',
    description: 'Boisson épicée au gingembre frais - 50cl',
    suggestedPrice: 100000, // 1000 FCFA
    category: 'Boissons',
    type: 'beverages',
  },
  {
    id: 'jus-bouye',
    name: 'Jus de Bouye',
    description: 'Jus de fruit du baobab, saveur unique - 50cl',
    suggestedPrice: 120000, // 1200 FCFA
    category: 'Boissons',
    type: 'beverages',
  },

  // === DESSERTS ===
  {
    id: 'thiakry',
    name: 'Thiakry',
    description: 'Dessert traditionnel au mil, yaourt et crème fraîche',
    suggestedPrice: 150000, // 1500 FCFA
    category: 'Desserts',
    type: 'desserts',
  },
  {
    id: 'degue',
    name: 'Dégué',
    description: 'Dessert à base de semoule de mil, yaourt et raisins secs',
    suggestedPrice: 150000, // 1500 FCFA
    category: 'Desserts',
    type: 'desserts',
  },
  {
    id: 'salade-fruits',
    name: 'Salade de Fruits Frais',
    description: 'Assortiment de fruits tropicaux de saison',
    suggestedPrice: 180000, // 1800 FCFA
    category: 'Desserts',
    type: 'desserts',
  },
];

/**
 * Get templates by category type
 */
export function getTemplatesByType(type: MenuTemplate['type']): MenuTemplate[] {
  return MENU_TEMPLATES.filter((t) => t.type === type);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): MenuTemplate | undefined {
  return MENU_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get all unique categories from templates
 */
export function getAllTemplateCategories(): string[] {
  const categories = MENU_TEMPLATES.map((t) => t.category);
  return Array.from(new Set(categories));
}
