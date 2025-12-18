import {
  getDb,
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  type Unsubscribe,
} from '@/lib/firebase';
import { withFirebaseErrorHandling } from '@/lib/firebase-helpers';
import { createOrderSchema, orderStatusSchema } from '@/lib/validation';
import { calculateOrderTotal } from '@/lib/utils';
import { COLLECTIONS, ORDER_STATUS } from '@/lib/constants';
import type { CreateOrderInput, OrderInput } from '@/lib/validation';
import { CouponService } from './CouponService';
import type { Coupon } from '@/types/schema';

/**
 * Order Service
 * Handles all order-related operations with validation
 */
export class OrderService {
  /**
   * Create a new order
   *
   * @param orderData - Order creation data
   * @returns Created order ID
   *
   * @throws FirebaseOperationError on validation or creation failure
   */
  static async createOrder(
    orderData: CreateOrderInput
  ): Promise<{ orderId: string }> {
    return withFirebaseErrorHandling(async () => {
      // Validate order data
      const validated = createOrderSchema.parse(orderData);

      // Calculate subtotal
      const subtotal = calculateOrderTotal(validated.items);

      const db = getDb();

      // If coupon is provided, use transaction to ensure atomicity
      if (validated.couponId) {
        const orderId = await runTransaction(db, async (transaction) => {
          // 1. Fetch and validate coupon
          const couponRef = doc(db, COLLECTIONS.COUPONS, validated.couponId!);
          const couponDoc = await transaction.get(couponRef);

          if (!couponDoc.exists()) {
            throw new Error('Coupon introuvable');
          }

          const couponData = couponDoc.data();
          const coupon: Coupon = {
            id: couponDoc.id,
            restaurantId: couponData.restaurantId,
            campaignId: couponData.campaignId,
            code: couponData.code,
            status: couponData.status,
            discountType: couponData.discountType,
            discountValue: couponData.discountValue,
            discountDescription: couponData.discountDescription,
            deviceId: couponData.deviceId,
            createdAt: couponData.createdAt?.toDate() || new Date(),
            validUntil: couponData.validUntil?.toDate() || new Date(),
            usedAt: couponData.usedAt ? couponData.usedAt.toDate() : undefined,
            orderId: couponData.orderId,
          };

          // 2. Validate coupon status (double-check in transaction)
          const validation = CouponService.validateCoupon(coupon);
          if (!validation.valid) {
            throw new Error(validation.reason || 'Coupon invalide');
          }

          // 3. Calculate discount and final total
          const discountAmount = CouponService.calculateDiscount(coupon, subtotal);
          const totalAmount = Math.max(0, subtotal - discountAmount);

          // 4. Create order document
          const orderDoc = {
            ...validated,
            status: ORDER_STATUS.PENDING_VALIDATION,
            subtotalBeforeDiscount: subtotal,
            discountAmount,
            totalAmount,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          const ordersCollection = collection(db, COLLECTIONS.ORDERS);
          const orderRef = await addDoc(ordersCollection, orderDoc);

          // 5. Mark coupon as used
          transaction.update(couponRef, {
            status: 'used',
            usedAt: serverTimestamp(),
            orderId: orderRef.id,
          });

          console.log(`✓ Order created with coupon: ${orderRef.id} (saved ${discountAmount} cents)`);
          return orderRef.id;
        });

        return { orderId };
      } else {
        // No coupon - simple order creation
        // ⚠️ Remove undefined couponId to avoid Firestore error
        const { couponId, ...orderData } = validated;

        const orderDoc = {
          ...orderData,
          status: ORDER_STATUS.PENDING_VALIDATION,
          totalAmount: subtotal,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        const ordersCollection = collection(db, COLLECTIONS.ORDERS);
        const docRef = await addDoc(ordersCollection, orderDoc);

        console.log(`✓ Order created: ${docRef.id}`);
        return { orderId: docRef.id };
      }
    });
  }

  /**
   * Update order status with timestamp tracking
   *
   * @param orderId - Order ID to update
   * @param newStatus - New status value
   * @param rejectionReason - Optional rejection reason (required if status is REJECTED)
   *
   * @throws FirebaseOperationError on validation or update failure
   */
  static async updateOrderStatus(
    orderId: string,
    newStatus: string,
    rejectionReason?: string
  ): Promise<void> {
    return withFirebaseErrorHandling(async () => {
      // Validate status
      const validatedStatus = orderStatusSchema.parse(newStatus);

      // Validate rejection reason if status is REJECTED
      if (validatedStatus === ORDER_STATUS.REJECTED && !rejectionReason) {
        throw new Error('Rejection reason is required when rejecting an order');
      }

      // Prepare update data
      const updateData: Record<string, unknown> = {
        status: validatedStatus,
        updatedAt: serverTimestamp(),
      };

      // Add timestamp fields based on status
      switch (validatedStatus) {
        case ORDER_STATUS.PREPARING:
          updateData.validatedAt = serverTimestamp();
          break;
        case ORDER_STATUS.READY:
          updateData.readyAt = serverTimestamp();
          break;
        case ORDER_STATUS.SERVED:
          updateData.servedAt = serverTimestamp();
          break;
        case ORDER_STATUS.REJECTED:
          updateData.rejectionReason = rejectionReason;
          break;
      }

      // Update order in Firestore
      const db = getDb();
      const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
      await updateDoc(orderRef, updateData);

      console.log(`✓ Order ${orderId} updated to status: ${validatedStatus}`);
    });
  }

  /**
   * Subscribe to restaurant orders in real-time
   *
   * @param restaurantId - Restaurant ID to filter orders
   * @param onUpdate - Callback function called when orders change
   * @param onError - Callback function called on errors
   *
   * @returns Unsubscribe function to stop listening
   *
   * @example
   * ```tsx
   * const unsubscribe = OrderService.subscribeToRestaurantOrders(
   *   restaurantId,
   *   (orders) => setOrders(orders),
   *   (error) => console.error(error)
   * );
   *
   * // Cleanup on unmount
   * return () => unsubscribe();
   * ```
   */
  static subscribeToRestaurantOrders(
    restaurantId: string,
    onUpdate: (orders: OrderInput[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const db = getDb();
    const ordersCollection = collection(db, COLLECTIONS.ORDERS);

    // Query orders for this restaurant, ordered by creation date (newest first)
    const q = query(
      ordersCollection,
      where('restaurantId', '==', restaurantId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const orders = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Convert Firestore timestamps to Date objects
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            validatedAt: data.validatedAt?.toDate(),
            readyAt: data.readyAt?.toDate(),
            servedAt: data.servedAt?.toDate(),
          } as OrderInput;
        });

        onUpdate(orders);
      },
      (error) => {
        console.error('Order subscription error:', error);
        if (onError) {
          onError(error as Error);
        }
      }
    );
  }

  /**
   * Subscribe to table orders in real-time (for customer view)
   *
   * @param restaurantId - Restaurant ID
   * @param tableId - Table ID
   * @param customerSessionId - Customer session ID
   * @param onUpdate - Callback function called when orders change
   * @param onError - Callback function called on errors
   *
   * @returns Unsubscribe function
   */
  static subscribeToTableOrders(
    restaurantId: string,
    tableId: string,
    customerSessionId: string,
    onUpdate: (orders: OrderInput[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const db = getDb();
    const ordersCollection = collection(db, COLLECTIONS.ORDERS);

    const q = query(
      ordersCollection,
      where('restaurantId', '==', restaurantId),
      where('tableId', '==', tableId),
      where('customerSessionId', '==', customerSessionId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const orders = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            validatedAt: data.validatedAt?.toDate(),
            readyAt: data.readyAt?.toDate(),
            servedAt: data.servedAt?.toDate(),
          } as OrderInput;
        });

        onUpdate(orders);
      },
      (error) => {
        console.error('Table orders subscription error:', error);
        if (onError) {
          onError(error as Error);
        }
      }
    );
  }
}
