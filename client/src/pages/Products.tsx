import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { motion } from 'framer-motion';
import { Search, ShoppingBag, SlidersHorizontal, X } from 'lucide-react';
import { formatPrice } from '@shared/const';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

export default function Products() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  const { data: categories = [] } = trpc.categories.list.useQuery();

  const { data: products = [], isLoading } = trpc.products.list.useQuery({
    search: search || undefined,
    categoryId: selectedCategory,
  });

  const filteredProducts = products;

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <section className="relative py-12 md:py-16 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/3 w-72 h-72 bg-primary/5 rounded-full blur-[100px]" />
        </div>
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
              Le <span className="text-primary">Catalogue</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Trouve le slogan qui te correspond.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="sticky top-[72px] md:top-[80px] z-40 glass border-b border-border/30">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un produit..."
                className="pl-10 bg-white/5 border-border/50 focus:border-primary/50 rounded-xl"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`gap-2 rounded-xl ${showFilters ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filtres</span>
            </Button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-border/20"
            >
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 font-semibold">
                Catégories
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(undefined)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    !selectedCategory
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10'
                  }`}
                >
                  Tous
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      selectedCategory === cat.id
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Products Grid */}
      <section className="section">
        <div className="container">
          <p className="text-sm text-muted-foreground mb-6">
            {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} trouvé{filteredProducts.length !== 1 ? 's' : ''}
          </p>

          {isLoading ? (
            <div className="grid-products">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="product-card">
                  <div className="skeleton aspect-square" />
                  <div className="p-5 space-y-3">
                    <div className="skeleton h-5 w-3/4" />
                    <div className="skeleton h-4 w-1/2" />
                    <div className="skeleton h-5 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Aucun produit trouvé</h3>
              <p className="text-muted-foreground mb-6">
                Essayez de modifier vos filtres ou votre recherche.
              </p>
              <Button
                onClick={() => {
                  setSearch('');
                  setSelectedCategory(undefined);
                }}
                className="btn-secondary"
              >
                Réinitialiser les filtres
              </Button>
            </div>
          ) : (
            <div className="grid-products">
              {filteredProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-50px' }}
                  variants={fadeInUp}
                >
                  <button
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="product-card w-full text-left group"
                  >
                    <div className="product-card-image relative flex items-center justify-center">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.slogan}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-3 p-6">
                          <ShoppingBag className="w-10 h-10 text-muted-foreground/30" />
                          <span className="slogan text-base text-center">{product.slogan}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <span className="text-sm font-semibold text-white bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                          Voir le produit
                        </span>
                      </div>
                    </div>
                    <div className="product-card-content">
                      <p className="product-card-slogan">{product.slogan}</p>
                      <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                        {product.name} &middot; {categories.find((c) => c.id === product.categoryId)?.name}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="product-card-price">{formatPrice(product.price)}</p>
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
