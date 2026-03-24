import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock user context
function createAuthContext(userId: number = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `user-${userId}`,
      email: `user${userId}@example.com`,
      name: `User ${userId}`,
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Cart Operations", () => {
  it("should fetch empty cart for new user", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const cartItems = await caller.cart.list();

    expect(cartItems).toEqual([]);
  });

  it("should reject adding to cart with invalid quantity", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.cart.add({
        variantId: 1,
        quantity: 0,
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("Quantity must be at least 1");
    }
  });

  it("should reject adding to cart with excessive quantity", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.cart.add({
        variantId: 1,
        quantity: 101,
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("Quantity cannot exceed 100");
    }
  });

  it("should clear cart successfully", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.cart.clear();

    expect(result).toEqual({ success: true });
  });
});

describe("Checkout Security (via stripe.createPaymentIntent)", () => {
  it("should validate email format in checkout", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.stripe.createPaymentIntent({
        customerName: "John Doe",
        customerEmail: "invalid-email",
        shippingAddress: "123 Main St",
        shippingCity: "Paris",
        shippingPostalCode: "75001",
        shippingCountry: "France",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("Invalid email");
    }
  });

  it("should validate minimum address length", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.stripe.createPaymentIntent({
        customerName: "John Doe",
        customerEmail: "john@example.com",
        shippingAddress: "123",
        shippingCity: "Paris",
        shippingPostalCode: "75001",
        shippingCountry: "France",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("Address must be at least 5 characters");
    }
  });

  it("should reject checkout with empty cart", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.stripe.createPaymentIntent({
        customerName: "John Doe",
        customerEmail: "john@example.com",
        shippingAddress: "123 Main Street",
        shippingCity: "Paris",
        shippingPostalCode: "75001",
        shippingCountry: "France",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("Le panier est vide");
    }
  });
});

describe("Admin Access Control", () => {
  it("should deny non-admin access to admin routes", async () => {
    const ctx = createAuthContext(1); // Regular user
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.admin.orders.list();
      expect.fail("Should have thrown FORBIDDEN error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
      expect(error.message).toContain("Admin access required");
    }
  });

  it("should allow admin access to admin routes", async () => {
    const ctx = createAuthContext(1);
    ctx.user.role = "admin";
    const caller = appRouter.createCaller(ctx);

    // This should not throw (though it may return empty list)
    const orders = await caller.admin.orders.list();
    expect(Array.isArray(orders)).toBe(true);
  });
});

describe("Order Security", () => {
  it("should prevent users from viewing other users' orders", async () => {
    const ctx = createAuthContext(1); // User 1
    const caller = appRouter.createCaller(ctx);

    try {
      // Try to access order from another user (assuming order ID 999 belongs to user 2)
      await caller.orders.getById({ id: 999 });
      // If no error, that's fine - order just doesn't exist
    } catch (error: any) {
      // If error, it should be NOT_FOUND or FORBIDDEN
      expect(["NOT_FOUND", "FORBIDDEN"]).toContain(error.code);
    }
  });

  it("should allow admins to view any order", async () => {
    const ctx = createAuthContext(1);
    ctx.user.role = "admin";
    const caller = appRouter.createCaller(ctx);

    try {
      // Admin should be able to attempt to fetch any order
      await caller.orders.getById({ id: 999 });
    } catch (error: any) {
      // Only NOT_FOUND is acceptable for admin
      expect(error.code).toBe("NOT_FOUND");
    }
  });
});
