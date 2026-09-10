import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

const uploadOnCloudinary = async (localFilePath, resourceType = "image") => {
  try {
    if (!localFilePath) return null;

    configureCloudinary();

    const response = await cloudinary.uploader.upload(
      localFilePath.replace(/\\/g, "/"), // windows-safe path
      {
        resource_type: resourceType,
      }
    );

    fs.unlinkSync(localFilePath); // cleanup temp file
    return response;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
};

const deleteFromCloudinary = async(publicId, resourceType = "image") => {
  try {
    if (!publicId) return null;
    configureCloudinary();
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.log("error deleting from cloudinary", error);
    return null;
  }
}

export {
  uploadOnCloudinary,
  deleteFromCloudinary
}
