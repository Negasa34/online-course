const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const mongoose = require("mongoose");

const Course = require("./models/courses");
const User = require("./models/user");

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Connected to MongoDB Atlas");

    const instructor = await User.findOne({
      role: "INSTRUCTOR",
      instructorApprovedAt: { $ne: null },
      $or: [{ accountStatus: "ACTIVE" }, { accountStatus: { $exists: false } }],
    });
    if (!instructor) {
      throw new Error("No approved active instructor exists; complete instructor approval before seeding courses.");
    }

    const courses = [
      {
        title: "HTML and CSS for Beginners",
        slug: "html-css-basics",
        description: "Learn the foundations of web development.",
        price: 0,
        published: true,
        instructor: instructor._id,
      },
      {
        title: "JavaScript Fundamentals",
        slug: "javascript-fundamentals",
        description: "Learn JavaScript step by step.",
        price: 15,
        published: true,
        instructor: instructor._id,
      },
    ];

    for (const courseData of courses) {
      await Course.findOneAndUpdate(
        { slug: courseData.slug },
        { $setOnInsert: courseData },
        {
          upsert: true,
          returnDocument: "after",
          setDefaultsOnInsert: true,
        }
      );
    }

    console.log("Seed completed successfully!");
    console.log("Instructor:", instructor.email);
    console.log("Courses:", await Course.countDocuments());
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();