import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config({ path: process.env.DOTENV_PATH || undefined });

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  // Credentials missing: uploads will fail, but we suppress the warning message.
}

cloudinary.config({
  cloud_name: CLOUD_NAME || "",
  api_key: API_KEY || "",
  api_secret: API_SECRET || "",
  secure: true,
});

export default cloudinary;
