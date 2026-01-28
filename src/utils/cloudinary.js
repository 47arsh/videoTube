import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

export const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // 🔥 CONFIGURE HERE (this fixes the bug)
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const response = await cloudinary.uploader.upload(
      localFilePath.replace(/\\/g, "/"), // windows-safe path
      {
        resource_type: "image",
      }
    );

    fs.unlinkSync(localFilePath); // cleanup temp file
    return response;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
};
