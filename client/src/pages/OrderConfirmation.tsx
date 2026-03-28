import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { motion } from 'framer-motion';
import { CheckCircle, Package, Home, ShoppingBag, ArrowRight } from 'lucide-react';

export default function OrderConfirmation() {
  const [, params] = useRoute('/order-confirmation/:id');
  const [, navigate] = useLocation();
  const paramId = params?.id ?? '';
  const isGenericSuccess = paramId === 'success' || paramId === 'pending';
  const orderId = isGenericSuccess ? 0 : (parseInt(paramId) || 0);

  const { data: order, isLoading } = trpc.orders.getById.useQuery(
    { id: orderId },
    { enabled: orderId > 0 }
  );

  const statusLabels: Record<string, string> = {
    pending: 'En attente',
    processing: 'En préparation',
    shipped: 'Expédiée',
    delivered: 'Livrée',
    cancelled: 'Annulée',
  };

  if (!isGenericSuccess && isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isGenericSuccess && !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-4">Commande non trouvée</h1>
          <Button onClick={() => navigate('/')} className="btn-primary">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Success Hero */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
        <div className="container relative text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl md:text-5xl font-bold text-foreground mb-4"
          >
            Paiement <span className="text-primary">confirmé</span> !
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground text-lg"
          >
            {order
              ? `Merci ${order.customerName}, votre commande est en route.`
              : 'Merci pour votre achat ! Votre commande est en cours de traitement.'}
          </motion.p>
        </div>
      </section>

      {/* Order Details */}
      <section className="pb-16 md:pb-24">
        <div className="container max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6 md:p-8 space-y-8"
          >
            {order ? (
              <>
                {/* Order Number */}
                <div className="text-center pb-6 border-b border-border/20">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
                    Numéro de commande
                  </p>
                  <p className="text-2xl font-bold font-mono text-primary">{order.orderNumber}</p>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/3">
                  <Package className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">Statut</p>
                    <p className="font-semibold text-foreground">
                      {statusLabels[order.status] || order.status}
                    </p>
                  </div>
                </div>

                {/* Shipping */}
                <div>
                  <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-3 font-semibold">
                    Adresse de livraison
                  </h3>
                  <div className="p-4 rounded-xl bg-white/3 space-y-1 text-sm">
                    <p className="font-semibold text-foreground">{order.customerName}</p>
                    <p className="text-muted-foreground">{order.shippingAddress}</p>
                    <p className="text-muted-foreground">
                      {order.shippingPostalCode} {order.shippingCity}
                    </p>
                    <p className="text-muted-foreground">{order.shippingCountry}</p>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-border/20 pt-6 flex justify-between items-center">
                  <span className="font-bold text-foreground text-lg">Total payé</span>
                  <span className="text-3xl font-bold text-primary">
                    {(order.totalAmount / 100).toFixed(2)}€
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center pb-6 border-b border-border/20">
                <Package className="w-10 h-10 text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Votre commande est en cours de création. Vous recevrez un email de confirmation sous peu.
                </p>
              </div>
            )}

            {/* Next Steps */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <h3 className="font-semibold text-foreground mb-3 text-sm">Prochaines étapes</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  Paiement confirmé
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                  Email de suivi à l'expédition
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/30" />
                  Livraison sous 3-5 jours ouvrés
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={() => navigate('/products')}
                variant="outline"
                className="flex-1 border-border/50 text-foreground hover:bg-white/5 gap-2"
              >
                Continuer le shopping
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => navigate('/')}
                className="flex-1 btn-primary gap-2"
              >
                <Home className="w-4 h-4" />
                Accueil
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
