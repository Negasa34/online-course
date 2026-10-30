
const express = require("express");
const { register, login } = require("../controllers/authControllers");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

// Route kun token sirrii gaafata
router.get("/me", authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
});

module.exports = router;
