import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { LOGOS } from '@/const/logos';
import { trpc } from '@/lib/trpc';
import { motion } from 'framer-motion';
import { ArrowRight, ShoppingBag, Truck, Shield, RotateCcw, Star, Zap } from 'lucide-react';
import { formatPrice } from '@shared/const';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const SLOGANS_SHOWCASE = [
  { text: 'Toujours + Con', emoji: '🤪', color: 'from-orange-500/20 to-red-500/10' },
  { text: 'Toujours + En Retard', emoji: '⏰', color: 'from-amber-500/20 to-orange-500/10' },
  { text: 'Toujours + Fauché', emoji: '💸', color: 'from-green-500/20 to-emerald-500/10' },
  { text: 'Toujours + Fatigué', emoji: '😴', color: 'from-blue-500/20 to-indigo-500/10' },
  { text: 'Toujours + Bavard', emoji: '🗣️', color: 'from-purple-500/20 to-pink-500/10' },
  { text: 'Toujours + Gourmand', emoji: '🍕', color: 'from-yellow-500/20 to-orange-500/10' },
];

const FEATURES = [
  { icon: Truck, title: 'Livraison Offerte', desc: 'Dès 50€ d\'achat' },
  { icon: Shield, title: 'Paiement Sécurisé', desc: '100% protégé' },
  { icon: RotateCcw, title: 'Retours Gratuits', desc: 'Sous 30 jours' },
  { icon: Star, title: 'Qualité Premium', desc: 'Coton bio 100%' },
];

export default function Home() {
  const [, navigate] = useLocation();
  const { data: products } = trpc.products.list.useQuery({});

  return (
    <div className="min-h-screen bg-background">

      {/* ============================================================
          HERO - Split Layout Premium : Logo 3D + T-shirt flottant
          ============================================================ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Ambient background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[5%] left-[10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[180px] animate-float" />
          <div className="absolute bottom-[5%] right-[5%] w-[500px] h-[500px] bg-accent/4 rounded-full blur-[150px] animate-float" style={{ animationDelay: '3s' }} />
          <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-accent/3 rounded-full blur-[120px]" />
        </div>

        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,107,53,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,53,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="container relative z-10 py-16 md:py-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-4 items-center min-h-screen lg:min-h-[90vh]">

            {/* LEFT COLUMN - Logo 3D + Text + CTA */}
            <div className="flex flex-col justify-center order-2 lg:order-1 pt-8 lg:pt-0">
              {/* Logo 3D Monumental */}
              <motion.div
                initial={{ opacity: 0, x: -60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="mb-6 lg:mb-8"
              >
                <img
                  src={LOGOS.hero3dLogo}
                  alt="Toujours +"
                  className="h-20 sm:h-24 md:h-28 lg:h-36 xl:h-40 w-auto drop-shadow-[0_0_80px_rgba(212,168,67,0.3)]"
                />
              </motion.div>

              {/* Tagline */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.8rem] xl:text-5xl text-foreground mb-5 leading-[1.1] tracking-tight"
                style={{ fontFamily: "'Anton', sans-serif", textTransform: 'uppercase' }}
              >
                La marque de ceux qui ne font{' '}
                <span className="text-primary text-glow-orange">jamais les choses à moitié</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.7 }}
                className="text-base md:text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed"
              >
                Célébrez votre côté excessif avec des vêtements qui assument tout.
                T-shirts, sweats et plus encore.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="flex flex-col sm:flex-row items-start gap-4"
              >
                <button
                  onClick={() => navigate('/products')}
                  className="btn-primary text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-5 gap-3 group"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Découvrir la collection
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
              </motion.div>

              {/* Mini trust badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="flex items-center gap-6 mt-10 text-muted-foreground/60"
              >
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider">
                  <Truck className="w-4 h-4" />
                  <span>Livraison gratuite</span>
                </div>
                <div className="w-px h-4 bg-border/40" />
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider">
                  <Shield className="w-4 h-4" />
                  <span>Coton bio</span>
                </div>
                <div className="w-px h-4 bg-border/40 hidden sm:block" />
                <div className="hidden sm:flex items-center gap-2 text-xs uppercase tracking-wider">
                  <RotateCcw className="w-4 h-4" />
                  <span>Retours 30j</span>
                </div>
              </motion.div>
            </div>

            {/* RIGHT COLUMN - T-shirt 3D Flottant */}
            <div className="relative flex items-center justify-center order-1 lg:order-2">
              {/* Glow behind the product */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[70%] h-[70%] bg-gradient-radial from-primary/8 via-accent/4 to-transparent rounded-full blur-[60px]" />
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                {/* Floating + slow 3D rotation */}
                <div className="animate-float" style={{ perspective: '1200px' }}>
                  <img
                    src={LOGOS.hero3dTshirt}
                    alt="T-shirt Toujours + Con - Streetwear Premium"
                    className="w-[280px] sm:w-[340px] md:w-[400px] lg:w-[440px] xl:w-[500px] h-auto drop-shadow-[0_30px_60px_rgba(0,0,0,0.5)] animate-spin-y"
                  />
                </div>

                {/* Price tag floating badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2, duration: 0.5, type: 'spring', stiffness: 200 }}
                  className="absolute -bottom-2 -right-2 sm:bottom-4 sm:right-0 glass-card px-4 py-3 flex flex-col items-center"
                >
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">À partir de</span>
                  <span className="text-2xl font-bold text-foreground">29€</span>
                </motion.div>

                {/* Bestseller badge */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.4, duration: 0.5 }}
                  className="absolute top-4 -left-2 sm:top-8 sm:-left-4"
                >
                  <div className="badge-new flex items-center gap-1.5 px-3 py-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Bestseller</span>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          FEATURES BAR - Block layout
          ============================================================ */}
      <section className="border-y border-border/30 bg-card/40">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border/20">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeInUp}
                  className="py-8 md:py-10 px-4 md:px-8 text-center"
                >
                  <Icon className="w-6 h-6 text-primary mx-auto mb-3" />
                  <p className="text-sm font-bold text-foreground uppercase tracking-wide">{feature.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          SLOGANS SHOWCASE - Block grid impactant
          ============================================================ */}
      <section className="section overflow-hidden">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            custom={0}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl text-foreground mb-5">
              Trouve ton{' '}
              <span className="text-primary text-glow-orange">Toujours +</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-base">
              Chaque slogan est un trait de caractère assumé. Lequel te correspond ?
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SLOGANS_SHOWCASE.map((slogan, i) => (
              <motion.button
                key={slogan.text}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                onClick={() => navigate('/products')}
                className={`relative overflow-hidden rounded-2xl border border-border/40 p-8 md:p-10 text-center group cursor-pointer bg-gradient-to-br ${slogan.color} hover:border-primary/40 transition-all duration-300`}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-5xl md:text-6xl mb-4 block transition-transform duration-300 group-hover:scale-110">{slogan.emoji}</span>
                <p className="slogan text-xl md:text-2xl transition-all duration-300 group-hover:text-glow-orange">
                  {slogan.text}
                </p>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          FEATURED PRODUCTS
          ============================================================ */}
      <section className="section bg-card/20">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            custom={0}
            className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4"
          >
            <div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl text-foreground mb-3">
                Nos <span className="text-primary">Bestsellers</span>
              </h2>
              <p className="text-muted-foreground text-base">Les pièces les plus populaires de la collection.</p>
            </div>
            <button
              onClick={() => navigate('/products')}
              className="hidden sm:flex items-center gap-2 text-primary hover:text-primary/80 font-semibold text-sm uppercase tracking-wide transition-colors"
            >
              Voir tout
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

          {products && products.length > 0 ? (
            <div className="grid-products">
              {products.slice(0, 4).map((product, i) => (
                <motion.div
                  key={product.id}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeInUp}
                >
                  <button
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="product-card w-full text-left group"
                  >
                    <div className="product-card-image relative flex items-center justify-center bg-muted">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.slogan}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-3 p-6">
                          <ShoppingBag className="w-12 h-12 text-muted-foreground/30" />
                          <span className="slogan text-lg text-center">{product.slogan}</span>
                        </div>
                      )}
                    </div>
                    <div className="product-card-content">
                      <p className="product-card-slogan">{product.slogan}</p>
                      <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">{product.name}</p>
                      <p className="product-card-price">{formatPrice(product.price)}</p>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <ShoppingBag className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">Les produits arrivent bientôt...</p>
            </div>
          )}

          <div className="mt-10 text-center sm:hidden">
            <button onClick={() => navigate('/products')} className="btn-primary gap-2">
              Voir tout le catalogue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================
          BRAND STORY
          ============================================================ */}
      <section className="section relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-primary/4 rounded-full blur-[120px]" />
        </div>
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              custom={0}
            >
              <img
                src={LOGOS.symbolOrange}
                alt="+"
                className="h-20 w-auto mx-auto mb-10 opacity-50"
              />
              <h2 className="text-4xl sm:text-5xl md:text-6xl text-foreground mb-8">
                L'histoire derrière{' '}
                <span className="text-primary text-glow-orange">Toujours +</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-5 text-base md:text-lg">
                Tout a commencé par un délire entre amis. On est tous "Toujours +" quelque chose : 
                toujours plus en retard, toujours plus bavard, toujours plus gourmand...
              </p>
              <p className="text-muted-foreground leading-relaxed mb-10 text-base md:text-lg">
                On a décidé de transformer ces traits de caractère en une marque qui célèbre 
                l'excès et l'autodérision. Parce qu'assumer ses défauts, c'est la vraie force.
              </p>
              <button
                onClick={() => navigate('/products')}
                className="btn-secondary gap-2 group"
              >
                Rejoins le mouvement
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SOCIAL PROOF
          ============================================================ */}
      <section className="section bg-card/20 border-y border-border/20">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            custom={0}
            className="text-center mb-14"
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl text-foreground mb-4">
              Ce qu'ils en{' '}
              <span className="text-accent text-glow-gold">disent</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Lucas M.',
                text: 'J\'ai offert le "Toujours + En Retard" à mon pote, il ne l\'a jamais aussi bien porté. Qualité au top !',
                rating: 5,
              },
              {
                name: 'Sarah K.',
                text: 'Le sweat "Toujours + Fatigué" c\'est littéralement moi. Le tissu est super confortable en plus.',
                rating: 5,
              },
              {
                name: 'Thomas D.',
                text: 'On a commandé pour toute la bande. Chacun a trouvé son slogan. Concept génial et livraison rapide.',
                rating: 5,
              },
            ].map((review, i) => (
              <motion.div
                key={review.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="glass-card p-8"
              >
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-foreground/90 leading-relaxed mb-5">
                  "{review.text}"
                </p>
                <p className="text-sm text-muted-foreground font-bold uppercase tracking-wide">
                  — {review.name}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          CTA FINAL - Impactant
          ============================================================ */}
      <section className="section relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        </div>
        <div className="container relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            custom={0}
            className="max-w-3xl mx-auto text-center"
          >
            <Zap className="w-10 h-10 text-primary mx-auto mb-6" />
            <h2 className="text-4xl sm:text-5xl md:text-7xl text-foreground mb-8 leading-none">
              Prêt à assumer ton côté{' '}
              <span className="text-primary text-glow-orange">Toujours +</span> ?
            </h2>
            <p className="text-muted-foreground mb-10 text-base md:text-lg">
              Rejoins la communauté et trouve le slogan qui te correspond.
            </p>
            <button
              onClick={() => navigate('/products')}
              className="btn-primary text-lg px-12 py-5 gap-3 group animate-pulse-glow"
            >
              <ShoppingBag className="w-5 h-5" />
              Shopper maintenant
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
