import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { categories, products, productVariants } from "../drizzle/schema";

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL manquant");
  }

  const db = drizzle(process.env.DATABASE_URL);

  console.log("🌱 Seed — Insertion des catégories...");

  const categoryData = [
    { name: "T-Shirts", slug: "t-shirts", description: "T-shirts premium en coton lourd, parfaits pour exprimer son côté Toujours +" },
    { name: "Sweats", slug: "sweats", description: "Sweats et hoodies confortables pour les jours Toujours + Fauché" },
    { name: "Accessoires", slug: "accessoires", description: "Casquettes, tote bags et plus pour compléter le look" },
  ];

  for (const cat of categoryData) {
    await db.insert(categories).values(cat).onDuplicateKeyUpdate({ set: { description: cat.description } });
  }

  // Fetch inserted categories to get IDs
  const allCats = await db.select().from(categories);
  const catMap = new Map(allCats.map(c => [c.slug, c.id]));

  console.log("🌱 Seed — Insertion des produits Phase 1...");

  const slogans = [
    { key: "con", slogan: "Toujours + Con", description: "L'assumer avec fierté. Le classique incontournable de la collection." },
    { key: "en-retard", slogan: "Toujours + En retard", description: "Pour ceux qui n'ont aucune notion du temps. Et qui l'assument." },
    { key: "fauche", slogan: "Toujours + Fauché", description: "Mais toujours avec du style. Le paradoxe de notre génération." },
    { key: "bavard", slogan: "Toujours + Bavard", description: "Impossible de l'arrêter. Et pourquoi le ferait-on ?" },
    { key: "soif", slogan: "Toujours + Soif", description: "Le roi de l'apéro. Toujours prêt pour un verre." },
  ];

  const tshirtSizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const tshirtColors = ["Noir", "Blanc", "Gris Clair", "Gris Foncé", "Orange"];
  const sweatSizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const sweatColors = ["Noir", "Gris Clair", "Gris Foncé", "Orange"];

  const tshirtCatId = catMap.get("t-shirts")!;
  const sweatCatId = catMap.get("sweats")!;
  const accessoiresCatId = catMap.get("accessoires")!;

  for (const s of slogans) {
    // T-shirt
    const tshirtResult = await db.insert(products).values({
      categoryId: tshirtCatId,
      name: `T-Shirt ${s.slogan}`,
      slogan: s.slogan,
      description: s.description,
      price: 2999,
      isActive: 1,
    });
    const tshirtId = (tshirtResult as any)[0].insertId as number;

    const tshirtVariants = [];
    for (const size of tshirtSizes) {
      for (const color of tshirtColors) {
        const colorCode = color.replace(/\s+/g, "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        tshirtVariants.push({
          productId: tshirtId,
          size,
          color,
          stock: 50,
          sku: `TS-${s.key.toUpperCase()}-${colorCode}-${size}`,
        });
      }
    }
    await db.insert(productVariants).values(tshirtVariants);

    // Sweat
    const sweatResult = await db.insert(products).values({
      categoryId: sweatCatId,
      name: `Sweat ${s.slogan}`,
      slogan: s.slogan,
      description: s.description,
      price: 4999,
      isActive: 1,
    });
    const sweatId = (sweatResult as any)[0].insertId as number;

    const sweatVariants = [];
    for (const size of sweatSizes) {
      for (const color of sweatColors) {
        const colorCode = color.replace(/\s+/g, "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        sweatVariants.push({
          productId: sweatId,
          size,
          color,
          stock: 30,
          sku: `SW-${s.key.toUpperCase()}-${colorCode}-${size}`,
        });
      }
    }
    await db.insert(productVariants).values(sweatVariants);

    console.log(`  ✅ ${s.slogan} — T-shirt + Sweat`);
  }

  // Accessoires
  console.log("🌱 Seed — Insertion des accessoires...");

  const casquetteResult = await db.insert(products).values({
    categoryId: accessoiresCatId,
    name: "Casquette Toujours +",
    slogan: "Toujours +",
    description: "Casquette brodée avec le logo Toujours +. Taille unique ajustable.",
    price: 1999,
    isActive: 1,
  });
  const casquetteId = (casquetteResult as any)[0].insertId as number;

  await db.insert(productVariants).values([
    { productId: casquetteId, size: "One Size", color: "Noir", stock: 100, sku: "ACC-CASQ-NOIR" },
    { productId: casquetteId, size: "One Size", color: "Blanc", stock: 80, sku: "ACC-CASQ-BLANC" },
    { productId: casquetteId, size: "One Size", color: "Orange", stock: 60, sku: "ACC-CASQ-ORANGE" },
  ]);

  const toteBagResult = await db.insert(products).values({
    categoryId: accessoiresCatId,
    name: "Tote Bag Toujours +",
    slogan: "Toujours +",
    description: "Tote bag en coton bio avec le logo Toujours +. Parfait pour le quotidien.",
    price: 1499,
    isActive: 1,
  });
  const toteBagId = (toteBagResult as any)[0].insertId as number;

  await db.insert(productVariants).values([
    { productId: toteBagId, size: "One Size", color: "Noir", stock: 120, sku: "ACC-TOTE-NOIR" },
    { productId: toteBagId, size: "One Size", color: "Blanc", stock: 100, sku: "ACC-TOTE-BLANC" },
  ]);

  console.log("  ✅ Casquette + Tote Bag");
  console.log("\n✨ Seed terminé ! 12 produits, ~280 variants insérés.");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Erreur seed:", err);
  process.exit(1);
});
