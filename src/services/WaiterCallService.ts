// ========================================
// Waiter Call Service
// ========================================
// Manages waiter call requests from customers

import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  onSnapshot,
  orderBy,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';

export interface WaiterCall {
  id: string;
  restaurantId: string;
  tableId: string;
  tableLabelString: string;
  status: 'pending' | 'acknowledged' | 'completed';
  createdAt: Date;
  acknowledgedAt?: Date;
  completedAt?: Date;
}

export class WaiterCallService {
  /**
   * Create a new waiter call request
   */
  static async createCall(
    restaurantId: string,
    tableId: string,
    tableLabelString: string
  ): Promise<{ callId: string }> {
    try {
      const db = getDb();
      const callData = {
        restaurantId,
        tableId,
        tableLabelString,
        status: 'pending',
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'waiterCalls'), callData);

      console.log('[WaiterCallService] ✅ Call created:', docRef.id);

      return { callId: docRef.id };
    } catch (error) {
      console.error('[WaiterCallService] ❌ Error creating call:', error);
      throw new Error('Failed to call waiter');
    }
  }

  /**
   * Subscribe to pending waiter calls for a restaurant (real-time)
   */
  static subscribeToRestaurantCalls(
    restaurantId: string,
    onCallsUpdate: (calls: WaiterCall[]) => void
  ): () => void {
    console.log('[WaiterCallService] Setting up subscription for restaurantId:', restaurantId);

    const db = getDb();
    const q = query(
      collection(db, 'waiterCalls'),
      where('restaurantId', '==', restaurantId),
      where('status', 'in', ['pending', 'acknowledged']),
      orderBy('createdAt', 'desc')
    );

    console.log('[WaiterCallService] Query created, setting up onSnapshot listener');

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('[WaiterCallService] Snapshot received, docs count:', snapshot.docs.length);

        const calls: WaiterCall[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          console.log('[WaiterCallService] Processing call doc:', doc.id, data);
          return {
            id: doc.id,
            restaurantId: data.restaurantId,
            tableId: data.tableId,
            tableLabelString: data.tableLabelString,
            status: data.status,
            createdAt: data.createdAt?.toDate() || new Date(),
            acknowledgedAt: data.acknowledgedAt?.toDate(),
            completedAt: data.completedAt?.toDate(),
          };
        });

        console.log('[WaiterCallService] Mapped calls:', calls);
        onCallsUpdate(calls);
      },
      (error) => {
        console.error('[WaiterCallService] ❌ Error subscribing to calls:', error);
      }
    );

    console.log('[WaiterCallService] Subscription setup complete');
    return unsubscribe;
  }

  /**
   * Acknowledge a waiter call (admin saw it)
   */
  static async acknowledgeCall(callId: string): Promise<void> {
    try {
      const db = getDb();
      const callRef = doc(db, 'waiterCalls', callId);
      await updateDoc(callRef, {
        status: 'acknowledged',
        acknowledgedAt: Timestamp.now(),
      });

      console.log('[WaiterCallService] ✅ Call acknowledged:', callId);
    } catch (error) {
      console.error('[WaiterCallService] ❌ Error acknowledging call:', error);
      throw error;
    }
  }

  /**
   * Complete a waiter call (served)
   */
  static async completeCall(callId: string): Promise<void> {
    try {
      const db = getDb();
      const callRef = doc(db, 'waiterCalls', callId);
      await updateDoc(callRef, {
        status: 'completed',
        completedAt: Timestamp.now(),
      });

      console.log('[WaiterCallService] ✅ Call completed:', callId);

      // Delete completed calls after 5 seconds
      setTimeout(async () => {
        try {
          await deleteDoc(callRef);
          console.log('[WaiterCallService] 🗑️ Deleted completed call:', callId);
        } catch (error) {
          console.error('[WaiterCallService] ❌ Error deleting call:', error);
        }
      }, 5000);
    } catch (error) {
      console.error('[WaiterCallService] ❌ Error completing call:', error);
      throw error;
    }
  }

  /**
   * Get pending calls count for a restaurant
   */
  static async getPendingCallsCount(restaurantId: string): Promise<number> {
    try {
      const db = getDb();
      const q = query(
        collection(db, 'waiterCalls'),
        where('restaurantId', '==', restaurantId),
        where('status', '==', 'pending')
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('[WaiterCallService] ❌ Error getting pending calls count:', error);
      return 0;
    }
  }
}
