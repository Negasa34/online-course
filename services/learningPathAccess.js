const LearningPath = require("../models/learningPath");
const LearningPathProgress = require("../models/learningPathProgress");

async function getLearningPathAccess(path, user) {
  const requiredSlugs = [...new Set(path.prerequisiteSlugs || [])];
  if (!requiredSlugs.length) {
    return { allowed: true, requiresAuthentication: false, requiredSlugs, incompleteSlugs: [] };
  }

  if (!user) {
    return { allowed: false, requiresAuthentication: true, requiredSlugs, incompleteSlugs: requiredSlugs };
  }
  if (user.role !== "STUDENT") {
    return { allowed: false, requiresAuthentication: false, requiredSlugs, incompleteSlugs: requiredSlugs };
  }

  const prerequisites = await LearningPath.find({ slug: { $in: requiredSlugs }, status: "PUBLISHED" })
    .select("_id slug")
    .lean();
  const pathsBySlug = new Map(prerequisites.map((item) => [item.slug, item]));
  const prerequisiteIds = prerequisites.map((item) => item._id);
  const completed = prerequisiteIds.length
    ? await LearningPathProgress.find({
      user: user.id,
      path: { $in: prerequisiteIds },
      completedAt: { $ne: null },
    }).select("path").lean()
    : [];
  const completedIds = new Set(completed.map((item) => String(item.path)));
  const incompleteSlugs = requiredSlugs.filter((slug) => {
    const prerequisite = pathsBySlug.get(slug);
    return !prerequisite || !completedIds.has(String(prerequisite._id));
  });

  return {
    allowed: incompleteSlugs.length === 0,
    requiresAuthentication: false,
    requiredSlugs,
    incompleteSlugs,
  };
}

module.exports = { getLearningPathAccess };