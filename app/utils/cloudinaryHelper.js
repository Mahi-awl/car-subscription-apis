import cloudinary from '../config/cloudinaryConfig.js';

/**
 * Uploads a file buffer to Cloudinary and converts it to WebP
 * @param {Buffer} buffer - The file buffer from Multer
 * @param {String} folderName - The Cloudinary folder to save the image in
 * @returns {Promise<Object>} - The Cloudinary upload result
 */
export const uploadFileToCloudinary = (buffer, folderName = 'general') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folderName,
        format: 'webp',
        quality: 80
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    uploadStream.end(buffer);
  });
};

/**
 * Deletes a file from Cloudinary using its secure URL
 * @param {String} fileUrl - The full Cloudinary secure URL
 */
export const deleteFileFromCloudinary = async (fileUrl) => {
  try {
    if (!fileUrl) return;

    // Extracting public_id from the URL
    // Example URL: https://res.cloudinary.com/demo/image/upload/v1234/folder/filename.webp
    const urlParts = fileUrl.split('/upload/');
    if (urlParts.length === 2) {
      let pathString = urlParts[1];
      
      
      if (pathString.match(/^v\d+\//)) {
        pathString = pathString.replace(/^v\d+\//, '');
      }
      
    
      const publicId = pathString.substring(0, pathString.lastIndexOf('.'));

  
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
  }
};