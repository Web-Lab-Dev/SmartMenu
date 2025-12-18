// ========================================
// LiveOrderFeed Component
// ========================================
// Affiche des notifications en temps réel quand d'autres clients commandent
// - Écoute Firestore pour les nouvelles commandes
// - File d'attente avec throttling (1 notif toutes les 5-7s)
// - Ignore le chargement initial et la table actuelle
// - UI Glassmorphism avec animations
// - Clic pour ouvrir ProductDrawer

'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';
import type { Order } from '@/types/schema';
import Image from 'next/image';

interface LiveOrderNotification {
  id: string;
  tableId: string;
  productName: string;
  productImage?: string;
  additionalCount: number; // Nombre d'autres produits
  timestamp: Date;
}

interface LiveOrderFeedProps {
  restaurantId: string;
  currentTableId: string;
  onProductClick?: (productId: string) => void;
}

const NOTIFICATION_INTERVAL = 6000; // 6 secondes entre chaque notif
const MAX_QUEUE_SIZE = 5; // Max 5 notifications en attente
const NOTIFICATION_DURATION = 8000; // Affichage pendant 8 secondes
const RECENT_TIME_WINDOW = 5 * 60 * 1000; // 5 minutes

/**
 * LiveOrderFeed - Social Proof en temps réel
 *
 * Flow:
 * 1. Écoute les nouvelles commandes sur Firestore
 * 2. Filtre : seulement type='added', pas ma table, pas au chargement initial
 * 3. Ajoute à une file d'attente
 * 4. Affiche les notifications une par une avec intervalle
 */
export function LiveOrderFeed({
  restaurantId,
  currentTableId,
  onProductClick
}: LiveOrderFeedProps) {
  const [currentNotification, setCurrentNotification] = useState<LiveOrderNotification | null>(null);
  const [notificationQueue, setNotificationQueue] = useState<LiveOrderNotification[]>([]);
  const mountTimeRef = useRef<Date>(new Date());
  const processingRef = useRef(false);

  // Écoute des nouvelles commandes Firestore
  useEffect(() => {
    const db = getDb();
    const ordersRef = collection(db, COLLECTIONS.ORDERS);

    // Query: dernières commandes récentes
    const recentTime = new Date(Date.now() - RECENT_TIME_WINDOW);
    const q = query(
      ordersRef,
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    console.log('[LiveOrderFeed] 👂 Starting listener for', restaurantId);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        // ✅ FILTRE 1: Seulement les ajouts
        if (change.type !== 'added') return;

        const orderData = change.doc.data();
        const order: Order = {
          id: change.doc.id,
          ...orderData,
          createdAt: orderData.createdAt?.toDate?.() || new Date(orderData.createdAt),
          updatedAt: orderData.updatedAt?.toDate?.() || new Date(orderData.updatedAt),
        } as Order;

        // ✅ FILTRE 2: Ignorer les commandes avant le mount (chargement initial)
        if (order.createdAt < mountTimeRef.current) {
          console.log('[LiveOrderFeed] ⏭️  Skipping old order:', order.id);
          return;
        }

        // ✅ FILTRE 3: Ignorer ma propre table
        if (order.tableId === currentTableId) {
          console.log('[LiveOrderFeed] ⏭️  Skipping own table:', order.tableId);
          return;
        }

        // ✅ FILTRE 4: Vérifier que la commande est pour ce restaurant
        if (order.restaurantId !== restaurantId) {
          return;
        }

        // ✅ FILTRE 5: Vérifier qu'il y a des items
        if (!order.items || order.items.length === 0) {
          return;
        }

        console.log('[LiveOrderFeed] 🎉 New order detected!', {
          orderId: order.id,
          table: order.tableId,
          items: order.items.length
        });

        // Créer la notification
        const firstItem = order.items[0];
        const notification: LiveOrderNotification = {
          id: order.id,
          tableId: order.tableId || 'Table',
          productName: firstItem.productName,
          productImage: undefined, // OrderItem doesn't have image field
          additionalCount: order.items.length - 1,
          timestamp: order.createdAt,
        };

        // Ajouter à la queue (avec limite)
        setNotificationQueue((prev) => {
          const newQueue = [...prev, notification];
          if (newQueue.length > MAX_QUEUE_SIZE) {
            console.log('[LiveOrderFeed] ⚠️  Queue full, dropping oldest');
            return newQueue.slice(-MAX_QUEUE_SIZE);
          }
          return newQueue;
        });
      });
    }, (error) => {
      console.error('[LiveOrderFeed] ❌ Listener error:', error);
    });

    return () => {
      console.log('[LiveOrderFeed] 🔌 Unsubscribing listener');
      unsubscribe();
    };
  }, [restaurantId, currentTableId]);

  // Processeur de file d'attente avec throttling
  useEffect(() => {
    // Si déjà une notif affichée ou en cours de traitement, attendre
    if (currentNotification || processingRef.current) {
      return;
    }

    // Si la queue est vide, rien à faire
    if (notificationQueue.length === 0) {
      return;
    }

    console.log('[LiveOrderFeed] 📋 Processing queue, size:', notificationQueue.length);

    // Marquer comme en cours
    processingRef.current = true;

    // Prendre la première notification
    const [next, ...rest] = notificationQueue;
    setNotificationQueue(rest);
    setCurrentNotification(next);

    // Jouer un son subtil (optionnel)
    playNotificationSound();

    // Auto-fermeture après NOTIFICATION_DURATION
    const autoCloseTimer = setTimeout(() => {
      setCurrentNotification(null);

      // Si c'était la dernière notification de la file, débloquer immédiatement
      if (rest.length === 0) {
        processingRef.current = false;
      }
    }, NOTIFICATION_DURATION);

    // Attendre NOTIFICATION_INTERVAL avant de traiter la suivante (seulement s'il y en a d'autres)
    const nextTimer = rest.length > 0 ? setTimeout(() => {
      processingRef.current = false;
    }, NOTIFICATION_INTERVAL) : null;

    return () => {
      clearTimeout(autoCloseTimer);
      if (nextTimer) clearTimeout(nextTimer);
    };
  }, [currentNotification, notificationQueue]);

  // Fonction pour jouer un son subtil
  const playNotificationSound = () => {
    try {
      // Son très court et subtil (fréquence basse, volume faible)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 600; // Fréquence
      gainNode.gain.value = 0.1; // Volume très faible

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1); // 100ms
    } catch (error) {
      // Silently fail si audio context pas disponible
      console.log('[LiveOrderFeed] 🔇 Audio not available');
    }
  };

  const handleClose = () => {
    setCurrentNotification(null);
    processingRef.current = false;
  };

  return (
    <AnimatePresence>
      {currentNotification && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 pointer-events-auto"
        >
          <div className="glass-panel rounded-2xl shadow-2xl border border-white/20 p-4 backdrop-blur-xl bg-gradient-to-br from-gray-900/95 to-gray-800/95">
            {/* Header avec badge et close button */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-orange-400">Commande en direct</p>
                  <p className="text-[10px] text-gray-400">Il y a quelques instants</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Contenu principal */}
            <div className="flex items-center gap-3">
              {/* Image du produit */}
              {currentNotification.productImage ? (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-700 shrink-0">
                  <Image
                    src={currentNotification.productImage}
                    alt={currentNotification.productName}
                    fill
                    className="object-cover"
                    sizes="64px"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center shrink-0">
                  <span className="text-2xl">🍽️</span>
                </div>
              )}

              {/* Texte */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">
                  La <span className="font-bold text-orange-400">{currentNotification.tableId}</span> vient de craquer pour :
                </p>
                <p className="text-base font-bold text-white mt-1 line-clamp-1">
                  {currentNotification.productName}
                </p>
                {currentNotification.additionalCount > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    ...et {currentNotification.additionalCount} autre{currentNotification.additionalCount > 1 ? 's' : ''} plat{currentNotification.additionalCount > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Indicateur visuel animé */}
            <motion.div
              className="h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mt-3"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: NOTIFICATION_DURATION / 1000, ease: 'linear' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
