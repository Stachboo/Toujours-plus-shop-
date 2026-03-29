import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatePath = path.join(__dirname, 'mockup-template.html');
const outputDir = path.join(__dirname, '..', 'client', 'public', 'products');

const products = [
  { slug: 'tshirt-en-retard', slogan: 'En retard', type: 'tshirt', price: '29,99' },
  { slug: 'tshirt-fatigue', slogan: 'Fatigué', type: 'tshirt', price: '29,99' },
  { slug: 'tshirt-raison', slogan: 'Raison', type: 'tshirt', price: '34,99' },
  { slug: 'tshirt-de-cafe', slogan: 'De café', type: 'tshirt', price: '29,99' },
  { slug: 'tshirt-cool', slogan: 'Cool', type: 'tshirt', price: '34,99' },
  { slug: 'tshirt-honnete', slogan: 'Honnête', type: 'tshirt', price: '39,99' },
  { slug: 'sweat-confort', slogan: 'Confort', type: 'sweat', price: '59,99' },
  { slug: 'sweat-flemmard', slogan: 'Flemmard', type: 'sweat', price: '64,99' },
  { slug: 'sweat-style', slogan: 'Stylé', type: 'sweat', price: '79,99' },
];

async function main() {
  console.log('🎨 Lancement de la génération des mockups...\n');

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 800, height: 800 },
    deviceScaleFactor: 2, // Retina quality
  });

  const page = await context.newPage();

  for (const product of products) {
    const params = new URLSearchParams({
      slogan: product.slogan,
      type: product.type,
      price: product.price,
    });

    const url = `file:///${templatePath.replace(/\\/g, '/')}?${params.toString()}`;
    await page.goto(url, { waitUntil: 'networkidle' });

    // Wait for fonts to load
    await page.waitForTimeout(1500);

    const outputPath = path.join(outputDir, `${product.slug}.png`);
    await page.screenshot({ path: outputPath, type: 'png' });

    console.log(`  ✅ ${product.slug}.png`);
  }

  await browser.close();
  console.log(`\n✨ ${products.length} mockups générés dans client/public/products/`);
}

main().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
