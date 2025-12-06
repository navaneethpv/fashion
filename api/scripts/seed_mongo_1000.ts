import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { faker } from '@faker-js/faker';
import slugify from 'slugify';
import { Product } from '../src/models/Product';

dotenv.config();

// --- CONFIG ---
const TOTAL_PRODUCTS = 1000;
const BATCH_SIZE = 50;

// --- MOCK DATA HELPERS ---

// Pre-defined color palette to simulate extraction results
// (We map these to specific RGBs so our math works for testing)
const COLOR_PALETTE = [
  { name: 'Red', hex: '#FF0000', r: 255, g: 0, b: 0 },
  { name: 'Blue', hex: '#0000FF', r: 0, g: 0, b: 255 },
  { name: 'Green', hex: '#008000', r: 0, g: 128, b: 0 },
  { name: 'Black', hex: '#000000', r: 0, g: 0, b: 0 },
  { name: 'White', hex: '#FFFFFF', r: 255, g: 255, b: 255 },
  { name: 'Purple', hex: '#800080', r: 128, g: 0, b: 128 },
  { name: 'Pink', hex: '#FFC0CB', r: 255, g: 192, b: 203 },
  { name: 'Yellow', hex: '#FFFF00', r: 255, g: 255, b: 0 },
  { name: 'Orange', hex: '#FFA500', r: 255, g: 165, b: 0 },
  { name: 'Grey', hex: '#808080', r: 128, g: 128, b: 128 },
];

const CATEGORIES = ['T-Shirts', 'Jeans', 'Dresses', 'Jackets', 'Sneakers', 'Accessories'];
const BRANDS = ['Nike', 'Adidas', 'Puma', 'Zara', 'H&M', 'Uniqlo', 'Eyoris Originals'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const generateVariants = (colorName: string) => {
  return SIZES.map(size => ({
    size,
    color: colorName,
    sku: `${faker.string.alpha({ length: 3 }).toUpperCase()}-${size}-${colorName.toUpperCase()}`,
    stock: faker.number.int({ min: 0, max: 100 })
  }));
};

const seedDB = async () => {
  try {
    // 1. Connect
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing in .env');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🌱 Connected to MongoDB for seeding...');

    // 2. Clear existing data
    console.log('🧹 Clearing existing products...');
    await Product.deleteMany({});

    // 3. Generate and Insert
    console.log(`🚀 Starting generation of ${TOTAL_PRODUCTS} products...`);
    
    let productsBatch: any[] = [];
    
    for (let i = 0; i < TOTAL_PRODUCTS; i++) {
      const category = faker.helpers.arrayElement(CATEGORIES);
      const brand = faker.helpers.arrayElement(BRANDS);
      const name = `${brand} ${faker.commerce.productAdjective()} ${category.slice(0, -1)}`; // e.g. "Nike Modern T-Shirt"
      
      // Create Slug
      let slug = slugify(`${name}-${faker.string.alphanumeric(6)}`, { lower: true });

      // Price Logic
      const price = Number(faker.commerce.price({ min: 20, max: 200 }));
      const price_cents = price * 100;
      const hasDiscount = faker.datatype.boolean();
      const price_before_cents = hasDiscount ? Math.floor(price_cents * 1.3) : undefined;
      const offer_tag = hasDiscount ? `Flat ${Math.floor(Math.random() * 30 + 10)}% Off` : undefined;

      // Image & Color Logic
      // We pick a random color from our palette to simulate "Dominant Color Extraction"
      const colorData = faker.helpers.arrayElement(COLOR_PALETTE);
      
      const product = {
        name,
        slug,
        brand,
        category,
        description: faker.commerce.productDescription(),
        price_cents,
        price_before_cents,
        offer_tag,
        images: [
          {
            // Using picsum with a seed ensures the image stays consistent but random per product
            url: `https://picsum.photos/seed/${slug}/800/800`, 
            dominant_color: colorData.hex,
            r: colorData.r,
            g: colorData.g,
            b: colorData.b
          }
        ],
        variants: generateVariants(colorData.name),
        tags: [category.toLowerCase(), colorData.name.toLowerCase(), 'casual', 'streetwear', faker.word.adjective()],
        rating: faker.number.float({ min: 3, max: 5, fractionDigits: 1 }),
        reviews_count: faker.number.int({ min: 0, max: 500 }),
        is_published: true
      };

      productsBatch.push(product);

      // Batch Insert
      if (productsBatch.length === BATCH_SIZE) {
        await Product.insertMany(productsBatch);
        productsBatch = [];
        process.stdout.write(`.`); // Progress indicator
      }
    }

    // Insert remaining
    if (productsBatch.length > 0) {
      await Product.insertMany(productsBatch);
    }

    console.log(`\n✅ Successfully seeded ${TOTAL_PRODUCTS} products!`);
    process.exit();
  } catch (error) {
    console.error('\n🔴 Seeding Error:', error);
    process.exit(1);
  }
};

seedDB();