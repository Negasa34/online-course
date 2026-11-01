const crypto = require("node:crypto");
const os = require("node:os");
const path = require("node:path");
const multer = require("multer");

const allowedTypes = new Map([
  [".mp4", ["video/mp4"]],
  [".mov", ["video/quicktime", "video/mp4"]],
  [".webm", ["video/webm"]],
]);

const storage = multer.diskStorage({
  destination: os.tmpdir(),
  filename: (req, file, callback) => {
    callback(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const uploadVideoFile = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedTypes.get(extension)?.includes(file.mimetype)) {
      const error = new Error("Upload an MP4, MOV, or WebM video");
      error.status = 400;
      callback(error);
      return;
    }
    callback(null, true);
  },
});

function handleVideoUploadError(error, req, res, next) {
  if (error instanceof multer.MulterError) {
    const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return res.status(status).json({
      success: false,
      message: status === 413 ? "Video must be 500 MB or smaller" : "Invalid video upload",
    });
  }
  if (error.status === 400) {
    return res.status(400).json({ success: false, message: error.message });
  }
  return next(error);
}

module.exports = { handleVideoUploadError, uploadVideoFile };
