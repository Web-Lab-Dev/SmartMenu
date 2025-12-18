// ========================================
// Split Bill Item Card
// ========================================
// Individual item card for split bill selection

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { SplitBillItem } from '@/types/schema';

interface SplitBillItemCardProps {
  item: SplitBillItem;
  onQuantityChange: (itemId: string, quantity: number) => void;
}

export function SplitBillItemCard({ item, onQuantityChange }: SplitBillItemCardProps) {
  const [selectedQty, setSelectedQty] = useState(item.selectedQuantity);

  const handleIncrement = () => {
    const newQty = Math.min(selectedQty + 1, item.quantity);
    setSelectedQty(newQty);
    onQuantityChange(item.itemId, newQty);
  };

  const handleDecrement = () => {
    const newQty = Math.max(selectedQty - 1, 0);
    setSelectedQty(newQty);
    onQuantityChange(item.itemId, newQty);
  };

  const isSelected = selectedQty > 0;
  const itemTotal = item.unitPrice * selectedQty;
  const optionsTotal = (item.options?.reduce((sum, opt) => sum + (opt.priceModifier || 0), 0) || 0) * selectedQty;
  const totalPrice = itemTotal + optionsTotal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative rounded-lg border-2 p-4 transition-all cursor-pointer
        ${isSelected
          ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/20'
          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
        }
      `}
    >
      {/* Item Info */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-white text-lg">{item.productName}</h3>
          {item.options && item.options.length > 0 && (
            <div className="mt-1 space-y-0.5">
              {item.options.map((option, idx) => (
                <p key={idx} className="text-sm text-gray-400">
                  {option.name}: {option.value}
                  {option.priceModifier && option.priceModifier > 0 && (
                    <span className="text-orange-400 ml-1">
                      +{formatCurrency(option.priceModifier)}
                    </span>
                  )}
                </p>
              ))}
            </div>
          )}
          {item.specialInstructions && (
            <p className="text-sm text-gray-500 mt-1 italic">
              "{item.specialInstructions}"
            </p>
          )}
        </div>

        <div className="text-right ml-4">
          <p className="text-lg font-bold text-white">
            {formatCurrency(item.unitPrice + (item.options?.reduce((sum, opt) => sum + (opt.priceModifier || 0), 0) || 0))}
          </p>
          <p className="text-xs text-gray-500">par unité</p>
        </div>
      </div>

      {/* Quantity Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleDecrement}
            disabled={selectedQty === 0}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center transition-all
              ${selectedQty === 0
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-700 text-white hover:bg-gray-600'
              }
            `}
          >
            <Minus className="w-5 h-5" />
          </button>

          <div className="text-center min-w-[60px]">
            <p className="text-2xl font-bold text-white">
              {selectedQty}/{item.quantity}
            </p>
            <p className="text-xs text-gray-400">sélectionné</p>
          </div>

          <button
            onClick={handleIncrement}
            disabled={selectedQty === item.quantity}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center transition-all
              ${selectedQty === item.quantity
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-orange-500 text-white hover:bg-orange-600'
              }
            `}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Total */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-right"
          >
            <p className="text-xs text-gray-400">Votre part</p>
            <p className="text-xl font-bold text-orange-400">
              {formatCurrency(totalPrice)}
            </p>
          </motion.div>
        )}
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-lg"
        >
          <span className="text-white font-bold text-sm">✓</span>
        </motion.div>
      )}
    </motion.div>
  );
}
