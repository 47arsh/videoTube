import {v2 as cloudinary} from 'cloudinary';
import fs from "fs"

//configure cloudinary

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async function(localFilePath){
    try {
        if(!localFilePath) return null;
        //uploading an image on cloudinary : 
        const response = await cloudinary.uploader.upload(
            localFilePath,
            {
                resource_type : "auto"
            }
        )
        console.log("file uploaded on cloudinary server. File src: "+ response.url);

        //once file uploaded on cloudinary, delete from our server/storage
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    }
}

export {uploadOnCloudinary};