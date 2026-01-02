
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
import slugify from "slugify";
import { connectDB } from "../src/config/db";
import { Product } from "../src/models/Product";

dotenv.config();

const DATASET_FILE = path.join(__dirname, "..", "dataset", "styles.csv");
const IMAGES_CSV = path.join(__dirname, "..", "dataset", "images.csv");
const BATCH_SIZE = 1000;

interface KaggleRow {
  id: string;
  gender: string;
  masterCategory: string;
  subCategory: string;
  articleType: string;
  baseColour: string;
  season: string;
  year: string;
  usage: string;
  productDisplayName: string;
}

// ---------------------------------------------------------
// Helpers: Deterministic "Random"
// ---------------------------------------------------------
// Simple hash function to generate a seed integer from a string ID
function getHash(str: string): number {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Returns a float between 0 and 1 based on the input seed
function deterministicRandom(seed: number): number {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// ---------------------------------------------------------
// Helpers: Normalization
// ---------------------------------------------------------
function normalizeGender(gender: string): string {
  const normalized = gender?.toLowerCase().trim();
  if (normalized === "men" || normalized === "man") return "Men";
  if (normalized === "women" || normalized === "woman") return "Women";
  if (normalized === "boys" || normalized === "girls" || normalized === "kids" || normalized === "children") return "Kids";
  return "Men"; // Default / fallback
}

function normalizeColor(color: string): string {
  const colorMap: Record<string, string> = {
    "Navy Blue": "#001f3f", "Blue": "#1e40af", "Black": "#000000", "White": "#ffffff",
    "Grey": "#6b7280", "Gray": "#6b7280", "Red": "#dc2626", "Green": "#15803d",
    "Yellow": "#ca8a04", "Pink": "#db2777", "Purple": "#7c3aed", "Brown": "#78350f",
    "Beige": "#f5f5dc", "Copper": "#b87333", "Silver": "#9ca3af", "Gold": "#d4af37",
    "Orange": "#ea580c", "Maroon": "#7f1d1d", "Teal": "#008080", "Olive": "#808000",
    "Cyan": "#00ffff", "Magenta": "#ff00ff", "Lime": "#00ff00", "Indigo": "#4b0082",
    "Violet": "#ee82ee", "Turquoise": "#40e0d0", "Tan": "#d2b48c", "Charcoal": "#36454f",
    "Khaki": "#c3b091", "Peach": "#ffdab9", "Cream": "#fffdd0", "Mustard": "#ffdb58"
  };
  return colorMap[color?.trim()] || "#9ca3af";
}

// ---------------------------------------------------------
// Helpers: Variants Generation
// ---------------------------------------------------------
function generateDeterministicVariants(productId: string, masterCategory: string, baseColour: string) {
  const seed = getHash(productId);
  const variants = [];
  let sizes: string[] = [];

  switch (masterCategory) {
    case "Apparel":
      sizes = ["S", "M", "L", "XL"];
      break;
    case "Footwear":
      sizes = ["6", "7", "8", "9", "10"];
      break;
    default:
      // Accessories usually One Size
      const stockOS = Math.floor(deterministicRandom(seed) * 100) + 10;
      return [{
        size: "One Size",
        color: baseColour,
        sku: `${productId}-OS`,
        stock: stockOS,
      }];
  }

  // Generate varied stock for each size
  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    // Offset seed by index to prevent identical stock for all sizes
    const stock = Math.floor(deterministicRandom(seed + i + 1) * 100) + 10;
    variants.push({
      size,
      color: baseColour,
      sku: `${productId}-${size}`,
      stock: stock,
    });
  }
  return variants;
}

// ---------------------------------------------------------
// Main Loader Logic
// ---------------------------------------------------------
async function loadImagesMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!fs.existsSync(IMAGES_CSV)) {
    throw new Error(`Images CSV not found at ${IMAGES_CSV}`);
  }

  console.log("📂 Loading image map...");
  return new Promise((resolve, reject) => {
    fs.createReadStream(IMAGES_CSV)
      .pipe(csv())
      .on("data", (row) => {
        // Adapt to whatever column names are in images.csv
        const filename = row["filename"] || (row["id"] ? `${row["id"]}.jpg` : null);
        const link = row["link"] || row["url"];
        if (filename && link) {
          map.set(filename.trim(), link.trim());
        }
      })
      .on("end", () => {
        console.log(`✅ Loaded ${map.size} image mappings.`);
        resolve(map);
      })
      .on("error", reject);
  });
}

async function processRow(
  row: KaggleRow,
  imageMap: Map<string, string>
): Promise<any | null> {
  const id = row.id?.toString().trim();
  if (!id) return null;

  // 1. Check if we have an image
  const filename = `${id}.jpg`;
  const myntraUrl = imageMap.get(filename);

  if (!myntraUrl) {
    // Skip if no Myntra URL found
    return null;
  }

  // 2. Build Basic Data
  const displayName = row.productDisplayName?.trim() || "Untitled Product";
  const slug = slugify(displayName, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  }) + `-${id}`;

  const normalizedGender = normalizeGender(row.gender);
  const category = (row.articleType || row.masterCategory || "Apparel").trim();
  const masterCategory = (row.masterCategory || "Apparel").trim();
  const subCategory = (row.subCategory || row.articleType).trim();
  const baseColour = row.baseColour?.trim() || "Unknown";

  // 3. Deterministic Values
  const seed = getHash(id);

  // Price between 199 and 1000
  const priceInRupees = Math.floor(199 + deterministicRandom(seed) * 801);

  // Rating between 3.8 and 5.0
  const rating = parseFloat((deterministicRandom(seed + 99) * (5 - 3.8) + 3.8).toFixed(1));

  // Reviews count 0 - 200
  const reviewsCount = Math.floor(deterministicRandom(seed + 999) * 200);

  // Variants & Stock
  const variants = generateDeterministicVariants(id, masterCategory, baseColour);
  const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);

  // Dominant Color
  const normalizedHex = normalizeColor(baseColour);

  // 4. Construct Product Object
  return {
    name: displayName,
    slug: slug,
    brand: "Eyoris Basics",
    category,
    subCategory,
    gender: normalizedGender,
    masterCategory,
    isFashionItem: true,
    description: `A stylish ${baseColour} ${row.articleType} for the ${row.season} season.`,
    price: priceInRupees,
    price_cents: priceInRupees * 100,
    price_before_cents: Math.round(priceInRupees * 1.35) * 100,
    images: [myntraUrl], // Using direct Myntra URL
    variants: variants,
    stock: totalStock,
    dominantColor: {
      name: baseColour,
      hex: normalizedHex,
      rgb: [] // Optional/Empty as per constraints
    },
    aiTags: {
      semanticColor: baseColour.toLowerCase(),
      style_tags: [], // No AI calls allowed
      material_tags: []
    },
    rating,
    reviewsCount,
    isPublished: true,
    views: 0
  };
}

async function run() {
  console.log("--- Starting Deterministic Myntra Seeder ---");
  await connectDB();
  console.log("✅ Connected to MongoDB");

  // SAFETY CHECK: Ensure DB is empty
  const count = await Product.countDocuments();
  if (count > 0) {
    console.warn(`⚠️  WARNING: Products collection is NOT empty (Count: ${count}).`);
    console.warn("   To prevent duplicates or data corruption, this script will EXIT.");
    console.warn("   Run 'db.products.drop()' manually if you really want to re-seed.");
    await mongoose.disconnect();
    process.exit(0);
  }

  // Load Dependencies
  let imageMap: Map<string, string>;
  try {
    imageMap = await loadImagesMap();
  } catch (err) {
    console.error("❌ Failed to load image map:", err);
    process.exit(1);
  }

  if (!fs.existsSync(DATASET_FILE)) {
    console.error(`❌ Dataset file not found at ${DATASET_FILE}`);
    process.exit(1);
  }

  // Stream Processing
  const productBatch: any[] = [];
  let totalProcessed = 0;
  let totalInserted = 0;
  let skippedCount = 0;

  const stream = fs.createReadStream(DATASET_FILE).pipe(csv());

  console.log("🚀 Processing styles.csv...");

  for await (const row of stream) {
    totalProcessed++;
    try {
      const doc = await processRow(row as KaggleRow, imageMap);
      if (doc) {
        productBatch.push(doc);
      } else {
        skippedCount++;
      }
    } catch (e) {
      console.error("Error processing row:", e);
      skippedCount++;
    }

    // Batch Insert
    if (productBatch.length >= BATCH_SIZE) {
      await Product.insertMany(productBatch);
      totalInserted += productBatch.length;
      console.log(`📦 Inserted ${totalInserted} products...`);
      productBatch.length = 0;
    }
  }

  // Final Batch
  if (productBatch.length > 0) {
    await Product.insertMany(productBatch);
    totalInserted += productBatch.length;
  }

  console.log("\n🎉 Seeding Complete!");
  console.log(`-----------------------------------`);
  console.log(`Total Processed : ${totalProcessed}`);
  console.log(`Total Inserted  : ${totalInserted}`);
  console.log(`Total Skipped   : ${skippedCount}`);
  console.log(`-----------------------------------`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("❌ Seeder crashed:", err);
  process.exit(1);
});
