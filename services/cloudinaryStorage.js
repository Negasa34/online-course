const cloudinary = require("cloudinary").v2;

function configureCloudinary() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    const error = new Error("Video storage is not configured");
    error.status = 503;
    throw error;
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

async function uploadVideo(filePath) {
  const client = configureCloudinary();
  const result = await client.uploader.upload(filePath, {
    resource_type: "video",
    type: "authenticated",
    folder: process.env.CLOUDINARY_FOLDER || "learnhub/course-videos",
    use_filename: false,
    unique_filename: true,
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    bytes: result.bytes,
    duration: result.duration || 0,
    uploadedAt: new Date(),
  };
}

function getVideoDeliveryUrl(video) {
  const client = configureCloudinary();
  return client.url(video.publicId, {
    resource_type: "video",
    type: "authenticated",
    format: video.format,
    secure: true,
    sign_url: true,
  });
}

async function deleteVideo(publicId) {
  const client = configureCloudinary();
  const result = await client.uploader.destroy(publicId, {
    resource_type: "video",
    type: "authenticated",
  });
  if (!["ok", "not found"].includes(result.result)) {
    throw new Error("Cloudinary did not confirm video deletion");
  }
}

module.exports = { deleteVideo, getVideoDeliveryUrl, uploadVideo };
