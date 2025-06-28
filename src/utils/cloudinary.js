import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath){
            return null
        }
        const res = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        fs.unlinkSync(localFilePath)
        return res
        
    } catch (localFilePath) {
        fs.unlinkSync(localFilePath) //remove the locally saved temp file as the upload operation failed.
        return null;
    }
}

export {uploadOnCloudinary}