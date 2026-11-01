const mongoose = require("mongoose");

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
      validate: { validator: isHttpsUrl, message: "Resource URLs must use HTTPS" },
    },
  },
  { _id: false }
);

const videoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    format: { type: String, required: true },
    bytes: { type: Number, required: true, min: 0 },
    duration: { type: Number, default: 0, min: 0 },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 3000, default: "" },
    order: { type: Number, required: true, min: 0 },
    duration: { type: Number, default: 0, min: 0, max: 10000 },
    isPreview: { type: Boolean, default: false },
    video: { type: videoSchema, default: null },
    resources: { type: [resourceSchema], default: [] },
  },
  { timestamps: true }
);

const courseSectionSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    order: { type: Number, required: true, min: 0 },
    lessons: { type: [lessonSchema], default: [] },
  },
  { timestamps: true }
);

courseSectionSchema.index({ course: 1, order: 1 });

module.exports = mongoose.model("CourseSection", courseSectionSchema);
