import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config({ path: process.env.DOTENV_PATH || undefined });

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error(
    "Cloudinary credentials missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in your .env"
  );
  // Do not throw here to allow non-cloudinary flows, but uploads will fail until set.
}

cloudinary.config({
  cloud_name: CLOUD_NAME || "",
  api_key: API_KEY || "",
  api_secret: API_SECRET || "",
  secure: true,
});

export default cloudinary;
