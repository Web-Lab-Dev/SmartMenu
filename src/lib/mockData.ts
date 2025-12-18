// ========================================
// Mock Data for Development/Demo
// ========================================
// Hardcoded test data to visualize the app without Firebase

import type { Restaurant, Product, Order, Table, Feedback, CustomerEmail } from '@/types/schema';

// ========================================
// Restaurant Demo
// ========================================

export const DEMO_RESTAURANT: Restaurant = {
  id: 'demo-restaurant-001',
  name: 'La Table Française',
  slug: 'la-table-francaise',
  ownerId: 'demo-owner-001',
  branding: {
    logo: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
    primaryColor: '#ff5733',
    secondaryColor: '#c70039',
    coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
  },
  securityConfig: {
    mode: 'validation_required',
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-12-09'),
};

// ========================================
// Tables Demo
// ========================================

export const DEMO_TABLES: Table[] = [
  {
    id: 'table-01',
    restaurantId: 'demo-restaurant-001',
    label: 'Table 1',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=table1',
    isActive: true,
    section: 'Intérieur',
    capacity: 4,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'table-02',
    restaurantId: 'demo-restaurant-001',
    label: 'Table 2',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=table2',
    isActive: true,
    section: 'Terrasse',
    capacity: 6,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'table-03',
    restaurantId: 'demo-restaurant-001',
    label: 'Table 3',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=table3',
    isActive: true,
    section: 'Intérieur',
    capacity: 2,
    createdAt: new Date('2024-01-01'),
  },
];

// ========================================
// Products Demo
// ========================================

export const DEMO_PRODUCTS: Product[] = [
  // Entrées
  {
    id: 'product-001',
    restaurantId: 'demo-restaurant-001',
    categoryId: 'entrees',
    name: 'Soupe à l\'Oignon Gratinée',
    description: 'Soupe traditionnelle française gratinée au fromage Comté',
    price: 890, // 8.90€ in cents
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600',
    isAvailable: true,
    aiTags: ['classique', 'réconfortant', 'fromage'],
    allergens: ['gluten', 'lactose'],
    preparationTime: 10,
    order: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-09'),
  },
  {
    id: 'product-002',
    restaurantId: 'demo-restaurant-001',
    categoryId: 'entrees',
    name: 'Escargots de Bourgogne',
    description: '6 escargots au beurre persillé, ail et herbes',
    price: 1290,
    image: 'https://images.unsplash.com/photo-1599021118448-e6085ce5e30c?w=600',
    isAvailable: true,
    aiTags: ['spécialité', 'raffiné'],
    allergens: ['mollusques', 'lactose'],
    preparationTime: 12,
    order: 2,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-09'),
  },
  {
    id: 'product-003',
    restaurantId: 'demo-restaurant-001',
    categoryId: 'entrees',
    name: 'Foie Gras Maison',
    description: 'Foie gras mi-cuit sur pain brioché toasté, confiture de figues',
    price: 1890,
    image: 'https://images.unsplash.com/photo-1609501676725-7186f017a4b7?w=600',
    isAvailable: true,
    aiTags: ['prestige', 'maison', 'festif'],
    allergens: ['gluten'],
    preparationTime: 8,
    order: 3,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-09'),
  },

  // Plats Principaux
  {
    id: 'product-004',
    restaurantId: 'demo-restaurant-001',
    categoryId: 'plats',
    name: 'Boeuf Bourguignon',
    description: 'Boeuf mijoté au vin rouge, carottes, oignons grelots, lardons',
    price: 2490,
    image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600',
    isAvailable: true,
    aiTags: ['signature', 'traditionnel', 'généreux'],
    allergens: [],
    preparationTime: 20,
    order: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-09'),
  },
  {
    id: 'product-005',
    restaurantId: 'demo-restaurant-001',
    categoryId: 'plats',
    name: 'Coq au Vin',
    description: 'Coq fermier mijoté au vin rouge, champignons, échalotes',
    price: 2290,
    image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=600',
    isAvailable: true,
    aiTags: ['classique', 'terroir'],
    allergens: [],
    preparationTime: 25,
    order: 2,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-09'),
  },
  {
    id: 'product-006',
    restaurantId: 'demo-restaurant-001',
    categoryId: 'plats',
    name: 'Magret de Canard',
    description: 'Magret de canard rosé, sauce aux cèpes, pommes sarladaises',
    price: 2690,
    image: 'https://images.unsplash.com/photo-1615937657715-bc7b4b7962c1?w=600',
    isAvailable: true,
    aiTags: ['raffiné', 'du moment'],
    allergens: [],
    preparationTime: 18,
    order: 3,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-09'),
  },
  {
    id: 'product-007',
    restaurantId: 'demo-restaurant-001',
    categoryId: 'plats',
    name: 'Sole Meunière',
    description: 'Sole fraîche poêlée au beurre noisette, pommes vapeur',
    price: 2990,
    image: 'https://images.unsplash.com/photo-1580959375944-1ab5ca411449?w=600',
    isAvailable: true,
    aiTags: ['poisson', 'léger', 'fin'],
    allergens: ['poisson', 'lactose'],
    preparationTime: 15,
    order: 4,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-09'),
  },

  // Desserts
  {
    id: 'product-008',
    restaurantId: 'demo-restaurant-001',
    categoryId: 'desserts',
    name: 'Crème Brûlée',
    description: 'Crème brûlée vanille de Madagascar, sablés maison',
    price: 890,
    image: 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=600',
    isAvailable: true,
    aiTags: ['classique', 'onctueux', 'vanille'],
    allergens: ['lactose', 'oeufs'],
    preparationTime: 5,
    order: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-09'),
  },
  {
    id: 'product-009',
    restaurantId: 'demo-restaurant-001',
    categoryId: 'desserts',
    name: 'Tarte Tatin',
    description: 'Tarte aux pommes caramélisées, crème fraîche',
    price: 990,
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600',
    isAvailable: true,
    aiTags: ['signature', 'chaud', 'caramélisé'],
    allergens: ['gluten', 'lactose'],
    preparationTime: 10,
    order: 2,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-09'),
  },
  {
    id: 'product-010',
    restaurantId: 'demo-restaurant-001',
    categoryId: 'desserts',
    name: 'Profiteroles',
    description: 'Choux glacés vanille, sauce chocolat chaud',
    price: 1090,
    image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600',
    isAvailable: true,
    aiTags: ['gourmand', 'chocolat'],
    allergens: ['gluten', 'lactose', 'oeufs'],
    preparationTime: 8,
    order: 3,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-09'),
  },

  // Boissons
  {
    id: 'product-011',
    restaurantId: 'demo-restaurant-001',
    categoryId: 'boissons',
    name: 'Bordeaux Rouge AOC',
    description: 'Bouteille (75cl) - Château Margaux 2018',
    price: 4500,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600',
    isAvailable: true,
    aiTags: ['vin', 'prestige', 'rouge'],
    allergens: [],
    preparationTime: 2,
    order: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-09'),
  },
  {
    id: 'product-012',
    restaurantId: 'demo-restaurant-001',
    categoryId: 'boissons',
    name: 'Eau Minérale',
    description: 'Eau minérale naturelle (1L)',
    price: 490,
    image: 'https://images.unsplash.com/photo-1559839914-17aae19e55d9?w=600',
    isAvailable: true,
    aiTags: ['eau', 'fraîche'],
    allergens: [],
    preparationTime: 1,
    order: 2,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-09'),
  },
];

// ========================================
// Demo Orders
// ========================================

export const DEMO_ORDERS: Order[] = [
  {
    id: 'order-001',
    restaurantId: 'demo-restaurant-001',
    tableId: 'table-01',
    tableLabelString: 'Table 1',
    status: 'pending_validation',
    items: [
      {
        productId: 'product-001',
        productName: 'Soupe à l\'Oignon Gratinée',
        quantity: 2,
        unitPrice: 890,
      },
      {
        productId: 'product-004',
        productName: 'Boeuf Bourguignon',
        quantity: 2,
        unitPrice: 2490,
      },
    ],
    totalAmount: 6760,
    customerSessionId: 'session-001',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'order-002',
    restaurantId: 'demo-restaurant-001',
    tableId: 'table-02',
    tableLabelString: 'Table 2',
    status: 'preparing',
    items: [
      {
        productId: 'product-006',
        productName: 'Magret de Canard',
        quantity: 1,
        unitPrice: 2690,
      },
      {
        productId: 'product-011',
        productName: 'Bordeaux Rouge AOC',
        quantity: 1,
        unitPrice: 4500,
      },
    ],
    totalAmount: 7190,
    customerSessionId: 'session-002',
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
    updatedAt: new Date(),
    validatedAt: new Date(Date.now() - 10 * 60 * 1000),
  },
];

// ========================================
// Demo Feedback
// ========================================

export const DEMO_FEEDBACK: Feedback[] = [
  {
    id: 'feedback-001',
    restaurantId: 'demo-restaurant-001',
    orderId: 'order-001',
    customerSessionId: 'session-001',
    rating: 5,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'feedback-002',
    restaurantId: 'demo-restaurant-001',
    orderId: 'order-002',
    customerSessionId: 'session-002',
    rating: 2,
    message: 'Le plat était froid à l\'arrivée. Service un peu long.',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
];

// ========================================
// Demo Customers
// ========================================

export const DEMO_CUSTOMERS: CustomerEmail[] = [
  {
    id: 'customer-001',
    restaurantId: 'demo-restaurant-001',
    email: 'jean.dupont@example.com',
    orderId: 'order-001',
    rewardClaimed: '1 Café offert à votre prochaine visite !',
    visitDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'customer-002',
    restaurantId: 'demo-restaurant-001',
    email: 'marie.martin@example.com',
    orderId: 'order-002',
    rewardClaimed: '-10% sur votre prochaine commande',
    visitDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
];
