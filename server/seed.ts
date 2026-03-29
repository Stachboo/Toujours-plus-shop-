import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { categories, products, productVariants, cartItems, orders, orderItems } from "../drizzle/schema";

function randomStock(): number {
  return Math.floor(Math.random() * (40 - 15 + 1)) + 15;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL manquant");
  }

  const db = drizzle(process.env.DATABASE_URL);

  // ── 1. Clear existing data in FK order ─────────────────────────────
  console.log("🗑️  Nettoyage des tables existantes...");
  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(cartItems);
  await db.delete(productVariants);
  await db.delete(products);
  await db.delete(categories);
  console.log("  ✅ Tables vidées");

  // ── 2. Insert categories ───────────────────────────────────────────
  console.log("🌱 Insertion des catégories...");

  const categoryData = [
    { name: "T-shirts", slug: "t-shirts", description: "T-shirts premium en coton lourd 220g, coupe unisexe. Parfaits pour afficher ton slogan Toujours +." },
    { name: "Sweats", slug: "sweats", description: "Sweats confortables en molleton bio. Le confort Toujours + pour les journées canapé comme les sorties stylées." },
  ];

  for (const cat of categoryData) {
    await db.insert(categories).values(cat);
  }

  const allCats = await db.select().from(categories);
  const catMap = new Map(allCats.map(c => [c.slug, c.id]));

  const tshirtCatId = catMap.get("t-shirts")!;
  const sweatCatId = catMap.get("sweats")!;

  console.log("  ✅ 2 catégories insérées");

  // ── 3. Product definitions ─────────────────────────────────────────
  const tshirts = [
    {
      name: "T-Shirt En Retard",
      slogan: "En retard",
      description: "Le classique. Pour ceux qui transforment chaque rendez-vous en surprise.",
      price: 2999,
      colors: ["Noir", "Blanc", "Bordeaux"],
      image: "/products/tshirt-en-retard.png",
    },
    {
      name: "T-Shirt Fatigué",
      slogan: "Fatigué",
      description: "Parce que dormir c'est bien mais vivre c'est mieux.",
      price: 2999,
      colors: ["Noir", "Gris Chiné"],
      image: "/products/tshirt-fatigue.png",
    },
    {
      name: "T-Shirt Raison",
      slogan: "Raison",
      description: "Tu le sais, ils le savent, tout le monde le sait.",
      price: 3499,
      colors: ["Blanc", "Navy"],
      image: "/products/tshirt-raison.png",
    },
    {
      name: "T-Shirt De Café",
      slogan: "De café",
      description: "La perfusion matinale version textile.",
      price: 2999,
      colors: ["Noir", "Marron"],
      image: "/products/tshirt-de-cafe.png",
    },
    {
      name: "T-Shirt Cool",
      slogan: "Cool",
      description: "L'humilité n'est pas ton fort, et c'est tant mieux.",
      price: 3499,
      colors: ["Noir", "Blanc", "Vert Sapin"],
      image: "/products/tshirt-cool.png",
    },
    {
      name: "T-Shirt Honnête",
      slogan: "Honnête",
      description: "La vérité sort de ta garde-robe.",
      price: 3999,
      colors: ["Blanc", "Noir"],
      image: "/products/tshirt-honnete.png",
    },
  ];

  const sweats = [
    {
      name: "Sweat Confort",
      slogan: "Confort",
      description: "Le sweat qui te donne une excuse pour ne rien faire.",
      price: 5999,
      colors: ["Noir", "Gris Chiné", "Cream"],
      image: "/products/sweat-confort.png",
    },
    {
      name: "Sweat Flemmard",
      slogan: "Flemmard",
      description: "Champion du monde catégorie canapé.",
      price: 6499,
      colors: ["Noir", "Beige"],
      image: "/products/sweat-flemmard.png",
    },
    {
      name: "Sweat Stylé",
      slogan: "Stylé",
      description: "Le sweat premium pour ceux qui assument leur supériorité vestimentaire.",
      price: 7999,
      colors: ["Noir", "Blanc", "Bordeaux"],
      image: "/products/sweat-style.png",
    },
  ];

  const sizes = ["S", "M", "L", "XL"];

  // ── 4. Insert T-shirts ─────────────────────────────────────────────
  console.log("🌱 Insertion des T-shirts...");

  for (const t of tshirts) {
    const result = await db.insert(products).values({
      categoryId: tshirtCatId,
      name: t.name,
      slogan: t.slogan,
      description: t.description,
      price: t.price,
      imageUrl: t.image,
      isActive: 1,
    });
    const productId = (result as any)[0].insertId as number;

    const variants = [];
    for (const color of t.colors) {
      const colorCode = slugify(color).toUpperCase();
      for (const size of sizes) {
        variants.push({
          productId,
          size,
          color,
          stock: randomStock(),
          sku: `TS-${slugify(t.slogan).toUpperCase()}-${colorCode}-${size}`,
        });
      }
    }
    await db.insert(productVariants).values(variants);

    console.log(`  ✅ ${t.name} — ${t.colors.length} couleurs x ${sizes.length} tailles = ${variants.length} variants`);
  }

  // ── 5. Insert Sweats ───────────────────────────────────────────────
  console.log("🌱 Insertion des Sweats...");

  for (const s of sweats) {
    const result = await db.insert(products).values({
      categoryId: sweatCatId,
      name: s.name,
      slogan: s.slogan,
      description: s.description,
      price: s.price,
      imageUrl: s.image,
      isActive: 1,
    });
    const productId = (result as any)[0].insertId as number;

    const variants = [];
    for (const color of s.colors) {
      const colorCode = slugify(color).toUpperCase();
      for (const size of sizes) {
        variants.push({
          productId,
          size,
          color,
          stock: randomStock(),
          sku: `SW-${slugify(s.slogan).toUpperCase()}-${colorCode}-${size}`,
        });
      }
    }
    await db.insert(productVariants).values(variants);

    console.log(`  ✅ ${s.name} — ${s.colors.length} couleurs x ${sizes.length} tailles = ${variants.length} variants`);
  }

  // ── Summary ────────────────────────────────────────────────────────
  const totalProducts = tshirts.length + sweats.length;
  const totalVariants =
    tshirts.reduce((sum, t) => sum + t.colors.length * sizes.length, 0) +
    sweats.reduce((sum, s) => sum + s.colors.length * sizes.length, 0);

  console.log(`\n✨ Seed terminé ! ${totalProducts} produits, ${totalVariants} variants insérés.`);

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Erreur seed:", err);
  process.exit(1);
});
