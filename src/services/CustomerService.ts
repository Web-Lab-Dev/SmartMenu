// ========================================
// Customer Service
// ========================================
// Handles customer email capture via rewards (Module 4)

import { getDb } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/constants';
import type { CustomerEmail } from '@/types/schema';

export class CustomerService {
  /**
   * Save customer email from reward claim
   * @param data - Customer email data
   * @returns Created customer document ID
   */
  static async saveCustomerEmail(data: {
    restaurantId: string;
    email: string;
    orderId: string;
    rewardClaimed: string;
    visitDate: Date;
  }): Promise<string> {
    try {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new Error('Invalid email format');
      }

      const db = getDb();
      const customerData = {
        restaurantId: data.restaurantId,
        email: data.email.toLowerCase().trim(),
        orderId: data.orderId,
        rewardClaimed: data.rewardClaimed,
        visitDate: Timestamp.fromDate(data.visitDate),
        createdAt: Timestamp.now(),
      };

      const customersRef = collection(db, COLLECTIONS.CUSTOMERS);
      const docRef = await addDoc(customersRef, customerData);

      console.log('[Customer] Saved email:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('[Customer] Failed to save email:', error);
      throw error;
    }
  }

  /**
   * Get all customer emails for a restaurant
   * @param restaurantId - Restaurant ID
   * @param limitCount - Maximum number of customers to retrieve
   * @returns Array of customer emails
   */
  static async getRestaurantCustomers(
    restaurantId: string,
    limitCount: number = 100
  ): Promise<CustomerEmail[]> {
    try {
      const db = getDb();
      const customersRef = collection(db, COLLECTIONS.CUSTOMERS);
      const q = query(
        customersRef,
        where('restaurantId', '==', restaurantId),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limitCount)
      );

      const snapshot = await getDocs(q);
      const customers: CustomerEmail[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          restaurantId: data.restaurantId,
          email: data.email,
          orderId: data.orderId,
          rewardClaimed: data.rewardClaimed,
          visitDate: data.visitDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      });

      return customers;
    } catch (error) {
      console.error('[Customer] Failed to get customers:', error);
      throw error;
    }
  }

  /**
   * Search customers by email
   * @param restaurantId - Restaurant ID
   * @param emailQuery - Email search query
   * @returns Array of matching customers
   */
  static async searchCustomersByEmail(
    restaurantId: string,
    emailQuery: string
  ): Promise<CustomerEmail[]> {
    try {
      const db = getDb();
      const customersRef = collection(db, COLLECTIONS.CUSTOMERS);
      const q = query(
        customersRef,
        where('restaurantId', '==', restaurantId),
        where('email', '>=', emailQuery.toLowerCase()),
        where('email', '<=', emailQuery.toLowerCase() + '\uf8ff'),
        orderBy('email', 'asc'),
        firestoreLimit(20)
      );

      const snapshot = await getDocs(q);
      const customers: CustomerEmail[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          restaurantId: data.restaurantId,
          email: data.email,
          orderId: data.orderId,
          rewardClaimed: data.rewardClaimed,
          visitDate: data.visitDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      });

      return customers;
    } catch (error) {
      console.error('[Customer] Failed to search customers:', error);
      throw error;
    }
  }

  /**
   * Get customer statistics for a restaurant
   * @param restaurantId - Restaurant ID
   * @returns Customer stats
   */
  static async getCustomerStats(restaurantId: string): Promise<{
    totalEmails: number;
    recentEmails: number; // Last 30 days
    rewardDistribution: Record<string, number>;
  }> {
    try {
      const db = getDb();
      const customersRef = collection(db, COLLECTIONS.CUSTOMERS);
      const q = query(customersRef, where('restaurantId', '==', restaurantId));

      const snapshot = await getDocs(q);
      const customerData = snapshot.docs.map((doc) => doc.data());

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentEmails = customerData.filter((customer) => {
        const createdAt = customer.createdAt?.toDate();
        return createdAt && createdAt >= thirtyDaysAgo;
      }).length;

      const rewardDistribution: Record<string, number> = {};
      customerData.forEach((customer) => {
        const reward = customer.rewardClaimed;
        rewardDistribution[reward] = (rewardDistribution[reward] || 0) + 1;
      });

      return {
        totalEmails: customerData.length,
        recentEmails,
        rewardDistribution,
      };
    } catch (error) {
      console.error('[Customer] Failed to get stats:', error);
      throw error;
    }
  }

  /**
   * Export customer emails to CSV format
   * @param restaurantId - Restaurant ID
   * @returns CSV string
   */
  static async exportToCSV(restaurantId: string): Promise<string> {
    try {
      const customers = await this.getRestaurantCustomers(restaurantId, 1000);

      // CSV header
      const headers = ['Email', 'Récompense', 'Date de visite', 'Date d\'inscription'];
      const rows = customers.map((customer) => [
        customer.email,
        customer.rewardClaimed,
        customer.visitDate.toLocaleDateString('fr-FR'),
        customer.createdAt.toLocaleDateString('fr-FR'),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      return csvContent;
    } catch (error) {
      console.error('[Customer] Failed to export CSV:', error);
      throw error;
    }
  }
}
