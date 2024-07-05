import { v2 as cloudinary } from "cloudinary";
import { log } from "console";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View Credentials' below to copy your API secret
});

// Upload an image
const uploadonCloudinary = async (localFlePath) => {
  try {
    if (!localFlePath) {
      return null;
    }
    const response = await cloudinary.uploader.upload(localFlePath, {
      resource_type: "auto",
    });
    console.log("file is uploaded on cloudinary:" + response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(localFlePath); //if file is not upload in the cloudinary we need to remove it from local device because it can contain malisious elemens
    return null;
  }
};

export {uploadonCloudinary};