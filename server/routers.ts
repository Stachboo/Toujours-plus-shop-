import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { registerUser, loginUser, createSessionToken } from "./auth";
import {
  getAllCategories,
  getCategoryBySlug,
  getAllProducts,
  getProductById,
  getProductsWithVariants,
  getVariantsByProductId,
  getVariantById,
  getCartItems,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  getOrderById,
  getOrdersByUserId,
  getAllOrders,
  updateOrderStatus,
  getOrderItems,
} from "./db";
import { getStripe } from "./stripe";

// ============================================================================
// VALIDATION SCHEMAS (Security: Input validation)
// ============================================================================

const AddToCartSchema = z.object({
  variantId: z.number().int().positive("Variant ID must be positive"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(100, "Quantity cannot exceed 100"),
});

const UpdateCartSchema = z.object({
  cartItemId: z.number().int().positive(),
  quantity: z.number().int().min(0, "Quantity must be non-negative").max(100, "Quantity cannot exceed 100"),
});

const CheckoutSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters").max(255),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().optional(),
  shippingAddress: z.string().min(5, "Address must be at least 5 characters").max(500),
  shippingCity: z.string().min(2, "City must be at least 2 characters").max(100),
  shippingPostalCode: z.string().min(2, "Postal code must be at least 2 characters").max(20),
  shippingCountry: z.string().min(2, "Country must be at least 2 characters").max(100),
  billingAddress: z.string().optional(),
  billingCity: z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingCountry: z.string().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// ROUTERS
// ============================================================================

export const appRouter = router({
  // ========================================================================
  // HEALTH CHECK
  // ========================================================================
  health: router({
    check: publicProcedure.query(() => ({ ok: true, timestamp: Date.now() })),
  }),

  // ========================================================================
  // AUTH ROUTER
  // ========================================================================
  auth: router({
    me: publicProcedure.query((opts) => {
      if (!opts.ctx.user) return null;
      const { passwordHash, googleId, ...safeUser } = opts.ctx.user;
      return safeUser;
    }),

    register: publicProcedure
      .input(z.object({
        name: z.string().min(2, "Le nom doit faire au moins 2 caractères").max(100),
        email: z.string().email("Email invalide"),
        password: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères").max(128),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const user = await registerUser(input);
          const token = await createSessionToken(user);
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
          const { passwordHash, googleId, ...safeUser } = user;
          return { success: true, user: safeUser };
        } catch (error: any) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email("Email invalide"),
        password: z.string().min(1, "Mot de passe requis"),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const user = await loginUser(input);
          const token = await createSessionToken(user);
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
          const { passwordHash, googleId, ...safeUser } = user;
          return { success: true, user: safeUser };
        } catch (error: any) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: error.message });
        }
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ========================================================================
  // STRIPE ROUTER (Protected: Payment flow)
  // ========================================================================
  stripe: router({
    createPaymentIntent: protectedProcedure
      .input(CheckoutSchema)
      .mutation(async ({ ctx, input }) => {
        const userCartItems = await getCartItems(ctx.user.id);

        if (userCartItems.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Le panier est vide" });
        }

        // Server-side total calculation (authoritative)
        let subtotal = 0;
        for (const cartItem of userCartItems) {
          if (!cartItem.variant || !cartItem.product) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Article du panier invalide" });
          }

          // Re-verify stock
          const freshVariant = await getVariantById(cartItem.variantId);
          if (!freshVariant || freshVariant.stock < cartItem.quantity) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `${cartItem.product.slogan} n'est plus disponible en quantité suffisante`,
            });
          }

          subtotal += cartItem.product.price * cartItem.quantity;
        }

        // Server-side shipping calculation
        const shipping = subtotal >= 5000 ? 0 : 500;
        const totalAmount = subtotal + shipping;

        // Fraud prevention
        const MAX_ORDER_AMOUNT = 100000 * 100; // 100,000€ in cents
        if (totalAmount > MAX_ORDER_AMOUNT) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Montant maximum dépassé" });
        }

        const stripe = getStripe();
        const paymentIntent = await stripe.paymentIntents.create({
          amount: totalAmount,
          currency: "eur",
          metadata: {
            userId: String(ctx.user.id),
            customerName: input.customerName,
            customerEmail: input.customerEmail,
            customerPhone: input.customerPhone || "",
            shippingAddress: input.shippingAddress,
            shippingCity: input.shippingCity,
            shippingPostalCode: input.shippingPostalCode,
            shippingCountry: input.shippingCountry,
            billingAddress: input.billingAddress || "",
            billingCity: input.billingCity || "",
            billingPostalCode: input.billingPostalCode || "",
            billingCountry: input.billingCountry || "",
            notes: input.notes || "",
          },
        });

        return {
          clientSecret: paymentIntent.client_secret!,
          totalAmount,
        };
      }),
  }),

  // ========================================================================
  // CATEGORY ROUTER
  // ========================================================================
  categories: router({
    list: publicProcedure.query(async () => {
      return getAllCategories();
    }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return getCategoryBySlug(input.slug);
      }),
  }),

  // ========================================================================
  // PRODUCTS ROUTER
  // ========================================================================
  products: router({
    list: publicProcedure
      .input(
        z.object({
          categoryId: z.number().optional(),
          search: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        return getAllProducts({
          categoryId: input.categoryId,
          search: input.search,
        });
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input }) => {
        const product = await getProductById(input.id);
        if (!product) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        }

        // Fetch variants for this product
        const variants = await getVariantsByProductId(product.id);
        return { ...product, variants };
      }),

    listWithVariants: publicProcedure
      .input(z.object({ categoryId: z.number().optional() }))
      .query(async ({ input }) => {
        return getProductsWithVariants(input.categoryId);
      }),
  }),

  // ========================================================================
  // CART ROUTER (Protected: Requires authentication)
  // ========================================================================
  cart: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getCartItems(ctx.user.id);
    }),

    add: protectedProcedure
      .input(AddToCartSchema)
      .mutation(async ({ ctx, input }) => {
        // Security: Verify variant exists
        const variant = await getVariantById(input.variantId);
        if (!variant) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Product variant not found" });
        }

        // Security: Check stock availability
        if (variant.stock < input.quantity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Only ${variant.stock} items available in stock`,
          });
        }

        return addToCart(ctx.user.id, input.variantId, input.quantity);
      }),

    update: protectedProcedure
      .input(UpdateCartSchema)
      .mutation(async ({ ctx, input }) => {
        // Security: Verify cart item belongs to current user
        const cartItems = await getCartItems(ctx.user.id);
        const item = cartItems.find((ci) => ci.id === input.cartItemId);

        if (!item) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Cart item not found or does not belong to you",
          });
        }

        // Security: Check stock availability if increasing quantity
        if (input.quantity > item.quantity) {
          const variant = await getVariantById(item.variantId);
          if (variant && variant.stock < input.quantity) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Only ${variant.stock} items available in stock`,
            });
          }
        }

        await updateCartItemQuantity(input.cartItemId, input.quantity);
        return { success: true };
      }),

    remove: protectedProcedure
      .input(z.object({ cartItemId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        // Security: Verify cart item belongs to current user
        const cartItems = await getCartItems(ctx.user.id);
        const item = cartItems.find((ci) => ci.id === input.cartItemId);

        if (!item) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Cart item not found or does not belong to you",
          });
        }

        await removeFromCart(input.cartItemId);
        return { success: true };
      }),

    clear: protectedProcedure.mutation(async ({ ctx }) => {
      await clearCart(ctx.user.id);
      return { success: true };
    }),
  }),

  // ========================================================================
  // ORDERS ROUTER (Protected: Requires authentication)
  // ========================================================================
  orders: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getOrdersByUserId(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const order = await getOrderById(input.id);

        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }

        // Security: Verify order belongs to current user (unless admin)
        if (order.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to view this order",
          });
        }

        const items = await getOrderItems(order.id);
        return { ...order, items };
      }),

  }),

  // ========================================================================
  // ADMIN ROUTER (Protected: Admin only)
  // ========================================================================
  admin: router({
    orders: router({
      list: adminProcedure
        .input(z.object({
          limit: z.number().int().min(1).max(100).default(50),
          offset: z.number().int().min(0).default(0),
        }).optional())
        .query(async ({ input }) => {
          return getAllOrders(input);
        }),

      updateStatus: adminProcedure
        .input(
          z.object({
            orderId: z.number().int().positive(),
            status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
          })
        )
        .mutation(async ({ input }) => {
          const order = await getOrderById(input.orderId);
          if (!order) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
          }

          await updateOrderStatus(input.orderId, input.status);
          return { success: true };
        }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
