'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Ticket, Calendar, Copy, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Coupon } from '@/types/schema';
import { MobileShell } from '@/components/layout/MobileShell';

/**
 * My Coupons Page
 *
 * Displays all saved coupons from localStorage.
 * Allows customers to:
 * - View all their won coupons
 * - Copy coupon codes
 * - Check expiration dates
 * - Delete used/expired coupons
 */
export default function MyCouponsPage() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = params.restaurantId as string;
  const tableId = params.tableId as string;

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Load coupons from localStorage
  useEffect(() => {
    const loadCoupons = () => {
      try {
        const STORAGE_KEY = 'saved_coupons';
        const stored = localStorage.getItem(STORAGE_KEY);

        if (stored) {
          const allCoupons: Coupon[] = JSON.parse(stored);

          // Filter coupons for this restaurant and not expired
          const now = new Date();
          const validCoupons = allCoupons.filter((coupon) => {
            const isForThisRestaurant = coupon.restaurantId === restaurantId;
            const isNotExpired = new Date(coupon.validUntil) > now;
            const isNotUsed = coupon.status === 'active';
            return isForThisRestaurant && isNotExpired && isNotUsed;
          });

          setCoupons(validCoupons);
        }
      } catch (error) {
        console.error('Failed to load coupons:', error);
        toast.error('Erreur lors du chargement des coupons');
      }
    };

    loadCoupons();
  }, [restaurantId]);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success('Code copié!');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      toast.error('Impossible de copier le code');
    }
  };

  const handleDeleteCoupon = (couponId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce coupon?')) {
      return;
    }

    try {
      const STORAGE_KEY = 'saved_coupons';
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored) {
        const allCoupons: Coupon[] = JSON.parse(stored);
        const updated = allCoupons.filter((c) => c.id !== couponId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setCoupons(coupons.filter((c) => c.id !== couponId));
        toast.success('Coupon supprimé');
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const getDaysRemaining = (validUntil: Date | string) => {
    const expiry = new Date(validUntil);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <MobileShell
      restaurantName={restaurantId}
    >
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <Ticket className="w-16 h-16 mx-auto mb-3 text-orange-500" />
          <h1 className="text-2xl font-bold text-gray-900">Mes Coupons</h1>
          <p className="text-gray-600 mt-1">
            {coupons.length} {coupons.length === 1 ? 'coupon disponible' : 'coupons disponibles'}
          </p>
        </div>

        {/* Empty State */}
        {coupons.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Ticket className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun coupon disponible
            </h3>
            <p className="text-gray-600 mb-6">
              Participez à notre tombola pour gagner des réductions!
            </p>
            <button
              onClick={() => router.push(`/menu/${restaurantId}/${tableId}`)}
              className="px-6 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              Retour au menu
            </button>
          </div>
        )}

        {/* Coupons List */}
        {coupons.map((coupon) => {
          const daysRemaining = getDaysRemaining(coupon.validUntil);
          const isExpiringSoon = daysRemaining <= 3;

          return (
            <div
              key={coupon.id}
              className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border-2 border-orange-200 overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            >
              {/* Coupon Header */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-white" />
                    <span className="text-white font-semibold text-sm">COUPON ACTIF</span>
                  </div>
                  {isExpiringSoon && (
                    <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">
                      Expire bientôt!
                    </span>
                  )}
                </div>
              </div>

              {/* Coupon Body */}
              <div className="p-4 space-y-3">
                {/* Description */}
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    {coupon.discountDescription}
                  </p>
                </div>

                {/* Code */}
                <div className="bg-white border-2 border-dashed border-orange-300 rounded-lg p-4">
                  <p className="text-xs text-gray-600 text-center mb-1">Code à utiliser:</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-mono font-bold text-orange-600 tracking-wider">
                      {coupon.code}
                    </span>
                    <button
                      onClick={() => handleCopyCode(coupon.code)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Copier le code"
                    >
                      {copiedCode === coupon.code ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expiration */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Valable jusqu'au{' '}
                      {new Date(coupon.validUntil).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <span className={`font-semibold ${isExpiringSoon ? 'text-yellow-600' : 'text-gray-600'}`}>
                    {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteCoupon(coupon.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer ce coupon
                </button>
              </div>
            </div>
          );
        })}

        {/* Info Box */}
        {coupons.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1">💡 Comment utiliser vos coupons?</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Présentez le code au serveur lors de votre commande</li>
              <li>Un seul coupon par commande</li>
              <li>Non cumulable avec d'autres promotions</li>
            </ul>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
