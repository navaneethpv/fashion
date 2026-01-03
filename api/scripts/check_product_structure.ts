
import dotenv from "dotenv";
import { connectDB } from "../src/config/db";
import { Product } from "../src/models/Product";

dotenv.config();

async function run() {
    await connectDB();

    // Find a few examples of Earrings
    const earrings = await Product.find({ category: 'Earrings' }).limit(3).lean();
    console.log("--- Earrings Samples ---");
    earrings.forEach(p => {
        console.log(`Name: ${p.name}`);
        console.log(`MasterCategory: ${p.masterCategory}`);
        console.log(`SubCategory: ${p.subCategory}`); // The middle layer
        console.log(`Category (ArticleType): ${p.category}`);
        console.log("-----------------------");
    });

    // Check what "Accessories" is
    const accessories = await Product.find({ masterCategory: 'Accessories' }).limit(3).lean();
    console.log("\n--- Accessories (Master) Samples ---");
    accessories.forEach(p => {
        console.log(`Category: ${p.category}, SubCategory: ${p.subCategory}`);
    });

    process.exit(0);
}

run().catch(console.error);
