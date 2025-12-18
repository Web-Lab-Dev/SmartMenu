// ========================================
// Admin Dashboard Page
// ========================================
// KPIs and statistics overview

'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { OrderService } from '@/services/OrderService';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TrendingUp, ShoppingBag, Users, UtensilsCrossed, QrCode, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Order } from '@/types/schema';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user, restaurantId, loading: authLoading } = useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    const unsubscribe = OrderService.subscribeToRestaurantOrders(
      restaurantId,
      (fetchedOrders) => {
        setOrders(fetchedOrders as Order[]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [restaurantId]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" text="Chargement du dashboard..." />
      </div>
    );
  }

  // Calculate KPIs
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = orders.filter((o) => o.createdAt >= today);
  const totalRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Active tables (orders in pending_validation or preparing)
  const activeTables = new Set(
    orders
      .filter((o) => o.status === 'pending_validation' || o.status === 'preparing')
      .map((o) => o.tableId)
  ).size;

  const stats = [
    {
      label: "Chiffre d'Affaires",
      value: formatCurrency(totalRevenue),
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Commandes du Jour',
      value: todayOrders.length.toString(),
      icon: ShoppingBag,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      label: 'Tables Actives',
      value: activeTables.toString(),
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
  ];

  const hasNoOrders = orders.length === 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Bonjour, {user?.displayName || 'Admin'} 👋
        </h1>
        <p className="text-gray-400">
          Voici ce qui se passe chez <span className="text-orange-500 font-semibold">{user?.restaurantName || 'votre restaurant'}</span> aujourd'hui.
        </p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State: Quick Start Guide */}
      {hasNoOrders ? (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 p-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10 mb-4">
              <Sparkles className="w-8 h-8 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Bienvenue sur votre Dashboard !</h2>
            <p className="text-gray-400 mb-8">
              Votre restaurant est prêt à recevoir ses premières commandes. Commencez par configurer votre menu et générer vos QR codes.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/admin/menu"
                className="group bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-orange-500/50"
              >
                <UtensilsCrossed className="w-5 h-5" />
                Configurer mon Menu
              </Link>

              <Link
                href="/admin/settings"
                className="group bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-3 border border-gray-600"
              >
                <QrCode className="w-5 h-5" />
                Imprimer mes QR Codes
              </Link>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-700">
              <p className="text-sm text-gray-500">
                💡 <span className="font-medium">Astuce :</span> Une fois votre menu configuré, les clients pourront scanner le QR code de leur table pour passer commande directement.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Activity Summary when there are orders */
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Activité du jour</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-900 rounded-lg">
              <p className="text-2xl font-bold text-white">{todayOrders.length}</p>
              <p className="text-sm text-gray-400">Commandes</p>
            </div>
            <div className="text-center p-4 bg-gray-900 rounded-lg">
              <p className="text-2xl font-bold text-red-400">
                {todayOrders.filter((o) => o.status === 'pending_validation').length}
              </p>
              <p className="text-sm text-gray-400">En attente</p>
            </div>
            <div className="text-center p-4 bg-gray-900 rounded-lg">
              <p className="text-2xl font-bold text-yellow-400">
                {todayOrders.filter((o) => o.status === 'preparing').length}
              </p>
              <p className="text-sm text-gray-400">En préparation</p>
            </div>
            <div className="text-center p-4 bg-gray-900 rounded-lg">
              <p className="text-2xl font-bold text-green-400">
                {todayOrders.filter((o) => o.status === 'ready' || o.status === 'served').length}
              </p>
              <p className="text-sm text-gray-400">Servies</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
