import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const uploadOnCloudinary = async (loacalFilePath) => {
    try {
        if(!loacalFilePath){
            return null
        }
        const res = await cloudinary.uploader.upload(loacalFilePath,{
            resource_type:"auto"
        })
        console.log('File uploaded on Cloudinary.',res.url);
        return res
        
    } catch (loacalFilePath) {
        fs.unlinkSync(loacalFilePath) //remove the locally saved temp file as the upload operation failed.
        return null;
    }
}

export {uploadOnCloudinary}