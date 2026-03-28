// ============================================================================
// FICHIER : client/src/pages/Checkout.tsx
// Remplace complètement le fichier existant
// DÉPENDANCES À INSTALLER :
//   npm install @stripe/stripe-js @stripe/react-stripe-js
// ============================================================================

import { useState } from 'react';
import { useLocation } from 'wouter';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { motion } from 'framer-motion';
import { ChevronLeft, Loader2, Shield, Lock, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

// Variable d'environnement côté client : VITE_STRIPE_PUBLISHABLE_KEY
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
if (!stripeKey) {
  console.error("VITE_STRIPE_PUBLISHABLE_KEY is not defined — payments will not work");
}
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

// ============================================================================
// Formulaire de paiement Stripe Elements (composant interne)
// ============================================================================
function StripePaymentForm({
  clientSecret,
  totalAmount,
  onSuccess,
}: {
  clientSecret: string;
  totalAmount: number;
  onSuccess: (orderId?: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isPaying, setIsPaying] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setIsPaying(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // URL de retour après paiement 3DS (si requis)
        return_url: `${window.location.origin}/order-confirmation/pending`,
      },
      redirect: 'if_required', // Évite la redirection sauf si 3DS obligatoire
    });

    if (error) {
      toast.error(error.message || 'Erreur de paiement');
      setIsPaying(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      toast.success('Paiement confirmé ! 🎉');
      onSuccess();
    }
  };

  return (
    <div className="space-y-4">
      <PaymentElement
        options={{
          layout: 'tabs',
          defaultValues: { billingDetails: { address: { country: 'FR' } } },
        }}
      />
      <Button
        onClick={handlePay}
        disabled={isPaying || !stripe || !elements}
        className="w-full btn-primary py-4 text-base gap-2"
        size="lg"
      >
        {isPaying ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Paiement en cours...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            Payer — {(totalAmount / 100).toFixed(2)} €
          </>
        )}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        Paiement sécurisé par <span className="font-semibold text-foreground">Stripe</span>.
        Tes données bancaires ne transitent jamais par nos serveurs.
      </p>
    </div>
  );
}

// ============================================================================
// Page Checkout principale
// ============================================================================
export default function Checkout() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Étapes : 'form' → saisie adresse | 'payment' → Stripe Elements
  const [step, setStep] = useState<'form' | 'payment'>('form');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [stripeTotalAmount, setStripeTotalAmount] = useState(0);

  const [formData, setFormData] = useState({
    customerName: user?.name || '',
    customerEmail: user?.email || '',
    customerPhone: '',
    shippingAddress: '',
    shippingCity: '',
    shippingPostalCode: '',
    shippingCountry: 'France',
    billingAddress: '',
    billingCity: '',
    billingPostalCode: '',
    billingCountry: 'France',
    notes: '',
  });

  const [useSameAddress, setUseSameAddress] = useState(true);

  const { data: cartItems = [] } = trpc.cart.list.useQuery();

  // Mutation qui crée le PaymentIntent côté serveur
  const createPaymentIntentMutation = trpc.stripe.createPaymentIntent.useMutation({
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setStripeTotalAmount(data.totalAmount);
      setStep('payment');
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la préparation du paiement');
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }
    const submitData = {
      ...formData,
      billingAddress: useSameAddress ? formData.shippingAddress : formData.billingAddress,
      billingCity: useSameAddress ? formData.shippingCity : formData.billingCity,
      billingPostalCode: useSameAddress ? formData.shippingPostalCode : formData.billingPostalCode,
      billingCountry: useSameAddress ? formData.shippingCountry : formData.billingCountry,
    };
    // Crée le PaymentIntent → passe à l'étape paiement
    await createPaymentIntentMutation.mutateAsync(submitData);
  };

  const handlePaymentSuccess = () => {
    // Le webhook Stripe crée la commande en DB automatiquement
    // On redirige vers une page de confirmation générique
    navigate('/order-confirmation/success');
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
  const shipping = subtotal >= 5000 ? 0 : 500;
  const total = subtotal + shipping;

  const inputClasses =
    'bg-white/5 border-border/50 focus:border-primary/50 rounded-xl text-foreground placeholder:text-muted-foreground/50';

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border/30 bg-card/30">
        <div className="container py-4 flex items-center justify-between">
          <button
            onClick={() => (step === 'payment' ? setStep('form') : navigate('/cart'))}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 'payment' ? 'Modifier mes informations' : 'Retour au panier'}
          </button>
          {/* Indicateur d'étapes */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className={step === 'form' ? 'text-primary font-semibold' : ''}>
              1. Livraison
            </span>
            <span>→</span>
            <span className={step === 'payment' ? 'text-primary font-semibold' : ''}>
              2. Paiement
            </span>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold text-foreground mb-8"
          >
            {step === 'form' ? (
              <>Informations de <span className="text-primary">livraison</span></>
            ) : (
              <>Paiement <span className="text-primary">sécurisé</span></>
            )}
          </motion.h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ================================================================
                ÉTAPE 1 : Formulaire adresse
            ================================================================ */}
            {step === 'form' && (
              <form onSubmit={handleFormSubmit} className="lg:col-span-2 space-y-6">
                {/* Contact */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass-card p-6"
                >
                  <h2 className="text-lg font-bold text-foreground mb-5">Informations de contact</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-muted-foreground uppercase tracking-widest mb-2 font-semibold">
                        Nom complet
                      </label>
                      <Input
                        type="text"
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleInputChange}
                        required
                        placeholder="Jean Dupont"
                        className={inputClasses}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-muted-foreground uppercase tracking-widest mb-2 font-semibold">
                          Email
                        </label>
                        <Input
                          type="email"
                          name="customerEmail"
                          value={formData.customerEmail}
                          onChange={handleInputChange}
                          required
                          placeholder="jean@example.com"
                          className={inputClasses}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground uppercase tracking-widest mb-2 font-semibold">
                          Téléphone
                        </label>
                        <Input
                          type="tel"
                          name="customerPhone"
                          value={formData.customerPhone}
                          onChange={handleInputChange}
                          placeholder="+33 6 12 34 56 78"
                          className={inputClasses}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Livraison */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-card p-6"
                >
                  <h2 className="text-lg font-bold text-foreground mb-5">Adresse de livraison</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-muted-foreground uppercase tracking-widest mb-2 font-semibold">
                        Adresse
                      </label>
                      <Input
                        type="text"
                        name="shippingAddress"
                        value={formData.shippingAddress}
                        onChange={handleInputChange}
                        required
                        placeholder="123 Rue de la Paix"
                        className={inputClasses}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-muted-foreground uppercase tracking-widest mb-2 font-semibold">
                          Ville
                        </label>
                        <Input
                          type="text"
                          name="shippingCity"
                          value={formData.shippingCity}
                          onChange={handleInputChange}
                          required
                          placeholder="Paris"
                          className={inputClasses}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground uppercase tracking-widest mb-2 font-semibold">
                          Code postal
                        </label>
                        <Input
                          type="text"
                          name="shippingPostalCode"
                          value={formData.shippingPostalCode}
                          onChange={handleInputChange}
                          required
                          placeholder="75001"
                          className={inputClasses}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground uppercase tracking-widest mb-2 font-semibold">
                        Pays
                      </label>
                      <Input
                        type="text"
                        name="shippingCountry"
                        value={formData.shippingCountry}
                        onChange={handleInputChange}
                        required
                        className={inputClasses}
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Facturation */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-card p-6"
                >
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useSameAddress}
                      onChange={(e) => setUseSameAddress(e.target.checked)}
                      className="w-4 h-4 rounded border-border/50 text-primary focus:ring-primary/20"
                    />
                    <span className="text-sm text-foreground font-medium">
                      Même adresse pour la facturation
                    </span>
                  </label>
                  {!useSameAddress && (
                    <div className="space-y-4 mt-5 pt-5 border-t border-border/20">
                      <h2 className="text-lg font-bold text-foreground mb-3">Adresse de facturation</h2>
                      <div>
                        <label className="block text-xs text-muted-foreground uppercase tracking-widest mb-2 font-semibold">
                          Adresse
                        </label>
                        <Input
                          type="text"
                          name="billingAddress"
                          value={formData.billingAddress}
                          onChange={handleInputChange}
                          placeholder="123 Rue de la Paix"
                          className={inputClasses}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-muted-foreground uppercase tracking-widest mb-2 font-semibold">
                            Ville
                          </label>
                          <Input
                            type="text"
                            name="billingCity"
                            value={formData.billingCity}
                            onChange={handleInputChange}
                            placeholder="Paris"
                            className={inputClasses}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted-foreground uppercase tracking-widest mb-2 font-semibold">
                            Code postal
                          </label>
                          <Input
                            type="text"
                            name="billingPostalCode"
                            value={formData.billingPostalCode}
                            onChange={handleInputChange}
                            placeholder="75001"
                            className={inputClasses}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Notes */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="glass-card p-6"
                >
                  <h2 className="text-lg font-bold text-foreground mb-5">Notes (optionnel)</h2>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Instructions spéciales pour votre commande..."
                    className={`w-full px-4 py-3 min-h-24 rounded-xl bg-white/5 border border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50`}
                  />
                </motion.div>

                <Button
                  type="submit"
                  disabled={createPaymentIntentMutation.isPending}
                  className="w-full btn-primary py-4 text-base gap-2"
                  size="lg"
                >
                  {createPaymentIntentMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Préparation du paiement...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Continuer vers le paiement — {(total / 100).toFixed(2)} €
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* ================================================================
                ÉTAPE 2 : Stripe Elements
            ================================================================ */}
            {step === 'payment' && clientSecret && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-2"
              >
                <div className="glass-card p-6">
                  <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Paiement sécurisé
                  </h2>
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: 'night',
                        variables: {
                          colorPrimary: '#FF6B00',       // Orange Toujours+
                          colorBackground: '#111111',
                          colorText: '#F0EDE8',
                          colorDanger: '#FF4444',
                          fontFamily: 'DM Sans, system-ui, sans-serif',
                          borderRadius: '8px',
                        },
                      },
                    }}
                  >
                    <StripePaymentForm
                      clientSecret={clientSecret}
                      totalAmount={stripeTotalAmount}
                      onSuccess={handlePaymentSuccess}
                    />
                  </Elements>
                </div>
              </motion.div>
            )}

            {/* ================================================================
                Récapitulatif commande (visible aux 2 étapes)
            ================================================================ */}
            <div className="lg:col-span-1">
              <div className="glass-card p-6 sticky top-24 space-y-5">
                <h2 className="text-lg font-bold text-foreground">Résumé</h2>

                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm gap-2">
                      <span className="text-muted-foreground truncate flex-1">
                        {item.product?.slogan}{' '}
                        <span className="text-foreground/50">x{item.quantity}</span>
                      </span>
                      <span className="text-foreground font-medium whitespace-nowrap">
                        {(((item.product?.price || 0) * item.quantity) / 100).toFixed(2)} €
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border/20 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Sous-total</span>
                    <span>{(subtotal / 100).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Livraison</span>
                    <span className={shipping === 0 ? 'text-green-400 font-semibold' : ''}>
                      {shipping === 0 ? 'Gratuite' : `${(shipping / 100).toFixed(2)} €`}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-muted-foreground/60">
                      Livraison offerte dès 50 €
                    </p>
                  )}
                </div>

                <div className="border-t border-border/20 pt-4 flex justify-between items-center">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="text-2xl font-bold text-primary">{(total / 100).toFixed(2)} €</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                  <Shield className="w-3.5 h-3.5 text-green-400" />
                  Paiement sécurisé SSL — Stripe
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
