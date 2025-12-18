// ========================================
// Admin Clients Page
// ========================================
// View customer emails captured via rewards

'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { CustomerService } from '@/services/CustomerService';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Users, Mail, Gift, Download, Search } from 'lucide-react';
import { toast } from 'sonner';
import type { CustomerEmail } from '@/types/schema';

export default function ClientsPage() {
  const { restaurantId, loading: authLoading } = useAdminAuth();
  const [customers, setCustomers] = useState<CustomerEmail[]>([]);
  const [stats, setStats] = useState<{
    totalEmails: number;
    recentEmails: number;
    rewardDistribution: Record<string, number>;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const loadCustomers = async () => {
      if (!restaurantId) return;

      try {
        const customerData = await CustomerService.getRestaurantCustomers(restaurantId);
        setCustomers(customerData);

        const customerStats = await CustomerService.getCustomerStats(restaurantId);
        setStats(customerStats);
      } catch (error) {
        console.error('[Admin Clients] Failed to load customers:', error);
        toast.error('Erreur lors du chargement des clients');
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, [restaurantId]);

  const handleExportCSV = async () => {
    if (!restaurantId) return;

    setIsExporting(true);
    try {
      const csvContent = await CustomerService.exportToCSV(restaurantId);

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `clients-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success('Export CSV réussi !');
    } catch (error) {
      console.error('[Admin Clients] Failed to export CSV:', error);
      toast.error("Erreur lors de l'export");
    } finally {
      setIsExporting(false);
    }
  };

  const filteredCustomers = searchQuery
    ? customers.filter((customer) =>
        customer.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : customers;

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" text="Chargement des clients..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Base Clients</h2>
          <p className="text-gray-400">
            Emails capturés via les cartes à gratter
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={isExporting || customers.length === 0}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-white font-medium flex items-center gap-2 transition-colors"
        >
          <Download className="w-4 h-4" />
          {isExporting ? 'Export...' : 'Export CSV'}
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Emails */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-2">Total emails</p>
                <p className="text-3xl font-bold text-white">{stats.totalEmails}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10">
                <Mail className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </div>

          {/* Recent Emails (30 days) */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-2">Nouveaux (30j)</p>
                <p className="text-3xl font-bold text-white">{stats.recentEmails}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>

          {/* Most Popular Reward */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-2">Récompense populaire</p>
                <p className="text-sm font-semibold text-white truncate">
                  {Object.entries(stats.rewardDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-orange-500/10">
                <Gift className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher par email..."
          className="w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Customers Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              {searchQuery ? 'Aucun résultat' : 'Aucun client enregistré'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Les emails apparaîtront ici lorsque des clients réclameront leurs récompenses
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Récompense
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date de visite
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Inscrit le
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-750 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-white">{customer.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-gray-300">
                          {customer.rewardClaimed}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {customer.visitDate.toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {customer.createdAt.toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reward Distribution */}
      {stats && Object.keys(stats.rewardDistribution).length > 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Répartition des récompenses
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.rewardDistribution)
              .sort((a, b) => b[1] - a[1])
              .map(([reward, count]) => (
                <div key={reward} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-gray-300">{reward}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-900 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-orange-500"
                        style={{
                          width: `${(count / stats.totalEmails) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-400 w-12 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
