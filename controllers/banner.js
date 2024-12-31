const Banner = require('../models/banner');
const { cloudinary } = require('../config/cloudinary');

exports.createBanner = async (req, res) => {
  try {
    if (!req.files || !req.files.length) {
      return res.status(400).json({ message: 'Banner images are required' });
    }

    const bannerUrls = await Promise.all(
      req.files.map(file => 
        cloudinary.uploader.upload(file.path, {
          folder: 'banners',
          transformation: { width: 1200, height: 400, crop: 'fill' }
        })
      )
    );

    const banner = await Banner.create({
      bannerImage: bannerUrls.map(url => url.secure_url)
    });

    res.status(201).json(banner);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true });
    res.status(200).json(banners);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    let bannerUrls = [...banner.bannerImage];

    if (req.files && req.files.length) {
      const newUrls = await Promise.all(
        req.files.map(file =>
          cloudinary.uploader.upload(file.path, {
            folder: 'banners',
            transformation: { width: 1200, height: 400, crop: 'fill' }
          })
        )
      );
      bannerUrls = [...bannerUrls, ...newUrls.map(url => url.secure_url)];
    }

    const updatedBanner = await Banner.findByIdAndUpdate(
      req.params.id,
      { 
        bannerImage: bannerUrls,
        isActive: req.body.isActive !== undefined ? req.body.isActive : banner.isActive
      },
      { new: true }
    );

    res.status(200).json(updatedBanner);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    // Optionally delete images from Cloudinary
    // await Promise.all(banner.bannerImage.map(url => cloudinary.uploader.destroy(url)));

    await Banner.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = exports;