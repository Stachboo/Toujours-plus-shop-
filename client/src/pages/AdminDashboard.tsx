import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Package,
  CheckCircle,
  Clock,
  Truck,
  AlertCircle,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const { data: orders = [], refetch: refetchOrders } = trpc.admin.orders.list.useQuery(
    undefined,
    { enabled: user?.role === 'admin' }
  );

  const updateStatusMutation = trpc.admin.orders.updateStatus.useMutation({
    onSuccess: () => {
      refetchOrders();
      toast.success('Statut mis à jour');
    },
    onError: (error) => toast.error(error.message),
  });

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-4">Accès refusé</h1>
          <p className="text-muted-foreground mb-6">
            Vous n'avez pas les permissions pour accéder à cette page.
          </p>
          <Button onClick={() => navigate('/')} className="btn-primary">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="w-4 h-4 text-yellow-400" />,
      processing: <Package className="w-4 h-4 text-blue-400" />,
      shipped: <Truck className="w-4 h-4 text-primary" />,
      delivered: <CheckCircle className="w-4 h-4 text-green-400" />,
      cancelled: <XCircle className="w-4 h-4 text-red-400" />,
    };
    return icons[status] || null;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      processing: 'En traitement',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
      processing: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
      shipped: 'bg-primary/10 text-primary border-primary/20',
      delivered: 'bg-green-400/10 text-green-400 border-green-400/20',
      cancelled: 'bg-red-400/10 text-red-400 border-red-400/20',
    };
    return colors[status] || '';
  };

  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const stats = [
    { label: 'En attente', count: orders.filter((o) => o.status === 'pending').length, icon: Clock, color: 'text-yellow-400' },
    { label: 'En traitement', count: orders.filter((o) => o.status === 'processing').length, icon: Package, color: 'text-blue-400' },
    { label: 'Expédiées', count: orders.filter((o) => o.status === 'shipped').length, icon: Truck, color: 'text-primary' },
    { label: 'Livrées', count: orders.filter((o) => o.status === 'delivered').length, icon: CheckCircle, color: 'text-green-400' },
    { label: 'CA Total', count: `${(totalRevenue / 100).toFixed(0)}€`, icon: TrendingUp, color: 'text-accent' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/30 bg-card/30">
        <div className="container py-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Dashboard <span className="text-primary">Admin</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gestion des commandes</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass-card p-4 text-center"
                >
                  <Icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
                  <p className="text-xl font-bold text-foreground">{stat.count}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Orders Table */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/20">
                    <th className="px-4 md:px-6 py-4 text-left text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                      Commande
                    </th>
                    <th className="px-4 md:px-6 py-4 text-left text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                      Client
                    </th>
                    <th className="px-4 md:px-6 py-4 text-left text-xs text-muted-foreground uppercase tracking-widest font-semibold hidden md:table-cell">
                      Email
                    </th>
                    <th className="px-4 md:px-6 py-4 text-left text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                      Total
                    </th>
                    <th className="px-4 md:px-6 py-4 text-left text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                      Statut
                    </th>
                    <th className="px-4 md:px-6 py-4 text-left text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        Aucune commande
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-border/10 hover:bg-white/3 transition-colors"
                      >
                        <td className="px-4 md:px-6 py-4 font-mono text-xs text-primary">
                          {order.orderNumber}
                        </td>
                        <td className="px-4 md:px-6 py-4 text-sm text-foreground font-medium">
                          {order.customerName}
                        </td>
                        <td className="px-4 md:px-6 py-4 text-sm text-muted-foreground hidden md:table-cell">
                          {order.customerEmail}
                        </td>
                        <td className="px-4 md:px-6 py-4 text-sm font-semibold text-foreground">
                          {(order.totalAmount / 100).toFixed(2)}€
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}
                          >
                            {getStatusIcon(order.status)}
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <button
                            onClick={() =>
                              setSelectedOrderId(selectedOrderId === order.id ? null : order.id)
                            }
                            className="text-xs text-primary hover:text-primary/80 font-semibold transition-colors"
                          >
                            {selectedOrderId === order.id ? 'Fermer' : 'Détails'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Details Panel */}
          {selectedOrder && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 glass-card p-6"
            >
              <h2 className="text-lg font-bold text-foreground mb-6">
                Commande <span className="text-primary">{selectedOrder.orderNumber}</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="p-4 rounded-xl bg-white/3">
                  <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-3 font-semibold">
                    Client
                  </h3>
                  <p className="text-sm text-foreground font-medium">{selectedOrder.customerName}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.customerEmail}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.customerPhone || 'N/A'}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/3">
                  <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-3 font-semibold">
                    Livraison
                  </h3>
                  <p className="text-sm text-foreground">{selectedOrder.shippingAddress}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.shippingPostalCode} {selectedOrder.shippingCity}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.shippingCountry}</p>
                </div>
              </div>

              {/* Status Update */}
              <div className="border-t border-border/20 pt-6">
                <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-3 font-semibold">
                  Mettre à jour le statut
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {statuses.map((status) => (
                    <Button
                      key={status}
                      onClick={() =>
                        updateStatusMutation.mutate({
                          orderId: selectedOrderId!,
                          status: status as any,
                        })
                      }
                      variant={selectedOrder.status === status ? 'default' : 'outline'}
                      size="sm"
                      disabled={updateStatusMutation.isPending}
                      className={
                        selectedOrder.status === status
                          ? 'btn-primary'
                          : 'border-border/50 text-muted-foreground hover:text-foreground hover:bg-white/5'
                      }
                    >
                      {getStatusLabel(status)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-border/20 pt-6 mt-6 flex justify-between items-center">
                <span className="font-bold text-foreground">Total</span>
                <span className="text-2xl font-bold text-primary">
                  {(selectedOrder.totalAmount / 100).toFixed(2)}€
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
