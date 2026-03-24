import { eq, and, gte, lte, like, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  categories, 
  products, 
  productVariants, 
  cartItems, 
  orders, 
  orderItems,
  type Category,
  type Product,
  type ProductVariant,
  type CartItem,
  type Order,
  type OrderItem,
} from "../drizzle/schema";
import { ENV } from './_core/env';

function escapeLikeWildcards(input: string): string {
  return input.replace(/[%_\\]/g, "\\$&");
}

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USER QUERIES
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// CATEGORY QUERIES
// ============================================================================

export async function getAllCategories(): Promise<Category[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories);
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// PRODUCT QUERIES
// ============================================================================

export async function getAllProducts(filters?: { categoryId?: number; search?: string }): Promise<Product[]> {
  const db = await getDb();
  if (!db) return [];

  let conditions = [eq(products.isActive, 1)];

  if (filters?.categoryId) {
    conditions.push(eq(products.categoryId, filters.categoryId));
  }

  if (filters?.search) {
    conditions.push(like(products.slogan, `%${escapeLikeWildcards(filters.search)}%`));
  }

  return db.select().from(products).where(and(...conditions));
}

export async function getProductById(id: number): Promise<Product | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProductsWithVariants(categoryId?: number) {
  const db = await getDb();
  if (!db) return [];

  let conditions = [eq(products.isActive, 1)];

  if (categoryId) {
    conditions.push(eq(products.categoryId, categoryId));
  }

  const prods = await db.select().from(products).where(and(...conditions));
  if (prods.length === 0) return [];

  // Batch query: fetch all variants for all products in one query
  const prodIds = prods.map(p => p.id);
  const allVariants = await db.select().from(productVariants).where(inArray(productVariants.productId, prodIds));

  // Group variants by productId
  const variantMap = new Map<number, ProductVariant[]>();
  for (const v of allVariants) {
    const list = variantMap.get(v.productId) || [];
    list.push(v);
    variantMap.set(v.productId, list);
  }

  return prods.map(p => ({ ...p, variants: variantMap.get(p.id) || [] }));
}

// ============================================================================
// PRODUCT VARIANT QUERIES
// ============================================================================

export async function getVariantsByProductId(productId: number): Promise<ProductVariant[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productVariants).where(eq(productVariants.productId, productId));
}

export async function getVariantById(id: number): Promise<ProductVariant | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(productVariants).where(eq(productVariants.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getVariantBySku(sku: string): Promise<ProductVariant | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(productVariants).where(eq(productVariants.sku, sku)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// CART QUERIES
// ============================================================================

export async function getCartItems(userId: number): Promise<(CartItem & { variant: ProductVariant | null; product: Product | null })[]> {
  const db = await getDb();
  if (!db) return [];

  const items = await db.select().from(cartItems).where(eq(cartItems.userId, userId));
  if (items.length === 0) return [];

  // Batch query: fetch all variants in one query
  const variantIds = Array.from(new Set(items.map(i => i.variantId)));
  const variants = await db.select().from(productVariants).where(inArray(productVariants.id, variantIds));
  const variantMap = new Map(variants.map(v => [v.id, v]));

  // Batch query: fetch all products in one query
  const productIds = Array.from(new Set(variants.map(v => v.productId)));
  const prods = productIds.length > 0
    ? await db.select().from(products).where(inArray(products.id, productIds))
    : [];
  const prodMap = new Map(prods.map(p => [p.id, p]));

  return items.map(item => {
    const variant = variantMap.get(item.variantId) || null;
    const product = variant ? prodMap.get(variant.productId) || null : null;
    return { ...item, variant, product };
  });
}

export async function addToCart(userId: number, variantId: number, quantity: number): Promise<CartItem> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if item already in cart
  const existing = await db.select().from(cartItems).where(
    and(eq(cartItems.userId, userId), eq(cartItems.variantId, variantId))
  ).limit(1);

  if (existing.length > 0) {
    // Update quantity
    await db.update(cartItems).set({ quantity: existing[0].quantity + quantity }).where(eq(cartItems.id, existing[0].id));
    return { ...existing[0], quantity: existing[0].quantity + quantity };
  } else {
    // Insert new item
    const result = await db.insert(cartItems).values({ userId, variantId, quantity });
    const newId = (result as any)[0]?.insertId ?? 0;
    return { id: newId as number, userId, variantId, quantity, addedAt: new Date(), updatedAt: new Date() };
  }
}

export async function updateCartItemQuantity(cartItemId: number, quantity: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (quantity <= 0) {
    await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
  } else {
    await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, cartItemId));
  }
}

export async function removeFromCart(cartItemId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
}

export async function clearCart(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
}

// ============================================================================
// ORDER QUERIES
// ============================================================================

export async function createOrder(order: {
  userId: number;
  orderNumber: string;
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  billingAddress?: string | null;
  billingCity?: string | null;
  billingPostalCode?: string | null;
  billingCountry?: string | null;
  notes?: string | null;
}): Promise<Order> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const normalizedOrder = {
    ...order,
    customerPhone: order.customerPhone ?? null,
    billingAddress: order.billingAddress ?? null,
    billingCity: order.billingCity ?? null,
    billingPostalCode: order.billingPostalCode ?? null,
    billingCountry: order.billingCountry ?? null,
    notes: order.notes ?? null,
  };

  const result = await db.insert(orders).values(normalizedOrder);
  const newId = (result as any)[0]?.insertId ?? 0;
  const now = new Date();
  return { 
    id: newId as number, 
    status: 'pending', 
    createdAt: now, 
    updatedAt: now, 
    ...normalizedOrder 
  } as Order;
}

export async function getOrderById(id: number): Promise<Order | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrdersByUserId(userId: number): Promise<Order[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.userId, userId));
}

export async function getAllOrders(options?: { limit?: number; offset?: number }): Promise<Order[]> {
  const db = await getDb();
  if (!db) return [];
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;
  return db.select().from(orders).limit(limit).offset(offset);
}

export async function updateOrderStatus(orderId: number, status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set({ status }).where(eq(orders.id, orderId));
}

// ============================================================================
// ORDER ITEM QUERIES
// ============================================================================

export async function addOrderItems(items: Array<{
  orderId: number;
  variantId: number;
  productName: string;
  slogan: string;
  size: string;
  color: string;
  quantity: number;
  pricePerUnit: number;
  subtotal: number;
}>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(orderItems).values(items);
}

export async function getOrderItems(orderId: number): Promise<OrderItem[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}
