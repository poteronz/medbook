const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { generateTokens, authRequired, setRefreshCookie } = require("../middleware/auth");
const { registerRules, loginRules, handleValidation } = require("../middleware/validate");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post("/register", registerRules, handleValidation, asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  const existing = await db.getAsync("SELECT id FROM users WHERE email = ?", [email]);
  if (existing) {
    return res.status(409).json({ error: "Пользователь с таким email уже существует" });
  }

  const hash = await bcrypt.hash(password, 10);
  const result = await db.runAsync(
    "INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)",
    [name, email, hash, phone || null]
  );

  const { accessToken, refreshToken } = generateTokens(result.lastID);
  setRefreshCookie(res, refreshToken);
  res.status(201).json({ accessToken, user: { id: result.lastID, name, email, phone } });
}));

router.post("/login", loginRules, handleValidation, asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await db.getAsync("SELECT * FROM users WHERE email = ?", [email]);
  if (!user) {
    return res.status(401).json({ error: "Неверный email или пароль" });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: "Неверный email или пароль" });
  }

  const { accessToken, refreshToken } = generateTokens(user.id);
  setRefreshCookie(res, refreshToken);
  res.json({ accessToken, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
}));

router.post("/refresh", asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    return res.status(401).json({ error: "Refresh token отсутствует" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await db.getAsync("SELECT id, name, email, phone FROM users WHERE id = ?", [decoded.id]);
    if (!user) {
      return res.status(401).json({ error: "Пользователь не найден" });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    setRefreshCookie(res, refreshToken);
    res.json({ accessToken, user });
  } catch {
    res.status(401).json({ error: "Недействительный refresh token" });
  }
}));

router.post("/logout", (req, res) => {
  res.clearCookie("refreshToken", { path: "/api/auth" });
  res.json({ message: "Выход выполнен" });
});

router.get("/me", authRequired, asyncHandler(async (req, res) => {
  const user = await db.getAsync(
    "SELECT id, name, email, phone, created_at FROM users WHERE id = ?",
    [req.userId]
  );
  if (!user) {
    return res.status(404).json({ error: "Пользователь не найден" });
  }

  res.json({ user });
}));

module.exports = router;
