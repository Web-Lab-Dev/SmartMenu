// ========================================
// Split Bill View Component
// ========================================
// Visual interface for splitting bills between multiple people

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ArrowRight, Split } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { SplitBillItemCard } from './SplitBillItemCard';
import type { Order, SplitBillItem } from '@/types/schema';
import { v4 as uuidv4 } from 'uuid';

interface SplitBillViewProps {
  order: Order;
  onPaymentClick: (amount: number, items: SplitBillItem[]) => void;
}

export function SplitBillView({ order, onPaymentClick }: SplitBillViewProps) {
  // Convert order items to split bill items with unique IDs
  const [splitItems, setSplitItems] = useState<SplitBillItem[]>(
    order.items.map((item) => ({
      ...item,
      itemId: uuidv4(),
      selectedQuantity: 0,
      isFullyPaid: false,
    }))
  );

  const [showShareRemaining, setShowShareRemaining] = useState(false);

  // Handle quantity change for an item
  const handleQuantityChange = (itemId: string, quantity: number) => {
    setSplitItems((prev) =>
      prev.map((item) =>
        item.itemId === itemId ? { ...item, selectedQuantity: quantity } : item
      )
    );
  };

  // Calculate totals
  const myTotal = useMemo(() => {
    return splitItems.reduce((sum, item) => {
      const itemPrice = item.unitPrice * item.selectedQuantity;
      const optionsPrice =
        (item.options?.reduce((optSum, opt) => optSum + (opt.priceModifier || 0), 0) || 0) *
        item.selectedQuantity;
      return sum + itemPrice + optionsPrice;
    }, 0);
  }, [splitItems]);

  const selectedItems = useMemo(() => {
    return splitItems.filter((item) => item.selectedQuantity > 0);
  }, [splitItems]);

  const remainingItems = useMemo(() => {
    return splitItems.filter((item) => item.selectedQuantity < item.quantity);
  }, [splitItems]);

  // Share remaining items equally
  const handleShareRemaining = () => {
    if (remainingItems.length === 0) return;

    setSplitItems((prev) =>
      prev.map((item) => {
        const remaining = item.quantity - item.selectedQuantity;
        if (remaining > 0) {
          // Add half of remaining to selection (rounded up)
          const toAdd = Math.ceil(remaining / 2);
          return {
            ...item,
            selectedQuantity: Math.min(item.selectedQuantity + toAdd, item.quantity),
          };
        }
        return item;
      })
    );

    setShowShareRemaining(false);
  };

  const handlePayment = () => {
    if (myTotal === 0) return;
    onPaymentClick(myTotal, selectedItems);
  };

  return (
    <div className="min-h-screen bg-gray-950 pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Split className="w-6 h-6 text-orange-500" />
                Qui paie quoi ?
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Table {order.tableLabelString}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-400">Total commande</p>
              <p className="text-xl font-bold text-white">
                {formatCurrency(order.totalAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <p className="text-sm text-gray-400 mb-4">
          Sélectionnez les plats que vous avez consommés
        </p>

        {splitItems.map((item) => (
          <SplitBillItemCard
            key={item.itemId}
            item={item}
            onQuantityChange={handleQuantityChange}
          />
        ))}
      </div>

      {/* Share Remaining Button */}
      {remainingItems.length > 0 && selectedItems.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 mb-6">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setShowShareRemaining(!showShareRemaining)}
            className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-white flex items-center justify-center gap-2 transition-colors"
          >
            <Users className="w-5 h-5" />
            Partager les articles restants ({remainingItems.length})
          </motion.button>

          <AnimatePresence>
            {showShareRemaining && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg"
              >
                <p className="text-sm text-blue-400 mb-3">
                  Diviser équitablement les articles non sélectionnés ?
                </p>
                <div className="space-y-2 mb-4">
                  {remainingItems.map((item) => (
                    <div key={item.itemId} className="flex justify-between text-sm text-gray-300">
                      <span>{item.productName}</span>
                      <span className="text-gray-500">
                        {item.quantity - item.selectedQuantity} restant(s)
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleShareRemaining}
                  className="w-full py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-medium transition-colors"
                >
                  Oui, diviser équitablement
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Bottom Payment Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Summary */}
            <div className="flex-1">
              <p className="text-xs text-gray-400">Votre part</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(myTotal)}
                </p>
                {selectedItems.length > 0 && (
                  <span className="text-sm text-gray-400">
                    ({selectedItems.length} article{selectedItems.length > 1 ? 's' : ''})
                  </span>
                )}
              </div>
            </div>

            {/* Payment Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handlePayment}
              disabled={myTotal === 0}
              className={`
                px-8 py-4 rounded-xl font-semibold text-lg flex items-center gap-2 transition-all shadow-lg
                ${myTotal === 0
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-orange-500/50'
                }
              `}
            >
              Payer {formatCurrency(myTotal)}
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Progress Indicator */}
          {selectedItems.length > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Progression</span>
                <span>
                  {((myTotal / order.totalAmount) * 100).toFixed(0)}% de la note totale
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(myTotal / order.totalAmount) * 100}%` }}
                  className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
