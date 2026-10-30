require("dotenv").config();

const mongoose = require("mongoose");
const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const User = require("./models/user");

async function bootstrapAdmin() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Usage: npm run bootstrap-admin -- existing-user@example.com");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  if (await User.countDocuments({ role: "ADMIN", accountStatus: { $ne: "DEACTIVATED" } })) {
    throw new Error("An active administrator already exists; use the protected admin workflow.");
  }
  const user = await User.findOne({ email });
  if (!user) throw new Error("Register the account first, then run this command.");
  if (user.accountStatus === "DEACTIVATED") throw new Error("Reactivate the account before administrator setup.");

  const terminal = readline.createInterface({ input: stdin, output: stdout });
  try {
    const confirmation = await terminal.question(`Type ADMIN ${email} to grant or restore administrator access: `);
    if (confirmation !== `ADMIN ${email}`) throw new Error("Confirmation did not match; no changes made.");
    user.role = "ADMIN";
    user.accountStatus = "ACTIVE";
    user.accountStatusChangedAt = new Date();
    user.accountStatusChangedBy = null;
    await user.save();
    console.log(`Administrator role granted to ${email}.`);
  } finally {
    terminal.close();
  }
}

bootstrapAdmin()
  .catch((error) => {
    console.error("Admin bootstrap failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState) await mongoose.disconnect();
  });
