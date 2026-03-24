import { Request, Response } from "express";
import Stripe from "stripe";
import { eq, sql } from "drizzle-orm";
import { getStripe } from "./stripe";
import { getDb } from "./db";
import { cartItems, orders, orderItems, productVariants, products } from "../drizzle/schema";
import { nanoid } from "nanoid";

export async function stripeWebhookHandler(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET manquant");
    return res.status(500).send("Configuration manquante");
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature invalide:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const meta = pi.metadata;
    const userId = parseInt(meta.userId);

    if (!userId || isNaN(userId)) {
      console.error("[Stripe Webhook] userId invalide dans metadata:", meta.userId);
      return res.status(400).json({ error: "userId invalide" });
    }

    const db = await getDb();
    if (!db) {
      console.error("[Stripe Webhook] Base de données non disponible");
      return res.status(500).json({ error: "DB unavailable" });
    }

    try {
      await db.transaction(async (tx) => {
        // Idempotence: check if order already exists for this PaymentIntent
        const existingOrder = await tx
          .select({ id: orders.id })
          .from(orders)
          .where(eq(orders.stripePaymentIntentId, pi.id))
          .limit(1);

        if (existingOrder.length > 0) {
          console.log(`[Stripe Webhook] Commande déjà existante pour PI ${pi.id}, skip`);
          return;
        }

        // Fetch cart items within transaction
        const userCartItems = await tx
          .select()
          .from(cartItems)
          .where(eq(cartItems.userId, userId));

        if (userCartItems.length === 0) {
          console.warn(`[Stripe Webhook] Panier vide pour userId=${userId}, PI=${pi.id}`);
          return;
        }

        // Enrich cart items with variant + product data
        const enrichedItems = [];
        for (const item of userCartItems) {
          const [variant] = await tx
            .select()
            .from(productVariants)
            .where(eq(productVariants.id, item.variantId))
            .limit(1);

          if (!variant) continue;

          const [product] = await tx
            .select()
            .from(products)
            .where(eq(products.id, variant.productId))
            .limit(1);

          if (!product) continue;

          enrichedItems.push({ ...item, variant, product });
        }

        // Verify stock AND decrement atomically
        for (const item of enrichedItems) {
          if (item.variant.stock < item.quantity) {
            throw new Error(
              `Stock insuffisant pour ${item.product.slogan} (${item.variant.size}/${item.variant.color}): demandé ${item.quantity}, dispo ${item.variant.stock}`
            );
          }

          await tx
            .update(productVariants)
            .set({ stock: sql`${productVariants.stock} - ${item.quantity}` })
            .where(eq(productVariants.id, item.variant.id));
        }

        // Build order items data
        const orderItemsData = enrichedItems.map((item) => ({
          variantId: item.variantId,
          productName: item.product.name,
          slogan: item.product.slogan,
          size: item.variant.size,
          color: item.variant.color,
          quantity: item.quantity,
          pricePerUnit: item.product.price,
          subtotal: item.product.price * item.quantity,
        }));

        // Create order
        const orderNumber = `TP-${Date.now()}-${nanoid(6)}`;
        const orderResult = await tx.insert(orders).values({
          userId,
          orderNumber,
          stripePaymentIntentId: pi.id,
          totalAmount: pi.amount,
          status: "processing",
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

        const newOrderId = (orderResult as any)[0].insertId as number;

        // Add order items
        await tx.insert(orderItems).values(
          orderItemsData.map((item) => ({ orderId: newOrderId, ...item }))
        );

        // Clear cart
        await tx.delete(cartItems).where(eq(cartItems.userId, userId));

        console.log(
          `✅ Commande ${orderNumber} créée — ${(pi.amount / 100).toFixed(2)}€ — PI: ${pi.id}`
        );
      });
    } catch (err) {
      console.error("[Stripe Webhook] Erreur transaction:", err);
      return res.status(500).json({ error: "Erreur interne lors de la création de commande" });
    }
  }

  res.json({ received: true });
}
