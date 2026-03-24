# 🔧 INTÉGRATION STRIPE — TOUJOURSSHOP
## Instructions complètes étape par étape

---

## ÉTAPE 1 — Créer un compte Stripe

1. Va sur https://stripe.com et crée un compte
2. Dans le dashboard Stripe → **Développeurs → Clés API**
3. Copie :
   - `pk_live_...` → clé publique (frontend)
   - `sk_live_...` → clé secrète (backend)
4. Pour les tests d'abord, utilise les clés `pk_test_...` et `sk_test_...`

---

## ÉTAPE 2 — Variables d'environnement

Dans ton projet, ajoute ces variables d'environnement :

```
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXXXXXX        (ou sk_test_ pour les tests)
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXX      (généré à l'étape 4)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXX    (ou pk_test_ pour les tests)
```

---

## ÉTAPE 3 — Installer les dépendances

Dans le terminal de ton projet :

```bash
# Côté serveur (dans le dossier racine)
npm install stripe

# Côté client (dans le dossier client/ ou racine selon config)
npm install @stripe/stripe-js @stripe/react-stripe-js
```

---

## ÉTAPE 4 — Configurer le Webhook Stripe

1. Dans le dashboard Stripe → **Développeurs → Webhooks**
2. Clique **"Ajouter un endpoint"**
3. URL : `https://your-backend.railway.app/api/stripe/webhook`
4. Événements à écouter : `payment_intent.succeeded`
5. Copie le **"Signing secret"** (whsec_...) → colle dans `STRIPE_WEBHOOK_SECRET`

---

## ÉTAPE 5 — Copier les fichiers générés

| Fichier généré | Destination dans ton projet |
|---|---|
| `server/stripe.ts` | `server/stripe.ts` |
| `server/stripe-router-additions.ts` | Lire + copier les blocs dans `server/routers.ts` |
| `client/src/pages/Checkout.tsx` | Remplace `client/src/pages/Checkout.tsx` |

---

## ÉTAPE 6 — Modifier server/routers.ts

Ajoute en haut des imports :
```typescript
import { stripe } from "./stripe";
```

Ajoute le router `stripe: router({...})` dans l'objet `appRouter`
(voir le fichier `stripe-router-additions.ts` pour le code complet)

---

## ÉTAPE 7 — Ajouter le webhook Express

Dans `server/_core/index.ts`, ajoute AVANT le middleware tRPC :

```typescript
import express from 'express';
import { stripe } from '../stripe';
import { createOrder, addOrderItems, getCartItems, clearCart } from '../db';
import { nanoid } from 'nanoid';

// Webhook Stripe — doit recevoir le body RAW avant le JSON parser
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      return res.status(400).send('Webhook Error');
    }

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as any;
      const meta = pi.metadata;
      const userId = parseInt(meta.userId);
      const cartItems = await getCartItems(userId);

      if (cartItems.length > 0) {
        let totalAmount = 0;
        const items = [];
        for (const item of cartItems) {
          if (!item.product || !item.variant) continue;
          const subtotal = item.product.price * item.quantity;
          totalAmount += subtotal;
          items.push({
            variantId: item.variantId,
            productName: item.product.name,
            slogan: item.product.slogan,
            size: item.variant.size,
            color: item.variant.color,
            quantity: item.quantity,
            pricePerUnit: item.product.price,
            subtotal,
          });
        }
        const orderNumber = `TP-${Date.now()}-${nanoid(6)}`;
        const order = await createOrder({
          userId,
          orderNumber,
          totalAmount: pi.amount,
          customerName: meta.customerName,
          customerEmail: meta.customerEmail,
          customerPhone: meta.customerPhone || null,
          shippingAddress: meta.shippingAddress,
          shippingCity: meta.shippingCity,
          shippingPostalCode: meta.shippingPostalCode,
          shippingCountry: meta.shippingCountry,
          billingAddress: meta.billingAddress || null,
          billingCity: meta.billingCity || null,
          billingPostalCode: meta.billingPostalCode || null,
          billingCountry: meta.billingCountry || null,
          notes: meta.notes || null,
        });
        await addOrderItems(items.map(i => ({ orderId: order.id, ...i })));
        await clearCart(userId);
        console.log(`✅ Commande ${orderNumber} créée`);
      }
    }
    res.json({ received: true });
  }
);
```

---

## ÉTAPE 8 — Tester avec les cartes de test Stripe

| Carte | Résultat |
|---|---|
| `4242 4242 4242 4242` | Paiement accepté ✅ |
| `4000 0000 0000 3220` | 3D Secure requis |
| `4000 0000 0000 9995` | Paiement refusé ❌ |
| Date : n'importe quelle date future | CVC : 3 chiffres quelconques |

---

## RÉSUMÉ DU FLUX

```
Client remplit adresse → 
  tRPC createPaymentIntent → 
    Stripe crée PaymentIntent (clientSecret) →
      Stripe Elements affiche le formulaire carte →
        Client entre sa carte → 
          Stripe confirme le paiement →
            Webhook payment_intent.succeeded →
              Commande créée en DB → 
                Panier vidé →
                  Client redirigé vers /order-confirmation/success
```

---

## PRIX RÉCAPITULATIF

- Frais Stripe : **1,5 % + 0,25 €** par transaction (cartes EU)
- Sur 29 € : **0,69 €** de frais
- Aucun abonnement mensuel
- Virements vers ton compte bancaire : automatiques (quotidien ou hebdomadaire)
