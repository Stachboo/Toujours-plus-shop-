import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { motion } from 'framer-motion';
import { ShoppingBag, Trash2, Plus, Minus, ChevronLeft, ArrowRight, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { getLoginUrl } from '@/const';

export default function Cart() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const { data: cartItems = [], refetch: refetchCart } = trpc.cart.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const updateQuantityMutation = trpc.cart.update.useMutation({
    onSuccess: () => refetchCart(),
    onError: (error) => toast.error(error.message),
  });

  const removeItemMutation = trpc.cart.remove.useMutation({
    onSuccess: () => {
      refetchCart();
      toast.success('Article supprimé');
    },
    onError: (error) => toast.error(error.message),
  });

  const clearCartMutation = trpc.cart.clear.useMutation({
    onSuccess: () => {
      refetchCart();
      toast.success('Panier vidé');
    },
    onError: (error) => toast.error(error.message),
  });

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
  const freeShippingThreshold = 5000;
  const shipping = subtotal >= freeShippingThreshold ? 0 : 500;
  const total = subtotal + shipping;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-foreground mb-3">Connectez-vous</h1>
          <p className="text-muted-foreground mb-6">
            Pour accéder à votre panier et passer commande.
          </p>
          <a href={getLoginUrl()}>
            <Button className="btn-primary gap-2">
              Se connecter
              <ArrowRight className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border/30 bg-card/30">
        <div className="container py-4">
          <button
            onClick={() => navigate('/products')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Continuer le shopping
          </button>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold text-foreground mb-8"
          >
            Votre <span className="text-primary">panier</span>
            {cartItems.length > 0 && (
              <span className="text-lg text-muted-foreground ml-3 font-normal">
                ({cartItems.length} article{cartItems.length > 1 ? 's' : ''})
              </span>
            )}
          </motion.h1>

          {cartItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Panier vide</h2>
              <p className="text-muted-foreground mb-6">
                Découvrez notre collection et trouvez votre slogan.
              </p>
              <Button onClick={() => navigate('/products')} className="btn-primary gap-2">
                Voir le catalogue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {/* Free shipping progress */}
                {remainingForFreeShipping > 0 && (
                  <div className="glass-card p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Truck className="w-4 h-4 text-primary" />
                      <p className="text-sm text-foreground">
                        Plus que <span className="text-primary font-semibold">{(remainingForFreeShipping / 100).toFixed(2)}€</span> pour la livraison gratuite !
                      </p>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {cartItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card p-4 md:p-6 flex gap-4 md:gap-6"
                  >
                    {/* Image */}
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-white/5 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {item.product?.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.slogan}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="w-8 h-8 text-muted-foreground/30" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-primary text-sm md:text-base mb-1 truncate">
                        {item.product?.slogan}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        {item.variant?.size} / {item.variant?.color}
                      </p>

                      <div className="flex items-center justify-between">
                        {/* Quantity */}
                        <div className="flex items-center bg-white/5 border border-border/50 rounded-lg overflow-hidden">
                          <button
                            onClick={() =>
                              updateQuantityMutation.mutate({
                                cartItemId: item.id,
                                quantity: Math.max(1, item.quantity - 1),
                              })
                            }
                            className="p-2 hover:bg-white/5 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-3 text-sm font-semibold">{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateQuantityMutation.mutate({
                                cartItemId: item.id,
                                quantity: item.quantity + 1,
                              })
                            }
                            className="p-2 hover:bg-white/5 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Price */}
                        <p className="font-bold text-foreground">
                          {(((item.product?.price || 0) * item.quantity) / 100).toFixed(2)}€
                        </p>
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeItemMutation.mutate({ cartItemId: item.id })}
                      className="self-start p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="glass-card p-6 sticky top-24 space-y-5">
                  <h2 className="text-lg font-bold text-foreground">Résumé</h2>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Sous-total</span>
                      <span>{(subtotal / 100).toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Livraison</span>
                      <span className={shipping === 0 ? 'text-green-400 font-semibold' : ''}>
                        {shipping === 0 ? 'Gratuite' : `${(shipping / 100).toFixed(2)}€`}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-border/30 pt-4 flex justify-between items-center">
                    <span className="font-bold text-foreground">Total</span>
                    <span className="text-2xl font-bold text-primary">{(total / 100).toFixed(2)}€</span>
                  </div>

                  <Button
                    onClick={() => navigate('/checkout')}
                    disabled={cartItems.length === 0}
                    className="w-full btn-primary py-4 text-base gap-2"
                    size="lg"
                  >
                    Commander
                    <ArrowRight className="w-4 h-4" />
                  </Button>

                  <button
                    onClick={() => clearCartMutation.mutate()}
                    className="w-full text-center text-xs text-muted-foreground hover:text-red-400 transition-colors py-2"
                  >
                    Vider le panier
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
