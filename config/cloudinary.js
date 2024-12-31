const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadImage = async (file) => {
  if (!file) {
    throw new Error('No file provided');
  }

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'predictions',
      transformation: { width: 800, height: 400, crop: 'fill' }
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Image upload failed');
  }
};

module.exports = {
  cloudinary,
  uploadImage
};