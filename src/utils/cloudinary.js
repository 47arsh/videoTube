import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

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

const deleteFromCloudinary = async(publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("deleted from cloudinary. publicId : ",publicId);
  } catch (error) {
    console.log("error deleting from cloudinary ", error);
    return null;
  }
}

export {
  uploadOnCloudinary,
  deleteFromCloudinary
}
