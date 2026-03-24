# ToujoursShop — Guide pour Claude Code

## Stack technique
- **Frontend** : React + TypeScript + Vite + Tailwind + shadcn/ui + Wouter
- **Backend** : Node.js + tRPC + Drizzle ORM
- **Base de données** : MySQL sur TiDB Cloud
- **Frontend hosting** : Vercel
- **Backend hosting** : Railway / Render
- **Auth** : Email/password + Google OAuth

## Structure du projet
```
/
├── client/          → Frontend React
│   └── src/
│       ├── pages/   → Home, Products, ProductDetail, Cart, Checkout, OrderConfirmation, AdminDashboard
│       ├── components/
│       └── _core/hooks/useAuth.ts
├── server/          → Backend Node.js
│   ├── routers.ts   → Toutes les routes tRPC (API)
│   ├── db.ts        → Toutes les requêtes base de données
│   ├── stripe.ts    → Client Stripe (NOUVEAU)
│   └── stripeWebhook.ts → Handler webhook Stripe (NOUVEAU)
├── drizzle/
│   └── schema.ts    → Schéma complet de la base de données
└── INSTRUCTIONS_STRIPE.md → Guide d'intégration Stripe
```

## Variables d'environnement nécessaires

### Backend
```
DATABASE_URL=mysql://user:password@host:4000/database?ssl={"rejectUnauthorized":true}
JWT_SECRET=your-secret-min-32-chars
ADMIN_EMAIL=admin@example.com
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://your-app.vercel.app
PORT=3000
```

### Frontend (prefixees VITE_)
```
VITE_API_URL=https://your-backend.railway.app
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

## Ce qui reste à faire (priorité ordre)
1. **Intégrer Stripe dans routers.ts** → ajouter le router stripe (voir INSTRUCTIONS_STRIPE.md)
2. **Ajouter le webhook dans server/_core/index.ts** → voir INSTRUCTIONS_STRIPE.md étape 7
3. **Insérer les 9 produits en base** → script SQL dans INSTRUCTIONS_STRIPE.md
4. **Héberger les images produits** → uploader les JPG Kimi sur un CDN (Cloudflare R2 ou similaire)
5. **Tester le paiement** → cartes de test Stripe dans INSTRUCTIONS_STRIPE.md

## Base de données — tables existantes
- users, categories, products, productVariants, cartItems, orders, orderItems
- **La DB est vide** : 0 catégories, 0 produits insérés pour l'instant

## Sécurité en place
- Validation Zod sur tous les inputs
- Vérification appartenance panier à l'utilisateur
- Stock re-vérifié au checkout (anti race condition)
- Plafond anti-fraude 100 000€
- RBAC admin/user
- Webhook Stripe vérifié par signature HMAC

## Commandes utiles
```bash
npm install              # Installer les dépendances
npm run dev              # Lancer en développement
npm run build            # Builder pour production
```
