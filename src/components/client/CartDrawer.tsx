'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer } from 'vaul';
import { Trash2, Plus, Minus, ShoppingBag, Loader2, Ticket, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCartStore,
  selectCartItems,
  selectCartSubtotal,
  selectCartTotal,
  selectAppliedCoupon,
} from '@/lib/store';
import type { CartItem } from '@/lib/store';
import { OrderService } from '@/services/OrderService';
import { CampaignService } from '@/services/CampaignService';
import { formatCurrency } from '@/lib/utils';
import { OrderSuccessAnimation } from './OrderSuccessAnimation';
import { ScratchGameModal } from './ScratchGameModal';
import type { Campaign } from '@/types/schema';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId: string;
  restaurantName: string;
  tableId: string;
  tableLabelString: string;
  customerSessionId: string;
}

export function CartDrawer({
  open,
  onOpenChange,
  restaurantId,
  restaurantName,
  tableId,
  tableLabelString,
  customerSessionId,
}: CartDrawerProps) {
  // ⚡ PERF: Use selectors to only subscribe to needed state
  const items = useCartStore(selectCartItems);
  const appliedCoupon = useCartStore(selectAppliedCoupon);
  const subtotal = useCartStore(selectCartSubtotal);
  const totalAmount = useCartStore(selectCartTotal);

  // Get actions (these don't cause re-renders on state changes)
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const getDiscountAmount = useCartStore((state) => state.getDiscountAmount);
  const applyCoupon = useCartStore((state) => state.applyCoupon);
  const removeCoupon = useCartStore((state) => state.removeCoupon);

  const [customerNote, setCustomerNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showScratchCard, setShowScratchCard] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);

  // Collapsible sections state
  const [showInstructions, setShowInstructions] = useState(false);
  const [showPromoCode, setShowPromoCode] = useState(false);

  const discountAmount = getDiscountAmount();
  const isEmpty = items.length === 0;

  // Handle quantity change with confirmation for deletion
  const handleQuantityChange = (item: CartItem, newQuantity: number) => {
    if (newQuantity === 0) {
      // Confirm deletion
      if (window.confirm(`Retirer "${item.productName}" du panier ?`)) {
        updateQuantity(item.productId, 0);
        toast.success('Produit retiré du panier');
      }
    } else {
      updateQuantity(item.productId, newQuantity);
    }
  };

  // Handle clear cart
  const handleClearCart = () => {
    if (window.confirm('Vider complètement le panier ?')) {
      clearCart(true);
      toast.success('Panier vidé');
    }
  };

  // Handle apply promo code
  const handleApplyCoupon = async () => {
    if (!promoCode.trim()) {
      toast.error('Veuillez entrer un code promo');
      return;
    }

    setIsVerifyingCoupon(true);

    try {
      const response = await fetch('/api/coupon/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          code: promoCode.toUpperCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        toast.error(data.error || 'Code promo invalide');
        return;
      }

      // Apply coupon to cart
      applyCoupon({
        id: data.coupon.id,
        code: data.coupon.code,
        discountType: data.coupon.discountType,
        discountValue: data.coupon.discountValue,
        discountDescription: data.coupon.discountDescription,
      });

      toast.success(`Code promo appliqué: ${data.coupon.discountDescription}`);
      setPromoCode('');
    } catch (error) {
      console.error('Error verifying coupon:', error);
      toast.error('Erreur lors de la vérification du code promo');
    } finally {
      setIsVerifyingCoupon(false);
    }
  };

  // Handle remove coupon
  const handleRemoveCoupon = () => {
    removeCoupon();
    toast.success('Code promo retiré');
  };

  // Handle order submission
  const handleSubmitOrder = async () => {
    if (isEmpty) {
      toast.error('Votre panier est vide');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare order items - remove undefined fields to avoid Firestore errors
      const orderItems = items.map((item) => {
        const orderItem: any = {
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        };

        // Only include optional fields if they have values
        if (item.options && item.options.length > 0) {
          orderItem.options = item.options;
        }
        if (item.specialInstructions) {
          orderItem.specialInstructions = item.specialInstructions;
        }

        return orderItem;
      });

      // Create order data - only include defined fields
      const orderData: any = {
        restaurantId,
        tableId,
        tableLabelString,
        items: orderItems,
        customerSessionId,
      };

      // Only add optional fields if they exist
      if (customerNote.trim()) {
        orderData.customerNote = customerNote.trim();
      }
      if (appliedCoupon?.id) {
        orderData.couponId = appliedCoupon.id;
      }

      // Create order (with coupon if applied)
      const { orderId } = await OrderService.createOrder(orderData);

      console.log(`✅ Order created successfully: ${orderId}`);

      // Clear cart
      clearCart(true);
      setCustomerNote('');

      // Close drawer
      onOpenChange(false);

      // Show success animation
      setShowSuccess(true);

      // Check for active campaigns and show scratch card
      try {
        const campaigns = await CampaignService.getActiveCampaigns(restaurantId);
        if (campaigns.length > 0) {
          // Pick the first active campaign
          setActiveCampaign(campaigns[0]);

          // Show scratch card after success animation
          setTimeout(() => {
            setShowSuccess(false);
            setShowScratchCard(true);
          }, 2000);
        } else {
          // No campaign - just hide success after 3 seconds
          setTimeout(() => {
            setShowSuccess(false);
          }, 3000);
        }
      } catch (error) {
        console.error('Error loading campaigns:', error);
        // Fallback: just show success
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error('Erreur lors de l\'envoi de la commande. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Drawer.Root open={open} onOpenChange={onOpenChange}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl outline-none h-[85vh]">
            {/* Drag Handle */}
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
            </div>

            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200/30 dark:border-gray-700/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-6 h-6 text-gray-700 dark:text-white" strokeWidth={2} />
                <Drawer.Title className="text-2xl font-bold text-gray-900 dark:text-white">
                  Votre Commande
                </Drawer.Title>
              </div>
              {!isEmpty && (
                <button
                  onClick={handleClearCart}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Vider le panier"
                >
                  <Trash2 className="w-5 h-5 text-red-500" strokeWidth={2} />
                </button>
              )}
            </div>

            {/* Screen reader description */}
            <Drawer.Description className="sr-only">
              Panier de commande avec {items.length} article{items.length > 1 ? 's' : ''} pour un total de {formatCurrency(totalAmount)}
            </Drawer.Description>

            {/* Empty State */}
            {isEmpty && (
              <div className="flex-1 flex flex-col items-center justify-center px-6 pb-6">
                <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-12 h-12 text-gray-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Votre panier est vide
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  Ajoutez des produits pour commencer votre commande
                </p>
              </div>
            )}

            {/* Items List (Scrollable) */}
            {!isEmpty && (
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <AnimatePresence mode="popLayout">
                  {items.map((item) => (
                    <motion.div
                      key={item.productId}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-4 mb-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50"
                    >
                      {/* Product Image */}
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                        {(item.product?.images?.[0] || item.product?.image) && (
                          <Image
                            src={item.product.images?.[0] || item.product.image || ''}
                            alt={item.productName}
                            fill
                            className="object-cover"
                            sizes="80px"
                            unoptimized
                          />
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-base text-gray-900 dark:text-white line-clamp-1">
                          {item.productName}
                        </h4>
                        <p className="text-sm font-semibold mt-1" style={{ color: 'var(--brand-color, #FF4500)' }}>
                          {formatCurrency(item.unitPrice)}
                        </p>
                        {item.options && item.options.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {item.options.map((option, idx) => (
                              <p key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                                {option.name}: {option.value}
                                {option.priceModifier && option.priceModifier > 0 && (
                                  <span className="ml-1">
                                    (+{formatCurrency(option.priceModifier)})
                                  </span>
                                )}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuantityChange(item, item.quantity - 1)}
                          className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                          aria-label="Diminuer la quantité"
                        >
                          <Minus className="w-4 h-4 text-gray-700 dark:text-white" strokeWidth={2.5} />
                        </button>
                        <span className="w-8 text-center font-bold text-gray-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item, item.quantity + 1)}
                          disabled={item.quantity >= 99}
                          className="w-9 h-9 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: item.quantity >= 99 ? '#ccc' : 'var(--brand-color, #FF4500)',
                            color: 'white',
                          }}
                          aria-label="Augmenter la quantité"
                        >
                          <Plus className="w-4 h-4" strokeWidth={2.5} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Footer (Fixed) */}
            {!isEmpty && (
              <div className="px-6 py-4 border-t border-gray-200/30 dark:border-gray-700/30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
                {/* Customer Note - Collapsible */}
                <div className="mb-3">
                  <button
                    type="button"
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      📝 Instructions spéciales {customerNote && `(${customerNote.length})`}
                    </span>
                    <motion.span
                      animate={{ rotate: showInstructions ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-gray-500"
                    >
                      ▼
                    </motion.span>
                  </button>
                  {showInstructions && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2"
                    >
                      <textarea
                        id="customerNote"
                        value={customerNote}
                        onChange={(e) => setCustomerNote(e.target.value)}
                        placeholder="Allergies, préférences, instructions..."
                        rows={2}
                        maxLength={500}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-0 resize-none text-sm"
                        style={{ '--tw-ring-color': 'var(--brand-color, #FF4500)' } as React.CSSProperties}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {customerNote.length}/500 caractères
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Promo Code Section - Collapsible */}
                {!appliedCoupon ? (
                  <div className="mb-3">
                    <button
                      type="button"
                      onClick={() => setShowPromoCode(!showPromoCode)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        🎫 Code Promo
                      </span>
                      <motion.span
                        animate={{ rotate: showPromoCode ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-gray-500"
                      >
                        ▼
                      </motion.span>
                    </button>
                    {showPromoCode && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2"
                      >
                        <div className="flex gap-2">
                          <input
                            id="promoCode"
                            type="text"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                            placeholder="PROMO-XXXXX"
                            disabled={isVerifyingCoupon}
                            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
                            style={{ '--tw-ring-color': 'var(--brand-color, #FF4500)' } as React.CSSProperties}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleApplyCoupon();
                              }
                            }}
                          />
                          <button
                            onClick={handleApplyCoupon}
                            disabled={isVerifyingCoupon || !promoCode.trim()}
                            className="px-4 py-2 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            style={{
                              backgroundColor: isVerifyingCoupon || !promoCode.trim() ? '#ccc' : 'var(--brand-color, #FF4500)',
                            }}
                          >
                            {isVerifyingCoupon ? (
                              <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
                            ) : (
                              'Appliquer'
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  /* Applied Coupon Display */
                  <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <Ticket className="w-5 h-5 text-green-600 dark:text-green-400" strokeWidth={2} />
                        <div>
                          <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                            {appliedCoupon.discountDescription}
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-300 font-mono">
                            {appliedCoupon.code}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="p-2 hover:bg-green-100 dark:hover:bg-green-800 rounded-lg transition-colors"
                        aria-label="Retirer le coupon"
                      >
                        <X className="w-5 h-5 text-green-700 dark:text-green-300" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Total Summary */}
                <div className="space-y-2 mb-4">
                  {appliedCoupon && (
                    <>
                      <div className="flex items-center justify-between px-2 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Sous-total</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {formatCurrency(subtotal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-2 text-sm">
                        <span className="text-green-600 dark:text-green-400 font-medium">Réduction</span>
                        <span className="text-green-600 dark:text-green-400 font-semibold">
                          -{formatCurrency(discountAmount)}
                        </span>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-2" />
                    </>
                  )}
                  <div className="flex items-center justify-between px-2">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      Total
                    </span>
                    <span className="text-2xl font-bold" style={{ color: 'var(--brand-color, #FF4500)' }}>
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmitOrder}
                  disabled={isEmpty || isSubmitting}
                  className="w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: isEmpty || isSubmitting ? '#ccc' : 'var(--brand-color, #FF4500)',
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <span>Envoyer la commande</span>
                      <span>🚀</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Success Animation */}
      <OrderSuccessAnimation visible={showSuccess} />

      {/* Scratch Card Game Modal */}
      {showScratchCard && activeCampaign && (
        <ScratchGameModal
          campaignId={activeCampaign.id}
          restaurantId={restaurantId}
          restaurantName={restaurantName}
          onClose={() => {
            setShowScratchCard(false);
            setActiveCampaign(null);
          }}
          onComplete={(result) => {
            console.log('Scratch game completed:', result);
            if (result.won && result.coupon) {
              toast.success('🎉 Félicitations ! Vous avez gagné un coupon !');
            }
          }}
        />
      )}
    </>
  );
}
