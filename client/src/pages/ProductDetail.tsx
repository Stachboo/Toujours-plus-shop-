import { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { motion } from 'framer-motion';
import { ShoppingBag, ChevronLeft, Plus, Minus, Truck, Shield, RotateCcw, Star } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@shared/const';

export default function ProductDetail() {
  const [, params] = useRoute('/product/:id');
  const [, navigate] = useLocation();
  const productId = params?.id ? parseInt(params.id) : 0;

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const { data: product, isLoading } = trpc.products.getById.useQuery(
    { id: productId },
    { enabled: productId > 0 }
  );

  const utils = trpc.useUtils();

  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      toast.success('Produit ajouté au panier !');
      setQuantity(1);
      utils.cart.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de l'ajout au panier");
    },
  });

  if (!product && !isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-4">Produit non trouvé</h1>
          <Button onClick={() => navigate('/products')} className="btn-primary">
            Retour au catalogue
          </Button>
        </div>
      </div>
    );
  }

  const handleAddToCart = async () => {
    if (!selectedSize || !selectedColor) {
      toast.error('Veuillez sélectionner une taille et une couleur');
      return;
    }
    const variant = product?.variants.find(
      (v) => v.size === selectedSize && v.color === selectedColor
    );
    if (!variant) {
      toast.error('Variante non disponible');
      return;
    }
    setIsAdding(true);
    try {
      await addToCartMutation.mutateAsync({ variantId: variant.id, quantity });
    } finally {
      setIsAdding(false);
    }
  };

  const sizes = product ? Array.from(new Set(product.variants.map((v) => v.size))) : [];
  const colors = product
    ? Array.from(new Set(product.variants.filter((v) => v.size === selectedSize).map((v) => v.color)))
    : [];
  const selectedVariant = product?.variants.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  );
  const availableStock = selectedVariant?.stock || 0;

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
            Retour au catalogue
          </button>
        </div>
      </div>

      {/* Product Detail */}
      <section className="section">
        <div className="container">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="skeleton aspect-square rounded-2xl" />
              <div className="space-y-6">
                <div className="skeleton h-8 w-3/4" />
                <div className="skeleton h-6 w-1/3" />
                <div className="skeleton h-20 w-full" />
                <div className="skeleton h-12 w-full" />
              </div>
            </div>
          ) : product ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
              {/* Product Image */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="glass-card overflow-hidden aspect-square flex items-center justify-center"
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.slogan}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <ShoppingBag className="w-20 h-20 text-muted-foreground/30" />
                    <span className="slogan text-2xl text-center px-8">{product.slogan}</span>
                  </div>
                )}
              </motion.div>

              {/* Product Info */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="space-y-6"
              >
                {/* Title & Price */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
                    {product.name}
                  </p>
                  <h1 className="slogan text-3xl md:text-4xl mb-4">{product.slogan}</h1>
                  <p className="text-3xl font-bold text-primary">
                    {formatPrice(product.price)}
                  </p>
                </div>

                {/* Description */}
                {product.description && (
                  <div className="glass-card p-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Size Selection */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-widest mb-3">
                    Taille
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          setSelectedSize(size);
                          setSelectedColor('');
                        }}
                        className={`min-w-[48px] py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                          selectedSize === size
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                            : 'bg-white/5 border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/50'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selection */}
                {selectedSize && colors.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-widest mb-3">
                      Couleur
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                            selectedColor === color
                              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                              : 'bg-white/5 border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/50'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                {selectedVariant && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-widest mb-3">
                      Quantité
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center bg-white/5 border border-border/50 rounded-xl overflow-hidden">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="p-3 hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-5 py-3 font-semibold text-foreground min-w-[48px] text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                          disabled={quantity >= availableStock}
                          className="p-3 hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {availableStock} en stock
                      </p>
                    </div>
                  </div>
                )}

                {/* Stock Warning */}
                {selectedVariant && availableStock > 0 && availableStock < 5 && (
                  <div className="flex items-center gap-2 text-sm text-orange-400 bg-orange-400/10 px-4 py-3 rounded-xl">
                    <span>🔥</span>
                    <span>
                      Plus que {availableStock} article{availableStock > 1 ? 's' : ''} disponible{availableStock > 1 ? 's' : ''} !
                    </span>
                  </div>
                )}

                {/* Add to Cart */}
                <Button
                  onClick={handleAddToCart}
                  disabled={!selectedSize || !selectedColor || isAdding || availableStock === 0}
                  size="lg"
                  className="w-full btn-primary text-base py-4 gap-2"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {!selectedSize || !selectedColor
                    ? 'Sélectionnez taille et couleur'
                    : availableStock === 0
                    ? 'Rupture de stock'
                    : isAdding
                    ? 'Ajout en cours...'
                    : 'Ajouter au panier'}
                </Button>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Truck, text: 'Livraison offerte' },
                    { icon: Shield, text: 'Paiement sécurisé' },
                    { icon: RotateCcw, text: 'Retour 30j' },
                  ].map(({ icon: Icon, text }) => (
                    <div
                      key={text}
                      className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-white/3 text-center"
                    >
                      <Icon className="w-4 h-4 text-primary/60" />
                      <span className="text-[10px] text-muted-foreground leading-tight">{text}</span>
                    </div>
                  ))}
                </div>

                {/* Reviews preview */}
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-accent text-accent" />
                      ))}
                    </div>
                    <span className="text-sm text-foreground font-semibold">4.9/5</span>
                    <span className="text-xs text-muted-foreground">(127 avis)</span>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    "Qualité au top, le slogan fait toujours son effet !" — Lucas M.
                  </p>
                </div>
              </motion.div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
